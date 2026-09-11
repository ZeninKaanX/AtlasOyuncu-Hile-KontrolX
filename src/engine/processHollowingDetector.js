/**
 * Atlas AC - Process Hollowing & Ghost Injection Detector
 *
 * Detects advanced process-injection techniques used by cheats:
 *   - Process Hollowing: Legitimate binary spawned, code replaced in memory.
 *   - Ghost / Phantom Injection: File unlinked from disk while still executing.
 *   - LOLBin abuse: Living-off-the-land binaries (regsvr32, mshta, etc.) spawned
 *     directly by javaw.exe or a Minecraft launcher.
 *   - Suspicious parent-child chains: cmd.exe / svchost.exe / explorer.exe whose
 *     parent is a Java or Minecraft process.
 *   - Shared-memory IPC segments used between cheat components.
 *
 * Windows: PowerShell Win32 API / WMI enumeration.
 * Linux  : /proc virtual filesystem enumeration.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/** Legitimate Windows binaries commonly targeted for hollowing or LOLBin abuse. */
const LOLBIN_NAMES = [
  'cmd.exe', 'svchost.exe', 'explorer.exe', 'notepad.exe', 'calc.exe',
  'regsvr32.exe', 'mshta.exe', 'wscript.exe', 'cscript.exe'
];

/** High-risk LOLBins that should never be spawned by javaw / java. */
const HIGH_RISK_LOLBINS = ['regsvr32.exe', 'mshta.exe', 'wscript.exe', 'cscript.exe'];

/** Cheat-related keywords for shared-memory / tmp name matching. */
const CHEAT_SHM_KEYWORDS = ['vape', 'drip', 'slinky', 'cheat', 'inject', 'liquidbounce', 'meteor', 'wurst', 'rise', 'sigma'];

