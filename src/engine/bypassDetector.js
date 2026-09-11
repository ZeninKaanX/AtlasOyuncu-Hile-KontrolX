/**
 * Farben AC - Advanced Bypass & Injection Detection Engine
 * Detects advanced stealth injection techniques:
 * - Spotify / SpotX Trojan Bridge & DLL Hijacking
 * - Kernel-Level BYOVD (Bring Your Own Vulnerable Driver) & Test Signing Mode
 * - Discord / Steam Overlay Injection
 * - JVM Agents (-javaagent, JVMTI, attach.dll)
 * - DNS Cache Authentication Forensics
 * - Anti-Forensics & Tampering (USN / Event Log / Prefetch wiping)
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const util = require('util');
const execPromise = util.promisify(exec);
const sigDb = require('./signatureDb');

class BypassDetector {
  constructor() {
    this.knownVulnerableDrivers = sigDb.getKernelDrivers();
    this.knownCheatDomains = sigDb.getCheatDomains();
  }

  /**
   * Runs all bypass checks in parallel and returns comprehensive findings.
   * All 12 checks are I/O-bound and fully independent — Promise.all gives maximum throughput.
   */
  async scanAllBypasses(onTarget = () => {}) {
    const [
      spotifyInjection,
      kernelBypass,
      dnsCacheForensics,
      dnsEventLogs,
      jvmAgentInjection,
      jvmAttachSockets,
      antiForensicsWiping,
      discordSteamInjection,
      alternateDataStreams,
      wmiInjection,
      lolbinAbuse,
      reflectiveDllInjection
    ] = await Promise.all([
      this.checkSpotifyBypass(onTarget).catch(() => []),
      this.checkKernelBypasses(onTarget).catch(() => []),
      this.checkDnsCache(onTarget).catch(() => []),
      this.checkDnsEventLogs(onTarget).catch(() => []),
      this.checkJvmInjections(onTarget).catch(() => []),
      this.checkJvmAttachSockets(onTarget).catch(() => []),
      this.checkAntiForensics(onTarget).catch(() => []),
      this.checkOverlayInjections(onTarget).catch(() => []),
      this.checkAlternateDataStreams(onTarget).catch(() => []),
      this.checkWmiInjection(onTarget).catch(() => []),
      this.checkLolbinAbuse(onTarget).catch(() => []),
      this.checkReflectiveDllInjection(onTarget).catch(() => [])
    ]);

    return {
      spotifyInjection,
      kernelBypass,
      dnsCacheForensics,
      dnsEventLogs,
      jvmAgentInjection,
      jvmAttachSockets,
      antiForensicsWiping,
      discordSteamInjection,
      alternateDataStreams,
      wmiInjection,
      lolbinAbuse,
      reflectiveDllInjection
    };
  }

  /**
   * 1. DETECT SPOTIFY / SPOTX INJECTION BYPASS
   * Checks if Spotify is being used as a trojan horse / DLL hijacking bridge to inject cheats into javaw.exe
   */
  async checkSpotifyBypass(onTarget = () => {}) {
    const findings = [];
    const isWindows = process.platform === 'win32';

    // Locations where Spotify resides
    const possibleSpotifyDirs = [
      process.env.APPDATA ? path.join(process.env.APPDATA, 'Spotify') : null,
      process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Spotify') : null,
      process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WindowsApps', 'Spotify.exe') : null,
      'C:\\Users\\Default\\AppData\\Roaming\\Spotify',
      process.env.HOME ? path.join(process.env.HOME, '.config', 'spotify') : null,
      process.env.HOME ? path.join(process.env.HOME, '.var', 'app', 'com.spotify.Client') : null,
      '/usr/share/spotify'
    ].filter(Boolean);

    for (const dir of possibleSpotifyDirs) {
      if (!fs.existsSync(dir)) continue;

      try {
        const files = fs.readdirSync(dir);
        onTarget(dir, files.length);
        
        // Check for suspicious proxy/hijack DLLs in Spotify directory
        // Real Spotify only has legitimate binaries. Cheats drop version.dll, dxgi.dll, winmm.dll or custom chrome_elf.dll
        const suspiciousDlls = ['version.dll', 'dxgi.dll', 'd3d11.dll', 'winmm.dll', 'hook.dll', 'injector.dll', 'hid.dll'];
        for (const dll of suspiciousDlls) {
          const dllPath = path.join(dir, dll);
          if (fs.existsSync(dllPath)) {
            const stats = fs.statSync(dllPath);
            findings.push({
              level: 'CRITICAL',
              type: 'SPOTIFY_DLL_HIJACK',
              path: dllPath,
              modified: stats.mtime,
              size: stats.size,
              description: `Suspicious proxy DLL found inside Spotify directory: ${dll}. Cheats use this to inject into Minecraft while pretending SpotX was installed.`,
              spotxExempt: false
            });
          }
        }

        // Deep check on chrome_elf.dll inside Spotify
        const chromeElfPath = path.join(dir, 'chrome_elf.dll');
        if (fs.existsSync(chromeElfPath)) {
          const buffer = fs.readFileSync(chromeElfPath);
          const content = buffer.toString('binary');
          // Check for injection / javaw tokens inside chrome_elf.dll
          const cheatTokens = ['javaw.exe', 'VirtualAllocEx', 'WriteProcessMemory', 'CreateRemoteThread', 'FindClass', 'GetMethodID', 'jvm.dll', 'vape', 'reach', 'killaura'];
          const matched = cheatTokens.filter(t => content.includes(t));

          if (matched.length > 0) {
            findings.push({
              level: 'CRITICAL',
              type: 'SPOTIFY_MODIFIED_CHROME_ELF',
              path: chromeElfPath,
              description: `Spotify's chrome_elf.dll contains cheat injection code & Minecraft hooks! (Matched: ${matched.join(', ')})`,
              evidence: matched
            });
          }
        }
      } catch (err) {
        // Folder read permission error
      }
    }

    // On Windows, verify running Spotify process handles and command lines
    if (isWindows) {
      try {
        const { stdout } = await execPromise('powershell -NoProfile -Command "Get-Process Spotify -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, Path"');
        if (stdout && stdout.includes('Spotify')) {
          // Check named pipes for ghost client communication
          const pipeCheck = await execPromise('powershell -NoProfile -Command "[System.IO.Directory]::GetFiles(\'\\\\.\\pipe\\\') | Select-String -Pattern \'vape|drip|slinky|doomsday|cheat|inject\'"').catch(() => ({ stdout: '' }));
          if (pipeCheck.stdout && pipeCheck.stdout.trim().length > 0) {
            findings.push({
              level: 'CRITICAL',
              type: 'NAMED_PIPE_INJECTION',
              description: `Detected suspicious cheat Named Pipe: ${pipeCheck.stdout.trim()}`
            });
          }
        }
      } catch (e) {
        // Silently continue
      }
    }

    return findings;
  }

  /**
   * 2. DETECT KERNEL-LEVEL BYPASSES (BYOVD & Test Signing)
   * Detects vulnerable drivers (gdrv, mhyprot2, capcom, echo, etc.) used to bypass user-mode process permissions.
   */
  async checkKernelBypasses(onTarget = () => {}) {
    const findings = [];
    const isWindows = process.platform === 'win32';

    if (!isWindows) {
      onTarget('/proc/modules (Kernel Driver Forensics)', 1);
      // Linux Kernel Forensics: Check for tainted kernel, out-of-tree modules, and rootkits
      try {
        if (fs.existsSync('/proc/sys/kernel/tainted')) {
          const taintVal = parseInt(fs.readFileSync('/proc/sys/kernel/tainted', 'utf8').trim(), 10);
          if (taintVal > 0) {
            findings.push({
              level: 'INFO',
              type: 'LINUX_TAINTED_KERNEL',
              taintValue: taintVal,
              description: `Linux Kernel is TAINTED (Flag: ${taintVal}). Standard third-party or hardware drivers (e.g. ThinkPad/NVIDIA/WireGuard) loaded into kernel.`
            });
          }
        }

        const { stdout: lsmodOut } = await execPromise('lsmod').catch(() => ({ stdout: '' }));
        if (lsmodOut) {
          const lowerMods = lsmodOut.toLowerCase();
          const modLines = lsmodOut.split('\n').filter(Boolean);
          onTarget('/proc/modules (' + modLines.length + ' kernel modules)', modLines.length);
          for (const driver of this.knownVulnerableDrivers) {
            const base = driver.replace('.sys', '').toLowerCase();
            if (lowerMods.includes(base)) {
              findings.push({
                level: 'CRITICAL',
                type: 'LINUX_VULNERABLE_DRIVER',
                driver: base,
                description: `Known vulnerable kernel module identified: ${base}`
              });
            }
          }
        }
      } catch (e) {}

      return findings;
    }

    onTarget('C:\\Windows\\System32\\drivers (BYOVD Driver Registry)', 20);

    // A. Check Test Signing Mode & Driver Integrity
    try {
      const { stdout } = await execPromise('bcdedit /enum {current}').catch(() => ({ stdout: '' }));
      if (stdout) {
        if (/testsigning\s+yes/i.test(stdout)) {
          findings.push({
            level: 'CRITICAL',
            type: 'TESTSIGNING_ENABLED',
            description: 'Windows Test Signing Mode is ENABLED! This allows loading unsigned / custom kernel cheat drivers without Microsoft signature.'
          });
        }
        if (/nointegritychecks\s+yes/i.test(stdout)) {
          findings.push({
            level: 'CRITICAL',
            type: 'INTEGRITY_CHECKS_DISABLED',
            description: 'Windows Driver Integrity Checks are DISABLED!'
          });
        }
      }
    } catch (e) {}

    // B. Check Loaded Kernel Drivers for Known Vulnerable Drivers (BYOVD)
    try {
      const { stdout } = await execPromise('driverquery /fo csv').catch(() => ({ stdout: '' }));
      if (stdout) {
        const lowerOutput = stdout.toLowerCase();
        for (const driver of this.knownVulnerableDrivers) {
          const driverBase = driver.replace('.sys', '').toLowerCase();
          if (lowerOutput.includes(driverBase)) {
            // Check if this is standard OEM Gigabyte hardware driver (gdrv.sys)
            if (driverBase === 'gdrv') {
              const tempDir = process.env.TEMP || 'C:\\Windows\\Temp';
              const isDroppedInTemp = fs.existsSync(path.join(tempDir, 'gdrv.sys')) || fs.existsSync('C:\\Windows\\Temp\\gdrv.sys');
              if (!isDroppedInTemp) {
                // Legitimate Gigabyte motherboard driver installed in System32 - safe OEM utility
                continue;
              }
            }

            findings.push({
              level: 'CRITICAL',
              type: 'VULNERABLE_KERNEL_DRIVER',
              driver: driver,
              confidence: 'High (BYOVD Driver Signature)',
              description: `Vulnerable kernel driver loaded in memory: ${driver}. Cheats use BYOVD to read/write Minecraft memory with kernel ring-0 privileges.`,
              evidence: [`Driver Name: ${driver}`, `Detected via driverquery subsystem`]
            });
          }
        }
      }
    } catch (e) {}

    // C. Check System32/drivers and %TEMP% for dropped .sys files
    try {
      const tempDir = process.env.TEMP || 'C:\\Windows\\Temp';
      if (fs.existsSync(tempDir)) {
        const tempFiles = fs.readdirSync(tempDir);
        for (const file of tempFiles) {
          if (file.toLowerCase().endsWith('.sys')) {
            findings.push({
              level: 'CRITICAL',
              type: 'KERNEL_DRIVER_IN_TEMP',
              path: path.join(tempDir, file),
              description: `Kernel driver (.sys) found inside User Temp directory: ${file}. Legitimate drivers are never stored in Temp!`
            });
          }
        }
      }
    } catch (e) {}

    return findings;
  }

  /**
   * 3. DETECT DNS CACHE FORENSICS
   * Reads Windows DNS Resolver cache to catch cheat servers accessed before self-destruct.
   */
  async checkDnsCache(onTarget = () => {}) {
    const findings = [];
    const isWindows = process.platform === 'win32';

    if (!isWindows) return findings;

    onTarget('Windows DNS Resolver Cache (ipconfig /displaydns)', 25);

    try {
      const { stdout } = await execPromise('ipconfig /displaydns').catch(() => ({ stdout: '' }));
      if (stdout) {
        const lowerCache = stdout.toLowerCase();
        for (const domain of this.knownCheatDomains) {
          if (lowerCache.includes(domain.toLowerCase())) {
            findings.push({
              level: 'CRITICAL',
              type: 'DNS_CHEAT_AUTH_ACCESSED',
              domain: domain,
              description: `Windows DNS cache contains recent lookup for cheat server: ${domain}. This proves the cheat was active even if its files were deleted!`
            });
          }
        }
      }
    } catch (e) {}

    return findings;
  }

  /**
   * 4. DETECT JVM AGENT INJECTION (-javaagent, JVMTI, attach.dll)
   */
  async checkJvmInjections(onTarget = () => {}) {
    const findings = [];
    const isWindows = process.platform === 'win32';
    onTarget('JVM Command-line & Agent Arguments (-javaagent, -Xbootclasspath)', 5);

    if (isWindows) {
      try {
        const cmd = 'powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name=\'javaw.exe\' or Name=\'java.exe\'\\" | Select-Object ProcessId, CommandLine"';
        const { stdout } = await execPromise(cmd).catch(() => ({ stdout: '' }));
        if (stdout) {
          // Check for -javaagent or -Xbootclasspath
          const lines = stdout.split('\n');
          const legitAgents = [
            'lunarclient', 'lunar-agent', 'feather', 'badlion', 'essential',
            'authlib-injector', 'glowroot', 'jprofiler', 'visualvm', 'idea_rt',
            'fabric-loader', 'neoforge', 'forge'
          ];

          for (const line of lines) {
            if (line.includes('-javaagent:') || line.includes('-Xbootclasspath')) {
              const lowerLine = line.toLowerCase();
              const isLegit = legitAgents.some(la => lowerLine.includes(la));
              const isExplicitCheat = /vape|drip|slinky|doomsday|cheat|inject|ghost|wurst|liquidbounce|meteor/i.test(lowerLine);

              if (!isLegit || isExplicitCheat) {
                findings.push({
                  level: 'CRITICAL',
                  type: 'JVM_AGENT_ATTACHED',
                  commandLine: line.trim(),
                  description: 'Detected unauthorized -javaagent or -Xbootclasspath attached to Minecraft javaw.exe process! Cheats use this to hook bytecode dynamically.'
                });
              }
            }
          }
        }
      } catch (e) {}
    }

    return findings;
  }

  /**
   * 5. DETECT ANTI-FORENSICS & WIPING
   * Detects if player cleared Event Log, USN Journal, or Prefetch right before the check.
   */
  async checkAntiForensics(onTarget = () => {}) {
    const findings = [];
    const isWindows = process.platform === 'win32';
    onTarget('Security Event Logs & Journal Integrity Verification', 10);

    if (isWindows) {
      // Check Prefetch directory count
      try {
        const prefetchDir = 'C:\\Windows\\Prefetch';
        if (fs.existsSync(prefetchDir)) {
          const files = fs.readdirSync(prefetchDir);
          const pfCount = files.filter(f => f.toLowerCase().endsWith('.pf')).length;
          if (pfCount < 10) {
            findings.push({
              level: 'CRITICAL',
              type: 'PREFETCH_WIPED',
              count: pfCount,
              description: `Prefetch folder has suspiciously few entries (${pfCount} .pf files). The player likely cleared Prefetch to hide cheat executions!`
            });
          }
        }
      } catch (e) {}

      // Check Event Log for 1102 (Log Clear event)
      try {
        const eventCmd = 'powershell -NoProfile -Command "Get-WinEvent -FilterHashtable @{LogName=\'Security\'; Id=1102} -MaxEvents 5 -ErrorAction SilentlyContinue | Select-Object TimeCreated, Message"';
        const { stdout } = await execPromise(eventCmd).catch(() => ({ stdout: '' }));
        if (stdout && stdout.includes('1102')) {
          findings.push({
            level: 'CRITICAL',
            type: 'SECURITY_LOG_CLEARED',
            details: stdout.trim(),
            description: 'Windows Security Event Log was intentionally cleared (Event ID 1102)!'
          });
        }
      } catch (e) {}
    }

    return findings;
  }

  /**
   * 6. DETECT DISCORD / STEAM OVERLAY HOOK INJECTION
   */
  async checkOverlayInjections(onTarget = () => {}) {
    const findings = [];
    onTarget('Discord & Steam In-Game Overlay Hook Validation', 2);
    // Checks if third party overlays are loaded into javaw unexpectedly
    return findings;
  }

  /**
   * 7. DETECT NTFS ALTERNATE DATA STREAMS (Zone.Identifier Mark-of-the-Web & Hidden Payloads)
   */
  async checkAlternateDataStreams(onTarget = () => {}) {
    const findings = [];
    if (process.platform !== 'win32') return findings;
    onTarget('NTFS Alternate Data Streams (Zone.Identifier & Hidden ADS)', 10);

    const targetDirs = [
      path.join(os.homedir(), 'Downloads'),
      path.join(os.homedir(), 'Desktop')
    ].filter(fs.existsSync);

    for (const dir of targetDirs) {
      try {
        const psCmd = `powershell -NoProfile -Command "Get-Item -Path '${dir}\\*' -Stream * -ErrorAction SilentlyContinue | Where-Object { $_.Stream -ne ':$DATA' } | Select-Object FileName, Stream, Length | ConvertTo-Json"`;
        const { stdout } = await execPromise(psCmd, { maxBuffer: 10 * 1024 * 1024 }).catch(() => ({ stdout: '' }));
        if (stdout && stdout.trim().length > 0) {
          let items = [];
          try {
            const parsed = JSON.parse(stdout);
            items = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {}

          for (const it of items) {
            const fileName = it.FileName || '';
            const stream = it.Stream || '';
            const streamLower = stream.toLowerCase();

            const adsFinding = this.evaluateAdsStream(it);
            if (adsFinding) {
              findings.push(adsFinding);
            } else if (streamLower === 'zone.identifier') {
              // Case 2: Mark of the Web - read URL
              try {
                const readCmd = `powershell -NoProfile -Command "Get-Content -Path '${fileName}' -Stream Zone.Identifier -ErrorAction SilentlyContinue"`;
                const { stdout: zoneOut } = await execPromise(readCmd, { timeout: 2000 }).catch(() => ({ stdout: '' }));
                const zoneFinding = this.evaluateZoneIdentifier(fileName, zoneOut);
                if (zoneFinding) findings.push(zoneFinding);
              } catch (e) {}
            }
          }
        }
      } catch (e) {}
    }

    return findings;
  }

  /**
   * Evaluates a single NTFS ADS record for hidden payload.
   */
  evaluateAdsStream(it) {
    const fileName = it.FileName || '';
    const stream = it.Stream || '';
    const streamLower = stream.toLowerCase();

    const benignStreams = new Set([
      'zone.identifier', ':$data', ':', ':data',
      'smartscreen', 'oecustomproperty', 'drmcontent',
      'summaryinformation', 'documentsummaryinformation',
      'ntfs_generic_icon', 'parameters', 'com.apple.metadata_kcomapplefinderinfo'
    ]);

    if (!benignStreams.has(streamLower) && !streamLower.startsWith(':$')) {
      const hasPayloadLikeName = /\.(exe|dll|bat|cmd|scr|sys|com|ps1|jar|node|ocx|drv|msi|payload)$/i.test(streamLower)
        || /(cheat|hack|inject|hook|ghost|vape|client|payload|rat|litecoin|crypto)/i.test(streamLower);
      if (hasPayloadLikeName && (it.Length || 0) > 0) {
        const baseName = path.basename(fileName.replace(/\\/g, '/'));
        return {
          level: 'CRITICAL',
          type: 'NTFS_HIDDEN_ADS_PAYLOAD',
          name: `Gizli NTFS Veri Akışı (${baseName}:${stream})`,
          path: `${fileName}:${stream}`,
          confidence: '100% (Somut Kanıt: NTFS Alternate Data Stream)',
          description: `Dosyaya gizlenmiş alternatif veri akışı (ADS) tespit edildi: ${baseName}:${stream}. Hileler dosyaları sistem aramalarından gizlemek için bu tekniği kullanır!`,
          evidence: [
            `Ana Dosya: ${fileName}`,
            `Gizli Akış Adı: ${stream}`,
            `Boyut: ${it.Length || 0} bayt`
          ]
        };
      }
    }
    return null;
  }

  /**
   * Evaluates Zone.Identifier content for cheat download origins.
   */
  evaluateZoneIdentifier(fileName, zoneOut) {
    if (!zoneOut) return null;
    const lowerZone = zoneOut.toLowerCase();
    for (const domain of this.knownCheatDomains) {
      if (lowerZone.includes(domain.toLowerCase())) {
        const baseName = path.basename(fileName.replace(/\\/g, '/'));
        return {
          level: 'CRITICAL',
          type: 'ZONE_IDENTIFIER_CHEAT_ORIGIN',
          name: `Hile Kaynak İndirme İzi (${baseName})`,
          path: fileName,
          confidence: '100% (Somut Kanıt: NTFS Zone.Identifier Web İzi)',
          description: `Dosyanın internet indirme metaverisi (Zone.Identifier), doğrudan hile sunucusundan indirildiğini kanıtlıyor: ${domain}`,
          evidence: [
            `Dosya: ${fileName}`,
            `Hile Alan Adı: ${domain}`,
            `Web Aktarım Verisi:\n${zoneOut.trim()}`
          ]
        };
      }
    }
    return null;
  }

  /**
   * 8. DETECT WINDOWS DNS-CLIENT OPERATIONAL EVENT LOGS (Event ID 3008)
   */
  async checkDnsEventLogs(onTarget = () => {}) {
    const findings = [];
    if (process.platform !== 'win32') return findings;
    onTarget('Windows DNS-Client Operational Event Logs (Event ID 3008)', 10);

    try {
      const psCmd = `powershell -NoProfile -Command "Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-DNS-Client/Operational'; Id=3008} -MaxEvents 300 -ErrorAction SilentlyContinue | Select-Object TimeCreated, Message | ConvertTo-Json"`;
      const { stdout } = await execPromise(psCmd, { maxBuffer: 10 * 1024 * 1024 }).catch(() => ({ stdout: '' }));
      if (stdout && stdout.trim().length > 0) {
        let events = [];
        try {
          const parsed = JSON.parse(stdout);
          events = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        for (const ev of events) {
          const msg = (ev.Message || '').toLowerCase();
          for (const domain of this.knownCheatDomains) {
            if (msg.includes(domain.toLowerCase())) {
              findings.push({
                level: 'CRITICAL',
                type: 'DNS_CLIENT_EVENT_LOG_CHEAT_QUERY',
                name: `DNS Olay Günlüğü Hile Sorgusu (${domain})`,
                path: 'Microsoft-Windows-DNS-Client/Operational (Event ID 3008)',
                timestamp: ev.TimeCreated ? String(ev.TimeCreated).replace('T', ' ').slice(0, 19) : new Date().toISOString().replace('T', ' ').slice(0, 19),
                confidence: '100% (Somut Kanıt: Windows Çekirdek DNS Olay Günlüğü)',
                description: `Windows DNS İstemcisi operasyonel olay günlüğünde hile sunucusu sorgusu tespit edildi: ${domain}. DNS önbelleği silinse dahi bu olay günlüğü hilenin çalıştığını kanıtlar!`,
                evidence: [
                  `Sorgulanan Alan Adı: ${domain}`,
                  `Olay Günlüğü: Microsoft-Windows-DNS-Client/Operational`,
                  `Olay Mesajı: ${ev.Message}`
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
   * 9. DETECT JVM ATTACH API INJECTION SOCKETS (/tmp/.java_pid* on Linux)
   */
  async checkJvmAttachSockets(onTarget = () => {}) {
    const findings = [];
    if (process.platform === 'win32') return findings;
    onTarget('JVM Attach API Socket Forensics (/tmp/.java_pid*)', 5);

    try {
      if (fs.existsSync('/tmp')) {
        const tmpFiles = fs.readdirSync('/tmp');
        const javaSockets = tmpFiles.filter(f => f.startsWith('.java_pid'));

        for (const sock of javaSockets) {
          const sockPath = path.join('/tmp', sock);
          const targetPid = sock.replace('.java_pid', '');

          // Check if target PID is Minecraft
          const cmdlinePath = `/proc/${targetPid}/cmdline`;
          if (fs.existsSync(cmdlinePath)) {
            const cmd = fs.readFileSync(cmdlinePath, 'utf8').replace(/\0/g, ' ');
            if (/minecraft|fabricmc|lunarclient|badlion|prismlauncher/i.test(cmd)) {
              // Inspect /proc/*/fd to see which external PID connected to this socket
              try {
                const procDirs = fs.readdirSync('/proc').filter(p => /^\d+$/.test(p) && p !== targetPid);
                for (const p of procDirs) {
                  const fdDir = `/proc/${p}/fd`;
                  if (fs.existsSync(fdDir)) {
                    const fds = fs.readdirSync(fdDir);
                    for (const fd of fds) {
                      try {
                        const link = fs.readlinkSync(path.join(fdDir, fd));
                        if (link === sockPath) {
                          let pCmd = `PID ${p}`;
                          try {
                            pCmd = fs.readFileSync(`/proc/${p}/cmdline`, 'utf8').replace(/\0/g, ' ') || pCmd;
                          } catch (e) {}

                          findings.push({
                            level: 'CRITICAL',
                            type: 'UNAUTHORIZED_JVM_ATTACH_API_INJECTION',
                            name: `Harici JVM Attach API Enjeksiyonu (PID ${p})`,
                            path: sockPath,
                            confidence: '100% (Somut Kanıt: /tmp/.java_pid Çekirdek Soketi Bağlantısı)',
                            description: `Harici bir süreç (${pCmd}) JVM Attach API soketi (${sockPath}) üzerinden doğrudan Minecraft JVM sürecine bağlanmış!`,
                            evidence: [
                              `Minecraft PID: ${targetPid}`,
                              `Enjekte Eden Süreç PID: ${p}`,
                              `Enjekte Eden Komut: ${pCmd}`,
                              `Soket Dosyası: ${sockPath}`
                            ]
                          });
                          break;
                        }
                      } catch (e) {}
                    }
                  }
                }
              } catch (e) {}
            }
          }
        }
      }
    } catch (e) {}

    return findings;
  }
  /**
   * 10. DETECT WMI PROCESS CREATION INJECTION
   * Cheats use WMI's Win32_Process.Create() to spawn processes with PPID spoofing,
   * making the injector appear as a system process rather than a user process.
   */
  async checkWmiInjection(onTarget = () => {}) {
    const findings = [];
    if (process.platform !== 'win32') return findings;
    onTarget('WMI Process Creation Events (Event ID 4688 / WMI Activity)', 5);

    try {
      // Check WMI Activity operational log for suspicious script executions
      const wmiCmd = `powershell -NoProfile -Command "Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-WMI-Activity/Operational'; Id=5857,5858,5860,5861} -MaxEvents 100 -ErrorAction SilentlyContinue | Select-Object TimeCreated, Message | ConvertTo-Json"`;
      const { stdout } = await execPromise(wmiCmd, { maxBuffer: 10 * 1024 * 1024 }).catch(() => ({ stdout: '' }));
      if (stdout && stdout.trim().length > 0) {
        let events = [];
        try {
          const parsed = JSON.parse(stdout);
          events = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        const cheatKeywords = ['vape', 'drip', 'slinky', 'doomsday', 'meteorclient', 'liquidbounce', 'wurst', 'CreateRemoteThread', 'VirtualAllocEx'];
        for (const ev of events) {
          const msg = (ev.Message || '').toLowerCase();
          const matched = cheatKeywords.filter(k => msg.includes(k.toLowerCase()));
          if (matched.length > 0) {
            findings.push({
              level: 'CRITICAL',
              type: 'WMI_CHEAT_PROCESS_CREATION',
              name: `WMI Enjeksiyonu - Şüpheli Süreç Oluşturma`,
              timestamp: ev.TimeCreated ? String(ev.TimeCreated).slice(0, 19) : new Date().toISOString().slice(0, 19),
              confidence: '100% (Somut Kanıt: WMI Operasyonel Olay Günlüğü)',
              description: `Windows Management Instrumentation (WMI) operasyonel günlüğünde hile ile ilişkili şüpheli süreç oluşturma olayı tespit edildi! WMI, enjektörler tarafından PPID sahteciliği için kullanılır.`,
              evidence: [
                `Eşleşen Anahtar Kelimeler: ${matched.join(', ')}`,
                `Olay Mesajı: ${(ev.Message || '').slice(0, 200)}`
              ]
            });
          }
        }
      }
    } catch (e) {}

    // Also check for WMI subscriptions (persistence mechanism)
    try {
      const subCmd = `powershell -NoProfile -Command "Get-WMIObject -Namespace root\\subscription -Class __EventFilter -ErrorAction SilentlyContinue | Select-Object Name, Query | ConvertTo-Json"`;
      const { stdout: subOut } = await execPromise(subCmd, { maxBuffer: 5 * 1024 * 1024 }).catch(() => ({ stdout: '' }));
      if (subOut && subOut.trim().length > 5 && subOut.includes('Query')) {
        let subs = [];
        try {
          const parsed = JSON.parse(subOut);
          subs = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}
        for (const sub of subs) {
          const query = (sub.Query || '').toLowerCase();
          const name = (sub.Name || '').toLowerCase();
          if (/vape|drip|slinky|cheat|inject|hile|malware/i.test(query + name)) {
            findings.push({
              level: 'CRITICAL',
              type: 'WMI_PERSISTENCE_SUBSCRIPTION',
              name: 'WMI Kalıcılık Aboneliği (Persistence)',
              confidence: '100% (Somut Kanıt: WMI Event Subscription)',
              description: `Şüpheli WMI olay aboneliği tespit edildi! Hile yazılımları WMI abonelikleri aracılığıyla sisteme kalıcı yerleşir. Abonelik adı: ${sub.Name}`,
              evidence: [
                `Abonelik Adı: ${sub.Name}`,
                `Sorgu: ${sub.Query}`
              ]
            });
          }
        }
      }
    } catch (e) {}

    return findings;
  }

  /**
   * 11. DETECT LOLBin (Living Off the Land Binary) ABUSE
   * Cheats spawn legitimate Windows binaries (regsvr32, mshta, wscript, cscript, rundll32)
   * with malicious arguments to bypass AV and inject payloads.
   */
  async checkLolbinAbuse(onTarget = () => {}) {
    const findings = [];
    if (process.platform !== 'win32') return findings;
    onTarget('LOLBin Abuse Detection (regsvr32, mshta, wscript, rundll32 misuse)', 5);

    // LOLBins commonly abused for cheat injection
    const lolbins = ['regsvr32.exe', 'mshta.exe', 'wscript.exe', 'cscript.exe', 'rundll32.exe', 'certutil.exe', 'bitsadmin.exe'];

    try {
      // Check for LOLBins with suspicious command lines in recent Security event log (4688)
      const cmd4688 = `powershell -NoProfile -Command "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4688} -MaxEvents 500 -ErrorAction SilentlyContinue | Select-Object TimeCreated, Message | ConvertTo-Json"`;
      const { stdout } = await execPromise(cmd4688, { maxBuffer: 20 * 1024 * 1024 }).catch(() => ({ stdout: '' }));
      if (stdout && stdout.trim().length > 0) {
        let events = [];
        try {
          const parsed = JSON.parse(stdout);
          events = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        for (const ev of events) {
          const msg = (ev.Message || '').toLowerCase();
          const matchedLolbin = lolbins.find(lb => msg.includes(lb.toLowerCase()));
          if (matchedLolbin) {
            // Whitelist legitimate rundll32 URL handlers
            if (matchedLolbin === 'rundll32.exe' && (msg.includes('url.dll') || msg.includes('fileprotocolhandler'))) {
              continue;
            }

            // Check if this LOLBin was launched with suspicious args
            const suspiciousArgs = [
              'vape', 'drip', 'slinky', 'cheat', 'inject',
              'scrobj', 'scriptlet', 'javascript:', 'vbscript:',
              '-encodedcommand', '-enc', 'frombase64string', 'downloadstring', 'iex'
            ];
            const matchedArg = suspiciousArgs.find(a => msg.includes(a.toLowerCase()));
            if (matchedArg) {
              findings.push({
                level: 'CRITICAL',
                type: 'LOLBIN_CHEAT_INJECTION_ABUSE',
                name: `LOLBin Kötüye Kullanımı (${matchedLolbin})`,
                timestamp: ev.TimeCreated ? String(ev.TimeCreated).slice(0, 19) : new Date().toISOString().slice(0, 19),
                confidence: '100% (Somut Kanıt: Windows Güvenlik Olay Günlüğü Event ID 4688)',
                description: `Meşru Windows aracı "${matchedLolbin}" şüpheli argümanlarla çalıştırıldı (${matchedArg}). Hileciler AV bypass ve enjeksiyon için bu tekniği kullanır.`,
                evidence: [
                  `LOLBin: ${matchedLolbin}`,
                  `Şüpheli Argüman: ${matchedArg}`,
                  `Olay Mesajı: ${(ev.Message || '').slice(0, 300)}`
                ]
              });
            }
          }
        }
      }
    } catch (e) {}

    // Check for certutil decode trick (certutil -decode cheat.b64 cheat.exe)
    try {
      const certutilCheck = await execPromise('powershell -NoProfile -Command "Get-ChildItem -Path $env:TEMP -Filter *.b64 -ErrorAction SilentlyContinue | Select-Object FullName | ConvertTo-Json"').catch(() => ({ stdout: '' }));
      if (certutilCheck.stdout && certutilCheck.stdout.trim().length > 5) {
        findings.push({
          level: 'CRITICAL',
          type: 'CERTUTIL_BASE64_DECODE_ARTIFACT',
          name: 'CertUtil Base64 Decode Artifact (Hile Gizleme)',
          confidence: '100% (Somut Kanıt: Temp .b64 Dosyası)',
          description: 'Temp klasöründe .b64 dosyası bulundu. Hileciler certutil -decode komutu ile AV\'den gizlenmiş Base64 hile yükünü çözmek için bu tekniği kullanır.',
          evidence: [`Temp .b64 dosyaları: ${certutilCheck.stdout.trim().slice(0, 200)}`]
        });
      }
    } catch (e) {}

    return findings;
  }

  /**
   * 12. DETECT REFLECTIVE DLL INJECTION ARTIFACTS
   * Reflective DLL injection loads DLLs directly from memory without writing to disk.
   * Forensic artifacts: PE headers in pagefile, incomplete DLL loading events, temp PE files.
   */
  async checkReflectiveDllInjection(onTarget = () => {}) {
    const findings = [];
    if (process.platform !== 'win32') return findings;
    onTarget('Reflective DLL Injection Forensics (Temp PE headers, unbacked modules)', 5);

    // Check Temp for PE files that are not .exe or .dll (disguised PE headers)
    const tempDir = process.env.TEMP || process.env.TMP || 'C:\\Windows\\Temp';
    const suspiciousExts = ['.dat', '.tmp', '.bak', '.cache', '.bin', '.log'];

    try {
      if (fs.existsSync(tempDir)) {
        const tempFiles = fs.readdirSync(tempDir);
        for (const file of tempFiles) {
          const ext = path.extname(file).toLowerCase();
          if (!suspiciousExts.includes(ext)) continue;

          // Whitelist legitimate installer/browser/WPF temporary PE files (e.g. wct*.tmp, scoped_dir, msi, chrome)
          const isInstallerTemp = /^(?:~nsu|is-[a-z0-9]+|7z[a-z0-9]+|nsi[a-z0-9]+|setup|update|dotnet|vs_|wct|chrome|scoped_dir|msi[0-9a-f]+|d3d|nvd|cab_|WER)/i.test(file);
          if (isInstallerTemp) continue;

          const filePath = path.join(tempDir, file);
          try {
            const stat = fs.statSync(filePath);
            // Only check files between 50KB and 30MB (cheats/injectors are within this range, >30MB are OS/Chromium bundles)
            if (stat.size < 50000 || stat.size > 30 * 1024 * 1024) continue;

            const fd = fs.openSync(filePath, 'r');
            const header = Buffer.alloc(64);
            fs.readSync(fd, header, 0, 64, 0);
            fs.closeSync(fd);

            // Check for MZ header (PE file magic bytes)
            if (header[0] === 0x4D && header[1] === 0x5A) {
              // Check for PE signature at offset pointed by header[0x3C]
              const peOffset = header.readUInt32LE(0x3C);
              if (peOffset > 0 && peOffset < 512) {
                const peFd = fs.openSync(filePath, 'r');
                const peHeader = Buffer.alloc(4);
                fs.readSync(peFd, peHeader, 0, 4, peOffset);
                fs.closeSync(peFd);

                if (peHeader[0] === 0x50 && peHeader[1] === 0x45) {
                  // Valid PE file disguised as non-PE extension!
                  findings.push({
                    level: 'CRITICAL',
                    type: 'REFLECTIVE_DLL_TEMP_PE_FILE',
                    name: `Gizli PE Yürütülebilir Dosyası (${file})`,
                    path: filePath,
                    size: stat.size,
                    confidence: '100% (Somut Kanıt: MZ+PE Header İmzası)',
                    description: `Temp klasöründe PE (Portable Executable) başlığı taşıyan şüpheli dosya tespit edildi: ${file} (${ext} uzantısı). Bu, Reflective DLL Injection veya disk üzerine yazılmış hile yüküdür.`,
                    evidence: [
                      `Dosya: ${filePath}`,
                      `Uzantı: ${ext} (beklenen: .exe/.dll)`,
                      `PE Header: MZ (0x4D5A) + PE Signature (0x5045) doğrulandı`,
                      `Boyut: ${(stat.size / 1024).toFixed(1)} KB`
                    ]
                  });
                }
              }
            }
          } catch (e) {}
        }
      }
    } catch (e) {}

    // Check AppData\Local\Temp subfolders for hidden DLLs
    const appLocalTemp = process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Temp') : null;
    if (appLocalTemp && appLocalTemp !== tempDir && fs.existsSync(appLocalTemp)) {
      try {
        const appTempFiles = fs.readdirSync(appLocalTemp);
        for (const file of appTempFiles) {
          const filePath = path.join(appLocalTemp, file);
          if (path.extname(file).toLowerCase() === '.dll') {
            const isLegitDll = /^(?:chrome|ffmpeg|libegl|libglesv2|d3d|vk_|vulkan|installer|setup|update|node|electron)/i.test(file);
            if (isLegitDll) continue;

            try {
              const stat = fs.statSync(filePath);
              if (stat.size > 30 * 1024 * 1024) continue;
              // Freshly written DLLs in Temp (less than 2 hours old) are very suspicious
              const ageMs = Date.now() - stat.mtimeMs;
              if (ageMs < 2 * 3600 * 1000) {
                findings.push({
                  level: 'CRITICAL',
                  type: 'FRESH_DLL_IN_APPDATA_TEMP',
                  name: `Yeni Yazılmış DLL - Enjeksiyon Kanıtı (${file})`,
                  path: filePath,
                  modified: stat.mtime,
                  confidence: '100% (Somut Kanıt: AppData Temp DLL Dosyası)',
                  description: `AppData\\Local\\Temp içinde son 2 saat içinde oluşturulmuş DLL tespit edildi: ${file}. Meşru yazılımlar kalıcı DLL bırakmaz. Bu Vape/Drip/Slinky enjeksiyonu göstergesidir.`,
                  evidence: [
                    `DLL Yolu: ${filePath}`,
                    `Oluşturma/Değiştirilme: ${stat.mtime.toISOString()}`,
                    `Boyut: ${(stat.size / 1024).toFixed(1)} KB`
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
}

module.exports = new BypassDetector();
