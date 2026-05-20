const store = {};

export default function handler(req, res) {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const data = store[id];
    if (!data) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json(data);
}
