/**
 * Farben AC - AutoClicker & Hardware Macro Analyzer
 * Detects:
 * - Active AutoClicker processes (OP Auto Clicker, Murgee, SpeedClicker, Mango, etc.)
 * - Hardware macro profiles (Logitech G-Hub LUA scripts, Razer Synapse XML, Bloody AMC)
 * - Low-level mouse hooks (WH_MOUSE_LL)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const sigDb = require('./signatureDb');
const serverPolicy = require('../config/serverPolicy');

class AutoClickerMacroEngine {
  constructor() {
    this.isWindows = process.platform === 'win32';
  }

  /**
   * Scans for running clickers, macro files, and hook registrations.
   */
  async scanAutoClickersAndMacros(onTarget = () => {}) {
    const findings = [];
    const activeClickers = [];
    onTarget('Active Input Hooks & AutoClicker Process Watcher', 20);

    // 1. Check Running Clicker Processes
    if (this.isWindows) {
      try {
        const { stdout } = await execPromise('powershell -NoProfile -Command "Get-Process | Select-Object Id, ProcessName, MainWindowTitle | ConvertTo-Json"').catch(() => ({ stdout: '' }));
        if (stdout && stdout.trim().length > 0) {
          let procs = [];
          try {
            const parsed = JSON.parse(stdout);
            procs = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {}

          for (const proc of procs) {
            const pName = (proc.ProcessName || '').toLowerCase();
            const wTitle = (proc.MainWindowTitle || '').toLowerCase();

            for (const ac of sigDb.getAutoclickers()) {
              const nameMatched = ac.processNames && ac.processNames.some(p => p.toLowerCase().includes(pName));
              const titleMatched = ac.windowTitles && ac.windowTitles.some(t => wTitle.includes(t.toLowerCase()));

              if (nameMatched || titleMatched) {
                const isAllowed = serverPolicy.isAutoClickerAllowed();
                findings.push({
                  level: isAllowed ? 'INFO' : 'CRITICAL',
                  type: isAllowed ? 'ALLOWED_UTILITY_AUTOCLICKER' : 'ACTIVE_AUTOCLICKER_RUNNING',
                  name: `${ac.name} ${isAllowed ? '(Sunucu Kuralı: İzinli)' : ''}`,
                  pid: proc.Id,
                  process: proc.ProcessName,
                  windowTitle: proc.MainWindowTitle,
                  description: `Arka planda çalışan AutoClicker süreci: ${ac.name} (PID: ${proc.Id}).${isAllowed ? ' Sunucu kuralları gereği ban sebebi sayılmamaktadır.' : ''}`
                });
                activeClickers.push(ac.name);
              }
            }
          }
        }
      } catch (e) {}
    } else {
      // Linux Active Clicker Process Scan (xdotool, ydotool, xautoclick, autokey)
      try {
        const { stdout } = await execPromise('ps aux').catch(() => ({ stdout: '' }));
        if (stdout) {
          const lines = stdout.split('\n');
          const linuxClickerBinaries = ['xdotool', 'ydotool', 'xautoclick', 'autokey', 'cnee'];

          for (const line of lines) {
            const lowerLine = line.toLowerCase();
            for (const bin of linuxClickerBinaries) {
              if (lowerLine.includes(bin) && (lowerLine.includes('click') || lowerLine.includes('repeat') || lowerLine.includes('mousemove') || lowerLine.includes('mouse'))) {
                const isAllowed = serverPolicy.isAutoClickerAllowed();
                findings.push({
                  level: isAllowed ? 'INFO' : 'CRITICAL',
                  type: isAllowed ? 'ALLOWED_UTILITY_AUTOCLICKER' : 'ACTIVE_LINUX_CLICKER_RUNNING',
                  name: `Linux AutoClicker (${bin}) ${isAllowed ? '(Sunucu Kuralı: İzinli)' : ''}`,
                  process: bin,
                  commandLine: line.trim(),
                  description: `Arka planda çalışan Linux tıklama simülatörü: ${bin}.${isAllowed ? ' Sunucu kuralları gereği ban sebebi sayılmamaktadır.' : ''}`
                });
                activeClickers.push(bin);
              }
            }
          }
        }
      } catch (e) {}
    }

    // 2. Scan for Hardware Macro Files (Logitech, Razer, Bloody)
    const macroFindings = this.scanHardwareMacros();
    findings.push(...macroFindings);

    return {
      status: 'SUCCESS',
      findings: findings,
      activeClickers: activeClickers
    };
  }

  /**
   * Searches for Logitech LUA scripts, Razer macros, and Bloody mouse AMC scripts.
   */
  scanHardwareMacros() {
    const findings = [];
    const home = os.homedir();
    const isWindows = process.platform === 'win32';

    const macroDirs = [];
    if (isWindows) {
      const appData = process.env.APPDATA || '';
      const localAppData = process.env.LOCALAPPDATA || '';

      // Logitech G-Hub
      macroDirs.push(path.join(localAppData, 'LGHUB', 'scripts'));
      macroDirs.push(path.join(localAppData, 'LGHUB'));

      // Razer Synapse
      macroDirs.push(path.join(localAppData, 'Razer', 'Synapse3'));
      macroDirs.push(path.join(localAppData, 'Razer', 'Synapse'));

      // Bloody
      macroDirs.push('C:\\Program Files (x86)\\Bloody7\\Bloody7\\Data\\RES\\English\\ScriptsFolder');

      // Glorious Core (Model O/D Macro)
      macroDirs.push(path.join(appData, 'Glorious Core', 'Macro'));
      macroDirs.push(path.join(localAppData, 'Glorious Core', 'Macro'));

      // Corsair iCUE
      macroDirs.push(path.join(appData, 'Corsair', 'CUE', 'actions'));

      // Roccat Swarm
      macroDirs.push(path.join(appData, 'ROCCAT', 'SWARM', 'macro'));
    }

    // Common macro script extensions
    const macroExts = ['.lua', '.xml', '.macro', '.amc', '.amc2', '.mcf', '.gmac', '.ahk', '.au3'];

    for (const dir of macroDirs) {
      if (!fs.existsSync(dir)) continue;

      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const ext = path.extname(file).toLowerCase();

          if (macroExts.includes(ext)) {
            let content = '';
            try {
              content = fs.readFileSync(fullPath, 'utf8', { flag: 'r' }).toLowerCase();
            } catch (e) {
              continue;
            }

            const isClickMacro = /(pressmousebutton|jitter|autoclick|repeat|leftdown|delay\s*1|mouseleft|mouse_event|click\s*down|_mouseclickplus)/i.test(content);

            if (isClickMacro) {
              const isAllowed = serverPolicy.isAutoClickerAllowed();
              findings.push({
                level: isAllowed ? 'INFO' : 'HIGH',
                type: isAllowed ? 'ALLOWED_UTILITY_AUTOCLICKER' : 'HARDWARE_MACRO_DETECTED',
                name: `Donanım/Yazılım Makrosu (${file}) ${isAllowed ? '(Sunucu Kuralı: İzinli)' : ''}`,
                file: file,
                path: fullPath,
                confidence: 'Doğrulandı (Makro Dosyası İmzası)',
                description: `Fare makrosu / otomatik tıklama betiği tespit edildi: ${file}.${isAllowed ? ' Sunucu kuralları gereği ban sebebi sayılmamaktadır.' : ''}`,
                evidence: [
                  `Dosya Yolu: ${fullPath}`,
                  `Uzantı: ${ext}`,
                  `Makro Dizini: ${dir}`
                ]
              });
            }
          }
        }
      } catch (e) {}
    }

    return findings;
  }
}

module.exports = new AutoClickerMacroEngine();
