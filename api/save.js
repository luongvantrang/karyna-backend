const store = {};

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { nid, sid, did } = req.body;
    if (!nid) return res.status(400).json({ error: 'Missing nid' });

    const id = Math.random().toString(36).substring(2, 10);
    store[id] = { nid, sid, did, time: Date.now() };

    return res.status(200).json({ id });
}
