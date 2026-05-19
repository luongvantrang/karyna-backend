const PROXY_SOURCES = [
    'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt',
    'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt',
    'https://raw.githubusercontent.com/clarketm/proxy-list/master/proxy-list-raw.txt',
    'https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000'
];

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisGet(key) {
    try {
        const res = await fetch(`${REDIS_URL}/get/${key}`, {
            headers: { 'Authorization': `Bearer ${REDIS_TOKEN}` }
        });
        const data = await res.json();
        if (!data.result) return null;
        return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
    } catch (e) {
        return null;
    }
}

async function redisSet(key, value, ttl = 3600) {
    try {
        const encoded = encodeURIComponent(JSON.stringify(value));
        await fetch(`${REDIS_URL}/set/${key}/${encoded}?ex=${ttl}`, {
            headers: { 'Authorization': `Bearer ${REDIS_TOKEN}` }
        });
        return true;
    } catch (e) {
        return false;
    }
}

export async function fetchProxies() {
    const cached = await redisGet('proxy:list');
    if (cached && Array.isArray(cached) && cached.length > 0) {
        console.log(`✅ Cache: ${cached.length} proxy`);
        return cached;
    }

    const all = new Set();
    
    for (const url of PROXY_SOURCES) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
            const text = await res.text();
            const matches = text.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5})/g);
            if (matches) {
                matches.forEach(p => all.add(p));
                console.log(`✅ ${url.substring(0, 50)}: ${matches.length}`);
            }
        } catch (e) {}
    }

    const list = Array.from(all);
    console.log(`📦 Tổng: ${list.length} proxy`);

    if (list.length > 0) {
        await redisSet('proxy:list', list, 7200);
    }
    return list;
}

export async function getRandomProxy() {
    const list = await fetchProxies();
    if (list.length === 0) return null;
    return list[Math.floor(Math.random() * list.length)];
}
