export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    
    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing id' });
        
        const REDIS_URL = process.env.KV_REST_API_URL;
        const REDIS_TOKEN = process.env.KV_REST_API_TOKEN;
        
        if (!REDIS_URL || !REDIS_TOKEN) {
            return res.status(500).json({ error: 'Missing env vars' });
        }
        
        // Get từ Upstash Redis
        const response = await fetch(`${REDIS_URL}/get/cookie:${id}`, {
            headers: {
                'Authorization': `Bearer ${REDIS_TOKEN}`
            }
        });
        
        if (!response.ok) {
            return res.status(404).json({ error: 'Cookie not found' });
        }
        
        const result = await response.json();
        
        if (!result.result) {
            return res.status(404).json({ error: 'Cookie not found or expired' });
        }
        
        // result.result là string JSON đã lưu
        const data = JSON.parse(result.result);
        
        console.log(`✅ Get: ${id} | nid: ${!!data.nid} | sid: ${!!data.sid}`);
        return res.status(200).json(data);
    } catch (err) {
        console.error('Get error:', err);
        return res.status(500).json({ error: err.message });
    }
}
