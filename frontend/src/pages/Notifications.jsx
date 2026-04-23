import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardShell from '../components/DashboardShell';
import './Notifications.css';

const API = 'http://localhost:3000/api';

function Notifications() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true,
      });
      setUser(response.data.user);
      return true;
    } catch (err) {
      console.error('Auth error:', err);
      navigate('/login');
      return false;
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API}/notifications`, {
        withCredentials: true,
      });
      setNotifications(response.data.notifications);
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      const isAuthenticated = await loadUser();
      if (isAuthenticated) {
        await fetchNotifications();
      }
      setLoading(false);
    };

    initialize();
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(`${API}/notifications/${notificationId}/read`, null, {
        withCredentials: true,
      });
      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.notification_id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`${API}/notifications/${notificationId}`, {
        withCredentials: true,
      });
      // Remove from local state
      setNotifications(prev =>
        prev.filter(notification => notification.notification_id !== notificationId)
      );
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification');
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) {
      return;
    }
    try {
      await axios.delete(`${API}/notifications`, {
        withCredentials: true,
      });
      // Clear all from local state
      setNotifications([]);
    } catch (err) {
      console.error('Error clearing notifications:', err);
      setError('Failed to clear notifications');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'submission_approved':
        return '✅';
      case 'submission_denied':
        return '❌';
      case 'suggestion_approved':
        return '✅';
      case 'suggestion_denied':
        return '❌';
      case 'feedback_responded':
        return '💬';
      case 'system_announcement':
        return '📢';
      default:
        return '📌';
    }
  };

  const handleLogout = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <DashboardShell user={user} onLogout={handleLogout}>
        <div className="notifications-page">
          <div className="notifications-card">
            <div className="notifications-header">
              <h1>My Notifications</h1>
              <p>Review your latest updates for submission approvals, suggestion status, and feedback responses.</p>
            </div>
            <div className="notifications-empty loading">Loading notifications...</div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell user={user} onLogout={handleLogout}>
        <div className="notifications-page">
          <div className="notifications-card">
            <div className="notifications-header">
              <h1>My Notifications</h1>
              <p>Review your latest updates for submission approvals, suggestion status, and feedback responses.</p>
            </div>
            <div className="notifications-empty error">{error}</div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell user={user} onLogout={handleLogout}>
      <div className="notifications-page">
        <div className="notifications-card">
          <div className="notifications-header">
            <h1>My Notifications</h1>
            <p>Review your latest updates for submission approvals, suggestion status, and feedback responses.</p>
          </div>

          {notifications.length === 0 ? (
            <div className="notifications-empty">
              <p>You don't have any notifications yet.</p>
              <p>Notifications will appear here when your requests are reviewed.</p>
            </div>
          ) : (
            <>
              <div className="notifications-actions">
                <button
                  className="clear-all-btn"
                  onClick={clearAllNotifications}
                  title="Clear all notifications"
                >
                  Clear All
                </button>
              </div>
              <div className="notifications-list">
                {notifications.map(notification => (
                  <div
                    key={notification.notification_id}
                    className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                  >
                    <div className="notification-header">
                      <span className="notification-icon">{getNotificationIcon(notification.type)}</span>
                      <div className="notification-title-wrap">
                        <h3 className="notification-title">{notification.title}</h3>
                        <span className="notification-date">{formatDate(notification.created_at)}</span>
                      </div>
                      <div className="notification-actions">
                        {!notification.is_read && (
                          <button
                            className="mark-read-btn"
                            onClick={() => markAsRead(notification.notification_id)}
                            title="Mark as read"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          className="clear-btn"
                          onClick={() => deleteNotification(notification.notification_id)}
                          title="Clear notification"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <p className="notification-message">{notification.message}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

export default Notifications;