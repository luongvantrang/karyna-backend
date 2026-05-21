import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    const { id } = req.query;
    
    if (!id) {
        return res.status(400).json({ error: 'Missing id' });
    }

    const data = await kv.get(id);
    
    if (!data) {
        return res.status(404).json({ error: 'Cookie expired or not found' });
    }

    return res.status(200).json(data);
}
