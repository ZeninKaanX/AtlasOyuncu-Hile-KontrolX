/**
 * Farben AC - Main Server & WebSocket Bridge
 * Serves the modern Cyberpunk GUI and handles bi-directional real-time communication
 * with the forensic scanning engines.
 */

require('../engine/silentProcess');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { spawn, spawnSync } = require('child_process');
const scannerCore = require('../engine/scannerCore');
const cloudSync = require('../engine/cloudSync');

const app = express();
const server = http.createServer(app);
const SESSION_TOKEN = crypto.randomBytes(32).toString('hex');
const wss = new WebSocket.Server({ noServer: true, maxPayload: 64 * 1024 });
let playerState = { type: 'IDLE' };
let scanInFlight = false;

const PORT = process.env.PORT || 3317;
const RUNTIME_FILE = path.join(os.tmpdir(), `atlas-ac-${typeof process.getuid === 'function' ? process.getuid() : 'user'}.json`);

const fs = require('fs');

function launchPlayerWindow(url) {
  const options = { detached: true, stdio: 'ignore', windowsHide: true };
  const launch = (command, args) => {
    try {
      const child = spawn(command, args, options);
      child.on('error', () => {});
      child.unref();
      return true;
    } catch (_) {
      return false;
    }
  };

  if (process.platform === 'win32') {
    const roots = [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter(Boolean);
    const candidates = [];
    for (const root of roots) {
      candidates.push(path.join(root, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
      candidates.push(path.join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'));
    }
    const browser = candidates.find(candidate => fs.existsSync(candidate));
    if (browser) return launch(browser, [`--app=${url}`, '--window-size=520,610', '--no-first-run', '--disable-session-crashed-bubble']);
  }

  if (process.platform === 'darwin') {
    return launch('open', ['-a', 'Google Chrome', '--args', `--app=${url}`, '--window-size=520,610']);
  }

  for (const command of ['microsoft-edge', 'google-chrome', 'chromium', 'chromium-browser']) {
    const found = spawnSync('which', [command], { stdio: 'ignore' });
    if (found.status === 0) return launch(command, [`--app=${url}`, '--window-size=520,610', '--no-first-run']);
  }
  return launch('xdg-open', [url]);
}

app.use(express.json({ limit: '16kb', strict: true }));

function parseCookies(header = '') {
  const cookies = {};
  for (const part of String(header).split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    cookies[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return cookies;
}

function isLoopbackRequest(req) {
  const addr = req.socket && req.socket.remoteAddress;
  return addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1';
}

function isTrustedOrigin(origin) {
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    return parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '[::1]');
  } catch (_) {
    return false;
  }
}

function hasValidSession(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  if (!cookies.atlas_session || cookies.atlas_session.length !== SESSION_TOKEN.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(cookies.atlas_session), Buffer.from(SESSION_TOKEN));
  } catch (_) {
    return false;
  }
}

function requireLocalSession(req, res, next) {
  if (!isLoopbackRequest(req) || !hasValidSession(req)) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  next();
}

function broadcastPlayer(payload) {
  playerState = payload;
  const encoded = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    try { client.send(encoded); } catch (_) {}
  }
}

function getRegisteredPort() {
  try {
    const runtime = JSON.parse(fs.readFileSync(RUNTIME_FILE, 'utf8'));
    if (!Number.isInteger(runtime.pid) || runtime.pid <= 0) return null;
    try { process.kill(runtime.pid, 0); } catch (_) {
      try { fs.unlinkSync(RUNTIME_FILE); } catch (_) {}
      return null;
    }
    return Number.isInteger(runtime.port) && runtime.port > 0 && runtime.port < 65536 ? runtime.port : null;
  } catch (_) {
    return null;
  }
}

function saveRuntimePort(port) {
  try {
    const flags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_TRUNC | (fs.constants.O_NOFOLLOW || 0);
    const fd = fs.openSync(RUNTIME_FILE, flags, 0o600);
    try { fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, port })); } finally { fs.closeSync(fd); }
  } catch (_) {}
}

function clearRuntimePort() {
  try {
    const runtime = JSON.parse(fs.readFileSync(RUNTIME_FILE, 'utf8'));
    if (runtime.pid === process.pid) fs.unlinkSync(RUNTIME_FILE);
  } catch (_) {}
}

// Resolve static UI assets directory (handles both raw node and pkg /snapshot)
const uiPath = path.resolve(__dirname, '../ui');

// MIME types map for fast, reliable static serving without pkg descriptor issues
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4'
};

// Direct safe file server helper for pkg /snapshot and standalone binaries
function serveStaticFile(req, res, filePath) {
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // For large video files like bg.mp4, support partial range requests if needed
      if (ext === '.mp4') {
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;
        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || end >= fileSize) {
            res.setHeader('Content-Range', `bytes */${fileSize}`);
            res.status(416).end();
            return true;
          }
          const chunksize = (end - start) + 1;
          const buf = Buffer.alloc(chunksize);
          const fd = fs.openSync(filePath, 'r');
          fs.readSync(fd, buf, 0, chunksize, start);
          fs.closeSync(fd);
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4'
          });
          return res.end(buf);
        }
      }
      
      const fileData = fs.readFileSync(filePath);
      res.send(fileData);
      return true;
    }
  } catch (err) {
    // If read/range fails, return false to let next handler proceed
  }
  return false;
}

