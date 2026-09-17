import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Form from '../../components/Form';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import { apiGet, apiPost } from '../../services/api';
import '../PageStyles.css';

const FarmerBookAppointment = () => {
  const navigate = useNavigate();

  // Step 1: Select Centre & Commodity & Date //
  const [centres, setCentres] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState(null);

  const [selectedCentre, setSelectedCentre] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [estimatedQuantity, setEstimatedQuantity] = useState('');

  // Step 2: Available Slots //
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('');

  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  useEffect(() => {
    // Only fetch active centres
    apiGet('/centres', { auth: true })
      .then((data) => {
        setCentres(data.centres || []);
        setLoadingConfig(false);
      })
      .catch((err) => {
        setConfigError(err.message);
        setLoadingConfig(false);
      });
  }, []);

  // Set minimum date to tomorrow
  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // Allow booking up to 14 days in advance
    return d.toISOString().split('T')[0];
  };

  // When step 1 criteria changes that affects slots, refetch slots
  useEffect(() => {
    if (selectedCentre && selectedDate) {
      setLoadingSlots(true);
      setSlotsError(null);
      setSelectedSlot('');

      apiGet(`/appointments/slots?centreId=${selectedCentre}&date=${selectedDate}`, { auth: true })
        .then((data) => setSlots(data.slots || []))
        .catch((err) => setSlotsError(err.message))
        .finally(() => setLoadingSlots(false));
    } else {
      setSlots([]);
      setSelectedSlot('');
    }
  }, [selectedCentre, selectedDate]);

  const activeCentreObj = centres.find((c) => c._id === selectedCentre);

  // If centre changes, reset commodity if it's no longer valid
  useEffect(() => {
    if (activeCentreObj) {
      if (!activeCentreObj.activeCommodities.includes(selectedCommodity)) {
        setSelectedCommodity('');
      }
    }
  }, [selectedCentre, activeCentreObj, selectedCommodity]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedCentre || !selectedDate || !selectedSlot || !selectedCommodity || !estimatedQuantity) {
      setBookingError('Please fill in all fields before booking.');
      return;
    }
    setBooking(true);
    setBookingError(null);

    try {
      const payload = {
        centreId: selectedCentre,
        date: selectedDate,
        timeSlot: selectedSlot,
        commodity: selectedCommodity,
        estimatedQuantity: Number(estimatedQuantity)
      };

      await apiPost('/appointments', payload, { auth: true });
      navigate('/farmer/appointments?success=1');
    } catch (err) {
      setBookingError(err.message);
      setBooking(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className="page-container">
        <Spinner message="Loading centres..." />
      </div>
    );
  }

  if (configError) {
    return (
      <div className="page-container">
        <ErrorState title="Error" message={configError} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Book Appointment</h1>
        <p className="page-subtitle">Select a procurement centre, date, and an available time slot.</p>
      </div>

      <div className="section-header">
        <Button variant="ghost" onClick={() => navigate('/farmer/appointments')}>
          &larr; Back to My Appointments
        </Button>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'flex-start' }}>
        <Card>
          <h3 style={{ marginBottom: '1.25rem' }}>1. Appointment Details</h3>

          <div className="form-group">
            <label className="form-label" htmlFor="centre">Procurement Centre *</label>
            <select
              id="centre"
              className="form-input"
              value={selectedCentre}
              onChange={(e) => setSelectedCentre(e.target.value)}
              required
            >
              <option value="">-- Select a centre --</option>
              {centres.map((c) => (
                <option key={c._id} value={c._id}>{c.name} ({c.location?.district})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="commodity">Commodity *</label>
            <select
              id="commodity"
              className="form-input"
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              disabled={!selectedCentre}
              required
            >
              <option value="">-- Select a commodity --</option>
              {activeCentreObj && activeCentreObj.activeCommodities.map((comm) => (
                 <option key={comm} value={comm}>{comm}</option>
              ))}
            </select>
            {!selectedCentre && <small style={{color:'var(--color-text-muted)'}}>Select a centre first</small>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="estimatedQuantity">Estimated Quantity (kg) *</label>
            <input
              id="estimatedQuantity"
              type="number"
              min="1"
              className="form-input"
              value={estimatedQuantity}
              onChange={(e) => setEstimatedQuantity(e.target.value)}
              placeholder="e.g., 500"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="date">Scheduled Date *</label>
            <input
              id="date"
              type="date"
              className="form-input"
              min={getMinDate()}
              max={getMaxDate()}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
            />
          </div>
        </Card>

        <Card>
          <h3 style={{ marginBottom: '1.25rem' }}>2. Available Time Slots</h3>

          {!selectedCentre || !selectedDate ? (
            <div className="empty-state">
              <p>Select a centre and date to view time slots.</p>
            </div>
          ) : loadingSlots ? (
            <Spinner message="Checking capabilities..." />
          ) : slotsError ? (
            <ErrorState title="Oops" message={slotsError} />
          ) : slots.length === 0 ? (
            <div className="empty-state">
              <p>No slots available for this date.</p>
            </div>
          ) : (
            <div className="slots-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
              {slots.map((s) => (
                <button
                  key={s.timeSlot}
                  type="button"
                  disabled={!s.isAvailable}
                  onClick={() => setSelectedSlot(s.timeSlot)}
                  style={{
                    padding: '0.75rem 0.5rem',
                    border: `1px solid ${selectedSlot === s.timeSlot ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    background: selectedSlot === s.timeSlot
                      ? 'var(--color-primary-light)'
                      : s.isAvailable
                        ? 'var(--color-bg)'
                        : 'var(--color-surface)',
                    cursor: s.isAvailable ? 'pointer' : 'not-allowed',
                    textAlign: 'center',
                    opacity: s.isAvailable ? 1 : 0.5
                  }}
                >
                  <strong style={{ display: 'block', fontSize: 'var(--font-size-sm)' }}>
                    {s.timeSlot}
                  </strong>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    {s.remainingCapacity} {s.remainingCapacity === 1 ? 'slot' : 'slots'} left
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div style={{ marginTop: '2rem' }}>
        {bookingError && <div className="alert alert-error" style={{ marginBottom: '1rem', maxWidth: '100%' }}>{bookingError}</div>}
        <Button
          variant="primary"
          size="lg"
          isLoading={booking}
          disabled={!selectedSlot || !selectedCommodity || !estimatedQuantity}
          onClick={handleBook}
          style={{ width: '100%', maxWidth: '1280px' }}
        >
          Confirm Final Booking
        </Button>
      </div>
    </div>
  );
};

export default FarmerBookAppointment;