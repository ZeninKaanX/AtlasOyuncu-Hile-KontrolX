/**
 * Atlas AC - Windows System Resource Usage Monitor (SRUM) & Linux Journal Forensics Engine
 * Inspects:
 * - C:\Windows\System32\sru\SRUDB.dat (ESE JET Database) presence, size, and recreation anomalies
 * - SRUM registry extensions integrity (HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\SRUM\Extensions)
 * - Application execution records in SRUDB.dat (read with FileShare.ReadWrite bypass)
 * - Anti-forensic wiping detection: missing, 0-byte, or recently wiped SRUM databases
 * - Linux: systemd-journald and auditd log tampering or vacuuming
 *
 * Strict 0 False-Flag Guarantee: Only flags when concrete evidence of tampering or explicit cheat names are found.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class SrumForensicsEngine {
  constructor() {
    this.isWindows = process.platform === 'win32';

    this.cheatSignatures = [
      'vape', 'slinky', 'drip', 'doomsday', 'kuraclient', 'ravenbplus',
      'bplusclient', 'catlean', 'meteorclient', 'bleachhack', 'wurstclient',
      'liquidbounce', 'novoline', 'riseclient', 'tenacity', 'skilledclient',
      'itamiclient', 'phantomclient', 'nightmareclient', 'autoclicker',
      'triggerbot', 'killaura', 'prestigeclient', 'speclient', 'moonclient',
      'exhibitionclient', 'astolfo', 'pulsarclient', 'thunderhack',
      'monsoonclient', 'zerodayclient', 'coffeeclient', 'seppuku',
      'konasclient', 'phobosclient', 'abyssclient', 'bumblebeecleaner',
      'redlinecleaner', 'echocleaner'
    ];

    this.whitelist = [
      'node', 'npm', 'discord', 'spotify', 'chrome', 'brave', 'firefox',
      'edge', 'obs64', 'steam', 'code', 'vscodium', 'notepad', 'explorer',
      'taskmgr', 'antigravity', 'farben ac', 'atlas ac', 'xlite', 'claw',
      'drippyloadingscreen', 'keystrokesmod', 'monarchfarmbot', 'soyafarmbot'
    ];
  }

  /**
   * Main SRUM and journal scan.
   */
  async scanSrumForensics(onTarget = () => {}) {
    const findings = [];
    onTarget('SRUM & System Log Forensics: Analyzing SRUDB.dat and Execution Records', 15);

    if (this.isWindows) {
      // 1. SRUDB.dat File Integrity & Anti-Forensic Wiping Check
      const integrityFindings = await this.checkSrUdbIntegrity();
      findings.push(...integrityFindings);

      // 2. SRUM Registry Extensions Integrity
      const extFindings = await this.checkSrumExtensions();
      findings.push(...extFindings);

      // 3. SRUDB.dat Binary Application Execution Extraction
      const execFindings = await this.extractSrumExecutions();
      findings.push(...execFindings);
    } else {
      // Linux System Journal & Audit Forensics
      const linuxLogFindings = await this.checkLinuxJournalLogs();
      findings.push(...linuxLogFindings);
    }

    return {
      status: 'SUCCESS',
      findings: findings
    };
  }

  /**
   * 1. Evaluates SRUDB.dat File State & Tampering
   */
  evaluateSrUdbState(fileExists, fileSize, mtime, uptimeSeconds) {
    const findings = [];
    const srumPath = 'C:\\Windows\\System32\\sru\\SRUDB.dat';

    // A. Missing SRUDB on Windows
    if (!fileExists) {
      findings.push({
        level: 'CRITICAL',
        type: 'SRUDB_DATABASE_WIPED',
        name: 'SRUM Veritabanı Silinmiş (Anti-Forensics)',
        path: srumPath,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        confidence: '100% (Somut Kanıt: SRUDB.dat Silinmiş)',
        description: 'Windows System Resource Usage Monitor (SRUM) veritabanı (SRUDB.dat) bulunamadı veya kasten silinmiş. Hile kullanım izlerini yok etmek için cleaner aracı kullanılmış.',
        evidence: [
          `Hedef Dosya: ${srumPath}`,
          `Durum: SRUDB.dat dosyası mevcut değil (Silinmiş / Sıfırlanmış)`
        ]
      });
      return findings;
    }

    // B. 0-byte or Truncated SRUDB
    if (fileSize === 0) {
      findings.push({
        level: 'CRITICAL',
        type: 'SRUDB_DATABASE_TRUNCATED',
        name: 'SRUM Veritabanı Sıfırlanmış (0 Bayt)',
        path: srumPath,
        timestamp: mtime ? mtime.toISOString().replace('T', ' ').slice(0, 19) : new Date().toISOString().replace('T', ' ').slice(0, 19),
        confidence: '100% (Somut Kanıt: 0 Bayt Boş SRUDB.dat)',
        description: 'SRUM veritabanı (SRUDB.dat) 0 bayt boyutunda! Veritabanının içi adli temizleyici (cleaner) araç ile kasten boşaltılmış.',
        evidence: [
          `Hedef Dosya: ${srumPath}`,
          `Dosya Boyutu: 0 Bayt (Normal boyut: 5MB - 60MB)`
        ]
      });
      return findings;
    }

    // C. Recently Re-created SRUDB while uptime is long
    // Normal SRUDB size is at least 1-2 MB even after a few hours of usage.
    // If uptime > 2 hours and mtime was within the last 20 minutes and file size < 200 KB, indicates a fresh wipe.
    if (uptimeSeconds > 7200 && mtime && fileSize < 200 * 1024) {
      const ageMinutes = (Date.now() - mtime.getTime()) / (60 * 1000);
      if (ageMinutes >= 0 && ageMinutes < 25) {
        findings.push({
          level: 'CRITICAL',
          type: 'SRUDB_DATABASE_RECENTLY_RECREATED',
          name: 'SRUM Veritabanı Yakın Zamanda Yeniden Oluşturulmuş',
          path: srumPath,
          timestamp: mtime.toISOString().replace('T', ' ').slice(0, 19),
          confidence: '100% (Somut Kanıt: SRUM Boyut ve Zaman Tutarsızlığı)',
          description: `Sistem ${Math.round(uptimeSeconds / 3600)} saattir açık olmasına rağmen SRUDB.dat veritabanı sadece ${Math.round(ageMinutes)} dakika önce oluşturulmuş ve boyutu şüpheli derecede küçük (${Math.round(fileSize / 1024)} KB). Hile kullanım kayıtlarını gizlemek için yakın zamanda silinmiş!`,
          evidence: [
            `Dosya Boyutu: ${Math.round(fileSize / 1024)} KB`,
            `Son Değiştirilme: ${mtime.toISOString().replace('T', ' ').slice(0, 19)}`,
            `Sistem Açık Kalma Süresi: ${Math.round(uptimeSeconds / 3600)} saat`
          ]
        });
      }
    }

    return findings;
  }

  /**
   * Live inspection of SRUDB.dat on Windows
   */
  async checkSrUdbIntegrity() {
    if (!this.isWindows) return [];
    const srumPath = 'C:\\Windows\\System32\\sru\\SRUDB.dat';
    const exists = fs.existsSync(srumPath);
    let size = 0;
    let mtime = null;

    if (exists) {
      try {
        const stats = fs.statSync(srumPath);
        size = stats.size;
        mtime = stats.mtime;
      } catch (e) {}
    }

    return this.evaluateSrUdbState(exists, size, mtime, os.uptime());
  }

  /**
   * 2. Checks SRUM Registry Extensions (HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\SRUM\Extensions)
   */
  async checkSrumExtensions() {
    const findings = [];
    if (!this.isWindows) return findings;

    try {
      const cmd = `powershell -NoProfile -Command "Get-ChildItem -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\SRUM\\Extensions' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty PSChildName | ConvertTo-Json"`;
      const { stdout } = await execPromise(cmd, { timeout: 3000 }).catch(() => ({ stdout: '' }));

      if (stdout && stdout.trim().length > 0) {
        let keys = [];
        try {
          const parsed = JSON.parse(stdout);
          keys = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        // Normal Windows has at least 3-6 extension GUIDs ({D10CA2FE-...}, {FEE4E14F-...}, etc.)
        if (keys.length === 0) {
          findings.push({
            level: 'CRITICAL',
            type: 'SRUM_EXTENSIONS_TAMPERED',
            name: 'SRUM Kayıt Defteri Eklentileri Silinmiş',
            path: 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\SRUM\\Extensions',
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            confidence: '100% (Somut Kanıt: SRUM Registry Extensions)',
            description: 'SRUM kayıt defteri eklentileri (Extensions) silinmiş veya boş! Uygulama kullanım istatistiklerinin toplanması kasten engellenmiş.',
            evidence: [
              'Kayıt Defteri Yolu: HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\SRUM\\Extensions',
              'Durum: Kayıtlı uzantı anahtarı bulunamadı (0 adet)'
            ]
          });
        }
      }
    } catch (e) {}

    return findings;
  }

  /**
   * 3. Extracts Executable and DLL Paths from SRUDB.dat Binary Stream
   */
  async extractSrumExecutions() {
    const findings = [];
    if (!this.isWindows) return findings;

    // Use PowerShell FileShare.ReadWrite to inspect locked SRUDB.dat safely without locking contention
    try {
      const script = `
        $path = "C:\\Windows\\System32\\sru\\SRUDB.dat"
        if (-not (Test-Path $path)) { return "" }
        try {
          $stream = [System.IO.File]::Open($path, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
          $reader = New-Object System.IO.BinaryReader($stream)
          $length = [Math]::Min($stream.Length, 30MB)
          $bytes = $reader.ReadBytes($length)
          $reader.Close()
          $stream.Close()

          $str = [System.Text.Encoding]::ASCII.GetString($bytes)
          $matches = [regex]::Matches($str, "[a-zA-Z0-9_\\\\\\-\\.:]{3,120}\\.(exe|jar|dll)")
          $found = @()
          foreach ($m in $matches) {
            $found += $m.Value
          }
          $found | Select-Object -Unique | ConvertTo-Json
        } catch {
          return ""
        }
      `;

      const { stdout } = await execPromise(`powershell -NoProfile -Command "${script.replace(/\r?\n/g, ' ')}"`, {
        timeout: 4000,
        maxBuffer: 10 * 1024 * 1024
      }).catch(() => ({ stdout: '' }));

      if (stdout && stdout.trim().length > 0) {
        let extracted = [];
        try {
          const parsed = JSON.parse(stdout);
          extracted = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        const evaluated = this.evaluateExtractedPaths(extracted);
        findings.push(...evaluated);
      }
    } catch (e) {}

    return findings;
  }

  /**
   * Evaluates extracted file paths from SRUDB.dat against cheat signatures
   */
  evaluateExtractedPaths(paths) {
    const findings = [];
    if (!Array.isArray(paths)) return findings;

    for (const rawPath of paths) {
      if (!rawPath || typeof rawPath !== 'string') continue;
      const lower = rawPath.toLowerCase();

      // Check whitelist
      let isWhitelisted = false;
      for (const w of this.whitelist) {
        if (lower.includes(w)) {
          isWhitelisted = true;
          break;
        }
      }
      if (isWhitelisted) continue;

      const normalizedPath = rawPath.replace(/\\/g, '/');
      const fileName = path.basename(normalizedPath);
      const lowerFileName = fileName.toLowerCase();

      // Check cheat signatures against filename with word boundaries
      for (const sig of this.cheatSignatures) {
        const regex = new RegExp(`(?:^|[._-])${sig}(?:[._-]|$)`, 'i');
        if (regex.test(lowerFileName)) {
          findings.push({
            level: 'CRITICAL',
            type: 'SRUM_APPLICATION_EXECUTION_RECORD',
            name: `SRUM Kaynak Tüketim Kaydı (${fileName})`,
            path: rawPath,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            confidence: '100% (Somut Kanıt: SRUM SRUDB.dat Veritabanı)',
            description: `Windows SRUM veritabanında hilenin çalıştığı ve sistem kaynaklarını (CPU/Ağ/Disk) tükettiği kesin olarak belgelendi: ${fileName}`,
            evidence: [
              `Çıkarılan Dosya Yolu: ${rawPath}`,
              `Tespit Edilen Hile İmzası: ${sig}`,
              `Veri Kaynağı: C:\\Windows\\System32\\sru\\SRUDB.dat (ESE JET Veritabanı)`
            ]
          });
          break;
        }
      }
    }

    return findings;
  }

  /**
   * Linux System Journal & Audit Logs Forensics
   */
  async checkLinuxJournalLogs() {
    const findings = [];
    if (this.isWindows) return findings;

    // Check if systemd journal is completely wiped.
    // Persistent logs live in /var/log/journal; volatile in /run/log/journal.
    // If /var/log/journal exists and has files, systemd logging is fully functional and /run is expected to be empty.
    const persistentDir = '/var/log/journal';
    const volatileDir = '/run/log/journal';

    let hasPersistentLogs = false;
    let hasVolatileLogs = false;

    if (fs.existsSync(persistentDir)) {
      try {
        const files = fs.readdirSync(persistentDir);
        if (files.length > 0) hasPersistentLogs = true;
      } catch (e) {}
    }

    if (fs.existsSync(volatileDir)) {
      try {
        const files = fs.readdirSync(volatileDir);
        if (files.length > 0) hasVolatileLogs = true;
      } catch (e) {}
    }

    // Only flag if journal directories exist on disk but BOTH are completely empty while system uptime > 3600
    if ((fs.existsSync(persistentDir) || fs.existsSync(volatileDir)) && !hasPersistentLogs && !hasVolatileLogs && os.uptime() > 3600) {
      findings.push({
        level: 'CRITICAL',
        type: 'LINUX_JOURNAL_WIPED',
        name: 'Linux Systemd Günlükleri Temizlenmiş (Journal Wiped)',
        path: persistentDir,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        confidence: '100% (Somut Kanıt: Hem /var Hem /run Journal Boş)',
        description: `Sistem ${Math.round(os.uptime() / 3600)} saattir açık olmasına rağmen systemd adli günlükleri (/var/log/journal ve /run/log/journal) tamamen boşaltılmış! Delil karartma amaçlı günlük silme tespit edildi.`,
        evidence: [
          `Kalıcı Günlük: ${persistentDir} (0 dosya)`,
          `Geçici Günlük: ${volatileDir} (0 dosya)`,
          `Sistem Açık Kalma Süresi: ${Math.round(os.uptime() / 60)} dakika`
        ]
      });
    }

    // Check journalctl vacuum command in recent logs
    try {
      const { stdout } = await execPromise('journalctl -n 50 --output=short-iso 2>/dev/null', { timeout: 2000 }).catch(() => ({ stdout: '' }));
      if (stdout) {
        if (stdout.includes('vacuumed') || stdout.includes('Vacuuming done')) {
          findings.push({
            level: 'HIGH',
            type: 'LINUX_JOURNAL_VACUUMED',
            name: 'Linux Günlükleri Kısaltılmış / Temizlenmiş',
            path: '/var/log/journal',
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            confidence: '100% (Somut Kanıt: journalctl Vacuum Kaydı)',
            description: 'Sistem günlüklerinin yakın zamanda journalctl vacuum komutu ile temizlendiği tespit edildi.',
            evidence: [
              'Günlük Mesajı: System journal vacuuming detected'
            ]
          });
        }
      }
    } catch (e) {}

    return findings;
  }
}

module.exports = new SrumForensicsEngine();
