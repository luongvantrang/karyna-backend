import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { cookies, filename } = req.body;

        if (!cookies || !filename) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing cookies or filename' 
            });
        }

        // Tạo ID ngẫu nhiên
        const id = Math.random().toString(36).substring(2, 10) + 
                   Math.random().toString(36).substring(2, 10);

        const data = {
            cookies: cookies,
            filename: filename,
            createdAt: Date.now()
        };

        // Lưu vào Upstash Redis, hết hạn sau 15 phút
        await redis.set(`login:${id}`, JSON.stringify(data), { ex: 900 });

        const baseUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : 'http://localhost:3000';

        const loginUrl = `${baseUrl}/login?id=${id}`;

        console.log(`✅ Tạo link thành công: ${loginUrl}`);

        return res.status(200).json({
            success: true,
            url: loginUrl,
            expiresIn: "15 phút"
        });

    } catch (error) {
        console.error('❌ Lỗi create:', error.message);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}
