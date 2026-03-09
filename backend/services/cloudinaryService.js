const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Upload a buffer to Cloudinary.
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Cloudinary folder path
 * @param {string} resourceType - auto | image | video | raw
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadToCloudinary = (buffer, folder = 'phygital', resourceType = 'auto', filename = null) => {
    return new Promise((resolve, reject) => {
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
            // We upload with .mind to bypass this (since it's allowed); the download proxy will restore .pdf
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

        const uploadOptions = {
            ...options
        };

        // For videos or large files, use upload_large_stream which is more reliable on live servers
        const isLargeFile = buffer.length > 10 * 1024 * 1024; // > 10MB
        const isVideo = resourceType === 'video';

        const uploader = (isVideo || isLargeFile)
            ? cloudinary.uploader.upload_large_stream
            : cloudinary.uploader.upload_stream;

        const uploadStream = uploader(
            uploadOptions,
            (error, result) => {
                if (error) {
                    console.error('[CLOUDINARY UPLOAD ERROR]', error);
                    return reject(error);
                }
                resolve({ url: result.secure_url, publicId: result.public_id });
            }
        );

        // Crucial: catch stream errors to prevent crashing
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
