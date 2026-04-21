import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardShell from '../components/DashboardShell';
import './CompletedTraditions.css';

const API = 'http://localhost:3000/api';

function resolveTraditionImage(image) {
  if (!image) return '';
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  return image.startsWith('/') ? `http://localhost:3000${image}` : `http://localhost:3000/${image}`;
}

function formatDateTime(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

function CompletedTraditions() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedTraditions, setCompletedTraditions] = useState([]);
  const navigate = useNavigate();

  const checkAuthentication = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true,
      });
      const authUser = response.data.user;
      if (authUser.role !== 'student') {
        navigate(authUser.role === 'admin' ? '/admin' : '/staff');
        return;
      }
      setUser(authUser);

      const completedResponse = await axios.get(`${API}/traditions/submissions/me/completed`, {
        withCredentials: true,
      });

      setCompletedTraditions(Array.isArray(completedResponse.data.submissions) ? completedResponse.data.submissions : []);
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
      <section className="completed-page" id="completed-traditions">
        <h2 className="completed-page__title">Completed Traditions</h2>
        {completedTraditions.length === 0 ? (
          <p className="completed-page__empty">You haven’t completed any traditions yet.</p>
        ) : (
          <div className="completed-page__list">
            {completedTraditions.map((item, index) => (
              <article key={item.submission_id ?? item.tradition?.tradition_id ?? index} className="completed-page__card">
                {item.tradition?.image && (
                  <div className="completed-page__card-media">
                    <img src={resolveTraditionImage(item.tradition.image)} alt={item.tradition.title || 'Tradition'} />
                  </div>
                )}
                <div className="completed-page__card-body">
                  <h3>{item.tradition?.title || 'Untitled Tradition'}</h3>
                  {item.tradition?.description && <p>{item.tradition.description}</p>}
                  <p><strong>Submitted:</strong> {formatDateTime(item.submitted_at)}</p>
                  <p><strong>Status:</strong> {item.status}</p>
                  {item.admin_comment && <p><strong>Staff comment:</strong> {item.admin_comment}</p>}
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
