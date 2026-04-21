import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardShell from '../components/DashboardShell';
import './PendingTraditions.css';

const API_BASE_URL = 'http://localhost:3000/api';
const BACKEND_URL = 'http://localhost:3000';

function resolveImage(image) {
  if (!image) return '';
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  if (image.startsWith('/')) return `${BACKEND_URL}${image}`;
  return `${BACKEND_URL}/${image}`;
}

function formatDateTime(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

function PendingTraditions() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [traditions, setTraditions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedTraditionId, setSelectedTraditionId] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [studentSelectedSubmission, setStudentSelectedSubmission] = useState(null);

  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const checkAuthentication = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        withCredentials: true,
      });
      const authUser = response.data.user;
      setUser(authUser);
      return authUser;
    } catch (err) {
      console.error('Not authenticated:', err);
      navigate('/login');
      return null;
    }
  }, [navigate]);

  const fetchTraditions = useCallback(async (preferredTraditionId = null) => {
    const response = await axios.get(`${API_BASE_URL}/traditions/review/pending-traditions`, {
      withCredentials: true,
    });

    const queue = Array.isArray(response.data.traditions) ? response.data.traditions : [];
    setTraditions(queue);

    const nextTraditionId = queue.some((tradition) => tradition.tradition_id === preferredTraditionId)
      ? preferredTraditionId
      : (queue[0]?.tradition_id ?? null);

    setSelectedTraditionId(nextTraditionId);
    return nextTraditionId;
  }, []);

  const fetchSubmissions = useCallback(async (traditionId) => {
    if (!traditionId) {
      setSubmissions([]);
      setSelectedSubmission(null);
      return;
    }

    const response = await axios.get(`${API_BASE_URL}/traditions/review/traditions/${traditionId}/submissions`, {
      withCredentials: true,
    });

    const list = Array.isArray(response.data.submissions) ? response.data.submissions : [];
    setSubmissions(list);
    setSelectedSubmission((current) => (
      current && list.some((submission) => submission.submission_id === current.submission_id)
        ? current
        : null
    ));
  }, []);

  const fetchStudentPending = useCallback(async () => {
    const response = await axios.get(`${API_BASE_URL}/traditions/submissions/me/pending`, {
      withCredentials: true,
    });
    const list = Array.isArray(response.data.submissions) ? response.data.submissions : [];
    setStudentSubmissions(list);
    setStudentSelectedSubmission(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const authUser = await checkAuthentication();
      if (!authUser || cancelled) return;

      if (authUser.role === 'staff' || authUser.role === 'admin') {
        await fetchTraditions();
      } else {
        await fetchStudentPending();
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [checkAuthentication, fetchTraditions, fetchStudentPending]);

  useEffect(() => {
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
      return undefined;
    }

    if (!selectedTraditionId) {
      setSubmissions([]);
      setSelectedSubmission(null);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        await fetchSubmissions(selectedTraditionId);
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching submissions:', error);
          setSubmissions([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedTraditionId, fetchSubmissions, user]);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
        withCredentials: true,
      });
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const openSubmissionDetails = (submission) => {
    setSelectedSubmission(submission);
    setReviewComment(submission.admin_comment || '');
  };

  const closeSubmissionDetails = () => {
    setSelectedSubmission(null);
    setReviewComment('');
  };

  const handleCardKeyDown = (event, submission) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openSubmissionDetails(submission);
    }
  };

  const handleReview = async (action) => {
    if (!selectedSubmission) return;

    const submissionToReview = selectedSubmission;
    const trimmedComment = reviewComment.trim();
    if (action === 'deny' && !trimmedComment) {
      setMessage({ type: 'error', text: 'Please add a comment before denying a submission.' });
      return;
    }

    // Close details immediately so reviewers can continue working while refresh happens.
    closeSubmissionDetails();
    setReviewing(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.patch(
        `${API_BASE_URL}/traditions/review/submissions/${submissionToReview.submission_id}`,
        {
          action,
          admin_comment: trimmedComment,
        },
        { withCredentials: true },
      );

      const nextTraditionId = await fetchTraditions(selectedTraditionId);
      if (nextTraditionId) {
        await fetchSubmissions(nextTraditionId);
      } else {
        setSubmissions([]);
      }

      setMessage({
        type: 'success',
        text: action === 'approve' ? 'Submission approved.' : 'Submission denied.',
      });
    } catch (error) {
      try {
        const nextTraditionId = await fetchTraditions(selectedTraditionId);
        if (nextTraditionId) {
          await fetchSubmissions(nextTraditionId);
        } else {
          setSubmissions([]);
        }
      } catch (refreshError) {
        console.error('Error refreshing review queue after failed review request:', refreshError);
      }

      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to review submission.',
      });
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const isReviewer = user?.role === 'staff' || user?.role === 'admin';
  const selectedTradition = traditions.find((tradition) => tradition.tradition_id === selectedTraditionId) || null;

  if (!isReviewer) {
    return (
      <DashboardShell user={user} onLogout={handleLogout}>
        <div className="student-pending-page">
          <header className="student-pending-header">
            <h1>Pending Traditions</h1>
            <p>These are your submitted traditions that are still waiting for staff approval.</p>
          </header>

          {studentSubmissions.length === 0 ? (
            <p className="student-pending-empty">You currently have no submissions waiting for approval.</p>
          ) : (
            <div className="student-pending-grid">
              {studentSubmissions.map((submission) => (
                <article
                  key={submission.submission_id}
                  className="student-pending-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => setStudentSelectedSubmission(submission)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setStudentSelectedSubmission(submission);
                    }
                  }}
                >
                  {submission.tradition?.image && (
                    <img
                      className="student-pending-card__image"
                      src={resolveImage(submission.tradition.image)}
                      alt={submission.tradition?.title || 'Tradition'}
                    />
                  )}
                  <div className="student-pending-card__body">
                    <h3>{submission.tradition?.title || 'Pending tradition'}</h3>
                    <p><strong>Submitted:</strong> {formatDateTime(submission.submitted_at)}</p>
                    <p><strong>Status:</strong> {submission.status}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {studentSelectedSubmission && (
          <div className="pending-modal-backdrop" onClick={() => setStudentSelectedSubmission(null)}>
            <div className="student-pending-modal" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                className="student-pending-modal__close"
                onClick={() => setStudentSelectedSubmission(null)}
                aria-label="Close submission details"
              >
                ×
              </button>

              <div className="student-pending-modal__content">
                <h3 className="student-pending-modal__title">
                  {studentSelectedSubmission.tradition?.title || 'Pending tradition'}
                </h3>
                <p className="student-pending-modal__submitted">
                  Submitted {formatDateTime(studentSelectedSubmission.submitted_at)}
                </p>

                <h4 className="student-pending-modal__label">Submission text</h4>
                <p className="student-pending-modal__text">
                  {studentSelectedSubmission.text_submission || 'No text submission was provided.'}
                </p>

                <h4 className="student-pending-modal__label">Submission image</h4>
                {studentSelectedSubmission.image_submission ? (
                  <img
                    className="student-pending-modal__image"
                    src={resolveImage(studentSelectedSubmission.image_submission)}
                    alt="Your submission"
                  />
                ) : (
                  <p className="student-pending-modal__text">No image submitted.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </DashboardShell>
    );
  }

  return (
    <DashboardShell user={user} onLogout={handleLogout}>
      <div className="pending-review-page">
        <header className="pending-review-header">
          <div>
            <p className="pending-review-kicker">Tradition approval queue</p>
            <h1>Pending Traditions</h1>
            <p>
              Review each tradition, inspect every student submission from oldest to newest, and approve or deny with a comment.
            </p>
          </div>

          {message.text && (
            <div className={`pending-review-alert pending-review-alert--${message.type}`} role="status">
              {message.text}
            </div>
          )}
        </header>

        <div className="pending-review-layout">
          <aside className="pending-review-traditions">
            <div className="pending-review-panel-title">Traditions awaiting review</div>
            {traditions.length === 0 ? (
              <p className="pending-review-empty">No traditions have pending submissions right now.</p>
            ) : (
              traditions.map((tradition) => (
                <button
                  type="button"
                  key={tradition.tradition_id}
                  className={`pending-review-tradition ${selectedTraditionId === tradition.tradition_id ? 'is-active' : ''}`}
                  onClick={() => {
                    setSelectedTraditionId(tradition.tradition_id);
                    setSelectedSubmission(null);
                    setReviewComment('');
                    setMessage({ type: '', text: '' });
                  }}
                >
                  {tradition.image && (
                    <img className="pending-review-tradition__img" src={resolveImage(tradition.image)} alt={tradition.title} />
                  )}
                  <div className="pending-review-tradition__body">
                    <strong>{tradition.title}</strong>
                    <span>{tradition.pending_submission_count} pending submission{tradition.pending_submission_count === 1 ? '' : 's'}</span>
                  </div>
                </button>
              ))
            )}
          </aside>

          <section className="pending-review-submissions">
            <div className="pending-review-panel-title">
              {selectedTradition ? selectedTradition.title : 'Select a tradition'}
            </div>

            {!selectedTradition ? (
              <p className="pending-review-empty">Pick a tradition on the left to inspect submissions.</p>
            ) : submissions.length === 0 ? (
              <p className="pending-review-empty">There are no pending submissions for this tradition.</p>
            ) : (
              <div className="pending-review-submission-list">
                {submissions.map((submission) => (
                  <article
                    key={submission.submission_id}
                    className={`pending-review-submission ${selectedSubmission?.submission_id === submission.submission_id ? 'is-active' : ''}`}
                    onClick={() => openSubmissionDetails(submission)}
                    onKeyDown={(event) => handleCardKeyDown(event, submission)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="pending-review-submission__meta">
                      <strong>
                        {submission.user.first_name} {submission.user.last_name}
                      </strong>
                      <span>@{submission.user.username}</span>
                      <span>Class of {submission.user.graduation_year}</span>
                      <span>{formatDateTime(submission.submitted_at)}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {selectedSubmission && (
        <div className="pending-modal-backdrop" onClick={closeSubmissionDetails}>
          <div className="pending-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="pending-modal__close"
              onClick={closeSubmissionDetails}
              aria-label="Close submission details"
            >
              ×
            </button>

            <div className="pending-modal__content-grid">
              <div className="pending-modal__left-col">
                <div>
                  <div>
                    <h3 className="pending-modal__title">
                      {selectedSubmission.tradition?.title || 'Pending Submission'}
                    </h3>
                    <p className="pending-modal__subtitle">
                      Submitted {formatDateTime(selectedSubmission.submitted_at)}
                    </p>
                  </div>

                  <div className="pending-modal__top-row">
                    <div className="pending-modal__student-card">
                      <div className="pending-modal__avatar">
                        {selectedSubmission.user.profile_image_url ? (
                          <img src={resolveImage(selectedSubmission.user.profile_image_url)} alt="" />
                        ) : (
                          selectedSubmission.user.first_name?.[0] || selectedSubmission.user.username?.[0] || 'U'
                        )}
                      </div>
                      <div>
                        <strong>{selectedSubmission.user.first_name} {selectedSubmission.user.last_name}</strong>
                        <p>@{selectedSubmission.user.username}</p>
                        <p>Class of {selectedSubmission.user.graduation_year}</p>
                      </div>
                    </div>

                    <div className="pending-modal__section pending-modal__text-inline">
                      <h4>Submission text</h4>
                      <p>{selectedSubmission.text_submission || 'No text submission was provided.'}</p>
                    </div>
                  </div>
                </div>

                <div className="pending-modal__section">
                  <h4>Submission image</h4>
                  <img
                    className="pending-modal__submission-image"
                    src={resolveImage(selectedSubmission.image_submission)}
                    alt="Student submission"
                  />
                </div>
              </div>

              <div className="pending-modal__right-col">
                <div className="pending-modal__section pending-modal__review-panel">
                  <h4>Staff review</h4>
                  <label className="pending-modal__comment-field">
                    <span>Staff comment</span>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Add a reason, note, or follow-up instruction"
                      rows={8}
                    />
                  </label>

                  <div className="pending-modal__actions">
                    <button
                      type="button"
                      className="pending-modal__button pending-modal__button--approve"
                      onClick={() => handleReview('approve')}
                      disabled={reviewing}
                    >
                      {reviewing ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      className="pending-modal__button pending-modal__button--deny"
                      onClick={() => handleReview('deny')}
                      disabled={reviewing}
                    >
                      {reviewing ? 'Processing...' : 'Deny'}
                    </button>
                  </div>
                </div>

                {selectedSubmission.tradition?.description && (
                  <div className="pending-modal__section pending-modal__section--nested">
                    <h4>Tradition description</h4>
                    <p>{selectedSubmission.tradition.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default PendingTraditions;
