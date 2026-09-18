/**
 * Atlas AC - Application Entrypoint & CLI Process Controller
 * Supports:
 *   - Normal launch (default)
 *   - Graceful termination: --stop, --kill, -k
 *   - Process status check: --status
 */

require('../engine/silentProcess');
const { startServer, getRegisteredPort } = require('./server');
const http = require('http');
const { execSync, spawnSync } = require('child_process');

const args = process.argv.slice(2);
const controlPort = getRegisteredPort() || 3317;

// Extract Ocean AC style --pin <PIN> or -p <PIN>
const pinFlagIdx = args.findIndex(a => a === '--pin' || a === '-p' || a === '--session' || a === '-s');
if (pinFlagIdx !== -1 && args[pinFlagIdx + 1]) {
  process.env.ATLAS_INITIAL_PIN = args[pinFlagIdx + 1].trim().toUpperCase();
}

if (args.includes('--stop') || args.includes('--kill') || args.includes('-k') || args.includes('stop')) {
  console.log('[*] Atlas AC kapatma sinyali gönderiliyor...');
  const fallbackStop = () => {
    // If HTTP request fails or server is unresponsive, force kill by process name
    try {
      if (process.platform === 'win32') {
        execSync('taskkill /F /IM AtlasAC.exe /IM AtlasAC-Windows.exe /IM atlas_core.exe >nul 2>&1', { windowsHide: true });
      } else {
        execSync('pkill -f "AtlasAC" 2>/dev/null || true');
      }
      console.log('[+] Atlas AC arka plan süreçleri kapatıldı.');
    } catch (e) {
      console.log('[-] Atlas AC şu anda çalışmıyor.');
    }
    process.exit(0);
  };

  // Obtain the loopback-only session cookie before invoking the protected API.
  const bootstrap = http.request({ hostname: '127.0.0.1', port: controlPort, path: '/', method: 'GET', timeout: 2000 }, (rootRes) => {
    if (rootRes.headers['x-atlas-scanner'] !== '1') {
      rootRes.resume();
      return fallbackStop();
    }
    const cookie = (rootRes.headers['set-cookie'] || [])[0];
    rootRes.resume();
    if (!cookie) return fallbackStop();
    const req = http.request({
      hostname: '127.0.0.1', port: controlPort, path: '/api/shutdown', method: 'POST', timeout: 2000,
      headers: { Cookie: cookie.split(';')[0] }
    }, () => {
      console.log('[+] Atlas AC süreci başarıyla sonlandırıldı.');
      process.exit(0);
    });
    req.on('error', fallbackStop);
    req.end();
  });
  bootstrap.on('error', fallbackStop);
  bootstrap.end();
} else if (args.includes('--status') || args.includes('status')) {
  const req = http.request({
    hostname: '127.0.0.1',
    port: controlPort,
    path: '/',
    method: 'GET',
    timeout: 1500
  }, (res) => {
    if (res.headers['x-atlas-scanner'] !== '1') {
      res.resume();
      console.log('[-] Bu port Atlas AC uygulamasına ait değil.');
      process.exit(1);
    }
    res.resume();
    console.log(`[+] Atlas AC aktif durumda ve çalışıyor (Port: ${controlPort}).`);
    process.exit(0);
  });

  req.on('error', () => {
    console.log('[-] Atlas AC şu anda çalışmıyor.');
    process.exit(0);
  });

  req.end();
} else {
  // Standalone Single-EXE Windows Self-Elevation (UAC Admin Auto-Prompt)
  // Ensures deep kernel, USN, BAM, and Prefetch forensics work with 100% precision
  // without needing any .bat wrapper or console windows!
  const cleanArgs = args.map(a => a.replace(/^["']+|["']+$/g, ''));
  if (typeof process.pkg !== 'undefined' && process.platform === 'win32' && !cleanArgs.includes('--no-elevate')) {
    try {
      execSync('fsutil dirty query %systemdrive%', { stdio: 'ignore', windowsHide: true });
    } catch (adminErr) {
      try {
        const exePath = process.execPath.replace(/'/g, "''");
        const psScript = `Start-Process -FilePath '${exePath}' -ArgumentList '--no-elevate' -Verb RunAs`;
        const elevated = spawnSync('powershell.exe', [
          '-WindowStyle', 'Hidden', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript
        ], { stdio: 'ignore', windowsHide: true });
        if (elevated.error || elevated.status !== 0) throw elevated.error || new Error('UAC elevation failed');
        process.exit(0);
      } catch (elevateErr) {
        // User declined UAC or system restriction; continue with standard permissions
      }
    }
  }

  startServer();
}
