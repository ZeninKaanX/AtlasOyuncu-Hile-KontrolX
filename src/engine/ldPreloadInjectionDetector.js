/**
 * Atlas AC - LD_PRELOAD & ptrace Injection Detector (Linux Only)
 *
 * Detects Linux-specific dynamic linker abuse and process-tracing injection:
 *
 *   1. LD_PRELOAD injection:
 *      - Scans /proc/<pid>/environ for LD_PRELOAD set inside Minecraft/Java processes.
 *      - Scans /proc/<pid>/maps for .so libraries loaded from non-standard paths
 *        (/tmp, /dev/shm, ~/.cache) suggesting runtime injection.
 *
 *   2. ptrace attach detection:
 *      - Reads TracerPid from /proc/<pid>/status; any value > 0 means another process
 *        has attached via ptrace() and can read/write the full address space.
 *      - Resolves the tracer's cmdline to identify the attaching tool.
 *
 *   3. Unlinked (deleted) executable memory-mapped regions:
 *      - /proc/<pid>/maps entries where the path ends with ' (deleted)' AND the
 *        memory permissions include 'x' (executable) = code running from a ghost file.
 *
 *   4. Known Linux cheat config directories in the user's home.
 *
 * Returns an empty array on Windows — all checks are Linux-exclusive.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/** Paths considered non-standard / writable-by-attacker for .so injection. */
const SUSPICIOUS_SO_PATHS = ['/tmp/', '/dev/shm/', '/.cache/', '/var/tmp/', '/run/user/'];

/** Minecraft / Java process name patterns. */
const JAVA_PROC_PATTERN = /minecraft|java|lwjgl|jvm|jre|jdk/i;

/** Known Linux cheat client config directory names. */
const CHEAT_CONFIG_DIRS = [
  '.config/vape',
  '.config/drip',
  '.config/meteor',
  '.minecraft/vape',
  '.minecraft/.atmosphere',
  '.minecraft/.wurst',
  '.minecraft/.rise',
  '.minecraft/.sigma',
  '.minecraft/.liquidbounce',
  '.config/slinky'
];

