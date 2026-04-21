import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardShell from '../components/DashboardShell';
import './SuggestTradition.css';

const API = 'http://localhost:3000/api';
const BACKEND = API.replace('/api', '');
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

function SuggestTradition() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    intermittent: false,
    tags: '',
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const categories = [
    { value: 'sports', label: 'Sports' },
    { value: 'academic', label: 'Academic' },
    { value: 'social', label: 'Social' },
  ];

  const availableTags = [
    'sports', 'academic', 'social', 'club', 'engagement',
    'landmark', 'food', 'event', 'oncampus', 'offcampus',
    'datesensitive', 'misc'
  ];

  const loadUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(response.data.user);
      return response.data.user;
    } catch (err) {
      console.error('Not authenticated:', err);
      navigate('/login');
      throw err;
    }
  };

  const checkAuthentication = async () => {
    try {
      await loadUser();
      setLoading(false);
    } catch (err) {
      // Error handled in loadUser
    }
  };

  React.useEffect(() => {
    checkAuthentication();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file.' });
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setMessage({ type: 'error', text: `Image must be under ${MAX_IMAGE_BYTES / (1024 * 1024)}MB.` });
      return;
    }

    setSelectedImage(file);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      setMessage({ type: '', text: '' });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      setMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    if (!selectedImage) {
      setMessage({ type: 'error', text: 'Please select an image for your tradition suggestion.' });
      return;
    }

    setSubmitting(true);

    try {
      // First upload the image
      const imageFormData = new FormData();
      imageFormData.append('image', selectedImage);

      const uploadResponse = await axios.post(
        `${API}/traditions/upload-image`,
        imageFormData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      // Then submit the suggestion
      const suggestionData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        image: uploadResponse.data.image,
        tags: formData.tags.trim(),
      };

      await axios.post(`${API}/traditions/suggestions`, suggestionData, {
        withCredentials: true,
      });

      setMessage({
        type: 'success',
        text: 'Your tradition suggestion has been submitted! It will be reviewed by an administrator.'
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        intermittent: false,
        tags: '',
      });
      setSelectedImage(null);
      setImagePreview(null);

    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to submit tradition suggestion.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
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
      <div className="suggest-page">
        <header className="suggest-page__header">
          <h1 className="suggest-page__title">Suggest a Tradition</h1>
          <p className="suggest-page__subtitle">
            Have an idea for a new tradition? Submit it here and our administrators will review it.
            All suggestions help make our campus community stronger!
          </p>
        </header>

        <form className="suggest-form" onSubmit={handleSubmit}>
          {message.text && (
            <div className={`suggest-alert suggest-alert--${message.type}`} role="status">
              {message.text}
            </div>
          )}

          <div className="suggest-section">
            <h2 className="suggest-section__title">Basic Information</h2>

            <label className="suggest-field">
              <span className="suggest-field__label">
                Tradition Title <span className="required">*</span>
              </span>
              <input
                className="suggest-field__input"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                maxLength={255}
                placeholder="e.g., Midnight Breakfast at the Social 704"
                required
              />
            </label>

            <label className="suggest-field">
              <span className="suggest-field__label">
                Description <span className="required">*</span>
              </span>
              <textarea
                className="suggest-field__textarea"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                maxLength={1000}
                placeholder="Describe what this tradition involves, when it happens, and why it's meaningful..."
                rows={4}
                required
              />
            </label>

            <label className="suggest-field">
              <span className="suggest-field__label">
                Category <span className="required">*</span>
              </span>
              <select
                className="suggest-field__select"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </label>

            <label className="suggest-field suggest-field--checkbox">
              <input
                type="checkbox"
                name="intermittent"
                checked={formData.intermittent}
                onChange={handleInputChange}
              />
              <span className="suggest-field__label">
                This is an intermittent/special occasion tradition
              </span>
            </label>
          </div>

          <div className="suggest-section">
            <h2 className="suggest-section__title">Tags & Image</h2>

            <label className="suggest-field">
              <span className="suggest-field__label">Tags (optional)</span>
              <input
                className="suggest-field__input"
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="e.g., food, social, oncampus (comma-separated)"
              />
              <small className="suggest-field__help">
                Available tags: {availableTags.join(', ')}
              </small>
            </label>

            <div className="suggest-image-section">
              <span className="suggest-field__label">
                Tradition Image <span className="required">*</span>
              </span>

              {imagePreview ? (
                <div className="suggest-image-preview">
                  <img
                    src={imagePreview}
                    alt="Tradition preview"
                    className="suggest-image-preview__img"
                  />
                  <button
                    type="button"
                    className="suggest-image-preview__remove"
                    onClick={handleRemoveImage}
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="suggest-image-upload">
                  <label className="suggest-upload-btn">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      style={{ display: 'none' }}
                    />
                    Choose Image
                  </label>
                  <p className="suggest-upload-help">
                    PNG or JPG, up to 5MB. This will help others understand your tradition suggestion.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="suggest-actions">
            <button
              type="submit"
              className="suggest-submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Tradition Suggestion'}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}

export default SuggestTradition;