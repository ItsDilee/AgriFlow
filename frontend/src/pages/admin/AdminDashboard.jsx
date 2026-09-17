import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import { apiGet } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    farmers: 0, centres: 0, appointments: 0, queueWaiting: 0,
    procurements: 0, payments: 0, notifications: 0, auditLogs: 0,
    loading: true, error: null,
  });
  const [apiStatus, setApiStatus] = useState(null);

  useEffect(() => {
    apiGet('/status').then((d) => setApiStatus(d.db === 'connected' ? 'connected' : 'degraded')).catch(() => setApiStatus('offline'));

    Promise.all([
      apiGet('/farmers', { auth: true }).catch(() => ({ count: 0 })),
      apiGet('/centres', { auth: true }).catch(() => ({ centres: [] })),
      apiGet('/appointments/my', { auth: true }).catch(() => ({ appointments: [] })), // admin uses /queue or aggregate; fallback
      apiGet('/procurements', { auth: true }).catch(() => ({ procurements: [] })),
      apiGet('/payments', { auth: true }).catch(() => ({ payments: [] })),
      apiGet('/notifications', { auth: true }).catch(() => ({ notifications: [] })),
      apiGet('/audit/reports/dashboard', { auth: true }).catch(() => ({ data: { totals: {} } })),
    ]).then(([f, c, a, p, pay, n, dash]) => {
      const dashboardTotals = dash?.data?.totals || {};
      setStats({
        farmers: f.count || 0,
        centres: (c.centres || []).length,
        appointments: dashboardTotals.appointments || (a.appointments || []).length,
        queueWaiting: 0, // live from queue summary if needed
        procurements: dashboardTotals.procurements || (p.procurements || []).length,
        payments: dashboardTotals.payments || (pay.payments || []).length,
        notifications: (n.notifications || []).length,
        auditLogs: 0,
        loading: false,
        error: null,
      });
    }).catch((e) => setStats(s => ({ ...s, loading: false, error: e.message })));
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Operational overview & quick actions</p>
      </div>

      <div className="dashboard-status-bar" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="status-label" style={{ fontWeight: 600, fontSize: '0.95rem' }}>System:</span>
        <StatusBadge status={apiStatus === 'connected' ? 'active' : apiStatus === 'degraded' ? 'pending' : 'cancelled'} label={apiStatus === 'connected' ? 'All Systems Operational' : apiStatus === 'degraded' ? 'DB Degraded' : 'Offline'} />
      </div>

      {stats.loading ? <Spinner message="Loading dashboard stats…" /> : (
        <>
          <div className="grid grid-3" style={{ marginBottom: '1.5rem' }}>
            <Card><p className="stat-label">Farmers</p><p className="stat-value">{stats.farmers}</p><StatusBadge status="active" label="Registered" /></Card>
            <Card><p className="stat-label">Centres</p><p className="stat-value">{stats.centres}</p><StatusBadge status="active" label="Active" /></Card>
            <Card><p className="stat-label">Appointments (Total)</p><p className="stat-value">{stats.appointments}</p><StatusBadge status="pending" label="Recorded" /></Card>
            <Card><p className="stat-label">Procurements</p><p className="stat-value">{stats.procurements}</p><StatusBadge status="processing" label="Lifecycle" /></Card>
            <Card><p className="stat-label">Payments</p><p className="stat-value">{stats.payments}</p><StatusBadge status="completed" label="Processed" /></Card>
            <Card><p className="stat-label">Audit Logs</p><p className="stat-value">{stats.auditLogs}</p><StatusBadge status="default" label="Latest" /></Card>
          </div>

          <div className="grid grid-2" style={{ marginBottom: '1.5rem' }}>
            <Card>
              <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link to="/admin/centres"><button className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>Manage Centres</button></Link>
                <Link to="/admin/queue"><button className="btn btn-outline" style={{ width: '100%', textAlign: 'center' }}>Live Queue</button></Link>
                <Link to="/admin/procurements"><button className="btn btn-ghost" style={{ width: '100%', textAlign: 'center' }}>Procurement</button></Link>
                <Link to="/admin/audit"><button className="btn btn-ghost" style={{ width: '100%', textAlign: 'center' }}>Audit Logs</button></Link>
                <Link to="/admin/reports"><button className="btn btn-ghost" style={{ width: '100%', textAlign: 'center' }}>Reports</button></Link>
              </div>
            </Card>
            <Card>
              <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>Daily Operations</h3>
              <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                <div>• Check-in status: <strong>Live</strong></div>
                <div>• Queue updates: <strong>Real-time via Socket.IO</strong></div>
                <div>• Procurement stages: <strong>Verified → Weighed → Procured → Payment</strong></div>
                <div>• Payment tracking: <strong>Pending / Processing / Successful / Failed</strong></div>
              </div>
            </Card>
          </div>

          {stats.error && <div className="alert alert-error">{stats.error}</div>}
        </>
      )}
    </div>
  );
}
