import React, { useState, useEffect } from 'react';
import { apiGet, apiPatch } from '../../services/api';

const STATUS_MAP = {
  booked: 'Booked', arrived: 'Arrived', verified: 'Verified', weighed: 'Weighed',
  procured: 'Procured', payment_initiated: 'Payment Initiated', paid: 'Paid', rejected: 'Rejected',
};
const STATUS_COLOR = {
  booked: '#92400e', arrived: '#1d4ed8', verified: '#166534', weighed: '#0891b2',
  procured: '#7c3aed', payment_initiated: '#db2777', paid: '#15803d', rejected: '#b91c1c',
};

export default function AdminProcurement() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const url = `/procurements?${filterStatus ? 'status=' + filterStatus : ''}`;
      const data = await apiGet(url, { auth: true });
      setRecords(data.procurements || []);
    } catch (e) { setError(e.message || 'Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filterStatus]);

  const doAction = async (id, action, body = {}) => {
    try {
      await apiPatch(`/procurements/${id}/${action}`, body, { auth: true });
      await fetchData();
    } catch (e) { setError(e.message || 'Action failed'); }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Procurement Management</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #d1d5db' }}>
          <option value="">All statuses</option>
          {Object.keys(STATUS_MAP).map(s => <option key={s} value={s}>{STATUS_MAP[s]}</option>)}
        </select>
        <button onClick={fetchData} disabled={loading} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db', cursor: 'pointer' }}>↺ Refresh</button>
      </div>
      {error && <div style={{ padding: 10, borderRadius: 8, background: '#fef2f2', color: '#b91c1c', marginBottom: 16 }}>{error}</div>}
      {loading && <div style={{ color: '#6b7280' }}>Loading…</div>}
      {!loading && records.map(r => (
        <div key={r._id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, marginBottom: 12, background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div><strong style={{ fontSize: 16 }}>{r.farmer?.user?.name || 'Farmer'}</strong> — <span style={{ color: '#6b7280', fontSize: 13 }}>{r.commodity}</span></div>
            <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, color: STATUS_COLOR[r.status] || '#374151', background: '#f3f4f6' }}>{STATUS_MAP[r.status] || r.status}</span>
          </div>
          <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>
            {r.centre?.name} · Qty {r.actualQuantity} kg · Grade {r.qualityGrade} · Rate ₹{r.ratePerKg}/kg · Amount ₹{r.totalAmount}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {r.status === 'arrived' && <button onClick={() => doAction(r._id, 'verify', { notes: 'Verified at counter.' })} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Verify</button>}
            {r.status === 'verified' && <button onClick={() => doAction(r._id, 'weigh', { actualQuantity: r.actualQuantity, qualityGrade: r.qualityGrade })} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#0891b2', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Weigh</button>}
            {r.status === 'weighed' && <button onClick={() => doAction(r._id, 'procure', { ratePerKg: r.ratePerKg })} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Procure</button>}
            {r.status === 'procured' && <button onClick={() => doAction(r._id, 'payment-initiate', { method: 'bank_transfer' })} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#db2777', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Initiate Payment</button>}
            {r.status === 'payment_initiated' && <button onClick={() => doAction(r._id, 'payment-complete')} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#15803d', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Complete Payment</button>}
            {['verified','weighed','procured','payment_initiated'].includes(r.status) && (
              <button onClick={() => doAction(r._id, 'reject', { reason: 'Rejected by admin' })} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #b91c1c', background: '#fff', color: '#b91c1c', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Reject</button>
            )}
          </div>
        </div>
      ))}
      {!loading && records.length === 0 && <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>No procurement records.</div>}
    </div>
  );
}