class LdPreloadInjectionDetector {
  constructor() {
    this.isWindows = process.platform === 'win32';
    this.homeDir   = os.homedir();
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API
  // ---------------------------------------------------------------------------

  /**
   * Main entry point. Runs all Linux injection technique detections.
   * Returns an empty result set on Windows.
   *
   * @param {Function} onTarget - Progress callback(message, weight)
   * @returns {Promise<{status: string, findings: Array}>}
   */
  async scanLdPreloadAndPtrace(onTarget = () => {}) {
    if (this.isWindows) {
      return { status: 'SKIPPED', findings: [] };
    }

    const findings = [];
    onTarget('LD_PRELOAD/ptrace Dedektoru: Baslatiliyor...', 10);

    const pidDirs = this._getJavaPids();

    // 1. LD_PRELOAD environment variable check
    onTarget('LD_PRELOAD: Ortam degiskenleri taranıyor...', 15);
    for (const pid of pidDirs) {
      const envFindings = await this._checkLdPreloadEnv(pid);
      for (const f of envFindings) {
        findings.push(f);
        try { onTarget(`LD_PRELOAD Bulgu: PID ${pid}`, 2); } catch (_) {}
      }
    }

    // 2. /proc/maps suspicious .so paths
    onTarget('LD_PRELOAD: Bellek haritalarinda supheli kutuphaneler aranıyor...', 20);
    for (const pid of pidDirs) {
      const mapFindings = await this._checkMapsForInjectedSo(pid);
      for (const f of mapFindings) {
        findings.push(f);
        try { onTarget(`Enjekte SO Bulgu: PID ${pid}`, 2); } catch (_) {}
      }
    }

    // 3. ptrace tracer detection
    onTarget('ptrace: Java sureclerine bagli izleyiciler kontrol ediliyor...', 15);
    for (const pid of pidDirs) {
      const ptraceFinding = await this._checkPtraceTracer(pid);
      if (ptraceFinding) {
        findings.push(ptraceFinding);
        try { onTarget(`ptrace Bulgu: PID ${pid}`, 2); } catch (_) {}
      }
    }

    // 4. Unlinked executable memory regions (all processes, not just Java)
    onTarget('Ghost Injection: Silinen yurutulabilir bellek bolgeleri taranıyor...', 20);
    const allPids = this._getAllPids();
    for (const pid of allPids) {
      const ghostFindings = await this._checkUnlinkedExecMaps(pid);
      for (const f of ghostFindings) {
        findings.push(f);
        try { onTarget(`Ghost Exec Bolge Bulgu: PID ${pid}`, 1); } catch (_) {}
      }
    }

    // 5. Cheat config directories
    onTarget('Linux Hile Konfigurasyon Dizinleri: Kontrol ediliyor...', 10);
    const cfgFindings = this._checkCheatConfigDirs();
    findings.push(...cfgFindings);

    onTarget('LD_PRELOAD/ptrace Dedektoru: Tamamlandi', 10);
    return { status: 'SUCCESS', findings };
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  /** Returns all numeric /proc entries (all PIDs on the system). */
  _getAllPids() {
    try {
      return fs.readdirSync('/proc').filter(d => /^\d+$/.test(d));
    } catch (_) {
      return [];
    }
  }

  /**
   * Returns PIDs whose cmdline matches Minecraft / Java keywords.
   * Restricts expensive map/environ reads to relevant processes.
   */
  _getJavaPids() {
    const pids = this._getAllPids();
    const result = [];
    for (const pid of pids) {
      try {
        const cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8')
          .replace(/\0/g, ' ')
          .toLowerCase();
        if (JAVA_PROC_PATTERN.test(cmdline)) result.push(pid);
      } catch (_) {}
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // CHECK 1: LD_PRELOAD in environ
  // ---------------------------------------------------------------------------

  /**
   * Checks /proc/<pid>/environ for LD_PRELOAD entries.
   * @param {string} pid
   * @returns {Array} findings
   */
  async _checkLdPreloadEnv(pid) {
    const findings = [];
    try {
      const environ = fs.readFileSync(`/proc/${pid}/environ`, 'utf8');
      const vars = environ.split('\0');
      const ldEntry = vars.find(v => v.startsWith('LD_PRELOAD='));
      if (!ldEntry) return findings;

      const value = ldEntry.slice('LD_PRELOAD='.length);
      const cmdline = this._readCmdline(pid);

      findings.push({
        level: 'CRITICAL',
        type: 'LD_PRELOAD_INJECTION_DETECTED',
        name: `LD_PRELOAD Enjeksiyonu Tespit Edildi: PID ${pid}`,
        description: `PID ${pid} numarali Java/Minecraft surecinin ortam degiskenlerinde LD_PRELOAD tanimli! ` +
                     `LD_PRELOAD, dinamik baglayicinin surecin tum kutuphanelerinden once belirtilen ` +
                     `paylasimli kutuphaneleri yuklemesine zorlar - bu, hile yaziliminin Java sanal ` +
                     `makinesine veya oyun kutuphanelerine islevler enjekte etmek icin kullandigi ` +
                     `klasik bir Linux enjeksiyon yontemidir.`,
        confidence: '95% (Somut Kanitlar: LD_PRELOAD Ortam Degiskeni Java Surecinde)',
        pid: parseInt(pid, 10),
        path: value,
        evidence: [
          `PID: ${pid}`,
          `LD_PRELOAD Degeri: ${value}`,
          `Surec Komut Satiri: ${cmdline.slice(0, 300)}`
        ]
      });
    } catch (_) {
      // /proc/<pid>/environ may not be readable — skip
    }
    return findings;
  }

  // ---------------------------------------------------------------------------
  // CHECK 2: /proc/maps for suspicious .so paths
  // ---------------------------------------------------------------------------

  /**
   * Reads /proc/<pid>/maps and flags .so files loaded from suspicious directories.
   * @param {string} pid
   * @returns {Array} findings
   */
  async _checkMapsForInjectedSo(pid) {
    const findings = [];
    const seen = new Set();

    try {
      const maps = fs.readFileSync(`/proc/${pid}/maps`, 'utf8');
      const cmdline = this._readCmdline(pid);

      for (const line of maps.split('\n')) {
        // Format: address perms offset dev inode pathname
        const parts = line.trim().split(/\s+/);
        if (parts.length < 6) continue;
        const filePath = parts[5];
        if (!filePath || !filePath.endsWith('.so') && !/\.so\.\d/.test(filePath)) continue;
        if (seen.has(filePath)) continue;
        seen.add(filePath);

        const isSuspicious = SUSPICIOUS_SO_PATHS.some(p => filePath.includes(p));
        if (!isSuspicious) continue;

        findings.push({
          level: 'CRITICAL',
          type: 'INJECTED_SO_LIBRARY_IN_JAVA',
          name: `Supheli Konumdan Paylasimli Kutphane Yuklendi: ${path.basename(filePath)}`,
          description: `Java/Minecraft sureci (PID ${pid}), yazilabilir / gecici bir dizinden paylasimli ` +
                       `kutphane yuklemis: ${filePath}. Standart sistem dizinleri disinda bir konumdan ` +
                       `yuklenen .so dosyalari, LD_PRELOAD veya dlopen() tabanli enjeksiyonun ` +
                       `gostergesidir.`,
          confidence: '90% (Somut Kanitlar: /proc/maps Yazilabilir Dizin SO Girisi)',
          pid: parseInt(pid, 10),
          path: filePath,
          evidence: [
            `PID: ${pid}`,
            `Supheli Kutphane Yolu: ${filePath}`,
            `Surec Komut Satiri: ${cmdline.slice(0, 300)}`
          ]
        });
      }
    } catch (_) {}

    return findings;
  }

  // ---------------------------------------------------------------------------
  // CHECK 3: ptrace tracer (TracerPid in /proc/<pid>/status)
  // ---------------------------------------------------------------------------

  /**
   * Checks /proc/<pid>/status for TracerPid > 0 (ptrace attach).
   * @param {string} pid
   * @returns {Object|null} finding or null
   */
  async _checkPtraceTracer(pid) {
    try {
      const status = fs.readFileSync(`/proc/${pid}/status`, 'utf8');
      const match  = status.match(/TracerPid:\s*(\d+)/);
      if (!match) return null;

      const tracerPid = parseInt(match[1], 10);
      if (tracerPid === 0) return null;

      // Resolve who the tracer is
      const tracerCmdline = this._readCmdline(String(tracerPid));
      const targetCmdline = this._readCmdline(pid);

      return {
        level: 'CRITICAL',
        type: 'PTRACE_INJECTION_ATTACHED',
        name: `ptrace Enjeksiyonu: Surec ${pid} Izleniyor (TracerPID: ${tracerPid})`,
        description: `Java/Minecraft sureci (PID ${pid}), baska bir surec tarafindan ptrace() cagirisiyla ` +
                     `izleniyor (TracerPid: ${tracerPid}). ptrace(), bir surecin tam bellek okuma/yazma ` +
                     `erisimi saglar ve hile yaziliminin JVM'e bytecode veya native kod enjekte etmek ` +
                     `icin kullandigi guclu bir tekniktir. Resmi hata ayiklayici (debugger) yetkilendirmesi ` +
                     `yoksa bu kritik bir bulgudur.`,
        confidence: '98% (Somut Kanitlar: TracerPid > 0 Java Surecinde)',
        pid: parseInt(pid, 10),
        evidence: [
          `Hedef PID: ${pid}`,
          `Hedef Surec: ${targetCmdline.slice(0, 200)}`,
          `ptrace Izleyici PID: ${tracerPid}`,
          `Izleyici Surec Komut Satiri: ${tracerCmdline.slice(0, 200) || '[okunamiyor]'}`
        ]
      };
    } catch (_) {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // CHECK 4: Unlinked executable memory regions
  // ---------------------------------------------------------------------------

  /**
   * Scans /proc/<pid>/maps for executable regions pointing to deleted files.
   * @param {string} pid
   * @returns {Array} findings
   */
  async _checkUnlinkedExecMaps(pid) {
    const findings = [];
    const seen = new Set();

    try {
      const rawCmdline = this._readCmdline(pid);
      const cmdline = rawCmdline.toLowerCase();

      if (parseInt(pid, 10) === process.pid) return findings;

      // Whitelist legitimate desktop environment, display server, and system services (and anti-cheat itself)
      const isWhitelistedProc = /plasmashell|plasma-|kwin|gnome-|mutter|wayland|xorg|xwayland|pipewire|wireplumber|pulseaudio|systemd|dbus|firefox|chrome|electron|atlasac|farben/i.test(cmdline);
      if (isWhitelistedProc) return findings;

      const maps = fs.readFileSync(`/proc/${pid}/maps`, 'utf8');

      for (const line of maps.split('\n')) {
        if (!line.endsWith(' (deleted)')) continue;
        const parts = line.trim().split(/\s+/);
        if (parts.length < 6) continue;

        const perms    = parts[1] || '';
        const filePath = parts.slice(5).join(' '); // path may contain spaces

        // Must be executable
        if (!perms.includes('x')) continue;

        // Whitelist Linux kernel anonymous memory file descriptors and JIT maps
        // e.g. /memfd:JITCode:QtQml, /memfd:wayland-shm, /SYSV00000000, /dev/zero
        if (/memfd:|SYSV|anon_inode|\[aio\]|\/dev\/zero|atlasac|farben/i.test(filePath)) continue;

        if (seen.has(filePath)) continue;
        seen.add(filePath);

        findings.push({
          level: 'CRITICAL',
          type: 'UNLINKED_MEMORY_MAPPED_INJECTION',
          name: `Silinen Dosyadan Calistirilabilir Bellek Bolgesi: PID ${pid}`,
          description: `PID ${pid} numarali surec, diskten silinmis bir dosyadan eslenmis calistirilabilir ` +
                       `bellek bolgesi iceriyor: ${filePath}. Bu teknik "Memory-Only Implant" veya ` +
                       `"Ghost DLL Injection" olarak bilinir; saldirgan kotu amacli kodu belleye yukler ` +
                       `ve dosyayi siler, boylece disk taramalarindan kacar. Yurütme devam ederken ` +
                       `dosya sisteminde herhangi bir iz kalmaz.`,
          confidence: '95% (Somut Kanitlar: /proc/maps Silindi + x Izni)',
          pid: parseInt(pid, 10),
          path: filePath.replace(/ \(deleted\)$/, ''),
          evidence: [
            `PID: ${pid}`,
            `Bellek Izinleri: ${perms}`,
            `Silinen Dosya Yolu: ${filePath}`,
            `Surec Komut Satiri: ${rawCmdline.slice(0, 300)}`
          ]
        });
      }
    } catch (_) {}

    return findings;
  }

  // ---------------------------------------------------------------------------
  // CHECK 5: Cheat config directories
  // ---------------------------------------------------------------------------

  /**
   * Checks for known Linux cheat client configuration directories under $HOME.
   * @returns {Array} findings
   */
  _checkCheatConfigDirs() {
    const findings = [];
    for (const rel of CHEAT_CONFIG_DIRS) {
      const fullPath = path.join(this.homeDir, rel);
      try {
        const stat = fs.statSync(fullPath);
        if (!stat.isDirectory()) continue;

        // Count files inside for confidence evidence
        let fileCount = 0;
        try {
          fileCount = fs.readdirSync(fullPath).length;
        } catch (_) {}

        const cheatName = rel.split('/').pop().replace(/^\./, '');
        findings.push({
          level: 'CRITICAL',
          type: 'LINUX_CHEAT_CONFIG_DIR',
          name: `Linux Hile Istemcisi Konfigurasyon Dizini Bulundu: ${cheatName}`,
          description: `Bilinen bir hile istemcisine ait konfigurasyon dizini tespit edildi: ${fullPath}. ` +
                       `Bu dizin, hile istemcisinin sisteme yuklendiginin ve ayarlarinin kaydedildiginin ` +
                       `gostergesidiir. Dizin icinde ${fileCount} dosya/klasor bulundu.`,
          confidence: '95% (Somut Kanitlar: Bilinen Hile Konfigurasyon Dizini Mevcut)',
          path: fullPath,
          evidence: [
            `Dizin Yolu: ${fullPath}`,
            `Hile Istemcisi: ${cheatName}`,
            `Dizin Icindeki Dosya Sayisi: ${fileCount}`,
            `Oluşturma Zamani: ${stat.birthtime ? stat.birthtime.toISOString() : 'bilinmiyor'}`
          ]
        });
      } catch (_) {
        // Directory does not exist - that's fine
      }
    }
    return findings;
  }

  // ---------------------------------------------------------------------------
  // UTILITY
  // ---------------------------------------------------------------------------

  /**
   * Safely reads /proc/<pid>/cmdline and returns a clean string.
   * @param {string} pid
   * @returns {string}
   */
  _readCmdline(pid) {
    try {
      return fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8')
        .replace(/\0/g, ' ')
        .trim();
    } catch (_) {
      return '';
    }
  }
}

module.exports = new LdPreloadInjectionDetector();
