// Authentication Routes
// Defines all authentication API endpoints

const express = require('express');
const router = express.Router();
const dbController = require('../controllers/traditionsDbController');

/**
 * GET /traditions
 */
router.get('/traditions', dbController.traditionsSearch);

module.exports = router;
