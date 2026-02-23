// Home Page Component
// Main page after user logs in
// Currently a placeholder - will eventually show bucket list challenges

import { useState, useEffect, useCallback} from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); // search input
  const [traditions, setTraditions] = useState([]); // pulls from DB
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

  // Search logic - filters traditions based on search term
  const fetchTraditions = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/traditions?search=${searchTerm}`, {
        withCredentials: true
      });
      setTraditions(response.data);
    } catch (err) {
      console.error('Error fetching traditions:', err);
    }
  }, [searchTerm]);

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);


  //Fetches traditions when user makes an input or first loads into page
   useEffect(() => {
    if (user) fetchTraditions();
  }, [searchTerm, user]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Norm's Bucketlist</h1>
        <div className="user-info">
          <span>Welcome, {user?.first_name}!</span>
        {/*} Link handler to profile page will go here in the future */}
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="home-content">
        <div className="search-bar">
          <h2>Home Page</h2>
          <p>Welcome to Norm's Bucketlist! This is where challenges will appear.</p>

        {/* Search Input */}
          <div className="search-input-container" style={{ margin: '20px 0' }}>
            <input
              type="text"
              placeholder="Search traditions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '10px', width: '100%', maxWidth: '400px' }}
            />
          </div>

          {/* Traditions Results (boxes) */}
          <div className="traditions-list">
            {traditions.map((item) => (
              <div key={item.id} className="tradition-box" style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '10px', borderRadius: '5px' }}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <button className="complete-btn">Mark Complete</button>
              </div>
            ))}
          </div>
            
            

{/*We should move this to another page? profile page? but for now we can see the user details here */}

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
