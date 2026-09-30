import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = process.cwd();
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};
http
  .createServer(async (req, res) => {
    try {
      const path = resolve(
        root,
        '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname),
      );
      if (path !== root && !path.startsWith(root + sep)) {
        res.writeHead(403).end();
        return;
      }
      const p = path === root ? resolve(root, 'index.html') : path;
      res.writeHead(200, {
        'Content-Type': types[extname(p)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(await readFile(p));
    } catch {
      res.writeHead(404).end('Not found');
    }
  })
  .listen(Number(process.env.PORT || 3000), '0.0.0.0', () =>
    console.log('PixelKingdom: http://localhost:3000'),
  );
