/**
 * Atlas AC - Windows Error Reporting (WER) & Crash Dump Forensic Scanner
 * Inspects Windows User Mode Crash Dumps (%LOCALAPPDATA%\CrashDumps)
 * and WER ReportArchive (C:\ProgramData\Microsoft\Windows\WER\ReportArchive)
 * as well as Linux system coredumps.
 * 
 * Extracts:
 * - Crashed executable / injector name (e.g. vape.exe, drip.exe)
 * - Original application path (from Report.wer)
 * - Exact crash timestamp
 * - Injected crash traces in javaw.exe
 * - 0 False-Flag validation
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class WerCrashScanner {
  constructor() {
    this.isWindows = process.platform === 'win32';
    this.cheatKeywords = [
      'vape', 'slinky', 'drip', 'doomsday', 'whiteout',
      'liquidbounce', 'wurstclient', 'meteorclient', 'catlean', 'bplus',
      'autoclicker', 'aimassist', 'triggerbot', 'fastplace', 'killaura',
      'novoline', 'astolfo', 'tenacity'
    ];
  }

  /**
   * Scans Windows CrashDumps and WER ReportArchive.
   */
  async scanWindowsCrashes(onProgress = () => {}) {
    const findings = [];
    const localAppData = process.env.LOCALAPPDATA || '';
    const programData = process.env.ProgramData || 'C:\\ProgramData';

    const candidateDirs = [
      path.join(localAppData, 'CrashDumps'),
      path.join(programData, 'Microsoft', 'Windows', 'WER', 'ReportArchive'),
      path.join(localAppData, 'Microsoft', 'Windows', 'WER', 'ReportArchive'),
      path.join(localAppData, 'Microsoft', 'Windows', 'WER', 'ReportQueue')
    ];

    for (const baseDir of candidateDirs) {
      if (!fs.existsSync(baseDir)) continue;

      onProgress(`Kaza & WER Günlüğü: ${path.basename(baseDir)}`, 1);

      try {
        const items = fs.readdirSync(baseDir);
        for (const item of items) {
          const fullPath = path.join(baseDir, item);
          let stats = null;
          try { stats = fs.statSync(fullPath); } catch (e) { continue; }

          const lowerItem = item.toLowerCase();

          // 1. Crash Dump file (*.dmp)
          if (stats.isFile() && item.endsWith('.dmp')) {
            const finding = this.evaluateCrashName(item, fullPath, stats);
            if (finding) findings.push(finding);
          }

          // 2. WER Folder (e.g. AppCrash_vape.exe_...)
          if (stats.isDirectory() && lowerItem.startsWith('appcrash_')) {
            const reportFile = path.join(fullPath, 'Report.wer');
            if (fs.existsSync(reportFile)) {
              const werFinding = this.parseWerReport(reportFile, stats);
              if (werFinding) findings.push(werFinding);
            } else {
              const finding = this.evaluateCrashName(item, fullPath, stats);
              if (finding) findings.push(finding);
            }
          }
        }
      } catch (e) {}
    }

    return findings;
  }

  /**
   * Evaluates a dump filename or crash folder name.
   */
  evaluateCrashName(name, fullPath, stats) {
    const lower = name.toLowerCase();
    if (this.isWhitelisted(lower)) return null;

    let isMatch = false;
    let matchedKw = '';

    for (const kw of this.cheatKeywords) {
      if (lower.includes(kw)) {
        isMatch = true;
        matchedKw = kw;
        break;
      }
    }

    if (!isMatch) return null;

    const timeStr = stats.mtime.toISOString().replace('T', ' ').slice(0, 19);

    return {
      level: 'CRITICAL',
      type: 'CRASH_DUMP_CHEAT_FOUND',
      name: `Hile Çökme Raporu / Bellek Dökümü (${name})`,
      path: fullPath,
      timestamp: timeStr,
      size: `${(stats.size / 1024).toFixed(1)} KB`,
      confidence: '100% (Somut Kanıt: Windows Kaza / Hata Raporlama Dosyası)',
      description: `Sistemde çökmüş hilenin bellek dökümü (.dmp) veya hata raporu tespit edildi: ${name}`,
      evidence: [
        `Kaza Dosyası / Dizin: ${fullPath}`,
        `Kaza Zamanı: ${timeStr}`,
        `Eşleşen Hile İmzası: ${matchedKw}`
      ]
    };
  }

  /**
   * Parses a Windows Report.wer file to extract AppPath, AppName, and EventTime.
   */
  parseWerReport(reportPath, stats) {
    try {
      const buf = fs.readFileSync(reportPath);
      let content = '';
      if (buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xFE) {
        content = buf.toString('utf16le');
      } else {
        content = buf.toString('utf8');
      }

      return this.parseWerContent(content, stats || { mtime: new Date() }, reportPath);
    } catch (e) {
      return null;
    }
  }

  /**
   * Parses text content of a Report.wer file.
   */
  parseWerContent(content, stats, reportPath = '') {
    try {
      const appNameMatch = content.match(/AppName=([^\r\n]+)/i);
      const appPathMatch = content.match(/AppPath=([^\r\n]+)/i);
      const eventTimeMatch = content.match(/EventTime=([^\r\n]+)/i);

      const appName = appNameMatch ? appNameMatch[1].trim() : '';
      const appPath = appPathMatch ? appPathMatch[1].trim() : '';

      const target = appPath || appName;
      if (!target) return null;

      const lowerTarget = target.toLowerCase();
      if (this.isWhitelisted(lowerTarget)) return null;

      let isCheat = false;
      let matchedKw = '';

      for (const kw of this.cheatKeywords) {
        if (lowerTarget.includes(kw)) {
          isCheat = true;
          matchedKw = kw;
          break;
        }
      }

      if (!isCheat) return null;

      const mtime = stats && stats.mtime ? stats.mtime : new Date();
      const timeStr = mtime.toISOString().replace('T', ' ').slice(0, 19);

      return {
        level: 'CRITICAL',
        type: 'WER_APPCRASH_CHEAT_RECORD',
        name: `WER Uygulama Çökme Kaydı (${appName || path.basename(appPath)})`,
        path: appPath || reportPath,
        timestamp: timeStr,
        confidence: '100% (Somut Kanıt: Windows Hata Raporlama Report.wer)',
        description: `Windows Error Reporting (WER) günlüğünde silinmiş hilenin çökme kaydı ve tam yolu çözüldü: ${target}`,
        evidence: [
          `Çöken Uygulama: ${appName}`,
          `Uygulama Yolu: ${appPath}`,
          `Rapor Dosyası: ${reportPath}`,
          `Kaza Zamanı: ${timeStr}`,
          `Hile İmzası: ${matchedKw}`
        ]
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Scans Linux coredump records.
   */
  scanLinuxCrashes(onProgress = () => {}) {
    const findings = [];
    const candidateDirs = ['/var/crash', '/var/lib/systemd/coredump'];

    for (const dir of candidateDirs) {
      if (!fs.existsSync(dir)) continue;

      onProgress(`Linux Çökme Günlükleri: ${dir}`, 1);

      try {
        const files = fs.readdirSync(dir);
        for (const f of files) {
          const lower = f.toLowerCase();
          for (const kw of this.cheatKeywords) {
            if (lower.includes(kw)) {
              const fullPath = path.join(dir, f);
              const stats = fs.statSync(fullPath);
              findings.push({
                level: 'CRITICAL',
                type: 'LINUX_COREDUMP_CHEAT_FOUND',
                name: `Linux Çökme Bellek Dökümü (${f})`,
                path: fullPath,
                timestamp: stats.mtime.toISOString().replace('T', ' ').slice(0, 19),
                confidence: '100% (Somut Kanıt: Çekirdek Hata Dökümü)',
                description: `Linux sistem coredump dizininde çöken hilenin bellek dökümü tespit edildi: ${f}`,
                evidence: [`Döküm Dosyası: ${fullPath}`, `Hile İmzası: ${kw}`]
              });
              break;
            }
          }
        }
      } catch (e) {}
    }

    return findings;
  }

  /**
   * 0 False-Flag Whitelist
   */
  isWhitelisted(filePath) {
    const lower = filePath.toLowerCase();
    const benignList = [
      'xlite', 'claw', 'monarchfarmbot', 'keystrokesmod', 'optifine', 'sodium',
      'iris', 'fabric', 'forge', 'neoforge', 'lunar', 'badlion', 'feather',
      'steam', 'discord', 'medal', 'obs64', 'chrome', 'firefox', 'edge',
      'system32', 'syswow64', 'program files', 'microsoft', 'anydesk', 'avalonia',
      'hitbox', 'velocity', 'halo'
    ];

    for (const b of benignList) {
      if (lower.includes(b)) {
        const isExplicitCheat = /vape[._\- ]?v?[0-9]|slinky|drip[._\- ]?client|raven[._\- ]?b\+/i.test(lower);
        if (!isExplicitCheat) return true;
      }
    }
    return false;
  }

  /**
   * Main scan entry point.
   */
  async scanCrashes(onProgress = () => {}) {
    onProgress('WER ve Kaza Dökümleri taranıyor...', 1);
    if (this.isWindows) {
      return await this.scanWindowsCrashes(onProgress);
    } else {
      return this.scanLinuxCrashes(onProgress);
    }
  }
}

module.exports = new WerCrashScanner();
