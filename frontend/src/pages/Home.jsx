// Home Page Component
// Main page after user logs in
// Currently a placeholder - will eventually show bucket list challenges

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardShell from '../components/DashboardShell';
import homeImg1 from '../assets/homepage/homeBackground1.png';
import homeImg2 from '../assets/homepage/homeBackground2.jpg';
import homeImg3 from '../assets/homepage/homeBackground3.jpg';
import './Home.css';

const TRADITION_CARD_IMAGES = [homeImg1, homeImg2, homeImg3];
const DEMO_TRADITIONS = [
  {
    id: 'demo-1',
    title: 'Attend a Home Football Game',
    description: 'Cheer on the Niners and experience game-day traditions on campus.',
    isDemo: true,
  },
  {
    id: 'demo-2',
    title: 'Join a Student Club Fair',
    description: 'Explore organizations and find a group that matches your interests.',
    isDemo: true,
  },
  {
    id: 'demo-3',
    title: 'Take a Photo at the Charlotte Sign',
    description: 'Snap a campus memory and share it with friends.',
    isDemo: true,
  },
];

function normalizeTraditions(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload?.traditions && Array.isArray(payload.traditions)) return payload.traditions;
  return [];
}

function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [traditions, setTraditions] = useState([]);
  const navigate = useNavigate();

  const checkAuthentication = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/auth/me', {
        withCredentials: true,
      });
      setUser(response.data.user);
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

  const fetchTraditions = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/traditions?search=${searchTerm}`, {
        withCredentials: true,
      });
      setTraditions(normalizeTraditions(response.data));
    } catch (err) {
      console.error('Error fetching traditions:', err);
      setTraditions([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (user) fetchTraditions();
  }, [searchTerm, user, fetchTraditions]);

  const visibleTraditions = traditions.length > 0 ? traditions : DEMO_TRADITIONS;

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <DashboardShell user={user} onLogout={handleLogout}>
      <section className="home-search-row">
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Search traditions..."
            value={searchTerm}
            onChange={(e) => {
              const nextValue = e.target.value;
              setSearchTerm(nextValue);
              if (nextValue.trim() === '') setTraditions([]);
            }}
          />
        </div>
      </section>

      <section className="traditions-grid" id="traditions">
        {searchTerm && traditions.length === 0 && (
          <p className="traditions-empty">&quot;{searchTerm}&quot; not found.</p>
        )}

        {visibleTraditions.map((item, index) => (
          <article key={item.id ?? `t-${index}`} className="tradition-card">
            <div className="tradition-card__media">
              <img
                src={TRADITION_CARD_IMAGES[index % TRADITION_CARD_IMAGES.length]}
                alt={item.title ? `${item.title}` : 'Tradition'}
              />
            </div>
            <div className="tradition-card__body">
              <h3>{item.title}</h3>
              {item.description && <p>{item.description}</p>}
              <button type="button" className="complete-btn" disabled={item.isDemo}>
                {item.isDemo ? 'Demo Tradition' : 'Mark Complete'}
              </button>
            </div>
          </article>
        ))}
      </section>
    </DashboardShell>
  );
}

export default Home;
