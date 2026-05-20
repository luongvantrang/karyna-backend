export default function handler(req, res) {
    const { id } = req.query;
    if (!id) return res.status(400).send('Missing id');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html>
<head><title>Netflix</title></head>
<body style="background:#000;color:white;display:flex;justify-content:center;align-items:center;height:100vh;font-family:Arial;text-align:center;margin:0;">
<div>
  <h1 style="color:#E50914;font-size:50px;">NETFLIX</h1>
  <div style="margin:25px auto;border:5px solid #222;border-top:5px solid #E50914;border-radius:50%;width:50px;height:50px;animation:spin .8s linear infinite;"></div>
  <p>Extension dang nap cookie...</p>
  <div id="cid" style="display:none">${id}</div>
</div>
<style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>
</body>
</html>`);
}
