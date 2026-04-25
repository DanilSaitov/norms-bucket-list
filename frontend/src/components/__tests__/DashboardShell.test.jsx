import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import DashboardShell from '../DashboardShell';

/*

// Mock the logo image
vi.mock('../../assets/homepage/charlotteLogoWhite.png', () => ({
  default: 'mock-logo.png',
}));

// Mock CSS imports
vi.mock('../../pages/Home.css', () => ({}));

const mockUser = {
  user_id: 1,
  username: 'testuser',
  first_name: 'John',
  last_name: 'Doe',
  graduation_year: 2025,
  role: 'student',
};

const mockAdminUser = {
  ...mockUser,
  role: 'admin',
};

const mockOnLogout = vi.fn();

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('DashboardShell Navigation Bar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders navigation bar with user information', () => {
    renderWithRouter(
      <DashboardShell user={mockUser} onLogout={mockOnLogout}>
        <div>Test Content</div>
      </DashboardShell>
    );

    // Check user display name
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Class of 2025')).toBeInTheDocument();

    // Check navigation links
    expect(screen.getByText('Completed Traditions')).toBeInTheDocument();
    expect(screen.getByText('Pending Traditions')).toBeInTheDocument();
    expect(screen.getByText('Suggest Tradition')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('displays username when name is not available', () => {
    const userWithoutName = {
      ...mockUser,
      first_name: null,
      last_name: null,
    };

    renderWithRouter(
      <DashboardShell user={userWithoutName} onLogout={mockOnLogout}>
        <div>Test Content</div>
      </DashboardShell>
    );

    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  test('shows admin navigation link for admin users', () => {
    renderWithRouter(
      <DashboardShell user={mockAdminUser} onLogout={mockOnLogout}>
        <div>Test Content</div>
      </DashboardShell>
    );

    expect(screen.getByText('Manage Suggestions')).toBeInTheDocument();
  });

  test('does not show admin navigation link for regular users', () => {
    renderWithRouter(
      <DashboardShell user={mockUser} onLogout={mockOnLogout}>
        <div>Test Content</div>
      </DashboardShell>
    );

    expect(screen.queryByText('Manage Suggestions')).not.toBeInTheDocument();
  });

  test('shows staff navigation link for staff users', () => {
    const staffUser = { ...mockUser, role: 'staff' };

    renderWithRouter(
      <DashboardShell user={staffUser} onLogout={mockOnLogout}>
        <div>Test Content</div>
      </DashboardShell>
    );

    expect(screen.getByText('Manage Suggestions')).toBeInTheDocument();
  });

  test('displays user initial when no profile image', () => {
    renderWithRouter(
      <DashboardShell user={mockUser} onLogout={mockOnLogout}>
        <div>Test Content</div>
      </DashboardShell>
    );

    expect(screen.getByText('J')).toBeInTheDocument(); // First letter of first name
  });

  test('displays profile image when available', () => {
    const userWithImage = {
      ...mockUser,
      profile_image_url: 'http://example.com/avatar.jpg',
    };

    renderWithRouter(
      <DashboardShell user={userWithImage} onLogout={mockOnLogout}>
        <div>Test Content</div>
      </DashboardShell>
    );

    const avatarImg = screen.getByAltText('');
    expect(avatarImg).toBeInTheDocument();
    expect(avatarImg.src).toBe('http://example.com/avatar.jpg');
  });

  test('handles logout button click', () => {
    renderWithRouter(
      <DashboardShell user={mockUser} onLogout={mockOnLogout}>
        <div>Test Content</div>
      </DashboardShell>
    );

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });

  test('closes mobile menu on navigation link click', () => {
    // Mock window.innerWidth to simulate mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800,
    });

    renderWithRouter(
      <DashboardShell user={mockUser} onLogout={mockOnLogout}>
        <div>Test Content</div>
      </DashboardShell>
    );

    // Menu should start closed
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).not.toHaveClass('is-open');

    // Click menu toggle to open
    const menuToggle = screen.getByLabelText('Open navigation menu');
    fireEvent.click(menuToggle);
    expect(sidebar).toHaveClass('is-open');

    // Click a navigation link
    const completedLink = screen.getByText('Completed Traditions');
    fireEvent.click(completedLink);

    // Menu should close
    expect(sidebar).not.toHaveClass('is-open');
  });

  test('closes mobile menu on window resize to desktop', () => {
    // Start with mobile view
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800,
    });

    renderWithRouter(
      <DashboardShell user={mockUser} onLogout={mockOnLogout}>
        <div>Test Content</div>
      </DashboardShell>
    );

    // Open menu
    const menuToggle = screen.getByLabelText('Open navigation menu');
    fireEvent.click(menuToggle);
    expect(screen.getByRole('complementary')).toHaveClass('is-open');

    // Simulate window resize to desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1000,
    });
    fireEvent(window, new Event('resize'));

    // Menu should close
    expect(screen.getByRole('complementary')).not.toHaveClass('is-open');
  });

  test('renders children content', () => {
    renderWithRouter(
      <DashboardShell user={mockUser} onLogout={mockOnLogout}>
        <div data-testid="child-content">Custom Child Content</div>
      </DashboardShell>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Custom Child Content')).toBeInTheDocument();
  });

  test('has proper accessibility attributes', () => {
    renderWithRouter(
      <DashboardShell user={mockUser} onLogout={mockOnLogout}>
        <div>Test Content</div>
      </DashboardShell>
    );

    // Check logo link
    const logoLink = screen.getByLabelText('Go to home page');
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/home');

    // Check menu toggle buttons
    const menuToggle = screen.getByLabelText('Open navigation menu');
    expect(menuToggle).toBeInTheDocument();
    expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
  });
});
*/
