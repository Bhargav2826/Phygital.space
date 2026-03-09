const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

/**
 * Upload a buffer to Cloudinary.
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Cloudinary folder path
 * @param {string} resourceType - auto | image | video | raw
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadToCloudinary = async (buffer, folder = 'phygital', resourceType = 'auto', filename = null) => {
    // 1. Prepare options
    const options = {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
    };

    // For raw files (PDFs, mind files), we use the Phygital_ prefix but must keep the extension
    if (resourceType === 'raw' && filename) {
        const lastDotIndex = filename.lastIndexOf(".");
        let extension = lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';

        // WORKAROUND: Cloudinary often blocks PDF delivery (401). 
        if (extension.toLowerCase() === '.pdf') {
            extension = '.mind';
        }

        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const safeBase = filename.substring(0, lastDotIndex !== -1 ? lastDotIndex : filename.length)
            .replace(/[^a-zA-Z0-9]/g, '_')
            .substring(0, 50);

        options.public_id = `Phygital_${safeBase}_${randomSuffix}${extension}`;
    } else if (resourceType === 'raw') {
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        options.public_id = `Phygital_${randomSuffix}.mind`;
    }

    // 2. Decide upload strategy
    const isLargeFile = buffer.length > 10 * 1024 * 1024; // > 10MB
    const isVideo = resourceType === 'video';

    // For videos or large files, use upload_large with a temporary file
    if (isVideo || isLargeFile) {
        const tempPath = path.join(os.tmpdir(), `upload_${Date.now()}_${Math.random().toString(36).substring(7)}`);
        try {
            await writeFileAsync(tempPath, buffer);

            // upload_large is better for big files and videos
            const result = await cloudinary.uploader.upload(tempPath, {
                ...options,
                resource_type: isVideo ? 'video' : 'auto',
                chunk_size: 6000000 // 6MB chunks
            });

            // Cleanup
            await unlinkAsync(tempPath).catch(err => console.error('Temp file cleanup failed:', err));

            return { url: result.secure_url, publicId: result.public_id };
        } catch (err) {
            // Cleanup on error
            if (fs.existsSync(tempPath)) await unlinkAsync(tempPath).catch(() => { });
            console.error('[CLOUDINARY LARGE UPLOAD ERROR]', err);
            throw err;
        }
    }

    // For smaller files, use standard upload_stream
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
                if (error) {
                    console.error('[CLOUDINARY STREAM UPLOAD ERROR]', error);
                    return reject(error);
                }
                resolve({ url: result.secure_url, publicId: result.public_id });
            }
        );

        uploadStream.on('error', (err) => {
            console.error('[CLOUDINARY STREAM ERROR]', err);
            reject(err);
        });

        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

/**
 * Delete a resource from Cloudinary by public ID.
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (err) {
        console.error(`Failed to delete ${publicId} from Cloudinary:`, err.message);
    }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };
