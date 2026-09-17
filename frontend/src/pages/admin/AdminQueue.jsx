import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { connectSocket, disconnectSocket, joinCentre, leaveCentre, getSocket } from '../../services/socket';
import { apiGet, apiPatch } from '../../services/api';

const STATUS_BADGE = {
  waiting: { label: 'Waiting', color: '#b45309', bg: '#fef3c7' },
  'in-progress': { label: 'Serving', color: '#1d4ed8', bg: '#dbeafe' },
  completed: { label: 'Done', color: '#166534', bg: '#dcfce7' },
  skipped: { label: 'No-show', color: '#6b7280', bg: '#f3f4f6' },
};

const formatMs = (ms) => {
  if (!ms || ms <= 0) return '—';
  const mins = Math.round(ms / 60000);
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const Badge = ({ status }) => {
  const s = STATUS_BADGE[status] || STATUS_BADGE.waiting;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 12,
      fontSize: 12, fontWeight: 600, color: s.color, background: s.bg,
    }}>
      {s.label}
    </span>
  );
};

export default function AdminQueue() {
  const { token } = useAuth();
  const [centres, setCentres] = useState([]);
  const [centreId, setCentreId] = useState('');
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const prevCentreRef = useRef('');

  // Load centres once
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

    const handleQueueUpdate = ({ centreId: cid, queue: q, stats: s }) => {
      if (cid === prevCentreRef.current) {
        setQueue(q || []);
        setStats(s || null);
      }
    };

    sock.on('queue:update', handleQueueUpdate);

    return () => {
      sock.off('queue:update', handleQueueUpdate);
      disconnectSocket();
    };
  }, [token]);

  const fetchQueue = useCallback(async (cid) => {
    if (!cid) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiGet(`/queue/${cid}`, { auth: true });
      setQueue(data.queue || []);
      setStats(data.stats || null);
    } catch (e) {
      setError(e.message || 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, []);

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

    fetchQueue(centreId);

    return () => sock?.off('connect', joinRoom);
  }, [centreId, fetchQueue]);

  const doAction = async (entryId, action) => {
    setActionLoading(entryId + action);
    setError('');
    try {
      await apiPatch(`/queue/${entryId}/${action}`, {}, { auth: true });
      // socket broadcast will update state; also fetch as fallback
      await fetchQueue(centreId);
    } catch (e) {
      setError(e.message || `Action '${action}' failed`);
    } finally {
      setActionLoading(null);
    }
  };

  const waiting = queue.filter((e) => e.status === 'waiting');
  const inProgress = queue.filter((e) => e.status === 'in-progress');
  const done = queue.filter((e) => e.status === 'completed' || e.status === 'skipped');
  const canCallNext = waiting.length > 0 && inProgress.length < (stats?.numberOfCounters || 1);
  const nextWaiting = waiting[0];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Queue Management</h1>

      {/* Centre selector */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <label htmlFor="centre-select" style={{ fontWeight: 600 }}>Centre:</label>
        <select
          id="centre-select"
          value={centreId}
          onChange={(e) => setCentreId(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}
        >
          {centres.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <button
          onClick={() => fetchQueue(centreId)}
          disabled={loading}
          style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 13 }}
        >
          ↺ Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', color: '#b91c1c', marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Stats bar */}
      {stats && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          {[
            { label: 'Total', value: stats.total, color: '#374151' },
            { label: 'Waiting', value: stats.waiting, color: '#b45309' },
            { label: 'Serving', value: stats.serving, color: '#1d4ed8' },
            { label: 'Completed', value: stats.completed, color: '#166534' },
            { label: 'Avg Processing', value: formatMs(stats.avgProcessingMs), color: '#374151' },
            { label: 'Est. Wait (next)', value: formatMs(stats.estimatedWaitMs), color: '#374151' },
            { label: 'Counters', value: stats.numberOfCounters, color: '#374151' },
          ].map((s) => (
            <div key={s.label} style={{
              padding: '10px 16px', borderRadius: 8, background: '#f9fafb',
              border: '1px solid #e5e7eb', minWidth: 100, textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Call Next */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => nextWaiting && doAction(nextWaiting._id, 'call-next')}
          disabled={!canCallNext || actionLoading === nextWaiting?._id + 'call-next'}
          style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: canCallNext ? '#16a34a' : '#d1d5db',
            color: canCallNext ? '#fff' : '#9ca3af',
            fontWeight: 700, fontSize: 15,
            cursor: canCallNext ? 'pointer' : 'not-allowed',
          }}
        >
          {actionLoading === nextWaiting?._id + 'call-next' ? 'Calling…' : '📢 Call Next Farmer'}
        </button>
        {!canCallNext && stats && (
          <span style={{ marginLeft: 12, fontSize: 13, color: '#6b7280' }}>
            {waiting.length === 0 ? 'No farmers waiting' : `All ${stats.numberOfCounters} counter(s) busy`}
          </span>
        )}
      </div>

      {loading && <div style={{ color: '#6b7280', marginBottom: 16 }}>Loading queue…</div>}

      {/* Currently serving */}
      {inProgress.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: '#1d4ed8' }}>
            🔵 Currently Serving ({inProgress.length})
          </h2>
          {inProgress.map((e) => (
            <QueueCard
              key={e._id}
              entry={e}
              onComplete={() => doAction(e._id, 'complete')}
              onNoShow={() => doAction(e._id, 'no-show')}
              actionLoading={actionLoading}
            />
          ))}
        </section>
      )}

      {/* Waiting */}
      {waiting.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: '#b45309' }}>
            🟡 Waiting ({waiting.length})
          </h2>
          {waiting.map((e, i) => (
            <QueueCard
              key={e._id}
              entry={e}
              position={i + 1}
              onNoShow={() => doAction(e._id, 'no-show')}
              actionLoading={actionLoading}
            />
          ))}
        </section>
      )}

      {/* Done */}
      {done.length > 0 && (
        <section>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: '#6b7280' }}>
            ✅ Done ({done.length})
          </h2>
          {done.map((e) => (
            <QueueCard key={e._id} entry={e} actionLoading={actionLoading} />
          ))}
        </section>
      )}

      {!loading && queue.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>
          No queue entries for today at this centre.
        </div>
      )}
    </div>
  );
}

