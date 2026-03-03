const express = require('express');
const router = express.Router();
const {
    getAllAdmins, getAllRooms, getPlatformStats,
    deactivateRoom, deactivateAdmin, activateAdmin,
} = require('../controllers/superAdminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('superadmin'));

router.get('/admins', getAllAdmins);
router.get('/rooms', getAllRooms);
router.get('/stats', getPlatformStats);

router.put('/rooms/:roomId/deactivate', deactivateRoom);
router.put('/admins/:adminId/deactivate', deactivateAdmin);
router.put('/admins/:adminId/activate', activateAdmin);

module.exports = router;
