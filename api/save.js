export default async function handler(req, res) {
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

        const id = Math.random().toString(36).substring(2, 10);
        
        // Dùng Upstash REST API trực tiếp
        const url = `${process.env.KV_REST_API_URL}/set/cookie:${id}?ex=86400`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nid, sid, did })
        });

        if (!response.ok) {
            throw new Error(`Upstash error: ${response.status}`);
        }

        return res.status(200).json({ id, success: true });
    } catch (err) {
        console.error('Save error:', err);
        return res.status(500).json({ error: err.message });
    }
}
