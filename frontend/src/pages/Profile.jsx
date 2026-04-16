import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardShell from '../components/DashboardShell';
import './Profile.css';

const API = 'http://localhost:3000/api';
const MAX_AVATAR_BYTES = 800 * 1024;

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [graduationYear, setGraduationYear] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [localAvatar, setLocalAvatar] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const loadUser = useCallback(async () => {
    const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
    const u = response.data.user;
    setUser(u);
    setFirstName(u.first_name || '');
    setLastName(u.last_name || '');
    setUsername(u.username || '');
    setGraduationYear(u.graduation_year != null ? String(u.graduation_year) : '');
    setLocalAvatar(null);
    setRemoveAvatar(false);
    return u;
  }, []);

  const checkAuthentication = useCallback(async () => {
    try {
      await loadUser();
      setLoading(false);
    } catch (err) {
      console.error('Not authenticated:', err);
      navigate('/login');
    }
  }, [navigate, loadUser]);

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const avatarDisplaySrc = removeAvatar
    ? null
    : localAvatar || user?.profile_image_url || null;

  const userInitial = (user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase();

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) {
      setProfileMessage({ type: 'error', text: 'Please choose an image file.' });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setProfileMessage({ type: 'error', text: `Image must be under ${MAX_AVATAR_BYTES / 1024}KB.` });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLocalAvatar(typeof reader.result === 'string' ? reader.result : null);
      setRemoveAvatar(false);
      setProfileMessage({ type: '', text: '' });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setLocalAvatar(null);
    setRemoveAvatar(true);
    setProfileMessage({ type: '', text: '' });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });
    setSavingProfile(true);
    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim(),
        graduation_year: parseInt(graduationYear, 10),
      };

      if (removeAvatar && !localAvatar) {
        payload.profile_image_url = null;
      } else if (localAvatar) {
        payload.profile_image_url = localAvatar;
      }

      const { data } = await axios.patch(`${API}/auth/me`, payload, { withCredentials: true });
      setUser(data.user);
      setLocalAvatar(null);
      setRemoveAvatar(false);
      setProfileMessage({ type: 'success', text: data.message || 'Profile saved.' });
    } catch (err) {
      setProfileMessage({
        type: 'error',
        text: err.response?.data?.error || 'Could not save profile.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    setSavingPassword(true);
    try {
      const { data } = await axios.patch(
        `${API}/auth/password`,
        { current_password: currentPassword, new_password: newPassword },
        { withCredentials: true }
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: data.message || 'Password updated.' });
    } catch (err) {
      setPasswordMessage({
        type: 'error',
        text: err.response?.data?.error || 'Could not update password.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <DashboardShell user={user} onLogout={handleLogout}>
      <div className="profile-page">
        <header className="profile-page__header">
          <h1 className="profile-page__title">Your profile</h1>
          <p className="profile-page__subtitle">
            Update how you appear in the app and manage your password. Email and role are managed by your account.
          </p>
        </header>

        <section className="profile-card" aria-labelledby="profile-avatar-heading">
          <h2 id="profile-avatar-heading" className="profile-card__title">
            Profile photo
          </h2>
          <div className="profile-avatar-row">
            <div className="profile-avatar-preview">
              {avatarDisplaySrc ? (
                <img src={avatarDisplaySrc} alt="" className="profile-avatar-preview__img" />
              ) : (
                <span className="profile-avatar-preview__fallback" aria-hidden>
                  {userInitial}
                </span>
              )}
            </div>
            <div className="profile-avatar-actions">
              <label className="profile-btn profile-btn--secondary">
                Upload image
                <input type="file" accept="image/*" className="profile-file-input" onChange={handleAvatarFile} />
              </label>
              {(user?.profile_image_url || localAvatar) && !removeAvatar && (
                <button type="button" className="profile-btn profile-btn--ghost" onClick={handleRemoveAvatar}>
                  Remove photo
                </button>
              )}
              {removeAvatar && user?.profile_image_url && !localAvatar && (
                <button
                  type="button"
                  className="profile-btn profile-btn--ghost"
                  onClick={() => {
                    setRemoveAvatar(false);
                  }}
                >
                  Undo remove
                </button>
              )}
            </div>
          </div>
          <p className="profile-hint">PNG or JPG, up to 800KB. Saved when you click &quot;Save profile&quot; below.</p>
        </section>

        <form className="profile-card" onSubmit={handleSaveProfile}>
          <h2 className="profile-card__title">Profile information</h2>

          {profileMessage.text && (
            <div className={`profile-alert profile-alert--${profileMessage.type}`} role="status">
              {profileMessage.text}
            </div>
          )}

          <div className="profile-field-grid">
            <label className="profile-field">
              <span className="profile-field__label">First name</span>
              <input
                className="profile-field__input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                maxLength={32}
                required
              />
            </label>
            <label className="profile-field">
              <span className="profile-field__label">Last name</span>
              <input
                className="profile-field__input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                maxLength={32}
                required
              />
            </label>
            <label className="profile-field">
              <span className="profile-field__label">Username</span>
              <input
                className="profile-field__input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={15}
                required
              />
            </label>
            <label className="profile-field">
              <span className="profile-field__label">Graduation year</span>
              <input
                className="profile-field__input"
                type="number"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                min={new Date().getFullYear()}
                max={new Date().getFullYear() + 10}
                required
              />
            </label>
          </div>

          <div className="profile-readonly">
            <div>
              <span className="profile-readonly__label">Email</span>
              <span className="profile-readonly__value">{user?.email}</span>
            </div>
            <div>
              <span className="profile-readonly__label">Role</span>
              <span className="profile-readonly__value">{user?.role}</span>
            </div>
          </div>

          <div className="profile-form-actions">
            <button type="submit" className="profile-btn profile-btn--primary" disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>

        <form className="profile-card" onSubmit={handleChangePassword}>
          <h2 className="profile-card__title">Change password</h2>

          {passwordMessage.text && (
            <div className={`profile-alert profile-alert--${passwordMessage.type}`} role="status">
              {passwordMessage.text}
            </div>
          )}

          <label className="profile-field profile-field--full">
            <span className="profile-field__label">Current password</span>
            <input
              className="profile-field__input"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>
          <div className="profile-field-grid">
            <label className="profile-field">
              <span className="profile-field__label">New password</span>
              <input
                className="profile-field__input"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
            <label className="profile-field">
              <span className="profile-field__label">Confirm new password</span>
              <input
                className="profile-field__input"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
          </div>

          <div className="profile-form-actions">
            <button type="submit" className="profile-btn profile-btn--primary" disabled={savingPassword}>
              {savingPassword ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}

export default Profile;
