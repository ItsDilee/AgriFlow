import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiGet } from '../../services/api';

const STATUS_INFO = {
  booked: { label: 'Booked', color: '#92400e', bg: '#fef3c7' },
  arrived: { label: 'Arrived', color: '#1d4ed8', bg: '#dbeafe' },
  verified: { label: 'Verified', color: '#166534', bg: '#dcfce7' },
  weighed: { label: 'Weighed', color: '#0891b2', bg: '#cffafe' },
  procured: { label: 'Procured', color: '#7c3aed', bg: '#ede9fe' },
  payment_initiated: { label: 'Payment Initiated', color: '#db2777', bg: '#fce7f3' },
  paid: { label: 'Paid', color: '#15803d', bg: '#dcfce7' },
  rejected: { label: 'Rejected', color: '#b91c1c', bg: '#fee2e2' },
};

export default function FarmerProcurement() {
  const { token } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet('/procurements/my', { auth: true })
      .then((data) => setRecords(data.procurements || []))
      .catch(() => setError('Failed to load procurement records'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>My Procurement Status</h1>
      {error && <div style={{ padding: 10, borderRadius: 8, background: '#fef2f2', color: '#b91c1c', marginBottom: 16 }}>{error}</div>}
      {loading && <div style={{ color: '#6b7280', textAlign: 'center', padding: 32 }}>Loading…</div>}
      {!loading && records.length === 0 && (
        <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', border: '1px solid #e5e7eb', borderRadius: 12, background: '#f9fafb' }}>
          No procurement records found yet.
        </div>
      )}
      {!loading && records.map((r) => {
        const s = STATUS_INFO[r.status] || STATUS_INFO.booked;
        return (
          <div key={r._id} style={{ borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 16, background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{r.commodity}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{r.centre?.name || 'Centre'} · {new Date(r.appointment?.scheduledDate).toISOString().split('T')[0] || '—'}</div>
              </div>
              <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, color: s.color, background: s.bg }}>{s.label}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, fontSize: 13, color: '#374151' }}>
              <div><strong>Qty:</strong> {r.actualQuantity} kg</div>
              <div><strong>Grade:</strong> {r.qualityGrade}</div>
              <div><strong>Rate:</strong> ₹{r.ratePerKg}/kg</div>
              <div><strong>Amount:</strong> ₹{r.totalAmount}</div>
            </div>
            {r.weighingDetails && (
              <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: '#f8fafc', fontSize: 12, color: '#374151' }}>
                <strong>Weighing:</strong> Net {r.weighingDetails.netWeight} kg · Tare {r.weighingDetails.tareWeight} kg · Grade {r.weighingDetails.grade}
              </div>
            )}
            <div style={{ marginTop: 10, fontSize: 12, color: '#6b7280' }}>
              {r.verifiedAt && <span>Verified: {new Date(r.verifiedAt).toLocaleString()} &nbsp;·&nbsp; </span>}
              {r.weighedAt && <span>Weighed: {new Date(r.weighedAt).toLocaleString()} &nbsp;·&nbsp; </span>}
              {r.procuredAt && <span>Procured: {new Date(r.procuredAt).toLocaleString()} &nbsp;·&nbsp; </span>}
              {r.paymentInitiatedAt && <span>Payment Initiated: {new Date(r.paymentInitiatedAt).toLocaleString()} &nbsp;·&nbsp; </span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
