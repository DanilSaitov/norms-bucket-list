// Authentication Routes
// Defines all authentication API endpoints

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/auth/signup
 * Create new user account
 * 
 * Body: { username, first_name, last_name, email, password, graduation_year }
 * Returns: { message, user }
 */
router.post('/signup', authController.signup);

/**
 * POST /api/auth/login
 * Login existing user
 * 
 * Body: { email, password }
 * Returns: { message, user }
 */
router.post('/login', authController.login);

/**
 * POST /api/auth/logout
 * Logout current user
 * 
 * Returns: { message }
 */
router.post('/logout', authController.logout);

/**
 * GET /api/auth/me
 * Get current logged-in user info
 * Protected route - requires authentication
 * 
 * Returns: { user }
 */
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
