import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import Form from '../../components/Form';
import { apiGet, apiPost, apiPut, apiPatch } from '../../services/api';
import '../PageStyles.css';

const EMPTY_FORM = {
  name: '',
  address: '',
  district: '',
  state: '',
  activeCommodities: '',
  phone: '',
  email: '',
  open: '08:00',
  close: '17:00',
  numberOfCounters: 2,
  slotDurationMinutes: 30,
  slotCapacity: 5,
  capacityPerDay: 50,
};

const AdminCentres = () => {
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  const fetchCentres = useCallback(() => {
    setLoading(true);
    setError(null);
    apiGet('/centres', { auth: true })
      .then((data) => setCentres(data.centres || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCentres(); }, [fetchCentres]);

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (c) => {
    setEditingId(c._id);
    setFormData({
      name: c.name || '',
      address: c.location?.address || '',
      district: c.location?.district || '',
      state: c.location?.state || '',
      activeCommodities: (c.activeCommodities || []).join(', '),
      phone: c.contactInfo?.phone || '',
      email: c.contactInfo?.email || '',
      open: c.operatingHours?.open || '08:00',
      close: c.operatingHours?.close || '17:00',
      numberOfCounters: c.numberOfCounters ?? 2,
      slotDurationMinutes: c.slotDurationMinutes ?? 30,
      slotCapacity: c.slotCapacity ?? 5,
      capacityPerDay: c.capacityPerDay ?? 50,
    });
    setFormError('');
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSaving(true);

    const payload = {
      name: formData.name,
      location: {
        address: formData.address,
        district: formData.district,
        state: formData.state,
      },
      activeCommodities: formData.activeCommodities,
      contactInfo: { phone: formData.phone, email: formData.email },
      operatingHours: { open: formData.open, close: formData.close },
      numberOfCounters: Number(formData.numberOfCounters),
      slotDurationMinutes: Number(formData.slotDurationMinutes),
      slotCapacity: Number(formData.slotCapacity),
      capacityPerDay: Number(formData.capacityPerDay),
    };

    try {
      if (editingId) {
        const res = await apiPut(`/centres/${editingId}`, payload, { auth: true });
        setCentres((prev) => prev.map((c) => (c._id === editingId ? res.centre : c)));
      } else {
        const res = await apiPost('/centres', payload, { auth: true });
        setCentres((prev) => [res.centre, ...prev]);
      }
      cancelForm();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSaving(false);
    }
  };

  const handleToggleActive = async (centreId) => {
    setTogglingId(centreId);
    try {
      const res = await apiPatch(`/centres/${centreId}/toggle-active`, {}, { auth: true });
      setCentres((prev) =>
        prev.map((c) => (c._id === centreId ? res.centre : c))
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  // Derived: calculate daily slot capacity from config
  const dailyCapacity = (c) => {
    const open = c.operatingHours?.open || '08:00';
    const close = c.operatingHours?.close || '17:00';
    const [oh, om] = open.split(':').map(Number);
    const [ch, cm] = close.split(':').map(Number);
    const totalMin = (ch * 60 + cm) - (oh * 60 + om);
    if (totalMin <= 0) return '—';
    const slots = Math.floor(totalMin / (c.slotDurationMinutes || 30)) * (c.numberOfCounters || 1);
    return slots * (c.slotCapacity || 1);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Procurement Centres</h1>
        <p className="page-subtitle">Create, configure, and manage procurement centres</p>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <Card style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>
            {editingId ? 'Edit Centre' : 'Add New Centre'}
          </h3>

          {formError && <div className="alert alert-error">{formError}</div>}

          <Form onSubmit={handleFormSubmit}>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="name">Centre Name *</label>
                <input id="name" name="name" className="form-input" required
                  value={formData.name} onChange={handleFormChange}
                  placeholder="e.g. Mandya Procurement Centre" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="address">Address *</label>
                <input id="address" name="address" className="form-input" required
                  value={formData.address} onChange={handleFormChange}
                  placeholder="Street / village" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="district">District *</label>
                <input id="district" name="district" className="form-input" required
                  value={formData.district} onChange={handleFormChange}
                  placeholder="e.g. Mandya" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="state">State *</label>
                <input id="state" name="state" className="form-input" required
                  value={formData.state} onChange={handleFormChange}
                  placeholder="e.g. Karnataka" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="activeCommodities">Commodities</label>
                <input id="activeCommodities" name="activeCommodities" className="form-input"
                  value={formData.activeCommodities} onChange={handleFormChange}
                  placeholder="Rice, Wheat, Maize (comma separated)" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone</label>
                <input id="phone" name="phone" type="tel" className="form-input"
                  value={formData.phone} onChange={handleFormChange}
                  placeholder="+91 XXXXX XXXXX" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input id="email" name="email" type="email" className="form-input"
                  value={formData.email} onChange={handleFormChange}
                  placeholder="centre@example.com" />
              </div>
            </div>

            <h4 style={{ margin: '1rem 0 0.75rem', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Capacity Configuration
            </h4>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="open">Opening Time</label>
                <input id="open" name="open" type="time" className="form-input"
                  value={formData.open} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="close">Closing Time</label>
                <input id="close" name="close" type="time" className="form-input"
                  value={formData.close} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="numberOfCounters">
                  Number of Counters
                </label>
                <input id="numberOfCounters" name="numberOfCounters" type="number" min="1"
                  className="form-input" value={formData.numberOfCounters} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="slotDurationMinutes">
                  Slot Duration (minutes)
                </label>
                <input id="slotDurationMinutes" name="slotDurationMinutes" type="number" min="5"
                  className="form-input" value={formData.slotDurationMinutes} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="slotCapacity">
                  Farmers per Slot
                </label>
                <input id="slotCapacity" name="slotCapacity" type="number" min="1"
                  className="form-input" value={formData.slotCapacity} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="capacityPerDay">
                  Max Capacity / Day
                </label>
                <input id="capacityPerDay" name="capacityPerDay" type="number" min="1"
                  className="form-input" value={formData.capacityPerDay} onChange={handleFormChange} />
              </div>
            </div>

            <div className="agri-form-actions">
              <Button variant="ghost" type="button" onClick={cancelForm}>Cancel</Button>
              <Button variant="primary" type="submit" isLoading={formSaving}>
                {editingId ? 'Save Changes' : 'Create Centre'}
              </Button>
            </div>
          </Form>
        </Card>
      )}

      {/* Centres table */}
      <Card>
        <div className="section-header">
          <h3>All Centres ({loading ? '…' : centres.length})</h3>
          {!showForm && (
            <Button variant="primary" size="sm" onClick={openCreateForm}>
              + Add Centre
            </Button>
          )}
        </div>

        {loading && <Spinner message="Loading centres…" />}

        {!loading && error && (
          <ErrorState title="Could not load centres" message={error} onRetry={fetchCentres} />
        )}

        {!loading && !error && centres.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <p className="empty-state-title">No centres yet</p>
            <p>Add the first procurement centre to get started.</p>
          </div>
        )}

        {!loading && !error && centres.length > 0 && (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Hours</th>
                  <th>Counters</th>
                  <th>Slot</th>
                  <th>Daily Cap.</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {centres.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <strong>{c.name}</strong>
                      {c.activeCommodities?.length > 0 && (
                        <div style={{ marginTop: '0.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {c.activeCommodities.map((com) => (
                            <span key={com} className="commodity-tag">{com}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <div>{c.location?.district}</div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                        {c.location?.state}
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {c.operatingHours?.open || '—'} – {c.operatingHours?.close || '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>{c.numberOfCounters ?? '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {c.slotDurationMinutes ?? '—'} min × {c.slotCapacity ?? '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>{dailyCapacity(c)}</td>
                    <td>
                      <StatusBadge
                        status={c.isActive ? 'active' : 'cancelled'}
                        label={c.isActive ? 'Active' : 'Inactive'}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button size="sm" variant="outline" onClick={() => openEditForm(c)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={c.isActive ? 'danger' : 'ghost'}
                          isLoading={togglingId === c._id}
                          onClick={() => handleToggleActive(c._id)}
                        >
                          {c.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminCentres;
