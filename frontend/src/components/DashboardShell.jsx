import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import charlotteLogoWhite from '../assets/homepage/charlotteLogoWhite.png';
import '../pages/Home.css';

function DashboardShell({ user, onLogout, children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const classYear = user?.graduation_year ? `Class of ${user.graduation_year}` : 'Class Year N/A';
  const displayName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'User';
  const userInitial = (user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavAction = () => {
    if (window.innerWidth <= 900) {
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="home-shell">
      <aside className={`home-sidebar ${isMenuOpen ? 'is-open' : ''}`}>
        <div className="home-sidebar-header">
          <Link to="/home" className="home-logo-link" onClick={handleNavAction} aria-label="Go to home page">
            <img
              src={charlotteLogoWhite}
              alt="UNC Charlotte logo"
              className="home-sidebar-logo"
            />
          </Link>

          <Link to="/profile" className="profile-button" onClick={handleNavAction}>
            <span className="profile-avatar">
              {user?.profile_image_url ? (
                <img src={user.profile_image_url} alt="" className="profile-avatar__img" />
              ) : (
                userInitial
              )}
            </span>
            <span className="profile-copy">
              <span className="profile-name">{displayName}</span>
              <span className="profile-year">{classYear}</span>
            </span>
          </Link>

          <button
            type="button"
            className="home-menu-toggle"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <span className="home-menu-toggle-bar" />
            <span className="home-menu-toggle-bar" />
            <span className="home-menu-toggle-bar" />
          </button>
        </div>

        <div className="home-sidebar-menu">
          <nav className="home-nav">
            <Link to="/completed" className="home-nav-link" onClick={handleNavAction}>Completed Traditions</Link>
            <Link to="/pending" className="home-nav-link" onClick={handleNavAction}>Pending Traditions</Link>
            <a href="#notifications" className="home-nav-link" onClick={handleNavAction}>Notifications</a>
            <a href="#feedback" className="home-nav-link" onClick={handleNavAction}>Feedback</a>
            <Link to="/help" className="home-nav-link" onClick={handleNavAction}>Help</Link>
          </nav>

          <button
            onClick={() => {
              handleNavAction();
              onLogout();
            }}
            className="logout-btn"
            type="button"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="home-main">{children}</main>
    </div>
  );
}

export default DashboardShell;
