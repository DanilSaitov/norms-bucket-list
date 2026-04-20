import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import axios from 'axios';
import Home from '../Home';

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
    description: 'This is a detailed description of the first test tradition. It includes information about what the tradition entails and why it\'s important to UNC Charlotte students.',
    category: 'social',
    image: '/uploads/traditions/test1.jpg',
    tags: [{ tag: 'social' }, { tag: 'oncampus' }, { tag: 'datesensitive' }],
    intermittent: true,
  },
  {
    tradition_id: 2,
    title: 'Test Tradition 2',
    description: 'Another test tradition with different characteristics.',
    category: 'academic',
    image: '/uploads/traditions/test2.jpg',
    tags: [{ tag: 'academic' }],
    intermittent: false,
  },
];

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Tradition Detail Window (Modal)', () => {
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
  });

  afterEach(() => {
    // Clean up any lingering modals or state
    cleanup();
    vi.clearAllTimers();
  });

  test('opens detail modal with tradition information', async () => {
    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Test Tradition 1')).toBeInTheDocument();
    });

    // Click View Details button
    const viewDetailsButtons = screen.getAllByText('View Details');
    fireEvent.click(viewDetailsButtons[0]);

    // Check modal content
    await waitFor(() => {
      expect(screen.getByText('Test Tradition 1')).toBeInTheDocument();
      expect(screen.getByText('This is a detailed description of the first test tradition. It includes information about what the tradition entails and why it\'s important to UNC Charlotte students.')).toBeInTheDocument();
    });
  });

  test('displays tradition tags in modal', async () => {
    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Test Tradition 1')).toBeInTheDocument();
    });

    // Open modal
    const viewDetailsButtons = screen.getAllByText('View Details');
    fireEvent.click(viewDetailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Test Tradition 1')).toBeInTheDocument();
    });

    // Check tags are displayed
    expect(screen.getByText('social')).toBeInTheDocument();
    expect(screen.getByText('oncampus')).toBeInTheDocument();
    expect(screen.getByText('datesensitive')).toBeInTheDocument();
  });

  test('displays tradition image in modal', async () => {
    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Test Tradition 1')).toBeInTheDocument();
    });

    // Open modal
    const viewDetailsButtons = screen.getAllByText('View Details');
    fireEvent.click(viewDetailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Test Tradition 1')).toBeInTheDocument();
    });

    // Check image is displayed
    const modalContent = screen.getByTestId('tradition-modal-content');
    const modalImage = within(modalContent).getByAltText('Test Tradition 1');
    expect(modalImage).toBeInTheDocument();
    expect(modalImage.src).toContain('/uploads/traditions/test1.jpg');
  });

  test('shows intermittent/special occasion indicator', async () => {
    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Test Tradition 1')).toBeInTheDocument();
    });

    // Open modal for intermittent tradition
    const viewDetailsButtons = screen.getAllByText('View Details');
    fireEvent.click(viewDetailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Test Tradition 1')).toBeInTheDocument();
    });

    // Check intermittent indicator
    expect(screen.getByText('Intermittent/Special occasion')).toBeInTheDocument();
  });

  test('does not show intermittent indicator for regular traditions', async () => {
    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Test Tradition 2')).toBeInTheDocument();
    });

    // Open modal for regular tradition
    const viewDetailsButtons = screen.getAllByText('View Details');
    fireEvent.click(viewDetailsButtons[1]);

    await waitFor(() => {
      expect(screen.getByText('Test Tradition 2')).toBeInTheDocument();
    });

    // Check no intermittent indicator
    expect(screen.queryByText('Intermittent/Special occasion')).not.toBeInTheDocument();
  });

  test('closes modal when clicking close button', async () => {
    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Test Tradition 1')).toBeInTheDocument();
    });

    // Open modal
    const viewDetailsButtons = screen.getAllByText('View Details');
    fireEvent.click(viewDetailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Test Tradition 1')).toBeInTheDocument();
    });

    // Click close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText('This is a detailed description of the first test tradition.')).not.toBeInTheDocument();
    });
  });

  test('displays submission status when user has submitted', async () => {
    // Mock existing submission
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
              status: 'pending',
              submitted_at: '2024-01-01T12:00:00Z',
              text_submission: 'I participated in this tradition!',
              image_submission: '/uploads/submissions/user1.jpg'
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

    // Open modal
    const viewDetailsButtons = screen.getAllByText('View Details');
    fireEvent.click(viewDetailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Submission Status: pending')).toBeInTheDocument();
      expect(screen.getByText('I participated in this tradition!')).toBeInTheDocument();
    });
  });

  test('shows submission form when no previous submission exists', async () => {
    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Test Tradition 1')).toBeInTheDocument();
    });

    // Open modal
    const viewDetailsButtons = screen.getAllByText('View Details');
    fireEvent.click(viewDetailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Submit Your Completion')).toBeInTheDocument();
      expect(screen.getByLabelText(/upload.*image/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/text.*submission/i)).toBeInTheDocument();
    });
  });

  test('displays fallback image when tradition has no image', async () => {
    const traditionsWithoutImage = [
      {
        ...mockTraditions[0],
        image: null,
      },
    ];

    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ data: { user: mockUser } });
      }
      if (url.includes('/api/traditions')) {
        return Promise.resolve({ data: traditionsWithoutImage });
      }
      if (url.includes('/submissions/me')) {
        return Promise.resolve({ data: { submission: null } });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Test Tradition 1')).toBeInTheDocument();
    });

    // Open modal
    const viewDetailsButtons = screen.getAllByText('View Details');
    fireEvent.click(viewDetailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Test Tradition 1')).toBeInTheDocument();
    });

    // Check fallback image is used
    const modalContent = screen.getByTestId('tradition-modal-content');
    const modalImage = within(modalContent).getByAltText('Test Tradition 1');
    expect(modalImage.src).toContain('unsplash.com');
  });
});