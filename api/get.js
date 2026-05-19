const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'data', 'links.json');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ success: false, message: 'ID is required' });
    }

    try {
        if (!fs.existsSync(DATA_FILE)) {
            return res.status(404).json({ success: false, message: 'No data' });
        }

        const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        const entry = db[id];

        if (!entry) {
            return res.status(404).json({ success: false, message: 'Link hết hạn hoặc không tồn tại' });
        }

        // Kiểm tra hết hạn
        if (Date.now() > entry.expires) {
            delete db[id];
            fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
            return res.status(410).json({ success: false, message: 'Link đã hết hạn' });
        }

        return res.status(200).json({
            success: true,
            cookies: entry.cookies,
            filename: entry.filename
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
