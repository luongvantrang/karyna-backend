import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    
    try {
        const { nid, sid, did } = req.body;
        if (!nid) return res.status(400).json({ error: 'Missing nid' });

        const id = Math.random().toString(36).substring(2, 10);
        await kv.set(id, { nid, sid, did }, { ex: 86400 });

        return res.status(200).json({ id });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: e.message });
    }
}
