import fs from 'fs';
import path from 'path';

const TMP_DIR = '/tmp/cookies';

export default function handler(req, res) {
    if (!global.cookieCache) global.cookieCache = new Map();
    
    let fileCount = 0;
    try {
        if (fs.existsSync(TMP_DIR)) {
            fileCount = fs.readdirSync(TMP_DIR).length;
        }
    } catch {}
    
    res.status(200).json({
        ok: true,
        ramCookies: global.cookieCache.size,
        fileCookies: fileCount,
        uptime: Math.floor(process.uptime()) + 's'
    });
}
