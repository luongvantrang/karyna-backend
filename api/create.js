const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'data', 'links.json');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { cookies, filename } = req.body;

        if (!cookies || !filename) {
            return res.status(400).json({ success: false, message: 'Missing data' });
        }

        // Đọc database
        let db = {};
        if (fs.existsSync(DATA_FILE)) {
            db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        }

        // Tạo ID ngẫu nhiên 8 ký tự
        const id = Math.random().toString(36).substring(2, 10);
        const expires = Date.now() + 15 * 60 * 1000; // Hết hạn sau 15 phút

        db[id] = {
            cookies: cookies,
            filename: filename,
            expires: expires,
            createdAt: Date.now()
        };

        // Lưu lại
        fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));

        const loginUrl = `https://${process.env.VERCEL_URL || 'your-domain.vercel.app'}/login?id=${id}`;

        return res.status(200).json({
            success: true,
            url: loginUrl,
            expiresIn: "15 phút"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
