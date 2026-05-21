import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    try {
        const { id } = req.query;
        
        if (!id) {
            return res.status(400).json({ error: 'Missing id' });
        }
        
        const data = await kv.get(`cookie:${id}`);
        
        if (!data) {
            console.log(`❌ Cookie not found for ID: ${id}`);
            return res.status(404).json({ error: 'Cookie not found or expired' });
        }
        
        // Parse nếu là string
        const cookieData = typeof data === 'string' ? JSON.parse(data) : data;
        
        console.log(`✅ Retrieved cookie for ID: ${id}`);
        
        // ⚠️ KHÔNG XÓA cookie sau khi get - user có thể cần dùng lại
        // Nếu muốn 1-time use thì uncomment dòng dưới:
        // await kv.del(`cookie:${id}`);
        
        return res.status(200).json(cookieData);
    } catch (err) {
        console.error('Get error:', err);
        return res.status(500).json({ error: err.message });
    }
}
