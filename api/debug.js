export default function handler(req, res) {
    res.status(200).json({
        hasKvUrl: !!process.env.KV_REST_API_URL,
        hasKvToken: !!process.env.KV_REST_API_TOKEN,
        urlPreview: process.env.KV_REST_API_URL?.substring(0, 30) + "...",
        tokenLength: process.env.KV_REST_API_TOKEN?.length || 0,
        nodeEnv: process.env.NODE_ENV
    });
}