class ProcessHollowingDetector {
  constructor() {
    this.isWindows = process.platform === 'win32';
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API
  // ---------------------------------------------------------------------------

  /**
   * Main entry point. Runs all applicable detections and merges results.
   * @param {Function} onTarget - Progress callback(message, weight)
   * @returns {Promise<{status: string, findings: Array}>}
   */
  async scanProcessHollowing(onTarget = () => {}) {
    const findings = [];

    onTarget('Process Hollowing Detector: Baslatiliyor...', 10);

    if (this.isWindows) {
      const winFindings = await this._scanWindows(onTarget);
      findings.push(...winFindings);
    } else {
      const linuxFindings = await this._scanLinuxGhosting(onTarget);
      findings.push(...linuxFindings);
    }

    // Both platforms: shared-memory segment inspection
    const shmFindings = await this._scanSharedMemory(onTarget);
    findings.push(...shmFindings);

    onTarget('Process Hollowing Detector: Tamamlandi', 10);
    return { status: 'SUCCESS', findings };
  }

  // ---------------------------------------------------------------------------
  // WINDOWS DETECTION
  // ---------------------------------------------------------------------------

  /**
   * Windows-specific hollowing / LOLBin / parent-child detection via PowerShell WMI.
   */
  async _scanWindows(onTarget) {
    const findings = [];
    onTarget('Process Hollowing: Windows surec agaci analiz ediliyor...', 20);

    try {
      // Retrieve full process list with parent PID and command line via WMI
      const ps = `$procs = Get-WmiObject Win32_Process -ErrorAction SilentlyContinue | Select-Object ProcessId, ParentProcessId, Name, ExecutablePath, CommandLine; $procs | ConvertTo-Json -Depth 3`;

      const { stdout } = await execPromise(
        `powershell -NoProfile -NonInteractive -Command "${ps}"`,
        { timeout: 15000, maxBuffer: 20 * 1024 * 1024 }
      ).catch(() => ({ stdout: '' }));

      if (!stdout || !stdout.trim()) return findings;

      let procs = [];
      try {
        const parsed = JSON.parse(stdout);
        procs = Array.isArray(parsed) ? parsed : [parsed];
      } catch (_) {
        return findings;
      }

      return this.analyzeProcesses(procs);
    } catch (err) {
      // Non-fatal - PowerShell may be restricted
    }

    return findings;
  }

  /**
   * Analyzes an array of Windows process records for hollowing and LOLBin abuse.
   */
  analyzeProcesses(procs) {
    const findings = [];
    if (!Array.isArray(procs)) return findings;

    // Build fast lookup: PID to process record
    const pidMap = {};
    for (const p of procs) {
      if (p && p.ProcessId != null) pidMap[p.ProcessId] = p;
    }

    for (const proc of procs) {
      const name    = (proc.Name || '').toLowerCase();
      const cmdLine = (proc.CommandLine || '').toLowerCase();
      const pid     = proc.ProcessId;
      const ppid    = proc.ParentProcessId;
      const parent  = pidMap[ppid];
      const parentName = parent ? (parent.Name || '').toLowerCase() : '';

      // 1. LOLBin spawned directly by javaw.exe / java.exe
      if (HIGH_RISK_LOLBINS.some(l => name === l) &&
          (parentName === 'javaw.exe' || parentName === 'java.exe')) {
        findings.push({
          level: 'CRITICAL',
          type: 'LOLBIN_SPAWNED_BY_JAVA',
          name: `Java Tarafindan Baslatilan LOLBin: ${proc.Name} (PID: ${pid})`,
          description: `javaw.exe / java.exe dogrudan yuksek riskli bir sistem ikiliyi (LOLBin) baslatti: ` +
                       `${proc.Name}. Bu, hile yaziliminin mesru bir Windows aracini kotuye kullanarak ` +
                       `kod enjeksiyonu veya indirme gerceklestirdiginin guclu gostergesidir.`,
          confidence: '95% (Somut Kanitlar: Java->LOLBin Surec Ebeveyn Zinciri)',
          pid,
          ppid,
          evidence: [
            `Hedef Surec: ${proc.Name} (PID: ${pid})`,
            `Ebeveyn Surec: ${parent ? parent.Name : 'Bilinmiyor'} (PPID: ${ppid})`,
            `Komut Satiri: ${proc.CommandLine || 'Yok'}`,
            `Yurutulabilir Yol: ${proc.ExecutablePath || 'Yok'}`
          ]
        });
        continue;
      }

      // 2. High-risk LOLBin with hidden window spawned by javaw / java
      if (HIGH_RISK_LOLBINS.some(l => name === l) &&
          (parentName === 'javaw.exe' || parentName === 'java.exe')) {
        const isWindowless = cmdLine.includes('-windowstyle hidden') ||
                             cmdLine.includes('/s') ||
                             cmdLine.includes('hidden');

        if (isWindowless) {
          findings.push({
            level: 'CRITICAL',
            type: 'SUSPICIOUS_PARENT_CHILD_INJECTION',
            name: `Supheli Ebeveyn-Alt Surec Enjeksiyonu: ${proc.Name} <- ${parent ? parent.Name : 'Bilinmiyor'}`,
            description: `Mesru bir Windows sureci (${proc.Name}), bir Minecraft / Java sureci tarafindan ` +
                         `gizli modda (pencere yok) baslatildi. Klasik process hollowing veya ` +
                         `suspended-process injection senaryosuna uymaktadir.`,
            confidence: '90% (Somut Kanitlar: Gizli LOLBin <- Java Ebeveyn)',
            pid,
            ppid,
            evidence: [
              `Alt Surec: ${proc.Name} (PID: ${pid})`,
              `Ebeveyn: ${parent ? parent.Name : 'Bilinmiyor'} (PPID: ${ppid})`,
              `Komut Satiri: ${proc.CommandLine || 'Yok'}`
            ]
          });
        }
      }

      // 3. Process Hollowing injection flags in command line (requires explicit memory/hollowing flags)
      if (LOLBIN_NAMES.some(l => name === l)) {
        const hasInjectFlag = /(?:createremotethread|virtualallocex|writeprocessmemory|ntunmapviewofsection)/i
          .test(cmdLine);

        if (hasInjectFlag) {
          findings.push({
            level: 'CRITICAL',
            type: 'HOLLOW_PROCESS_DETECTED',
            name: `Hollowing Enjeksiyon Sureci: ${proc.Name} (PID: ${pid})`,
            description: `${proc.Name} sureci bellek manipülasyonu ve process hollowing parametreleri ile ` +
                         `calisiyor. Process hollowing saldirisinda saldirgan hedef sureci askiya ` +
                         `alir, kodunu temizler ve kendi kodunu yerlestirirken bu iz ortaya cikar.`,
            confidence: '95% (Somut Kanitlar: LOLBin Bellek Enjeksiyon API Parametreleri)',
            pid,
            ppid,
            evidence: [
              `Surec: ${proc.Name} (PID: ${pid})`,
              `Komut Satiri: ${proc.CommandLine || '[BOS]'}`,
              `Ebeveyn: ${parent ? parent.Name : 'Bilinmiyor'} (PPID: ${ppid})`
            ]
          });
        }
      }
    }

    return findings;
  }

  // ---------------------------------------------------------------------------
  // LINUX DETECTION - /proc GHOST INJECTION
  // ---------------------------------------------------------------------------

  /**
   * Linux: Scan /proc/[pid]/exe for deleted-but-running binaries (process ghosting).
   */
  async _scanLinuxGhosting(onTarget) {
    const findings = [];
    onTarget('Process Hollowing: Linux /proc ghost enjeksiyonu taranıyor...', 20);

    let pidDirs = [];
    try {
      pidDirs = fs.readdirSync('/proc').filter(d => /^\d+$/.test(d));
    } catch (_) {
      return findings;
    }

    for (const pid of pidDirs) {
      const exeLink = `/proc/${pid}/exe`;
      try {
        const target = fs.readlinkSync(exeLink);

        // Ghost: binary was unlinked while the process kept running
        if (!target.endsWith(' (deleted)')) continue;

        const realPath = target.replace(/ \(deleted\)$/, '');

        // Read cmdline to check if it's Minecraft/Java related
        let cmdline = '';
        try {
          cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8')
            .replace(/\0/g, ' ')
            .toLowerCase()
            .trim();
        } catch (_) {}

        const isMinecraftRelated = /minecraft|java|lwjgl|jvm|jre|jdk/.test(cmdline) ||
                                   /minecraft|java|lwjgl/.test(realPath.toLowerCase());

        if (isMinecraftRelated) {
          findings.push({
            level: 'CRITICAL',
            type: 'PROCESS_GHOSTING_DELETED_MODULE',
            name: `Silinen Ikili Dosyadan Calisan Surec (Ghost Injection): PID ${pid}`,
            description: `PID ${pid} numarali surec, diskten silinmis ama bellekte hala calisan bir ` +
                         `ikili dosyadan calisiyor. Bu teknik "Process Ghosting" veya "Phantom Process" ` +
                         `olarak bilinir ve hile yazilimlarinin anti-cheat tarama araclariindan kacmak ` +
                         `icin dosyasini silerek iz birakmadan calisiyor olmasi anlamina gelir.`,
            confidence: '95% (Somut Kanitlar: /proc/exe -> (deleted) + Minecraft Iliskili Cmdline)',
            pid: parseInt(pid, 10),
            path: realPath,
            evidence: [
              `PID: ${pid}`,
              `Yurutulabilir Sembolik Baglanti: ${target}`,
              `Gercek Yol (Silindi): ${realPath}`,
              `Komut Satiri: ${cmdline.slice(0, 300) || '[okunamaidi]'}`
            ]
          });
        }
      } catch (_) {
        // Process may have exited or permission denied - skip silently
      }
    }

    return findings;
  }

  // ---------------------------------------------------------------------------
  // CROSS-PLATFORM: SHARED MEMORY SEGMENT DETECTION
  // ---------------------------------------------------------------------------

  /**
   * Both platforms: Detect cheat-related shared memory / temp IPC segments.
   * Linux: /dev/shm/* and /tmp/* with cheat keywords.
   * Windows: Named pipe / shared memory objects via PowerShell.
   */
  async _scanSharedMemory(onTarget) {
    const findings = [];
    onTarget('Process Hollowing: Paylasilmis bellek (SHM) segmentleri kontrol ediliyor...', 10);

    if (!this.isWindows) {
      // Linux: POSIX shared memory is located in /dev/shm
      const shmDir = '/dev/shm';
      try {
        if (fs.existsSync(shmDir)) {
          const entries = fs.readdirSync(shmDir);
          for (const entry of entries) {
            const lower = entry.toLowerCase();
            // Whitelist benchmark, test, or forensic analysis folders
            if (lower.includes('test') || lower.includes('_analysis') || lower.includes('benchmark')) continue;

            const matched = CHEAT_SHM_KEYWORDS.find(kw => lower.includes(kw));
            if (matched) {
              const fullPath = path.join(shmDir, entry);
              let stat = null;
              try { stat = fs.statSync(fullPath); } catch (_) {}

              findings.push({
                level: 'CRITICAL',
                type: 'CHEAT_SHM_SEGMENT_FOUND',
                name: `Hile IPC Paylasilmis Bellek Segmenti: ${entry}`,
                description: `${shmDir} dizininde hile yazilimina ozgu bir paylasilmis bellek segmenti ` +
                             `bulundu: "${entry}". Bu segment, hile bilesenlerinin birbirleriyle ` +
                             `disk izi birakmadan iletisim kurmasi icin kullanilmaktadir.`,
                confidence: '90% (Somut Kanitlar: Hile Anahtar Kelimesiyle Eslesen SHM Girisi)',
                path: fullPath,
                evidence: [
                  `Segment Yolu: ${fullPath}`,
                  `Eslesen Anahtar Kelime: ${matched}`,
                  `Boyut: ${stat ? stat.size + ' bayt' : 'bilinmiyor'}`,
                  `Olusturma Zamani: ${stat ? stat.birthtime.toISOString() : 'bilinmiyor'}`
                ]
              });
            }
          }
        }
      } catch (_) {}
    } else {
      // Windows: Named shared memory objects via PowerShell (object namespace)
      try {
        const keywords = CHEAT_SHM_KEYWORDS.join('|');
        const ps = `Get-ChildItem \\\\.\\pipe\\ -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '${keywords}' } | Select-Object Name, FullName | ConvertTo-Json`;
        const { stdout } = await execPromise(
          `powershell -NoProfile -Command "${ps}"`,
          { timeout: 6000, maxBuffer: 5 * 1024 * 1024 }
        ).catch(() => ({ stdout: '' }));

        if (stdout && stdout.trim()) {
          let items = [];
          try {
            const parsed = JSON.parse(stdout);
            items = Array.isArray(parsed) ? parsed : [parsed];
          } catch (_) {}

          for (const item of items) {
            findings.push({
              level: 'CRITICAL',
              type: 'CHEAT_SHM_SEGMENT_FOUND',
              name: `Hile Adlandirilmis Nesne Bulundu: ${item.Name}`,
              description: `Windows nesne ad alaninda hile yazilimiyla iliskili adlandirilmis bir ` +
                           `paylasilmis bellek veya boru (pipe) nesnesi tespit edildi: ${item.FullName}`,
              confidence: '90% (Somut Kanitlar: Hile Anahtar Kelimesiyle Eslesen Windows Adlandirilmis Nesne)',
              path: item.FullName || item.Name,
              evidence: [
                `Nesne Adi: ${item.Name}`,
                `Tam Yol: ${item.FullName || 'Bilinmiyor'}`
              ]
            });
          }
        }
      } catch (_) {}
    }

    return findings;
  }
}

module.exports = new ProcessHollowingDetector();
