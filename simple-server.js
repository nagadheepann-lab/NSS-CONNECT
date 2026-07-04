const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('NSS Connect is running');
});
server.listen(3000, '0.0.0.0', () => {
  console.log('Simple server running on http://127.0.0.1:3000');
});
