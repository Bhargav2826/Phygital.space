const User = require('../models/User');
const Room = require('../models/Room');
const Target = require('../models/Target');
const Analytics = require('../models/Analytics');

/**
 * @route   GET /api/superadmin/admins
 * @access  Private (superadmin)
 */
const getAllAdmins = async (req, res) => {
    const admins = await User.find({ role: 'admin' })
        .select('-password')
        .sort({ createdAt: -1 });

    // Get room count per admin
    const adminIds = admins.map((a) => a._id);
    const roomCounts = await Room.aggregate([
        { $match: { adminId: { $in: adminIds } } },
        { $group: { _id: '$adminId', count: { $sum: 1 } } },
    ]);
    const roomCountMap = {};
    roomCounts.forEach((r) => { roomCountMap[r._id.toString()] = r.count; });

    const result = admins.map((admin) => ({
        ...admin.toObject(),
        roomCount: roomCountMap[admin._id.toString()] || 0,
    }));

    res.json({ success: true, count: result.length, admins: result });
};

/**
 * @route   GET /api/superadmin/rooms
 * @access  Private (superadmin)
 */
const getAllRooms = async (req, res) => {
    const rooms = await Room.find()
        .populate('adminId', 'name email organization')
        .sort({ createdAt: -1 });

    res.json({ success: true, count: rooms.length, rooms });
};

/**
 * @route   GET /api/superadmin/stats
 * @access  Private (superadmin)
 */
const getPlatformStats = async (req, res) => {
    const [totalAdmins, totalRooms, totalTargets, analyticsAgg] = await Promise.all([
        User.countDocuments({ role: 'admin' }),
        Room.countDocuments(),
        Target.countDocuments(),
        Analytics.aggregate([
            {
                $group: {
                    _id: null,
                    totalScans: { $sum: '$totalScans' },
                    totalInteractions: { $sum: '$totalInteractions' },
                    totalUniqueUsers: { $sum: { $size: '$uniqueUsers' } },
                },
            },
        ]),
    ]);

    const agg = analyticsAgg[0] || { totalScans: 0, totalInteractions: 0, totalUniqueUsers: 0 };

    res.json({
        success: true,
        stats: {
            totalAdmins,
            totalRooms,
            activeRooms: await Room.countDocuments({ isActive: true, isPublished: true }),
            totalTargets,
            totalScans: agg.totalScans,
            totalInteractions: agg.totalInteractions,
            totalUniqueUsers: agg.totalUniqueUsers,
        },
    });
};

/**
 * @route   PUT /api/superadmin/rooms/:roomId/deactivate
 * @access  Private (superadmin)
 */
const deactivateRoom = async (req, res) => {
    const room = await Room.findByIdAndUpdate(
        req.params.roomId,
        { isActive: false, isPublished: false },
        { new: true }
    );
    if (!room) {
        const err = new Error('Room not found'); err.statusCode = 404; throw err;
    }
    res.json({ success: true, message: 'Room deactivated', room });
};

/**
 * @route   PUT /api/superadmin/admins/:adminId/deactivate
 * @access  Private (superadmin)
 */
const deactivateAdmin = async (req, res) => {
    const admin = await User.findByIdAndUpdate(
        req.params.adminId,
        { isActive: false },
        { new: true }
    ).select('-password');
    if (!admin) {
        const err = new Error('Admin not found'); err.statusCode = 404; throw err;
    }
    res.json({ success: true, message: 'Admin deactivated', admin });
};

/**
 * @route   PUT /api/superadmin/admins/:adminId/activate
 * @access  Private (superadmin)
 */
const activateAdmin = async (req, res) => {
    const admin = await User.findByIdAndUpdate(
        req.params.adminId,
        { isActive: true },
        { new: true }
    ).select('-password');
    if (!admin) {
        const err = new Error('Admin not found'); err.statusCode = 404; throw err;
    }
    res.json({ success: true, message: 'Admin activated', admin });
};

module.exports = { getAllAdmins, getAllRooms, getPlatformStats, deactivateRoom, deactivateAdmin, activateAdmin };
