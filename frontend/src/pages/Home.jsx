// Home Page Component
// Main page after user logs in
// Currently a placeholder - will eventually show bucket list challenges

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardShell from '../components/DashboardShell';
import './Home.css';

// Tag color mapping (can be extended)
const TAG_COLORS = {
  sports: '#00703c',
  academic: '#1e88e5',
  social: '#e65100',
  club: '#6d4c41',
  engagement: '#c62828',
  landmark: '#ad1457',
  food: '#fbc02d',
  event: '#3949ab',
  oncampus: '#388e3c',
  offcampus: '#00838f',
  datesensitive: '#5e35b1',
  misc: '#757575',
};

function TagBadge({ tag }) {
  const color = TAG_COLORS[tag] || '#888';
  return (
    <span
      className="tradition-tag-badge"
      style={{
        backgroundColor: color,
      }}
    >
      {tag}
    </span>
  );
}

const API_BASE_URL = 'http://localhost:3000';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80';

function formatDateTime(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

function resolveTraditionImage(image, cacheToken) {
  if (!image) return FALLBACK_IMAGE;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  const separator = image.includes('?') ? '&' : '?';
  if (image.startsWith('/')) return `${API_BASE_URL}${image}${separator}v=${cacheToken}`;
  return `${API_BASE_URL}/${image}${separator}v=${cacheToken}`;
}

function normalizeTraditions(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload?.traditions && Array.isArray(payload.traditions)) return payload.traditions;
  return [];
}

