import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../../services/api';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';

export default function FarmerDashboard() {
  const [stats, setStats] = useState({ upcoming: 0, queueStatus: 'Not in queue', procStatus: '—', payments: 0, notifications: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet('/appointments/my', { auth: true }).catch(() => ({ appointments: [] })),
      apiGet('/queue/' + (localStorage.getItem('lastCentre') || ''), { auth: true }).catch(() => ({ myEntry: null })),
      apiGet('/procurements/my', { auth: true }).catch(() => ({ procurements: [] })),
      apiGet('/payments/my', { auth: true }).catch(() => ({ payments: [] })),
      apiGet('/notifications', { auth: true }).catch(() => ({ notifications: [] })),
    ]).then(([appts, queue, procs, pays, nots]) => {
      const upcoming = (appts.appointments || []).filter(a => a.status === 'scheduled').length;
      const myEntry = queue.myEntry || null;
      let queueStr = 'Not in queue';
      if (myEntry) queueStr = myEntry.status === 'in-progress' ? 'Being Served' : myEntry.status === 'waiting' ? `Position #${queue.position || '?'}` : 'Completed';
      const latestProc = (procs.procurements || []).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))[0];
      setStats({
        upcoming,
        queueStatus: queueStr,
        procStatus: latestProc ? latestProc.status : '—',
        payments: (pays.payments || []).length,
        notifications: (nots.notifications || []).filter(n => !n.isRead).length,
      });
      setLoading(false);
    });
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Farmer Dashboard</h1>
        <p className="page-subtitle">Your farm activity at a glance</p>
      </div>
      {loading ? <Spinner message="Loading dashboard…" /> : (
        <>
          <div className="grid grid-3" style={{ marginBottom: '1.5rem' }}>
            <Card>
              <p className="stat-label">Upcoming Appointments</p>
              <p className="stat-value">{stats.upcoming}</p>
              <StatusBadge status="pending" label={stats.upcoming ? 'Booked' : 'None'} />
            </Card>
            <Card>
              <p className="stat-label">Queue Status</p>
              <p className="stat-value" style={{ fontSize: '1.1rem' }}>{stats.queueStatus}</p>
              <StatusBadge status={stats.queueStatus.includes('Being') ? 'processing' : stats.queueStatus.includes('Position') ? 'pending' : 'default'} label={stats.queueStatus} />
            </Card>
            <Card>
              <p className="stat-label">Account Status</p>
              <p className="stat-value" style={{ fontSize: '1.2rem' }}>Active</p>
              <StatusBadge status="active" label="Verified" />
            </Card>
          </div>

          <div className="grid grid-2" style={{ marginBottom: '1.5rem' }}>
            <Card>
              <h3 style={{ marginBottom: '1rem', fontWeight: 700, fontSize: '1.1rem' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link to="/farmer/appointments/book"><button className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>Book Appointment</button></Link>
                <Link to="/farmer/queue"><button className="btn btn-outline" style={{ width: '100%', textAlign: 'center' }}>Live Queue</button></Link>
                <Link to="/farmer/notifications"><button className="btn btn-ghost" style={{ width: '100%', textAlign: 'center' }}>Notifications {stats.notifications > 0 && <span style={{ background: '#b91c1c', color: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700, marginLeft: 8 }}>{stats.notifications}</span>}</button></Link>
              </div>
            </Card>

            <Card>
              <h3 style={{ marginBottom: '1rem', fontWeight: 700, fontSize: '1.1rem' }}>Recent Activity</h3>
              <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                <div>• Procurement: <strong>{stats.procStatus}</strong></div>
                <div>• Payments: <strong>{stats.payments}</strong> record{stats.payments !== 1 ? 's' : ''}</div>
                <div>• Upcoming: <strong>{stats.upcoming}</strong> appointment{stats.upcoming !== 1 ? 's' : ''}</div>
                <div>• Unread notifications: <strong>{stats.notifications}</strong></div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
