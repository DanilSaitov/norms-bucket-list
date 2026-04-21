const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getUserNotifications,
  markNotificationAsRead,
  createNotification
} = require('../controllers/traditionsDbController');

// Get all notifications for the authenticated user
router.get('/', authenticate, getUserNotifications);

// Mark a specific notification as read
router.patch('/:id/read', authenticate, markNotificationAsRead);

// Create a notification (admin only - for system announcements)
router.post('/', authenticate, requireRole('admin'), createNotification);

module.exports = router;