import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        const { nid, sid, did } = req.body;
        
        if (!nid) {
            return res.status(400).json({ error: 'Missing nid' });
        }
        
        // Tạo ID ngẫu nhiên 8 ký tự
        const id = Math.random().toString(36).substring(2, 10);
        
        // Lưu vào KV với TTL 24h (86400s)
        await kv.set(`cookie:${id}`, JSON.stringify({ nid, sid, did }), { ex: 86400 });
        
        console.log(`✅ Saved cookie with ID: ${id}`);
        
        return res.status(200).json({ id, success: true });
    } catch (err) {
        console.error('Save error:', err);
        return res.status(500).json({ error: err.message });
    }
}
