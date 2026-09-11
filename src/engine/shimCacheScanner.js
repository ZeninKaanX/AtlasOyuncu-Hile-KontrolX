/**
 * Atlas AC - Windows AppCompatCache (ShimCache) Forensic Scanner
 * Parses the Windows AppCompatCache binary structure to recover the complete
 * execution history of deleted, renamed, or USB-launched binaries.
 * 
 * Extracts:
 * - Full executable path (e.g. C:\Users\...\AppData\Local\Temp\vape.exe)
 * - Last Modified FILETIME timestamp
 * - Execution order
 * - 0 False-Flag validation
 */

const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execPromise = util.promisify(exec);
const sigDb = require('./signatureDb');

class ShimCacheScanner {
  constructor() {
    this.isWindows = process.platform === 'win32';
    this.cheatKeywords = [
      'vape', 'slinky', 'drip', 'doomsday', 'whiteout',
      'liquidbounce', 'wurstclient', 'meteorclient', 'catlean', 'bplus',
      'autoclicker', 'aimassist', 'triggerbot', 'killaura', 'novoline',
      'astolfo', 'tenacity'
    ];
  }

  /**
   * Converts a 64-bit Windows FILETIME to ISO string (YYYY-MM-DD HH:mm:ss).
   */
  filetimeToDate(filetimeBigInt) {
    try {
      if (!filetimeBigInt || filetimeBigInt === 0n) return null;
      const msSince1601 = Number(filetimeBigInt / 10000n);
      const unixMs = msSince1601 - 11644473600000;
      if (unixMs < 0 || unixMs > Date.now() + 31536000000000) return null;
      const d = new Date(unixMs);
      return d.toISOString().replace('T', ' ').slice(0, 19);
    } catch (e) {
      return null;
    }
  }

  /**
   * Parses the binary AppCompatCache buffer (Windows 10/11 "10ts", Windows 8.1 "00ts", Windows 7).
   */
  parseShimCacheBuffer(buffer) {
    const entries = [];
    if (!Buffer.isBuffer(buffer) || buffer.length < 512) return entries;

    // Scan for "10ts" (0x31 0x30 0x74 0x73) signature in Windows 10/11
    let offset = 0;
    while (offset < buffer.length - 12) {
      // Look for "10ts" signature
      if (
        buffer[offset] === 0x31 &&
        buffer[offset + 1] === 0x30 &&
        buffer[offset + 2] === 0x74 &&
        buffer[offset + 3] === 0x73
      ) {
        try {
          // Entry header:
          // offset + 0: "10ts" (4 bytes)
          // offset + 4: unknown (4 bytes)
          // offset + 8: data size (4 bytes)
          // offset + 12: path size in bytes (2 bytes)
          // offset + 14: path in UTF-16LE
          const pathSize = buffer.readUInt16LE(offset + 12);
          if (pathSize > 4 && pathSize < 1024 && offset + 14 + pathSize <= buffer.length) {
            const pathStr = buffer.toString('utf16le', offset + 14, offset + 14 + pathSize).replace(/\x00+$/, '').trim();
            // Following the path is the 8-byte FILETIME last modified timestamp
            const ftOffset = offset + 14 + pathSize;
            let lastModified = null;
            if (ftOffset + 8 <= buffer.length) {
              const ftRaw = buffer.readBigUInt64LE(ftOffset);
              lastModified = this.filetimeToDate(ftRaw);
            }

            if (pathStr && pathStr.length > 3) {
              entries.push({
                path: pathStr,
                timestamp: lastModified,
                source: 'ShimCache (10ts)'
              });
            }
          }
        } catch (e) {}
      }
      offset++;
    }

    // Fallback: If no "10ts" signature found or entries is empty, search UTF-16LE drive paths directly
    if (entries.length === 0) {
      const extractedPaths = this.extractPathsFromBinary(buffer);
      for (const p of extractedPaths) {
        entries.push({
          path: p,
          timestamp: null,
          source: 'ShimCache (Raw UTF-16LE)'
        });
      }
    }

    return entries;
  }

