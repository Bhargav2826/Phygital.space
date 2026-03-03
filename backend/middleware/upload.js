const multer = require('multer');
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

// Store files in memory (we'll upload directly to Cloudinary)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/webm', 'video/quicktime',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/octet-stream', // Required for .mind files
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} is not supported`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
});

// Helper for multiple fields with error handling
const uploadTargetFiles = (req, res, next) => {
    const multiUpload = upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'mind', maxCount: 1 },
        { name: 'content', maxCount: 1 }
    ]);

    multiUpload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            logToFile(`MULTER ERROR: ${err.message} (${err.code})`);
            console.error('[MULTER ERROR]', err);
            return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
        } else if (err) {
            logToFile(`UPLOAD ERROR: ${err.message}`);
            console.error('[UPLOAD ERROR]', err);
            return res.status(500).json({ success: false, message: err.message });
        }
        next();
    });
};

module.exports = { upload, uploadTargetFiles };
