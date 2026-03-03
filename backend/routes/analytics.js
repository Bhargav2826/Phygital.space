const express = require('express');
const router = express.Router();
const { trackScan, trackInteraction, getRoomAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

// Public – called from scanner page
router.post('/scan/:roomId', trackScan);
router.post('/interaction/:roomId/:targetId', trackInteraction);

// Protected – admin sees their room analytics
router.get('/:roomId', protect, getRoomAnalytics);

module.exports = router;
