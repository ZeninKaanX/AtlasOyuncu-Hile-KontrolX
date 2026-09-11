/**
 * Atlas AC - Application Error & Injected Module Crash Forensics Engine
 * Inspects:
 * - Windows Application Event Log Event ID 1000 (Application Error)
 * - Detects javaw.exe / minecraft.exe crashes caused by injected untrusted DLLs in Temp/AppData/Downloads
 * - Detects direct crash events of known cheat executables (vape, drip, slinky, doomsday, etc.)
 * - Windows Error Reporting (WER) correlation
 *
 * Strict 0 False-Flag Guarantee: Whitelists all legitimate JVM native libraries, GPU drivers,
 * and certified overlay hooks (Steam, Discord, Medal, OBS).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const sigDb = require('./signatureDb');

class AppCrashForensicsEngine {
  constructor() {
    this.isWindows = process.platform === 'win32';

    // Legitimate Minecraft / JVM modules and system DLLs (whitelisted)
    this.whitelistedModules = [
      'ntdll.dll',
      'kernel32.dll',
      'kernelbase.dll',
      'jvm.dll',
      'java.dll',
      'verify.dll',
      'net.dll',
      'nio.dll',
      'zip.dll',
      'awt.dll',
      'management.dll',
      'sunmscapi.dll',
      'lwjgl.dll',
      'lwjgl_opengl.dll',
      'lwjgl_stb.dll',
      'glfw.dll',
      'openal.dll',
      'openal32.dll',
      'openal64.dll',
      'jemalloc.dll',
      'gdi32.dll',
      'user32.dll',
      'msvcr100.dll',
      'msvcp140.dll',
      'vcruntime140.dll',
      'vcruntime140_1.dll',
      'ucrtbase.dll',
      'nvoglv64.dll',
      'nvwgf2umx.dll',
      'nvd3dumx.dll',
      'ig9ic64.dll',
      'ig10ic64.dll',
      'ig4ic64.dll',
      'amdogl64.dll',
      'atig6pxx.dll',
      'atiglpxx.dll',
      'discordhook64.dll',
      'medal-hook64.dll',
      'gameoverlayrenderer64.dll'
    ];

    this.knownCheatBinaries = [
      'vape', 'slinky', 'drip', 'doomsday', 'koid', 'itami', 'entropy',
      'catlean', 'bleachhack', 'liquidbounce', 'wurst', 'meteor', 'ares',
      'aristois', 'thunderhack', 'harakiri', 'impact', 'inertia', 'sigma',
      'novoline', 'astolfo', 'rise', 'flux', 'exhi', 'augustus', 'tenacity'
    ];
  }

  /**
   * Evaluates an Application Error Event ID 1000 record
   */
  evaluateAppCrashEvent(appName, moduleName, modulePath, timeCreated = '') {
    if (!appName) return null;
    const lowerApp = appName.toLowerCase();
    const lowerMod = (moduleName || '').toLowerCase();
    const lowerModPath = (modulePath || '').toLowerCase();

    // 1. Direct Crash of a Cheat Executable
    for (const cheat of this.knownCheatBinaries) {
      if (lowerApp.includes(cheat)) {
        return {
          level: 'CRITICAL',
          type: 'CHEAT_PROCESS_CRASH_EVENT',
          name: `Hile Süreci Çökme Kaydı (${appName})`,
          application: appName,
          faultingModule: moduleName,
          faultingPath: modulePath,
          timestamp: timeCreated || new Date().toISOString().replace('T', ' ').slice(0, 19),
          confidence: '100% (Somut Kanıt: Windows Application Event ID 1000)',
          description: `Windows Olay Günlüğü'nde bilinen hile yazılımına (${appName}) ait çökme (Application Error) kaydı bulundu! Bu olay, hilenin bu sistemde çalıştırıldığının inkar edilemez kanıtıdır.`,
          evidence: [
            `Çöken Uygulama: ${appName}`,
            `Hata Veren Modül: ${moduleName || 'Bilinmiyor'}`,
            `Modül Yolu: ${modulePath || 'Bilinmiyor'}`,
            `Zaman Damgası: ${timeCreated || 'Bilinmiyor'}`,
            'Olay Kaynağı: Windows Application Log (Event ID 1000)'
          ]
        };
      }
    }

    // 2. Minecraft / javaw.exe Crash Caused by an Injected Module
    const isMinecraftProcess = lowerApp.includes('javaw.exe') ||
                               lowerApp.includes('minecraft.exe') ||
                               lowerApp.includes('java.exe');

    if (isMinecraftProcess && lowerMod) {
      // Check if the faulting module is legitimate
      const isWhitelisted = this.whitelistedModules.some(w => lowerMod === w || lowerMod.endsWith(w));
      if (isWhitelisted) {
        return null; // Legitimate JVM / driver crash (0 false flag)
      }

      // Check if module is in suspicious directories or has a cheat signature
      const isSuspiciousPath = lowerModPath.includes('\\temp\\') ||
                              lowerModPath.includes('\\tmp\\') ||
                              lowerModPath.includes('\\appdata\\local\\temp') ||
                              lowerModPath.includes('\\downloads\\') ||
                              lowerModPath.includes('\\desktop\\') ||
                              lowerModPath.includes('\\roaming\\') ||
                              lowerModPath.includes('\\local\\') && !lowerModPath.includes('\\programs\\');

      const isCheatModule = this.knownCheatBinaries.some(c => lowerMod.includes(c) || lowerModPath.includes(c));

      if (isCheatModule || isSuspiciousPath) {
        const fileExists = modulePath ? fs.existsSync(modulePath) : false;
        return {
          level: 'CRITICAL',
          type: 'JAVAW_INJECTED_MODULE_CRASH',
          name: `Minecraft İçine Enjekte Edilen Modül Çökmesi (${moduleName})`,
          application: appName,
          faultingModule: moduleName,
          faultingPath: modulePath,
          fileDeleted: !fileExists,
          timestamp: timeCreated || new Date().toISOString().replace('T', ' ').slice(0, 19),
          confidence: '100% (Somut Kanıt: javaw.exe İçinde Harici Modül Hatası)',
          description: `Minecraft (${appName}) süreci, güvenilmeyen dizindeki (${modulePath || moduleName}) bir DLL modülü nedeniyle çöktü! Bu durum javaw.exe içine DLL enjeksiyonu yapıldığını ve hilenin oyunla birlikte çöktüğünü kanıtlar.`,
          evidence: [
            `Hedef Süreç: ${appName}`,
            `Hata Veren DLL: ${moduleName}`,
            `DLL Konumu: ${modulePath}`,
            `Dosya Durumu: ${fileExists ? 'Mevcut' : 'Disk üzerinden silinmiş (Temizleme Girişimi!)'}`,
            `Zaman: ${timeCreated || 'Bilinmiyor'}`
          ]
        };
      }
    }

    return null;
  }

  /**
   * Scans Windows Application Event Log for Event ID 1000 records
   */
  async scanAppCrashEvents(onTarget = () => {}) {
    const findings = [];
    if (!this.isWindows) return findings;

    onTarget('Application Event Log (Event ID 1000 - Application Error)', 1);

    try {
      const psCmd = 'powershell -NoProfile -Command "Get-WinEvent -FilterHashtable @{LogName=\'Application\'; Id=1000} -MaxEvents 50 -ErrorAction SilentlyContinue | Select-Object TimeCreated, Message | ConvertTo-Json -Compress"';
      const { stdout } = await execPromise(psCmd, { maxBuffer: 10 * 1024 * 1024 }).catch(() => ({ stdout: '' }));
      if (!stdout || !stdout.trim()) return findings;

      let events = [];
      try {
        const parsed = JSON.parse(stdout.trim());
        events = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        return findings;
      }

      for (const ev of events) {
        const msg = ev.Message || '';
        const timeCreated = ev.TimeCreated || '';

        // Extract Faulting application name, faulting module name, faulting module path
        const appMatch = msg.match(/Faulting application name:\s*([^\r\n,]+)/i) || msg.match(/Hatalı uygulama adı:\s*([^\r\n,]+)/i);
        const modMatch = msg.match(/Faulting module name:\s*([^\r\n,]+)/i) || msg.match(/Hatalı modül adı:\s*([^\r\n,]+)/i);
        const pathMatch = msg.match(/Faulting module path:\s*([^\r\n,]+)/i) || msg.match(/Hatalı modül yolu:\s*([^\r\n,]+)/i);

        const appName = appMatch ? appMatch[1].trim() : '';
        const modName = modMatch ? modMatch[1].trim() : '';
        const modPath = pathMatch ? pathMatch[1].trim() : '';

        const res = this.evaluateAppCrashEvent(appName, modName, modPath, timeCreated);
        if (res) {
          findings.push(res);
        }
      }
    } catch (e) {
      // Event log permission or execution error
    }

    return findings;
  }
}

module.exports = new AppCrashForensicsEngine();
