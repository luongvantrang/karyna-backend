import fs from 'fs';
import path from 'path';

const TMP_DIR = '/tmp/cookies';
const TTL = 24 * 60 * 60 * 1000; // 24 giờ

// Tạo thư mục nếu chưa có
if (!fs.existsSync(TMP_DIR)) {
    try { fs.mkdirSync(TMP_DIR, { recursive: true }); } catch {}
}

// Global cache
if (!global.cookieCache) {
    global.cookieCache = new Map();
}

function saveToFile(id, data) {
    try {
        const filePath = path.join(TMP_DIR, `${id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data));
        return true;
    } catch (e) {
        console.log('Save file error:', e.message);
        return false;
    }
}

function cleanup() {
    const now = Date.now();
    
    // Cleanup RAM
    for (const [id, data] of global.cookieCache.entries()) {
        if (now - data.createdAt > TTL) {
            global.cookieCache.delete(id);
        }
    }
    
    // Cleanup files (xóa file > 24h)
    try {
        const files = fs.readdirSync(TMP_DIR);
        for (const file of files) {
            const filePath = path.join(TMP_DIR, file);
            try {
                const stat = fs.statSync(filePath);
                if (now - stat.mtimeMs > TTL) {
                    fs.unlinkSync(filePath);
                }
            } catch {}
        }
    } catch {}
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        cleanup();
        
        const { nid, sid, did } = req.body;
        if (!nid) return res.status(400).json({ error: 'Missing nid' });
        
        const id = Math.random().toString(36).substring(2, 10);
        const data = {
            nid,
            sid: sid || '',
            did: did || '',
            createdAt: Date.now()
        };
        
        // Lưu cả RAM và file
        global.cookieCache.set(id, data);
        const fileSaved = saveToFile(id, data);
        
        console.log(`✅ Saved: ${id} | RAM: ${global.cookieCache.size} | File: ${fileSaved}`);
        
        return res.status(200).json({ id, success: true, persistent: fileSaved });
    } catch (err) {
        console.error('Save error:', err);
        return res.status(500).json({ error: err.message });
    }
}
