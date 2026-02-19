// Home Page Component
// Main page after user logs in
// Currently a placeholder - will eventually show bucket list challenges

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is authenticated by calling /api/auth/me
  const checkAuthentication = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/auth/me', {
        withCredentials: true
      });
      
      setUser(response.data.user);
      setLoading(false);

    } catch (err) {
      // Not logged in - redirect to login page
      console.error('Not authenticated:', err);
      navigate('/login');
    }
  }, [navigate]);

  // When component loads, verify user is logged in
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    checkAuthentication();
  }, [checkAuthentication]);

  // Logout handler
  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:3000/api/auth/logout', {}, {
        withCredentials: true
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
    <div className="home-container">
      <header className="home-header">
        <h1>Norm's Bucketlist</h1>
        <div className="user-info">
          <span>Welcome, {user?.first_name}!</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="home-content">
        <div className="placeholder">
          <h2>Home Page</h2>
          <p>Welcome to Norm's Bucketlist! This is where challenges will appear.</p>
          
          <div className="user-details">
            <h3>Your Profile</h3>
            <p><strong>Name:</strong> {user?.first_name} {user?.last_name}</p>
            <p><strong>Username:</strong> {user?.username}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Role:</strong> {user?.role}</p>
            <p><strong>Graduation Year:</strong> {user?.graduation_year}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;
