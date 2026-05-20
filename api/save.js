import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { nid, sid, did } = req.body;
    
    if (!nid) {
        return res.status(400).json({ error: 'Missing nid' });
    }

    // Tạo ID ngắn ngẫu nhiên
    const id = Math.random().toString(36).substring(2, 10);
    
    // Lưu vào KV, tự xóa sau 24h
    await kv.set(id, { nid, sid, did }, { ex: 86400 });
    
    return res.status(200).json({ id });
}
