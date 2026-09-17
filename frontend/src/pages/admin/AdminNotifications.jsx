import React, { useState, useEffect } from 'react';
import { apiGet, apiPatch } from '../../services/api';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const data = await apiGet('/notifications', { auth: true });
      setNotifications(data.notifications || []);
    } catch (e) { setError(e.message || 'Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const markRead = async (id) => {
    try { await apiPatch(`/notifications/${id}/read`, {}, { auth: true }); await fetchData(); } catch (e) { setError(e.message || 'Mark read failed'); }
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Notifications</h1>
      {error && <div style={{ padding: 10, borderRadius: 8, background: '#fef2f2', color: '#b91c1c', marginBottom: 16 }}>{error}</div>}
      {loading && <div style={{ color: '#6b7280' }}>Loading…</div>}
      {!loading && notifications.map(n => (
        <div key={n._id} style={{ borderRadius: 10, border: `1px solid ${n.isRead ? '#e5e7eb' : '#b45309'}`, padding: 16, marginBottom: 12, background: n.isRead ? '#fff' : '#fffbeb' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div>
              <strong style={{ fontSize: 15 }}>{n.title}</strong>
              <span style={{ marginLeft: 8, fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{n.type}</span>
              {!n.isRead && <span style={{ marginLeft: 6, fontSize: 11, color: '#b45309', fontWeight: 700 }}>● NEW</span>}
            </div>
            <button onClick={() => markRead(n._id)} disabled={n.isRead} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: n.isRead ? '#e5e7eb' : '#16a34a', color: n.isRead ? '#6b7280' : '#fff', fontWeight: 600, fontSize: 11, cursor: n.isRead ? 'default' : 'pointer' }}>Mark read</button>
          </div>
          <div style={{ fontSize: 14, color: '#374151' }}>{n.message}</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>{new Date(n.createdAt).toLocaleString()}</div>
        </div>
      ))}
      {!loading && notifications.length === 0 && <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>No notifications.</div>}
    </div>
  );
}
