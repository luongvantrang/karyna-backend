const crypto = require('crypto');
require('dotenv').config();
const secret = process.env.LIC_SIGNING_SECRET;
function gen(type, dur) {
    const raw = `KARYNA-${type}-${dur}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const sig = crypto.createHmac('sha256', secret).update(raw).digest('hex').slice(0, 12).toUpperCase();
    console.log(`${raw}-${sig}`);
}
gen('PRO', '30D'); // Chạy: node keygen.js