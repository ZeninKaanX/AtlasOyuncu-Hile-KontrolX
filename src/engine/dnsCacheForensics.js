/**
 * Atlas AC - Windows DNS Resolver Cache Forensic Engine
 *
 * Inspects Windows DNS Client Cache (Get-DnsClientCache / ipconfig /displaydns)
 * to detect recent DNS lookups to cheat authentication, licensing, or download servers.
 *
 * Cheats must phone home to verify HWID/subscription on startup (e.g. vape.gg, drip.gg,
 * slinky.gg, riseclient.com). The Windows DNS resolver caches these lookups in RAM
 * for hours, even after the cheat binary is deleted or self-destructed.
 */

'use strict';

const execGuarded = require('./guardedExec');
const cheatKnowledgeBase = require('./cheatKnowledgeBase');

const KNOWN_CHEAT_DOMAINS = [
  'vape.gg', 'vapelite.net', 'drip.gg', 'dripv4.net', 'driplite.com',
  'slinky.gg', 'slinkymc.com', 'liquidbounce.net', 'meteorclient.com',
  'wurstclient.net', 'riseclient.com', 'novoline.lol', 'astolfo.lgbt',
  'tenacity.dev', 'ravenbplus.cf', 'blackspigot.com', 'infernalplus.com',
  'nullpt.rs', 'loader.cc', 'loader.gg', 'injecteur-mc.fr', 'cheatengine.org',
  'celestialclient.com', 'nexusclient.net', 'ghostclient.io', 'ariseclient.com'
];

class DnsCacheForensics {
  constructor() {
    this.isWindows = process.platform === 'win32';
  }

  /**
   * Scans the Windows DNS Client Cache.
   * @param {Function} onProgress - (msg, weight)
   * @returns {Promise<{status: string, findings: Array, totalCachedRecords: number}>}
   */
  async scanDnsCache(onProgress = () => {}) {
    if (!this.isWindows) {
      return { status: 'SKIPPED', findings: [], totalCachedRecords: 0 };
    }

    const findings = [];
    let dataSourceError = null;
    onProgress('DNS Çözümleyici Önbelleği Analizi: Başlatılıyor...', 10);

    let records = [];
    try {
      // 1. Query DNS Cache via PowerShell Get-DnsClientCache
      const psCommand = `Get-DnsClientCache -ErrorAction SilentlyContinue | Select-Object Entry, Name, Data, Status, TimeToLive | ConvertTo-Json -Compress`;
      const { stdout } = await execGuarded(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psCommand}"`, {
        timeout: 10000,
        maxBuffer: 4 * 1024 * 1024
      });

      if (stdout && stdout.trim()) {
        let parsed = null;
        try {
          parsed = JSON.parse(stdout.trim());
        } catch (err) {
          // Multi-line JSON streaming
        }
        if (Array.isArray(parsed)) {
          records = parsed;
        } else if (parsed) {
          records = [parsed];
        } else {
          const lines = stdout.split('\n').filter(Boolean);
          for (const line of lines) {
            try {
              records.push(JSON.parse(line.trim()));
            } catch (e) {}
          }
        }
      }

      onProgress(`DNS önbelleğindeki ${records.length} kayıt taranıyor...`, 50);

      const flaggedDomains = new Set();

      for (const rec of records) {
        const entryName = (rec.Entry || rec.Name || '').toLowerCase();
        const data = (rec.Data || '').toLowerCase();
        const fullString = `${entryName} ${data}`;

        for (const domain of KNOWN_CHEAT_DOMAINS) {
          if (fullString.includes(domain) && !flaggedDomains.has(domain)) {
            flaggedDomains.add(domain);

            const finding = {
              level: 'CRITICAL',
              type: 'DNS_CHEAT_AUTH_ACCESSED',
              name: `DNS Önbelleğinde Doğrulanmış Hile Sunucusu Sorgusu: ${domain}`,
              description: `Windows DNS istemci önbelleğinde '${domain}' hile lisans/sunucu adresine yapılmış aktif sorgu kaydı tespit edilmiştir. Bu, hilenin yakın zamanda çalıştırıldığını ve internet üzerinden lisans doğrulaması yaptığını kanıtlar.`,
              confidence: '100% Somut Adli Kanıt (Windows DNS Resolver Cache)',
              domain: domain,
              evidence: [
                `Sorgulanan Alan Adı: ${entryName || domain}`,
                `DNS Yanıt Verisi (IP/CNAME): ${rec.Data || 'Kayıtlı'}`,
                `Kalan Önbellek Süresi (TTL): ${rec.TimeToLive || 'Aktif'} saniye`,
                `DNS Kayıt Durumu: ${rec.Status || 'Success'}`
              ]
            };

            findings.push(cheatKnowledgeBase.enrichFinding(finding));
          }
        }
      }

      // Check for suspicious anti-forensic DNS flush (ipconfig /flushdns)
      if (records.length > 0 && records.length < 3) {
        const flushFinding = {
          level: 'MEDIUM',
          type: 'DNS_CACHE_RECENTLY_FLUSHED',
          name: 'DNS Önbelleği Manuel Sıfırlama Tespiti (ipconfig /flushdns)',
          description: 'Sistem DNS önbelleğinde olağan dışı derecede az kayıt (<3) bulundu. Oyuncunun ekran paylaşımı öncesinde kanıt karartmak amacıyla DNS geçmişini sıfırladığı değerlendirilmektedir.',
          confidence: 'Kuvvetli Şüphe (Anti-Forensic DNS Flush)',
          evidence: [
            `Mevcut DNS Kayıt Sayısı: ${records.length} (Normal sistemlerde 20-200 arasıdır)`
          ]
        };
        findings.push(cheatKnowledgeBase.enrichFinding(flushFinding));
      }
    } catch (err) {
      // 2. Fallback via ipconfig /displaydns
      try {
        const { stdout } = await execGuarded('ipconfig /displaydns', { timeout: 8000, maxBuffer: 2 * 1024 * 1024 });
        for (const domain of KNOWN_CHEAT_DOMAINS) {
          if (stdout.toLowerCase().includes(domain)) {
            const finding = {
              level: 'CRITICAL',
              type: 'DNS_CHEAT_AUTH_ACCESSED',
              name: `DNS Önbelleğinde Doğrulanmış Hile Sunucusu: ${domain}`,
              description: `ipconfig /displaydns çıktısında '${domain}' alan adına rastlandı. Hile sunucusu bağlantısı sabittir.`,
              confidence: '100% Somut Kanıt (ipconfig /displaydns)',
              domain,
              evidence: [`Eşleşen Alan Adı: ${domain}`]
            };
            findings.push(cheatKnowledgeBase.enrichFinding(finding));
          }
        }
      } catch (fbErr) {
        dataSourceError = fbErr;
      }
    }

    onProgress(dataSourceError ? 'DNS Önbellek Analizi veri kaynağı okunamadı (eksik inceleme).' : 'DNS Önbellek Analizi tamamlandı.', 100);
    const status = dataSourceError
      ? (dataSourceError && dataSourceError.code === 'SCAN_EXEC_TIMEOUT' ? 'TIMEOUT' : 'ERROR')
      : (findings.length > 0 ? 'FINDINGS_DETECTED' : 'CLEAN');
    return {
      status,
      findings,
      totalCachedRecords: records.length,
      ...(dataSourceError ? { error: dataSourceError.message || String(dataSourceError) } : {})
    };
  }
}

module.exports = new DnsCacheForensics();
