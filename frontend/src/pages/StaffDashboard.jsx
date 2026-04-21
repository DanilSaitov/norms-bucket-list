import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import DashboardShell from '../components/DashboardShell';
import './StaffDashboard.css';

const API = 'http://localhost:3000/api';

function StaffDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
        const authUser = response.data.user;

        if (authUser.role !== 'staff' && authUser.role !== 'admin') {
          navigate('/home');
          return;
        }

        if (!cancelled) {
          setUser(authUser);
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          navigate('/login');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <DashboardShell user={user} onLogout={handleLogout}>
      <div className="staff-dashboard">
        <section className="staff-dashboard__hero">
          <p className="staff-dashboard__eyebrow">{user?.role === 'admin' ? 'Admin Dashboard' : 'Staff Dashboard'}</p>
          <h1>Tradition review workspace</h1>
          <p>
            Review pending submissions, approve completed traditions, and keep the student queue moving.
          </p>
        </section>

        <section className="staff-dashboard__cards">
          <Link to="/pending" className="staff-card staff-card--primary">
            <span className="staff-card__label">Review queue</span>
            <strong>Pending Traditions</strong>
            <span>Open the tradition review board and process student submissions.</span>
          </Link>

          <Link to="/admin/suggestions" className="staff-card">
            <span className="staff-card__label">Content moderation</span>
            <strong>Tradition Suggestions</strong>
            <span>Approve or deny user-submitted tradition ideas.</span>
          </Link>

          <Link to="/feedback" className="staff-card">
            <span className="staff-card__label">Student support</span>
            <strong>Feedback Inbox</strong>
            <span>Review questions and respond to issues from students.</span>
          </Link>

          <Link to="/notifications" className="staff-card">
            <span className="staff-card__label">Notifications</span>
            <strong>Account updates</strong>
            <span>Check system and user notification activity.</span>
          </Link>
        </section>
      </div>
    </DashboardShell>
  );
}

export default StaffDashboard;