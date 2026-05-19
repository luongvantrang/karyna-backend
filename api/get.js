const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    // Đọc database cookie
    const cookiePath = path.join(process.cwd(), 'data', 'cookies.json');
    
    let accounts = [];
    try {
        const raw = fs.readFileSync(cookiePath, 'utf-8');
        accounts = JSON.parse(raw);
    } catch (e) {
        return res.status(500).json({ 
            success: false, 
            message: 'Lỗi đọc database!' 
        });
    }

    // Kiểm tra còn acc không
    if (accounts.length === 0) {
        return res.status(404).json({ 
            success: false, 
            message: 'Hết acc rồi!' 
        });
    }

    // Random 1 acc
    const randomIndex = Math.floor(Math.random() * accounts.length);
    const account = accounts[randomIndex];

    // Trả về thông tin acc
    return res.status(200).json({
        success: true,
        data: {
            id: account.id,
            plan: account.plan,
            country: account.country,
            billing: account.billing,
            cookies: account.cookies
        }
    });
};
