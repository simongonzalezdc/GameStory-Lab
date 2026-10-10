#!/usr/bin/env node
/**
 * Minimal static server with SPA fallback for the E2E suite.
 *
 * http-server 14 silently dropped its `-s` (rewrite-all) flag, which made
 * every non-root route 404. Rather than fight a deprecated flag, this is a
 * ~50-line zero-dependency server that serves dist/ and falls back to
 * index.html for any path that isn't a real file — which is exactly what a
 * Vite/React Router SPA needs.
 *
 * Usage: node serve.mjs [dir] [port]
 */
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const dir = resolve(process.argv[2] || '../packages/frontend/dist');
const port = Number(process.argv[3] || 4173);
const indexHtml = join(dir, 'index.html');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end();
    return;
  }

  // Strip the query string, then confine the path to `dir`.
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = normalize(join(dir, urlPath));
  if (!filePath.startsWith(dir)) {
    res.writeHead(403).end();
    return;
  }

  const tryServe = (p) => {
    try {
      const stat = statSync(p);
      if (!stat.isFile()) return false;
      res.writeHead(200, {
        'content-type': MIME[extname(p)] || 'application/octet-stream',
        'cache-control': 'no-store',
      });
      createReadStream(p).pipe(res);
      return true;
    } catch {
      return false;
    }
  };

  // Real file wins; otherwise SPA fallback to index.html.
  if (urlPath !== '/' && tryServe(filePath)) return;
  if (!tryServe(indexHtml)) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('index.html not found — run a frontend build first');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`e2e server serving ${dir} on http://127.0.0.1:${port}`);
});