function QueueCard({ entry, position, onComplete, onNoShow, actionLoading }) {
  const farmerName = entry.farmer?.user?.name || 'Unknown';
  const commodity = entry.appointment?.commodity || '—';
  const qty = entry.appointment?.estimatedQuantity;
  const isActing = (id) => actionLoading === entry._id + id;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '12px 16px', borderRadius: 8,
      border: '1px solid #e5e7eb', background: '#fff', marginBottom: 8,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f3f4f6', fontWeight: 800, fontSize: 16, flexShrink: 0,
      }}>
        #{entry.tokenNumber}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{farmerName}</div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          {commodity}{qty ? ` · ${qty} kg` : ''}
          {entry.appointment?.timeSlot ? ` · ${entry.appointment.timeSlot}` : ''}
          {position !== undefined ? ` · Position ${position}` : ''}
        </div>
      </div>

      <Badge status={entry.status} />

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {entry.status === 'in-progress' && (
          <>
            <button
              onClick={onComplete}
              disabled={isActing('complete')}
              style={{
                padding: '5px 12px', borderRadius: 6, border: 'none',
                background: '#16a34a', color: '#fff', fontWeight: 600,
                fontSize: 12, cursor: 'pointer',
              }}
            >
              {isActing('complete') ? '…' : '✓ Complete'}
            </button>
            <button
              onClick={onNoShow}
              disabled={isActing('no-show')}
              style={{
                padding: '5px 12px', borderRadius: 6,
                border: '1px solid #d1d5db', background: '#fff',
                fontWeight: 600, fontSize: 12, cursor: 'pointer', color: '#374151',
              }}
            >
              {isActing('no-show') ? '…' : 'No-show'}
            </button>
          </>
        )}
        {entry.status === 'waiting' && (
          <button
            onClick={onNoShow}
            disabled={isActing('no-show')}
            style={{
              padding: '5px 12px', borderRadius: 6,
              border: '1px solid #d1d5db', background: '#fff',
              fontWeight: 600, fontSize: 12, cursor: 'pointer', color: '#374151',
            }}
          >
            {isActing('no-show') ? '…' : 'No-show'}
          </button>
        )}
      </div>
    </div>
  );
}
