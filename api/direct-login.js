export default function handler(req, res) {
    const { id } = req.query;
    
    if (!id) {
        return res.status(400).send('<h1>❌ Thiếu ID</h1>');
    }
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Netflix Login</title>
    <style>
        body {
            margin: 0;
            font-family: 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #000 0%, #1a0000 100%);
            color: #fff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            padding: 40px;
            max-width: 500px;
        }
        .logo {
            color: #E50914;
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 30px;
            text-shadow: 0 0 20px rgba(229, 9, 20, 0.5);
        }
        .spinner {
            border: 4px solid rgba(255, 255, 255, 0.1);
            border-left-color: #E50914;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            animation: spin 1s linear infinite;
            margin: 30px auto;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .status {
            font-size: 18px;
            margin: 20px 0;
            color: #ddd;
        }
        .warning {
            background: rgba(229, 9, 20, 0.1);
            border-left: 3px solid #E50914;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            text-align: left;
        }
        .id {
            font-family: monospace;
            background: rgba(255,255,255,0.1);
            padding: 5px 10px;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">NETFLIX</div>
        <div class="spinner"></div>
        <div class="status">⏳ Đang chuẩn bị đăng nhập...</div>
        <div class="warning">
            ⚠️ <strong>Yêu cầu:</strong> Bạn phải cài <strong>Netflix Direct Login Extension</strong> trước!<br>
            Nếu không tự chuyển sau 5 giây → kiểm tra extension đã cài chưa.
        </div>
        <div style="margin-top: 30px; font-size: 13px; opacity: 0.6;">
            ID: <span class="id">${id}</span>
        </div>
    </div>
    
    <script>
        // Fallback: nếu sau 10s mà chưa chuyển thì hiện thông báo
        setTimeout(() => {
            document.querySelector('.status').innerHTML = '❌ Có vẻ extension chưa được cài hoặc gặp lỗi!';
            document.querySelector('.spinner').style.display = 'none';
        }, 10000);
    </script>
</body>
</html>
    `);
}