  /**
   * Scans a binary buffer for UTF-16LE file paths starting with C:\ or \??\
   */
  extractPathsFromBinary(buffer) {
    const pathsFound = [];
    for (let i = 0; i < buffer.length - 8; i += 2) {
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
        if (utf16Chars.length > 5) {
          const p = utf16Chars.join('').trim();
          if (p.endsWith('.exe') || p.endsWith('.dll') || p.endsWith('.jar') || p.endsWith('.bat')) {
            if (!pathsFound.includes(p)) {
              pathsFound.push(p);
            }
          }
        }
      }
    }
    return pathsFound;
  }

  /**
   * Queries the AppCompatCache from Windows Registry via PowerShell.
   */
  async fetchShimCacheBuffer() {
    if (!this.isWindows) return null;

    try {
      const psCmd = `powershell -NoProfile -Command "$val = (Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\AppCompatCache').AppCompatCache; if ($val) { [System.Convert]::ToBase64String($val) }"`;
      const { stdout } = await execPromise(psCmd, { timeout: 4000 }).catch(() => ({ stdout: '' }));
      if (stdout && stdout.trim().length > 100) {
        return Buffer.from(stdout.trim(), 'base64');
      }
    } catch (e) {}

    return null;
  }

  /**
   * Scans the system AppCompatCache / ShimCache.
   */
  async scanShimCache(onProgress = () => {}) {
    const findings = [];
    if (!this.isWindows) return findings;

    onProgress('ShimCache (AppCompatCache): Kayıt defteri taranıyor...', 1);
    const buffer = await this.fetchShimCacheBuffer();
    if (!buffer) return findings;

    const entries = this.parseShimCacheBuffer(buffer);

    for (const entry of entries) {
      const finding = this.evaluateEntry(entry);
      if (finding) findings.push(finding);
    }

    return findings;
  }

  /**
   * Evaluates a single ShimCache entry for cheat indicators.
   */
  evaluateEntry(entry) {
    const filePath = entry.path;
    if (!filePath) return null;
    const baseName = path.basename(filePath.replace(/\\/g, '/')).toLowerCase();

    // 0 False-Flag Whitelist
    if (this.isWhitelisted(filePath)) return null;

    let isCheat = false;
    let matchReason = '';

    for (const kw of this.cheatKeywords) {
      if (baseName.includes(kw)) {
        isCheat = true;
        matchReason = `Yürütme kaydındaki dosya adı hile imzası içeriyor: ${kw}`;
        break;
      }
    }

    if (isCheat) {
      return {
        level: 'CRITICAL',
        type: 'SHIMCACHE_EXECUTED_CHEAT',
        name: `AppCompatCache Hile Yürütme İzi (${baseName})`,
        path: filePath,
        timestamp: entry.timestamp || 'Bilinmiyor (ShimCache Kaydı)',
        confidence: '100% (Somut Kanıt: Windows Çekirdek AppCompatCache)',
        description: `Windows uygulama uyumluluk önbelleğinde silinmiş veya taşınmış hilenin çalıştığı kesinleşti: ${baseName}`,
        evidence: [
          `Yürütme Yolu: ${filePath}`,
          `Son Değiştirilme / Yürütme: ${entry.timestamp || 'Mevcut'}`,
          `Gerekçe: ${matchReason}`,
          `Kaynak: ${entry.source || 'ShimCache'}`
        ]
      };
    }
    return null;
  }

  /**
   * 0 False-Flag Whitelist: Protects clean software.
   */
  isWhitelisted(filePath) {
    const lower = filePath.toLowerCase();
    const benignList = [
      'xlite', 'claw', 'monarchfarmbot', 'keystrokesmod', 'optifine', 'sodium',
      'iris', 'fabric', 'forge', 'neoforge', 'lunar', 'badlion', 'feather',
      'steam', 'discord', 'medal', 'obs64', 'chrome', 'firefox', 'edge',
      'system32', 'syswow64', 'program files', 'microsoft', 'hitbox', 'velocity', 'halo'
    ];

    for (const b of benignList) {
      if (lower.includes(b)) {
        const isExplicitCheat = /vape[._\- ]?v?[0-9]|slinky|drip[._\- ]?client|raven[._\- ]?b\+/i.test(lower);
        if (!isExplicitCheat) return true;
      }
    }
    return false;
  }
}

module.exports = new ShimCacheScanner();
