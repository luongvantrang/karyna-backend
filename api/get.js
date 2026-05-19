import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ 
            success: false, 
            message: 'ID is required' 
        });
    }

    try {
        const raw = await redis.get(`login:${id}`);

        if (!raw) {
            return res.status(404).json({ 
                success: false, 
                message: 'Link hết hạn hoặc không tồn tại!' 
            });
        }

        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

        return res.status(200).json({
            success: true,
            cookies: data.cookies,
            filename: data.filename
        });

    } catch (error) {
        console.error('❌ Lỗi get:', error.message);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}
