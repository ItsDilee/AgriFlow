import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import { apiGet } from '../../services/api';
import '../PageStyles.css';

const FarmerCentres = () => {
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [districtFilter, setDistrictFilter] = useState('');

  const fetchCentres = (district = '') => {
    setLoading(true);
    setError(null);
    const query = district ? `?district=${encodeURIComponent(district)}` : '';
    apiGet(`/centres${query}`, { auth: true })
      .then((data) => setCentres(data.centres || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCentres(); }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchCentres(districtFilter.trim());
  };

  const handleClearFilter = () => {
    setDistrictFilter('');
    fetchCentres('');
  };

  // Calculate slot info for display
  const slotInfo = (c) => {
    const open = c.operatingHours?.open || '08:00';
    const close = c.operatingHours?.close || '17:00';
    const [oh, om] = open.split(':').map(Number);
    const [ch, cm] = close.split(':').map(Number);
    const totalMin = (ch * 60 + cm) - (oh * 60 + om);
    if (totalMin <= 0) return { slots: 0, daily: 0 };
    const slotsPerCounter = Math.floor(totalMin / (c.slotDurationMinutes || 30));
    const totalSlots = slotsPerCounter * (c.numberOfCounters || 1);
    const daily = totalSlots * (c.slotCapacity || 1);
    return { slots: totalSlots, daily };
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Procurement Centres</h1>
        <p className="page-subtitle">Browse active centres near you to book an appointment</p>
      </div>

      {/* District filter */}
      <Card style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <form onSubmit={handleFilter} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0, flex: '1 1 220px' }}>
            <label className="form-label" htmlFor="districtFilter">Filter by District</label>
            <input
              id="districtFilter"
              className="form-input"
              placeholder="e.g. Mandya"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" style={{ marginBottom: '0' }}>
            Search
          </button>
          {districtFilter && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleClearFilter}>
              Clear
            </button>
          )}
        </form>
      </Card>

      {loading && <Spinner message="Loading centres…" />}

      {!loading && error && (
        <ErrorState title="Could not load centres" message={error} onRetry={() => fetchCentres(districtFilter)} />
      )}

      {!loading && !error && centres.length === 0 && (
        <Card>
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <p className="empty-state-title">No active centres found</p>
            <p>
              {districtFilter
                ? `No centres found in "${districtFilter}". Try a different district.`
                : 'No procurement centres are available right now.'}
            </p>
          </div>
        </Card>
      )}

      {!loading && !error && centres.length > 0 && (
        <div className="grid grid-2">
          {centres.map((c) => {
            const { slots, daily } = slotInfo(c);
            return (
              <Card key={c._id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 700 }}>{c.name}</h3>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                      {c.location?.address}, {c.location?.district}, {c.location?.state}
                    </p>
                  </div>
                  <StatusBadge status="active" label="Open" />
                </div>

                {/* Commodities */}
                {c.activeCommodities?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {c.activeCommodities.map((com) => (
                      <span key={com} className="commodity-tag">{com}</span>
                    ))}
                  </div>
                )}

                {/* Capacity grid */}
                <div className="grid grid-2" style={{ gap: '0.5rem', margin: 0 }}>
                  <div className="centre-info-item">
                    <span className="form-label" style={{ display: 'block' }}>Hours</span>
                    <span style={{ fontWeight: 600 }}>
                      {c.operatingHours?.open || '08:00'} – {c.operatingHours?.close || '17:00'}
                    </span>
                  </div>
                  <div className="centre-info-item">
                    <span className="form-label" style={{ display: 'block' }}>Counters</span>
                    <span style={{ fontWeight: 600 }}>{c.numberOfCounters ?? 1}</span>
                  </div>
                  <div className="centre-info-item">
                    <span className="form-label" style={{ display: 'block' }}>Slot Duration</span>
                    <span style={{ fontWeight: 600 }}>{c.slotDurationMinutes ?? 30} min</span>
                  </div>
                  <div className="centre-info-item">
                    <span className="form-label" style={{ display: 'block' }}>Daily Capacity</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{daily} farmers</span>
                  </div>
                </div>

                {/* Contact */}
                {(c.contactInfo?.phone || c.contactInfo?.email) && (
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                    {c.contactInfo.phone && <span>📞 {c.contactInfo.phone}</span>}
                    {c.contactInfo.phone && c.contactInfo.email && <span style={{ margin: '0 0.5rem' }}>·</span>}
                    {c.contactInfo.email && <span>✉ {c.contactInfo.email}</span>}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FarmerCentres;
