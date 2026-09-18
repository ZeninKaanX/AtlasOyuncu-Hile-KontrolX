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
const { execSync, spawn, spawnSync } = require('child_process');
const scannerCore = require('../engine/scannerCore');
const cloudSync = require('../engine/cloudSync');

const app = express();
const server = http.createServer(app);
const SESSION_TOKEN = crypto.randomBytes(32).toString('hex');
const wss = new WebSocket.Server({ noServer: true, maxPayload: 64 * 1024 });

const PORT = process.env.PORT || 3317;

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
    if (browser) return launch(browser, [`--app=${url}`, '--no-first-run', '--disable-session-crashed-bubble']);
  }

  if (process.platform === 'darwin') {
    return launch('open', ['-a', 'Google Chrome', '--args', `--app=${url}`]);
  }

  for (const command of ['microsoft-edge', 'google-chrome', 'chromium', 'chromium-browser']) {
    const found = spawnSync('which', [command], { stdio: 'ignore' });
    if (found.status === 0) return launch(command, [`--app=${url}`, '--no-first-run']);
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
    if (process.env.ATLAS_INITIAL_PIN) {
      ws.send(JSON.stringify({
        type: 'SESSION_CODE',
        sessionCode: process.env.ATLAS_INITIAL_PIN,
        autoStart: true
      }));
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
        if (scannerCore.isScanning) {
          ws.send(JSON.stringify({ type: 'SCAN_ERROR', message: 'Bu cihazda zaten bir tarama çalışıyor.' }));
          return;
        }

        try {
          const syncRes = await cloudSync.initSession(sessionCode);
          sessionCode = syncRes.sessionCode;
          ws.send(JSON.stringify({ type: 'SESSION_CODE', sessionCode }));
        } catch (err) {
          ws.send(JSON.stringify({ type: 'SCAN_ERROR', message: err.message || 'PIN doğrulanamadı.' }));
          return;
        }

        // Emit exactly one terminal event. Engine-level command timeouts are
        // handled inside scanners so a still-running scan is never called done.
        let scanSettled = false;
        const finishScan = (type, payload) => {
          if (scanSettled) return;
          scanSettled = true;
          try { ws.send(JSON.stringify({ type, ...payload })); } catch (e) {}
        };
        try {
          const results = await scannerCore.runFullScan((stage, percent, log, finding, target, objectsCount) => {
            try {
              cloudSync.sendProgress(percent, stage, log, finding, target, objectsCount);
            } catch (_) {}
            // The player channel deliberately receives percentage only. Full
            // forensic details are sent exclusively to the staff portal.
            ws.send(JSON.stringify({ type: 'PROGRESS', percent }));
          });
          await cloudSync.completeSession(results);
          finishScan('SCAN_COMPLETE', { sessionCode });
        } catch (err) {
          await cloudSync.failSession(err.message);
          finishScan('SCAN_ERROR', { message: 'Tarama tamamlanamadı. Lütfen yetkiliye bildirin.', sessionCode });
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

// Launch server with graceful port retry & collision recovery
function startServer(portToUse = PORT) {
  wss.on('error', () => {});

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[Atlas AC] Port ${portToUse} meşgul. Mevcut oturum kontrol ediliyor...`);

      const checkReq = http.request({
        hostname: '127.0.0.1',
        port: portToUse,
        path: '/',
        method: 'GET',
        timeout: 1200
      }, () => {
        const url = `http://localhost:${portToUse}`;
        console.log(`\n======================================================`);
        console.log(`      ATLAS AC - CLIENT INTEGRITY & INSPECTION ENGINE  `);
        console.log(`======================================================`);
        console.log(`[+] Atlas AC zaten aktif durumda çalışıyor.`);
        console.log(`[+] Oyuncu tarayıcı penceresi açılıyor: ${url}\n`);
        launchPlayerWindow(url);
        setTimeout(() => process.exit(0), 500);
      });

      checkReq.on('error', () => {
        console.log(`[!] Yanıt vermeyen eski bir süreç tespit edildi. Port ${portToUse} temizleniyor...`);
        try {
          if (process.platform === 'win32') {
            execSync('taskkill /F /IM AtlasAC.exe /IM AtlasAC-Windows.exe /IM atlas_core.exe >nul 2>&1', { windowsHide: true });
          } else {
            execSync('fuser -k 3317/tcp 2>/dev/null || pkill -f "AtlasAC" 2>/dev/null || true');
          }
        } catch (e) {}

        setTimeout(() => {
          try {
            server.listen(portToUse, '127.0.0.1');
          } catch (listenErr) {
            console.error('[Atlas AC] Port bağlanma hatası:', listenErr.message);
          }
        }, 500);
      });

      checkReq.end();
    } else {
      console.error('[Atlas AC] Sunucu hatası:', err.message);
    }
  });

  server.listen(portToUse, '127.0.0.1', () => {
    const activePort = server.address().port;
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
}

module.exports = { startServer, app, server };

if (require.main === module) {
  startServer();
}
