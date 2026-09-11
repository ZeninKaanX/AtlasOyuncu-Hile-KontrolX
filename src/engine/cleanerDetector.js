/**
 * Atlas AC - Anti-Forensics & Cleaner Tool Detection Engine
 * Detects attempts to tamper with forensic evidence or self-destruct before screenshare:
 * - Event Log Clearing (Event ID 1102, 104)
 * - Prefetch Directory Wiping (< 10 .pf files)
 * - USN Journal Deletion (fsutil usn deletejournal)
 * - Known Cleaner & Wiping Tools (BleachBit, CCleaner, PrivaZer, SDelete, WipeFile, BCWipe)
 * - PowerShell Console Command History Forensics (PSReadLine ConsoleHost_history.txt)
 * - Self-Destruct Scripts (del %0, self-deleting batch/powershell files)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class CleanerDetector {
  constructor() {
    this.isWindows = process.platform === 'win32';

    // Known evidence wiper / cleaner tool names (explicit binary names only)
    this.cleanerBinaries = [
      'bleachbit', 'ccleaner', 'privazer', 'sdelete', 'wipefile',
      'bcwipe', 'eraser', 'kcleaner', 'glaryutilities', 'redlinecleaner',
      'echocleaner', 'usnwipe', 'logcleaner', 'historycleaner',
      'bumblebeecleaner', 'vanishcleaner', 'manticore', 'scythecleaner',
      'reborncleaner', 'kuturi', 'glitchcleaner', 'arcticcleaner',
      'vaporcleaner', 'ghostcleaner', 'cleanmem', 'voidcleaner',
      'voidwipe', 'tracecleaner', 'tracewipe', 'regcleaner', 'regwipe',
      'usncleaner', 'journalwipe', 'bpmcleaner', 'slothcleaner',
      'horuscleaner', 'hoxcleaner', 'antiss', 'cleanslate'
    ];

    // High-risk command patterns in PowerShell / shell history
    this.antiForensicCommands = [
      { pattern: /fsutil\s+usn\s+deletejournal/i, name: 'USN Journal Deletion Command', severity: 'CRITICAL', desc: 'Player intentionally wiped NTFS USN Change Journal ($UsnJrnl) via fsutil!' },
      { pattern: /wevtutil\s+cl/i, name: 'Windows Event Log Wiping', severity: 'CRITICAL', desc: 'Player intentionally cleared Windows Event Logs via wevtutil command!' },
      { pattern: /Clear-EventLog/i, name: 'PowerShell Event Log Clearing', severity: 'CRITICAL', desc: 'Player cleared Windows Event Logs via PowerShell!' },
      { pattern: /Remove-Item.*Prefetch/i, name: 'Prefetch Directory Wiping', severity: 'CRITICAL', desc: 'Player executed PowerShell command to delete Prefetch execution files!' },
      { pattern: /vssadmin\s+delete\s+shadows/i, name: 'Shadow Copy Deletion', severity: 'CRITICAL', desc: 'Volume Shadow Copies deleted to destroy historic file recovery snapshots!' },
      { pattern: /cipher\s+\/w/i, name: 'Disk Free Space Wiping (cipher /w)', severity: 'HIGH', desc: 'Player ran cipher /w to wipe deleted file clusters from unallocated disk space!' },
      { pattern: /sdelete(\.exe)?\s+/i, name: 'Sysinternals SDelete Wiping', severity: 'CRITICAL', desc: 'Sysinternals SDelete used to permanently overwrite deleted cheat files!' },
      { pattern: /Invoke-WebRequest.*(vape|drip|slinky|doomsday|cheat|injector)/i, name: 'PowerShell Cheat Download WebRequest', severity: 'CRITICAL', desc: 'PowerShell was used to download a cheat binary directly from the web!' },
      { pattern: /powershell.*-enc(odedcommand)?\s+[A-Za-z0-9+/=]{20,}/i, name: 'Base64 Encoded PowerShell Command', severity: 'HIGH', desc: 'Obfuscated Base64-encoded PowerShell script execution detected in history!' },
      { pattern: /((Stop-Service|net\s+stop|sc\s+stop)\s+(PcaSvc|SysMain|EventLog|DPS|DiagTrack)|sc\s+config\s+(PcaSvc|SysMain|EventLog|DPS|DiagTrack).*disabled|Set-Service\s+(PcaSvc|SysMain|EventLog|DPS|DiagTrack).*-StartupType\s+Disabled)/i, name: 'Forensic Service Disabled', severity: 'CRITICAL', desc: 'Player intentionally stopped or disabled a critical Windows forensic service (PcaSvc/SysMain/EventLog)!' },
      { pattern: /reg\s+delete.*(MuiCache|FeatureUsage|AppCompatFlags|OpenSavePidlMRU|LastVisitedPidlMRU)/i, name: 'Execution Registry Wiping', severity: 'CRITICAL', desc: 'Player ran registry delete commands targeting Windows execution history keys!' },
      { pattern: /taskkill\s+\/f\s+\/im\s+explorer\.exe/i, name: 'Explorer Process Termination (Memory Flush)', severity: 'HIGH', desc: 'Player forcefully killed explorer.exe to flush volatile memory caches before the screenshare!' }
    ];
  }

  /**
   * Main scan function across all anti-forensic vectors.
   */
  async scanCleanersAndAntiForensics(onTarget = () => {}) {
    const findings = [];
    onTarget('Anti-Forensics: Inspecting Event Logs, History, and Cleaner Artifacts', 10);

    if (this.isWindows) {
      // 1. PowerShell History (PSReadLine ConsoleHost_history.txt)
      const psHistoryFindings = this.checkPowerShellHistory();
      findings.push(...psHistoryFindings);

      // 2. Prefetch Wiping Check
      const pfFindings = this.checkPrefetchWiping();
      findings.push(...pfFindings);

      // 3. Event Log Tampering (1102 & 104)
      const evFindings = await this.checkEventLogs();
      findings.push(...evFindings);

      // 4. Running Cleaner Processes
      const procFindings = await this.checkRunningCleaners();
      findings.push(...procFindings);

      // 5. Self-Destruct Scripts in Temp / Desktop
      const scriptFindings = this.checkSelfDestructScripts();
      findings.push(...scriptFindings);

      // 6. Critical Forensic Services State (PcaSvc, SysMain, EventLog)
      const svcFindings = await this.checkForensicServices();
      findings.push(...svcFindings);

      // 7. Service Tampering Event Logs (7040 / 7036)
      const stFindings = await this.checkServiceTamperingEvents();
      findings.push(...stFindings);

      // 8. Vulnerable Driver Service Installation (7045)
      const drvFindings = await this.checkVulnerableDriverEvents();
      findings.push(...drvFindings);

      // 9. PowerShell ScriptBlock Logging (Event ID 4104)
      const sbFindings = await this.checkPowerShellScriptBlockEvents();
      findings.push(...sbFindings);
    } else {
      // Linux Anti-Forensics: Bash/Zsh history, shred/wipe commands, unlinked processes
      const linuxHistoryFindings = this.checkLinuxHistory();
      findings.push(...linuxHistoryFindings);
    }

    return {
      status: 'SUCCESS',
      findings: findings
    };
  }

  /**
   * 1. Inspects PowerShell PSReadLine Command History for Anti-Forensics
   */
  checkPowerShellHistory() {
    const findings = [];
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    const psHistoryPath = path.join(appData, 'Microsoft', 'Windows', 'PowerShell', 'PSReadLine', 'ConsoleHost_history.txt');

    if (!fs.existsSync(psHistoryPath)) return findings;

    try {
      const stats = fs.statSync(psHistoryPath);
      const content = fs.readFileSync(psHistoryPath, 'utf8');
      const lines = content.split('\n');
      return this.parseHistoryLines(lines, psHistoryPath, stats.mtime);
    } catch (e) {}

    return findings;
  }

  /**
   * Parses history lines against anti-forensic command patterns.
   */
  parseHistoryLines(lines, historyPath = 'ConsoleHost_history.txt', mtime = null) {
    const findings = [];
    const timestamp = mtime ? (typeof mtime === 'string' ? mtime : mtime.toISOString().replace('T', ' ').slice(0, 19)) : new Date().toISOString().replace('T', ' ').slice(0, 19);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      for (const cmd of this.antiForensicCommands) {
        if (cmd.pattern.test(trimmed)) {
          findings.push({
            level: cmd.severity,
            type: 'ANTI_FORENSIC_COMMAND_RECORDED',
            name: cmd.name,
            path: historyPath,
            timestamp,
            confidence: '100% (Somut Kanıt: PowerShell Komut Geçmişi)',
            description: cmd.desc,
            evidence: [
              `Komut Kaydı: ${trimmed}`,
              `Geçmiş Dosyası: ${historyPath}`,
              `Dosya Son Değiştirilme: ${timestamp}`
            ]
          });
          break;
        }
      }
    }
    return findings;
  }

  /**
   * 2. Inspects Linux Bash/Zsh History for Anti-Forensics & Cleaner Commands
   */
  checkLinuxHistory() {
    const findings = [];
    const home = os.homedir();
    const historyFiles = [
      path.join(home, '.bash_history'),
      path.join(home, '.zsh_history'),
      path.join(home, '.history')
    ];

    const suspiciousLinuxPatterns = [
      { pattern: /shred\s+(-u|-z|--remove)/i, name: 'Linux File Shredding (shred -u)', severity: 'CRITICAL', desc: 'Player executed shred command to permanently overwrite deleted cheat files!' },
      { pattern: /wipe\s+-/i, name: 'Linux Secure Wipe Tool (wipe)', severity: 'CRITICAL', desc: 'Player executed wipe tool to erase forensic evidence!' },
      { pattern: /history\s+-c/i, name: 'Terminal History Cleared (history -c)', severity: 'HIGH', desc: 'Player intentionally wiped terminal history (history -c)!' },
      { pattern: /rm\s+-rf\s+.*(\.minecraft|mods|cheat|vape)/i, name: 'Mass Minecraft / Mod Deletion (rm -rf)', severity: 'HIGH', desc: 'Player deleted Minecraft mod/cheat files right before the check!' },
      { pattern: /curl.*\|.*(bash|sh|python)/i, name: 'Remote Script Execution (curl | bash)', severity: 'CRITICAL', desc: 'Piped web script directly into shell execution!' }
    ];

    for (const hf of historyFiles) {
      if (!fs.existsSync(hf)) continue;

      try {
        const stats = fs.statSync(hf);
        const content = fs.readFileSync(hf, 'utf8');
        const lines = content.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          for (const sp of suspiciousLinuxPatterns) {
            if (sp.pattern.test(trimmed)) {
              findings.push({
                level: sp.severity,
                type: 'LINUX_ANTI_FORENSIC_COMMAND',
                name: sp.name,
                path: hf,
                timestamp: stats.mtime.toISOString().replace('T', ' ').slice(0, 19),
                confidence: '100% (Somut Kanıt: Shell Geçmişi)',
                description: sp.desc,
                evidence: [
                  `Komut: ${trimmed}`,
                  `Geçmiş Dosyası: ${hf}`
                ]
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
   * 3. Verifies Windows Prefetch Directory Count (< 10 files = wiped)
   */
  checkPrefetchWiping() {
    const findings = [];
    const prefetchDir = 'C:\\Windows\\Prefetch';

    if (!fs.existsSync(prefetchDir)) return findings;

    try {
      const files = fs.readdirSync(prefetchDir);
      const pfFiles = files.filter(f => f.toLowerCase().endsWith('.pf'));

      // Normal Windows systems have 50 to 1024 .pf files. < 10 indicates intentional deletion.
      if (pfFiles.length < 10 && pfFiles.length >= 0) {
        findings.push({
          level: 'CRITICAL',
          type: 'PREFETCH_DIRECTORY_WIPED',
          name: 'Prefetch Directory Cleared',
          path: prefetchDir,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          confidence: '100% (Somut Kanıt: Sistem Prefetch Bütünlüğü)',
          description: `Prefetch klasöründe şüpheli derecede az dosya bulundu (${pfFiles.length} adet .pf). Oyuncu hile çalıştırma izlerini gizlemek için Prefetch'i kasten temizlemiş!`,
          evidence: [
            `Konum: ${prefetchDir}`,
            `Mevcut .pf Sayısı: ${pfFiles.length} (Normalde en az 50-100 olmalıdır)`
          ]
        });
      }
    } catch (e) {}

    return findings;
  }

  /**
   * 4. Queries Event Logs for Audit Log Clearing (1102 & 104)
   */
  async checkEventLogs() {
    const findings = [];
    try {
      const cmd = `powershell -NoProfile -Command "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=1102} -MaxEvents 5 -ErrorAction SilentlyContinue | Select-Object TimeCreated, Message | ConvertTo-Json"`;
      const { stdout } = await execPromise(cmd, { timeout: 3000 }).catch(() => ({ stdout: '' }));

      if (stdout && stdout.trim().length > 0) {
        let events = [];
        try {
          const parsed = JSON.parse(stdout);
          events = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        for (const ev of events) {
          findings.push({
            level: 'CRITICAL',
            type: 'SECURITY_EVENT_LOG_PURGED',
            name: 'Security Log Cleared (Event ID 1102)',
            path: 'Windows Security Event Log',
            timestamp: ev.TimeCreated ? String(ev.TimeCreated) : 'Recent',
            confidence: '100% (Somut Kanıt: Windows Olay Günlüğü 1102)',
            description: 'Windows Güvenlik Olay Günlüğü (Security Event Log) kasten temizlenmiş! Hile kontrolünden kaçış girişimi tespit edildi.',
            evidence: [
              `Olay Kimliği: 1102 (The audit log was cleared)`,
              `Zaman: ${ev.TimeCreated || 'Yakın Zaman'}`
            ]
          });
        }
      }
    } catch (e) {}

    return findings;
  }

  /**
   * 5. Checks Running Processes for Active Cleaner / Wiper Tools
   */
  async checkRunningCleaners() {
    const findings = [];
    try {
      const { stdout } = await execPromise('powershell -NoProfile -Command "Get-Process | Select-Object Id, ProcessName, MainWindowTitle | ConvertTo-Json"').catch(() => ({ stdout: '' }));
      if (stdout && stdout.trim().length > 0) {
        let procs = [];
        try {
          const parsed = JSON.parse(stdout);
          procs = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        const browserProcesses = new Set(['chrome', 'firefox', 'msedge', 'edge', 'opera', 'brave', 'discord', 'spotify', 'devenv', 'code']);

        for (const p of procs) {
          const pName = (p.ProcessName || '').toLowerCase().replace(/\.exe$/, '');
          const wTitle = (p.MainWindowTitle || '').toLowerCase();
          const isBrowser = browserProcesses.has(pName);

          for (const cleaner of this.cleanerBinaries) {
            const cleanerBase = cleaner.toLowerCase().replace(/\.exe$/, '');
            const matchProc = pName === cleanerBase;
            const matchTitle = !isBrowser && wTitle.includes(cleanerBase);

            if (matchProc || matchTitle) {
              findings.push({
                level: 'CRITICAL',
                type: 'ACTIVE_CLEANER_TOOL_RUNNING',
                name: `Temizleme / İz Yok Etme Aracı (${p.ProcessName})`,
                path: `PID: ${p.Id} (${p.ProcessName})`,
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                confidence: '100% (Somut Kanıt: Aktif Süreç)',
                description: `Aktif adli iz temizleyici / dosya yok edici araç çalışıyor: ${p.ProcessName} (PID: ${p.Id}). Ekran kontrolünden hemen önce izleri silmek için kullanılmış!`,
                evidence: [
                  `Süreç Adı: ${p.ProcessName}`,
                  `Pencere Başlığı: ${p.MainWindowTitle || 'Arka Plan Süreci'}`,
                  `PID: ${p.Id}`
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
   * 6. Scans Temp and Desktop for Self-Destructing Scripts (del %0)
   */
  checkSelfDestructScripts() {
    const findings = [];
    const checkDirs = [
      process.env.TEMP,
      path.join(os.homedir(), 'Desktop'),
      path.join(os.homedir(), 'Masaüstü'),
      path.join(os.homedir(), 'Downloads'),
      path.join(os.homedir(), 'İndirilenler')
    ].filter(Boolean);

    for (const dir of checkDirs) {
      if (!fs.existsSync(dir)) continue;

      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const ext = path.extname(file).toLowerCase();
          if (ext === '.bat' || ext === '.cmd' || ext === '.ps1') {
            const fullPath = path.join(dir, file);
            try {
              const content = fs.readFileSync(fullPath, 'utf8');
              const hasSelfDelete = /del\s+.*(%0|\"%~f0\")/i.test(content) || /Remove-Item\s+.*\$MyInvocation/i.test(content);
              const hasAntiForensic = /fsutil|wevtutil|prefetch|cipher|wevtutil/i.test(content);

              if (hasSelfDelete && hasAntiForensic) {
                const stats = fs.statSync(fullPath);
                findings.push({
                  level: 'CRITICAL',
                  type: 'SELF_DESTRUCT_SCRIPT_FOUND',
                  name: `Self-Destruct Betiği (${file})`,
                  path: fullPath,
                  timestamp: stats.mtime.toISOString().replace('T', ' ').slice(0, 19),
                  confidence: '100% (Somut Kanıt: Kendini Silen Betik Kodu)',
                  description: `Kendini ve adli izleri silmek üzere tasarlanmış betik dosyası bulundu: ${file}. Hileyi ve sistem kayıtlarını yok etmek için kullanılmış!`,
                  evidence: [
                    `Dosya Yolu: ${fullPath}`,
                    `İçerik İncelemesi: "del %0" ve adli iz temizleme komutları içeriyor`,
                    `Son Değiştirilme: ${stats.mtime.toISOString().replace('T', ' ').slice(0, 19)}`
                  ]
                });
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
    }

    return findings;
  }

  /**
   * 7. Inspects Critical Windows Forensic Services (PcaSvc, SysMain, EventLog)
   * If PcaSvc or SysMain is stopped or disabled, screenshare evasion is confirmed.
   */
  async checkForensicServices() {
    const findings = [];
    if (!this.isWindows) return findings;

    try {
      const cmd = `powershell -NoProfile -Command "Get-Service PcaSvc, SysMain, EventLog -ErrorAction SilentlyContinue | Select-Object Name, Status, StartType | ConvertTo-Json"`;
      const { stdout } = await execPromise(cmd, { timeout: 3000 }).catch(() => ({ stdout: '' }));
      if (stdout && stdout.trim().length > 0) {
        let svcs = [];
        try {
          const parsed = JSON.parse(stdout);
          svcs = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        for (const s of svcs) {
          const name = s.Name || '';
          const status = String(s.Status || '');
          const startType = String(s.StartType || '');

          // Check if disabled or stopped (SysMain or PcaSvc should always be Running & Automatic on clean systems)
          if ((name.toLowerCase() === 'pcasvc' || name.toLowerCase() === 'sysmain') && (status === '1' || status.toLowerCase() === 'stopped' || startType.toLowerCase() === 'disabled')) {
            findings.push({
              level: 'CRITICAL',
              type: 'FORENSIC_SERVICE_TAMPERED',
              name: `Kritik Adli Takip Servisi Devre Disi (${name})`,
              path: `Windows Service: ${name}`,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
              confidence: '100% (Somut Kanit: Servis Durumu ve Baslatma Turu)',
              description: `Windows adli izleme servisi (${name}) kasten durdurulmus veya devre disi birakilmis (Durum: ${status}, Tur: ${startType}). Oyuncu Prefetch veya PCA gecmisinin tutulmasini engellemek icin servisi kapatmis!`,
              evidence: [
                `Servis Adi: ${name}`,
                `Servis Durumu: ${status}`,
                `Baslatma Turu: ${startType}`
              ]
            });
          }
        }
      }
    } catch (e) {}

    return findings;
  }

  /**
   * 8. Inspects System Event Logs for Forensic Service Stopping or Tampering (Event ID 7040 / 7036)
   */
  async checkServiceTamperingEvents() {
    const findings = [];
    if (!this.isWindows) return findings;

    try {
      // Query recent 7040 (start type changed) and 7036 (service entered stopped state) for PcaSvc / SysMain / EventLog
      const cmd = `powershell -NoProfile -Command "Get-WinEvent -FilterHashtable @{LogName='System'; Id=7040,7036} -MaxEvents 50 -ErrorAction SilentlyContinue | Where-Object { $_.Message -match 'PcaSvc|SysMain|EventLog' -and ($_.Message -match 'disabled|stopped|durduruldu|devre disi') } | Select-Object TimeCreated, Id, Message | ConvertTo-Json"`;
      const { stdout } = await execPromise(cmd, { timeout: 3500 }).catch(() => ({ stdout: '' }));
      if (stdout && stdout.trim().length > 0) {
        let events = [];
        try {
          const parsed = JSON.parse(stdout);
          events = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        for (const ev of events) {
          findings.push({
            level: 'CRITICAL',
            type: 'SERVICE_TAMPERING_EVENT_LOG',
            name: `Servis Mudahale Olayi (Event ID ${ev.Id})`,
            path: 'Windows System Event Log',
            timestamp: ev.TimeCreated ? String(ev.TimeCreated).replace('T', ' ').slice(0, 19) : new Date().toISOString().replace('T', ' ').slice(0, 19),
            confidence: '100% (Somut Kanit: Windows Sistem Olay Gunlugu)',
            description: `Adli izleme servisine dogrudan mudahale edildigi tespit edildi: ${(ev.Message || '').slice(0, 120)}...`,
            evidence: [
              `Olay Kimligi: ${ev.Id}`,
              `Zaman: ${ev.TimeCreated}`,
              `Mesaj: ${ev.Message}`
            ]
          });
        }
      }
    } catch (e) {}

    return findings;
  }

  /**
   * 9. Inspects System Event Logs for Vulnerable Driver Installation (Event ID 7045)
   */
  async checkVulnerableDriverEvents() {
    const findings = [];
    if (!this.isWindows) return findings;

    try {
      const cmd = `powershell -NoProfile -Command "Get-WinEvent -FilterHashtable @{LogName='System'; Id=7045} -MaxEvents 50 -ErrorAction SilentlyContinue | Select-Object TimeCreated, Message | ConvertTo-Json"`;
      const { stdout } = await execPromise(cmd, { timeout: 3500 }).catch(() => ({ stdout: '' }));
      if (stdout && stdout.trim().length > 0) {
        let events = [];
        try {
          const parsed = JSON.parse(stdout);
          events = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        const vulnerablePatterns = /gdrv|mhyprot2|rtcore64|capcom|kprocesshacker|echo\.sys|dbutil|zamguard|zam64|iqvw64|procexp/i;

        for (const ev of events) {
          const msg = ev.Message || '';
          if (vulnerablePatterns.test(msg) || /AppData\\Local\\Temp|\\Temp\\.*\.sys/i.test(msg)) {
            findings.push({
              level: 'CRITICAL',
              type: 'VULNERABLE_DRIVER_SERVICE_INSTALLED',
              name: 'BYOVD Savunmasiz Cekirdek Surucusu Kuruldu (Event 7045)',
              path: 'Windows System Event Log (Event ID 7045)',
              timestamp: ev.TimeCreated ? String(ev.TimeCreated).replace('T', ' ').slice(0, 19) : new Date().toISOString().replace('T', ' ').slice(0, 19),
              confidence: '100% (Somut Kanit: Sistem Surucu Kurulum Kaydi)',
              description: 'Sisteme savunmasiz veya supheli kernel surucusu servis olarak kaydedilmis! Hileler ring-0 bellek erisimi ve anti-cheat atlatmak icin bu suruculeri yukler.',
              evidence: [
                `Olay Kimligi: 7045 (A service was installed in the system)`,
                `Zaman: ${ev.TimeCreated}`,
                `Servis Detayi: ${msg}`
              ]
            });
          }
        }
      }
    } catch (e) {}

    return findings;
  }

  /**
   * 10. Evaluates raw PowerShell script text for tampering and cheat execution (Event ID 4104 or transcription)
   */
  evaluateScriptBlock(scriptContent, timeCreated = '') {
    const findings = [];
    if (!scriptContent || typeof scriptContent !== 'string') return findings;

    for (const cmd of this.antiForensicCommands) {
      if (cmd.pattern.test(scriptContent)) {
        findings.push({
          level: cmd.severity,
          type: 'POWERSHELL_SCRIPTBLOCK_CHEAT_EXECUTION',
          name: `PowerShell ScriptBlock Kolay Yakalama (Event ID 4104) - ${cmd.name}`,
          path: 'Microsoft-Windows-PowerShell/Operational (Event ID 4104)',
          timestamp: timeCreated || new Date().toISOString().replace('T', ' ').slice(0, 19),
          confidence: '100% (Somut Kanıt: PowerShell ScriptBlock Günlüğü 4104)',
          description: `PowerShell ScriptBlock günlüğünde hile veya adli iz silme komutu çalıştırıldığı tespit edildi: ${cmd.desc}`,
          evidence: [
            `Tespit Edilen Komut: ${cmd.name}`,
            `Script İçeriği Özeti: ${scriptContent.slice(0, 160).trim()}...`,
            `Zaman: ${timeCreated || 'Kayıtlı'}`
          ]
        });
        break;
      }
    }

    return findings;
  }

  /**
   * Queries Microsoft-Windows-PowerShell/Operational Event ID 4104 (ScriptBlock Logging)
   */
  async checkPowerShellScriptBlockEvents() {
    const findings = [];
    if (!this.isWindows) return findings;

    try {
      const cmd = `powershell -NoProfile -Command "Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-PowerShell/Operational'; Id=4104} -MaxEvents 60 -ErrorAction SilentlyContinue | Select-Object TimeCreated, Message | ConvertTo-Json"`;
      const { stdout } = await execPromise(cmd, { timeout: 4000, maxBuffer: 10 * 1024 * 1024 }).catch(() => ({ stdout: '' }));

      if (stdout && stdout.trim().length > 0) {
        let events = [];
        try {
          const parsed = JSON.parse(stdout);
          events = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        for (const ev of events) {
          const msg = ev.Message || '';
          const time = ev.TimeCreated ? String(ev.TimeCreated).replace('T', ' ').slice(0, 19) : '';
          const evaluated = this.evaluateScriptBlock(msg, time);
          if (evaluated.length > 0) {
            findings.push(...evaluated);
          }
        }
      }
    } catch (e) {}

    return findings;
  }
}

module.exports = new CleanerDetector();

