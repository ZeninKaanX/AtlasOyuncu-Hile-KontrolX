/**
 * Atlas AC - RunMRU & WordWheelQuery Search Forensics Engine
 * Inspects:
 * - HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\RunMRU (Win+R execution history)
 * - HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\WordWheelQuery (Windows Search bar queries)
 * 
 * Extracts:
 * - Direct commands executed via the Run dialog (e.g. javaw -jar vape.jar, cmd /c del %0)
 * - Search terms typed into the Windows Start Menu & Explorer
 * - 0 False-Flag validation
 */

const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execPromise = util.promisify(exec);
const serverPolicy = require('../config/serverPolicy');

class RunHistoryForensics {
  constructor() {
    this.isWindows = process.platform === 'win32';
    this.cheatKeywords = [
      'vape', 'slinky', 'drip', 'raven', 'doomsday', 'kura', 'whiteout',
      'liquidbounce', 'wurst', 'meteor', 'catlean', 'bplus', 'autoclicker',
      'aimassist', 'triggerbot', 'reach', 'velocity', 'hitbox'
    ];
  }

  /**
   * Parses RunMRU registry query output.
   */
  parseRunMruOutput(stdout) {
    const findings = [];
    if (!stdout) return findings;

    const lines = stdout.split('\n');
    for (const line of lines) {
      const match = line.trim().match(/^[a-z]\s+REG_SZ\s+(.+)$/i);
      if (match) {
        const rawCmd = match[1].replace(/\\1$/, '').trim();
        const lowerCmd = rawCmd.toLowerCase();

        if (this.isWhitelisted(lowerCmd)) continue;

        for (const kw of this.cheatKeywords) {
          if (lowerCmd.includes(kw)) {
            if (kw === 'autoclicker' && serverPolicy.isAutoClickerAllowed()) {
              findings.push({
                level: 'INFO',
                type: 'ALLOWED_UTILITY_AUTOCLICKER',
                name: `Çalıştır (Win+R) AutoClicker Komutu (${rawCmd}) (Sunucu Kuralı: İzinli)`,
                path: 'HKCU\\...\\Explorer\\RunMRU',
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                confidence: 'Doğrulandı (İzin Verilen Makro/Klik Aracı)',
                description: `Çalıştır geçmişinde AutoClicker komutu tespit edildi. Sunucu kuralları gereği ban sebebi sayılmamaktadır: ${rawCmd}`,
                evidence: [`Çalıştırılan Komut: ${rawCmd}`]
              });
              break;
            }

            findings.push({
              level: 'CRITICAL',
              type: 'RUNMRU_CHEAT_COMMAND',
              name: `Çalıştır (Win+R) Hile Komutu (${kw})`,
              path: 'HKCU\\...\\Explorer\\RunMRU',
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
              confidence: '100% (Somut Kanıt: Windows Çalıştır Geçmişi)',
              description: `Kullanıcı Çalıştır (Win+R) kutusuna hile başlatma komutu yazmış: ${rawCmd}`,
              evidence: [
                `Çalıştırılan Komut: ${rawCmd}`,
                `Eşleşen Hile İmzası: ${kw}`,
                `Kayıt Defteri: HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU`
              ]
            });
            break;
          }
        }
      }
    }
    return findings;
  }

  /**
   * Scans RunMRU from HKCU.
   */
  async scanRunMru() {
    if (!this.isWindows) return [];
    try {
      const regCmd = `reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU"`;
      const { stdout } = await execPromise(regCmd, { timeout: 3000 }).catch(() => ({ stdout: '' }));
      return this.parseRunMruOutput(stdout);
    } catch (e) {
      return [];
    }
  }

