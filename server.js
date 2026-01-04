require('dotenv').config();
const express = require('express'), http = require('http'), { Server } = require('socket.io'),
    session = require('express-session'), crypto = require('crypto'), os = require('os'),
    path = require('path'), fetch = require('node-fetch'), sqlite3 = require('sqlite3').verbose(),
    cors = require('cors');

if (!process.env.LIC_SIGNING_SECRET || !process.env.DB_INTEGRITY_SECRET) process.exit(1);

const app = express(), server = http.createServer(app), PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';
const DB_PATH = path.join(process.cwd(), 'karyna_v20.db');
const db = new sqlite3.Database(DB_PATH);

// --- SECURITY UTILS ---
function getHWID() { return crypto.createHash('sha256').update(os.cpus()?.[0]?.model + os.hostname()).digest('hex'); }

function calculateRowSig(row) {
    const data = `${(row.username||'').trim()}|${(row.license||'').trim()}|${(row.hwid||'').trim()}|${(row.expiry||'').trim()}`;
    return crypto.createHmac('sha256', process.env.DB_INTEGRITY_SECRET).update(data).digest('hex').slice(0, 16);
}

function verifyLicense(key) {
    const parts = key.split('-');
    if (parts.length !== 5) return false;
    const raw = parts.slice(0, 4).join('-'), prov = parts[4].toUpperCase();
    const exp = crypto.createHmac('sha256', process.env.LIC_SIGNING_SECRET).update(raw).digest('hex').slice(0, 12).toUpperCase();
    return crypto.timingSafeEqual(Buffer.from(prov), Buffer.from(exp));
}

// --- DATABASE INIT ---
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, salt TEXT, license TEXT, hwid TEXT, expiry TEXT, sig TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT, token TEXT, channels TEXT, desired_state INTEGER DEFAULT 0, last_heartbeat TEXT, last_error TEXT, restart_count INTEGER DEFAULT 0)");
});

app.use(cors({ origin: [process.env.FRONTEND_URL, 'http://localhost:5500'], credentials: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false,
    cookie: { secure: isProd, sameSite: isProd ? 'none' : 'lax', maxAge: 86400000 }
}));

// --- MIDDLEWARE PROTECTION ---
app.use((req, res, next) => {
    if (['/api/setup', '/api/check'].includes(req.path)) return next();
    db.get("SELECT * FROM users LIMIT 1", (err, row) => {
        if (err) process.exit(1);
        if (!row) return res.status(401).json({ needsSetup: true });
        if (row.sig !== calculateRowSig(row) || row.hwid !== getHWID()) process.exit(1);
        if (row.expiry && new Date(row.expiry) < new Date()) process.exit(1);
        req.user = row; next();
    });
});

// --- API SETUP ---
app.post('/api/setup', (req, res) => {
    const { u, p, k } = req.body;
    if (!verifyLicense(k)) return res.status(403).json({ error: "Invalid License" });
    const keyParts = k.split('-');
    let days = 30; if (keyParts[2] === '7D') days = 7; else if (keyParts[2] === '9999D') days = 36500;
    const salt = crypto.randomBytes(16).toString('hex'), hash = crypto.scryptSync(p, salt, 64).toString('hex');
    const exp = new Date(); exp.setDate(exp.getDate() + days);
    const hwid = getHWID(), expStr = exp.toISOString();
    const sig = calculateRowSig({ username: u, license: k, hwid: hwid, expiry: expStr });
    db.run("INSERT INTO users (username, password, salt, license, hwid, expiry, sig) VALUES (?,?,?,?,?,?,?)",
        [u, hash, salt, k, hwid, expStr, sig], (err) => res.json({ success: !err }));
});

server.listen(PORT, () => console.log(`🛡️ KARYNA ULTIMATE RUNNING ON ${PORT}`));