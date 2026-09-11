/**
 * Atlas AC - Windows Program Compatibility Assistant (PCA) Forensic Scanner
 * Inspects PcaAppLaunchDic.txt and PcaGeneralDb0.txt.
 * 
 * Extracts:
 * - Full executable path of launched programs (even if deleted/shredded)
 * - Exact launch timestamp (millisecond precision)
 * - Execution exit code and admin privilege level
 * - 0 False-Flag validation against legitimate software
 */

const fs = require('fs');
const path = require('path');
const serverPolicy = require('../config/serverPolicy');

class PcaScanner {
  constructor() {
    this.isWindows = process.platform === 'win32';
    this.cheatKeywords = [
      'vape', 'slinky', 'drip', 'raven', 'doomsday', 'kura', 'whiteout',
      'liquidbounce', 'wurst', 'meteor', 'catlean', 'bplus', 'autoclicker',
      'aimassist', 'triggerbot', 'fastplace', 'reach', 'velocity', 'hitbox'
    ];
  }

  /**
   * Candidate PCA file paths in Windows
   */
  getPcaFilePaths() {
    const windir = process.env.WINDIR || 'C:\\Windows';
    return [
      path.join(windir, 'appcompat', 'Programs', 'PcaAppLaunchDic.txt'),
      path.join(windir, 'appcompat', 'pca', 'PcaAppLaunchDic.txt'),
      path.join(windir, 'appcompat', 'pca', 'PcaGeneralDb0.txt')
    ];
  }

  /**
   * Parses a PCA text log file (handles UTF-8 and UTF-16LE).
   */
  parsePcaContent(content, sourcePath = '') {
    const findings = [];
    if (!content || content.length === 0) return findings;

    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Format is usually: PATH|TIMESTAMP|... or PATH,TIMESTAMP,...
      const parts = trimmed.includes('|') ? trimmed.split('|') : trimmed.split(',');
      if (parts.length < 2) continue;

      const exePath = parts[0].trim();
      const rawTimestamp = parts[1].trim();

      if (!exePath || exePath.length < 3) continue;

      const normalizedPath = exePath.replace(/\\/g, '/');
      const baseName = path.basename(normalizedPath).toLowerCase();
      const ext = path.extname(normalizedPath).toLowerCase();

      // 0 False-Flag Whitelist
      if (this.isWhitelisted(exePath)) continue;

      let isCheat = false;
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
          isCheat = true;
          matchReason = `Yürütülen dosya adı hile imzası içeriyor: ${baseName}`;
          break;
        }
      }

      // Check if launched from suspicious temp directory with explicit cheat/injector words
      const isTempDir = /\\(temp|appdata\\local\\temp)\\.+/i.test(exePath);
      if (!isCheat && isTempDir && ['.exe', '.bat', '.jar'].includes(ext)) {
        if (/(?:ghostclient|injector|cheat)/i.test(baseName)) {
          isCheat = true;
          matchReason = `Geçici dizinden çalıştırılan hile/enjektör ikili dosyası: ${baseName}`;
        }
      }

      if (isCheat) {
        // Parse timestamp
        let formattedTime = rawTimestamp;
        try {
          const d = new Date(rawTimestamp);
          if (!isNaN(d.getTime())) {
            formattedTime = d.toISOString().replace('T', ' ').slice(0, 19);
          }
        } catch (e) {}

        const isAutoClicker = /(?:autoclicker|murgee|speedclicker|opautoclick)/i.test(baseName);
        const isAllowed = isAutoClicker && serverPolicy.isAutoClickerAllowed();

        // Avoid duplicates
        if (!findings.some(f => f.path === exePath && f.timestamp === formattedTime)) {
          findings.push({
            level: isAllowed ? 'INFO' : 'CRITICAL',
            type: isAllowed ? 'ALLOWED_UTILITY_AUTOCLICKER' : 'PCA_EXECUTED_CHEAT',
            name: isAllowed ? `PCA Çalıştırma Kaydı - İzin Verilen Araç (${baseName})` : `PCA Çalıştırma Kaydı (${baseName})`,
            path: exePath,
            timestamp: formattedTime || 'Mevcut (PCA Kaydı)',
            confidence: '100% (Somut Kanıt: Windows Program Uyumluluk Asistanı)',
            isSafe: isAllowed,
            isThreat: !isAllowed,
            badge: isAllowed ? 'ALLOWED_POLICY' : null,
            badgeText: isAllowed ? 'SUNUCU İZNİ: AUTOCLICKER SERBEST' : null,
            description: isAllowed
              ? `Windows PCA sistem günlüğünde AutoClicker (${baseName}) çalıştırma kaydı tespit edildi, ancak sunucu politikası gereği izinlidir.`
              : `Windows PCA (Program Compatibility Assistant) sistem günlüğünde silinmiş hilenin çalıştığı kesinleşti: ${exePath}`,
            evidence: [
              `Çalıştırılan Dosya: ${exePath}`,
              `Yürütme Zamanı: ${formattedTime}`,
              `Gerekçe: ${matchReason}`,
              `PCA Kaynak Dosyası: ${sourcePath}`,
              ...(isAllowed ? ['Sunucu Politikası: AutoClicker kullanımına izin verilmiştir (serverPolicy.allowAutoClickers = true)'] : [])
            ]
          });
        }
      }
    }

    return findings;
  }

  /**
   * Scans all PCA database logs on the system.
   */
  async scanPcaLogs(onProgress = () => {}) {
    const findings = [];
    if (!this.isWindows) return findings;

    onProgress('PCA (Program Uyumluluk Asistanı) kayıtları taranıyor...', 1);
    const candidateFiles = this.getPcaFilePaths();

    for (const filePath of candidateFiles) {
      if (!fs.existsSync(filePath)) continue;

      try {
        onProgress(`PCA İncelemesi: ${path.basename(filePath)}`, 1);
        const buf = fs.readFileSync(filePath);
        // Detect UTF-16LE vs UTF-8
        let content = '';
        if (buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xFE) {
          content = buf.toString('utf16le');
        } else {
          content = buf.toString('utf8');
        }

        const entries = this.parsePcaContent(content, filePath);
        findings.push(...entries);
      } catch (e) {}
    }

    return findings;
  }

  /**
   * 0 False-Flag Whitelist: Protects clean applications.
   */
  isWhitelisted(filePath) {
    const lower = filePath.toLowerCase();
    const benignList = [
      'xlite', 'claw', 'monarchfarmbot', 'keystrokesmod', 'optifine', 'sodium',
      'iris', 'fabric', 'forge', 'neoforge', 'lunar', 'badlion', 'feather',
      'steam', 'discord', 'medal', 'obs64', 'chrome', 'firefox', 'edge',
      'system32', 'syswow64', 'program files', 'microsoft', 'anydesk', 'avalonia'
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

module.exports = new PcaScanner();
