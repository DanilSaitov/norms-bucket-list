// reports routes
// Defines all API endpoints for the user reports

const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticate } = require('../middleware/auth');

/**
 * /reports api
 */
router.get('/reports', reportsController.getReports);
router.post('/reports', reportsController.createReports);

module.exports = router;
