import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing id' });

        const data = await kv.get(id);
        if (!data) return res.status(404).json({ error: 'Not found or expired' });

        return res.status(200).json(data);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: e.message });
    }
}
