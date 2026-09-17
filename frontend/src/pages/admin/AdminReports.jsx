import React, { useState, useEffect } from 'react';
import { apiGet } from '../../services/api';

export default function AdminReports() {
  const [op, setOp] = useState(null);
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const opRes = await apiGet('/audit/reports/operational', { auth: true });
        const dashRes = await apiGet('/audit/reports/dashboard', { auth: true });
        setOp(opRes.data || {});
        setDash(dashRes.data || {});
      } catch (e) { setError(e.message || 'Failed'); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Operational Reports</h1>
      {error && <div style={{ padding: 10, borderRadius: 8, background: '#fef2f2', color: '#b91c1c', marginBottom: 16 }}>{error}</div>}
      {loading && <div style={{ color: '#6b7280' }}>Loading reports…</div>}

      {!loading && dash && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: '#15803d' }}>Dashboard Summary</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {Object.entries(dash.totals || {}).map(([k, v]) => (
              <div key={k} style={{ borderRadius: 10, border: '1px solid #d1d5db', padding: 14, background: '#f0fdf4' }}>
                <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'capitalize' }}>{k}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#15803d' }}>{v}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && op && (
        <>
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: '#15803d' }}>Overview</h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ borderRadius: 10, border: '1px solid #d1d5db', padding: 14, background: '#fff', flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Centres</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#15803d' }}>{op.overview?.centres}</div>
              </div>
              <div style={{ borderRadius: 10, border: '1px solid #d1d5db', padding: 14, background: '#fff', flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Audit Logs</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#15803d' }}>{op.overview?.auditLogs}</div>
              </div>
              <div style={{ borderRadius: 10, border: '1px solid #d1d5db', padding: 14, background: '#fff', flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Date</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#15803d' }}>{op.overview?.date}</div>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: '#15803d' }}>Appointments Today</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#16a34a', color: '#fff' }}><th style={{ padding: 8, textAlign: 'left' }}>Status</th><th style={{ padding: 8, textAlign: 'left' }}>Count</th></tr>
              </thead>
              <tbody>
                {(op.appointments || []).map(a => (
                  <tr key={a._id} style={{ borderBottom: '1px solid #e5e7eb' }}><td style={{ padding: 8 }}>{a._id}</td><td style={{ padding: 8 }}>{a.count}</td></tr>
                ))}
              </tbody>
            </table>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: '#15803d' }}>Queue Status</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#16a34a', color: '#fff' }}><th style={{ padding: 8, textAlign: 'left' }}>Status</th><th style={{ padding: 8, textAlign: 'left' }}>Count</th></tr>
              </thead>
              <tbody>
                {(op.queue || []).map(q => (
                  <tr key={q._id} style={{ borderBottom: '1px solid #e5e7eb' }}><td style={{ padding: 8 }}>{q._id}</td><td style={{ padding: 8 }}>{q.count}</td></tr>
                ))}
              </tbody>
            </table>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: '#15803d' }}>Procurement Summary</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#16a34a', color: '#fff' }}><th style={{ padding: 8, textAlign: 'left' }}>Status</th><th style={{ padding: 8, textAlign: 'right' }}>Count</th><th style={{ padding: 8, textAlign: 'right' }}>Amount</th></tr>
              </thead>
              <tbody>
                {(op.procurement || []).map(p => (
                  <tr key={p._id} style={{ borderBottom: '1px solid #e5e7eb' }}><td style={{ padding: 8 }}>{p._id}</td><td style={{ padding: 8, textAlign: 'right' }}>{p.count}</td><td style={{ padding: 8, textAlign: 'right' }}>₹{p.totalAmount || 0}</td></tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: '#15803d' }}>Payment Summary</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#16a34a', color: '#fff' }}><th style={{ padding: 8, textAlign: 'left' }}>Status</th><th style={{ padding: 8, textAlign: 'right' }}>Count</th><th style={{ padding: 8, textAlign: 'right' }}>Amount</th></tr>
              </thead>
              <tbody>
                {(op.payments || []).map(py => (
                  <tr key={py._id} style={{ borderBottom: '1px solid #e5e7eb' }}><td style={{ padding: 8 }}>{py._id}</td><td style={{ padding: 8, textAlign: 'right' }}>{py.count}</td><td style={{ padding: 8, textAlign: 'right' }}>₹{py.totalAmount || 0}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
