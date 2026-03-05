const slugify = require('slugify');
const QRCode = require('qrcode');
const Room = require('../models/Room');
const Target = require('../models/Target');
const Analytics = require('../models/Analytics');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');

/**
 * @route   POST /api/rooms
 * @access  Private (admin)
 */
const createRoom = async (req, res) => {
    try {
        const { name, location, description } = req.body;
        console.log(`[DEBUG] createRoom started for user: ${req.user.id}`);


        // Generate unique slug
        let slug = slugify(name, { lower: true, strict: true });
        const existing = await Room.findOne({ slug });
        if (existing) {
            slug = `${slug}-${Date.now()}`;
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const scannerUrl = `${frontendUrl}/scan/${slug}`;

        // Generate QR code
        console.log('[DEBUG] Generating QR code for:', scannerUrl);
        const qrDataUrl = await QRCode.toDataURL(scannerUrl, {
            errorCorrectionLevel: 'H',
            width: 400,
            margin: 2,
            color: { dark: '#1a1a2e', light: '#ffffff' },
        });

        const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

        console.log('[DEBUG] Uploading QR to Cloudinary...');
        const cloudinaryResult = await uploadToCloudinary(qrBuffer, 'phygital/qrcodes', 'image');
        const qrCodeUrl = cloudinaryResult.url;
        console.log('[DEBUG] QR Uploaded:', qrCodeUrl);

        const room = await Room.create({
            name,
            slug,
            location,
            description,
            adminId: req.user.id,
            scannerUrl,
            qrCodeUrl,
        });

        // Create analytics record for the room
        await Analytics.create({ roomId: room._id });

        res.status(201).json({ success: true, message: 'Room created successfully', room });
    } catch (error) {
        console.error('❌ Error in createRoom:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create room',
            error: error.stack
        });
    }
};

/**
 * @route   GET /api/rooms
 * @access  Private (admin – own rooms)
 */
const getRooms = async (req, res) => {
    console.log('[DEBUG] getRooms for user:', req.user.id);
    const rooms = await Room.find({ adminId: req.user.id }).sort({ createdAt: -1 });
    console.log('[DEBUG] Found rooms:', rooms.length);
    res.json({ success: true, count: rooms.length, rooms });
};

/**
 * @route   GET /api/rooms/:id
 * @access  Private
 */
const getRoom = async (req, res) => {
    const room = await Room.findById(req.params.id).populate('adminId', 'name email');
    if (!room) {
        const err = new Error('Room not found'); err.statusCode = 404; throw err;
    }

    // Only owner or superadmin can access
    if (room.adminId._id.toString() !== req.user.id && req.user.role !== 'superadmin') {
        const err = new Error('Not authorized'); err.statusCode = 403; throw err;
    }

    const targets = await Target.find({ roomId: room._id, isActive: true }).sort({ order: 1 });
    res.json({ success: true, room, targets });
};

/**
 * @route   GET /api/rooms/public/:slug
 * @access  Public (for scanner page)
 */
const getRoomPublic = async (req, res) => {
    const room = await Room.findOne({ slug: req.params.slug, isActive: true, isPublished: true });
    if (!room) {
        const err = new Error('Room not found or not published'); err.statusCode = 404; throw err;
    }

    const targets = await Target.find({
        roomId: room._id,
        isActive: true,
        mindFileStatus: 'ready',
    }).sort({ order: 1 });

    res.json({ success: true, room, targets });
};

/**
 * @route   PUT /api/rooms/:id
 * @access  Private (admin – own rooms)
 */
const updateRoom = async (req, res) => {
    let room = await Room.findById(req.params.id);
    if (!room) {
        const err = new Error('Room not found'); err.statusCode = 404; throw err;
    }
    if (room.adminId.toString() !== req.user.id && req.user.role !== 'superadmin') {
        const err = new Error('Not authorized'); err.statusCode = 403; throw err;
    }

    const { name, location, description, isPublished } = req.body;
    room = await Room.findByIdAndUpdate(
        req.params.id,
        { name, location, description, isPublished },
        { new: true, runValidators: true }
    );
    res.json({ success: true, room });
};

/**
 * @route   DELETE /api/rooms/:id
 * @access  Private (admin – own rooms)
 */
const deleteRoom = async (req, res) => {
    const room = await Room.findById(req.params.id);
    if (!room) {
        const err = new Error('Room not found'); err.statusCode = 404; throw err;
    }
    if (room.adminId.toString() !== req.user.id && req.user.role !== 'superadmin') {
        const err = new Error('Not authorized'); err.statusCode = 403; throw err;
    }

    // Soft delete
    room.isActive = false;
    await room.save();

    res.json({ success: true, message: 'Room deactivated successfully' });
};

/**
 * @route   POST /api/rooms/:id/publish
 * @access  Private (admin)
 */
const publishRoom = async (req, res) => {
    const room = await Room.findById(req.params.id);
    if (!room) {
        const err = new Error('Room not found'); err.statusCode = 404; throw err;
    }
    if (room.adminId.toString() !== req.user.id && req.user.role !== 'superadmin') {
        const err = new Error('Not authorized'); err.statusCode = 403; throw err;
    }

    // Check if there are ready targets
    const readyTargets = await Target.countDocuments({ roomId: room._id, mindFileStatus: 'ready' });
    if (readyTargets === 0) {
        const err = new Error('Cannot publish: please add at least one AR target with a compiled .mind file');
        err.statusCode = 400;
        throw err;
    }

    const updatedRoom = await Room.findByIdAndUpdate(
        req.params.id,
        { isPublished: true },
        { new: true }
    );

    res.json({
        success: true,
        message: 'Room published! Your scanner is now live.',
        room: updatedRoom,
        scannerUrl: updatedRoom.scannerUrl,
        qrCodeUrl: updatedRoom.qrCodeUrl,
    });
};

/**
 * @route   PUT /api/rooms/:id/mind
 * @access  Private (admin)
 * @desc    Upload bundled .mind file for the entire room
 */
const uploadBundledMind = async (req, res) => {
    const room = await Room.findById(req.params.id);
    if (!room) {
        const err = new Error('Room not found'); err.statusCode = 404; throw err;
    }
    if (room.adminId.toString() !== req.user.id && req.user.role !== 'superadmin') {
        const err = new Error('Not authorized'); err.statusCode = 403; throw err;
    }

    const mindFile = req.files?.mind?.[0];
    if (!mindFile) {
        const err = new Error('Please upload a .mind file'); err.statusCode = 400; throw err;
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(
        mindFile.buffer,
        'phygital/bundled-mind-files',
        'raw',
        mindFile.originalname
    );

    // Delete old one if exists
    if (room.mindFilePublicId) {
        await deleteFromCloudinary(room.mindFilePublicId, 'raw');
    }

    const readyTargetsCount = await Target.countDocuments({ roomId: room._id, mindFileStatus: 'ready' });

    room.mindFileUrl = result.url;
    room.mindFilePublicId = result.publicId;
    room.bundledTargetCount = readyTargetsCount;
    await room.save();

    res.json({ success: true, message: 'AR tracking data updated successfully', mindFileUrl: result.url });
};

module.exports = { createRoom, getRooms, getRoom, getRoomPublic, updateRoom, deleteRoom, publishRoom, uploadBundledMind };
