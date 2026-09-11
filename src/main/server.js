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
const { exec, execSync } = require('child_process');
const scannerCore = require('../engine/scannerCore');
const updater = require('../engine/updater');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

const PORT = process.env.PORT || 3317;

const fs = require('fs');

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
  const indexPath = path.join(uiPath, 'index.html');
  if (serveStaticFile(req, res, indexPath)) return;
  res.status(404).send('Atlas AC UI not found.');
});

// Custom static middleware that intercepts UI assets safely
app.use((req, res, next) => {
  const safeRelative = req.path.replace(/^\/+/, '');
  if (!safeRelative) return next();
  const candidatePath = path.join(uiPath, safeRelative);
  if (candidatePath.startsWith(uiPath) && serveStaticFile(req, res, candidatePath)) {
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
  }
  if (html) {
    res.setHeader('Content-Disposition', `attachment; filename="AtlasAC_Report_${Date.now()}.html"`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }
  res.status(404).send('Rapor bulunamadı.');
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

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.action === 'START_SCAN') {
        try {
          const results = await scannerCore.runFullScan((stage, percent, log, finding, target, objectsCount) => {
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

          ws.send(JSON.stringify({
            type: 'SCAN_COMPLETE',
            data: results
          }));
        } catch (err) {
          ws.send(JSON.stringify({
            type: 'PROGRESS',
            stage: 'ERROR',
            percent: 100,
            log: `Scan error: ${err.message}`
          }));
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
            url: '/api/report/latest'
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
            server.listen(portToUse);
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

  server.listen(portToUse, () => {
    const activePort = server.address().port;
    const url = `http://localhost:${activePort}`;
    console.log(`\n======================================================`);
    console.log(`      ATLAS AC - CLIENT INTEGRITY & INSPECTION ENGINE  `);
    console.log(`======================================================`);
    console.log(`  Sunucu aktif: ${url}`);
    console.log(`  Arayüz açılıyor...\n`);

    // Auto-open browser
    const openCmd = process.platform === 'win32' ? `start "" "${url}"` : (process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`);
    exec(openCmd, { windowsHide: true }, () => {});
  });
}

module.exports = { startServer, app, server };

if (require.main === module) {
  startServer();
}
