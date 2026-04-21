// Authentication Routes
// Defines all authentication API endpoints

const express = require('express');
const router = express.Router();
const dbController = require('../controllers/traditionsDbController');
const uploadTraditionImage = require('../middleware/traditionImageUpload');
const uploadSubmissionImage = require('../middleware/submissionImageUpload');
const { authenticate, requireRole } = require('../middleware/auth');

const submissionUploadMiddleware = uploadSubmissionImage.single('image_submission');

function handleSubmissionUpload(req, res, next) {
	submissionUploadMiddleware(req, res, (err) => {
		if (!err) return next();

		if (err.code === 'LIMIT_FILE_SIZE') {
			return res.status(400).json({ error: 'Image is too large. Maximum size is 10MB.' });
		}

		return res.status(400).json({ error: err.message || 'Invalid image upload.' });
	});
}

/**
 * GET /traditions
 */
router.get('/', dbController.traditionsSearch);
router.get('/tags', dbController.getTraditionTags);
router.post('/', authenticate, requireRole(['admin', 'staff']), dbController.createTradition);
router.patch('/:traditionId', authenticate, requireRole(['admin', 'staff']), dbController.updateTradition);
router.delete('/:traditionId', authenticate, requireRole(['admin', 'staff']), dbController.deleteTradition);
router.post('/upload-image', authenticate, requireRole(['admin', 'staff']), uploadTraditionImage.single('image'), dbController.uploadTraditionImage);
router.get('/submissions/me', authenticate, dbController.getMySubmissions);
router.get('/submissions/me/pending', authenticate, dbController.getMyPendingSubmissions);
router.get('/submissions/me/completed', authenticate, dbController.getMyCompletedSubmissions);
router.get('/:traditionId/submissions/me', authenticate, dbController.getMyTraditionSubmission);
router.post(
	'/:traditionId/submissions',
	authenticate,
	handleSubmissionUpload,
	dbController.createTraditionSubmission,
);

router.get('/review/pending-traditions', authenticate, requireRole(['admin', 'staff']), dbController.getTraditionsAwaitingReview);
router.get('/review/traditions/:traditionId/submissions', authenticate, requireRole(['admin', 'staff']), dbController.getTraditionPendingSubmissions);
router.patch('/review/submissions/:submissionId', authenticate, requireRole(['admin', 'staff']), dbController.reviewTraditionSubmission);

// Tradition suggestions routes
router.post('/suggestions', authenticate, dbController.submitTraditionSuggestion);
router.get('/suggestions/me', authenticate, dbController.getMySuggestions);
router.get('/suggestions', authenticate, requireRole(['admin', 'staff']), dbController.getTraditionSuggestions);
router.patch('/suggestions/:suggestionId/review', authenticate, requireRole(['admin', 'staff']), dbController.reviewTraditionSuggestion);

module.exports = router;
