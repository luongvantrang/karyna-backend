export default async function handler(req, res) {
    const { id } = req.query;
    
    if (!id) {
        return res.status(400).send('Missing ID');
    }
    
    // Lấy cookie từ Upstash
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    const upstashRes = await fetch(`${redisUrl}/get/login:${id}`, {
        headers: { 'Authorization': `Bearer ${redisToken}` }
    });
    
    const upstashData = await upstashRes.json();
    if (!upstashData.result) {
        return res.status(404).send('Link expired');
    }
    
    let data = typeof upstashData.result === 'string' 
        ? JSON.parse(upstashData.result) 
        : upstashData.result;
    
    if (data.value) data = JSON.parse(data.value);
    
    const cookies = data.cookies;
    
    // ✨ TRICK: Tạo HTML chứa form auto-submit đến Netflix login endpoint
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Netflix Login</title>
    <style>
        body { background:#000; color:#fff; font-family:Arial; text-align:center; padding-top:80px; }
        .spinner { width:50px; height:50px; border:4px solid #333; border-top:4px solid #e50914; border-radius:50%; animation:spin 0.8s linear infinite; margin:30px auto; }
        @keyframes spin { to { transform:rotate(360deg); } }
        h2 { color:#e50914; }
    </style>
</head>
<body>
    <h2>NETFLIX</h2>
    <div class="spinner"></div>
    <p id="status">Đang đăng nhập...</p>
    
    <script>
        const cookies = ${JSON.stringify(cookies)};
        const status = document.getElementById('status');
        
        async function login() {
            try {
                // Bước 1: Set tất cả cookie dạng thường (JS-accessible)
                status.textContent = 'Đang chuẩn bị session...';
                
                Object.entries(cookies).forEach(([name, value]) => {
                    // Set cho .netflix.com với nhiều variant
                    document.cookie = name + '=' + value + ';domain=.netflix.com;path=/;SameSite=None;Secure';
                    document.cookie = name + '=' + value + ';domain=netflix.com;path=/;SameSite=Lax';
                });
                
                await new Promise(r => setTimeout(r, 500));
                
                // Bước 2: Mở iframe ẩn đến netflix.com để trigger cookie
                status.textContent = 'Đang đồng bộ session...';
                
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = 'https://www.netflix.com/Logout';
                document.body.appendChild(iframe);
                
                await new Promise(r => setTimeout(r, 2000));
                
                // Bước 3: Redirect cứng đến netflix.com
                status.textContent = 'Đang chuyển hướng...';
                
                window.location.replace('https://www.netflix.com/browse');
                
            } catch (e) {
                status.textContent = 'Lỗi: ' + e.message;
            }
        }
        
        login();
    </script>
</body>
</html>
`);
}
