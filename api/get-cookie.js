import fs from 'fs';
import path from 'path';

const TMP_DIR = '/tmp/cookies';
const TTL = 24 * 60 * 60 * 1000;

if (!global.cookieCache) {
    global.cookieCache = new Map();
}

function readFromFile(id) {
    try {
        const filePath = path.join(TMP_DIR, `${id}.json`);
        if (!fs.existsSync(filePath)) return null;
        
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        
        // Check hết hạn
        if (Date.now() - data.createdAt > TTL) {
            try { fs.unlinkSync(filePath); } catch {}
            return null;
        }
        
        return data;
    } catch (e) {
        console.log('Read file error:', e.message);
        return null;
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing id' });
        
        // 1️⃣ Thử lấy từ RAM trước (nhanh)
        let data = global.cookieCache.get(id);
        let source = 'RAM';
        
        // 2️⃣ Không có thì lấy từ file
        if (!data) {
            data = readFromFile(id);
            source = 'FILE';
            
            // Nếu file có thì cache lại vào RAM
            if (data) {
                global.cookieCache.set(id, data);
            }
        }
        
        if (!data) {
            console.log(`❌ Not found: ${id}`);
            return res.status(404).json({ error: 'Cookie not found or expired' });
        }
        
        console.log(`✅ Get: ${id} | Source: ${source} | nid: ${!!data.nid} | sid: ${!!data.sid}`);
        
        return res.status(200).json({
            nid: data.nid,
            sid: data.sid,
            did: data.did
        });
    } catch (err) {
        console.error('Get error:', err);
        return res.status(500).json({ error: err.message });
    }
}
