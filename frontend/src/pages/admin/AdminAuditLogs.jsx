import React, { useState, useEffect } from 'react';
import { apiGet } from '../../services/api';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ action: '', targetModel: '', search: '', from: '', to: '' });

  const fetchLogs = async () => {
    setLoading(true); setError('');
    try {
      const qs = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) qs.append(k, v); });
      const url = '/audit?' + qs.toString();
      const data = await apiGet(url, { auth: true });
      setLogs(data.data || []);
    } catch (e) { setError(e.message || 'Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [filters]);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Audit Logs</h1>
      {error && <div style={{ padding: 10, borderRadius: 8, background: '#fef2f2', color: '#b91c1c', marginBottom: 16 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <input placeholder="Search" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db', flex: 1 }} />
        <select value={filters.action} onChange={e => setFilters({ ...filters, action: e.target.value })} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}>
          <option value="">All actions</option>
          <option value="CENTRE_CREATED">Centre Created</option>
          <option value="APPOINTMENT_BOOKED">Appointment Booked</option>
          <option value="QUICK_CHECKIN">Check-in</option>
          <option value="PROCUREMENT_VERIFIED">Procurement Verified</option>
          <option value="PAYMENT_COMPLETED">Payment Completed</option>
        </select>
        <select value={filters.targetModel} onChange={e => setFilters({ ...filters, targetModel: e.target.value })} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}>
          <option value="">All models</option>
          <option value="Centre">Centre</option>
          <option value="Appointment">Appointment</option>
          <option value="Queue">Queue</option>
          <option value="Procurement">Procurement</option>
          <option value="Payment">Payment</option>
        </select>
      </div>
      {loading && <div style={{ color: '#6b7280' }}>Loading…</div>}
      {!loading && logs.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>No audit logs.</div>}
      {!loading && logs.map((l) => (
        <div key={l._id} style={{ borderRadius: 10, border: '1px solid #e5e7eb', padding: 14, marginBottom: 10, background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div>
              <strong style={{ fontSize: 15, color: '#15803d' }}>{l.action}</strong>
              <span style={{ marginLeft: 8, fontSize: 11, color: '#6b7280' }}>{l.targetModel}</span>
              <span style={{ marginLeft: 8, fontSize: 11, color: '#9ca3af' }}>{new Date(l.createdAt).toLocaleString()}</span>
            </div>
            <div style={{ fontSize: 11, color: '#374151' }}>{l.actor?.name || 'System'}</div>
          </div>
          <div style={{ fontSize: 13, color: '#374151' }}>{l.details && typeof l.details === 'object' ? JSON.stringify(l.details).slice(0, 120) : String(l.details).slice(0, 120)}</div>
        </div>
      ))}
    </div>
  );
}
