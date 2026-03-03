const express = require('express');
const router = express.Router();
const {
    createRoom, getRooms, getRoom, getRoomPublic, updateRoom, deleteRoom, publishRoom, uploadBundledMind
} = require('../controllers/roomController');
const { protect, authorize } = require('../middleware/auth');
const { uploadTargetFiles } = require('../middleware/upload');

// Public route – for AR scanner page
router.get('/public/:slug', getRoomPublic);

// Protected routes
router.use(protect);

router.route('/')
    .get(getRooms)
    .post(authorize('admin', 'superadmin'), createRoom);

router.route('/:id')
    .get(getRoom)
    .put(authorize('admin', 'superadmin'), updateRoom)
    .delete(authorize('admin', 'superadmin'), deleteRoom);

router.post('/:id/publish', authorize('admin', 'superadmin'), publishRoom);
router.put('/:id/mind', authorize('admin', 'superadmin'), uploadTargetFiles, uploadBundledMind);

module.exports = router;
