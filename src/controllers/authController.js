// Authentication Controller
// Handles all authentication business logic: signup, login, logout

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

// Secret key for JWT tokens (in production, move to .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function getAuthCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';

  // In local development (http://localhost), SameSite=None without Secure is rejected by modern browsers.
  // Use Lax for dev and None+Secure for production cross-site deployments.
  return {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    path: '/'
  };
}

/**
 * SIGNUP - Create a new user account
 * 
 * Process:
 * 1. Validate UNCC email (@charlotte.edu)
 * 2. Check if user already exists
 * 3. Hash the password with bcrypt (salt rounds = 10)
 * 4. Create user in database
 * 5. Generate JWT token
 * 6. Send token in cookie
 */
async function signup(req, res) {
  try {
    const { username, first_name, last_name, email, password, graduation_year } = req.body;

    // Validate required fields
    if (!username || !first_name || !last_name || !email || !password || !graduation_year) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate UNCC email (as specified in your requirements)
    if (!email.endsWith('@charlotte.edu')) {
      return res.status(400).json({ error: 'Only UNCC emails (@charlotte.edu) are allowed' });
    }

    // Check if user already exists (username or email)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: email }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Hash password with bcrypt (10 salt rounds = secure but fast)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        username,
        first_name,
        last_name,
        email,
        password: hashedPassword,
        role: 'student', // Default role
        graduation_year: parseInt(graduation_year)
      }
    });

    // Generate JWT token (contains user_id and role)
    const token = jwt.sign(
      { userId: newUser.user_id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' } // Token valid for 7 days
    );

    // Send token in HTTP-only cookie (more secure than localStorage)
    res.cookie('auth_token', token, getAuthCookieOptions());

    // Return success (don't send password!)
    res.status(201).json({
      message: 'Account created successfully',
      user: {
        user_id: newUser.user_id,
        username: newUser.username,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        role: newUser.role,
        graduation_year: newUser.graduation_year
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
}

/**
 * LOGIN - Authenticate existing user
 * 
 * Process:
 * 1. Find user by email
 * 2. Compare password with stored hash using bcrypt
 * 3. Generate JWT token
 * 4. Send token in cookie
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare password with hashed password in database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send token in cookie
    res.cookie('auth_token', token, getAuthCookieOptions());

    // Return success
    res.json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        graduation_year: user.graduation_year
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
}

/**
 * LOGOUT - Clear authentication
 * 
 * Simply clears the auth cookie
 */
function logout(req, res) {
  res.clearCookie('auth_token', {
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });
  res.json({ message: 'Logged out successfully' });
}

/**
 * GET_CURRENT_USER - Get currently logged-in user info
 * 
 * Uses the authentication middleware to verify token
 * then returns user data
 */
async function getCurrentUser(req, res) {
  try {
    // req.userId is set by authentication middleware
    const user = await prisma.user.findUnique({
      where: { user_id: req.userId },
      select: {
        user_id: true,
        username: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        graduation_year: true,
        profile_image_url: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

/**
 * PATCH_PROFILE - Update editable fields for the current user
 * Body: { first_name?, last_name?, username?, graduation_year?, profile_image_url? | null }
 */
async function updateProfile(req, res) {
  try {
    const { first_name, last_name, username, graduation_year, profile_image_url } = req.body;
    const userId = req.userId;

    const existing = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { username: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    const data = {};

    if (first_name !== undefined) {
      const f = String(first_name).trim();
      if (!f || f.length > 32) {
        return res.status(400).json({ error: 'First name must be 1–32 characters' });
      }
      data.first_name = f;
    }

    if (last_name !== undefined) {
      const l = String(last_name).trim();
      if (!l || l.length > 32) {
        return res.status(400).json({ error: 'Last name must be 1–32 characters' });
      }
      data.last_name = l;
    }

    if (username !== undefined) {
      const u = String(username).trim();
      if (u.length < 1 || u.length > 15) {
        return res.status(400).json({ error: 'Username must be 1–15 characters' });
      }
      if (u !== existing.username) {
        const taken = await prisma.user.findFirst({
          where: {
            username: u,
            user_id: { not: userId },
          },
        });
        if (taken) {
          return res.status(409).json({ error: 'Username already taken' });
        }
      }
      data.username = u;
    }

    if (graduation_year !== undefined) {
      const gy = parseInt(graduation_year, 10);
      const currentYear = new Date().getFullYear();
      if (Number.isNaN(gy) || gy < currentYear || gy > currentYear + 10) {
        return res.status(400).json({ error: 'Please enter a valid graduation year' });
      }
      data.graduation_year = gy;
    }

    if (profile_image_url !== undefined) {
      if (profile_image_url === null || profile_image_url === '') {
        data.profile_image_url = null;
      } else {
        const s = String(profile_image_url);
        if (s.length > 2_000_000) {
          return res.status(400).json({ error: 'Profile image data is too large' });
        }
        data.profile_image_url = s;
      }
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No changes provided' });
    }

    const user = await prisma.user.update({
      where: { user_id: userId },
      data,
      select: {
        user_id: true,
        username: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        graduation_year: true,
        profile_image_url: true,
      },
    });

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

/**
 * CHANGE_PASSWORD - Update password for the current user
 * Body: { current_password, new_password }
 */
async function changePassword(req, res) {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const record = await prisma.user.findUnique({
      where: { user_id: req.userId },
      select: { password: true },
    });

    if (!record) {
      return res.status(404).json({ error: 'User not found' });
    }

    const valid = await bcrypt.compare(current_password, record.password);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await prisma.user.update({
      where: { user_id: req.userId },
      data: { password: hashed },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  signup,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
};
