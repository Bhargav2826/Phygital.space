const Analytics = require('../models/Analytics');
const Room = require('../models/Room');

/**
 * @route   POST /api/analytics/scan/:roomId
 * @access  Public (called from scanner page)
 */
const trackScan = async (req, res) => {
    const { roomId } = req.params;
    const { deviceId } = req.body; // fingerprint/device ID from frontend

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    let analytics = await Analytics.findOne({ roomId });
    if (!analytics) {
        analytics = await Analytics.create({ roomId });
    }

    // Increment total scans
    analytics.totalScans += 1;
    analytics.lastScanned = new Date();

    // Track unique users
    if (deviceId && !analytics.uniqueUsers.includes(deviceId)) {
        analytics.uniqueUsers.push(deviceId);
    }

    // Update daily stats
    const dayIndex = analytics.dailyStats.findIndex((d) => d.date === today);
    if (dayIndex >= 0) {
        analytics.dailyStats[dayIndex].scans += 1;
    } else {
        analytics.dailyStats.push({ date: today, scans: 1, interactions: 0 });
        // Keep only last 30 days
        if (analytics.dailyStats.length > 30) {
            analytics.dailyStats.shift();
        }
    }

    await analytics.save();

    res.json({ success: true, message: 'Scan tracked' });
};

/**
 * @route   POST /api/analytics/interaction/:roomId/:targetId
 * @access  Public (called from scanner page on target detection)
 */
const trackInteraction = async (req, res) => {
    const { roomId, targetId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    let analytics = await Analytics.findOne({ roomId });
    if (!analytics) analytics = await Analytics.create({ roomId });

    // Increment total interactions
    analytics.totalInteractions += 1;

    // Increment per-target interactions
    const current = analytics.targetInteractions.get(targetId) || 0;
    analytics.targetInteractions.set(targetId, current + 1);

    // Update daily interactions
    const dayIndex = analytics.dailyStats.findIndex((d) => d.date === today);
    if (dayIndex >= 0) {
        analytics.dailyStats[dayIndex].interactions += 1;
    } else {
        analytics.dailyStats.push({ date: today, scans: 0, interactions: 1 });
    }

    await analytics.save();

    res.json({ success: true, message: 'Interaction tracked' });
};

/**
 * @route   GET /api/analytics/:roomId
 * @access  Private (admin – own room)
 */
const getRoomAnalytics = async (req, res) => {
    const { roomId } = req.params;

    // Verify room ownership
    const room = await Room.findById(roomId);
    if (!room) {
        const err = new Error('Room not found'); err.statusCode = 404; throw err;
    }
    if (room.adminId.toString() !== req.user.id && req.user.role !== 'superadmin') {
        const err = new Error('Not authorized'); err.statusCode = 403; throw err;
    }

    const analytics = await Analytics.findOne({ roomId });
    if (!analytics) {
        return res.json({
            success: true,
            analytics: { totalScans: 0, uniqueUsers: 0, totalInteractions: 0, dailyStats: [], targetInteractions: {} },
        });
    }

    res.json({
        success: true,
        analytics: {
            totalScans: analytics.totalScans,
            uniqueUsers: analytics.uniqueUsers.length,
            totalInteractions: analytics.totalInteractions,
            dailyStats: analytics.dailyStats,
            targetInteractions: Object.fromEntries(analytics.targetInteractions),
            lastScanned: analytics.lastScanned,
        },
    });
};

module.exports = { trackScan, trackInteraction, getRoomAnalytics };
