import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import { apiGet, apiPatch } from '../../services/api';
import '../PageStyles.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchUsers = () => {
    setLoading(true);
    setError(null);
    apiGet('/admin/users', { auth: true })
      .then((data) => setUsers(data.users || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggleActive = async (userId) => {
    setTogglingId(userId);
    try {
      const res = await apiPatch(`/admin/users/${userId}/toggle-active`, {}, { auth: true });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isActive: res.user.isActive } : u))
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
        <h1 className="page-title">User Management</h1>
        <p className="page-subtitle">View and manage all registered users</p>
      </div>

      <Card>
        <div className="section-header">
          <h3>All Users ({loading ? '…' : users.length})</h3>
        </div>

        {loading && <Spinner message="Loading users…" />}
        {!loading && error && (
          <ErrorState title="Could not load users" message={error} onRetry={fetchUsers} />
        )}

        {!loading && !error && users.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <p className="empty-state-title">No users found</p>
          </div>
        )}

        {!loading && !error && users.length > 0 && (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                    <td>
                      <StatusBadge
                        status={u.isActive ? 'active' : 'cancelled'}
                        label={u.isActive ? 'Active' : 'Inactive'}
                      />
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Button
                        size="sm"
                        variant={u.isActive ? 'danger' : 'outline'}
                        isLoading={togglingId === u._id}
                        onClick={() => handleToggleActive(u._id)}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
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

export default AdminUsers;
