// Authentication Controller
// Handles all authentication business logic: signup, login, logout

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

// Secret key for JWT tokens (in production, move to .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
    res.cookie('auth_token', token, {
      httpOnly: true, // Prevents JavaScript access (XSS protection)
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      sameSite: 'lax' // CSRF protection
    });

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
    res.cookie('auth_token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

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
  res.clearCookie('auth_token');
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

module.exports = {
  signup,
  login,
  logout,
  getCurrentUser
};
