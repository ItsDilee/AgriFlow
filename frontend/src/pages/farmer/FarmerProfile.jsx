import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import Form from '../../components/Form';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';
import { apiGet, apiPut } from '../../services/api';
import '../PageStyles.css';

const FarmerProfile = () => {
  const { user, updateUser } = useAuth();

  // Farm info state
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    farmName: '',
    location: '',
    cropTypes: '',
    contactPhone: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Password change state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  // Load farmer profile on mount
  useEffect(() => {
    apiGet('/farmers/me', { auth: true })
      .then((data) => {
        setProfile(data);
        setProfileForm({
          farmName: data.farmName || '',
          location: data.location || '',
          cropTypes: (data.cropTypes || []).join(', '),
          contactPhone: data.contactPhone || '',
        });
      })
      .catch((err) => setProfileError(err.message))
      .finally(() => setLoadingProfile(false));
  }, []);

  const handleProfileChange = (e) => {
    setProfileSaved(false);
    setProfileForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    try {
      const res = await apiPut('/farmers/me', profileForm, { auth: true });
      setProfile(res.farmer);
      setProfileSaved(true);
      setIsEditing(false);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePwChange = (e) => {
    setPwError('');
    setPwSaved(false);
    setPwForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePwSave = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return setPwError('New passwords do not match');
    }
    setPwSaving(true);
    try {
      const res = await apiPut('/auth/me', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      }, { auth: true });
      updateUser({ name: res.user.name }); // Update context in case name was also changed
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwSaved(true);
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your farm and account information</p>
      </div>

      {/* Account info */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Account Details</h3>
        <div className="grid grid-2">
          <div>
            <p className="form-label">Full Name</p>
            <p>{user?.name || '—'}</p>
          </div>
          <div>
            <p className="form-label">Email</p>
            <p>{user?.email || '—'}</p>
          </div>
          <div>
            <p className="form-label">Role</p>
            <p style={{ textTransform: 'capitalize' }}>{user?.role || 'farmer'}</p>
          </div>
          <div>
            <p className="form-label">Verification</p>
            {loadingProfile ? (
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>Loading…</span>
            ) : (
              <StatusBadge
                status={profile?.isVerified ? 'verified' : 'pending'}
                label={profile?.isVerified ? 'Verified' : 'Pending Verification'}
              />
            )}
          </div>
        </div>
      </Card>

      {/* Farm information */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <div className="section-header">
          <h3>Farm Information</h3>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </div>

        {loadingProfile && <Spinner message="Loading profile…" />}

        {profileError && !loadingProfile && (
          <div className="alert alert-error">{profileError}</div>
        )}

        {profileSaved && (
          <div className="alert alert-success">Farm information saved successfully.</div>
        )}

        {!loadingProfile && isEditing && (
          <Form onSubmit={handleProfileSave}>
            <div className="form-group">
              <label className="form-label" htmlFor="farmName">Farm Name</label>
              <input id="farmName" name="farmName" className="form-input" value={profileForm.farmName}
                onChange={handleProfileChange} placeholder="e.g. Green Acres Farm" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="location">Location</label>
              <input id="location" name="location" className="form-input" value={profileForm.location}
                onChange={handleProfileChange} placeholder="Village, District" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cropTypes">Crop Types</label>
              <input id="cropTypes" name="cropTypes" className="form-input" value={profileForm.cropTypes}
                onChange={handleProfileChange} placeholder="e.g. Wheat, Rice, Maize (comma separated)" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="contactPhone">Contact Phone</label>
              <input id="contactPhone" name="contactPhone" type="tel" className="form-input"
                value={profileForm.contactPhone} onChange={handleProfileChange} placeholder="+91 XXXXX XXXXX" />
            </div>
            <div className="agri-form-actions">
              <Button variant="ghost" type="button" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button variant="primary" type="submit" isLoading={profileSaving}>Save Changes</Button>
            </div>
          </Form>
        )}

        {!loadingProfile && !isEditing && profile && (
          <div className="grid grid-2">
            <div>
              <p className="form-label">Farm Name</p>
              <p>{profile.farmName || <em style={{ color: 'var(--color-text-muted)' }}>Not set</em>}</p>
            </div>
            <div>
              <p className="form-label">Location</p>
              <p>{profile.location || <em style={{ color: 'var(--color-text-muted)' }}>Not set</em>}</p>
            </div>
            <div>
              <p className="form-label">Crop Types</p>
              <p>{profile.cropTypes?.join(', ') || <em style={{ color: 'var(--color-text-muted)' }}>Not set</em>}</p>
            </div>
            <div>
              <p className="form-label">Contact Phone</p>
              <p>{profile.contactPhone || <em style={{ color: 'var(--color-text-muted)' }}>Not set</em>}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Change Password */}
      <Card>
        <h3 style={{ marginBottom: '1rem' }}>Change Password</h3>

        {pwError && <div className="alert alert-error">{pwError}</div>}
        {pwSaved && <div className="alert alert-success">Password changed successfully.</div>}

        <Form onSubmit={handlePwSave}>
          <div className="form-group">
            <label className="form-label" htmlFor="currentPassword">Current Password</label>
            <input id="currentPassword" name="currentPassword" type="password" className="form-input"
              value={pwForm.currentPassword} onChange={handlePwChange} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="newPassword">New Password</label>
            <input id="newPassword" name="newPassword" type="password" className="form-input"
              value={pwForm.newPassword} onChange={handlePwChange}
              placeholder="Minimum 6 characters" required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" className="form-input"
              value={pwForm.confirmPassword} onChange={handlePwChange} required />
          </div>
          <div className="agri-form-actions">
            <Button variant="primary" type="submit" isLoading={pwSaving}>Update Password</Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default FarmerProfile;
