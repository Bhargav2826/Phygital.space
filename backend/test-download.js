
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const axios = require('axios');
const Target = require('./models/Target');

async function testApiDownloadProper() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const targetId = '69a68ef40f255e96b7e8409e';
        const target = await Target.findById(targetId);

        if (!target) {
            console.log('Target not found');
            process.exit(1);
        }

        console.log('Found target:', target.name);
        console.log('Public ID:', target.contentPublicId);

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;
        const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

        // The public ID often has the extension in it for 'raw' files.
        // Let's try both ways.
        const publicIds = [
            target.contentPublicId,
            target.contentPublicId.replace('.pdf', '')
        ];

        for (const pid of publicIds) {
            console.log(`\nTesting with public_id: ${pid}`);
            const url = `https://api.cloudinary.com/v1_1/${cloudName}/raw/download`;

            try {
                const response = await axios({
                    method: 'get',
                    url: url,
                    params: {
                        public_id: pid,
                        format: 'pdf',
                        timestamp: Math.floor(Date.now() / 1000)
                    },
                    headers: {
                        'Authorization': `Basic ${auth}`
                    },
                    timeout: 10000
                });
                console.log(`  SUCCESS! Status: ${response.status}`);
            } catch (err) {
                console.log(`  FAILED! Status: ${err.response?.status}`);
                // If it's a 401, maybe we need to sign the params?
                console.log('  Response Data:', err.response?.data);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Test failed:', err.message);
        process.exit(1);
    }
}

testApiDownloadProper();
