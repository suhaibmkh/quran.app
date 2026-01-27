const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const server = http.createServer((req, res) => {
  try {
    let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);
    
    // Prevent directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/html' });
      res.end('<h1>403 - Forbidden</h1>');
      return;
    }
    
    fs.readFile(filePath, (err, content) => {
      if (err) {
        // Fallback to index.html for client-side routing
        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, content2) => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content2 || '<h1>404</h1>');
        });
        return;
      }
      
      const ext = path.extname(filePath);
      let contentType = 'text/html';
      if (ext === '.css') contentType = 'text/css';
      if (ext === '.js') contentType = 'application/javascript';
      if (ext === '.json') contentType = 'application/json';
      if (ext === '.png') contentType = 'image/png';
      if (ext === '.jpg') contentType = 'image/jpeg';
      if (ext === '.gif') contentType = 'image/gif';
      if (ext === '.svg') contentType = 'image/svg+xml';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  } catch (err) {
    console.error('Error:', err);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('<h1>500 - Server Error</h1>');
  }
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

server.listen(PORT, () => {
  console.log(`\n✓ Server running at http://localhost:${PORT}\n`);
});
