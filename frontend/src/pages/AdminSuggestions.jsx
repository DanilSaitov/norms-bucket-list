import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardShell from '../components/DashboardShell';
import './AdminSuggestions.css';

const API = 'http://localhost:3000/api';

function AdminSuggestions() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('suggestions');

  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [reviewing, setReviewing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [feedback, setFeedback] = useState([]);
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });

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

  const loadFeedback = async () => {
    try {
      const response = await axios.get(`${API}/feedback`, { withCredentials: true });
      setFeedback(response.data.feedback || []);
    } catch (err) {
      console.error('Error loading feedback:', err);
      setFeedback([]);
    }
  };

  const handleMarkFeedbackRead = async (feedbackId) => {
    try {
      await axios.patch(`${API}/feedback/${feedbackId}/status`, { status: 'read' }, { withCredentials: true });
      setFeedback(prev => prev.map(f => f.feedback_id === feedbackId ? { ...f, status: 'read' } : f));
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Failed to update feedback status.' });
    }
  };

  const checkAuthentication = async () => {
    try {
      await loadUser();
      await loadSuggestions();
      await loadFeedback();
      setLoading(false);
    } catch (err) {
      // Error handled in loadUser
    }
  };

  useEffect(() => {
    checkAuthentication();
  }, [filter]);

  useEffect(() => {
    if (!message.text) return undefined;

    const timeoutId = window.setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 3500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [message.text]);

  useEffect(() => {
    if (!feedbackMessage.text) return undefined;
    const timeoutId = window.setTimeout(() => setFeedbackMessage({ type: '', text: '' }), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [feedbackMessage.text]);

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

  const getFeedbackStatusClass = (status) => {
    if (status === 'unread') return 'status-badge--pending';
    if (status === 'responded') return 'status-badge--approved';
    return 'status-badge--approved';
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  const unreadFeedbackCount = feedback.filter(f => f.status === 'unread').length;

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <DashboardShell user={user} onLogout={handleLogout}>
      <div className="admin-suggestions-page">
        <header className="admin-suggestions-header">
          <h1 className="admin-suggestions-title">Manage Suggestions</h1>
          <p className="admin-suggestions-subtitle">
            Review tradition suggestions and student feedback submissions.
          </p>
        </header>

        <div className="admin-tab-bar">
          <button
            type="button"
            className={`admin-tab-btn${activeTab === 'suggestions' ? ' admin-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('suggestions')}
          >
            Tradition Suggestions
          </button>
          <button
            type="button"
            className={`admin-tab-btn${activeTab === 'feedback' ? ' admin-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('feedback')}
          >
            Feedback Submissions
            {unreadFeedbackCount > 0 && (
              <span className="admin-tab-badge">{unreadFeedbackCount}</span>
            )}
          </button>
        </div>

        {activeTab === 'suggestions' && (
          <>
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
                      <p><strong>Submitted:</strong> {new Date(suggestion.submitted_at).toLocaleDateString()}</p>
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
                    <div className="admin-modal-details">
                      <div className="admin-modal-meta">
                        <p><strong>Submitted by:</strong> {selectedSuggestion.user.first_name} {selectedSuggestion.user.last_name}</p>
                        <p><strong>Status:</strong> {getStatusBadge(selectedSuggestion.status)}</p>
                        <p><strong>Submitted:</strong> {new Date(selectedSuggestion.submitted_at).toLocaleDateString()}</p>
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
                        {reviewing ? 'Processing...' : 'Approve'}
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
          </>
        )}

        {activeTab === 'feedback' && (
          <>
            {feedbackMessage.text && (
              <div className={`admin-alert admin-alert--${feedbackMessage.type}`} role="status">
                {feedbackMessage.text}
              </div>
            )}

            <div className="admin-suggestions-list">
              {feedback.length === 0 ? (
                <div className="admin-empty-state">
                  <p>No feedback submissions found.</p>
                </div>
              ) : (
                feedback.map((item) => (
                  <div key={item.feedback_id} className="admin-suggestion-card">
                    <div className="admin-suggestion-header">
                      <h3 className="admin-suggestion-title">{item.subject}</h3>
                      <span className={`status-badge ${getFeedbackStatusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="admin-suggestion-meta">
                      <p><strong>From:</strong> {item.user.first_name} {item.user.last_name} ({item.user.username})</p>
                      <p><strong>Submitted:</strong> {formatDate(item.submitted_at)}</p>
                    </div>

                    <p className="admin-suggestion-description">{item.message}</p>

                    {item.status === 'unread' && (
                      <div className="admin-suggestion-actions">
                        <button
                          type="button"
                          className="admin-btn admin-btn--secondary"
                          onClick={() => handleMarkFeedbackRead(item.feedback_id)}
                        >
                          Mark as Read
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

export default AdminSuggestions;