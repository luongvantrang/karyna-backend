import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { nid, sid, did } = req.body;
        if (!nid) return res.status(400).json({ error: 'Missing nid' });

        const id = Math.random().toString(36).substring(2, 10);
        
        // Lưu dưới dạng string để tránh lỗi parse
        const dataToSave = JSON.stringify({ nid, sid: sid || '', did: did || '' });
        await redis.set(id, dataToSave, { ex: 86400 });
        
        console.log('Saved ID:', id, 'Data length:', dataToSave.length);
        return res.status(200).json({ id });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: e.message });
    }
}
