import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardShell from '../components/DashboardShell';
import './AdminStaff.css';

const API = 'http://localhost:3000/api';

function AdminStaff() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    graduation_year: new Date().getFullYear(),
  });
  const [staffUsers, setStaffUsers] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const loadStaffUsers = async () => {
    try {
      const response = await axios.get(`${API}/auth/staff`, { withCredentials: true });
      setStaffUsers(response.data.staff || []);
    } catch (error) {
      console.error('Error loading staff users', error);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      try {
        const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
        const currentUser = response.data.user;
        if (currentUser.role !== 'admin') {
          navigate('/home');
          return;
        }
        if (!cancelled) {
          setUser(currentUser);
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          navigate('/login');
        }
      }
    }

    async function fetchStaffUsers() {
      if (cancelled) return;
      await loadStaffUsers();
    }

    fetchUser();
    fetchStaffUsers();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post(`${API}/auth/staff`, formData, {
        withCredentials: true,
      });

      setMessage({ type: 'success', text: 'Staff user created successfully.' });
      setFormData({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        graduation_year: new Date().getFullYear(),
      });
      console.log('Created staff user:', response.data.user);
      await loadStaffUsers();
    } catch (error) {
      const errorText = error?.response?.data?.error || 'Unable to create staff user.';
      setMessage({ type: 'error', text: errorText });
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm('Delete this staff user?')) {
      return;
    }

    setMessage({ type: '', text: '' });

    try {
      await axios.delete(`${API}/auth/staff/${staffId}`, { withCredentials: true });
      setMessage({ type: 'success', text: 'Staff user deleted successfully.' });
      await loadStaffUsers();
    } catch (error) {
      const errorText = error?.response?.data?.error || 'Unable to delete staff user.';
      setMessage({ type: 'error', text: errorText });
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <DashboardShell user={user} onLogout={handleLogout}>
      <div className="admin-staff">
        <section className="admin-staff__hero">
          <p className="admin-staff__eyebrow">Admin tools</p>
          <h1>Create Staff Account</h1>
          <p>Invite trusted university staff members to manage tradition review and content moderation.</p>
        </section>

        <section className="admin-staff__card">
          {message.text && (
            <div className={`admin-staff__message admin-staff__message--${message.type}`}>
              {message.text}
            </div>
          )}

          <form className="admin-staff__form" onSubmit={handleSubmit}>
            <label>
              Username
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                minLength={3}
                maxLength={15}
              />
            </label>

            <label>
              First name
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                maxLength={32}
              />
            </label>

            <label>
              Last name
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                maxLength={32}
              />
            </label>

            <label>
              Email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </label>

            <label>
              Graduation year
              <input
                type="number"
                name="graduation_year"
                value={formData.graduation_year}
                onChange={handleChange}
                required
                min="1900"
                max="2100"
              />
            </label>

            <button type="submit" className="admin-staff__submit">Create Staff User</button>
          </form>
        </section>

        <section className="admin-staff__card admin-staff__staff-list">
          <h2>Current Staff Users</h2>
          {staffUsers.length === 0 ? (
            <p className="admin-staff__empty">No staff accounts found.</p>
          ) : (
            <div className="admin-staff__table-wrap">
              <table className="admin-staff__table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Class Year</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffUsers.map((staff) => (
                    <tr key={staff.user_id}>
                      <td>{staff.username}</td>
                      <td>{staff.first_name} {staff.last_name}</td>
                      <td>{staff.email}</td>
                      <td>{staff.graduation_year}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-staff__delete"
                          onClick={() => handleDeleteStaff(staff.user_id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

export default AdminStaff;
