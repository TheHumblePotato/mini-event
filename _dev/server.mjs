import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = {
  '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.svg':'image/svg+xml', '.png':'image/png', '.json':'application/json', '.txt':'text/plain'
};
const previewFiles = new Set([
  '/_dev/christmas/preview.js',
  '/_dev/past/halloween-2026/playtests/ride-playtest.html',
  '/_dev/past/halloween-2026/playtests/drive-playtest.html'
]);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1:' + port);
    if (url.pathname.startsWith('/__dev/')) {
      const {storyRequest} = await import('./past/halloween-2026/story-service.mjs');
      await storyRequest(req, res, url);
      return;
    }
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const path = resolve(root, '.' + pathname);
    const publicPage = pathname === '/index.html' || pathname.startsWith('/christmas/') || pathname.startsWith('/past/');
    if (!path.startsWith(resolve(root) + sep) || pathname.includes('\\') || pathname.includes('/.') ||
        (!publicPage && !previewFiles.has(pathname))) {
      res.writeHead(403).end('Not public');
      return;
    }
    const data = await readFile(path);
    res.writeHead(200, {'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control':'no-cache'});
    res.end(data);
  } catch {
    res.writeHead(404).end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => console.log('Mini Events local preview: http://127.0.0.1:' + server.address().port));
