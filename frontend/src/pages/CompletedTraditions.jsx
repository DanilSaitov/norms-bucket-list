import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardShell from '../components/DashboardShell';

function getStorageKey(userId) {
  return `completedTraditions-${userId}`;
}

function CompletedTraditions() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedTraditions, setCompletedTraditions] = useState([]);
  const navigate = useNavigate();

  const checkAuthentication = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/auth/me', {
        withCredentials: true,
      });
      const authUser = response.data.user;
      setUser(authUser);
      const stored = localStorage.getItem(getStorageKey(authUser.user_id));
      setCompletedTraditions(stored ? JSON.parse(stored) : []);
      setLoading(false);
    } catch (err) {
      console.error('Not authenticated:', err);
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:3000/api/auth/logout', {}, {
        withCredentials: true,
      });
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
      <section className="traditions-grid" id="completed-traditions">
        <h2>Completed Traditions</h2>
        {completedTraditions.length === 0 ? (
          <p className="traditions-empty">You haven’t completed any traditions yet.</p>
        ) : (
          <div className="completed-list">
            {completedTraditions.map((item, index) => (
              <article key={item.tradition_id ?? item.id ?? index} className="tradition-card">
                <div className="tradition-card__body">
                  <h3>{item.title || 'Untitled Tradition'}</h3>
                  {item.description && <p>{item.description}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}

export default CompletedTraditions;
