import { Link } from 'react-router-dom';
import charlotteLogoWhite from '../assets/homepage/charlotteLogoWhite.png';
import '../pages/Home.css';

function DashboardShell({ user, onLogout, children }) {
  const classYear = user?.graduation_year ? `Class of ${user.graduation_year}` : 'Class Year N/A';
  const displayName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'User';
  const userInitial = (user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase();

  return (
    <div className="home-shell">
      <aside className="home-sidebar">
        <img
          src={charlotteLogoWhite}
          alt="UNC Charlotte logo"
          className="home-sidebar-logo"
        />

        <Link to="/profile" className="profile-button">
          <span className="profile-avatar">{userInitial}</span>
          <span className="profile-copy">
            <span className="profile-name">{displayName}</span>
            <span className="profile-year">{classYear}</span>
          </span>
        </Link>

        <nav className="home-nav">
          <a href="#completed" className="home-nav-link">Completed Traditions</a>
          <Link to="/home#traditions" className="home-nav-link">Pending Traditions</Link>
          <a href="#notifications" className="home-nav-link">Notifications</a>
          <a href="#feedback" className="home-nav-link">Feedback</a>
          <a href="#about" className="home-nav-link">About</a>
        </nav>

        <button onClick={onLogout} className="logout-btn" type="button">Logout</button>
      </aside>

      <main className="home-main">{children}</main>
    </div>
  );
}

export default DashboardShell;
