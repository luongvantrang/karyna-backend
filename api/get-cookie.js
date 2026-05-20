import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing id' });

        let data = await redis.get(id);
        console.log('Raw data from Redis:', typeof data, data);

        // Fix: xử lý mọi trường hợp data trả về
        if (!data) return res.status(404).json({ error: 'Not found' });

        // Nếu data là string thì parse
        if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch(e) {}
        }

        // Nếu data vẫn là string (bị double stringify)
        if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch(e) {}
        }

        console.log('Final data:', data);
        return res.status(200).json(data);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: e.message });
    }
}
