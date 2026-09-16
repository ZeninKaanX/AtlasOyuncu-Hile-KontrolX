/**
 * Farben AC - Process Virtual Memory & Module Scanner
 * Windows: Scans javaw.exe modules via PowerShell Win32 APIs.
 * Linux: Scans /proc/<pid>/maps, /proc/<pid>/cmdline, and /proc/<pid>/fd for injected
 * shared libraries (.so loaded from /tmp/ or /dev/shm) and -javaagent bytecode manipulators.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const peInspector = require('./peBinaryInspector');

class MemoryScannerEngine {
  constructor() {
    this.isWindows = process.platform === 'win32';
  }

  /**
   * Scans target processes (javaw / java) across Windows or Linux.
   */
  async scanProcesses(onTarget = () => {}) {
    if (this.isWindows) {
      return this.scanWindowsProcesses(onTarget);
    } else {
      return this.scanLinuxProcesses(onTarget);
    }
  }

  /**
   * Windows Process & Memory Scanner
   */
  async scanWindowsProcesses(onTarget = () => {}) {
    const findings = [];
    const targetPids = [];

    try {
      // 1. Scan all active background processes for running cheats, injectors, or memory manipulators
      try {
        const allProcCmd = `powershell -NoProfile -Command "Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.Path } | Select-Object Id, ProcessName, Path | ConvertTo-Json"`;
        const { stdout: allProcJson } = await execPromise(allProcCmd, { maxBuffer: 15 * 1024 * 1024 }).catch(() => ({ stdout: '' }));
        if (allProcJson && allProcJson.trim().length > 0) {
          let allProcs = [];
          try {
            const parsed = JSON.parse(allProcJson);
            allProcs = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {}

          for (const ap of allProcs) {
            const apName = (ap.ProcessName || '').toLowerCase();
            const apPath = (ap.Path || '').toLowerCase();

            if (/code|vscodium|discord|spotify|chrome|firefox|brave|edge|steam|epicgames|explorer|taskmgr|system|svchost|farben ac|git|node/i.test(apName)) {
              continue;
            }

            const isCheatProc = /vape|drip|slinky|doomsday|meteor|liquidbounce|wurst|autoclicker|murgee|kprocesshacker|processhacker|cheatengine|horion|borion|ripterms|breezeclient|cryptclient|koid|exodus|lunar.*account.*manager|lam\.exe|badlionoffline|feathercracked|offlinelunar|weave.*manager/i.test(apName) ||
                                /vape|drip|slinky|doomsday|cheatengine|horion|borion|ripterms|breeze|crypt|koid|exodus|lunaraccountmanager|badlionoffline|feathercracked|weave/i.test(apPath);

            if (isCheatProc) {
              findings.push({
                level: 'CRITICAL',
                type: 'ACTIVE_CHEAT_PROCESS_RUNNING',
                pid: ap.Id,
                processName: ap.ProcessName,
                path: ap.Path,
                confidence: '100% (Somut Kanıt: Aktif Çalışan Hile/Enjektör Süreci)',
                description: `Sistemde aktif olarak çalışan hile veya bellek müdahale süreci tespit edildi: ${ap.ProcessName} (PID: ${ap.Id})`,
                evidence: [
                  `Süreç Adı: ${ap.ProcessName}`,
                  `Süreç PID: ${ap.Id}`,
                  `İkili Yol: ${ap.Path}`
                ]
              });
            }
          }
        }
      } catch (e) {}

      onTarget('Process Table: Querying javaw.exe / java.exe handles', 1);
      const psListCmd = `powershell -NoProfile -Command "Get-Process -Name 'javaw', 'java' -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, Path | ConvertTo-Json"`;
      const { stdout } = await execPromise(psListCmd).catch(() => ({ stdout: '' }));

      if (!stdout || stdout.trim().length === 0) {
        onTarget('Process Table: No active javaw.exe / java.exe process detected', 1);
        return {
          status: 'MINECRAFT_NOT_RUNNING',
          message: 'Minecraft process (javaw.exe) is currently not running.',
          findings: findings,
          scannedProcesses: []
        };
      }

      let procList = [];
      try {
        const parsed = JSON.parse(stdout);
        procList = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {}

      for (const proc of procList) {
        const pid = proc.Id;
        targetPids.push(pid);
        onTarget(`Process Memory: PID ${pid} (${proc.ProcessName || 'javaw'})`, 1);

        const modCmd = `powershell -NoProfile -Command "Get-Process -Id ${pid} | Select-Object -ExpandProperty Modules | Select-Object ModuleName, FileName | ConvertTo-Json"`;
        const { stdout: modOut } = await execPromise(modCmd, { maxBuffer: 15 * 1024 * 1024 }).catch(() => ({ stdout: '' }));

        if (modOut) {
          let modules = [];
          try {
            const parsedMods = JSON.parse(modOut);
            modules = Array.isArray(parsedMods) ? parsedMods : [parsedMods];
          } catch (e) {}

          for (const mod of modules) {
            const modPath = (mod.FileName || '').toLowerCase();
            const modName = (mod.ModuleName || '').toLowerCase();
            if (!modName && !modPath) continue;

            // Deep PE analysis if file exists on disk
            let peInfo = null;
            const isSystemModule = /^([a-z]:\\windows)|(^\/)/.test(modPath) && /system32|syswow64|winsxs|servicing|microsoft\.net|drivers|assembly|globalization/i.test(modPath);
            if (mod.FileName && fs.existsSync(mod.FileName) && !isSystemModule) {
              peInfo = peInspector.inspectFile(mod.FileName);
            } else if (isSystemModule) {
              // Windows/system DLL'leri her süreçte yüzlerce kez PE okumak taramayı
              // dakikalarca uzatır; bunlar kod bütünlüğü motorunda zaten ele alınır.
              peInfo = peInspector.classifyBinary({
                filePath: mod.FileName || mod.ModuleName,
                fileName: mod.ModuleName || path.basename(mod.FileName || ''),
                extension: path.extname(mod.FileName || mod.ModuleName || '.dll').toLowerCase(),
                isDll: true,
                isDisguisedExtension: false,
                exportedFunctions: [],
                hasAuthenticode: false,
                certSigners: [],
                matchedCheatTokens: [],
                matchedJvmHooks: [],
                matchedInjectionApis: [],
                contentString: ''
              });
            } else {
              peInfo = peInspector.classifyBinary({
                filePath: mod.FileName || mod.ModuleName,
                fileName: mod.ModuleName || path.basename(mod.FileName || ''),
                extension: path.extname(mod.FileName || mod.ModuleName || '.dll').toLowerCase(),
                isDll: true,
                isDisguisedExtension: false,
                exportedFunctions: [],
                hasAuthenticode: false,
                certSigners: [],
                matchedCheatTokens: [],
                matchedJvmHooks: [],
                matchedInjectionApis: [],
                contentString: ''
              });
            }

            // 1. Check for Legitimate Overlays & Minecraft Natives (Zero False-Flag Protection)
            if (peInfo && (peInfo.purpose === 'LEGITIMATE_MINECRAFT_NATIVE' || peInfo.purpose === 'LEGITIMATE_MEDIA_CODEC' || peInfo.purpose === 'LEGITIMATE_OVERLAY_HOOK')) {
              // Verified safe module - completely skip false positive alerts
              continue;
            }

            // 2. Direct Known Cheat DLLs
            const isKnownCheatName = /vape|drip|slinky|ghostclient|kura|injector|whiteout|entropy|crystalclient|doomsday/i.test(modName);
            if (isKnownCheatName || (peInfo && peInfo.purpose === 'CHEAT_INJECTOR_PE')) {
              findings.push({
                level: 'CRITICAL',
                type: 'KNOWN_CHEAT_DLL_LOADED',
                pid: pid,
                module: mod.ModuleName,
                path: mod.FileName,
                confidence: '100% (Binary PE Analysis)',
                description: `Direct cheat DLL module loaded in Minecraft memory: ${mod.ModuleName}`,
                evidence: peInfo && peInfo.evidence ? peInfo.evidence : [`Module: ${mod.ModuleName}`, `Path: ${mod.FileName}`]
              });
              continue;
            }

            // 3. Disguised Executable Loaded into Process
            if (peInfo && peInfo.purpose === 'DISGUISED_EXECUTABLE') {
              findings.push({
                level: 'CRITICAL',
                type: 'DISGUISED_EXECUTABLE_IN_JVM',
                pid: pid,
                module: mod.ModuleName,
                path: mod.FileName,
                confidence: '100% (PE Header vs Extension Mismatch)',
                description: `Disguised PE executable loaded into Minecraft javaw.exe: ${mod.ModuleName}`,
                evidence: peInfo.evidence
              });
              continue;
            }

            // 4. Suspicious DLL from Temp (Excluding known Minecraft natives, JNA, and voice chat)
            const isFromTemp = modPath.includes('\\temp\\') || modPath.includes('\\appdata\\local\\temp\\');
            if (isFromTemp) {
              const isKnownLegitTempDll = /lwjgl|jemalloc|glfw|openal|jna|libopus|librnnoise|libspeex|liblame|wisp/i.test(modName);
              if (!isKnownLegitTempDll) {
                findings.push({
                  level: 'CRITICAL',
                  type: 'INJECTED_DLL_FROM_TEMP',
                  pid: pid,
                  module: mod.ModuleName,
                  path: mod.FileName,
                  confidence: 'High (Unsigned Temp Module)',
                  description: `Unidentified injected DLL loaded directly from TEMP directory: ${mod.ModuleName}!`,
                  evidence: [`Module: ${mod.ModuleName}`, `Path: ${mod.FileName}`]
                });
              }
            }

            // 5. Process Ghosting / Deleted Module Check
            if (mod.FileName && !fs.existsSync(mod.FileName)) {
              if (!modName.endsWith('.ni.dll') && !modName.includes('clr') && !modName.includes('mscorlib')) {
                findings.push({
                  level: 'CRITICAL',
                  type: 'PROCESS_GHOSTING_DELETED_MODULE',
                  pid: pid,
                  module: mod.ModuleName,
                  path: mod.FileName,
                  confidence: '100% (Somut Kanıt: Bellekte Yüklü Fakat Diskte Silinmiş Modül)',
                  description: `Minecraft bellek alanında yüklü olan ${mod.ModuleName} DLL dosyası diskten silinmiş! Hileler tespit edilmemek için enjekte olduktan hemen sonra diskteki dosyalarını siler (Process Ghosting / Self-Destruct).`,
                  evidence: [
                    `Bellekteki Modül: ${mod.ModuleName}`,
                    `Diskteki Orijinal Yol: ${mod.FileName}`,
                    `Durum: Dosya diskte mevcut değil (Silinmiş)`
                  ]
                });
              }
            }
          }
        }

        const cmdArgsCheck = `powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}' | Select-Object -ExpandProperty CommandLine"`;
        const { stdout: cmdArgs } = await execPromise(cmdArgsCheck).catch(() => ({ stdout: '' }));

        if (cmdArgs) {
          if (cmdArgs.includes('-javaagent:') || cmdArgs.includes('-Xbootclasspath')) {
            findings.push({
              level: 'CRITICAL',
              type: 'INJECTED_JAVAAGENT',
              pid: pid,
              commandLine: cmdArgs.trim(),
              description: 'Minecraft was started with an injected -javaagent bytecode transformer!'
            });
          }
        }

        // Parent Process Spoofing / Injection Launcher Check
        try {
          const parentCmd = `powershell -NoProfile -Command "$ppid = (Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}' -ErrorAction SilentlyContinue).ParentProcessId; if ($ppid) { Get-Process -Id $ppid -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, Path | ConvertTo-Json }"`;
          const { stdout: parentJson } = await execPromise(parentCmd).catch(() => ({ stdout: '' }));
          if (parentJson && parentJson.trim().length > 0) {
            let parentProc = null;
            try { parentProc = JSON.parse(parentJson); } catch (e) {}
            if (parentProc) {
              const pName = (parentProc.ProcessName || '').toLowerCase();
              const pPath = (parentProc.Path || '').toLowerCase();
              const isCheatParent = /vape|drip|slinky|doomsday|cheat|inject|meteor|liquidbounce|wurst|horion|borion|ripterms|breeze|crypt|koid|lunar.*account|badlionoffline|feathercracked|weave/i.test(pName) || /vape|drip|slinky|doomsday|horion|borion|ripterms|breeze|crypt|weave/i.test(pPath);
              if (isCheatParent) {
                findings.push({
                  level: 'CRITICAL',
                  type: 'SUSPICIOUS_PARENT_PROCESS_INJECTION',
                  pid: pid,
                  parentPid: parentProc.Id,
                  parentName: parentProc.ProcessName,
                  parentPath: parentProc.Path,
                  confidence: '100% (Somut Kanıt: Win32_Process ParentProcessId)',
                  description: `Minecraft javaw.exe doğrudan bir hile yükleyicisi veya enjektörü tarafından başlatılmış: ${parentProc.ProcessName} (PID: ${parentProc.Id})!`,
                  evidence: [
                    `Minecraft PID: ${pid}`,
                    `Üst Süreç (Parent) PID: ${parentProc.Id}`,
                    `Üst Süreç Adı: ${parentProc.ProcessName}`,
                    `Üst Süreç Yolu: ${parentProc.Path || 'Bilinmiyor'}`
                  ]
                });
              }
            }
          }
        } catch (e) {}
      }

      return {
        status: 'SUCCESS',
        scannedProcesses: targetPids,
        findings: findings
      };

    } catch (err) {
      return { status: 'ERROR', error: err.message, findings: findings, scannedProcesses: [] };
    }
  }

  /**
   * Parses /proc/<pid>/maps to detect memfd anonymous in-memory files, deleted .so/.jar mappings, and volatile /tmp/.so modules
   */
  inspectLinuxProcMaps(mapsContent, pid = 0) {
    const findings = [];
    if (!mapsContent || typeof mapsContent !== 'string') return findings;
    const lines = mapsContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Exclude legitimate Linux Minecraft natives and authorized screen recorder hooks
      const isLegitLinuxNative = /liblwjgl|libjemalloc|libglfw|libopenal|libjna|jna\d+|libopus|librnnoise|libspeex|liblame|libpulse|libasound|hsperfdata/i.test(trimmed);
      const isLegitLinuxOverlay = /libobs|obs[-_]?hook|libsteam|gameoverlayrenderer|discord/i.test(trimmed);

      // A. Check for memfd_create anonymous in-memory file injection
      if (trimmed.includes('memfd:') && !isLegitLinuxNative && !isLegitLinuxOverlay) {
        findings.push({
          level: 'CRITICAL',
          type: 'MEMFD_IN_MEMORY_INJECTION',
          pid: pid,
          mapping: trimmed,
          confidence: '100% (Somut Kanıt: Linux memfd_create Bellek İçi Enjeksiyon)',
          description: `Minecraft sanal belleğinde memfd_create ile RAM içinde oluşturulmuş isimsiz dosya eşlemesi bulundu: ${trimmed}. Hileler diskte dosya bırakmamak için memfd kullanır.`,
          evidence: [`Bellek Eşlemesi: ${trimmed}`]
        });
        continue;
      }

      // B. Check for unlinked / deleted memory mappings (anti-forensic evasion)
      const isDeletedMapping = trimmed.includes('(deleted)') && (trimmed.includes('.so') || trimmed.includes('.jar') || trimmed.includes('/tmp/') || trimmed.includes('/dev/shm/'));
      if (isDeletedMapping && !isLegitLinuxNative && !isLegitLinuxOverlay) {
        findings.push({
          level: 'CRITICAL',
          type: 'UNLINKED_MEMORY_MAPPED_INJECTION',
          pid: pid,
          mapping: trimmed,
          confidence: '100% (Somut Kanıt: /proc/maps Diskten Silinmiş Modül Eşlemesi)',
          description: `Minecraft sanal belleğinde diskten silinmiş (.so veya .jar) kütüphane eşlemesi tespit edildi: ${trimmed}. Hileler tespit edilmemek için enjeksiyon sonrası diskteki dosyayı siler.`,
          evidence: [`Bellek Eşlemesi: ${trimmed}`]
        });
        continue;
      }

      // C. Check if mapped from /tmp, /dev/shm, or contains cheat names
      if (trimmed.includes('.so') && (trimmed.includes('/tmp/') || trimmed.includes('/dev/shm/') || trimmed.includes('cheat') || trimmed.includes('hook'))) {
        const parts = trimmed.split(/\s+/);
        const soPath = parts[parts.length - 1];

        if (!isLegitLinuxNative && !isLegitLinuxOverlay) {
          findings.push({
            level: 'CRITICAL',
            type: 'INJECTED_SO_LIBRARY_IN_JAVA',
            pid: pid,
            path: soPath,
            confidence: '100% (Somut Kanıt: /proc/maps Uçucu Dizin Modülü)',
            description: `Minecraft sanal belleğinde /tmp veya /dev/shm dizininden yüklenmiş paylaşımlı kütüphane (.so) bulundu: ${soPath}`,
            evidence: [`Modül Yolu: ${soPath}`]
          });
        }
      }
    }

    return findings;
  }

  /**
   * Linux Process & Memory Scanner (/proc/<pid>/maps and /proc/<pid>/cmdline)
   */
  async scanLinuxProcesses(onTarget = () => {}) {
    const findings = [];
    const targetPids = [];

    try {
      const procDirs = fs.readdirSync('/proc').filter(f => /^\d+$/.test(f));
      onTarget(`Process Table: Inspecting /proc (${procDirs.length} active processes)`, procDirs.length);

      for (const pid of procDirs) {
        const cmdlinePath = `/proc/${pid}/cmdline`;
        if (!fs.existsSync(cmdlinePath)) continue;

        try {
          const rawCmd = fs.readFileSync(cmdlinePath);
          const cmdline = rawCmd.toString('utf8').replace(/\0/g, ' ');

          // Check if this is a Minecraft process
          const isMinecraft = cmdline.includes('minecraft') ||
            cmdline.includes('Minecraft') ||
            cmdline.includes('net.minecraft') ||
            cmdline.includes('fabricmc') ||
            cmdline.includes('minecraftforge') ||
            cmdline.includes('quiltmc') ||
            cmdline.includes('lunarclient') ||
            cmdline.includes('badlion') ||
            cmdline.includes('prismlauncher') ||
            cmdline.includes('feather');

          if (isMinecraft) {
            targetPids.push(pid);
            onTarget(`Minecraft Process (PID ${pid}): /proc/${pid}/maps`, 10);

            // 1. Check for -javaagent injection
            if (cmdline.includes('-javaagent:') || cmdline.includes('-Xbootclasspath')) {
              findings.push({
                level: 'CRITICAL',
                type: 'INJECTED_JAVAAGENT',
                pid: pid,
                commandLine: cmdline,
                confidence: '100% (JVM Commandline Argument)',
                description: `Minecraft process (PID: ${pid}) launched with unauthorized -javaagent bytecode injection hook!`
              });
            }

            // 2. Check /proc/<pid>/status for active ptrace tracer injection
            const statusPath = `/proc/${pid}/status`;
            if (fs.existsSync(statusPath)) {
              try {
                const statusContent = fs.readFileSync(statusPath, 'utf8');
                const tracerMatch = statusContent.match(/TracerPid:\s+(\d+)/);
                if (tracerMatch) {
                  const tracerPid = parseInt(tracerMatch[1], 10);
                  if (tracerPid > 0) {
                    let tracerCmd = `PID ${tracerPid}`;
                    try {
                      if (fs.existsSync(`/proc/${tracerPid}/cmdline`)) {
                        tracerCmd = fs.readFileSync(`/proc/${tracerPid}/cmdline`, 'utf8').replace(/\0/g, ' ').trim() || tracerCmd;
                      }
                    } catch (e) {}

                    findings.push({
                      level: 'CRITICAL',
                      type: 'PTRACE_INJECTION_ATTACHED',
                      pid: pid,
                      tracerPid: tracerPid,
                      tracerCmd: tracerCmd,
                      confidence: '100% (/proc/status TracerPid Inspection)',
                      description: `External process is actively attached to Minecraft via ptrace (Tracer PID: ${tracerPid}, Cmd: ${tracerCmd})! Cheats use ptrace to inject shellcode and read/write process memory.`,
                      evidence: [
                        `Target Minecraft PID: ${pid}`,
                        `Tracer Process PID: ${tracerPid}`,
                        `Tracer Command: ${tracerCmd}`
                      ]
                    });
                  }
                }
              } catch (e) {}
            }

            // 3. Check /proc/<pid>/environ for unauthorized LD_PRELOAD injection
            const environPath = `/proc/${pid}/environ`;
            if (fs.existsSync(environPath)) {
              try {
                const envContent = fs.readFileSync(environPath, 'utf8');
                const envVars = envContent.split('\0');
                for (const ev of envVars) {
                  if (ev.startsWith('LD_PRELOAD=')) {
                    const preloadVal = ev.replace('LD_PRELOAD=', '').trim();
                    if (preloadVal) {
                      // Exclude legitimate Linux gaming/recording overlays
                      const isLegitPreload = /mangohud|gamemode|obs[-_]?vkcapture|libobs|gameoverlayrenderer/i.test(preloadVal);
                      if (!isLegitPreload) {
                        findings.push({
                          level: 'CRITICAL',
                          type: 'LD_PRELOAD_INJECTION_DETECTED',
                          pid: pid,
                          preload: preloadVal,
                          confidence: '100% (/proc/environ LD_PRELOAD)',
                          description: `Minecraft launched with suspicious LD_PRELOAD shared library injection: ${preloadVal}`,
                          evidence: [
                            `Target PID: ${pid}`,
                            `LD_PRELOAD: ${preloadVal}`
                          ]
                        });
                      }
                    }
                    break;
                  }
                }
              } catch (e) {}
            }

            // 4. Inspect /proc/<pid>/maps for suspicious injected .so libraries, memfd regions, and unlinked modules
            const mapsPath = `/proc/${pid}/maps`;
            if (fs.existsSync(mapsPath)) {
              try {
                const mapsContent = fs.readFileSync(mapsPath, 'utf8');
                const mapFindings = this.inspectLinuxProcMaps(mapsContent, pid);
                findings.push(...mapFindings);
              } catch (e) {}
            }

            // 5. Cross-process handle inspection: check if another process opened /proc/<pid>/mem
            try {
              for (const otherPid of procDirs) {
                if (otherPid === pid) continue;
                const fdDir = `/proc/${otherPid}/fd`;
                if (!fs.existsSync(fdDir)) continue;
                try {
                  const fds = fs.readdirSync(fdDir);
                  for (const fd of fds) {
                    try {
                      const link = fs.readlinkSync(`${fdDir}/${fd}`);
                      if (link.includes(`/proc/${pid}/mem`)) {
                        let otherCmd = `PID ${otherPid}`;
                        try {
                          if (fs.existsSync(`/proc/${otherPid}/cmdline`)) {
                            otherCmd = fs.readFileSync(`/proc/${otherPid}/cmdline`, 'utf8').replace(/\0/g, ' ').trim() || otherCmd;
                          }
                        } catch (e) {}

                        findings.push({
                          level: 'CRITICAL',
                          type: 'EXTERNAL_MEMORY_READER_WRITER',
                          pid: pid,
                          accessorPid: otherPid,
                          accessorCmd: otherCmd,
                          confidence: '100% (Somut Kanıt: /proc/<pid>/fd -> /proc/target/mem Açık Tanıtıcı)',
                          description: `Harici bir süreç (PID: ${otherPid}, Komut: ${otherCmd}), Minecraft sanal belleğine (/proc/${pid}/mem) doğrudan erişim tanıtıcısı açmış! Bu durum harici aimbot, reach veya bellek okuyucu/yazıcı hilelerinin kesin kanıtıdır.`,
                          evidence: [
                            `Hedef Minecraft PID: ${pid}`,
                            `Erişen Harici PID: ${otherPid}`,
                            `Erişen Harici Komut: ${otherCmd}`,
                            `Açık Tanıtıcı: ${fdDir}/${fd} -> ${link}`
                          ]
                        });
                        break;
                      }
                    } catch (e) {}
                  }
                } catch (e) {}
              }
            } catch (e) {}
          }
        } catch (e) {}
      }

      // 6. Scan all running processes for active cheats or deleted binaries (Process Ghosting)
      for (const anyPid of procDirs) {
        try {
          const exeLink = `/proc/${anyPid}/exe`;
          if (!fs.existsSync(exeLink)) continue;
          let realExe = '';
          try {
            realExe = fs.readlinkSync(exeLink);
          } catch (e) {
            continue;
          }

          const lowerExe = realExe.toLowerCase();
          // Whitelist safe system, developer and desktop processes
          if (/node|code|vscodium|chrome|firefox|brave|spotify|discord|slack|bash|zsh|systemd|gnome|plasma|farben ac/i.test(lowerExe)) {
            continue;
          }

          const isCheat = /vape|drip|slinky|doomsday|meteor|liquidbounce|wurst|autoclicker|murgee|kprocesshacker|processhacker|cheatengine/i.test(lowerExe);
          const isDeletedExe = realExe.includes('(deleted)') && (/tmp|dev\/shm/i.test(realExe) || isCheat);

          if (isCheat || isDeletedExe) {
            let pCmd = `PID ${anyPid}`;
            try {
              pCmd = fs.readFileSync(`/proc/${anyPid}/cmdline`, 'utf8').replace(/\0/g, ' ').trim() || pCmd;
            } catch (e) {}

            findings.push({
              level: 'CRITICAL',
              type: isDeletedExe ? 'LINUX_PROCESS_GHOSTING_DELETED_BINARY' : 'ACTIVE_CHEAT_PROCESS_RUNNING',
              pid: anyPid,
              exePath: realExe,
              cmdline: pCmd,
              confidence: '100% (Somut Kanıt: /proc/<pid>/exe Aktif Süreç)',
              description: isDeletedExe
                ? `Linux sisteminde diskten silinmiş fakat bellekte çalışan şüpheli süreç tespit edildi: ${realExe} (PID: ${anyPid}). Hileler adli iz bırakmamak için ikili dosyayı çalıştırdıktan hemen sonra siler.`
                : `Linux sisteminde aktif olarak çalışan hile süreci tespit edildi: ${realExe} (PID: ${anyPid})`,
              evidence: [
                `Süreç PID: ${anyPid}`,
                `Çalıştırılabilir Dosya: ${realExe}`,
                `Komut Satırı: ${pCmd}`
              ]
            });
          }
        } catch (e) {}
      }

      if (targetPids.length === 0) {
        onTarget(`Process Memory: Verified ${procDirs.length} running PIDs (no active Minecraft instance)`, 0);
      }

      return {
        status: 'LINUX_PROCESS_SCAN_SUCCESS',
        scannedProcesses: targetPids,
        findings: findings
      };

    } catch (err) {
      return { status: 'ERROR', error: err.message, findings: findings, scannedProcesses: [] };
    }
  }
}

module.exports = new MemoryScannerEngine();
