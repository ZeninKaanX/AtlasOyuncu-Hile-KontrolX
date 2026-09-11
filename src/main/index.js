/**
 * Atlas AC - Application Entrypoint & CLI Process Controller
 * Supports:
 *   - Normal launch (default)
 *   - Graceful termination: --stop, --kill, -k
 *   - Process status check: --status
 */

require('../engine/silentProcess');
const { startServer } = require('./server');
const http = require('http');
const { execSync } = require('child_process');

const args = process.argv.slice(2);

if (args.includes('--stop') || args.includes('--kill') || args.includes('-k') || args.includes('stop')) {
  console.log('[*] Atlas AC kapatma sinyali gönderiliyor...');

  const req = http.request({
    hostname: '127.0.0.1',
    port: 3317,
    path: '/api/shutdown',
    method: 'POST',
    timeout: 2000
  }, (res) => {
    console.log('[+] Atlas AC süreci başarıyla sonlandırıldı.');
    process.exit(0);
  });

  req.on('error', () => {
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
  });

  req.end();
} else if (args.includes('--status') || args.includes('status')) {
  const req = http.request({
    hostname: '127.0.0.1',
    port: 3317,
    path: '/',
    method: 'GET',
    timeout: 1500
  }, (res) => {
    console.log('[+] Atlas AC aktif durumda ve çalışıyor (Port: 3317).');
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
        const exePath = process.execPath;
        const passArgs = ['--no-elevate', ...cleanArgs].join(' ');
        const psCmd = `powershell -WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '${exePath}' -ArgumentList '${passArgs}' -Verb RunAs"`;
        execSync(psCmd, { stdio: 'ignore', windowsHide: true });
        process.exit(0);
      } catch (elevateErr) {
        // User declined UAC or system restriction; continue with standard permissions
      }
    }
  }

  startServer();
}
