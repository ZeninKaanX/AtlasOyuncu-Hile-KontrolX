/**
 * Atlas AC - Windows Defender & Security History Forensics Engine
 * Inspects:
 * - Active Defender Exclusions (Paths, Processes, Extensions)
 * - Defender Protection Tampering (Event ID 5001: Real-time Protection Disabled, Event ID 5007: Config Changed)
 * - Historic Threat Detections (Event ID 1116: Threat Detected, Event ID 1117: Remediation Action)
 * - Linux Kernel & Memory Security (YAMA ptrace_scope, segfault crashes in javaw)
 * 
 * 0 False-Flag Guarantee:
 * - Legitimate developer exclusions (node_modules, visual studio, git) are whitelisted.
 * - Legitimate anti-cheats (BattlEye, EasyAntiCheat, Vanguard) are safe.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const serverPolicy = require('../config/serverPolicy');

class DefenderForensicsEngine {
  constructor() {
    this.isWindows = process.platform === 'win32';
    this.cheatKeywords = [
      'vape', 'slinky', 'drip', 'raven', 'doomsday', 'kura', 'whiteout',
      'liquidbounce', 'wurst', 'meteor', 'catlean', 'bplus', 'autoclicker',
      'aimassist', 'triggerbot', 'reach', 'velocity', 'hitbox', 'cheat', 'hack'
    ];
  }

  /**
   * Helper to format PowerShell Date strings
   */
  formatPowerShellDate(dateStr) {
    if (!dateStr) return new Date().toISOString().replace('T', ' ').slice(0, 19);
    const match = /\/Date\((\d+)\)\//.exec(String(dateStr));
    if (match) {
      return new Date(parseInt(match[1], 10)).toISOString().replace('T', ' ').slice(0, 19);
    }
    return String(dateStr).replace('T', ' ').slice(0, 19);
  }

  /**
   * Main scan function across Defender and Security forensics.
   */
  async scanDefenderSecurity(onTarget = () => {}) {
    const findings = [];
    onTarget('Security Forensics: Inspecting Defender Exclusions, Event Logs, and Protection State', 15);

    if (this.isWindows) {
      // 1. Exclusions Check
      const exclusionFindings = await this.checkDefenderExclusions(onTarget);
      findings.push(...exclusionFindings);

      // 2. Tampering Events (5001 / 5007)
      const tamperingFindings = await this.checkDefenderTamperingEvents(onTarget);
      findings.push(...tamperingFindings);

      // 3. Threat Detections (1116 / 1117)
      const threatFindings = await this.checkDefenderThreatDetections(onTarget);
      findings.push(...threatFindings);
    } else {
      // Linux Security & Kernel Forensics
      const linuxFindings = this.checkLinuxSecurityTampering(onTarget);
      findings.push(...linuxFindings);
    }

    return {
      status: 'SUCCESS',
      findings: findings
    };
  }

  /**
   * 1. Inspects Windows Defender Exclusions (Paths, Processes, Extensions)
   */
  async checkDefenderExclusions(onTarget = () => {}) {
    const findings = [];
    if (!this.isWindows) return findings;

    try {
      onTarget('Defender: Querying Get-MpPreference exclusion lists', 1);
      const psCmd = `powershell -NoProfile -Command "Get-MpPreference -ErrorAction SilentlyContinue | Select-Object ExclusionPath, ExclusionProcess, ExclusionExtension | ConvertTo-Json"`;
      const { stdout } = await execPromise(psCmd, { timeout: 4000 }).catch(() => ({ stdout: '' }));

      if (stdout && stdout.trim().length > 0) {
        let prefs = null;
        try {
          prefs = JSON.parse(stdout);
        } catch (e) {}

        if (prefs) {
          const pathList = Array.isArray(prefs.ExclusionPath) ? prefs.ExclusionPath : (prefs.ExclusionPath ? [prefs.ExclusionPath] : []);
          const procList = Array.isArray(prefs.ExclusionProcess) ? prefs.ExclusionProcess : (prefs.ExclusionProcess ? [prefs.ExclusionProcess] : []);
          const extList = Array.isArray(prefs.ExclusionExtension) ? prefs.ExclusionExtension : (prefs.ExclusionExtension ? [prefs.ExclusionExtension] : []);

          const parsedFindings = this.evaluateExclusions({ paths: pathList, processes: procList, extensions: extList });
          findings.push(...parsedFindings);
        }
      }
    } catch (e) {}

    return findings;
  }

  /**
   * Evaluates exclusion arrays against cheat patterns and whitelists (Pure function for testing).
   */
  evaluateExclusions({ paths = [], processes = [], extensions = [] }) {
    const findings = [];

    // Evaluate Paths
    for (const p of paths) {
      if (!p || typeof p !== 'string') continue;
      const lower = p.toLowerCase();
      if (this.isWhitelistedExclusion(lower)) continue;

      // Only flag if explicit cheat name is in the excluded path
      const isCheatPath = /(?:^|[\\/._-])(vape|slinky|drip|raven|doomsday|whiteout|liquidbounce|wurst|meteor|novoline|astolfo|tenacity|autoclicker)(?:[-_.]|$)/i.test(lower);
      const isBroadRootEvasion = /^[c-z]:\\?$/i.test(lower.trim()) ||
                                 /(?:^|[\\/])temp(?:[\\/]|$)/i.test(lower) ||
                                 lower.includes('\\appdata\\local\\temp');

      if (isCheatPath || isBroadRootEvasion) {
        findings.push({
          level: 'CRITICAL',
          type: 'DEFENDER_CHEAT_EXCLUSION_PATH',
          name: `Windows Defender Klasor Dislamasi (${path.basename(p.replace(/\\/g, '/')) || p})`,
          path: p,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          confidence: '100% (Somut Kanit: Get-MpPreference ExclusionPath)',
          description: `Windows Defender guvenlik taramasindan kasten cikarilmis supheli/hile klasoru tespit edildi: ${p}. Hileler tespit edilmemek icin bu dislamayi ekler.`,
          evidence: [
            `Dislanan Yol: ${p}`,
            `Neden: ${isCheatPath ? 'Hile dosya adi/klasoru eslesmesi' : 'Genis kok dizin adli kacinma yolu'}`
          ]
        });
      }
    }

    // Evaluate Processes
    for (const pr of processes) {
      if (!pr || typeof pr !== 'string') continue;
      const lower = pr.toLowerCase();
      if (this.isWhitelistedExclusion(lower)) continue;

      if (lower.includes('autoclicker') && serverPolicy.isAutoClickerAllowed()) {
        findings.push({
          level: 'INFO',
          type: 'ALLOWED_UTILITY_AUTOCLICKER',
          name: `Windows Defender AutoClicker Dışlaması (${pr}) (Sunucu Kuralı: İzinli)`,
          path: pr,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          confidence: '100% (Sunucu Politikası: İzinli Araç)',
          description: `Defender dışlamalarında AutoClicker bulundu. Sunucuda serbesttir.`,
          evidence: [`Dışlanan Süreç: ${pr}`]
        });
        continue;
      }

      const isCheatProc = /(?:vape|slinky|drip|raven|doomsday|whiteout|liquidbounce|wurst|meteor|novoline|astolfo|tenacity|autoclicker|injector|javaw\.exe|java\.exe)/i.test(lower);

      if (isCheatProc) {
        findings.push({
          level: 'CRITICAL',
          type: 'DEFENDER_CHEAT_EXCLUSION_PROCESS',
          name: `Windows Defender Surec Dislamasi (${pr})`,
          path: pr,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          confidence: '100% (Somut Kanit: Get-MpPreference ExclusionProcess)',
          description: `Windows Defender korumasindan cikarilmis hile/enjektor sureci: ${pr}.`,
          evidence: [
            `Dislanan Surec: ${pr}`,
            `Risk: Antivirus taramasini devre disi birakma girisimi`
          ]
        });
      }
    }

    // Evaluate Extensions
    for (const ext of extensions) {
      if (!ext || typeof ext !== 'string') continue;
      const lower = ext.toLowerCase().replace(/^\./, '');
      if (['dll', 'exe', 'jar', 'sys'].includes(lower)) {
        findings.push({
          level: 'HIGH',
          type: 'DEFENDER_DANGEROUS_EXTENSION_EXCLUSION',
          name: `Windows Defender Uzanti Dislamasi (.${lower})`,
          path: `*.${lower}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          confidence: '100% (Somut Kanit: Get-MpPreference ExclusionExtension)',
          description: `Windows Defender'da tum .${lower} dosyalari guvenlik taramasindan muaf tutulmus! Bu durum guvenlik duvarini tamamen etkisiz kilar.`,
          evidence: [
            `Dislanan Uzanti: .${lower}`
          ]
        });
      }
    }

    return findings;
  }

  /**
   * 2. Inspects Windows Defender Event Logs for Tampering (Event ID 5001 / 5007)
   */
  async checkDefenderTamperingEvents(onTarget = () => {}) {
    const findings = [];
    if (!this.isWindows) return findings;

    try {
      onTarget('Defender: Checking Operational Event Log (Event ID 5001, 5007)', 1);
      const cmd = `powershell -NoProfile -Command "Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Windows Defender/Operational'; Id=5001,5007} -MaxEvents 20 -ErrorAction SilentlyContinue | Select-Object TimeCreated, Id, Message | ConvertTo-Json"`;
      const { stdout } = await execPromise(cmd, { timeout: 3500 }).catch(() => ({ stdout: '' }));

      if (stdout && stdout.trim().length > 0) {
        let events = [];
        try {
          const parsed = JSON.parse(stdout);
          events = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        for (const ev of events) {
          const id = Number(ev.Id);
          const timeStr = this.formatPowerShellDate(ev.TimeCreated);

          if (id === 5001) {
            findings.push({
              level: 'CRITICAL',
              type: 'DEFENDER_REALTIME_PROTECTION_DISABLED',
              name: 'Windows Defender Gercek Zamanli Koruma Kapatilmis (Event 5001)',
              path: 'Microsoft-Windows-Windows Defender/Operational',
              timestamp: timeStr,
              confidence: '100% (Somut Kanit: Windows Defender Olay Gunlugu 5001)',
              description: 'Microsoft Defender Gercek Zamanli Koruma ozelligi kullanici tarafindan kasten kapatilmis! Hile calistirmadan once anti-virusu devre disi birakma kanitidir.',
              evidence: [
                `Olay Kimligi: 5001 (Real-time protection disabled)`,
                `Zaman: ${timeStr}`
              ]
            });
          } else if (id === 5007) {
            const msg = String(ev.Message || '');
            const lowerMsg = msg.toLowerCase();
            // 0 False-Flag: Ignore routine internal Defender telemetry/signature timestamp updates
            const isMaliciousTamper = /(?:disablerealtime|disableioav|disablebehavior|disableonaccess|disablescan|exclusion)/i.test(lowerMsg);
            if (!isMaliciousTamper) {
              continue; // Normal Windows Defender internal telemetry (e.g. SpyNet, Signature updates)
            }

            findings.push({
              level: 'HIGH',
              type: 'DEFENDER_CONFIG_TAMPERED',
              name: 'Windows Defender Yapilandirmasi Degistirildi (Event 5007)',
              path: 'Microsoft-Windows-Windows Defender/Operational',
              timestamp: timeStr,
              confidence: '100% (Somut Kanit: Windows Defender Olay Gunlugu 5007)',
              description: `Windows Defender yapilandirmasinda korumayi zayiflatan veya dislama ekleyen degisiklik yapildi: ${msg.slice(0, 100)}...`,
              evidence: [
                `Olay Kimligi: 5007 (Configuration changed)`,
                `Zaman: ${timeStr}`,
                `Detay: ${msg}`
              ]
            });
          }
        }
      }
    } catch (e) {}

    return findings;
  }

  /**
   * 3. Inspects Windows Defender Event Logs for Historic Threat Detections (Event ID 1116 / 1117)
   */
  async checkDefenderThreatDetections(onTarget = () => {}) {
    const findings = [];
    if (!this.isWindows) return findings;

    try {
      onTarget('Defender: Checking Threat Detection History (Event ID 1116, 1117)', 1);
      const cmd = `powershell -NoProfile -Command "Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Windows Defender/Operational'; Id=1116,1117} -MaxEvents 30 -ErrorAction SilentlyContinue | Select-Object TimeCreated, Id, Message | ConvertTo-Json"`;
      const { stdout } = await execPromise(cmd, { timeout: 3500 }).catch(() => ({ stdout: '' }));

      if (stdout && stdout.trim().length > 0) {
        let events = [];
        try {
          const parsed = JSON.parse(stdout);
          events = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        for (const ev of events) {
          const msg = String(ev.Message || '');
          const lowerMsg = msg.toLowerCase();
          const timeStr = this.formatPowerShellDate(ev.TimeCreated);

          const isAutoClicker = /\bautoclicker\b/i.test(lowerMsg) && !/(?:vape|drip|slinky|doomsday|cheat|hacktool:win32\/injector)/i.test(lowerMsg);
          if (isAutoClicker && serverPolicy.isAutoClickerAllowed()) {
            findings.push({
              level: 'INFO',
              type: 'ALLOWED_UTILITY_AUTOCLICKER',
              name: `Windows Defender AutoClicker Uyarisi (Event ID ${ev.Id}) (Sunucu Kurali: Izinli)`,
              path: 'Microsoft-Windows-Windows Defender/Operational',
              timestamp: timeStr,
              confidence: '100% (Sunucu Politikasi: Izinli Arac)',
              description: `Windows Defender gecmisinde AutoClicker yazilimi kaydi bulundu. Sunucumuzda AutoClicker serbest oldugu icin ceza uygulanmaz.`,
              evidence: [
                `Olay Kimligi: ${ev.Id}`,
                `Zaman: ${timeStr}`,
                `Tehdit Mesaji: ${msg}`
              ]
            });
            continue;
          }

          // Exclude legitimate Defender internal maintenance & anti-spyware reset events
          if (/DefenderTamperingRestore|DisableAntiSpyware/i.test(msg)) {
            continue;
          }

          const isHackTool = /hacktool|virtool|injector|autoclicker|vape|drip|slinky|doomsday|cheat/i.test(lowerMsg);
          if (isHackTool) {
            findings.push({
              level: 'CRITICAL',
              type: 'DEFENDER_CHEAT_THREAT_DETECTED',
              name: `Windows Defender Hile Tehdidi Yakalamis (Event ID ${ev.Id})`,
              path: 'Microsoft-Windows-Windows Defender/Operational',
              timestamp: timeStr,
              confidence: '100% (Somut Kanit: Windows Defender Tehdit Kaydi)',
              description: `Windows Defender sistemde hile veya bellek enjeksiyon araci tespit etmis: ${msg.slice(0, 120)}...`,
              evidence: [
                `Olay Kimligi: ${ev.Id} (Threat detected / action taken)`,
                `Zaman: ${timeStr}`,
                `Tehdit Mesaji: ${msg}`
              ]
            });
          }
        }
      }
    } catch (e) {}

    return findings;
  }

  /**
   * 4. Linux Security & Kernel Forensics
   */
  checkLinuxSecurityTampering(onTarget = () => {}) {
    const findings = [];
    if (this.isWindows) return findings;

    onTarget('Linux Kernel: Inspecting /proc/sys/kernel/yama/ptrace_scope', 1);

    // Check YAMA ptrace_scope
    try {
      const ptracePath = '/proc/sys/kernel/yama/ptrace_scope';
      if (fs.existsSync(ptracePath)) {
        const val = fs.readFileSync(ptracePath, 'utf8').trim();
        if (val === '0') {
          findings.push({
            level: 'INFO',
            type: 'LINUX_PTRACE_SCOPE_UNRESTRICTED',
            name: 'Linux Kernel YAMA ptrace_scope Bilgilendirmesi (Deger: 0)',
            path: ptracePath,
            isSafe: true,
            isThreat: false,
            category: 'Linux Kernel Security Advisory',
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            confidence: '100% (Kernel sysctl Parametresi)',
            description: 'Linux YAMA ptrace_scope degeri 0 olarak ayarlanmis. Bu deger bazi dagitimlarda (Fedora vb.) varsayilandir veya hata ayiklama araclari tarafindan kullanilir.',
            evidence: [
              `Parametre: /proc/sys/kernel/yama/ptrace_scope`,
              `Mevcut Deger: 0 (Dagitim varsayilani veya ptrace izinli)`
            ]
          });
        }
      }
    } catch (e) {}

    return findings;
  }

  /**
   * 0 False-Flag Whitelist for Legitimate Developer / System Exclusions
   */
  isWhitelistedExclusion(str) {
    const lower = str.toLowerCase();
    const safeTokens = [
      'node_modules', 'visual studio', 'jetbrains', 'rider', 'intellij',
      'android-studio', 'flutter', 'gradle', '.cargo', '.rustup',
      'easyanticheat', 'battleye', 'vanguard', 'riot games', 'steam',
      'epic games', 'discord', 'spotify', 'obs-studio', 'farben ac', 'atlas'
    ];

    return safeTokens.some(st => lower.includes(st));
  }
}

module.exports = new DefenderForensicsEngine();
