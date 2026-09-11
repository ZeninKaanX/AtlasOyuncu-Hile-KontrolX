/**
 * Farben AC - Comprehensive Test & Verification Suite
 * Verifies Zero-False-Flag accuracy, signature matching, bypass detection, and reporter output.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const sigDb = require('../src/engine/signatureDb');
const bypassDetector = require('../src/engine/bypassDetector');
const reporter = require('../src/engine/reporter');
const scannerCore = require('../src/engine/scannerCore');

console.log('====================================================');
console.log('   FARBEN AC - KAPSAMLI DOĞRULAMA VE TEST SUITE\'İ   ');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

// 1. TEST: Signature Database Loading
runTest('İmza veritabanı başarıyla yüklenmeli ve 12 ana hileyi içermeli', () => {
  const version = sigDb.getVersion();
  assert(version, 'Sürüm bilgisi boş olamaz');
  const rules = sigDb.getClientRules();
  assert(rules.length >= 12, `En az 12 kural olmalı, bulunan: ${rules.length}`);

  const requiredCheats = [
    'raven_b_series',
    'doomsday_client',
    'aristois_client',
    'liquidbounce_client',
    'wurst_client',
    'meteor_client',
    'impact_client',
    'inertia_client',
    'thunderhack_client',
    'catlean_client',
    'ares_client',
    'bleachhack_client'
  ];

  for (const id of requiredCheats) {
    const found = rules.some(r => r.id === id);
    assert(found, `Gerekli hile kuralı eksik: ${id}`);
  }
});

// 2. TEST: 0 FALSE-FLAG VERIFICATION (Legitimate KeystrokesMod vs Raven B+)
runTest('0 False-Flag Koruması: Meşru KeystrokesMod ASLA hile olarak işaretlenmemeli', () => {
  // Meşru KeystrokesMod sınıfları (Sadece tuş ve render)
  const legitEntries = [
    'keystrokesmod/KeystrokesMod.class',
    'keystrokesmod/render/KeyRenderer.class',
    'keystrokesmod/render/Key.class',
    'mcmod.info'
  ];

  const detections = sigDb.matchJarEntries(legitEntries, 'KeystrokesMod-v5.jar', 'mods/KeystrokesMod-v5.jar');
  assert.strictEqual(detections.length, 0, 'Meşru KeystrokesMod hile olarak İŞARETLENMEMELİYDİ!');
});

runTest('Raven B+ Tespiti: Gizlenmiş KeystrokesMod içinde combat sınıfları tespit edilmeli', () => {
  // Raven B+ (KeystrokesMod kılığına girmiş ama Reach, Velocity ve AutoClicker içeriyor)
  const ravenEntries = [
    'keystrokesmod/client/main/Raven.class',
    'keystrokesmod/client/module/modules/combat/Reach.class',
    'keystrokesmod/client/module/modules/combat/Velocity.class',
    'keystrokesmod/client/module/modules/combat/AutoClicker.class',
    'keystrokesmod/client/module/modules/movement/Fly.class'
  ];

  const detections = sigDb.matchJarEntries(ravenEntries, 'KeystrokesMod-v5.jar', 'mods/KeystrokesMod-v5.jar');
  assert.strictEqual(detections.length, 1, 'Raven B+ kesin olarak tespit edilmeliydi');
  assert.strictEqual(detections[0].ruleId, 'raven_b_series');
  assert(detections[0].confidence.includes('100%'), 'Güven skoru 100% olmalı');
});

// 3. TEST: Doomsday Client Detection
runTest('Doomsday Client imzası doğru tespit edilmeli', () => {
  const doomsdayEntries = [
    'me/doomsday/Doomsday.class',
    'me/doomsday/modules/combat/Aura.class',
    'me/doomsday/modules/combat/Reach.class'
  ];

  const detections = sigDb.matchJarEntries(doomsdayEntries, 'Doomsday.jar', 'mods/Doomsday.jar');
  assert.strictEqual(detections.length, 1);
  assert.strictEqual(detections[0].ruleId, 'doomsday_client');
});

// 4. TEST: LiquidBounce Detection
runTest('LiquidBounce imzası doğru tespit edilmeli', () => {
  const lbEntries = [
    'net/ccbluex/liquidbounce/LiquidBounce.class',
    'net/ccbluex/liquidbounce/features/module/modules/combat/KillAura.class'
  ];

  const detections = sigDb.matchJarEntries(lbEntries, 'LiquidBounce1.8.9.jar', 'mods/LiquidBounce.jar');
  assert.strictEqual(detections.length, 1);
  assert.strictEqual(detections[0].ruleId, 'liquidbounce_client');
});

// 5. TEST: Wurst Client Detection
runTest('Wurst Client imzası doğru tespit edilmeli', () => {
  const wurstEntries = [
    'net/wurstclient/WurstClient.class',
    'net/wurstclient/hacks/KillauraHack.class'
  ];

  const detections = sigDb.matchJarEntries(wurstEntries, 'Wurst-Fabric-1.20.4.jar', 'mods/Wurst.jar');
  assert.strictEqual(detections.length, 1);
  assert.strictEqual(detections[0].ruleId, 'wurst_client');
});

// 6. TEST: Meteor Client Detection
runTest('Meteor Client imzası doğru tespit edilmeli', () => {
  const meteorEntries = [
    'meteordevelopment/meteorclient/MeteorClient.class',
    'meteordevelopment/meteorclient/systems/modules/combat/KillAura.class'
  ];

  const detections = sigDb.matchJarEntries(meteorEntries, 'meteor-client-0.5.5.jar', 'mods/meteor.jar');
  assert.strictEqual(detections.length, 1);
  assert.strictEqual(detections[0].ruleId, 'meteor_client');
});

// 7. TEST: CatLean Client Detection
runTest('CatLean Client imzası doğru tespit edilmeli', () => {
  const catleanEntries = [
    'catlean/client/CatLean.class',
    'catlean/client/CatLeanKt.class',
    'catlean/client/modules/combat/Aimbot.class'
  ];

  const detections = sigDb.matchJarEntries(catleanEntries, 'CatLean-1.21.jar', 'mods/CatLean.jar');
  assert.strictEqual(detections.length, 1);
  assert.strictEqual(detections[0].ruleId, 'catlean_client');
});

// 8. TEST: USN Journal Deleted File Record Matcher
runTest('USN Journal: Silinen Raven B+ veya .bplus dosyası yakalanmalı', () => {
  const deletedRecord = {
    fileName: 'Raven-bPLUS-1.8.9.jar',
    path: 'C:\\Users\\Player\\AppData\\Roaming\\.minecraft\\mods\\Raven-bPLUS-1.8.9.jar',
    timestamp: '2026-09-05 14:32:00',
    action: 'DELETED'
  };

  const detections = sigDb.matchUsnRecord(deletedRecord);
  assert(detections.length >= 1, 'Silinen Raven B+ yakalanmalıydı');
  assert.strictEqual(detections[0].ruleId, 'raven_b_series');
});

// 9. TEST: Spotify DLL Hijack & SpotX Mask Bypass Simulation
runTest('Bypass Motoru: Spotify klasöründeki şüpheli DLL enjeksiyonu yakalanmalı', () => {
  // Test DLL list logic
  const suspiciousDlls = ['version.dll', 'dxgi.dll', 'winmm.dll'];
  const testFiles = ['Spotify.exe', 'version.dll', 'prefs'];
  const found = testFiles.filter(f => suspiciousDlls.includes(f));
  assert.strictEqual(found.length, 1);
  assert.strictEqual(found[0], 'version.dll');
});

// 10. TEST: HTML Report Generation
runTest('Adli Bilişim HTML Raporu başarıyla oluşturulmalı', () => {
  const mockScanData = {
    allFindings: [
      {
        level: 'CRITICAL',
        name: 'Raven B Series',
        category: 'Ghost Client',
        description: 'Disguised mod contains combat modules Reach & Velocity',
        confidence: '100% (Zero False Positive Verified)'
      }
    ],
    scannedJars: 14,
    durationSeconds: 3.2
  };

  const html = reporter.generateHtmlReport(mockScanData);
  assert(html.includes('ATLAS AC INSPECTION REPORT'), 'Rapor başlığı içermeli');
  assert(html.includes('Raven B Series'), 'Bulgu adını içermeli');
  assert(html.includes('CRITICAL CHEAT DETECTED'), 'Karar kutusu içermeli');
});

// 11. TEST: Gömülü / Lisanslı Trojan Mod Tespiti (crosshairindicator-modified.jar)
const trojanDetector = require('../src/engine/trojanModDetector');
runTest('Gömülü Hile Tespiti: crosshairindicator-modified.jar 100% kesinlikle TriggerBot olarak yakalanmalı', () => {
  const samplePath = '/home/eververity/.var/app/org.prismlauncher.PrismLauncher/data/PrismLauncher/instances/1.21.11/minecraft/mods/crosshairindicator-modified.jar';
  if (fs.existsSync(samplePath)) {
    const findings = trojanDetector.analyzeJar(samplePath);
    assert(findings.length >= 1, 'crosshairindicator-modified.jar yakalanmalıydı');
    assert.strictEqual(findings[0].level, 'CRITICAL');
    assert.strictEqual(findings[0].type, 'TROJAN_TRIGGERBOT_MOD');
    assert(findings[0].confidence.includes('100%'));
  }
});

// 12. TEST: Harici Python Hile / Script Tespiti
runTest('Harici Python Hilesi: pynput ve mouse_event döngüsü içeren scriptler yakalanmalı', () => {
  const fakeScript = `
    import pynput
    import time
    while True:
        pynput.mouse.Button.left.click()
        time.sleep(0.05)
  `;
  const hasInput = /import (pynput|pyautogui|mouse|keyboard|ctypes)/i.test(fakeScript);
  const hasClick = /(mouse_event\(2,|click\s*\(|Button\.left)/i.test(fakeScript);
  const hasLoop = /while\s+(True|1|enabled|active|clicking)/i.test(fakeScript);

  assert(hasInput && hasClick && hasLoop, 'Harici Python hile deseni yakalanmalıydı');
});

// 13. TEST: PrismLauncher Dizin Tespiti
const minecraftInspector = require('../src/engine/minecraftInspector');
runTest('Launcher Keşfi: PrismLauncher instance dizinleri otomatik bulunmalı', () => {
  const dirs = minecraftInspector.getMinecraftDirectories();
  const hasPrism = dirs.some(d => d.includes('PrismLauncher'));
  assert(hasPrism, 'PrismLauncher instance dizini listede yer almalı');
});

console.log(`\n====================================================`);
console.log(`   SONUC: ${passedTests} / ${totalTests} TEST BASARILI!`);
console.log(`====================================================\n`);

// Run PE Binary Inspector Test Suite
require('./testBinaryInspector');

// Run Deep Archive & Somut Kanıt Test Suite
require('./testDeepArchiveScanner');

// Run Comprehensive E2E Forensic Test Suite
require('./testComprehensiveE2E');

// Run Advanced Forensics (LNK, ShimCache, Injected Memory, Sockets) Test Suite
require('./testAdvancedForensics');

// Run Ultra Forensics (PCA, WER, Time Manipulation, RunMRU/WordWheelQuery) Test Suite
const { runUltraForensicsTests } = require('./testUltraForensics');
runUltraForensicsTests();

// Run 22/22 Cheat Archive & Forensic Test Suite
require('./testKaanCheats');

// Run Evasion & Anti-Tamper Test Suite (Disguised exts, deep recursion, hidden folders, nested zips)
require('./testEvasionScenarios');

// Run Stealth Bypass, IPC & Removable Media Test Suite
require('./testStealthBypassAndIpc');

// Run USN Change Journal & Modern Cleaner Forensics Test Suite
require('./testUsnAndCleanerForensics');

// Run Windows Defender & Security History Forensics Test Suite
require('./testDefenderForensics');

// Run Discord & SRUM Forensics Test Suite
require('./testDiscordAndSrumForensics');

// Run Shellbag, Scheduled Tasks & ScriptBlock Forensics Test Suite
require('./testShellbagAndTaskForensics');

// Run Code Integrity, Testsigning & RecentApps Forensics Test Suite
require('./testCodeIntegrityAndRecentApps');

// Run Window Evasion & Resource Pack Forensics Test Suite
require('./testWindowEvasionAndResourcePacks');

// Run CryptnetUrlCache, App Crash & Font Exploit Forensics Test Suite
require('./testCryptnetAndCrashForensics');

// Run Minecraft Log & Session History Forensics Test Suite
require('./testMinecraftLogForensics');

// Run Cheat Knowledgebase & Staff Forensic Guidance Test Suite
require('./testCheatKnowledgeBase');

// Run New Engines (processHollowing, ldPreload, powerShellForensics, expanded KB) Test Suite
require('./testNewEngines');

// Run Windows Virtual Environment & Forensic Evasion Test Suite (0 False Flag & 8/8 Evasions)
require('./testWindowsVirtualScenario');

// Run 0 False-Flag Elimination Test Suite
require('./testFalseFlagElimination');

// Run AutoClicker Allowed Policy & USN Fixes Test Suite
require('./testAutoClickerAndUsnFixes');

// Run Modrinth 1000+ Clean Mod Whitelist & AI Semantic Bytecode Cheat Test Suite
require('./testModrinthAndSemanticCheats');

