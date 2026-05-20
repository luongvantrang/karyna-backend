import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing id' });

        const data = await redis.get(id);
        if (!data) return res.status(404).json({ error: 'Not found' });

        return res.status(200).json(typeof data === 'string' ? JSON.parse(data) : data);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
