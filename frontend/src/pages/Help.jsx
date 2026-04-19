import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardShell from '../components/DashboardShell';
import './Help.css';

const API = 'http://localhost:3000/api';
const ACCORDION_ID = 'help-faq-accordion';

function Help() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [issueType, setIssueType] = useState('');
  const [issueDetails, setIssueDetails] = useState('');
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [issueMessage, setIssueMessage] = useState({ type: '', text: '' });
  const [showSubmissionPopup, setShowSubmissionPopup] = useState(false);
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  const checkAuthentication = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(response.data.user);
      setLoading(false);
    } catch (err) {
      console.error('Not authenticated:', err);
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    mountedRef.current = true;
    checkAuthentication();
    return () => {
      mountedRef.current = false;
    };
  }, [checkAuthentication]);

  useEffect(() => {
    if (loading || !user) return undefined;

    const $ = window.jQuery;
    if (!$ || !$.fn || !$.fn.accordion) {
      return undefined;
    }

    const $el = $(`#${ACCORDION_ID}`);
    if (!$el.length) return undefined;

    $el.accordion({
      heightStyle: 'content',
      collapsible: true,
      active: false,
      animate: 200,
    });

    return () => {
      try {
        if ($el.hasClass('ui-accordion')) {
          $el.accordion('destroy');
        }
      } catch {
        /* ignore if already destroyed */
      }
    };
  }, [loading, user]);

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    setIssueMessage({ type: '', text: '' });

    if (!issueType) {
      setIssueMessage({ type: 'error', text: 'Please select an issue type.' });
      return;
    }
    if (issueDetails.trim().length < 10) {
      setIssueMessage({
        type: 'error',
        text: 'Please add a few more details (at least 10 characters).',
      });

    // place api call here.
    // const response axios.post(`${API}/reports`, stuff);
    

      return;
    }

    setSubmittingIssue(true);

    // Placeholder submission flow; backend endpoint will be connected later.
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!mountedRef.current) return;

    setSubmittingIssue(false);
    setIssueType('');
    setIssueDetails('');
    setIssueMessage({ type: '', text: '' });
    setShowSubmissionPopup(true);
  };

  useEffect(() => {
    if (!showSubmissionPopup) return undefined;

    const timer = setTimeout(() => {
      setShowSubmissionPopup(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showSubmissionPopup]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <DashboardShell user={user} onLogout={handleLogout}>
      <div className="help-page">
        <header className="help-page__header">
          <h1 className="help-page__title">Help &amp; FAQ</h1>
          <p className="help-page__intro">
            Quick answers about Norm&apos;s Bucketlist. Expand a topic below to learn more.
          </p>
        </header>

        <div id={ACCORDION_ID} className="help-faq-accordion">
          <h3>How do I complete a tradition?</h3>
          <div>
            <p>
              From <strong>Home</strong> or <strong>Pending Traditions</strong>, find a tradition card
              and choose <strong>Mark Complete</strong> when you&apos;ve finished the activity. Some
              traditions may require approval later—your list will update when the status changes.
            </p>
          </div>

          <h3>How do I change my account information?</h3>
          <div>
            <p>
              Open <strong>Profile</strong> from your sidebar (tap your name and photo at the top).
              There you can update your name, username, graduation year, profile photo, and password.
              Your UNCC email and role are set by the app and aren&apos;t editable on this screen.
            </p>
          </div>

          <h3>How do I change my password?</h3>
          <div>
            <p>
              Go to <strong>Profile</strong> → <strong>Change password</strong>. Enter your current
              password, then your new password twice. Use at least six characters.
            </p>
          </div>

          <h3>What&apos;s the difference between Pending and Completed?</h3>
          <div>
            <p>
              <strong>Pending Traditions</strong> are ones you haven&apos;t finished yet (or that are
              still in progress). <strong>Completed Traditions</strong> shows what you&apos;ve already
              checked off—use it to track your progress through Norm&apos;s Bucketlist.
            </p>
          </div>

          <h3>How does search work on Home?</h3>
          <div>
            <p>
              Use the search bar at the top of <strong>Home</strong> to filter traditions by keywords
              in the title or description. Clear the search to see the full list again.
            </p>
          </div>

          <h3>How do I use the sidebar?</h3>
          <div>
            <p>
              The green sidebar lists shortcuts: Completed and Pending traditions, plus this{' '}
              <strong>Help</strong> page. On smaller screens, use the menu button to open navigation.
              Your profile shortcut is the block at the top with your photo or initials.
            </p>
          </div>

          <h3>Who can I contact if something isn&apos;t working?</h3>
          <div>
            <p>
              If you run into bugs or need account help, contact your course staff or project
              administrators. This FAQ will grow as new features are added.
            </p>
          </div>
        </div>

        <section className="help-report-card">
          <h2 className="help-report-card__title">Report an Issue</h2>
          <p className="help-report-card__intro">
            Found a bug or having trouble? Submit your issue here and we will review it.
          </p>

          <form className="help-report-form" onSubmit={handleIssueSubmit}>
            {issueMessage.text && (
              <p className={`help-report-message help-report-message--${issueMessage.type}`}>
                {issueMessage.text}
              </p>
            )}

            <label className="help-report-field">
              <span>Issue type</span>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
              >
                <option value="">Select an issue...</option>
                <option value="traditions">Traditions feature issue</option>
                <option value="notifications">Notifications issue</option>
                <option value="profile">Profile/account issue</option>
                <option value="performance">Slow loading/performance issue</option>
                <option value="access">Denied access/login issue</option>
                <option value="other">Other issue</option>
              </select>
            </label>

            <label className="help-report-field">
              <span>Issue details</span>
              <textarea
                value={issueDetails}
                onChange={(e) => setIssueDetails(e.target.value)}
                placeholder="Describe what happened, what page you were on, and what you expected."
                rows={5}
              />
            </label>

            <button type="submit" className="help-report-submit" disabled={submittingIssue}>
              {submittingIssue ? 'Submitting...' : 'Submit Issue'}
            </button>
          </form>
        </section>
      </div>

      {showSubmissionPopup && (
        <div className="help-popup-overlay" role="status" aria-live="polite">
          <div className="help-popup">
            <h3>Submission Received</h3>
            <p>Thanks! Your issue report was submitted successfully.</p>
            <button
              type="button"
              className="help-popup-close"
              onClick={() => setShowSubmissionPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default Help;
