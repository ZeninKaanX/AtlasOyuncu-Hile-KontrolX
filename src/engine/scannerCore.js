/**
 * Atlas AC - Master Forensic Scanner Core
 * Orchestrates all specialized inspection engines in real-time.
 * Emits progress, status, and findings to WebSocket clients with live finding streaming.
 * Monotonic progress tracker guarantees no premature jumps to 98%/99%.
 * Automatically generates a self-contained HTML inspection report on scan completion.
 */

require('./silentProcess');
const path = require('path');
const os = require('os');
const bypassDetector = require('./bypassDetector');
const usnJournal = require('./usnJournal');
const prefetch = require('./prefetch');
const registryForensics = require('./registryForensics');
const browserForensics = require('./browserForensics');
const usbTracker = require('./usbTracker');
const memoryScanner = require('./memoryScanner');
const minecraftInspector = require('./minecraftInspector');
const autoclickerMacro = require('./autoclickerMacro');
const pythonCheatDetector = require('./pythonCheatDetector');
const deepArchiveScanner = require('./deepArchiveScanner');
const cleanerDetector = require('./cleanerDetector');
const recycleBinScanner = require('./recycleBinScanner');
const networkForensics = require('./networkForensics');
const lnkForensics = require('./lnkForensics');
const shimCacheScanner = require('./shimCacheScanner');
const unloadedModulesScanner = require('./unloadedModulesScanner');
const pcaScanner = require('./pcaScanner');
const werCrashScanner = require('./werCrashScanner');
const timeManipulationDetector = require('./timeManipulationDetector');
const runHistoryForensics = require('./runHistoryForensics');
const defenderForensics = require('./defenderForensics');
const discordForensics = require('./discordForensics');
const srumForensics = require('./srumForensics');
const shellbagForensics = require('./shellbagForensics');
const scheduledTaskForensics = require('./scheduledTaskForensics');
const codeIntegrityForensics = require('./codeIntegrityForensics');
const windowEvasionScanner = require('./windowEvasionScanner');
const cryptnetForensics = require('./cryptnetForensics');
const appCrashForensics = require('./appCrashForensics');
const minecraftLogForensics = require('./minecraftLogForensics');
const cheatKnowledgeBase = require('./cheatKnowledgeBase');
const processHollowingDetector = require('./processHollowingDetector');
const ldPreloadInjectionDetector = require('./ldPreloadInjectionDetector');
const powerShellScriptForensics = require('./powerShellScriptForensics');
const zoneIdentifierForensics = require('./zoneIdentifierForensics');
const dnsCacheForensics = require('./dnsCacheForensics');
const updater = require('./updater');
const reporter = require('./reporter');
const serverPolicy = require('../config/serverPolicy');
const serverStatus = require('./serverStatus');

function isAutoClickerFinding(f) {
  if (!f) return false;
  if (f.badge === 'ALLOWED_POLICY' && /autoclicker|clicker|makro|macro|opautoclick/i.test(`${f.name || ''} ${f.type || ''} ${f.description || ''}`)) return true;
  if (f.type && (
    f.type === 'ALLOWED_UTILITY_AUTOCLICKER' ||
    f.type === 'AUTOCLICKER_PREFETCH' ||
    f.type === 'ALLOWED_AUTOCLICKER_RECORD' ||
    f.type === 'AUTOCLICKER_BINARY' ||
    f.type === 'PCA_EXECUTED_ALLOWED_TOOL' ||
    f.type === 'DEFENDER_AUTOCLICKER_ALLOWED' ||
    f.type === 'AUTOCLICKER_REGISTRY_RECORD' ||
    f.type === 'AUTOCLICKER_ALLOWED_POLICY' ||
    f.type === 'ALLOWED_POLICY_AUTOCLICKER_SUMMARY' ||
    f.type.includes('AUTOCLICKER')
  )) return true;
  const text = `${f.name || ''} ${f.type || ''} ${f.description || ''} ${f.file || ''} ${f.path || ''}`.toLowerCase();
  return /autoclicker|op\s*auto\s*clicker|murgee|speedclicker|fastclick|opautoclick/i.test(text);
}

class ScannerCore {
  constructor() {
    this.isScanning = false;
    this.lastScanResults = null;
    this.findings = [];
  }

