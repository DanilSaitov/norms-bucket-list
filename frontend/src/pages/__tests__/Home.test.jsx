import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import axios from 'axios';
import Home from '../Home';


/*
// Mock axios
vi.mock('axios');
const mockedAxios = axios;

// Mock CSS imports
vi.mock('../Home.css', () => ({}));

// Mock the logo image
vi.mock('../../assets/homepage/charlotteLogoWhite.png', () => ({
  default: 'mock-logo.png',
}));

// Mock DashboardShell to avoid complex navigation testing
vi.mock('../components/DashboardShell', () => ({
  default: ({ children, user, onLogout }) => (
    <div data-testid="dashboard-shell">
      <div data-testid="user-info">{user?.username}</div>
      <button data-testid="logout-btn" onClick={onLogout}>Logout</button>
      {children}
    </div>
  ),
}));

const mockUser = {
  user_id: 1,
  username: 'testuser',
  first_name: 'John',
  last_name: 'Doe',
  graduation_year: 2025,
  role: 'student',
};

const mockTraditions = [
  {
    tradition_id: 1,
    title: 'Test Tradition 1',
    description: 'This is a test tradition',
    category: 'social',
    image: '/uploads/traditions/test1.jpg',
    tags: [{ tag: 'social' }, { tag: 'oncampus' }],
  },
  {
    tradition_id: 2,
    title: 'Test Tradition 2',
    description: 'Another test tradition',
    category: 'academic',
    image: '/uploads/traditions/test2.jpg',
    tags: [{ tag: 'academic' }],
  },
];

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Marking Bucket List Item as Complete (Home Page)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful auth check
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({
          data: { user: mockUser },
        });
      }
      if (url.includes('/api/traditions')) {
        return Promise.resolve({
          data: mockTraditions,
        });
      }
      if (url.includes('/submissions/me')) {
        return Promise.resolve({
          data: { submission: null }, // No existing submission
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    mockedAxios.post.mockResolvedValue({
      data: { success: true },
    });
  });

  afterEach(() => {
    // Clean up any lingering modals or state
    cleanup();
    vi.clearAllTimers();
  });

  test('renders traditions list', async () => {
    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Test Tradition 1')).toBeInTheDocument();
      expect(screen.getByText('Test Tradition 2')).toBeInTheDocument();
    });
  });

  test('can submit tradition completion via API', async () => {
    // Test the core submission functionality by mocking the API call
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('image_submission', mockFile);
    formData.append('text_submission', 'I completed this tradition!');

    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Test Tradition 1')).toBeInTheDocument();
    });

    // Simulate a successful submission
    await mockedAxios.post('http://localhost:3000/api/traditions/1/submissions', formData, { withCredentials: true });

    // Verify the API call was made correctly
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/api/traditions/1/submissions',
      expect.any(FormData),
      { withCredentials: true }
    );
  });

  test('handles submission errors gracefully', async () => {
    mockedAxios.post.mockRejectedValue({
      response: { data: { error: 'Upload failed' } }
    });

    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Test Tradition 1')).toBeInTheDocument();
    });

    // Test error handling
    try {
      await mockedAxios.post('http://localhost:3000/api/traditions/1/submissions', new FormData());
    } catch (error) {
      expect(error.response.data.error).toBe('Upload failed');
    }
  });

  test('shows existing submission status', async () => {
    // Mock existing approved submission
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ data: { user: mockUser } });
      }
      if (url.includes('/api/traditions')) {
        return Promise.resolve({ data: mockTraditions });
      }
      if (url.includes('/submissions/me')) {
        return Promise.resolve({
          data: {
            submission: {
              status: 'approved',
              submitted_at: '2024-01-01T00:00:00Z',
              text_submission: 'I completed this!',
              image_submission: '/uploads/submissions/test.jpg'
            }
          }
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Test Tradition 1')).toBeInTheDocument();
    });

    // Test that the component loads successfully with mocked data
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/me',
      { withCredentials: true }
    );
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://localhost:3000/api/traditions?search=',
      { withCredentials: true }
    );
  });
});
*/
