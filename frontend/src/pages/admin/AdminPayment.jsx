import React, { useState, useEffect } from 'react';
import { apiGet, apiPatch } from '../../services/api';

const STATUS_MAP = {
  pending: 'Pending', processing: 'Processing', successful: 'Paid', failed: 'Failed',
};
const STATUS_COLOR = {
  pending: '#92400e', processing: '#db2777', successful: '#15803d', failed: '#b91c1c',
};

export default function AdminPayment() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ status: '', method: '' });

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const qs = new URLSearchParams();
      if (filter.status) qs.set('status', filter.status);
      if (filter.method) qs.set('method', filter.method);
      const data = await apiGet('/payments?' + qs.toString(), { auth: true });
      setPayments(data.payments || []);
    } catch (e) { setError(e.message || 'Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filter]);

  const doUpdate = async (id, body) => {
    try { await apiPatch(`/payments/${id}/status`, body, { auth: true }); await fetchData(); }
    catch (e) { setError(e.message || 'Update failed'); }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Payment Tracking</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })} style={{ padding: 6, borderRadius: 6, border: '1px solid #d1d5db' }}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filter.method} onChange={e => setFilter({ ...filter, method: e.target.value })} style={{ padding: 6, borderRadius: 6, border: '1px solid #d1d5db' }}>
          <option value="">All methods</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
        </select>
        <button onClick={fetchData} disabled={loading} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db', cursor: 'pointer' }}>↺ Refresh</button>
      </div>
      {error && <div style={{ padding: 10, borderRadius: 8, background: '#fef2f2', color: '#b91c1c', marginBottom: 16 }}>{error}</div>}
      {loading && <div style={{ color: '#6b7280' }}>Loading…</div>}
      {!loading && payments.map(p => {
        const s = STATUS_MAP[p.status] || p.status;
        const c = STATUS_COLOR[p.status] || '#374151';
        return (
          <div key={p._id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, marginBottom: 12, background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div><strong style={{ fontSize: 15 }}>{p.farmer?.user?.name || 'Farmer'}</strong> — <span style={{ color: '#6b7280', fontSize: 13 }}>{p.procurement?.commodity || '—'}</span></div>
              <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, color: c, background: '#f3f4f6', border: `1px solid ${c}20` }}>{s}</span>
            </div>
            <div style={{ fontSize: 13, color: '#374151', marginBottom: 10 }}>
              Amount <strong>₹{p.amount}</strong> · Method <strong>{p.method}</strong> · Ref <strong>{p.transactionId || '—'}</strong>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {p.status === 'processing' && <button onClick={() => doUpdate(p._id, { status: 'successful', transactionId: p.transactionId })} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#15803d', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Mark Paid</button>}
              {p.status === 'processing' && <button onClick={() => doUpdate(p._id, { status: 'failed' })} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #b91c1c', background: '#fff', color: '#b91c1c', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Mark Failed</button>}
              <button onClick={() => doUpdate(p._id, { transactionId: 'TXN-UPD-' + Date.now() })} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Update Ref</button>
            </div>
          </div>
        );
      })}
      {!loading && payments.length === 0 && <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>No payment records.</div>}
    </div>
  );
}