function Home() {
  const imageCacheToken = useState(() => Date.now())[0];
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTags, setSearchTags] = useState('');
  const [traditions, setTraditions] = useState([]);
  const [activeTradition, setActiveTradition] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  const [submissionImage, setSubmissionImage] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const navigate = useNavigate();
  const canCreateSubmission = !submissionStatus || submissionStatus.status === 'denied';
  const hasLockedSubmission = Boolean(submissionStatus && !canCreateSubmission);

  useEffect(() => {
    let cancelled = false;

    axios.get('http://localhost:3000/api/auth/me', {
      withCredentials: true,
    })
      .then((response) => {
        if (cancelled) return;
        const authUser = response.data.user;
        if (authUser.role !== 'student') {
          navigate(authUser.role === 'admin' ? '/admin' : '/staff');
          return;
        }
        setUser(authUser);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Not authenticated:', err);
        navigate('/login');
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

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

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    axios.get(`http://localhost:3000/api/traditions?search=${searchTerm}&tags=${searchTags}`, {
      withCredentials: true,
    })
      .then((response) => {
        if (cancelled) return;
        setTraditions(normalizeTraditions(response.data));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Error fetching traditions:', err);
        setTraditions([]);
      });

    return () => {
      cancelled = true;
    };
  }, [searchTerm, user]);

  const fetchSubmissionStatus = async (traditionId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/traditions/${traditionId}/submissions/me`,
        { withCredentials: true },
      );
      setSubmissionStatus(response.data.submission || null);
    } catch (err) {
      console.error('Error fetching submission status:', err);
      setSubmissionStatus(null);
    }
  };

  const handleViewDetails = (item) => {
    setActiveTradition(item);
    setIsDetailsOpen(true);
    setIsSubmissionOpen(false);
    setSubmissionImage(null);
    setSubmissionText('');
    setSubmissionError('');
    fetchSubmissionStatus(item.tradition_id ?? item.id);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
    setIsSubmissionOpen(false);
    setActiveTradition(null);
    setSubmissionImage(null);
    setSubmissionText('');
    setSubmissionError('');
  };

  const handleSubmitSubmission = async (e) => {
    e.preventDefault();
    if (!activeTradition) return;
    if (!canCreateSubmission) {
      setSubmissionError('You can only submit again after your previous submission is denied.');
      return;
    }
    if (!submissionImage) {
      setSubmissionError('Please upload an image.');
      return;
    }
    if (!submissionText.trim()) {
      setSubmissionError('Please add a text submission.');
      return;
    }

    setSubmitting(true);
    setSubmissionError('');

    try {
      const formData = new FormData();
      formData.append('image_submission', submissionImage);
      formData.append('text_submission', submissionText.trim());

      const traditionId = activeTradition.tradition_id ?? activeTradition.id;
      const response = await axios.post(
        `${API_BASE_URL}/api/traditions/${traditionId}/submissions`,
        formData,
        { withCredentials: true },
      );

      setSubmissionStatus(response.data.submission || null);
      setIsSubmissionOpen(false);
      setSubmissionImage(null);
      setSubmissionText('');
    } catch (err) {
      console.error('Error submitting tradition:', err);
      if (err?.response?.data?.error) {
        setSubmissionError(err.response.data.error);
      } else if (err?.message) {
        setSubmissionError(`Failed to submit tradition: ${err.message}`);
      } else {
        setSubmissionError('Failed to submit tradition.');
      }
    } finally {
      setSubmitting(false);
    }
  };

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
            }}
          />
        </div>
      </section>

      <section className="home-traditions-grid" id="traditions">
        {searchTerm && traditions.length === 0 && (
          <p className="traditions-empty">&quot;{searchTerm}&quot; not found.</p>
        )}

        {!searchTerm && traditions.length === 0 && (
          <p className="traditions-empty">No traditions available yet.</p>
        )}

        {traditions.map((item, index) => {
          const normalizedTags = Array.isArray(item.tags)
            ? item.tags.map((t) => (t?.tag || t)).filter(Boolean)
            : [];
          const displayTags = normalizedTags.length > 0
            ? normalizedTags
            : (item.category ? [item.category] : []);

          return (
          <article key={item.tradition_id ?? item.id ?? `t-${index}`} className="home-tradition-card">
            <div className="home-tradition-card__media">
              <img
                src={resolveTraditionImage(item.image, imageCacheToken)}
                alt={item.title ? `${item.title}` : 'Tradition'}
              />
            </div>
            <div className="home-tradition-card__body">
              <h3>{item.title}</h3>
              {item.description && <p>{item.description}</p>}
              {displayTags.length > 0 && (
                <div className="home-tradition-tags-row">
                  {displayTags.map((tag, i) => (
                    <TagBadge key={`${tag}-${i}`} tag={tag} />
                  ))}
                </div>
              )}
              <button
                type="button"
                className="complete-btn"
                onClick={() => handleViewDetails(item)}
              >
                View Details
              </button>
            </div>
          </article>
          );
        })}
      </section>

      {isDetailsOpen && activeTradition && (
        <div className="home-modal-backdrop" onClick={closeDetails} data-testid="tradition-modal-backdrop">
          <div className="home-modal" onClick={(e) => e.stopPropagation()} data-testid="tradition-modal-content">
            <button type="button" className="home-modal-close" onClick={closeDetails}>
              ×
            </button>

            <div className="home-modal-banner">
              <img
                src={resolveTraditionImage(activeTradition.image, imageCacheToken)}
                alt={activeTradition.title ? `${activeTradition.title}` : 'Tradition'}
              />
            </div>

            <div className="home-modal-content">
              <div className="home-modal-layout">
                <div className="home-modal-left">
                  <h2>{activeTradition.title}</h2>

                  <div className="home-tradition-tags-row">
                    {(() => {
                      const detailTags = (Array.isArray(activeTradition.tags) ? activeTradition.tags : [])
                        .map((t) => (t?.tag || t))
                        .filter(Boolean);
                      const tagsToDisplay = detailTags.length > 0
                        ? detailTags
                        : (activeTradition.category ? [activeTradition.category] : []);

                      return tagsToDisplay.map((tag, i) => (
                        <TagBadge key={`${tag}-${i}`} tag={tag} />
                      ));
                    })()}
                  </div>

                  {activeTradition.description && (
                    <p className="home-modal-description">{activeTradition.description}</p>
                  )}
                </div>

                <div className="home-modal-right">
                  <div className="home-modal-status">
                    <h4>Submission Status</h4>
                    {!submissionStatus && <p>No submission yet.</p>}
                    {submissionStatus && (
                      <div className="home-modal-status-card">
                        <p><strong>Status:</strong> {submissionStatus.status}</p>
                        <p><strong>Submitted:</strong> {formatDateTime(submissionStatus.submitted_at)}</p>
                        {submissionStatus.admin_comment && (
                          <p><strong>Admin Comment:</strong> {submissionStatus.admin_comment}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="home-modal-actions">
                    {canCreateSubmission && (
                      <button
                        type="button"
                        className="complete-btn"
                        onClick={() => {
                          setIsSubmissionOpen(true);
                          setSubmissionError('');
                        }}
                      >
                        Make Submission
                      </button>
                    )}
                  </div>

                  {hasLockedSubmission && (
                    <div className="home-submitted-preview">
                      <h4>Your Submitted Proof</h4>
                      {submissionStatus.image_submission && (
                        <img
                          className="home-submitted-preview__image"
                          src={resolveTraditionImage(submissionStatus.image_submission, imageCacheToken)}
                          alt="Your submitted proof"
                        />
                      )}
                      <p className="home-submitted-preview__text">
                        {submissionStatus.text_submission || 'No text submission was provided.'}
                      </p>
                    </div>
                  )}

                  {isSubmissionOpen && canCreateSubmission && (
                    <form className="home-submission-form" onSubmit={handleSubmitSubmission}>
                      <label htmlFor="submission-image">Image Proof</label>
                      <input
                        id="submission-image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSubmissionImage(e.target.files?.[0] || null)}
                      />

                      <label htmlFor="submission-text">Text Submission</label>
                      <textarea
                        id="submission-text"
                        rows={5}
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        placeholder="Add your submission details here..."
                      />

                      {submissionError && <p className="home-submission-error">{submissionError}</p>}

                      <div className="home-submission-actions">
                        <button type="submit" className="complete-btn" disabled={submitting}>
                          {submitting ? 'Submitting...' : 'Submit'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default Home;
