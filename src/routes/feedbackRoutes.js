// Feedback Routes
// Defines all feedback API endpoints

const express = require('express');
const router = express.Router();
const dbController = require('../controllers/traditionsDbController');
const { authenticate, requireRole } = require('../middleware/auth');

/**
 * POST /feedback
 * Submit feedback (students)
 */
router.post('/', authenticate, dbController.submitFeedback);

/**
 * GET /feedback/me
 * Get user's own feedback submissions
 */
router.get('/me', authenticate, dbController.getMyFeedback);

/**
 * GET /feedback
 * Get all feedback (admin/staff only)
 */
router.get('/', authenticate, requireRole(['admin', 'staff']), dbController.getAllFeedback);

/**
 * PATCH /feedback/:feedbackId/respond
 * Respond to feedback (admin/staff only)
 */
router.patch('/:feedbackId/respond', authenticate, requireRole(['admin', 'staff']), dbController.respondToFeedback);

/**
 * PATCH /feedback/:feedbackId/status
 * Update feedback status (admin/staff only)
 */
router.patch('/:feedbackId/status', authenticate, requireRole(['admin', 'staff']), dbController.updateFeedbackStatus);

module.exports = router;