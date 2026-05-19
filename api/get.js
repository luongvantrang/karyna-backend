export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ 
            success: false, 
            message: 'ID is required' 
        });
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
        // Lấy từ Upstash bằng fetch thuần
        const upstashRes = await fetch(`${redisUrl}/get/login:${id}`, {
            headers: {
                'Authorization': `Bearer ${redisToken}`
            }
        });

        const upstashData = await upstashRes.json();
        console.log('Upstash get response:', JSON.stringify(upstashData));

        // Upstash trả về { result: "..." } hoặc { result: null }
        if (!upstashData.result) {
            return res.status(404).json({ 
                success: false, 
                message: 'Link hết hạn hoặc không tồn tại!' 
            });
        }

        const data = JSON.parse(upstashData.result);

        return res.status(200).json({
            success: true,
            cookies: data.cookies,
            filename: data.filename
        });

    } catch (error) {
        console.error('❌ Lỗi get:', error.message);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}
