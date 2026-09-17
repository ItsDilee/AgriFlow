import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { connectSocket, disconnectSocket, joinUser, leaveUser, getSocket } from '../../services/socket';
import { apiGet, apiPatch } from '../../services/api';

const TYPE_LABEL = {
  appointment: 'Appointment',
  queue: 'Queue',
  payment: 'Payment',
  system: 'System',
};

export default function FarmerNotifications() {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    try {
      const data = await apiGet('/notifications', { auth: true });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      setError(e.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const sock = connectSocket(token);

    const handleUpdate = ({ unreadCount: u }) => {
      setUnreadCount(typeof u === 'number' ? u : 0);
      fetchNotifications();
    };

    sock.on('notification:update', handleUpdate);

    const joinRoom = () => {
      if (user?._id || user?.id) joinUser(user._id || user.id);
    };
    if (sock?.connected) joinRoom();
    else sock?.on('connect', joinRoom);

    return () => {
      sock.off('notification:update', handleUpdate);
      if (user?._id || user?.id) leaveUser(user._id || user.id);
      disconnectSocket();
    };
  }, [token, user]);

  const markRead = async (id) => {
    try {
      await apiPatch(`/notifications/${id}/read`, {}, { auth: true });
      await fetchNotifications();
    } catch (e) {
      setError(e.message || 'Failed to mark read');
    }
  };

  const markAllRead = async () => {
    try {
      await apiPatch('/notifications/read-all', {}, { auth: true });
      await fetchNotifications();
    } catch (e) {
      setError(e.message || 'Failed to mark all read');
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Notifications</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {unreadCount > 0 && (
            <span style={{ background: '#b91c1c', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
              {unreadCount} unread
            </span>
          )}
          <button onClick={markAllRead} disabled={unreadCount === 0} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db', background: unreadCount > 0 ? '#16a34a' : '#e5e7eb', color: unreadCount > 0 ? '#fff' : '#9ca3af', fontWeight: 600, fontSize: 13, cursor: unreadCount > 0 ? 'pointer' : 'not-allowed' }}>
            Mark all read
          </button>
        </div>
      </div>
      {error && <div style={{ padding: 10, borderRadius: 8, background: '#fef2f2', color: '#b91c1c', marginBottom: 16 }}>{error}</div>}
      {loading && <div style={{ color: '#6b7280', textAlign: 'center', padding: 32 }}>Loading…</div>}
      {!loading && notifications.length === 0 && (
        <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', border: '1px solid #e5e7eb', borderRadius: 12, background: '#f9fafb' }}>No notifications.</div>
      )}
      {!loading && notifications.map((n) => (
        <div key={n._id} style={{ borderRadius: 10, border: `1px solid ${n.isRead ? '#e5e7eb' : '#16a34a'}`, padding: 16, marginBottom: 12, background: n.isRead ? '#fff' : '#f0fdf4' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{n.title}</span>
              <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: '#374151', background: '#f3f4f6' }}>{TYPE_LABEL[n.type] || n.type}</span>
              {!n.isRead && <span style={{ marginLeft: 6, fontSize: 11, color: '#15803d', fontWeight: 700 }}>● NEW</span>}
            </div>
            <button onClick={() => markRead(n._id)} disabled={n.isRead} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: n.isRead ? '#e5e7eb' : '#16a34a', color: n.isRead ? '#6b7280' : '#fff', fontWeight: 600, fontSize: 11, cursor: n.isRead ? 'default' : 'pointer' }}>
              {n.isRead ? 'Read' : 'Mark read'}
            </button>
          </div>
          <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{n.message}</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>{new Date(n.createdAt).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
