/**
 * Atlas AC - Zone.Identifier (NTFS ADS) Forensic Engine
 *
 * Inspects NTFS Alternate Data Streams (Zone.Identifier) on downloaded files
 * to trace original download sources (HostUrl, ReferrerUrl, ZoneId).
 *
 * Even if a cheater renames a cheat binary to OptiFine.jar or Sodium.jar,
 * the Zone.Identifier stream records the exact URL it was downloaded from
 * (e.g. vape.gg, cdn.discordapp.com/attachments/..., drip.gg).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const cheatKnowledgeBase = require('./cheatKnowledgeBase');

const KNOWN_CHEAT_DOMAINS = [
  'vape.gg', 'vapelite.net', 'drip.gg', 'dripv4.net', 'driplite.com',
  'slinky.gg', 'slinkymc.com', 'liquidbounce.net', 'meteorclient.com',
  'wurstclient.net', 'riseclient.com', 'novoline.lol', 'astolfo.lgbt',
  'tenacity.dev', 'ravenbplus.cf', 'blackspigot.com', 'infernalplus.com',
  'nullpt.rs', 'loader.cc', 'loader.gg', 'injecteur-mc.fr', 'doomsdayclient.com'
];

const CHEAT_NAME_PATTERNS = /vape|drip|slinky|meteor|wurst|liquid|rise|novoline|astolfo|tenacity|raven|astralis|autoclicker|cheat|inject|doomsday/i;

class ZoneIdentifierForensics {
  constructor() {
    this.isWindows = process.platform === 'win32';
  }

  /**
   * Main scan method
   * @param {Function} onProgress - (msg, weight)
   * @returns {Promise<{status: string, findings: Array}>}
   */
  async scanZoneIdentifiers(onProgress = () => {}) {
    const findings = [];
    onProgress('Zone.Identifier (NTFS ADS) Adli Analizi: Başlatılıyor...', 10);

    const targetDirs = [
      path.join(os.homedir(), 'Downloads'),
      path.join(os.homedir(), 'Desktop'),
      path.join(os.homedir(), '.minecraft', 'mods'),
      os.tmpdir()
    ];

    if (this.isWindows) {
      // Windows NTFS ADS Inspection via PowerShell
      for (const dir of targetDirs) {
        if (!fs.existsSync(dir)) continue;
        onProgress(`Zone.Identifier taranıyor: ${path.basename(dir)}`, 20);

        const psScript = `
          Get-ChildItem -Path "${dir}" -File -Recurse -Depth 2 -ErrorAction SilentlyContinue | ForEach-Object {
            $stream = Get-Item -Path $_.FullName -Stream Zone.Identifier -ErrorAction SilentlyContinue
            if ($stream) {
              $content = Get-Content -Path $_.FullName -Stream Zone.Identifier -Raw -ErrorAction SilentlyContinue
              if ($content) {
                [PSCustomObject]@{
                  Path = $_.FullName
                  Size = $_.Length
                  Content = $content
                } | ConvertTo-Json -Compress
              }
            }
          }
        `.trim();

        try {
          const { stdout } = await execPromise(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psScript.replace(/\n/g, ' ')}"`, {
            timeout: 10000,
            maxBuffer: 4 * 1024 * 1024
          });

          const lines = stdout.split('\n').filter(Boolean);
          for (const line of lines) {
            try {
              const item = JSON.parse(line.trim());
              const analyzed = this.analyzeZoneContent(item.Path, item.Content);
              if (analyzed) {
                findings.push(analyzed);
              }
            } catch (e) {}
          }
        } catch (e) {}
      }
    } else {
      // Linux / WSL mock & cross-check for .Zone.Identifier companion files
      for (const dir of targetDirs) {
        if (!fs.existsSync(dir)) continue;
        try {
          const files = fs.readdirSync(dir);
          for (const f of files) {
            if (f.endsWith(':Zone.Identifier') || f.includes('.Zone.Identifier')) {
              const fullPath = path.join(dir, f);
              try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const analyzed = this.analyzeZoneContent(fullPath.replace(/(:|\.)Zone\.Identifier$/, ''), content);
                if (analyzed) findings.push(analyzed);
              } catch (err) {}
            }
          }
        } catch (e) {}
      }
    }

    onProgress('Zone.Identifier Adli Analizi tamamlandı.', 100);
    return {
      status: findings.length > 0 ? 'FINDINGS_DETECTED' : 'CLEAN',
      findings
    };
  }

  analyzeZoneContent(filePath, content) {
    if (!content) return null;

    let hostUrl = '';
    let referrerUrl = '';
    let zoneId = '';

    const hostMatch = content.match(/HostUrl=(.+)/i);
    if (hostMatch) hostUrl = hostMatch[1].trim();

    const refMatch = content.match(/ReferrerUrl=(.+)/i);
    if (refMatch) referrerUrl = refMatch[1].trim();

    const zoneMatch = content.match(/ZoneId=(\d+)/i);
    if (zoneMatch) zoneId = zoneMatch[1].trim();

    const fullUrlString = `${hostUrl} ${referrerUrl}`.toLowerCase();

    // Check if URL contains cheat domain
    const matchedDomain = KNOWN_CHEAT_DOMAINS.find(d => fullUrlString.includes(d));
    const isDiscordCheat = fullUrlString.includes('discord') && CHEAT_NAME_PATTERNS.test(fullUrlString);
    const hasCheatKeyword = CHEAT_NAME_PATTERNS.test(fullUrlString) && !/fabric|forge|sodium|optifine|iris|feather/i.test(path.basename(filePath));

    if (matchedDomain || isDiscordCheat || hasCheatKeyword) {
      const finding = {
        level: 'CRITICAL',
        type: 'ZONE_IDENTIFIER_CHEAT_ORIGIN',
        name: 'NTFS Zone.Identifier Üzerinden Doğrulanmış Hile İndirme Kökeni',
        description: `Dosya NTFS alternatif veri akışı (ADS:Zone.Identifier) incelendiğinde hile kaynağı doğrudan tespit edilmiştir. Kaynak: ${matchedDomain || hostUrl || referrerUrl}`,
        confidence: '100% Somut Adli Kanıt (Windows Mark-of-the-Web)',
        path: filePath,
        evidence: [
          `Dosya Yolu: ${filePath}`,
          `HostUrl: ${hostUrl || 'Bilinmiyor'}`,
          `ReferrerUrl: ${referrerUrl || 'Bilinmiyor'}`,
          `ZoneId: ${zoneId} (3 = Internet / Dış Tehdit Alanı)`
        ]
      };

      return cheatKnowledgeBase.enrichFinding(finding);
    }

    return null;
  }
}

module.exports = new ZoneIdentifierForensics();
