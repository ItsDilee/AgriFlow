import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import { apiGet, apiPatch } from '../../services/api';
import '../PageStyles.css';

const statusBadgeMap = {
  scheduled: { status: 'pending', label: 'Scheduled' },
  arrived: { status: 'processing', label: 'Arrived' },
  completed: { status: 'completed', label: 'Completed' },
  cancelled: { status: 'cancelled', label: 'Cancelled' },
  'no-show': { status: 'cancelled', label: 'No Show' },
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const FarmerAppointments = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Cancel modal state
  const [cancelId, setCancelId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Reschedule modal state
  const [rescheduleId, setRescheduleId] = useState(null);
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [newSlot, setNewSlot] = useState('');
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');

  const fetchAppointments = useCallback(() => {
    setLoading(true);
    setError(null);
    apiGet('/appointments/my', { auth: true })
      .then((data) => setAppointments(data.appointments || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Show success message on redirect from booking page
  useEffect(() => {
    if (searchParams.get('success') === '1') {
      setSuccessMsg('Appointment booked successfully! Your token has been generated.');
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 5000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // Fetch slots when reschedule date changes
  useEffect(() => {
    if (rescheduleId && newDate) {
      setLoadingSlots(true);
      setNewSlot('');
      const centreId = rescheduleAppt?.centre?._id;
      apiGet(`/appointments/slots?centreId=${centreId}&date=${newDate}`, { auth: true })
        .then((data) => setSlots(data.slots || []))
        .catch(() => setSlots([]))
        .finally(() => setLoadingSlots(false));
    }
  }, [rescheduleId, newDate, rescheduleAppt]);

  const handleCancelOpen = (id) => {
    setCancelId(id);
    setCancelReason('');
  };

  const handleCancelClose = () => {
    setCancelId(null);
    setCancelReason('');
  };

  const handleConfirmCancel = async () => {
    setCancelling(true);
    try {
      await apiPatch(`/appointments/${cancelId}/cancel`, { cancelReason }, { auth: true });
      setAppointments((prev) =>
        prev.map((a) => (a._id === cancelId ? { ...a, status: 'cancelled', cancelReason } : a))
      );
      handleCancelClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const handleRescheduleOpen = (appt) => {
    setRescheduleId(appt._id);
    setRescheduleAppt(appt);
    setNewDate('');
    setSlots([]);
    setNewSlot('');
    setRescheduleError('');
  };

  const handleRescheduleClose = () => {
    setRescheduleId(null);
    setRescheduleAppt(null);
    setNewDate('');
    setSlots([]);
    setNewSlot('');
    setRescheduleError('');
  };

  const handleConfirmReschedule = async () => {
    if (!newDate || !newSlot) {
      setRescheduleError('Please pick a date and time slot.');
      return;
    }
    setRescheduling(true);
    setRescheduleError('');
    try {
      const res = await apiPatch(
        `/appointments/${rescheduleId}/reschedule`,
        { newDate, newTimeSlot: newSlot },
        { auth: true }
      );
      setAppointments((prev) =>
        prev.map((a) => (a._id === rescheduleId ? { ...a, ...res.appointment } : a))
      );
      setSuccessMsg('Appointment rescheduled successfully!');
      handleRescheduleClose();
    } catch (err) {
      setRescheduleError(err.message);
    } finally {
      setRescheduling(false);
    }
  };

  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  };

  const upcoming = appointments.filter((a) => a.status === 'scheduled');
  const past = appointments.filter((a) => a.status !== 'scheduled');

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My Appointments</h1>
        <p className="page-subtitle">View, manage, and reschedule your procurement appointments</p>
      </div>

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          ✓ {successMsg}
        </div>
      )}

      <div className="section-header">
        <div />
        <Link to="/farmer/appointments/book">
          <Button variant="primary">+ Book New Appointment</Button>
        </Link>
      </div>

      {loading && <Spinner message="Loading appointments…" />}
      {!loading && error && (
        <ErrorState title="Could not load appointments" message={error} onRetry={fetchAppointments} />
      )}

      {!loading && !error && (
        <>
          {/* Upcoming */}
          <Card style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>Upcoming Appointments ({upcoming.length})</h3>

            {upcoming.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <p className="empty-state-title">No upcoming appointments</p>
                <p>
                  <Link to="/farmer/appointments/book">Book your first appointment</Link> to get started.
                </p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Centre</th>
                      <th>Date</th>
                      <th>Time Slot</th>
                      <th>Commodity</th>
                      <th>Qty (kg)</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.map((a) => {
                      const badge = statusBadgeMap[a.status] || { status: 'default', label: a.status };
                      return (
                        <tr key={a._id}>
                          <td>
                            <code style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                              {a.tokenNumber || '—'}
                            </code>
                          </td>
                          <td>
                            <div>{a.centre?.name}</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                              {a.centre?.location?.district}
                            </div>
                          </td>
                          <td>{formatDate(a.scheduledDate)}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{a.timeSlot}</td>
                          <td>{a.commodity}</td>
                          <td>{a.estimatedQuantity}</td>
                          <td>
                            <StatusBadge status={badge.status} label={badge.label} />
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <Button size="sm" variant="outline" onClick={() => handleRescheduleOpen(a)}>
                                Reschedule
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => handleCancelOpen(a._id)}>
                                Cancel
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Past */}
          <Card>
            <h3 style={{ marginBottom: '1.25rem' }}>Past Appointments ({past.length})</h3>

            {past.length === 0 ? (
              <div className="empty-state">
                <p style={{ color: 'var(--color-text-muted)' }}>No past appointments found.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Centre</th>
                      <th>Date</th>
                      <th>Slot</th>
                      <th>Commodity</th>
                      <th>Qty (kg)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {past.map((a) => {
                      const badge = statusBadgeMap[a.status] || { status: 'default', label: a.status };
                      return (
                        <tr key={a._id}>
                          <td>
                            <code style={{ color: 'var(--color-text-muted)' }}>
                              {a.tokenNumber || '—'}
                            </code>
                          </td>
                          <td>
                            <div>{a.centre?.name}</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                              {a.centre?.location?.district}
                            </div>
                          </td>
                          <td>{formatDate(a.scheduledDate)}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{a.timeSlot}</td>
                          <td>{a.commodity}</td>
                          <td>{a.estimatedQuantity}</td>
                          <td>
                            <StatusBadge status={badge.status} label={badge.label} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Cancel modal */}
      {cancelId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
        }}>
          <Card style={{ maxWidth: 420, width: '90%' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>Cancel Appointment</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              Are you sure you want to cancel this appointment? This will release the slot for others.
            </p>
            <div className="form-group">
              <label className="form-label" htmlFor="cancelReason">Reason (optional)</label>
              <input
                id="cancelReason"
                className="form-input"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Crop not ready"
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button variant="ghost" onClick={handleCancelClose} disabled={cancelling}>Keep Appointment</Button>
              <Button variant="danger" isLoading={cancelling} onClick={handleConfirmCancel}>Confirm Cancel</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reschedule modal */}
      {rescheduleId && rescheduleAppt && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
        }}>
          <Card style={{ maxWidth: 520, width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '0.25rem' }}>Reschedule Appointment</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem', fontSize: 'var(--font-size-sm)' }}>
              Current: {formatDate(rescheduleAppt.scheduledDate)} · {rescheduleAppt.timeSlot} · {rescheduleAppt.centre?.name}
            </p>

            {rescheduleError && (
              <div className="alert alert-error">{rescheduleError}</div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="newDate">New Date</label>
              <input
                id="newDate"
                type="date"
                className="form-input"
                min={getMinDate()}
                max={getMaxDate()}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>

            {newDate && (
              <div className="form-group">
                <label className="form-label">Select New Time Slot</label>
                {loadingSlots ? (
                  <Spinner message="Loading slots…" />
                ) : slots.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                    No slots available for this date.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.6rem', marginTop: '0.5rem' }}>
                    {slots.map((s) => (
                      <button
                        key={s.timeSlot}
                        type="button"
                        disabled={!s.isAvailable}
                        onClick={() => setNewSlot(s.timeSlot)}
                        style={{
                          padding: '0.65rem 0.4rem',
                          border: `1px solid ${newSlot === s.timeSlot ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          borderRadius: 'var(--radius-md)',
                          background: newSlot === s.timeSlot ? 'var(--color-primary-light)' : s.isAvailable ? 'var(--color-bg)' : 'var(--color-surface)',
                          cursor: s.isAvailable ? 'pointer' : 'not-allowed',
                          textAlign: 'center',
                          opacity: s.isAvailable ? 1 : 0.5
                        }}
                      >
                        <strong style={{ display: 'block', fontSize: 'var(--font-size-xs)' }}>{s.timeSlot}</strong>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                          {s.remainingCapacity} left
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <Button variant="ghost" onClick={handleRescheduleClose} disabled={rescheduling}>Cancel</Button>
              <Button variant="primary" isLoading={rescheduling} disabled={!newSlot} onClick={handleConfirmReschedule}>
                Confirm Reschedule
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FarmerAppointments;
