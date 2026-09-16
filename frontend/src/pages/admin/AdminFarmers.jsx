import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import { apiGet, apiPatch } from '../../services/api';
import '../PageStyles.css';

const AdminFarmers = () => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchFarmers = () => {
    setLoading(true);
    setError(null);
    apiGet('/farmers', { auth: true })
      .then((data) => setFarmers(data.farmers || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFarmers(); }, []);

  const handleToggleVerify = async (farmerId) => {
    setTogglingId(farmerId);
    try {
      const res = await apiPatch(`/admin/farmers/${farmerId}/verify`, {}, { auth: true });
      setFarmers((prev) =>
        prev.map((f) =>
          f._id === farmerId ? { ...f, isVerified: res.farmer.isVerified } : f
        )
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Farmers</h1>
        <p className="page-subtitle">View and manage registered farmers</p>
      </div>

      <Card>
        <div className="section-header">
          <h3>All Farmers ({loading ? '…' : farmers.length})</h3>
        </div>

        {loading && <Spinner message="Loading farmers…" />}

        {!loading && error && (
          <ErrorState title="Could not load farmers" message={error} onRetry={fetchFarmers} />
        )}

        {!loading && !error && farmers.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🌾</div>
            <p className="empty-state-title">No farmers registered yet</p>
            <p>Farmers who register will appear here.</p>
          </div>
        )}

        {!loading && !error && farmers.length > 0 && (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Farm Name</th>
                  <th>Location</th>
                  <th>Verified</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {farmers.map((f) => (
                  <tr key={f._id}>
                    <td>{f.user?.name || '—'}</td>
                    <td>{f.user?.email || '—'}</td>
                    <td>{f.farmName || <em style={{ color: 'var(--color-text-muted)' }}>Not set</em>}</td>
                    <td>{f.location || <em style={{ color: 'var(--color-text-muted)' }}>Not set</em>}</td>
                    <td>
                      <StatusBadge
                        status={f.isVerified ? 'verified' : 'pending'}
                        label={f.isVerified ? 'Verified' : 'Pending'}
                      />
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant={f.isVerified ? 'outline' : 'primary'}
                        isLoading={togglingId === f._id}
                        onClick={() => handleToggleVerify(f._id)}
                      >
                        {f.isVerified ? 'Unverify' : 'Verify'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminFarmers;
