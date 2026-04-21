import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardShell from '../components/DashboardShell';
import './ManageTraditions.css';

const API_BASE_URL = 'http://localhost:3000';
const API = `${API_BASE_URL}/api`;
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80';

function resolveTraditionImage(image) {
  if (!image) return FALLBACK_IMAGE;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  if (image.startsWith('/')) return `${API_BASE_URL}${image}`;
  return `${API_BASE_URL}/${image}`;
}

function normalizeTraditions(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload?.traditions && Array.isArray(payload.traditions)) return payload.traditions;
  return [];
}

function parseTagInput(value) {
  return [...new Set(
    String(value || '')
      .split(',')
      .map((tag) => tag.trim().toLowerCase().replace(/[\s_-]+/g, ''))
      .filter(Boolean),
  )];
}

function truncateDescription(text) {
  if (typeof text !== 'string') return '';
  if (text.length <= 150) return text;
  return `${text.slice(0, 150)}...`;
}

function ManageTraditions() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [traditions, setTraditions] = useState([]);

  const [selectedTradition, setSelectedTradition] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    tagsText: '',
    imagePath: '',
  });
  const [newBannerFile, setNewBannerFile] = useState(null);

  const [addForm, setAddForm] = useState({
    title: '',
    description: '',
    selectedTags: [],
    imageFile: null,
  });

  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadTraditions = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/traditions?search=${encodeURIComponent(searchTerm)}`, {
        withCredentials: true,
      });
      setTraditions(normalizeTraditions(response.data));
    } catch (error) {
      console.error('Error loading traditions:', error);
      setTraditions([]);
      setMessage({ type: 'error', text: 'Failed to load traditions.' });
    }
  }, [searchTerm]);

  const loadTagOptions = useCallback(async () => {
    const response = await axios.get(`${API}/traditions/tags`, {
      withCredentials: true,
    });

    const tags = Array.isArray(response.data?.tags) ? response.data.tags : [];
    setAvailableTags(tags);
    return tags;
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
        const authUser = response.data.user;

        if (authUser.role !== 'staff' && authUser.role !== 'admin') {
          navigate('/home');
          return;
        }

        if (!cancelled) {
          setUser(authUser);
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          navigate('/login');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    loadTraditions();
  }, [user, loadTraditions]);

  useEffect(() => {
    if (!message.text) return undefined;

    const timeoutId = window.setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [message.text]);

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const openEditModal = (tradition) => {
    setSelectedTradition(tradition);
    setEditForm({
      title: tradition.title || '',
      description: tradition.description || '',
      tagsText: Array.isArray(tradition.tags)
        ? tradition.tags.map((tag) => tag?.tag || tag).filter(Boolean).join(', ')
        : '',
      imagePath: tradition.image || '',
    });
    setNewBannerFile(null);
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setSelectedTradition(null);
    setNewBannerFile(null);
  };

  const openAddModal = async () => {
    setMessage({ type: '', text: '' });
    setAddForm({
      title: '',
      description: '',
      selectedTags: [],
      imageFile: null,
    });

    try {
      await loadTagOptions();
      setIsAddOpen(true);
    } catch (error) {
      console.error('Error loading available tags:', error);
      setMessage({ type: 'error', text: 'Unable to load tags. Please try again.' });
    }
  };

  const toggleAddTag = (tag) => {
    setAddForm((prev) => {
      const exists = prev.selectedTags.includes(tag);
      return {
        ...prev,
        selectedTags: exists
          ? prev.selectedTags.filter((item) => item !== tag)
          : [...prev.selectedTags, tag],
      };
    });
  };

  const uploadBanner = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await axios.post(`${API}/traditions/upload-image`, formData, {
      withCredentials: true,
    });
    return response.data.image;
  };

  const handleSaveChanges = async () => {
    if (!selectedTradition) return;

    const title = editForm.title.trim();
    const description = editForm.description.trim();
    const tags = parseTagInput(editForm.tagsText);

    if (!title || !description) {
      setMessage({ type: 'error', text: 'Name and description are required.' });
      return;
    }

    if (!editForm.imagePath && !newBannerFile) {
      setMessage({ type: 'error', text: 'Banner image is required.' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      let imagePath = editForm.imagePath;
      if (newBannerFile) {
        imagePath = await uploadBanner(newBannerFile);
      }

      await axios.patch(
        `${API}/traditions/${selectedTradition.tradition_id}`,
        {
          title,
          description,
          image: imagePath,
          tags,
        },
        { withCredentials: true },
      );

      await loadTraditions();
      closeEditModal();
      setMessage({ type: 'success', text: 'Tradition updated successfully.' });
    } catch (error) {
      console.error('Error updating tradition:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to update tradition.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTradition = async () => {
    if (!selectedTradition) return;

    const confirmed = window.confirm(`Permanently delete "${selectedTradition.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeleting(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.delete(`${API}/traditions/${selectedTradition.tradition_id}`, {
        withCredentials: true,
      });

      await loadTraditions();
      closeEditModal();
      setMessage({ type: 'success', text: 'Tradition deleted successfully.' });
    } catch (error) {
      console.error('Error deleting tradition:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to delete tradition.',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateTradition = async (event) => {
    event.preventDefault();

    const title = addForm.title.trim();
    const description = addForm.description.trim();
    const tags = addForm.selectedTags;

    if (!title || !description || !addForm.imageFile) {
      setMessage({ type: 'error', text: 'Name, description, tags, and banner image are required.' });
      return;
    }

    if (tags.length === 0) {
      setMessage({ type: 'error', text: 'Please provide at least one tag.' });
      return;
    }

    setCreating(true);
    setMessage({ type: '', text: '' });

    try {
      const uploadedImage = await uploadBanner(addForm.imageFile);

      await axios.post(
        `${API}/traditions`,
        {
          title,
          description,
          image: uploadedImage,
          tags,
        },
        { withCredentials: true },
      );

      setAddForm({
        title: '',
        description: '',
        selectedTags: [],
        imageFile: null,
      });
      setIsAddOpen(false);
      await loadTraditions();
      setMessage({ type: 'success', text: 'New tradition added.' });
    } catch (error) {
      console.error('Error creating tradition:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to create tradition.',
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <DashboardShell user={user} onLogout={handleLogout}>
      <section className="manage-search-row">
        <div className="manage-search-input-container">
          <input
            type="text"
            placeholder="Search traditions..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <button
          type="button"
          className="manage-add-btn"
          onClick={openAddModal}
        >
          Add New Tradition
        </button>
      </section>

      {message.text && (
        <div className={`manage-alert manage-alert--${message.type}`} role="status">
          {message.text}
        </div>
      )}

      <section className="manage-traditions-grid">
        {searchTerm && traditions.length === 0 && (
          <p className="manage-empty">"{searchTerm}" not found.</p>
        )}

        {!searchTerm && traditions.length === 0 && (
          <p className="manage-empty">No traditions available yet.</p>
        )}

        {traditions.map((tradition) => {
          const normalizedTags = Array.isArray(tradition.tags)
            ? tradition.tags.map((tag) => tag?.tag || tag).filter(Boolean)
            : [];
          const previewDescription = truncateDescription(tradition.description);

          return (
            <article key={tradition.tradition_id} className="manage-card">
              <div className="manage-card__media">
                <img
                  src={resolveTraditionImage(tradition.image)}
                  alt={tradition.title || 'Tradition'}
                />
              </div>
              <div className="manage-card__body">
                <h3>{tradition.title}</h3>
                {previewDescription && <p>{previewDescription}</p>}
                {normalizedTags.length > 0 && (
                  <div className="manage-tags-row">
                    {normalizedTags.map((tag) => (
                      <span key={`${tradition.tradition_id}-${tag}`} className="manage-tag">{tag}</span>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  className="manage-edit-btn"
                  onClick={() => openEditModal(tradition)}
                >
                  Edit Tradition
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {isEditOpen && selectedTradition && (
        <div className="manage-modal-backdrop" onClick={closeEditModal}>
          <div className="manage-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="manage-modal-close" onClick={closeEditModal}>x</button>

            <h2>Edit Tradition</h2>

            <label htmlFor="edit-title">Name</label>
            <input
              id="edit-title"
              type="text"
              value={editForm.title}
              onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
            />

            <label htmlFor="edit-description">Description</label>
            <textarea
              id="edit-description"
              rows={5}
              value={editForm.description}
              onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
            />

            <label htmlFor="edit-tags">Tags (comma-separated)</label>
            <input
              id="edit-tags"
              type="text"
              list="manage-tag-options"
              value={editForm.tagsText}
              onChange={(event) => setEditForm((prev) => ({ ...prev, tagsText: event.target.value }))}
              placeholder="sports, oncampus"
            />

            <label htmlFor="edit-image">Banner image</label>
            <input
              id="edit-image"
              type="file"
              accept="image/*"
              onChange={(event) => setNewBannerFile(event.target.files?.[0] || null)}
            />

            <div className="manage-modal-preview">
              <img
                src={newBannerFile ? URL.createObjectURL(newBannerFile) : resolveTraditionImage(editForm.imagePath)}
                alt="Tradition banner preview"
              />
            </div>

            <div className="manage-modal-actions">
              <button
                type="button"
                className="manage-delete-btn"
                onClick={handleDeleteTradition}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Tradition'}
              </button>
              <button type="button" className="manage-cancel-btn" onClick={closeEditModal}>Cancel</button>
              <button type="button" className="manage-save-btn" onClick={handleSaveChanges} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddOpen && (
        <div className="manage-modal-backdrop" onClick={() => setIsAddOpen(false)}>
          <div className="manage-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="manage-modal-close" onClick={() => setIsAddOpen(false)}>x</button>

            <h2>Add New Tradition</h2>

            <form onSubmit={handleCreateTradition} className="manage-add-form">
              <label htmlFor="add-title">Name</label>
              <input
                id="add-title"
                type="text"
                value={addForm.title}
                onChange={(event) => setAddForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />

              <label htmlFor="add-description">Description</label>
              <textarea
                id="add-description"
                rows={5}
                value={addForm.description}
                onChange={(event) => setAddForm((prev) => ({ ...prev, description: event.target.value }))}
                required
              />

              <fieldset className="manage-tag-fieldset">
                <legend>Tags</legend>
                <div className="manage-tag-checkboxes">
                  {availableTags.map((tag) => (
                    <label key={tag} className="manage-tag-checkbox">
                      <input
                        type="checkbox"
                        checked={addForm.selectedTags.includes(tag)}
                        onChange={() => toggleAddTag(tag)}
                      />
                      <span>{tag}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label htmlFor="add-image">Banner image</label>
              <input
                id="add-image"
                type="file"
                accept="image/*"
                onChange={(event) => setAddForm((prev) => ({ ...prev, imageFile: event.target.files?.[0] || null }))}
                required
              />

              <div className="manage-modal-actions">
                <button type="button" className="manage-cancel-btn" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="manage-save-btn" disabled={creating}>
                  {creating ? 'Adding...' : 'Add Tradition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default ManageTraditions;
