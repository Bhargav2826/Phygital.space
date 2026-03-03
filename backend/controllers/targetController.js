const Room = require('../models/Room');
const Target = require('../models/Target');
const axios = require('axios');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');
const fs = require('fs');
const path = require('path');

const logToFile = (msg) => {
    try {
        const logPath = path.join(__dirname, '../debug.log');
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
    } catch (e) {
        console.error('Failed to write to debug.log', e);
    }
};



/**
 * Helper: verify room ownership
 */
const verifyRoomOwner = async (roomId, userId, role) => {
    const room = await Room.findById(roomId);
    if (!room) {
        const err = new Error('Room not found'); err.statusCode = 404; throw err;
    }
    if (room.adminId.toString() !== userId && role !== 'superadmin') {
        const err = new Error('Not authorized'); err.statusCode = 403; throw err;
    }
    return room;
};

/**
 * @route   POST /api/targets/room/:roomId
 * @access  Private (admin)
 * @desc    Upload image target & pre-compiled .mind file (from frontend)
 */
const uploadTarget = async (req, res) => {
    const { roomId } = req.params;
    const { name, description } = req.body;

    await verifyRoomOwner(roomId, req.user.id, req.user.role);

    const imageFile = req.files?.image?.[0];
    const mindFile = req.files?.mind?.[0];

    if (!imageFile) {
        const err = new Error('Please upload an image target file'); err.statusCode = 400; throw err;
    }

    // 1. Upload original image to Cloudinary
    console.log('[DEBUG] Uploading target image to Cloudinary...');
    const { url: imageUrl, publicId: imagePublicId } = await uploadToCloudinary(
        imageFile.buffer,
        'phygital/targets',
        'image'
    );

    let mindFileUrl = null;
    let mindFilePublicId = null;
    let mindFileStatus = 'pending';

    // 2. Upload .mind file if provided by frontend
    if (mindFile) {
        console.log('[DEBUG] Uploading pre-compiled .mind file to Cloudinary...');
        const result = await uploadToCloudinary(
            mindFile.buffer,
            'phygital/mind-files',
            'raw',
            mindFile.originalname
        );
        mindFileUrl = result.url;
        mindFilePublicId = result.publicId;
        mindFileStatus = 'ready';
    }

    // 3. Create target record
    const target = await Target.create({
        roomId,
        name: name || imageFile.originalname,
        description,
        imageUrl,
        imagePublicId,
        mindFileUrl,
        mindFilePublicId,
        mindFileStatus,
    });

    // Update room's targetCount
    await Room.findByIdAndUpdate(roomId, { $inc: { targetCount: 1 } });

    res.status(201).json({
        success: true,
        message: mindFile ? 'Target uploaded successfully' : 'Image uploaded. Please wait for compilation.',
        target,
    });
};

/**
 * @route   PUT /api/targets/:targetId/content
 * @access  Private (admin)
 * @desc    Upload AR content (video, PDF, etc.) linked to a target
 */
const uploadContent = async (req, res) => {
    const { targetId } = req.params;
    const { contentType, contentText, contentTitle } = req.body;

    const target = await Target.findById(targetId);
    if (!target) {
        const err = new Error('Target not found'); err.statusCode = 404; throw err;
    }

    await verifyRoomOwner(target.roomId, req.user.id, req.user.role);

    console.log('[DEBUG] uploadContent body:', req.body);
    console.log('[DEBUG] uploadContent files:', req.files ? Object.keys(req.files) : 'none');

    logToFile(`UPLOAD: ${req.method} ${req.originalUrl} for target ${target._id}`);
    logToFile(`BODY: ${JSON.stringify(req.body)}`);
    logToFile(`FILES: ${req.files ? Object.keys(req.files).join(',') : 'none'}`);

    const contentFile = req.files?.content?.[0];
    let contentUrl = target.contentUrl;
    let contentPublicId = target.contentPublicId;

    if (contentFile) {
        logToFile(`FILE INFO: ${contentFile.originalname}, ${contentFile.mimetype}, ${contentFile.buffer?.length} bytes`);
        if (!contentFile.buffer || contentFile.buffer.length === 0) {
            logToFile('ERROR: Content file buffer is empty');
            return res.status(400).json({ success: false, message: 'Uploaded file is empty or corrupted' });
        }

        console.log(`[DEBUG] Uploading new content file: ${contentFile.originalname} (${contentFile.mimetype}) - Size: ${contentFile.buffer.length} bytes`);
        let resourceType = 'auto';
        if (contentFile.mimetype.startsWith('video/')) resourceType = 'video';
        else if (contentFile.mimetype.startsWith('image/')) resourceType = 'image';
        else if (contentFile.mimetype === 'application/pdf') resourceType = 'raw';

        try {
            const result = await uploadToCloudinary(contentFile.buffer, 'phygital/content', resourceType, contentFile.originalname);
            contentUrl = result.url;
            contentPublicId = result.publicId;
            console.log('[DEBUG] Content uploaded to Cloudinary successfully:', contentUrl);
        } catch (uploadErr) {
            console.error('[ERROR] Cloudinary upload failed:', uploadErr);
            // If it's a Cloudinary error, return it with the provider's message
            return res.status(uploadErr.http_code || 500).json({
                success: false,
                message: `Cloudinary upload failed: ${uploadErr.message || 'Unknown error'}`,
                error: uploadErr
            });
        }
    }

    // Delete old content from Cloudinary if replacing with a new file
    if (target.contentPublicId && contentFile && contentPublicId !== target.contentPublicId) {
        console.log('[DEBUG] Deleting old content from Cloudinary:', target.contentPublicId);
        await deleteFromCloudinary(target.contentPublicId, target.contentType === 'video' ? 'video' : 'raw');
    }

    // Mandatory update of all fields
    target.contentType = contentType || target.contentType;
    target.contentUrl = contentUrl;
    target.contentPublicId = contentPublicId;
    target.contentText = contentText !== undefined ? contentText : target.contentText;
    target.contentTitle = contentTitle !== undefined ? contentTitle : target.contentTitle;

    console.log('[DEBUG] Saving target with Type:', target.contentType, 'Content:', !!target.contentUrl);
    await target.save();

    res.json({ success: true, message: 'Content updated successfully', target });
};

