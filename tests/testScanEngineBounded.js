/**
 * Atlas AC - Focused Regression Tests: Bounded Engine Execution & Honest
 * Scan Completion
 *
 * Regression for: Windows scans stopping at ~88% (the DPS/JVM/DNS engines)
 * after a large object count, caused by a child_process.exec promise that
 * never settles, freezing the orchestrator's Promise.all forever with no
 * progress, no error, and no honest result.
 *
 * Verified here:
 *   1. guardedExec always settles (even for children that ignore the
 *      exec-level SIGTERM timeout - the Windows descendant hang class).
 *   2. The orchestrator bounds every Phase 2 engine with a hard deadline; a
 *      hung engine no longer freezes the scan.
 *   3. An incomplete scan is reported honestly: INCOMPLETE scanStatus, a
 *      SCAN_ENGINE_TIMEOUT finding, and a COMPLETED message that does not
 *      claim a clean result.
 */

'use strict';

const assert = require('assert');

let totalTests = 0;
let passedTests = 0;

function ok(cond, message) {
  totalTests++;
  if (cond) {
    passedTests++;
    console.log(`[PASS] ${message}`);
  } else {
    console.error(`[FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. guardedExec units
// ─────────────────────────────────────────────────────────────────────────────
const execGuarded = require('../src/engine/guardedExec');

async function testGuardedExecResolvesNormalCommand() {
  const { stdout } = await execGuarded('printf ok', { timeout: 5000 });
  ok(stdout.replace(/\n/g, '') === 'ok', 'guardedExec resolves a normal fast command');
}

async function testGuardedExecSettlesOnUnkillableChild() {
  if (process.platform === 'win32') {
    ok(true, 'guardedExec hang test skipped on win32 (sh not available)');
    return;
  }
  // Child ignores SIGTERM and exec()s sleep, so exec's own `timeout` kill is
  // ignored and a plain promisified exec hangs forever (verified repro). The
  // guard must force-kill and reject with SCAN_EXEC_TIMEOUT within a bounded
  // window instead of hanging.
  const cmd = 'sh -c \'trap "" TERM; exec sleep 90\'';
  const start = Date.now();
  let rejected = null;
  try {
    await execGuarded(cmd, { timeout: 1500 });
  } catch (err) {
    rejected = err;
  }
  const elapsed = Date.now() - start;
  ok(rejected && rejected.code === 'SCAN_EXEC_TIMEOUT', 'guardedExec rejects with SCAN_EXEC_TIMEOUT instead of hanging');
  ok(elapsed < 8000, `guardedExec settles within a bounded window (${elapsed} ms)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Orchestrator integration (all engines stubbed; one victim hangs)
// ─────────────────────────────────────────────────────────────────────────────
const scannerCore = require('../src/engine/scannerCore');

const engineModules = {
  updater: require('../src/engine/updater'),
  bypassDetector: require('../src/engine/bypassDetector'),
  memoryScanner: require('../src/engine/memoryScanner'),
  unloadedModulesScanner: require('../src/engine/unloadedModulesScanner'),
  minecraftInspector: require('../src/engine/minecraftInspector'),
  minecraftLogForensics: require('../src/engine/minecraftLogForensics'),
  usnJournal: require('../src/engine/usnJournal'),
  prefetch: require('../src/engine/prefetch'),
  registryForensics: require('../src/engine/registryForensics'),
  shimCacheScanner: require('../src/engine/shimCacheScanner'),
  lnkForensics: require('../src/engine/lnkForensics'),
  pcaScanner: require('../src/engine/pcaScanner'),
  werCrashScanner: require('../src/engine/werCrashScanner'),
  runHistoryForensics: require('../src/engine/runHistoryForensics'),
  timeManipulationDetector: require('../src/engine/timeManipulationDetector'),
  shellbagForensics: require('../src/engine/shellbagForensics'),
  deepArchiveScanner: require('../src/engine/deepArchiveScanner'),
  browserForensics: require('../src/engine/browserForensics'),
  discordForensics: require('../src/engine/discordForensics'),
  usbTracker: require('../src/engine/usbTracker'),
  autoclickerMacro: require('../src/engine/autoclickerMacro'),
  pythonCheatDetector: require('../src/engine/pythonCheatDetector'),
  cleanerDetector: require('../src/engine/cleanerDetector'),
  defenderForensics: require('../src/engine/defenderForensics'),
  srumForensics: require('../src/engine/srumForensics'),
  scheduledTaskForensics: require('../src/engine/scheduledTaskForensics'),
  codeIntegrityForensics: require('../src/engine/codeIntegrityForensics'),
  windowEvasionScanner: require('../src/engine/windowEvasionScanner'),
  cryptnetForensics: require('../src/engine/cryptnetForensics'),
  appCrashForensics: require('../src/engine/appCrashForensics'),
  processHollowingDetector: require('../src/engine/processHollowingDetector'),
  ldPreloadInjectionDetector: require('../src/engine/ldPreloadInjectionDetector'),
  powerShellScriptForensics: require('../src/engine/powerShellScriptForensics'),
  recycleBinScanner: require('../src/engine/recycleBinScanner'),
  networkForensics: require('../src/engine/networkForensics'),
  zoneIdentifierForensics: require('../src/engine/zoneIdentifierForensics'),
  dnsCacheForensics: require('../src/engine/dnsCacheForensics'),
  jvmAttachDetector: require('../src/engine/jvmAttachDetector'),
  dpsScanner: require('../src/engine/dpsScanner'),
  serverStatus: require('../src/engine/serverStatus'),
  reporter: require('../src/engine/reporter')
};

const PHASE2_FAST = { status: 'CLEAN', findings: [] };

const STUBS = {
  updater: { checkForUpdates: async () => ({ updated: false, message: 'test: güncel' }) },
  bypassDetector: { scanAllBypasses: async () => ({}) },
  memoryScanner: { scanProcesses: async () => ({}) },
  unloadedModulesScanner: { scanInjectedGhostClients: async () => [] },
  minecraftInspector: { scanMinecraft: async () => ({ scannedJars: 0 }) },
  minecraftLogForensics: { scanMinecraftLogs: async () => [] },
  usnJournal: { scanDrive: async () => PHASE2_FAST },
  prefetch: { scanPrefetch: async () => PHASE2_FAST },
  registryForensics: { scanRegistry: async () => PHASE2_FAST },
  shimCacheScanner: { scanShimCache: async () => PHASE2_FAST },
  lnkForensics: { scanAllRecent: async () => PHASE2_FAST },
  pcaScanner: { scanPcaLogs: async () => PHASE2_FAST },
  werCrashScanner: { scanCrashes: async () => PHASE2_FAST },
  runHistoryForensics: { scanHistory: async () => PHASE2_FAST },
  timeManipulationDetector: { scanTimeManipulation: async () => PHASE2_FAST },
  shellbagForensics: { scanShellbags: async () => PHASE2_FAST },
  deepArchiveScanner: { scanAllLocations: async () => PHASE2_FAST },
  browserForensics: { scanAllBrowsers: async () => PHASE2_FAST },
  discordForensics: { scanDiscordForensics: async () => PHASE2_FAST },
  usbTracker: { scanUsbHistory: async () => PHASE2_FAST },
  autoclickerMacro: { scanAutoClickersAndMacros: async () => PHASE2_FAST },
  pythonCheatDetector: { scanPythonCheats: async () => PHASE2_FAST },
  cleanerDetector: { scanCleanersAndAntiForensics: async () => PHASE2_FAST },
  defenderForensics: { scanDefenderSecurity: async () => PHASE2_FAST },
  srumForensics: { scanSrumForensics: async () => PHASE2_FAST },
  scheduledTaskForensics: { scanTasksAndBits: async () => PHASE2_FAST },
  codeIntegrityForensics: { scanCodeIntegrityAndKernel: async () => PHASE2_FAST },
  windowEvasionScanner: { scanWindowAndDesktopEvasion: async () => PHASE2_FAST },
  cryptnetForensics: { scanCryptnetCache: async () => PHASE2_FAST },
  appCrashForensics: { scanAppCrashEvents: async () => PHASE2_FAST },
  processHollowingDetector: { scanProcessHollowing: async () => PHASE2_FAST },
  ldPreloadInjectionDetector: { scanLdPreloadAndPtrace: async () => PHASE2_FAST },
  powerShellScriptForensics: { scanPowerShellForensics: async () => PHASE2_FAST },
  recycleBinScanner: { scanRecycleBin: async () => PHASE2_FAST },
  networkForensics: { scanNetworkAndIpc: async () => PHASE2_FAST },
  zoneIdentifierForensics: { scanZoneIdentifiers: async () => PHASE2_FAST },
  dnsCacheForensics: { scanDnsCache: async () => PHASE2_FAST },
  jvmAttachDetector: { scanJvmInjection: async () => PHASE2_FAST },
  dpsScanner: { scanDpsForensics: async () => PHASE2_FAST },
  serverStatus: { fetchStatus: async () => ({ online: false }) },
  reporter: { exportReport: () => null }
};

const stubOriginals = new Map();

function installStubs() {
  for (const [name, entries] of Object.entries(STUBS)) {
    const mod = engineModules[name];
    if (!mod) throw new Error(`Unknown engine module in test stubs: ${name}`);
    for (const [method, stub] of Object.entries(entries)) {
      const key = `${name}.${method}`;
      stubOriginals.set(key, { target: mod, method, original: mod[method] });
      mod[method] = stub;
    }
  }
}

function restoreStubs() {
  for (const { target, method, original } of stubOriginals.values()) {
    target[method] = original;
  }
  stubOriginals.clear();
}

async function runScanCollectingProgress() {
  const events = [];
  const result = await scannerCore.runFullScan((stage, percent, log, finding, target, objectsCount) => {
    events.push({ stage, percent, log, finding, target, objectsCount });
  });
  return { result, events };
}

function isMonotonic(events) {
  let prev = -1;
  for (const ev of events) {
    if (ev.percent < prev) return false;
    prev = ev.percent;
  }
  return true;
}

async function testCleanScanCompletesFully() {
  installStubs();
  try {
    const { result, events } = await runScanCollectingProgress();
    const hasEngineIssueFinding = result.allFindings.some(
      (f) => f.type === 'SCAN_ENGINE_TIMEOUT' || f.type === 'SCAN_ENGINE_ERROR'
    );
    ok(result.scanStatus === 'COMPLETE', 'all-fine scan reports scanStatus COMPLETE');
    ok(result.incompleteEngines.length === 0, 'all-fine scan has zero incomplete engines');
    ok(!hasEngineIssueFinding, 'all-fine scan has no SCAN_ENGINE_* findings');
    const completed = events[events.length - 1];
    ok(completed && completed.stage === 'COMPLETED' && completed.percent === 100, 'all-fine scan reaches COMPLETED at 100%');
    ok(isMonotonic(events), 'progress is monotonic (non-decreasing)');
  } finally {
    restoreStubs();
  }
}

async function testHungEngineIsBoundedAndHonest() {
  // The engine that last reports progress before the historical ~88% stall:
  // DPS (DPS_PERFORMANS_ANALIZI). Make it hang forever.
  const savedBudget = scannerCore.constructor.PHASE2_ENGINE_BUDGET_MS;
  scannerCore.constructor.PHASE2_ENGINE_BUDGET_MS = 1500;
  installStubs();
  engineModules.dpsScanner.scanDpsForensics = () => new Promise(() => {});
  try {
    const start = Date.now();
    const { result, events } = await runScanCollectingProgress();
    const elapsed = Date.now() - start;

    ok(elapsed < 15000, `scan completes bounded despite hung engine (${elapsed} ms)`);
    ok(result.scanStatus === 'INCOMPLETE', 'hung engine scan reports scanStatus INCOMPLETE (not clean)');
    ok(result.incompleteEngines.some((s) => s.label === 'DPS DIAGNOSTICS'), 'DPS DIAGNOSTICS listed among incomplete engines');
    ok(result.engineStatuses.some((s) => s.stage === 'DPS_PERFORMANS_ANALIZI' && s.status === 'TIMEOUT'), 'DPS engine recorded with TIMEOUT status');

    const timeoutFinding = result.allFindings.find((f) => f.type === 'SCAN_ENGINE_TIMEOUT');
    ok(timeoutFinding && /DPS DIAGNOSTICS/.test(timeoutFinding.name || ''), 'a SCAN_ENGINE_TIMEOUT finding names the hung engine');

    const completed = events[events.length - 1];
    ok(completed && completed.stage === 'COMPLETED', 'scan still emits a final COMPLETED event');
    ok(completed && completed.percent === 100, 'progress reaches 100% (no stall at 88%)');
    ok(/TAMAMLANMADI/.test(completed.log || ''), 'COMPLETED message honestly states the scan is incomplete');
    ok(isMonotonic(events), 'progress is monotonic (non-decreasing)');
  } finally {
    scannerCore.constructor.PHASE2_ENGINE_BUDGET_MS = savedBudget;
    restoreStubs();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await testGuardedExecResolvesNormalCommand();
    await testGuardedExecSettlesOnUnkillableChild();
    await testCleanScanCompletesFully();
    await testHungEngineIsBoundedAndHonest();
  } catch (err) {
    console.error('[FAIL] testScanEngineBounded threw:', err);
    process.exitCode = 1;
    throw err;
  } finally {
    console.log(`\n[SCAN-ENGINE-BOUNDED] ${passedTests} / ${totalTests} passed`);
    if (passedTests !== totalTests) process.exitCode = 1;
  }
})();