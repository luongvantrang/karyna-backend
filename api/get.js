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

    try {
        const upstashRes = await fetch(`${redisUrl}/get/login:${id}`, {
            headers: { 'Authorization': `Bearer ${redisToken}` }
        });

        const upstashData = await upstashRes.json();

        if (!upstashData.result) {
            return res.status(404).json({
                success: false,
                message: 'Link hết hạn hoặc không tồn tại!'
            });
        }

        let data = upstashData.result;

        if (typeof data === 'string') {
            data = JSON.parse(data);
        }

        if (data.value && typeof data.value === 'string') {
            data = JSON.parse(data.value);
        }

        const cookies = data.cookies;
        const filename = data.filename;

        if (!cookies) {
            return res.status(500).json({
                success: false,
                message: 'Không tìm thấy cookies!'
            });
        }

        return res.status(200).json({
            success: true,
            cookies: cookies,
            filename: filename
        });

    } catch (error) {
        console.error('❌ Lỗi get:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
