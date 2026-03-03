const mongoose = require('mongoose');

const TargetSchema = new mongoose.Schema(
    {
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room',
            required: true,
        },
        name: {
            type: String,
            required: [true, 'Target name is required'],
            trim: true,
            maxlength: [150, 'Target name cannot exceed 150 characters'],
        },
        description: {
            type: String,
            default: '',
        },
        // Original image (what the user will scan in real world)
        imageUrl: {
            type: String,
            required: [true, 'Image URL is required'],
        },
        imagePublicId: {
            type: String,
            default: null,
        },
        // MindAR .mind tracking file
        mindFileUrl: {
            type: String,
            default: null,
        },
        mindFilePublicId: {
            type: String,
            default: null,
        },
        mindFileStatus: {
            type: String,
            enum: ['pending', 'processing', 'ready', 'failed'],
            default: 'pending',
        },
        // AR Content to overlay
        contentType: {
            type: String,
            enum: ['video', 'pdf', 'image', 'info', 'none'],
            default: 'none',
        },
        contentUrl: {
            type: String,
            default: null,
        },
        contentPublicId: {
            type: String,
            default: null,
        },
        contentText: {
            type: String,
            default: '',
        },
        contentTitle: {
            type: String,
            default: '',
        },
        // Display order in the scanner
        order: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        // Analytics per target
        scanCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Indexes
TargetSchema.index({ roomId: 1, order: 1 });

module.exports = mongoose.model('Target', TargetSchema);
