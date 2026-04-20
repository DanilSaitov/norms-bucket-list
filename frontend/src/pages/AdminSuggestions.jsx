import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardShell from '../components/DashboardShell';
import './AdminSuggestions.css';
import './AdminSuggestions.css';

const API = 'http://localhost:3000/api';

function AdminSuggestions() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [reviewing, setReviewing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      const u = response.data.user;
      if (u.role !== 'admin' && u.role !== 'staff') {
        navigate('/home');
        return;
      }
      setUser(u);
      return u;
    } catch (err) {
      console.error('Not authenticated:', err);
      navigate('/login');
      throw err;
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await axios.get(`${API}/traditions/suggestions?status=${filter}`, {
        withCredentials: true,
      });
      setSuggestions(response.data.suggestions || []);
    } catch (err) {
      console.error('Error loading suggestions:', err);
      setSuggestions([]);
    }
  };

  const checkAuthentication = async () => {
    try {
      await loadUser();
      await loadSuggestions();
      setLoading(false);
    } catch (err) {
      // Error handled in loadUser
    }
  };

  useEffect(() => {
    checkAuthentication();
  }, [filter]);

  const handleReview = async (suggestionId, action, adminComment = '') => {
    setReviewing(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.patch(
        `${API}/traditions/suggestions/${suggestionId}/review`,
        { action, admin_comment: adminComment },
        { withCredentials: true }
      );

      setMessage({
        type: 'success',
        text: `Suggestion ${action === 'approve' ? 'approved' : 'denied'} successfully!`
      });

      // Refresh suggestions
      await loadSuggestions();

      // Close modal if it was open
      if (selectedSuggestion?.suggestion_id === suggestionId) {
        setSelectedSuggestion(null);
      }

    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to review suggestion.',
      });
    } finally {
      setReviewing(false);
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

  const getStatusBadge = (status) => {
    const classes = {
      pending: 'status-badge--pending',
      approved: 'status-badge--approved',
      denied: 'status-badge--denied',
    };

    return (
      <span className={`status-badge ${classes[status] || ''}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <DashboardShell user={user} onLogout={handleLogout}>
      <div className="admin-suggestions-page">
        <header className="admin-suggestions-header">
          <h1 className="admin-suggestions-title">Manage Tradition Suggestions</h1>
          <p className="admin-suggestions-subtitle">
            Review and approve user-submitted tradition suggestions.
          </p>
        </header>

        {message.text && (
          <div className={`admin-alert admin-alert--${message.type}`} role="status">
            {message.text}
          </div>
        )}

        <div className="admin-suggestions-controls">
          <div className="admin-filter-group">
            <label htmlFor="status-filter" className="admin-filter-label">Filter by status:</label>
            <select
              id="status-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="admin-filter-select"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
            </select>
          </div>
        </div>

        <div className="admin-suggestions-list">
          {suggestions.length === 0 ? (
            <div className="admin-empty-state">
              <p>No {filter} suggestions found.</p>
            </div>
          ) : (
            suggestions.map((suggestion) => (
              <div key={suggestion.suggestion_id} className="admin-suggestion-card">
                <div className="admin-suggestion-header">
                  <h3 className="admin-suggestion-title">{suggestion.title}</h3>
                  {getStatusBadge(suggestion.status)}
                </div>

                <div className="admin-suggestion-meta">
                  <p><strong>Submitted by:</strong> {suggestion.user.first_name} {suggestion.user.last_name} ({suggestion.user.username})</p>
                  <p><strong>Category:</strong> {suggestion.category}</p>
                  <p><strong>Submitted:</strong> {new Date(suggestion.submitted_at).toLocaleDateString()}</p>
                  {suggestion.tags && <p><strong>Tags:</strong> {suggestion.tags}</p>}
                </div>

                <p className="admin-suggestion-description">{suggestion.description}</p>

                <div className="admin-suggestion-actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary"
                    onClick={() => setSelectedSuggestion(suggestion)}
                  >
                    View Details
                  </button>

                  {suggestion.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        className="admin-btn admin-btn--success"
                        onClick={() => handleReview(suggestion.suggestion_id, 'approve')}
                        disabled={reviewing}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger"
                        onClick={() => handleReview(suggestion.suggestion_id, 'deny')}
                        disabled={reviewing}
                      >
                        Deny
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {selectedSuggestion && (
          <div className="admin-modal-overlay" onClick={() => setSelectedSuggestion(null)}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>{selectedSuggestion.title}</h2>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => setSelectedSuggestion(null)}
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>

              <div className="admin-modal-content">
                <div className="admin-modal-image">
                  <img
                    src={selectedSuggestion.image.startsWith('/') ? `${API.replace('/api', '')}${selectedSuggestion.image}` : selectedSuggestion.image}
                    alt={selectedSuggestion.title}
                    className="admin-modal-image__img"
                  />
                </div>

                <div className="admin-modal-details">
                  <div className="admin-modal-meta">
                    <p><strong>Submitted by:</strong> {selectedSuggestion.user.first_name} {selectedSuggestion.user.last_name}</p>
                    <p><strong>Category:</strong> {selectedSuggestion.category}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedSuggestion.status)}</p>
                    <p><strong>Submitted:</strong> {new Date(selectedSuggestion.submitted_at).toLocaleDateString()}</p>
                    {selectedSuggestion.tags && <p><strong>Tags:</strong> {selectedSuggestion.tags}</p>}
                    {selectedSuggestion.intermittent && <p><strong>Type:</strong> Intermittent/Special occasion</p>}
                  </div>

                  <div className="admin-modal-description">
                    <h3>Description</h3>
                    <p>{selectedSuggestion.description}</p>
                  </div>

                  {selectedSuggestion.admin_comment && (
                    <div className="admin-modal-comment">
                      <h3>Admin Comment</h3>
                      <p>{selectedSuggestion.admin_comment}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedSuggestion.status === 'pending' && (
                <div className="admin-modal-actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn--success admin-btn--large"
                    onClick={() => handleReview(selectedSuggestion.suggestion_id, 'approve')}
                    disabled={reviewing}
                  >
                    {reviewing ? 'Processing...' : 'Approve & Create Tradition'}
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--danger admin-btn--large"
                    onClick={() => handleReview(selectedSuggestion.suggestion_id, 'deny')}
                    disabled={reviewing}
                  >
                    {reviewing ? 'Processing...' : 'Deny Suggestion'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

export default AdminSuggestions;