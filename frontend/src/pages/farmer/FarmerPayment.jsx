import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiGet } from '../../services/api';

const STATUS_MAP = {
  pending: 'Pending',
  processing: 'Payment Initiated',
  successful: 'Paid',
  failed: 'Failed',
};
const STATUS_COLOR = {
  pending: '#92400e',
  processing: '#db2777',
  successful: '#15803d',
  failed: '#b91c1c',
};

export default function FarmerPayment() {
  const { token } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet('/payments/my', { auth: true })
      .then((data) => setPayments(data.payments || []))
      .catch(() => setError('Failed to load payments'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>My Payments</h1>
      {error && <div style={{ padding: 10, borderRadius: 8, background: '#fef2f2', color: '#b91c1c', marginBottom: 16 }}>{error}</div>}
      {loading && <div style={{ color: '#6b7280', textAlign: 'center', padding: 32 }}>Loading…</div>}
      {!loading && payments.length === 0 && (
        <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', border: '1px solid #e5e7eb', borderRadius: 12, background: '#f9fafb' }}>
          No payment records found.
        </div>
      )}
      {!loading && payments.map((p) => {
        const s = STATUS_MAP[p.status] || p.status;
        const color = STATUS_COLOR[p.status] || '#374151';
        return (
          <div key={p._id} style={{ borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 16, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{p.procurement?.commodity || 'Procurement'}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{p.method || '—'} · {new Date(p.createdAt).toLocaleDateString()}</div>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, color: color, background: '#f3f4f6', border: `1px solid ${color}20` }}>{s}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, fontSize: 13, color: '#374151' }}>
              <div><strong>Amount:</strong> ₹{p.amount}</div>
              <div><strong>Reference:</strong> {p.transactionId || '—'}</div>
              {p.paidAt && <div><strong>Paid At:</strong> {new Date(p.paidAt).toLocaleString()}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
