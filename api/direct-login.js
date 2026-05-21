export default function handler(req, res) {
    const { id } = req.query;
    
    if (!id) return res.status(400).send('<h1>❌ Thiếu ID</h1>');
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    
    res.status(200).send(`<!DOCTYPE html>
<html>
<head>
  <title>Netflix</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body{background:#000;color:white;font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;text-align:center}
    h1{color:#E50914;font-size:50px;margin:0}
    .loader{margin:25px auto;border:5px solid #222;border-top:5px solid #E50914;border-radius:50%;width:50px;height:50px;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
  </style>
</head>
<body>
  <div>
    <h1>NETFLIX</h1>
    <div class="loader"></div>
    <p>Extension dang nap cookie...</p>
    <div id="cookie-id" style="display:none">${id}</div>
  </div>
</body>
</html>`);
}
