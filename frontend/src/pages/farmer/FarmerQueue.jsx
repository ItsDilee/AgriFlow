import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { connectSocket, disconnectSocket, joinCentre, leaveCentre, getSocket } from '../../services/socket';
import { apiGet, apiPost } from '../../services/api';

const formatMs = (ms) => {
  if (!ms || ms <= 0) return 'Any moment now';
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'Any moment now';
  return mins < 60 ? `~${mins} min` : `~${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const STATUS_INFO = {
  waiting: { emoji: '🕐', label: 'Waiting', color: '#b45309', bg: '#fef3c7' },
  'in-progress': { emoji: '🔔', label: 'Being Served', color: '#1d4ed8', bg: '#dbeafe' },
  completed: { emoji: '✅', label: 'Completed', color: '#166534', bg: '#dcfce7' },
  skipped: { emoji: '⚠️', label: 'Marked No-show', color: '#6b7280', bg: '#f3f4f6' },
};

export default function FarmerQueue() {
  const { token } = useAuth();
  const [centres, setCentres] = useState([]);
  const [centreId, setCentreId] = useState('');
  const [myEntry, setMyEntry] = useState(null);
  const [position, setPosition] = useState(null);
  const [estimatedWaitMs, setEstimatedWaitMs] = useState(null);
  const [stats, setStats] = useState(null);
  const [todayAppointment, setTodayAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const prevStatusRef = useRef('');
  const prevCentreRef = useRef('');

  // Load centres
  useEffect(() => {
    apiGet('/centres', { auth: true })
      .then((data) => {
        const list = data.centres || data;
        setCentres(list);
        if (list.length > 0) setCentreId(list[0]._id);
      })
      .catch(() => setError('Failed to load centres'));
  }, []);

  // Connect socket once
  useEffect(() => {
    const sock = connectSocket(token);

    const handleQueueUpdate = ({ centreId: cid }) => {
      if (cid === prevCentreRef.current) {
        fetchMyEntry(cid);
      }
    };

    sock.on('queue:update', handleQueueUpdate);

    return () => {
      sock.off('queue:update', handleQueueUpdate);
      disconnectSocket();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchMyEntry = useCallback(async (cid) => {
    if (!cid) return;
    try {
      const data = await apiGet(`/queue/${cid}/my`, { auth: true });
      const prev = prevStatusRef.current;
      const newStatus = data.myEntry?.status;

      setMyEntry(data.myEntry || null);
      setPosition(data.position);
      setEstimatedWaitMs(data.estimatedWaitMs);
      setStats(data.stats || null);

      if (prev && prev !== newStatus && newStatus === 'in-progress') {
        setNotification('🔔 Your token is being called! Please proceed to the counter.');
      }
      prevStatusRef.current = newStatus || '';
    } catch {
      // silently fail on socket-triggered refresh
    }
  }, []);

  // When centre changes: join room + load data
  useEffect(() => {
    if (!centreId) return;
    const sock = getSocket();

    if (prevCentreRef.current && prevCentreRef.current !== centreId) {
      leaveCentre(prevCentreRef.current);
    }
    prevCentreRef.current = centreId;

    const joinRoom = () => joinCentre(centreId);
    if (sock?.connected) {
      joinRoom();
    } else {
      sock?.on('connect', joinRoom);
    }

    loadAll(centreId);

    return () => sock?.off('connect', joinRoom);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centreId]);

  const loadAll = async (cid) => {
    setLoading(true);
    setError('');
    setNotification('');
    try {
      const myData = await apiGet(`/queue/${cid}/my`, { auth: true });
      setMyEntry(myData.myEntry || null);
      setPosition(myData.position);
      setEstimatedWaitMs(myData.estimatedWaitMs);
      setStats(myData.stats || null);
      prevStatusRef.current = myData.myEntry?.status || '';

      if (!myData.myEntry) {
        const apptData = await apiGet('/appointments/my', { auth: true });
        const appts = apptData.appointments || apptData || [];
        const todayStr = new Date().toISOString().split('T')[0];
        const todayAppt = appts.find(
          (a) =>
            (a.centre?._id === cid || a.centre === cid) &&
            a.scheduledDate?.startsWith(todayStr) &&
            a.status === 'scheduled'
        );
        setTodayAppointment(todayAppt || null);
      } else {
        setTodayAppointment(null);
      }
    } catch (e) {
      setError(e.message || 'Failed to load queue status');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!todayAppointment) return;
    setCheckingIn(true);
    setError('');
    try {
      await apiPost('/queue/checkin', { appointmentId: todayAppointment._id }, { auth: true });
      await loadAll(centreId);
    } catch (e) {
      setError(e.message || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  const statusInfo = myEntry ? (STATUS_INFO[myEntry.status] || STATUS_INFO.waiting) : null;
  const centreName = centres.find((c) => c._id === centreId)?.name || '';

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Live Queue Status</h1>

      {/* Centre selector */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <label htmlFor="centre-sel" style={{ fontWeight: 600 }}>Centre:</label>
        <select
          id="centre-sel"
          value={centreId}
          onChange={(e) => setCentreId(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}
        >
          {centres.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      {notification && (
        <div style={{
          padding: '12px 16px', borderRadius: 8, background: '#dbeafe', color: '#1d4ed8',
          marginBottom: 20, fontWeight: 600, fontSize: 14,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {notification}
          <button
            onClick={() => setNotification('')}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}
            aria-label="Dismiss"
          >×</button>
        </div>
      )}

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', color: '#b91c1c', marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      {loading && <div style={{ color: '#6b7280', textAlign: 'center', padding: 32 }}>Loading…</div>}

      {!loading && (
        <>
          {myEntry ? (
            <div style={{
              borderRadius: 12, border: `2px solid ${statusInfo.color}`,
              background: statusInfo.bg, padding: 24, marginBottom: 24, textAlign: 'center',
            }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>{statusInfo.emoji}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{centreName}</div>
              <div style={{ fontSize: 48, fontWeight: 900, color: statusInfo.color, lineHeight: 1 }}>
                #{myEntry.tokenNumber}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: statusInfo.color, marginTop: 4, marginBottom: 16 }}>
                {statusInfo.label}
              </div>

              {myEntry.status === 'waiting' && (
                <>
                  <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
                    {position !== null ? position : '—'}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
                    {position === 1 ? "You're next!" : 'farmers ahead of you'}
                  </div>
                  <div style={{
                    display: 'inline-block', padding: '6px 16px', borderRadius: 20,
                    background: '#fff', border: `1px solid ${statusInfo.color}`,
                    fontSize: 14, fontWeight: 600, color: statusInfo.color,
                  }}>
                    Estimated wait: {formatMs(estimatedWaitMs)}
                  </div>
                </>
              )}

              {myEntry.status === 'in-progress' && (
                <div style={{ fontSize: 14, color: '#1d4ed8', fontWeight: 600 }}>
                  Please proceed to the counter now
                </div>
              )}

              {(myEntry.status === 'completed' || myEntry.status === 'skipped') && (
                <div style={{ fontSize: 14, color: '#6b7280' }}>
                  {myEntry.status === 'completed'
                    ? 'Your visit has been completed. Thank you!'
                    : 'You were marked as no-show. Contact staff if needed.'}
                </div>
              )}

              <div style={{ marginTop: 16, fontSize: 12, color: '#9ca3af' }}>
                {myEntry.appointment?.commodity && <span>Commodity: {myEntry.appointment.commodity}</span>}
                {myEntry.appointment?.estimatedQuantity && <span> · {myEntry.appointment.estimatedQuantity} kg</span>}
              </div>
            </div>
          ) : (
            <div style={{
              borderRadius: 12, border: '1px solid #e5e7eb',
              background: '#f9fafb', padding: 32, marginBottom: 24, textAlign: 'center',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🌾</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Not in queue yet</div>
              {todayAppointment ? (
                <>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
                    You have an appointment today for {todayAppointment.commodity} at {todayAppointment.timeSlot}.
                    Check in to join the queue.
                  </div>
                  <button
                    onClick={handleCheckIn}
                    disabled={checkingIn}
                    style={{
                      padding: '10px 28px', borderRadius: 8, border: 'none',
                      background: '#16a34a', color: '#fff', fontWeight: 700,
                      fontSize: 15, cursor: 'pointer',
                    }}
                  >
                    {checkingIn ? 'Checking in…' : '✅ Check In Now'}
                  </button>
                </>
              ) : (
                <div style={{ fontSize: 13, color: '#6b7280' }}>
                  You don&apos;t have a scheduled appointment at this centre today.
                </div>
              )}
            </div>
          )}

          {stats && (
            <div style={{ borderRadius: 8, border: '1px solid #e5e7eb', padding: '16px 20px', background: '#fff' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>
                Today&apos;s Queue at {centreName}
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  { label: 'Waiting', value: stats.waiting, color: '#b45309' },
                  { label: 'Serving', value: stats.serving, color: '#1d4ed8' },
                  { label: 'Completed', value: stats.completed, color: '#166534' },
                  { label: 'Est. Wait', value: formatMs(stats.estimatedWaitMs), color: '#374151' },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: 'center', minWidth: 70 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
