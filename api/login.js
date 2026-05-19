// api/login.js
export default async function handler(req, res) {
    const { id } = req.query;

    if (!id) {
        return res.status(400).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Lỗi</title></head>
            <body style="background:#000;color:#e50914;text-align:center;padding-top:100px;font-family:Arial;">
                <h2>❌ Link không hợp lệ!</h2>
            </body>
            </html>
        `);
    }

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Netflix Auto Login</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: #000;
            color: #fff;
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .card {
            text-align: center;
            padding: 40px;
            background: rgba(20,20,20,0.95);
            border: 1px solid rgba(229,9,20,0.3);
            border-radius: 16px;
            width: 380px;
            box-shadow: 0 0 40px rgba(229,9,20,0.2);
        }
        .logo {
            font-size: 40px;
            font-weight: 900;
            color: #e50914;
            margin-bottom: 20px;
            letter-spacing: -2px;
        }
        .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(229,9,20,0.2);
            border-top: 4px solid #e50914;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .status {
            font-size: 15px;
            color: #999;
            margin-top: 16px;
            min-height: 24px;
            line-height: 1.6;
        }
        .status.success { color: #2ecc71; }
        .status.error { color: #e50914; }
        .progress {
            width: 100%;
            height: 4px;
            background: #333;
            border-radius: 2px;
            margin-top: 20px;
            display: none;
        }
        .progress.show { display: block; }
        .progress-fill {
            height: 100%;
            background: #e50914;
            border-radius: 2px;
            width: 0%;
            transition: width 0.3s ease;
        }
        .note {
            margin-top: 24px;
            font-size: 12px;
            color: #555;
            line-height: 1.8;
        }
        .acc-info {
            background: rgba(229,9,20,0.1);
            border: 1px solid rgba(229,9,20,0.2);
            border-radius: 8px;
            padding: 12px;
            margin-top: 16px;
            font-size: 13px;
            display: none;
            text-align: left;
        }
        .acc-info.show { display: block; }
        .acc-info div {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .acc-info div:last-child { border: none; }
        .acc-info span:first-child { color: #999; }
        .acc-info span:last-child { color: #fff; font-weight: bold; }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">NETFLIX</div>

        <div class="spinner" id="spinner"></div>

        <div class="acc-info" id="accInfo">
            <div>
                <span>📁 File</span>
                <span id="accFile">-</span>
            </div>
        </div>

        <div class="progress" id="progress">
            <div class="progress-fill" id="progressFill"></div>
        </div>

        <div class="status" id="status">🔍 Đang lấy dữ liệu...</div>

        <div class="note">
            ⚠️ Dùng VPN US nếu không vào được<br>
            🚫 Không Logout sau khi sử dụng<br>
            ⏳ Link hết hạn sau 15 phút
        </div>
    </div>

    <script>
        const id = "${id}";
        const setStatus = (msg, type = '') => {
            const el = document.getElementById('status');
            el.textContent = msg;
            el.className = 'status ' + type;
        };
        const sleep = ms => new Promise(r => setTimeout(r, ms));

        async function run() {
            try {
                setStatus('🔍 Đang lấy dữ liệu từ server...');

                const res = await fetch('/api/get?id=' + id);
                const data = await res.json();

                if (!data.success) {
                    document.getElementById('spinner').style.display = 'none';
                    setStatus('❌ ' + data.message, 'error');
                    return;
                }

                // Hiện thông tin acc
                document.getElementById('accFile').textContent = data.filename || 'Netflix Account';
                document.getElementById('accInfo').classList.add('show');

                // Inject cookie
                document.getElementById('spinner').style.display = 'none';
                document.getElementById('progress').classList.add('show');

                const cookies = data.cookies;
                const entries = Object.entries(cookies);

                for (let i = 0; i < entries.length; i++) {
                    const [name, value] = entries[i];
                    document.cookie = name + "=" + value + ";domain=.netflix.com;path=/;expires=Fri, 31 Dec 2026 23:59:59 GMT;SameSite=Lax";
                    const pct = ((i + 1) / entries.length) * 100;
                    document.getElementById('progressFill').style.width = pct + '%';
                    setStatus('⚙️ Đang inject cookie (' + (i+1) + '/' + entries.length + ')...');
                    await sleep(400);
                }

                setStatus('✅ Thành công! Đang chuyển hướng...', 'success');
                await sleep(1500);
                window.location.href = 'https://www.netflix.com/browse';

            } catch (err) {
                document.getElementById('spinner').style.display = 'none';
                setStatus('❌ Lỗi kết nối server!', 'error');
                console.error(err);
            }
        }

        run();
    </script>
</body>
</html>
    `);
}
