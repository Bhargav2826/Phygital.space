const mongoose = require('mongoose');

const DailyStat = new mongoose.Schema({
    date: { type: String, required: true }, // YYYY-MM-DD
    scans: { type: Number, default: 0 },
    interactions: { type: Number, default: 0 },
}, { _id: false });

const AnalyticsSchema = new mongoose.Schema(
    {
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room',
            required: true,
        },
        totalScans: {
            type: Number,
            default: 0,
        },
        uniqueUsers: {
            type: [String], // array of fingerprint/device IDs
            default: [],
        },
        totalInteractions: {
            type: Number,
            default: 0,
        },
        // Interactions keyed by targetId string
        targetInteractions: {
            type: Map,
            of: Number,
            default: {},
        },
        // Daily stats array (last 30 entries)
        dailyStats: {
            type: [DailyStat],
            default: [],
        },
        lastScanned: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// Indexes
// roomId is already unique: true in schema

module.exports = mongoose.model('Analytics', AnalyticsSchema);
