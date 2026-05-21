export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        const { nid, sid, did } = req.body;
        if (!nid) return res.status(400).json({ error: 'Missing nid' });
        
        const REDIS_URL = process.env.KV_REST_API_URL;
        const REDIS_TOKEN = process.env.KV_REST_API_TOKEN;
        
        if (!REDIS_URL || !REDIS_TOKEN) {
            return res.status(500).json({ 
                error: 'Missing env vars',
                hasUrl: !!REDIS_URL,
                hasToken: !!REDIS_TOKEN
            });
        }
        
        const id = Math.random().toString(36).substring(2, 10);
        const data = JSON.stringify({ nid, sid: sid || '', did: did || '' });
        
        // Lưu vào Upstash Redis qua REST API
        const response = await fetch(`${REDIS_URL}/set/cookie:${id}?EX=86400`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${REDIS_TOKEN}`,
                'Content-Type': 'text/plain'
            },
            body: data
        });
        
        if (!response.ok) {
            const errText = await response.text();
            console.error('Redis save error:', errText);
            throw new Error(`Redis ${response.status}: ${errText}`);
        }
        
        console.log(`✅ Saved: ${id}`);
        return res.status(200).json({ id, success: true });
    } catch (err) {
        console.error('Save error:', err);
        return res.status(500).json({ error: err.message });
    }
}
