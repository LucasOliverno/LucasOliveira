// Servidor único: serve o site (frontend/dist) e o WebSocket do MANDATO online em /mandato/ws.
//   npm run build && npm start        (produção, ex.: Railway — usa a variável PORT)
//   npm run server                    (só o WebSocket, para o `npm run dev` com proxy do Vite)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { Rooms } from './rooms.mjs';

const DIST = resolve(fileURLToPath(new URL('../dist', import.meta.url)));
const WS_PATH = '/mandato/ws';
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml', '.pdf': 'application/pdf', '.md': 'text/markdown; charset=utf-8', '.glb': 'model/gltf-binary',
};
const COMPRESSIBLE = new Set(['.glb', '.html', '.js', '.mjs', '.css', '.json', '.svg', '.txt', '.xml']);
const gzCache = new Map();

async function fileFor(pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch { return null; }
  if (rel.includes('\0')) return null;
  const full = normalize(join(DIST, rel));
  if (full !== DIST && !full.startsWith(DIST + sep)) return null; // fora do dist
  try {
    const st = await stat(full);
    if (st.isDirectory()) {
      const idx = join(full, 'index.html');
      const si = await stat(idx);
      return si.isFile() ? { path: idx, mtime: si.mtimeMs } : null;
    }
    return st.isFile() ? { path: full, mtime: st.mtimeMs } : null;
  } catch { return null; }
}

async function serve(req, res) {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/healthz') { res.writeHead(200, { 'content-type': 'text/plain' }); res.end('ok'); return; }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
  if (url.pathname === '/mandato') { res.writeHead(301, { location: `/mandato/${url.search}` }); res.end(); return; }

  let f = await fileFor(url.pathname);
  // o portfólio é uma SPA: rotas sem arquivo caem no index.html (o jogo só existe em /mandato/)
  if (!f && !url.pathname.startsWith('/mandato/') && !extname(url.pathname)) f = await fileFor('/index.html');
  if (!f) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); res.end('Não encontrado'); return; }

  const ext = extname(f.path).toLowerCase();
  const headers = { 'content-type': MIME[ext] || 'application/octet-stream', 'x-content-type-options': 'nosniff' };
  headers['cache-control'] = url.pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : ext === '.html' ? 'no-cache' : 'public, max-age=3600';
  let body = await readFile(f.path);
  if (COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
    const key = `${f.path}:${f.mtime}`;
    if (!gzCache.has(key)) gzCache.set(key, gzipSync(body));
    body = gzCache.get(key);
    headers['content-encoding'] = 'gzip';
    headers.vary = 'Accept-Encoding';
  }
  headers['content-length'] = body.length;
  res.writeHead(200, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
}

// Salas salvas em arquivo (MANDATO_DATA_FILE). Em produção, aponte para um volume persistente para sobreviver a deploys.
const DATA_FILE = process.env.MANDATO_DATA_FILE || resolve(fileURLToPath(new URL('../data/rooms.json', import.meta.url)));

export function start({ port = Number(process.env.PORT) || 8787, host = '0.0.0.0', file = DATA_FILE } = {}) {
  const rooms = new Rooms({ file });
  const server = createServer((req, res) => { serve(req, res).catch(() => { res.writeHead(500); res.end(); }); });
  const wss = new WebSocketServer({ noServer: true, maxPayload: 8 * 1024 });

  server.on('upgrade', (req, socket, head) => {
    const { pathname } = new URL(req.url, 'http://x');
    const origin = req.headers.origin;
    let okOrigin = true;
    if (origin) { try { okOrigin = new URL(origin).host === req.headers.host; } catch { okOrigin = false; } }
    if (pathname !== WS_PATH || !okOrigin) { socket.destroy(); return; }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  });

  wss.on('connection', (ws) => {
    ws.alive = true;
    ws.ctx = null;
    let n = 0;
    let t0 = Date.now();
    ws.on('pong', () => { ws.alive = true; });
    ws.on('message', (raw) => {
      const now = Date.now();
      if (now - t0 > 5000) { t0 = now; n = 0; }
      if (++n > 60) { ws.close(1008, 'Muitas mensagens'); return; }
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }
      try { rooms.handle(ws, msg); } catch (e) { console.error('erro na sala:', e); ws.send(JSON.stringify({ t: 'error', msg: 'Erro interno do servidor.' })); }
    });
    ws.on('close', () => { try { rooms.disconnected(ws); } catch (e) { console.error(e); } });
    ws.on('error', () => {});
  });

  const beat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.alive) { ws.terminate(); continue; }
      ws.alive = false;
      try { ws.ping(); } catch { /* conexão já caiu */ }
    }
  }, 25000);
  beat.unref();

  return new Promise((ok) => server.listen(port, host, () => ok({ server, wss, rooms, port: server.address().port, close: () => { clearInterval(beat); rooms.flush(); for (const r of rooms.rooms.values()) clearTimeout(r.botTimer); rooms.sweeper && clearInterval(rooms.sweeper); for (const c of wss.clients) c.terminate(); server.close(); } })));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  start().then((s) => {
    console.log(`MANDATO online em http://localhost:${s.port}/mandato/  (ws: ${WS_PATH})`);
    const bye = () => { s.close(); process.exit(0); };
    process.on('SIGTERM', bye); // deploy/reinício: grava as salas antes de sair
    process.on('SIGINT', bye);
  });
}