// Root route handler
app.get('/', (req, res) => {
  if (!isLoopbackRequest(req)) return res.status(403).send('Forbidden');
  res.setHeader('Set-Cookie', `atlas_session=${SESSION_TOKEN}; HttpOnly; SameSite=Strict; Path=/`);
  res.setHeader('X-Atlas-Scanner', '1');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  const indexPath = path.join(uiPath, 'player.html');
  if (serveStaticFile(req, res, indexPath)) return;
  res.status(404).send('Atlas AC UI not found.');
});

// Every endpoint exposing forensic data or changing process state requires the
// unguessable session cookie minted only by the loopback root page.
app.use('/api', requireLocalSession);

// A second invocation can safely forward a PIN to the already-running local
// scanner instead of starting another process or opening the public website.
app.post('/api/session-code', (req, res) => {
  const sessionCode = String(req.body?.sessionCode || '').trim().toUpperCase();
  if (!/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(sessionCode)) {
    return res.status(400).json({ success: false, error: 'Geçersiz PIN.' });
  }
  if (scanInFlight || scannerCore.isScanning) {
    return res.status(409).json({ success: false, error: 'Bir tarama zaten çalışıyor.' });
  }
  broadcastPlayer({ type: 'SESSION_CODE', sessionCode, autoStart: true });
  return res.json({ success: true });
});

// Custom static middleware that intercepts UI assets safely
app.use((req, res, next) => {
  const safeRelative = req.path.replace(/^\/+/, '');
  if (!safeRelative) return next();
  const allowed = safeRelative === 'player.html' || safeRelative === 'css/player.css' ||
    safeRelative === 'js/player.js' || /^assets\/(atlas_logo\.png|atlas\.ico)$/.test(safeRelative);
  if (!allowed) return res.status(404).send('Not found');
  const candidatePath = path.join(uiPath, safeRelative);
  const relative = path.relative(uiPath, candidatePath);
  if (relative && !relative.startsWith('..') && !path.isAbsolute(relative) && serveStaticFile(req, res, candidatePath)) {
    return;
  }
  next();
});

// Graceful application shutdown endpoint
app.post('/api/shutdown', (req, res) => {
  res.json({ success: true, message: 'Atlas AC kapatılıyor...' });
  console.log('[Atlas AC] Kullanıcı çıkış talebi aldı. Sunucu ve süreç sonlandırılıyor...');
  setTimeout(() => {
    try { wss.close(); } catch (e) {}
    try { server.close(); } catch (e) {}
    process.exit(0);
  }, 200);
});

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('[Atlas AC] UI client connected.');

  try {
    if (playerState.type !== 'IDLE') {
      ws.send(JSON.stringify(playerState));
    } else if (process.env.ATLAS_INITIAL_PIN) {
      playerState = {
        type: 'SESSION_CODE',
        sessionCode: process.env.ATLAS_INITIAL_PIN,
        autoStart: true
      };
      delete process.env.ATLAS_INITIAL_PIN;
      ws.send(JSON.stringify(playerState));
    }
  } catch (_) {}

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.action === 'START_SCAN') {
        let sessionCode = (data.sessionCode || process.env.ATLAS_INITIAL_PIN || '').trim().toUpperCase();
        if (!/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(sessionCode)) {
          ws.send(JSON.stringify({ type: 'SCAN_ERROR', message: 'Yetkilinizin verdiği sekiz karakterli PIN kodunu girin.' }));
          return;
        }
        if (scanInFlight || scannerCore.isScanning) {
          if (playerState.type !== 'IDLE') ws.send(JSON.stringify(playerState));
          return;
        }

        scanInFlight = true;
        try {
          const syncRes = await cloudSync.initSession(sessionCode);
          sessionCode = syncRes.sessionCode;
          ws.send(JSON.stringify({ type: 'SESSION_CODE', sessionCode }));
          playerState = { type: 'PROGRESS', percent: 0 };
        } catch (err) {
          scanInFlight = false;
          playerState = { type: 'IDLE' };
          ws.send(JSON.stringify({ type: 'SCAN_ERROR', message: err.message || 'PIN doğrulanamadı.' }));
          return;
        }

        try {
          const results = await scannerCore.runFullScan((stage, percent, log, finding, target, objectsCount) => {
            void cloudSync.sendProgress(percent, stage, log, finding, target, objectsCount).catch(() => {});
            // The player channel deliberately receives percentage only. Full
            // forensic details are sent exclusively to the staff portal.
            broadcastPlayer({ type: 'PROGRESS', percent });
          });
          await cloudSync.completeSession(results);
          broadcastPlayer({ type: 'SCAN_COMPLETE', sessionCode });
        } catch (err) {
          try { await cloudSync.failSession(err.message); } catch (_) {}
          broadcastPlayer({ type: 'SCAN_ERROR', message: 'Tarama tamamlanamadı. Lütfen yetkiliye bildirin.', sessionCode });
        } finally {
          scanInFlight = false;
        }
      } else if (data.action === 'SHUTDOWN') {
        ws.send(JSON.stringify({
          type: 'SHUTDOWN_CONFIRMED',
          message: 'Atlas AC kapatılıyor...'
        }));
        console.log('[Atlas AC] WebSocket üzerinden çıkış talebi alındı. Süreç kapatılıyor...');
        setTimeout(() => {
          try { wss.close(); } catch (e) {}
          try { server.close(); } catch (e) {}
          process.exit(0);
        }, 200);
      }
    } catch (e) {
      console.error('[Atlas AC] Message parsing error:', e);
    }
  });

  ws.on('close', () => {
    console.log('[Atlas AC] UI client disconnected.');
  });
});