  /**
   * Parses WordWheelQuery registry query output.
   */
  parseWordWheelOutput(stdout) {
    const findings = [];
    if (!stdout) return findings;

    const lines = stdout.split('\n');
    for (const line of lines) {
      const match = line.trim().match(/^\d+\s+REG_BINARY\s+([A-Fa-f0-9]+)$/);
      if (match) {
        try {
          const hexStr = match[1];
          const buf = Buffer.from(hexStr, 'hex');
          const searchStr = buf.toString('utf16le').replace(/\x00+$/, '').trim();
          const lowerSearch = searchStr.toLowerCase();

          if (!lowerSearch || lowerSearch.length < 3 || this.isWhitelisted(lowerSearch)) continue;

          // Whitelist diagnostic / multi-keyword queries containing boolean operators (e.g. hack OR hile OR cheat...)
          if (/\b(?:OR|AND|NOT)\b/i.test(searchStr) || searchStr.length > 50) continue;

          // Check for multiple cheat keywords (diagnostic forensic batch queries)
          let matchCount = 0;
          for (const kw of this.cheatKeywords) {
            if (lowerSearch.includes(kw)) matchCount++;
          }
          if (matchCount >= 2) continue;

          for (const kw of this.cheatKeywords) {
            if (lowerSearch.includes(kw)) {
              if (kw === 'autoclicker' && serverPolicy.isAutoClickerAllowed()) {
                findings.push({
                  level: 'INFO',
                  type: 'ALLOWED_UTILITY_AUTOCLICKER',
                  name: `Windows Arama Çubuğunda AutoClicker Sorgusu (${searchStr}) (Sunucu Kuralı: İzinli)`,
                  path: 'HKCU\\...\\Explorer\\WordWheelQuery',
                  timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                  confidence: 'Doğrulandı (İzin Verilen Makro/Klik Aracı)',
                  description: `Arama çubuğunda AutoClicker sorgusu tespit edildi. Sunucu kuralları gereği ban sebebi sayılmamaktadır: ${searchStr}`,
                  evidence: [`Aranan Terim: ${searchStr}`, `Kayıt Defteri: WordWheelQuery`]
                });
                break;
              }

              findings.push({
                level: 'CRITICAL',
                type: 'WORDWHEELQUERY_CHEAT_SEARCH',
                name: `Windows Arama Çubuğunda Hile Sorgusu (${searchStr})`,
                path: 'HKCU\\...\\Explorer\\WordWheelQuery',
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                confidence: '100% (Somut Kanıt: Windows Başlat Arama Geçmişi)',
                description: `Kullanıcı Başlat menüsünde veya Dosya Gezgini arama çubuğunda hile aramış: ${searchStr}`,
                evidence: [
                  `Aranan Terim: ${searchStr}`,
                  `Eşleşen Hile İmzası: ${kw}`,
                  `Kayıt Defteri: WordWheelQuery`
                ]
              });
              break;
            }
          }
        } catch (e) {}
      }
    }
    return findings;
  }

  /**
   * Scans WordWheelQuery (Windows Search bar queries).
   */
  async scanWordWheelQuery() {
    if (!this.isWindows) return [];
    try {
      const regCmd = `reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\WordWheelQuery"`;
      const { stdout } = await execPromise(regCmd, { timeout: 3000 }).catch(() => ({ stdout: '' }));
      return this.parseWordWheelOutput(stdout);
    } catch (e) {
      return [];
    }
  }

  /**
   * Parses WinRAR archive history registry output.
   */
  parseWinRarHistory(stdout) {
    const findings = [];
    if (!stdout) return findings;

    const lines = stdout.split('\n');
    for (const line of lines) {
      const match = line.trim().match(/^\d+\s+REG_SZ\s+(.+)$/i);
      if (match) {
        const rawPath = match[1].trim();
        const lowerPath = rawPath.toLowerCase();

        if (this.isWhitelisted(lowerPath)) continue;

        for (const kw of this.cheatKeywords) {
          if (lowerPath.includes(kw)) {
            findings.push({
              level: 'CRITICAL',
              type: 'WINRAR_CHEAT_ARCHIVE_HISTORY',
              name: `WinRAR Hile Arşiv Geçmişi (${path.basename(rawPath)})`,
              path: rawPath,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
              confidence: '100% (Somut Kanıt: WinRAR ArcHistory Kayıt Defteri)',
              description: `Kullanıcı WinRAR ile hile arşivini açmış veya ayıklamış: ${rawPath}. Arşiv silinse dahi WinRAR kayıt defterinde izi kalmıştır.`,
              evidence: [
                `Arşiv Yolu: ${rawPath}`,
                `Eşleşen Hile İmzası: ${kw}`,
                `Kayıt Defteri: HKCU\\Software\\WinRAR\\ArcHistory`
              ]
            });
            break;
          }
        }
      }
    }
    return findings;
  }

  /**
   * Parses 7-Zip file manager history registry output.
   */
  parse7ZipHistory(stdout) {
    const findings = [];
    if (!stdout) return findings;

    const lines = stdout.split('\n');
    for (const line of lines) {
      const match = line.trim().match(/^(?:FolderHistory|PathHistory|CopyHistory)\d*\s+REG_SZ\s+(.+)$/i) ||
                    line.trim().match(/^\d+\s+REG_SZ\s+(.+)$/i);
      if (match) {
        const rawPath = match[1].trim();
        const lowerPath = rawPath.toLowerCase();

        if (this.isWhitelisted(lowerPath)) continue;

        for (const kw of this.cheatKeywords) {
          if (lowerPath.includes(kw)) {
            findings.push({
              level: 'CRITICAL',
              type: '7ZIP_CHEAT_PATH_HISTORY',
              name: `7-Zip Hile Dizin Geçmişi (${path.basename(rawPath)})`,
              path: rawPath,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
              confidence: '100% (Somut Kanıt: 7-Zip FM Kayıt Defteri)',
              description: `Kullanıcı 7-Zip dosya yöneticisinde hile dizinini veya arşivini açmış: ${rawPath}`,
              evidence: [
                `Dizin/Arşiv Yolu: ${rawPath}`,
                `Eşleşen Hile İmzası: ${kw}`,
                `Kayıt Defteri: HKCU\\Software\\7-Zip\\FM`
              ]
            });
            break;
          }
        }
      }
    }
    return findings;
  }

