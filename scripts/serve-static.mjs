import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { createServer } from 'node:http';

const root = resolve(process.env.STATIC_ROOT || '.');
const port = Number(process.env.PORT || process.env.PLAYWRIGHT_PORT || 4173);
const host = process.env.HOST || '127.0.0.1';

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
  ['.wasm', 'application/wasm'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.md', 'text/markdown; charset=utf-8']
]);

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'cache-control': 'no-store', ...headers });
  res.end(body);
}

function safeResolve(requestPath) {
  const decoded = decodeURIComponent(requestPath.split('?')[0].split('#')[0]);
  const normalized = normalize(decoded).replace(/^([.][.][\/\\])+/, '');
  const relative = normalized === sep ? 'index.html' : normalized.replace(/^[/\\]+/, '');
  const target = resolve(join(root, relative));
  if (!target.startsWith(root)) return null;
  return target;
}

const server = createServer((req, res) => {
  const method = req.method || 'GET';
  if (method !== 'GET' && method !== 'HEAD') {
    send(res, 405, 'Method Not Allowed');
    return;
  }

  let target = safeResolve(req.url || '/');
  if (!target) {
    send(res, 403, 'Forbidden');
    return;
  }

  if (!existsSync(target)) {
    target = resolve(join(root, 'index.html'));
  }

  if (statSync(target).isDirectory()) target = join(target, 'index.html');
  if (!existsSync(target)) {
    send(res, 404, 'Not Found');
    return;
  }

  const type = mimeTypes.get(extname(target).toLowerCase()) || 'application/octet-stream';
  res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
  if (method === 'HEAD') {
    res.end();
    return;
  }
  createReadStream(target).pipe(res);
});

server.listen(port, host, () => {
  console.log(`static server ready: http://${host}:${port}`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
