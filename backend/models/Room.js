const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Room name is required'],
            trim: true,
            maxlength: [150, 'Room name cannot exceed 150 characters'],
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
        location: {
            type: String,
            required: [true, 'Location is required'],
            trim: true,
        },
        description: {
            type: String,
            default: '',
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        scannerUrl: {
            type: String,
            default: null,
        },
        qrCodeUrl: {
            type: String,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
        coverImage: {
            type: String,
            default: null,
        },
        targetCount: {
            type: Number,
            default: 0,
        },
        // Bundled MindAR tracking data for all targets in this room
        mindFileUrl: {
            type: String,
            default: null,
        },
        mindFilePublicId: {
            type: String,
            default: null,
        },
        bundledTargetCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Indexes
RoomSchema.index({ adminId: 1 });
RoomSchema.index({ isActive: 1, isPublished: 1 });

module.exports = mongoose.model('Room', RoomSchema);
