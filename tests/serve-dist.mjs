import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.resolve('dist');
const PORT = 4321;
const HOST = '127.0.0.1';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

// Parse dist/_headers
function parseHeaders() {
  const headersFile = path.join(DIST_DIR, '_headers');
  if (!fs.existsSync(headersFile)) return { global: {}, astro: {} };

  const content = fs.readFileSync(headersFile, 'utf8');
  const lines = content.split('\n');
  const result = { global: {}, astro: {} };
  let currentSection = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    if (line === '/*') {
      currentSection = 'global';
      continue;
    } else if (line === '/_astro/*') {
      currentSection = 'astro';
      continue;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx > 0 && currentSection) {
      const headerName = line.slice(0, colonIdx).trim();
      const headerVal = line.slice(colonIdx + 1).trim();
      result[currentSection][headerName] = headerVal;
    }
  }

  return result;
}

const parsedHeaders = parseHeaders();

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url || '/', `http://${HOST}:${PORT}`);
  let pathname = parsedUrl.pathname;

  if (pathname.endsWith('/')) {
    pathname += 'index.html';
  } else if (!path.extname(pathname)) {
    const possibleFile = path.join(DIST_DIR, `${pathname}.html`);
    if (fs.existsSync(possibleFile)) {
      pathname += '.html';
    } else {
      pathname += '/index.html';
    }
  }

  const filePath = path.join(DIST_DIR, pathname);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    const notFoundPath = path.join(DIST_DIR, '404.html');
    if (fs.existsSync(notFoundPath)) {
      const content = fs.readFileSync(notFoundPath);
      for (const [k, v] of Object.entries(parsedHeaders.global)) {
        res.setHeader(k, v);
      }
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
      return;
    }
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  for (const [k, v] of Object.entries(parsedHeaders.global)) {
    res.setHeader(k, v);
  }

  if (pathname.startsWith('/_astro/')) {
    for (const [k, v] of Object.entries(parsedHeaders.astro)) {
      res.setHeader(k, v);
    }
  }

  res.setHeader('Content-Type', contentType);
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`Preview server listening on http://${HOST}:${PORT}`);
});