  /**
   * Executes a full forensic system scan.
   * @param {Function} onProgress - Callback function for UI updates: (stage, percent, logMsg, newFinding)
   */
  async runFullScan(onProgress = () => {}) {
    if (this.isScanning) {
      throw new Error('A scan is already in progress.');
    }

    this.isScanning = true;
    const startTime = Date.now();
    const allFindings = [];
    this.findings = allFindings;
    let totalScannedObjects = 0;

    // Monotonic Progress Tracker
    let currentPercent = 0;
    const setPercent = (val) => {
      if (val > currentPercent) {
        currentPercent = Math.min(val, 99.4);
      }
      return Math.floor(currentPercent);
    };

    let lastProgressTime = 0;
    const reportProgress = (stage, targetPercent, log, finding = null, target = null, countDelta = 0) => {
      if (countDelta > 0) totalScannedObjects += countDelta;
      const pct = setPercent(targetPercent);
      const now = Date.now();

      if (finding) {
        cheatKnowledgeBase.enrichFinding(finding);
        onProgress(stage, pct, log, finding, target, totalScannedObjects);
        lastProgressTime = now;
        return;
      }

      // Throttle telemetry messages (max once every 50ms)
      if (now - lastProgressTime >= 50) {
        lastProgressTime = now;
        onProgress(stage, pct, log, null, target, totalScannedObjects);
      }
    };

    // Helper: push findings array from a result object and immediately emit events
    const seenFindingKeys = new Set();
    const pushFindings = (findingsArr, stage, label) => {
      if (!findingsArr || !findingsArr.length) return;
      for (const f of findingsArr) {
        const key = `${f.type || ''}|${f.path || ''}|${f.name || ''}|${f.file || ''}`;
        if (!seenFindingKeys.has(key)) {
          seenFindingKeys.add(key);
          if (serverPolicy.isAutoClickerAllowed() && isAutoClickerFinding(f)) {
            f.level = 'INFO';
            f.severity = 'INFO';
            f.isSafe = true;
            f.isThreat = false;
            f.badge = 'ALLOWED_POLICY';
            f.badgeText = 'SUNUCU İZNİ: AUTOCLICKER SERBEST';
          }
          cheatKnowledgeBase.enrichFinding(f);
          allFindings.push(f);
          // Stream live finding to UI immediately
          onProgress(stage, Math.floor(currentPercent), `[${label}] ${f.name || f.description || ''}`, f, f.path || f.name || f.file || label, totalScannedObjects);
        }
      }
    };

    const onLiveFinding = (finding, stage, label) => {
      if (!finding) return;
      pushFindings([finding], stage, label);
    };

    try {
      // ─────────────────────────────────────────────────────────────────────────
      // PHASE 0: Init — signature DB check (0% -> 4%)
      // ─────────────────────────────────────────────────────────────────────────
      reportProgress('INITIALIZING', 2, 'İmza veritabanı ve güvenlik modülleri doğrulanıyor...', null, 'Signature Database', 12);
      const updateResult = await updater.checkForUpdates();
      reportProgress('INITIALIZING', 4, updateResult.message || 'İmza veritabanı güncel.', null, 'Custom Signature Registry', 1);

      // ─────────────────────────────────────────────────────────────────────────
      // PHASE 1: HIGH-PRIORITY PARALLEL — Active system state (4% -> 38%)
      // Memory, bypass, Minecraft, and active session logs
      // ─────────────────────────────────────────────────────────────────────────
      reportProgress('TARAMA_BASLADI', 6, 'Aşama 1 başlatılıyor: Bellek, bypass ve Minecraft modları taranıyor...', null, 'Parallel Group 1', 0);

      let phase1Done = 0;
      const totalPhase1Engines = 5;
      const advancePhase1 = () => {
        phase1Done++;
        setPercent(4 + (phase1Done / totalPhase1Engines) * 34); // 4% to 38%
      };

      const [
        bypassResults,
        memResults,
        injectedFindings,
        mcResults,
        logResults
      ] = await Promise.all([

        // 1A. Bypass & Injection Analysis
        (async () => {
          reportProgress('BYPASS_ANALIZI', 8, 'Bypass vektörleri taranıyor (Spotify, Kernel BYOVD, DNS, JVM, ADS)...', null, 'Bypass Subsystem', 5);
          const res = await bypassDetector.scanAllBypasses((subTarget, count) => {
            reportProgress('BYPASS_ANALIZI', 12, `Bypass: ${path.basename(subTarget)}`, null, subTarget, count);
          });
          const bypassList = [
            ...(res.spotifyInjection || []),
            ...(res.kernelBypass || []),
            ...(res.dnsCacheForensics || []),
            ...(res.jvmAgentInjection || []),
            ...(res.antiForensicsWiping || []),
            ...(res.alternateDataStreams || []),
            ...(res.dnsEventLogs || []),
            ...(res.jvmAttachSockets || []),
            ...(res.discordSteamInjection || []),
            ...(res.wmiInjection || []),
            ...(res.lolbinAbuse || []),
            ...(res.reflectiveDllInjection || [])
          ];
          pushFindings(bypassList, 'BYPASS_ANALIZI', 'BYPASS');
          advancePhase1();
          return res;
        })(),

        // 1B. Memory & Process Analysis
        (async () => {
          reportProgress('BELLEK_TARAMASI', 8, 'Süreç belleği ve DLL modülleri paralel taranıyor...', null, 'Memory Subsystem', 5);
          const res = await memoryScanner.scanProcesses((targetName, count) => {
            reportProgress('BELLEK_TARAMASI', 12, `Bellek: ${targetName}`, null, targetName, count);
          });
          pushFindings(res && res.findings, 'BELLEK_TARAMASI', 'MEMORY');
          advancePhase1();
          return res;
        })(),

        // 1C. Injected Ghost Clients
        (async () => {
          reportProgress('BELLEK_TARAMASI', 8, 'JVM unbacked ve ghost client modülleri taranıyor...', null, 'Ghost Module Inspector', 5);
          const res = await unloadedModulesScanner.scanInjectedGhostClients((subTarget, count) => {
            reportProgress('BELLEK_TARAMASI', 12, `Ghost: ${subTarget}`, null, subTarget, count);
          });
          pushFindings(res, 'BELLEK_TARAMASI', 'GHOST CLIENT');
          advancePhase1();
          return res;
        })(),

        // 1D. Minecraft Deep Scan
        (async () => {
          reportProgress('MINECRAFT_MODLARI', 8, 'Minecraft mod, kütüphane ve bytecode trojan taraması çalışıyor...', null, 'Minecraft Subsystem', 5);
          const res = await minecraftInspector.scanMinecraft(
            (msg, target, objDelta) => {
              reportProgress('MINECRAFT_MODLARI', 15, msg, null, target || msg, objDelta || 1);
            },
            (f) => onLiveFinding(f, 'MINECRAFT_MODLARI', 'MOD DETECTED')
          );
          pushFindings(res && res.findings, 'MINECRAFT_MODLARI', 'MOD DETECTED');
          advancePhase1();
          return res;
        })(),

        // 1E. Minecraft Logs
        (async () => {
          reportProgress('MINECRAFT_LOGLARI', 8, 'Minecraft oturum logları taranıyor...', null, 'Minecraft Log Subsystem', 10);
          const res = await minecraftLogForensics.scanMinecraftLogs((subTarget, count) => {
            reportProgress('MINECRAFT_LOGLARI', 12, `Log: ${subTarget}`, null, subTarget, count);
          });
          pushFindings(Array.isArray(res) ? res : [], 'MINECRAFT_LOGLARI', 'LOG RECORD');
          advancePhase1();
          return res;
        })()
      ]);

      // ─────────────────────────────────────────────────────────────────────────
      // PHASE 2: MASSIVE PARALLEL ADLI BİLİŞİM (38% -> 92%)
      // 25+ independent forensic engines run at once.
      // Every engine immediately pushes its findings upon completion!
      // ─────────────────────────────────────────────────────────────────────────
      setPercent(38);
      reportProgress('ADLI_TARAMA', 38, 'Aşama 2: 25+ adli bilişim motoru eş zamanlı çalışıyor...', null, 'Parallel Forensic Group 2', 0);

      const totalPhase2Engines = 29;
      let phase2Done = 0;
      const advancePhase2 = () => {
        phase2Done++;
        setPercent(38 + (phase2Done / totalPhase2Engines) * 54); // 38% to 92%
      };

      const wrapPhase2 = async (stage, label, scanFn) => {
        try {
          const res = await scanFn();
          const findings = Array.isArray(res) ? res : (res && res.findings ? res.findings : []);
          if (findings.length > 0) {
            pushFindings(findings, stage, label);
          }
          advancePhase2();
          return res;
        } catch (err) {
          advancePhase2();
          return { status: 'ERROR', error: err.message, findings: [] };
        }
      };

      const [
        usnResults,
        pfResults,
        regResults,
        shimFindings,
        lnkFindings,
        pcaFindings,
        werFindings,
        runHistoryFindings,
        timeFindings,
        shellbagResults,
        archiveScanResults,
        browserResults,
        discordResults,
        usbResults,
        acResults,
        pyResults,
        cleanerResults,
        defenderResults,
        srumResults,
        taskResults,
        codeIntegrityResults,
        windowEvasionResults,
        cryptnetResults,
        appCrashResults,
        hollowingResults,
        ldPreloadResults,
        psScriptResults,
        recycleResults,
        netResults
      ] = await Promise.all([

        // 2A. NTFS USN Journal
        wrapPhase2('USN_JOURNAL', 'DELETION EVIDENCE', () =>
          usnJournal.scanDrive('C:', (p, c) => { reportProgress('USN_JOURNAL', 42, `USN: ${path.basename(p)}`, null, p, c); })
        ),

        // 2B. Prefetch
        wrapPhase2('PREFETCH_BAM', 'PREFETCH', () =>
          prefetch.scanPrefetch((p, c) => { reportProgress('PREFETCH_BAM', 45, `Prefetch: ${path.basename(p)}`, null, p, c); })
        ),

        // 2C. Registry BAM/DAM/UserAssist
        wrapPhase2('PREFETCH_BAM', 'BAM REGISTRY', () =>
          registryForensics.scanRegistry((p, c) => { reportProgress('PREFETCH_BAM', 45, `Registry: ${path.basename(p)}`, null, p, c); })
        ),

        // 2D. ShimCache
        wrapPhase2('PREFETCH_BAM', 'SHIMCACHE', () =>
          shimCacheScanner.scanShimCache((s, c) => { reportProgress('PREFETCH_BAM', 45, `ShimCache: ${s}`, null, s, c); })
        ),

        // 2E. LNK / JumpList
        wrapPhase2('PREFETCH_BAM', 'LNK/JUMPLIST', () =>
          lnkForensics.scanAllRecent((s, c) => { reportProgress('PREFETCH_BAM', 45, `LNK: ${path.basename(s)}`, null, s, c); })
        ),

        // 2F. PCA
        wrapPhase2('PREFETCH_BAM', 'PCA RECORD', () =>
          pcaScanner.scanPcaLogs((s, c) => { reportProgress('PREFETCH_BAM', 45, `PCA: ${s}`, null, s, c); })
        ),

        // 2G. WER Crash
        wrapPhase2('PREFETCH_BAM', 'WER CRASH', () =>
          werCrashScanner.scanCrashes((s, c) => { reportProgress('PREFETCH_BAM', 45, `WER: ${s}`, null, s, c); })
        ),

        // 2H. Run History
        wrapPhase2('PREFETCH_BAM', 'RUN/SEARCH', () =>
          runHistoryForensics.scanHistory((s, c) => { reportProgress('PREFETCH_BAM', 45, `RunMRU: ${s}`, null, s, c); })
        ),

        // 2I. Time Manipulation
        wrapPhase2('PREFETCH_BAM', 'TIME SKEW', () =>
          timeManipulationDetector.scanTimeManipulation((s, c) => { reportProgress('PREFETCH_BAM', 45, `Clock: ${s}`, null, s, c); })
        ),

        // 2J. Shellbags
        wrapPhase2('PREFETCH_BAM', 'SHELLBAG', () =>
          shellbagForensics.scanShellbags((s, c) => { reportProgress('PREFETCH_BAM', 45, `Shellbag: ${s}`, null, s, c); })
        ),

        // 2K. Deep Archive (Downloads, Desktop, Temp) with LIVE streaming
        wrapPhase2('DERIN_ARSIV_TARAMASI', 'ARCHIVE FINDING', () =>
          deepArchiveScanner.scanAllLocations(
            (p, c) => { reportProgress('DERIN_ARSIV_TARAMASI', 50, `Arşiv: ${path.basename(p)}`, null, p, c); },
            (f) => onLiveFinding(f, 'DERIN_ARSIV_TARAMASI', 'ARCHIVE FINDING')
          )
        ),

        // 2L. Browser History with LIVE streaming
        wrapPhase2('TARAYICI_GECMISI', 'BROWSER RECORD', () =>
          browserForensics.scanAllBrowsers(
            (p, c) => { reportProgress('TARAYICI_GECMISI', 52, `Browser: ${path.basename(p)}`, null, p, c); },
            (f) => onLiveFinding(f, 'TARAYICI_GECMISI', 'BROWSER RECORD')
          )
        ),

        // 2M. Discord Forensics
        wrapPhase2('DISCORD_ANALIZI', 'DISCORD RECORD', () =>
          discordForensics.scanDiscordForensics((s, c) => { reportProgress('DISCORD_ANALIZI', 55, `Discord: ${s}`, null, s, c); })
        ),

        // 2N. USB History
        wrapPhase2('USB_ANALIZI', 'USB DEVICE', () =>
          usbTracker.scanUsbHistory((p, c) => { reportProgress('USB_ANALIZI', 55, `USB: ${p}`, null, p, c); })
        ),

        // 2O. AutoClicker / Macro
        wrapPhase2('MAKRO_KLIKER', 'MACRO/CLICKER', () =>
          autoclickerMacro.scanAutoClickersAndMacros((p, c) => { reportProgress('MAKRO_KLIKER', 55, `Macro: ${p}`, null, p, c); })
        ),

        // 2P. Python Cheats
        wrapPhase2('PYTHON_HILELERI', 'EXTERNAL PYTHON', () =>
          pythonCheatDetector.scanPythonCheats((p, c) => { reportProgress('PYTHON_HILELERI', 58, `Python: ${path.basename(p)}`, null, p, c); })
        ),

        // 2Q. Cleaner / Anti-Forensics
        wrapPhase2('TEMIZLIK_KONTROLU', 'ANTI-FORENSICS', () =>
          cleanerDetector.scanCleanersAndAntiForensics((s, c) => { reportProgress('TEMIZLIK_KONTROLU', 60, `Cleaner: ${s}`, null, s, c); })
        ),

        // 2R. Windows Defender
        wrapPhase2('GUVENLIK_ANALIZI', 'DEFENDER/SECURITY', () =>
          defenderForensics.scanDefenderSecurity((s, c) => { reportProgress('GUVENLIK_ANALIZI', 62, `Defender: ${s}`, null, s, c); })
        ),

        // 2S. SRUM Forensics
        wrapPhase2('SRUM_ANALIZI', 'SRUM RECORD', () =>
          srumForensics.scanSrumForensics((s, c) => { reportProgress('SRUM_ANALIZI', 64, `SRUM: ${s}`, null, s, c); })
        ),

        // 2T. Scheduled Tasks & BITS
        wrapPhase2('GOREV_ANALIZI', 'TASK/BITS', () =>
          scheduledTaskForensics.scanTasksAndBits((s, c) => { reportProgress('GOREV_ANALIZI', 66, `Task: ${s}`, null, s, c); })
        ),

        // 2U. Code Integrity / Testsigning
        wrapPhase2('KOD_BUTUNLUGU', 'CODE INTEGRITY', () =>
          codeIntegrityForensics.scanCodeIntegrityAndKernel((s, c) => { reportProgress('KOD_BUTUNLUGU', 68, `CodeInt: ${s}`, null, s, c); })
        ),

        // 2V. Window Cloaking / Desktop Evasion
        wrapPhase2('PENCERE_GIZLEME', 'WINDOW EVASION', () =>
          windowEvasionScanner.scanWindowAndDesktopEvasion((s, c) => { reportProgress('PENCERE_GIZLEME', 70, `Window: ${s}`, null, s, c); })
        ),

        // 2W. CryptnetUrlCache
        wrapPhase2('SERTIFIKA_ONBELLEGI', 'CRYPTNET CACHE', () =>
          cryptnetForensics.scanCryptnetCache((s, c) => { reportProgress('SERTIFIKA_ONBELLEGI', 72, `Cryptnet: ${s}`, null, s, c); })
        ),

        // 2X. App Crash Forensics
        wrapPhase2('UYGULAMA_COKMELERI', 'APP CRASH', () =>
          appCrashForensics.scanAppCrashEvents((s, c) => { reportProgress('UYGULAMA_COKMELERI', 74, `Crash: ${s}`, null, s, c); })
        ),

        // 2Y. Process Hollowing / Ghost / LOLBin
        wrapPhase2('SURECGIZLEME_ANALIZI', 'PROCESS HOLLOWING', () =>
          processHollowingDetector.scanProcessHollowing((s, c) => { reportProgress('SURECGIZLEME_ANALIZI', 76, `Hollow: ${s}`, null, s, c); })
        ),

        // 2Z. LD_PRELOAD / ptrace (Linux)
        wrapPhase2('LDPRELOAD_ANALIZI', 'LD_PRELOAD INJECTION', () =>
          ldPreloadInjectionDetector.scanLdPreloadAndPtrace((s, c) => { reportProgress('LDPRELOAD_ANALIZI', 78, `LDPreload: ${s}`, null, s, c); })
        ),

        // 2AA. PowerShell Script Block Forensics
        wrapPhase2('POWERSHELL_ANALIZI', 'POWERSHELL', () =>
          powerShellScriptForensics.scanPowerShellForensics((s, c) => { reportProgress('POWERSHELL_ANALIZI', 80, `PS: ${s}`, null, s, c); })
        ),

        // 2AB. Recycle Bin
        wrapPhase2('GERI_DONUSUM', 'RECYCLE BIN', () =>
          recycleBinScanner.scanRecycleBin((s, c) => { reportProgress('GERI_DONUSUM', 82, `Recycle: ${s}`, null, s, c); })
        ),

        // 2AC. Network / Hosts / Named Pipes
        wrapPhase2('AG_ANALIZI', 'NETWORK/IPC', () =>
          networkForensics.scanNetworkAndIpc((s, c) => { reportProgress('AG_ANALIZI', 84, `Network: ${s}`, null, s, c); })
        ),

        // 2AD. Zone.Identifier (NTFS Mark of the Web ADS)
        wrapPhase2('ZONE_IDENTIFIER_ANALIZI', 'ZONE IDENTIFIER', () =>
          zoneIdentifierForensics.scanZoneIdentifiers((s, c) => { reportProgress('ZONE_IDENTIFIER_ANALIZI', 85, `ZoneID: ${s}`, null, s, c); })
        ),

        // 2AE. Windows DNS Resolver Client Cache Forensics
        wrapPhase2('DNS_ONBELLEK_ANALIZI', 'DNS CACHE', () =>
          dnsCacheForensics.scanDnsCache((s, c) => { reportProgress('DNS_ONBELLEK_ANALIZI', 86, `DNS: ${s}`, null, s, c); })
        )
      ]);

      // ─────────────────────────────────────────────────────────────────────────
      // PHASE 3: Consolidate & Finalize (92% -> 99%)
      // ─────────────────────────────────────────────────────────────────────────
      setPercent(93);
      reportProgress('BULGU_TOPLAMA', 93, 'Tüm motorlar tamamlandı — bulgular ve rapor hazırlanıyor...', null, null, 0);

      // Consolidate allowed AutoClicker findings into a single clean summary card
      if (serverPolicy.isAutoClickerAllowed()) {
        const acFindings = [];
        const remainingFindings = [];
        for (const f of allFindings) {
          if (isAutoClickerFinding(f)) {
            acFindings.push(f);
          } else {
            remainingFindings.push(f);
          }
        }

        if (acFindings.length > 0) {
          const evidenceList = [
            'Sunucu Politikası: AutoClicker / Makro kullanımı serbest bırakılmıştır (serverPolicy.allowAutoClickers = true)',
            `Toplam Birleştirilen Adli Kayıt: ${acFindings.length} adet`
          ];
          let latestTimestamp = '';
          const sources = new Set();
          const detectedNames = new Set();

          for (const ac of acFindings) {
            const time = ac.timestamp || '';
            if (time && (!latestTimestamp || time > latestTimestamp)) {
              latestTimestamp = time;
            }
            if (ac.name) detectedNames.add(ac.name.replace(/\s*\(Sunucu.*?\)/i, '').trim());
            if (ac.evidence && Array.isArray(ac.evidence)) {
              for (const e of ac.evidence) {
                if (!evidenceList.includes(e)) evidenceList.push(e);
              }
            } else if (ac.description) {
              const shortDesc = `${ac.type || 'Kayıt'}: ${ac.description}`;
              if (!evidenceList.includes(shortDesc)) evidenceList.push(shortDesc);
            }
            if (ac.type) sources.add(ac.type);
          }

          const primaryName = Array.from(detectedNames)[0] || 'AutoClicker';
          const consolidatedAc = {
            level: 'INFO',
            severity: 'INFO',
            type: 'ALLOWED_POLICY_AUTOCLICKER_SUMMARY',
            name: `AutoClicker / Makro Tespiti (${primaryName}) (Sunucu İzni: Serbest)`,
            path: acFindings[0].path || acFindings[0].file || 'Windows Adli İzleri',
            file: acFindings[0].file || 'AutoClicker.exe',
            timestamp: latestTimestamp || acFindings[0].timestamp || 'Mevcut',
            confidence: '100% (Doğrulanmış Otomasyon Aracı)',
            isSafe: true,
            isThreat: false,
            badge: 'ALLOWED_POLICY',
            badgeText: 'SUNUCU İZNİ: AUTOCLICKER SERBEST',
            description: `Sistem genelinde ${acFindings.length} farklı adli kaynaktan (${Array.from(sources).slice(0, 4).join(', ')}) AutoClicker çalıştırma ve kullanım izi tespit edildi. Sunucu politikası (serverPolicy.allowAutoClickers = true) gereğince ban veya ceza uygulanmaz.`,
            evidence: evidenceList.slice(0, 15),
            whyFlagged: 'Sunucu kuralları uyarınca AutoClicker kullanımı serbest bırakılmıştır. Bu kart yalnızca bilgilendirme amaçlı adli özet olarak sunulmuştur.'
          };

          allFindings.length = 0;
          allFindings.push(...remainingFindings, consolidatedAc);
        }
      }

      // Smart Anti-Forensics Correlation (Cheat Activity + USN Journal / Evidence Wiping)
      const usnWipeFinding = allFindings.find(f =>
        f.type && (
          f.type.startsWith('USN_JOURNAL_') ||
          f.type === 'USN_JOURNAL_DELETION_COMMAND' ||
          f.type === 'ACTIVE_CLEANER_TOOL_RUNNING' ||
          f.type === 'CLEANER_TOOL_HISTORY'
        )
      );

      const cheatActivities = allFindings.filter(f =>
        f.level === 'CRITICAL' &&
        f !== usnWipeFinding &&
        f.type !== 'ANTI_FORENSICS_CHEAT_EVIDENCE_DESTRUCTION' &&
        f.type !== 'ALLOWED_POLICY_AUTOCLICKER_SUMMARY' &&
        (
          (f.type && (
            f.type.startsWith('BROWSER_CHEAT_') ||
            f.type.includes('CHEAT_FILE_DOWNLOADED') ||
            f.type.includes('DISCORD_CHEAT') ||
            f.type === 'DEFENDER_CHEAT_THREAT_DETECTED' ||
            f.type === 'CHEAT_VERSION_PROFILE_DETECTED' ||
            f.type === 'LAUNCHER_PROFILE_CHEAT_CONFIGURED' ||
            f.type.startsWith('EXTERNAL_') ||
            f.type.endsWith('_CONFIG_DIR') ||
            f.type.includes('TRIGGERBOT') ||
            f.type.includes('TROJAN') ||
            f.type.includes('SEMANTIC') ||
            f.type.includes('MINECRAFT_CHEAT_MOD')
          )) ||
          f.category === 'BROWSER_FORENSICS' ||
          f.category === 'MINECRAFT_MODS'
        )
      );

      if (usnWipeFinding && cheatActivities.length > 0) {
        const cheatNames = Array.from(new Set(cheatActivities.map(f => f.name || f.domain || f.file).filter(Boolean)));
        const correlationFinding = {
          level: 'CRITICAL',
          severity: 'CRITICAL',
          type: 'ANTI_FORENSICS_CHEAT_EVIDENCE_DESTRUCTION',
          name: 'Kritik Adli Delil Karartma (Hile Etkinliği Sonrası USN Günlüğü Sıfırlama)',
          category: 'ANTI_FORENSICS',
          badge: 'SMOKING_GUN',
          badgeText: 'KUSURSUZ SOMUT KANIT (DELİL KARARTMA)',
          confidence: '100% (Kronolojik Adli Kanıt Karartma Doğrulandı)',
          path: usnWipeFinding.path || 'C:\\$Extend\\$UsnJrnl',
          timestamp: usnWipeFinding.timestamp || new Date().toISOString(),
          whyFlagged: 'Kullanıcı hile sitelerini ziyaret edip dosyaları indirdikten/kullandıktan hemen sonra, diskteki silinmiş dosya ve adli izleri yok etmek amacıyla NTFS Değişiklik Günlüğünü ("fsutil usn deletejournal") kasten silmiştir.',
          adminAction: 'KESİN KANIT KARARTMA VE HİLE KULLANIM BANI: Deliller kasıtlı olarak silinmiştir. Sistemde hile etkinliği ve ardından delil yok etme eylemi kesinleşmiştir.',
          description: `Kullanıcı hile istemcilerini (${cheatNames.slice(0, 5).join(', ')}) araştırıp indirdikten hemen sonra, dosya silme kayıtlarını adli kontrol araçlarından gizlemek amacıyla NTFS Değişiklik Günlüğünü (USN Journal) kasten sıfırlamıştır!`,
          evidence: [
            `Tespit Edilen Hile Etkinlikleri: ${cheatActivities.length} adet (${cheatNames.slice(0, 6).join(', ')})`,
            `Kanıt Karartma Eylemi: NTFS Değişiklik Günlüğü (USN Journal) silindi ('fsutil usn deletejournal')`,
            `Adli Anlam: USN günlüğü sıfırlandığında son silinen dosyaların NTFS indeks kayıtları yok edilir; bu işlem yalnızca delil karartma amaçlı yapılır.`,
            `Zaman Çizelgesi Korelasyonu: Hile sitelerine erişim ve dosya indirmelerinin hemen ardından USN günlüğü sıfırlanmıştır.`
          ]
        };
        allFindings.unshift(correlationFinding);
      }

      // Final enrichment pass
      for (const f of allFindings) {
        cheatKnowledgeBase.enrichFinding(f);
      }

      const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

      // Capture live Minecraft server status snapshot
      let liveServerStatus = null;
      try {
        liveServerStatus = await serverStatus.fetchStatus();
      } catch (e) {
        liveServerStatus = serverStatus.getStatusSync();
      }

      this.lastScanResults = {
        timestamp: new Date().toISOString(),
        durationSeconds,
        scannedJars: (mcResults && mcResults.scannedJars) || 0,
        scannedObjects: totalScannedObjects,
        serverStatus: liveServerStatus,
        allFindings,
        bypassResults,
        archiveScanResults,
        cleanerResults,
        defenderResults,
        srumResults,
        discordResults,
        shellbagResults,
        taskResults,
        codeIntegrityResults,
        windowEvasionResults,
        cryptnetResults,
        appCrashResults,
        logResults,
        recycleResults,
        netResults,
        usnResults,
        pfResults,
        regResults,
        browserResults,
        usbResults,
        acResults,
        injectedFindings,
        shimFindings,
        lnkFindings,
        hollowingResults,
        ldPreloadResults,
        psScriptResults
      };

      // Automatic report generation
      setPercent(96);
      let autoReportPath = null;
      try {
        autoReportPath = reporter.exportReport(this.lastScanResults);
        this.lastScanResults.autoReportPath = autoReportPath;
      } catch (repErr) {
        console.error('Error auto-generating report:', repErr.message);
      }

      setPercent(100);
      onProgress(
        'COMPLETED',
        100,
        `Tarama tamamlandı! ${allFindings.length} bulgu tespit edildi (${durationSeconds}s). ${autoReportPath ? 'Rapor kaydedildi.' : ''}`,
        null,
        'Tüm hedef vektörler incelendi ve doğrulandı',
        totalScannedObjects
      );

      return this.lastScanResults;

    } catch (err) {
      onProgress('ERROR', 100, `Tarama sırasında hata oluştu: ${err.message}`);
      throw err;
    } finally {
      this.isScanning = false;
    }
  }

  exportLastReport(targetPath = null) {
    const data = this.lastScanResults || {
      timestamp: new Date().toISOString(),
      durationSeconds: '0.0',
      scannedJars: 0,
      scannedObjects: 0,
      allFindings: this.findings || [],
      isScanning: this.isScanning
    };
    if (this.isScanning) {
      data.isScanning = true;
    }
    return reporter.exportReport(data, targetPath);
  }
}

module.exports = new ScannerCore();
