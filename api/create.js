export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
        return res.status(500).json({
            success: false,
            message: 'Missing environment variables'
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

        const id = Math.random().toString(36).substring(2, 10) +
                   Math.random().toString(36).substring(2, 10);

        const data = {
            cookies: cookies,
            filename: filename,
            createdAt: Date.now()
        };

        const upstashRes = await fetch(
            `${redisUrl}/set/login:${id}/${encodeURIComponent(JSON.stringify(data))}?ex=900`,
            {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${redisToken}` }
            }
        );

        const upstashData = await upstashRes.json();

        if (upstashData.result !== 'OK') {
            return res.status(500).json({
                success: false,
                message: `Upstash error: ${JSON.stringify(upstashData)}`
            });
        }

        const baseUrl = `https://${req.headers.host}`;
        const loginUrl = `${baseUrl}/login?id=${id}`;

        console.log('✅ Tạo link:', loginUrl);

        return res.status(200).json({
            success: true,
            url: loginUrl,
            expiresIn: '15 phút'
        });

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