/**
 * @route   GET /api/targets/room/:roomId
 * @access  Private
 */
const getTargets = async (req, res) => {
    await verifyRoomOwner(req.params.roomId, req.user.id, req.user.role);
    const targets = await Target.find({ roomId: req.params.roomId }).sort({ order: 1 });
    res.json({ success: true, count: targets.length, targets });
};

/**
 * @route   GET /api/targets/:targetId
 * @access  Private
 */
const getTarget = async (req, res) => {
    const target = await Target.findById(req.params.targetId);
    if (!target) {
        const err = new Error('Target not found'); err.statusCode = 404; throw err;
    }
    res.json({ success: true, target });
};

/**
 * @route   PUT /api/targets/:targetId
 * @access  Private
 */
const updateTarget = async (req, res) => {
    let target = await Target.findById(req.params.targetId);
    if (!target) {
        const err = new Error('Target not found'); err.statusCode = 404; throw err;
    }
    await verifyRoomOwner(target.roomId, req.user.id, req.user.role);

    const { name, description, order } = req.body;
    target = await Target.findByIdAndUpdate(
        req.params.targetId,
        { name, description, order },
        { new: true, runValidators: true }
    );
    res.json({ success: true, target });
};

/**
 * @route   DELETE /api/targets/:targetId
 * @access  Private
 */
const deleteTarget = async (req, res) => {
    const target = await Target.findById(req.params.targetId);
    if (!target) {
        const err = new Error('Target not found'); err.statusCode = 404; throw err;
    }
    await verifyRoomOwner(target.roomId, req.user.id, req.user.role);

    // Clean up Cloudinary assets
    if (target.imagePublicId) await deleteFromCloudinary(target.imagePublicId, 'image');
    if (target.mindFilePublicId) await deleteFromCloudinary(target.mindFilePublicId, 'raw');
    if (target.contentPublicId) {
        const type = target.contentType === 'video' ? 'video' : 'raw';
        await deleteFromCloudinary(target.contentPublicId, type);
    }

    await Target.findByIdAndDelete(req.params.targetId);
    await Room.findByIdAndUpdate(target.roomId, { $inc: { targetCount: -1 } });

    res.json({ success: true, message: 'Target deleted successfully' });
};

const downloadTargetContent = async (req, res) => {
    try {
        const target = await Target.findById(req.params.targetId);
        if (!target || !target.contentUrl) {
            console.error(`[DOWNLOAD] Target or contentUrl missing for ID: ${req.params.targetId}`);
            return res.status(404).json({ success: false, message: 'Content not found' });
        }

        console.log(`[DOWNLOAD] Proxying: ${target.name} (${target._id})`);
        console.log(`[DOWNLOAD] URL: ${target.contentUrl}`);

        const authHeader = Buffer.from(`${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`).toString('base64');

        const response = await axios({
            method: 'get',
            url: target.contentUrl,
            responseType: 'stream',
            headers: { 'Authorization': `Basic ${authHeader}` },
            timeout: 30000
        });

        console.log(`[DOWNLOAD] Status: ${response.status}`);

        let ext = target.contentUrl.split('.').pop().split('?')[0];

        // Restore correct extension for the user if we used a workaround (.mind or .bin)
        if (target.contentType === 'pdf' && (ext === 'mind' || ext === 'bin')) {
            ext = 'pdf';
        } else if (!ext || ext.length > 4) {
            if (target.contentType === 'pdf') ext = 'pdf';
            else if (target.contentType === 'video') ext = 'mp4';
            else if (target.contentType === 'image') ext = 'jpg';
            else ext = 'bin';
        }

        const filename = `Phygital_${target._id.toString().slice(-6)}.${ext}`;

        res.setHeader('Content-Type', response.headers['content-type'] || (target.contentType === 'pdf' ? 'application/pdf' : 'application/octet-stream'));
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        response.data.pipe(res);

        response.data.on('error', (err) => {
            console.error('[DOWNLOAD] Stream Error:', err.message);
            if (!res.headersSent) res.status(500).send('Streaming error');
        });

    } catch (error) {
        console.error('[DOWNLOAD] Error:', error.message);
        if (error.response) {
            console.error(`[DOWNLOAD] Cloudinary Response Status: ${error.response.status}`);
            if (error.response.status === 401 || error.response.status === 403) {
                return res.status(403).json({
                    success: false,
                    message: 'Cloudinary is blocking this PDF. Please re-upload this file to apply the fix.'
                });
            }
        }
        res.status(500).json({ success: false, message: `Download failed: ${error.message}` });
    }
};

module.exports = { uploadTarget, uploadContent, getTargets, getTarget, updateTarget, deleteTarget, downloadTargetContent };
