import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const port = Number(process.env.PORT || 4173), host = process.env.HOST || '0.0.0.0';
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.pdf': 'application/pdf', '.md': 'text/markdown; charset=utf-8', '.xml': 'application/xml' };
const base = process.env.BASE_PATH || '/';
const server = http.createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!pathname.startsWith(base)) { res.writeHead(404); res.end('Not found'); return; }
    pathname = pathname.slice(base.length);
    let file = path.resolve(root, pathname || '.');
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    const stat = await fs.stat(file);
    if (stat.isDirectory()) {
      if (!req.url.split('?')[0].endsWith('/')) { res.writeHead(301, { Location: new URL(req.url, 'http://localhost').pathname + '/' }); res.end(); return; }
      file = path.join(file, 'index.html');
    }
    const bytes = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    try { res.end(await fs.readFile(path.join(root, '404.html'))); } catch { res.end('Build first with npm run build.'); }
  }
});
server.listen(port, host, () => console.log(`CORE preview: http://${host}:${port}${base}`));
