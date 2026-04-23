import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardShell from '../components/DashboardShell';
import './SuggestTradition.css';

const API = 'http://localhost:3000/api';

function SuggestTradition() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(response.data.user);
      return response.data.user;
    } catch (err) {
      console.error('Not authenticated:', err);
      navigate('/login');
      throw err;
    }
  };

  const checkAuthentication = async () => {
    try {
      await loadUser();
      setLoading(false);
    } catch (err) {
      // Error handled in loadUser
    }
  };

  React.useEffect(() => {
    checkAuthentication();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!formData.title.trim() || !formData.description.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    setSubmitting(true);

    try {
      await axios.post(`${API}/traditions/suggestions`, {
        title: formData.title.trim(),
        description: formData.description.trim(),
      }, { withCredentials: true });

      setMessage({
        type: 'success',
        text: 'Your tradition suggestion has been submitted! It will be reviewed by an administrator.'
      });

      setFormData({ title: '', description: '' });

    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to submit tradition suggestion.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <DashboardShell user={user} onLogout={handleLogout}>
      <div className="suggest-page">
        <header className="suggest-page__header">
          <h1 className="suggest-page__title">Suggest a Tradition</h1>
          <p className="suggest-page__subtitle">
            Have an idea for a new tradition? Submit it here and our administrators will review it.
            All suggestions help make our campus community stronger!
          </p>
        </header>

        <form className="suggest-form" onSubmit={handleSubmit}>
          {message.text && (
            <div className={`suggest-alert suggest-alert--${message.type}`} role="status">
              {message.text}
            </div>
          )}

          <div className="suggest-section">
            <label className="suggest-field">
              <span className="suggest-field__label">
                Tradition Title <span className="required">*</span>
              </span>
              <input
                className="suggest-field__input"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                maxLength={255}
                placeholder="e.g., Midnight Breakfast at the Social 704"
                required
              />
            </label>

            <label className="suggest-field">
              <span className="suggest-field__label">
                Description <span className="required">*</span>
              </span>
              <textarea
                className="suggest-field__textarea"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                maxLength={1000}
                placeholder="Describe what this tradition involves, when it happens, and why it's meaningful..."
                rows={4}
                required
              />
            </label>
          </div>

          <div className="suggest-actions">
            <button
              type="submit"
              className="suggest-submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Tradition Suggestion'}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}

export default SuggestTradition;