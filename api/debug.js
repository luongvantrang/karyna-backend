export default function handler(req, res) {
    // Lọc tất cả env vars liên quan đến Redis/KV/Upstash
    const relevantEnvs = {};
    for (const key in process.env) {
        if (key.includes('KV') || key.includes('REDIS') || key.includes('UPSTASH')) {
            const value = process.env[key];
            relevantEnvs[key] = {
                hasValue: !!value,
                length: value?.length || 0,
                preview: value ? value.substring(0, 30) + '...' : 'EMPTY'
            };
        }
    }
    
    res.status(200).json({
        nodeEnv: process.env.NODE_ENV,
        foundEnvs: relevantEnvs,
        totalCount: Object.keys(relevantEnvs).length
    });
}
