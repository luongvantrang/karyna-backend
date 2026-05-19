
// Danh sách các source proxy free
const PROXY_SOURCES = [
    {
        url: 'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt',
        type: 'http'
    },
    {
        url: 'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt',
        type: 'http'
    },
    {
        url: 'https://raw.githubusercontent.com/clarketm/proxy-list/master/proxy-list-raw.txt',
        type: 'http'
    },
    {
        url: 'https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/all/data.txt',
        type: 'http'
    },
    {
        url: 'https://www.proxy-list.download/api/v1/get?type=http',
        type: 'http'
    },
    {
        url: 'https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=all',
        type: 'http'
    }
];

// Cache proxy trong Upstash (TTL 1 giờ)
export async function fetchProxiesFromSources(env) {
    const redisUrl = env.UPSTASH_REDIS_REST_URL;
    const redisToken = env.UPSTASH_REDIS_REST_TOKEN;

    // Kiểm tra cache trước
    try {
        const cacheRes = await fetch(`${redisUrl}/get/proxy:list`, {
            headers: { 'Authorization': `Bearer ${redisToken}` }
        });
        const cacheData = await cacheRes.json();
        if (cacheData.result) {
            const cached = typeof cacheData.result === 'string' 
                ? JSON.parse(cacheData.result) 
                : cacheData.result;
            if (Array.isArray(cached) && cached.length > 0) {
                console.log(`✅ Dùng proxy từ cache: ${cached.length} proxy`);
                return cached;
            }
        }
    } catch (e) {
        console.log('Cache miss, fetch mới...');
    }

    // Fetch từ tất cả source
    const allProxies = new Set();
    
    for (const source of PROXY_SOURCES) {
        try {
            const res = await fetch(source.url, {
                signal: AbortSignal.timeout(10000)
            });
            const text = await res.text();
            
            // Parse format ip:port
            const matches = text.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5})/g);
            if (matches) {
                matches.forEach(p => allProxies.add(p));
                console.log(`✅ ${source.url.substring(0, 50)}: ${matches.length} proxy`);
            }
        } catch (e) {
            console.log(`❌ Lỗi fetch ${source.url}: ${e.message}`);
        }
    }

    const proxyList = Array.from(allProxies);
    console.log(`📦 Tổng cộng: ${proxyList.length} proxy unique`);

    // Cache 1 giờ
    if (proxyList.length > 0) {
        await fetch(`${redisUrl}/set/proxy:list/${encodeURIComponent(JSON.stringify(proxyList))}?ex=3600`, {
            headers: { 'Authorization': `Bearer ${redisToken}` }
        });
    }

    return proxyList;
}

// Check 1 proxy có sống không
export async function checkProxyLive(proxy, timeout = 5000) {
    try {
        const [ip, port] = proxy.split(':');
        
        // Vercel/Cloudflare không thể dùng proxy trực tiếp
        // Phải dùng dịch vụ middle như ScrapingBee hoặc tự build
        
        // Cách test: ping qua API
        const res = await fetch('https://api.ipify.org?format=json', {
            signal: AbortSignal.timeout(timeout)
        });
        return res.ok;
    } catch {
        return false;
    }
}

// Lấy random proxy live
export async function getLiveProxy(env, maxAttempts = 10) {
    const proxies = await fetchProxiesFromSources(env);
    
    if (proxies.length === 0) {
        return null;
    }

    // Shuffle
    const shuffled = proxies.sort(() => Math.random() - 