server.on('upgrade', (req, socket, head) => {
  let pathname = '';
  try { pathname = new URL(req.url, 'http://localhost').pathname; } catch (_) {}
  if (pathname !== '/ws' || !isLoopbackRequest(req) || !isTrustedOrigin(req.headers.origin) || !hasValidSession(req)) {
    socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
});

// Launch server with safe port retry. Never terminate an unrelated process
// merely because it owns the preferred port.
function startServer(portToUse = PORT) {
  wss.on('error', () => {});

  const openExistingInstance = (existingPort, res) => {
    const cookie = (res.headers['set-cookie'] || [])[0];
    res.resume();
    const url = `http://localhost:${existingPort}`;
    console.log(`[+] Atlas AC zaten aktif durumda çalışıyor: ${url}`);
    let existingOpened = false;
    const openExisting = () => {
      if (existingOpened) return;
      existingOpened = true;
      if (process.env.ATLAS_NO_BROWSER !== '1') launchPlayerWindow(url);
      setTimeout(() => process.exit(0), 500);
    };
    const initialPin = String(process.env.ATLAS_INITIAL_PIN || '').trim().toUpperCase();
    if (cookie && /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(initialPin)) {
      const body = JSON.stringify({ sessionCode: initialPin });
      const forward = http.request({
        hostname: '127.0.0.1', port: existingPort, path: '/api/session-code', method: 'POST', timeout: 1500,
        headers: { Cookie: cookie.split(';')[0], 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
      }, (forwardRes) => { forwardRes.resume(); openExisting(); });
      forward.on('error', openExisting);
      forward.on('timeout', () => forward.destroy());
      forward.end(body);
    } else {
      openExisting();
    }
  };

  const probeExisting = (candidatePort, onMissing) => {
    let settled = false;
    const missingOnce = () => {
      if (settled) return;
      settled = true;
      onMissing();
    };
    const checkReq = http.request({
      hostname: '127.0.0.1', port: candidatePort, path: '/', method: 'GET', timeout: 1200
    }, (res) => {
      if (settled) return res.resume();
      if (res.headers['x-atlas-scanner'] === '1') {
        settled = true;
        return openExistingInstance(candidatePort, res);
      }
      res.resume();
      missingOnce();
    });
    checkReq.on('error', missingOnce);
    checkReq.on('timeout', () => checkReq.destroy());
    checkReq.end();
  };

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[Atlas AC] Port ${portToUse} meşgul. Mevcut oturum kontrol ediliyor...`);
      let collisionHandled = false;
      const useAvailablePort = () => {
        if (collisionHandled) return;
        collisionHandled = true;
        console.log('[Atlas AC] Port başka bir uygulamaya ait; boş bir yerel port seçiliyor...');
        setTimeout(() => server.listen(0, '127.0.0.1'), 100);
      };
      probeExisting(portToUse, useAvailablePort);
    } else {
      console.error('[Atlas AC] Sunucu hatası:', err.message);
    }
  });

  const beginListen = () => server.listen(portToUse, '127.0.0.1', () => {
    const activePort = server.address().port;
    saveRuntimePort(activePort);
    const url = `http://localhost:${activePort}`;
    console.log(`\n======================================================`);
    console.log(`      ATLAS AC - CLIENT INTEGRITY & INSPECTION ENGINE  `);
    console.log(`======================================================`);
    console.log(`  Sunucu aktif: ${url}`);
    console.log(`  Oyuncu tarayıcı penceresi açılıyor...\n`);

    // Edge/Chrome app mode provides a dedicated scanner window without normal
    // browser tabs or address controls. A regular browser is only a fallback
    // on systems without a compatible app-mode runtime.
    if (process.env.ATLAS_NO_BROWSER !== '1') {
      launchPlayerWindow(url);
    }
  });

  const registeredPort = getRegisteredPort();
  if (Number(portToUse) === Number(PORT) && registeredPort) {
    probeExisting(registeredPort, beginListen);
  } else {
    beginListen();
  }
}

server.on('close', clearRuntimePort);
process.once('exit', clearRuntimePort);

module.exports = { startServer, app, server, getRegisteredPort };

if (require.main === module) {
  startServer();
}
