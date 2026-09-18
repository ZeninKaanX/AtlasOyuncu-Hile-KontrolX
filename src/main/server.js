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
const { exec, execSync } = require('child_process');
const scannerCore = require('../engine/scannerCore');
const updater = require('../engine/updater');
const serverStatus = require('../engine/serverStatus');
const cloudSync = require('../engine/cloudSync');

const app = express();
const server = http.createServer(app);
const SESSION_TOKEN = crypto.randomBytes(32).toString('hex');
const wss = new WebSocket.Server({ noServer: true, maxPayload: 64 * 1024 });

const PORT = process.env.PORT || 3317;

const fs = require('fs');

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
  const indexPath = path.join(uiPath, 'index.html');
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
  const candidatePath = path.join(uiPath, safeRelative);
  const relative = path.relative(uiPath, candidatePath);
  if (relative && !relative.startsWith('..') && !path.isAbsolute(relative) && serveStaticFile(req, res, candidatePath)) {
    return;
  }
  next();
});

// Direct Report Viewer Endpoint
app.get('/api/report/latest', (req, res) => {
  const reporter = require('../engine/reporter');
  let html = null;
  if (scannerCore.isScanning) {
    html = reporter.generateHtmlReport({
      allFindings: scannerCore.findings || [],
      scannedJars: 0,
      scannedObjects: 0,
      isScanning: true
    });
  } else {
    html = reporter.getLatestReportHtml();
    if (!html && scannerCore.lastScanResults) {
      html = reporter.generateHtmlReport(scannerCore.lastScanResults);
    }
    if (!html) {
      try {
        html = reporter.generateHtmlReport({
          allFindings: scannerCore.findings || [],
          scannedJars: 0,
          scannedObjects: 0,
          isScanning: false
        });
      } catch (e) {}
    }
  }
  if (html) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }
  res.status(404).send('<h2>Henüz tamamlanmış veya aktif bir tarama raporu bulunmuyor.</h2>');
});

// Direct Report Download Endpoint
app.get('/api/report/download', (req, res) => {
  const reporter = require('../engine/reporter');
  let html = null;
  if (scannerCore.isScanning) {
    html = reporter.generateHtmlReport({
      allFindings: scannerCore.findings || [],
      scannedJars: 0,
      scannedObjects: 0,
      isScanning: true
    });
  } else {
    html = reporter.getLatestReportHtml();
    if (!html && scannerCore.lastScanResults) {
      html = reporter.generateHtmlReport(scannerCore.lastScanResults);
    }
    if (!html) {
      html = reporter.generateHtmlReport({
        allFindings: scannerCore.findings || [],
        scannedJars: 0,
        scannedObjects: 0,
        isScanning: false,
        durationSeconds: 0,
        timestamp: new Date().toISOString()
      });
    }
  }
  if (html) {
    const filename = `AtlasAC_Report_${Date.now()}.html`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }
  res.status(404).send('Rapor bulunamadı.');
});

// Direct Report Export & Save Endpoint (JSON API)
app.get('/api/export', (req, res) => {
  try {
    const savedPath = scannerCore.exportLastReport();
    res.json({
      success: true,
      path: savedPath,
      downloadUrl: '/api/report/download',
      filename: path.basename(savedPath)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Live Minecraft Server Status Endpoint
app.get('/api/server-status', async (req, res) => {
  try {
    const force = req.query.force === 'true';
    const status = await serverStatus.fetchStatus(force);
    res.json({ success: true, ...status });
  } catch (err) {
    res.json({ success: false, ...serverStatus.getStatusSync(), error: err.message });
  }
});

// Fallback to standard express.static
app.use(express.static(uiPath));

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

  // Push initial live server status
  serverStatus.fetchStatus().then(status => {
    try {
      ws.send(JSON.stringify({
        type: 'SERVER_STATUS',
        data: status
      }));
    } catch (e) {}
  }).catch(() => {});

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

      if (data.action === 'GET_SERVER_STATUS') {
        const status = await serverStatus.fetchStatus(Boolean(data.force));
        ws.send(JSON.stringify({
          type: 'SERVER_STATUS',
          data: status
        }));
      } else if (data.action === 'START_SCAN') {
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
            ws.send(JSON.stringify({
              type: 'PROGRESS',
              stage,
              percent,
              log,
              finding,
              target,
              objectsCount
            }));
          });
          await cloudSync.completeSession(results);
          finishScan('SCAN_COMPLETE', { data: results, sessionCode });
        } catch (err) {
          await cloudSync.failSession(err.message);
          ws.send(JSON.stringify({
            type: 'PROGRESS',
            stage: 'ERROR',
            percent: 100,
            log: `Scan error: ${err.message}`
          }));
          finishScan('SCAN_ERROR', { message: err.message, sessionCode });
        }
      } else if (data.action === 'CHECK_UPDATES') {
        const updateRes = await updater.checkForUpdates();
        ws.send(JSON.stringify({
          type: 'UPDATE_RESULT',
          message: updateRes.message
        }));
      } else if (data.action === 'EXPORT_REPORT') {
        try {
          const savedPath = scannerCore.exportLastReport();
          ws.send(JSON.stringify({
            type: 'EXPORT_RESULT',
            path: savedPath,
            url: '/api/report/download',
            filename: path.basename(savedPath)
          }));
        } catch (e) {
          ws.send(JSON.stringify({
            type: 'EXPORT_RESULT',
            path: `Error: ${e.message}`,
            url: null
          }));
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
        console.log(`[+] Web arayüzü tarayıcınızda açılıyor: ${url}\n`);
        const openCmd = process.platform === 'win32' ? `start "" "${url}"` : (process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`);
        exec(openCmd, { windowsHide: true }, () => {
          process.exit(0);
        });
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
    console.log(`  Arayüz açılıyor...\n`);

    // Auto-open browser outside automated/headless verification.
    if (process.env.ATLAS_NO_BROWSER !== '1') {
      const openCmd = process.platform === 'win32' ? `start "" "${url}"` : (process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`);
      exec(openCmd, { windowsHide: true }, () => {});
    }
  });
}

module.exports = { startServer, app, server };

if (require.main === module) {
  startServer();
}
