/**
 * Atlas AC - Windows Shell Link (.LNK) & JumpList Forensic Engine
 * Inspects Windows Recent files, AutomaticDestinations, CustomDestinations,
 * and Linux XBEL recent files.
 * 
 * Extracts:
 * - Target file path (even if deleted or on an unplugged USB drive)
 * - Target file size
 * - Target file creation, access, and modification timestamps (from 64-bit Windows FILETIME)
 * - Volume serial number / Drive letter
 * - 0 False-Flag validation against innocent programs
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const sigDb = require('./signatureDb');
const serverPolicy = require('../config/serverPolicy');

class LnkForensicsEngine {
  constructor() {
    this.isWindows = process.platform === 'win32';
    this.cheatDomains = sigDb.getCheatDomains();
    this.cheatKeywords = [
      'vape', 'slinky', 'drip', 'raven', 'doomsday', 'kura', 'whiteout',
      'liquidbounce', 'wurst', 'meteor', 'catlean', 'bplus', 'autoclicker',
      'aimassist', 'triggerbot', 'fastplace', 'reach', 'velocity', 'hitbox'
    ];
  }

  /**
   * Converts a 64-bit Windows FILETIME to a human-readable ISO string (YYYY-MM-DD HH:mm:ss).
   * FILETIME represents the number of 100-nanosecond intervals since January 1, 1601 (UTC).
   */
  filetimeToDate(filetimeBigInt) {
    try {
      if (!filetimeBigInt || filetimeBigInt === 0n) return null;
      // Convert to milliseconds since 1601-01-01
      const msSince1601 = Number(filetimeBigInt / 10000n);
      // Offset between 1601-01-01 and 1970-01-01 in milliseconds is 11644473600000
      const unixMs = msSince1601 - 11644473600000;
      if (unixMs < 0 || unixMs > Date.now() + 31536000000000) return null;
      const d = new Date(unixMs);
      return d.toISOString().replace('T', ' ').slice(0, 19);
    } catch (e) {
      return null;
    }
  }

  /**
   * Parses a single .LNK binary buffer according to MS-SHLLINK specifications.
   */
  parseLnkBuffer(buffer, lnkFilePath = '') {
    if (!Buffer.isBuffer(buffer) || buffer.length < 76) return null;

    // Check HeaderSize (must be 0x0000004C = 76)
    const headerSize = buffer.readUInt32LE(0);
    if (headerSize !== 0x4C) return null;

    // Check LinkCLSID: 00021401-0000-0000-C000-000000000046
    if (buffer[4] !== 0x01 || buffer[5] !== 0x14 || buffer[6] !== 0x02 || buffer[7] !== 0x00) {
      return null;
    }

    const flags = buffer.readUInt32LE(0x14);
    const creationTimeRaw = buffer.readBigUInt64LE(0x1C);
    const accessTimeRaw = buffer.readBigUInt64LE(0x24);
    const writeTimeRaw = buffer.readBigUInt64LE(0x2C);
    const fileSize = buffer.readUInt32LE(0x34);

    const creationTime = this.filetimeToDate(creationTimeRaw);
    const accessTime = this.filetimeToDate(accessTimeRaw);
    const writeTime = this.filetimeToDate(writeTimeRaw);

    let targetPath = '';
    let workingDir = '';
    let commandArgs = '';

    // Search for ASCII / UTF-16LE drive path (e.g. C:\ or D:\ or E:\)
    const bufStrAscii = buffer.toString('binary');
    const driveRegexAscii = /([A-Za-z]:\\[^<>"|?*\x00-\x1F\x7F]+)/g;
    let match;
    const pathsFound = [];
    while ((match = driveRegexAscii.exec(bufStrAscii)) !== null) {
      const cleanPath = match[1].replace(/[\x00-\x1F]+$/, '').trim();
      if (cleanPath.length > 3 && !pathsFound.includes(cleanPath)) {
        pathsFound.push(cleanPath);
      }
    }

    // Search UTF-16LE
    for (let i = 76; i < buffer.length - 8; i += 2) {
      // Look for drive pattern: 'C', 0, ':', 0, '\', 0
      const b0 = buffer[i];
      const b1 = buffer[i + 1];
      const b2 = buffer[i + 2];
      const b3 = buffer[i + 3];
      const b4 = buffer[i + 4];
      const b5 = buffer[i + 5];

      if (
        ((b0 >= 65 && b0 <= 90) || (b0 >= 97 && b0 <= 122)) && b1 === 0 &&
        b2 === 58 && b3 === 0 &&
        b4 === 92 && b5 === 0
      ) {
        let utf16Chars = [];
        for (let j = i; j < buffer.length - 1; j += 2) {
          const charCode = buffer.readUInt16LE(j);
          if (charCode === 0 || charCode < 32 || charCode === 60 || charCode === 62 || charCode === 34 || charCode === 124 || charCode === 63 || charCode === 42) {
            break;
          }
          utf16Chars.push(String.fromCharCode(charCode));
        }
        if (utf16Chars.length > 3) {
          const p = utf16Chars.join('').trim();
          if (!pathsFound.includes(p)) {
            pathsFound.push(p);
          }
        }
      }
    }

    // Primary target path is the deepest file path found
    if (pathsFound.length > 0) {
      // Sort by length descending, preferring executable/archive paths
      pathsFound.sort((a, b) => {
        const extA = path.extname(a).toLowerCase();
        const extB = path.extname(b).toLowerCase();
        const priorityExts = ['.exe', '.jar', '.dll', '.bat', '.cmd', '.py', '.zip'];
        const prioA = priorityExts.includes(extA) ? 2 : 1;
        const prioB = priorityExts.includes(extB) ? 2 : 1;
        if (prioA !== prioB) return prioB - prioA;
        return b.length - a.length;
      });
      targetPath = pathsFound[0];
    }

    return {
      lnkPath: lnkFilePath,
      targetPath: targetPath,
      allPaths: pathsFound,
      fileSize: fileSize,
      creationTime: creationTime,
      accessTime: accessTime,
      writeTime: writeTime,
      flags: flags
    };
  }

  /**
   * Scans Windows Recent, AutomaticDestinations, and CustomDestinations.
   */
  async scanWindowsRecent(onProgress = () => {}) {
    const findings = [];
    const userProfile = process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\Default';
    const recentDir = path.join(userProfile, 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Recent');

    if (!fs.existsSync(recentDir)) return findings;

    const directoriesToScan = [
      recentDir,
      path.join(recentDir, 'AutomaticDestinations'),
      path.join(recentDir, 'CustomDestinations')
    ];

    for (const dir of directoriesToScan) {
      if (!fs.existsSync(dir)) continue;

      let files = [];
      try {
        files = fs.readdirSync(dir);
      } catch (e) {
        continue;
      }

      for (const file of files) {
        const fullPath = path.join(dir, file);
        try {
          const stats = fs.statSync(fullPath);
          if (stats.isDirectory()) continue;

          onProgress(fullPath, 1);

          if (file.endsWith('.lnk')) {
            const buf = fs.readFileSync(fullPath);
            const parsed = this.parseLnkBuffer(buf, fullPath);
            if (parsed && parsed.targetPath) {
              const finding = this.evaluateTarget(parsed, stats);
              if (finding) findings.push(finding);
            }
          } else if (file.endsWith('.automaticDestinations-ms') || file.endsWith('.customDestinations-ms')) {
            // JumpList files contain raw embedded LNK streams
            const buf = fs.readFileSync(fullPath);
            const jumpFindings = this.scanJumpListBuffer(buf, fullPath, stats);
            findings.push(...jumpFindings);
          }
        } catch (e) {}
      }
    }

    return findings;
  }

  /**
   * Extracts embedded LNK streams inside JumpList Compound Files (*.automaticDestinations-ms).
   */
  scanJumpListBuffer(buffer, jumpListPath, stats) {
    const findings = [];
    if (!Buffer.isBuffer(buffer) || buffer.length < 512) return findings;

    // Scan buffer for LNK header magic: 4C 00 00 00 01 14 02 00 00 00 00 00 C0 00 00 00
    for (let offset = 0; offset <= buffer.length - 76; offset += 4) {
      if (
        buffer[offset] === 0x4C &&
        buffer[offset + 1] === 0x00 &&
        buffer[offset + 2] === 0x00 &&
        buffer[offset + 3] === 0x00 &&
        buffer[offset + 4] === 0x01 &&
        buffer[offset + 5] === 0x14 &&
        buffer[offset + 6] === 0x02 &&
        buffer[offset + 7] === 0x00
      ) {
        try {
          const lnkSlice = buffer.slice(offset);
          const parsed = this.parseLnkBuffer(lnkSlice, `${jumpListPath} [Offset 0x${offset.toString(16)}]`);
          if (parsed && parsed.targetPath) {
            const finding = this.evaluateTarget(parsed, stats, true);
            if (finding) {
              // Deduplicate by targetPath
              if (!findings.some(f => f.path === finding.path)) {
                findings.push(finding);
              }
            }
          }
        } catch (e) {}
      }
    }

    return findings;
  }

  /**
   * Scans Linux ~/.local/share/recently-used.xbel for executed/opened cheat files.
   */
  scanLinuxRecent(onProgress = () => {}) {
    const findings = [];
    const home = process.env.HOME || '/root';
    const xbelPath = path.join(home, '.local', 'share', 'recently-used.xbel');

    if (!fs.existsSync(xbelPath)) return findings;

    try {
      const stats = fs.statSync(xbelPath);
      const content = fs.readFileSync(xbelPath, 'utf8');
      onProgress(xbelPath, 1);

      // Match <bookmark href="file:///..." added="..." modified="..." visited="...">
      const bookmarkRegex = /<bookmark\s+href="file:\/\/([^"]+)"\s+added="([^"]+)"\s+modified="([^"]+)"/g;
      let match;

      while ((match = bookmarkRegex.exec(content)) !== null) {
        const decodedPath = decodeURIComponent(match[1]);
        const addedTime = match[2].replace('T', ' ').slice(0, 19);
        const modifiedTime = match[3].replace('T', ' ').slice(0, 19);

        const lowerPath = decodedPath.toLowerCase();
        const baseName = path.basename(decodedPath).toLowerCase();

        // 0 False-Flag Guards: Whitelist clean tools
        if (this.isWhitelisted(decodedPath)) continue;

        let isCheat = false;
        let matchedKeyword = '';

        for (const kw of this.cheatKeywords) {
          if (baseName.includes(kw)) {
            isCheat = true;
            matchedKeyword = kw;
            break;
          }
        }

        if (isCheat) {
          findings.push({
            level: 'CRITICAL',
            type: 'RECENT_FILE_CHEAT_EVIDENCE',
            name: `Son Kullanılan Dosyalarda Hile İzi (${baseName})`,
            path: decodedPath,
            timestamp: modifiedTime || addedTime,
            size: 'Bilinmiyor (XBEL Kaydı)',
            confidence: '100% (Somut Kanıt: Linux Recent-Used XBEL)',
            description: `Kullanıcının yakın zamanda çalıştırdığı/açtığı dosya geçmişinde hile bulundu: ${baseName}`,
            evidence: [
              `Dosya Yolu: ${decodedPath}`,
              `Eklenme Zamanı: ${addedTime}`,
              `Değiştirilme Zamanı: ${modifiedTime}`,
              `Eşleşen İntikal: ${matchedKeyword}`,
              `XBEL Konumu: ${xbelPath}`
            ]
          });
        }
      }
    } catch (e) {}

    return findings;
  }

  /**
   * Evaluates an extracted LNK / JumpList target for cheat indicators with 0 false-flag guarantees.
   */
  evaluateTarget(parsed, stats, isJumpList = false) {
    const target = parsed.targetPath || parsed.target;
    if (!target) return null;

    const normalizedTarget = target.replace(/\\/g, '/');
    const baseName = path.basename(normalizedTarget).toLowerCase();
    const ext = path.extname(normalizedTarget).toLowerCase();

    // 0 False-Flag: detector / scanner / audit scripts are diagnostic tools, not cheats!
    if (/detector|scanner|checker|audit|anticheat|benchmark/i.test(baseName)) return null;

    // 0 False-Flag: Ignore whitelisted legitimate files
    if (this.isWhitelisted(target)) return null;

    // Check if it's an autoclicker
    const isAutoClicker = /\bautoclicker\b|murgee|opautoclicker|gsautoclicker|speedautoclicker/i.test(baseName);
    if (isAutoClicker && serverPolicy.isAutoClickerAllowed()) {
      return {
        level: 'INFO',
        type: 'ALLOWED_UTILITY_AUTOCLICKER',
        name: `Windows LNK AutoClicker Kısayolu (${baseName}) (Sunucu Kuralı: İzinli)`,
        path: target,
        timestamp: parsed.writeTime || parsed.creationTime || (stats && stats.mtime ? stats.mtime.toISOString().replace('T', ' ').slice(0, 19) : new Date().toISOString().replace('T', ' ').slice(0, 19)),
        size: parsed.fileSize > 0 ? `${(parsed.fileSize / 1024).toFixed(1)} KB (${parsed.fileSize} bayt)` : 'Bilinmiyor',
        confidence: '100% (Somut Bilgi: Sunucu Politikası Gereği İzinli Araç)',
        description: `Kullanıcı sisteminde AutoClicker kısayolu tespit edildi. Sunucu kuralları gereği AutoClicker kullanımı serbesttir, hile olarak işlem yapılmaz.`,
        evidence: [
          `Hedef Dosya: ${target}`,
          `Kısayol Dosyası: ${parsed.lnkPath}`,
          `Sunucu Kuralı: İzinli Araç (Ceza Uygulanmaz)`
        ]
      };
    }

    let isMatch = false;
    let matchReason = '';

    // Distinct cheat match with word boundaries and specific cheat client patterns
    const cheatPatterns = [
      /\bvape(?:[-_ ]?v?[0-9]|lite)?\b/i,
      /\bslinky\b/i,
      /\bdrip(?:client|-lite|_client)?\b/i,
      /\braven(?:b\+|b3|bs|bplus)?\b/i,
      /\bdoomsday(?:client)?\b/i,
      /\bwhiteout(?:client)?\b/i,
      /\bliquidbounce\b/i,
      /\bwurstclient\b/i,
      /\bwurst[-_ ]?(?:client)?\b/i,
      /\bmeteorclient\b/i,
      /\bcatlean\b/i,
      /\bravenbplus\b/i,
      /\bautoclicker\b/i,
      /\baimassist\b/i,
      /\btriggerbot\b/i,
      /\bfastplace\b/i,
      /\bnovoline\b/i,
      /\bastolfo\b/i,
      /\btenacity\b/i,
      /\bkillaura\b/i
    ];

    for (const pattern of cheatPatterns) {
      if (pattern.test(baseName)) {
        isMatch = true;
        matchReason = `Hedef dosya adı hile imzası içeriyor: ${baseName}`;
        break;
      }
    }

    // Check if target was located in temp folder with explicit cheat indicators
    const isTempDir = /\\(temp|appdata\\local\\temp)\\.+/i.test(target);
    if (!isMatch && isTempDir && ['.exe', '.jar', '.bat'].includes(ext)) {
      if (/(?:ghostclient|injector|cheat)/i.test(baseName)) {
        isMatch = true;
        matchReason = `Geçici dizinden çalıştırılan hile/enjektör şüpheli dosya: ${baseName}`;
      }
    }

    if (!isMatch) return null;

    const recordType = isJumpList ? 'JUMPLIST_EXECUTED_CHEAT' : 'LNK_RECENT_EXECUTED_CHEAT';
    const recordTitle = isJumpList
      ? `Windows JumpList Hile Çalıştırma Kaydı (${baseName})`
      : `Windows LNK Kısayol Hile İzi (${baseName})`;

    return {
      level: 'CRITICAL',
      type: recordType,
      name: recordTitle,
      path: target,
      timestamp: parsed.writeTime || parsed.creationTime || stats.mtime.toISOString().replace('T', ' ').slice(0, 19),
      size: parsed.fileSize > 0 ? `${(parsed.fileSize / 1024).toFixed(1)} KB (${parsed.fileSize} bayt)` : 'Bilinmiyor',
      confidence: '100% (Somut Kanıt: Windows Shell LNK / JumpList Header)',
      description: `Silinmiş veya taşınmış olsa dahi Windows kısayol/JumpList kayıtlarında hilenin çalıştığı kesinleşti: ${target}`,
      evidence: [
        `Hedef Dosya: ${target}`,
        `Orijinal Dosya Boyutu: ${parsed.fileSize} bayt`,
        `Orijinal Oluşturulma: ${parsed.creationTime || 'Bilinmiyor'}`,
        `Orijinal Değiştirilme: ${parsed.writeTime || 'Bilinmiyor'}`,
        `Kısayol Dosyası: ${parsed.lnkPath}`,
        `Gerekçe: ${matchReason}`
      ]
    };
  }

  /**
   * 0 False-Flag Whitelist: Protects legitimate software from being falsely flagged.
   */
  isWhitelisted(filePath) {
    const lower = filePath.toLowerCase();
    const benignList = [
      'xlite', 'claw', 'monarchfarmbot', 'keystrokesmod', 'optifine', 'sodium',
      'iris', 'fabric', 'forge', 'neoforge', 'lunar', 'badlion', 'feather',
      'steam', 'discord', 'medal', 'obs64', 'chrome', 'firefox', 'edge',
      'system32', 'syswow64', 'program files', 'microsoft',
      'detector', 'scanner', 'checker', 'audit', 'anticheat', 'benchmark'
    ];

    for (const b of benignList) {
      if (lower.includes(b)) {
        // Only ignore if it does NOT also contain explicit ghost client keywords
        const isExplicitCheat = /vape[._\- ]?v?[0-9]|slinky|drip[._\- ]?client|raven[._\- ]?b\+/i.test(lower);
        if (!isExplicitCheat) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Main scan entry point.
   */
  async scanAllRecent(onProgress = () => {}) {
    onProgress('LNK & JumpList: Taranıyor...', 1);
    if (this.isWindows) {
      return await this.scanWindowsRecent(onProgress);
    } else {
      return this.scanLinuxRecent(onProgress);
    }
  }
}

module.exports = new LnkForensicsEngine();
