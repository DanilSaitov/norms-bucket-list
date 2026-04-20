import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardShell from '../components/DashboardShell';
import './Feedback.css';

const API = 'http://localhost:3000/api';

function Feedback() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    subject: '',
    message: '',
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

  useEffect(() => {
    loadUser().finally(() => setLoading(false));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.post(`${API}/feedback`, formData, { withCredentials: true });

      setMessage({
        type: 'success',
        text: 'Thank you for your feedback! We appreciate your input.',
      });

      // Reset form
      setFormData({
        subject: '',
        message: '',
      });
    } catch (error) {
      console.error('Submit feedback error:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to submit feedback. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <DashboardShell user={null} onLogout={handleLogout}>
        <div className="feedback-loading">Loading...</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell user={user} onLogout={handleLogout}>
      <div className="feedback-container">
        <div className="feedback-header">
          <h1>Submit Feedback</h1>
          <p>Help us improve the UNC Charlotte tradition tracking experience by sharing your thoughts, suggestions, or reporting issues.</p>
        </div>

        <form className="feedback-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="subject">Subject *</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              maxLength="100"
              placeholder="Brief description of your feedback"
              required
            />
            <small className="char-count">{formData.subject.length}/100 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="message">Message *</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              maxLength="1000"
              placeholder="Please provide detailed feedback..."
              rows="6"
              required
            />
            <small className="char-count">{formData.message.length}/1000 characters</small>
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            className="submit-feedback-btn"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </DashboardShell>
  );
}

export default Feedback;