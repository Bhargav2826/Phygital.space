const express = require('express');
const router = express.Router();
const {
    uploadTarget, uploadContent, getTargets, getTarget, updateTarget, deleteTarget,
} = require('../controllers/targetController');
const { protect, authorize } = require('../middleware/auth');
const { upload, uploadTargetFiles } = require('../middleware/upload');

// Publicly accessible download proxy
router.get('/:targetId/download', (req, res, next) => {
    // We don't use 'protect' here to allow direct scan-to-download without login
    next();
}, require('../controllers/targetController').downloadTargetContent);

router.use(protect);

// Upload a new image target for a room
router.post('/room/:roomId', authorize('admin', 'superadmin'), uploadTargetFiles, uploadTarget);

// Get all targets for a room
router.get('/room/:roomId', getTargets);

// Single target CRUD
router.route('/:targetId')
    .get(getTarget)
    .put(authorize('admin', 'superadmin'), updateTarget)
    .delete(authorize('admin', 'superadmin'), deleteTarget);

// Upload AR content for a target
router.put('/:targetId/content', authorize('admin', 'superadmin'), uploadTargetFiles, uploadContent);

module.exports = router;
