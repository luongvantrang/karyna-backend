export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // ===== KIỂM TRA BIẾN MÔI TRƯỜNG =====
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    console.log('Redis URL:', redisUrl ? `✅ ${redisUrl.substring(0, 30)}...` : '❌ MISSING');
    console.log('Redis Token:', redisToken ? `✅ ${redisToken.substring(0, 10)}...` : '❌ MISSING');

    if (!redisUrl || !redisToken) {
        return res.status(500).json({ 
            success: false, 
            message: `Thiếu biến môi trường: ${!redisUrl ? 'UPSTASH_REDIS_REST_URL ' : ''}${!redisToken ? 'UPSTASH_REDIS_REST_TOKEN' : ''}`
        });
    }

    try {
        const { cookies, filename } = req.body;

        if (!cookies || !filename) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing cookies or filename' 
            });
        }

        // Tạo ID ngẫu nhiên
        const id = Math.random().toString(36).substring(2, 10) + 
                   Math.random().toString(36).substring(2, 10);

        const data = JSON.stringify({
            cookies: cookies,
            filename: filename,
            createdAt: Date.now()
        });

        // ===== GỌI UPSTASH BẰNG FETCH THUẦN (Không cần thư viện) =====
        console.log(`Đang lưu key: login:${id}`);

        const upstashRes = await fetch(`${redisUrl}/set/login:${id}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${redisToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                value: data,
                ex: 900  // Hết hạn sau 15 phút
            })
        });

        const upstashData = await upstashRes.json();
        console.log('Upstash response:', JSON.stringify(upstashData));

        if (!upstashRes.ok) {
            return res.status(500).json({ 
                success: false, 
                message: `Upstash error: ${JSON.stringify(upstashData)}` 
            });
        }

        // Tạo URL login
        const baseUrl = `https://${req.headers.host}`;
        const loginUrl = `${baseUrl}/login?id=${id}`;

        console.log(`✅ Tạo link thành công: ${loginUrl}`);

        return res.status(200).json({
            success: true,
            url: loginUrl,
            expiresIn: "15 phút"
        });

    } catch (error) {
        console.error('❌ Lỗi chi tiết:', error.message, error.stack);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}