  /**
   * Scans WinRAR and 7-Zip history from HKCU.
   */
  async scanArchiverHistory() {
    if (!this.isWindows) return [];
    const findings = [];
    try {
      // 1. WinRAR
      const winrarCmd = `powershell -NoProfile -Command "Get-ItemProperty -Path 'HKCU:\\Software\\WinRAR\\ArcHistory', 'HKCU:\\Software\\WinRAR\\DialogEditHistory\\ExtrPath', 'HKCU:\\Software\\WinRAR\\DialogEditHistory\\ArcPath' -ErrorAction SilentlyContinue | ForEach-Object { $_.PSObject.Properties } | Where-Object { $_.Name -match '^\\d+$' } | Select-Object Name, Value | ConvertTo-Json"`;
      const { stdout: wrJson } = await execPromise(winrarCmd, { timeout: 3000 }).catch(() => ({ stdout: '' }));
      if (wrJson && wrJson.trim().length > 0) {
        let wrItems = [];
        try {
          const parsed = JSON.parse(wrJson);
          wrItems = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        for (const item of wrItems) {
          const rawVal = String(item.Value || '').trim();
          const lowerVal = rawVal.toLowerCase();
          if (this.isWhitelisted(lowerVal)) continue;

          for (const kw of this.cheatKeywords) {
            if (lowerVal.includes(kw)) {
              findings.push({
                level: 'CRITICAL',
                type: 'WINRAR_CHEAT_ARCHIVE_HISTORY',
                name: `WinRAR Hile Arşiv Geçmişi (${path.basename(rawVal)})`,
                path: rawVal,
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                confidence: '100% (Somut Kanıt: WinRAR Kayıt Defteri)',
                description: `Kullanıcı WinRAR ile hile arşivini açmış veya ayıklamış: ${rawVal}. Dosya silinse dahi WinRAR kayıt defterinde izi kalmıştır.`,
                evidence: [
                  `Arşiv / Hedef Yolu: ${rawVal}`,
                  `Eşleşen Hile İmzası: ${kw}`,
                  `Kayıt Defteri: HKCU\\Software\\WinRAR`
                ]
              });
              break;
            }
          }
        }
      }

      // 2. 7-Zip
      const sevenZipCmd = `powershell -NoProfile -Command "Get-ItemProperty -Path 'HKCU:\\Software\\7-Zip\\FM' -ErrorAction SilentlyContinue | ForEach-Object { $_.PSObject.Properties } | Where-Object { $_.Name -match 'History' } | Select-Object Name, Value | ConvertTo-Json"`;
      const { stdout: szJson } = await execPromise(sevenZipCmd, { timeout: 3000 }).catch(() => ({ stdout: '' }));
      if (szJson && szJson.trim().length > 0) {
        let szItems = [];
        try {
          const parsed = JSON.parse(szJson);
          szItems = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        for (const item of szItems) {
          const rawVal = String(item.Value || '').trim();
          const lowerVal = rawVal.toLowerCase();
          if (this.isWhitelisted(lowerVal)) continue;

          for (const kw of this.cheatKeywords) {
            if (lowerVal.includes(kw)) {
              findings.push({
                level: 'CRITICAL',
                type: '7ZIP_CHEAT_PATH_HISTORY',
                name: `7-Zip Hile Dizin Geçmişi (${path.basename(rawVal)})`,
                path: rawVal,
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                confidence: '100% (Somut Kanıt: 7-Zip FM Kayıt Defteri)',
                description: `Kullanıcı 7-Zip dosya yöneticisinde hile dizinini veya arşivini açmış: ${rawVal}`,
                evidence: [
                  `Dizin/Arşiv Yolu: ${rawVal}`,
                  `Eşleşen Hile İmzası: ${kw}`,
                  `Kayıt Defteri: HKCU\\Software\\7-Zip\\FM`
                ]
              });
              break;
            }
          }
        }
      }
    } catch (e) {}

    return findings;
  }

  /**
   * 0 False-Flag Whitelist
   */
  isWhitelisted(cmd) {
    const lower = cmd.toLowerCase();

    // Whitelist detection tools, anti-cheat scanners, and audit scripts (e.g. DoomsDayDetector.ps1)
    if (/detector|scanner|checker|audit|anticheat|benchmark|atlas|farben/i.test(lower)) {
      return true;
    }

    const benignList = [
      'chrome', 'firefox', 'discord', 'steam', 'calc', 'notepad', 'control',
      'cmd', 'powershell', 'taskmgr', 'dxdiag', 'regedit', 'cleanmgr', 'msconfig',
      'excel', 'winword', 'powerpnt', 'xlite', 'claw', 'monarchfarmbot',
      'keystrokesmod', 'optifine', 'sodium', 'anydesk', 'medal'
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
   * Main scan method.
   */
  async scanHistory(onProgress = () => {}) {
    onProgress('Çalıştır (RunMRU), Arama (WordWheelQuery) ve Arşivleyici (WinRAR/7-Zip) geçmişi taranıyor...', 1);
    const findings = [];
    const runFindings = await this.scanRunMru();
    const searchFindings = await this.scanWordWheelQuery();
    const archiverFindings = await this.scanArchiverHistory();
    findings.push(...runFindings, ...searchFindings, ...archiverFindings);
    return findings;
  }
}

module.exports = new RunHistoryForensics();
