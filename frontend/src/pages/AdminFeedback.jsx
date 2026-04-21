import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardShell from '../components/DashboardShell';
import './AdminFeedback.css';

const API = 'http://localhost:3000/api';

function AdminFeedback() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [feedback, setFeedback] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [responding, setResponding] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      const userData = response.data.user;

      // Check if user is admin or staff
      if (userData.role !== 'admin' && userData.role !== 'staff') {
        navigate('/home');
        return;
      }

      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Not authenticated:', err);
      navigate('/login');
      throw err;
    }
  };

  const loadFeedback = async () => {
    try {
      const response = await axios.get(`${API}/feedback`, { withCredentials: true });
      setFeedback(response.data.feedback);
    } catch (error) {
      console.error('Load feedback error:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load feedback.',
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadUser();
      await loadFeedback();
      setLoading(false);
    };
    init();
  }, []);

  const handleStatusChange = async (feedbackId, newStatus) => {
    try {
      await axios.patch(`${API}/feedback/${feedbackId}/status`, { status: newStatus }, { withCredentials: true });
      await loadFeedback(); // Refresh the list
      setMessage({
        type: 'success',
        text: 'Feedback status updated successfully.',
      });
    } catch (error) {
      console.error('Update status error:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update feedback status.',
      });
    }
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    if (!selectedFeedback || !responseText.trim()) return;

    setResponding(true);
    try {
      await axios.patch(`${API}/feedback/${selectedFeedback.feedback_id}/respond`, {
        response: responseText.trim(),
      }, { withCredentials: true });

      await loadFeedback(); // Refresh the list
      setSelectedFeedback(null);
      setResponseText('');
      setMessage({
        type: 'success',
        text: 'Response sent successfully.',
      });
    } catch (error) {
      console.error('Respond error:', error);
      setMessage({
        type: 'error',
        text: 'Failed to send response.',
      });
    } finally {
      setResponding(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'unread': return 'status-unread';
      case 'read': return 'status-read';
      case 'responded': return 'status-responded';
      default: return 'status-unread';
    }
  };

  const handleLogout = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <DashboardShell user={null} onLogout={handleLogout}>
        <div className="admin-feedback-loading">Loading...</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell user={user} onLogout={handleLogout}>
      <div className="admin-feedback-container">
        <div className="admin-feedback-header">
          <h1>Feedback Management</h1>
          <p>Review and respond to student feedback submissions.</p>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="feedback-list">
          {feedback.length === 0 ? (
            <div className="no-feedback">
              <p>No feedback submissions yet.</p>
            </div>
          ) : (
            feedback.map((item) => (
              <div key={item.feedback_id} className="feedback-item">
                <div className="feedback-header-row">
                  <div className="feedback-meta">
                    <span className="student-name">
                      {item.user.first_name} {item.user.last_name} ({item.user.username})
                    </span>
                    <span className="submitted-date">
                      {formatDate(item.submitted_at)}
                    </span>
                  </div>
                  <div className="feedback-actions">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.feedback_id, e.target.value)}
                      className={`status-select ${getStatusBadgeClass(item.status)}`}
                    >
                      <option value="unread">Unread</option>
                      <option value="read">Read</option>
                      <option value="responded">Responded</option>
                    </select>
                    {!item.admin_response && (
                      <button
                        onClick={() => setSelectedFeedback(item)}
                        className="respond-btn"
                      >
                        Respond
                      </button>
                    )}
                  </div>
                </div>

                <div className="feedback-content">
                  <h3 className="feedback-subject">{item.subject}</h3>
                  <p className="feedback-message">{item.message}</p>

                  {item.admin_response && (
                    <div className="admin-response">
                      <h4>Admin Response:</h4>
                      <p>{item.admin_response}</p>
                      {item.responded_at && (
                        <small>Responded on {formatDate(item.responded_at)}</small>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {selectedFeedback && (
          <div className="response-modal">
            <div className="response-modal-content">
              <h2>Respond to Feedback</h2>
              <div className="original-feedback">
                <h3>{selectedFeedback.subject}</h3>
                <p><strong>From:</strong> {selectedFeedback.user.first_name} {selectedFeedback.user.last_name}</p>
                <p>{selectedFeedback.message}</p>
              </div>

              <form onSubmit={handleRespond}>
                <div className="form-group">
                  <label htmlFor="response">Your Response *</label>
                  <textarea
                    id="response"
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Type your response here..."
                    rows="6"
                    maxLength="1000"
                    required
                  />
                  <small className="char-count">{responseText.length}/1000 characters</small>
                </div>

                <div className="response-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFeedback(null);
                      setResponseText('');
                    }}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={responding || !responseText.trim()}
                    className="send-response-btn"
                  >
                    {responding ? 'Sending...' : 'Send Response'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

export default AdminFeedback;