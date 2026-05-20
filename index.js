export default function handler(req, res) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Netflix Worker</title>
  <style>
    body { background:#141414; color:white; font-family:Arial; text-align:center; padding:50px; }
    h1 { color:#E50914; }
  </style>
</head>
<body>
  <h1>NETFLIX WORKER</h1>
  <p>Server dang hoat dong binh thuong.</p>
</body>
</html>`);
}
