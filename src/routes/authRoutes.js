// Authentication Routes
// Defines all authentication API endpoints

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, requireRole } = require('../middleware/auth');

/**
 * POST /api/auth/signup
 * Create new user account
 * 
 * Body: { username, first_name, last_name, email, password, graduation_year }
 * Returns: { message, user }
 */
router.post('/signup', authController.signup);
router.post('/staff', authenticate, requireRole('admin'), authController.createStaffUser);
router.get('/staff', authenticate, requireRole('admin'), authController.getStaffUsers);
router.delete('/staff/:staffId', authenticate, requireRole('admin'), authController.deleteStaffUser);

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

/**
 * PATCH /api/auth/me
 * Update profile fields for the current user (requires auth)
 */
router.patch('/me', authenticate, authController.updateProfile);

/**
 * PATCH /api/auth/password
 * Change password (requires auth)
 */
router.patch('/password', authenticate, authController.changePassword);

module.exports = router;
