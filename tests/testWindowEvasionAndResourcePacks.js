/**
 * Atlas AC - Window Evasion & Resource Pack Forensics Unit Test Suite
 * Validates:
 * 1. WDA_EXCLUDEFROMCAPTURE (0x11) detected as WINDOW_CLOAKED_FROM_SCREENSHARE
 * 2. WDA_MONITOR (0x01) detected as WINDOW_MONITOR_AFFINITY_SET
 * 3. 0 False-Flag: Normal window display affinity (0) returns null
 * 4. Multi-Virtual Desktop: Count > 1 detected as MULTI_VIRTUAL_DESKTOP_ACTIVE
 * 5. 0 False-Flag: Single virtual desktop (1) returns 0 findings
 * 6. Resource Pack Forensics: .class bytecode detected as RESOURCEPACK_HIDDEN_JAVA_CLASSES
 * 7. Resource Pack Forensics: .exe/.dll binary detected as RESOURCEPACK_HIDDEN_PE_EXECUTABLE
 * 8. 0 False-Flag: Legitimate resource packs (textures, sounds, models) remain 100% clean
 */

const assert = require('assert');
const windowEvasionScanner = require('../src/engine/windowEvasionScanner');

console.log('====================================================');
console.log('   ATLAS AC - WINDOW EVASION & RESOURCE PACK SUITE  ');
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

// 1. TEST: WDA_EXCLUDEFROMCAPTURE (0x11) Detection
runTest('Pencere Gizleme: WDA_EXCLUDEFROMCAPTURE (0x11) CRITICAL olarak yakalanmalı', () => {
  const finding = windowEvasionScanner.evaluateAffinity(0x11, 'Vape v4 Overlay', 'vape.exe', 1234);
  assert.ok(finding);
  assert.strictEqual(finding.type, 'WINDOW_CLOAKED_FROM_SCREENSHARE');
  assert.strictEqual(finding.level, 'CRITICAL');
  assert.strictEqual(finding.pid, 1234);
});

// 2. TEST: WDA_MONITOR (0x01) Detection
runTest('Pencere Kısıtlama: WDA_MONITOR (0x01) HIGH olarak yakalanmalı', () => {
  const finding = windowEvasionScanner.evaluateAffinity(0x01, 'Secondary Window', 'overlay.exe', 5678);
  assert.ok(finding);
  assert.strictEqual(finding.type, 'WINDOW_MONITOR_AFFINITY_SET');
  assert.strictEqual(finding.level, 'HIGH');
});

// 3. TEST: 0 False-Flag Normal Window Display Affinity (0)
runTest('0 False-Flag: Normal pencereler (Affinity = 0) kesinlikle temiz kalmalı', () => {
  assert.strictEqual(windowEvasionScanner.evaluateAffinity(0, 'Minecraft 1.8.9', 'javaw.exe', 9999), null);
  assert.strictEqual(windowEvasionScanner.evaluateAffinity(null), null);
});

// 4. TEST: Multi-Virtual Desktop Detection
runTest('Sanal Masaüstü: 3 sanal masaüstü aktif olduğunda uyarı üretilmeli', () => {
  const findings = windowEvasionScanner.evaluateVirtualDesktops(3, 0);
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].type, 'MULTI_VIRTUAL_DESKTOP_ACTIVE');
  assert.strictEqual(findings[0].level, 'HIGH');
  assert.strictEqual(findings[0].desktopCount, 3);
});

// 5. TEST: 0 False-Flag Single Virtual Desktop
runTest('0 False-Flag: Tek sanal masaüstü (1) alarm üretmemeli', () => {
  const findings = windowEvasionScanner.evaluateVirtualDesktops(1, 0);
  assert.strictEqual(findings.length, 0);
});

// 6. TEST: Resource Pack Hidden .class Bytecode
runTest('Resource Pack: .class dosyası barındıran paket CRITICAL olarak yakalanmalı', () => {
  const fakeEntries = [
    'pack.mcmeta',
    'assets/minecraft/textures/gui/icons.png',
    'keystrokes/raven/module/combat/Reach.class'
  ];

  const findings = windowEvasionScanner.evaluateResourcePackClasses(fakeEntries, 'C:\\Users\\User\\AppData\\Roaming\\.minecraft\\resourcepacks\\Faithful_Fake.zip');
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].type, 'RESOURCEPACK_HIDDEN_JAVA_CLASSES');
  assert.strictEqual(findings[0].level, 'CRITICAL');
});

// 7. TEST: Resource Pack Hidden PE Executable
runTest('Resource Pack: .exe veya .dll ikili dosyası barındıran paket CRITICAL olarak yakalanmalı', () => {
  const fakeEntries = [
    'pack.mcmeta',
    'assets/minecraft/textures/gui/icons.png',
    'assets/minecraft/loader.exe'
  ];

  const findings = windowEvasionScanner.evaluateResourcePackClasses(fakeEntries, 'C:\\Users\\User\\AppData\\Roaming\\.minecraft\\resourcepacks\\PVP_Pack.zip');
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].type, 'RESOURCEPACK_HIDDEN_PE_EXECUTABLE');
  assert.strictEqual(findings[0].level, 'CRITICAL');
});

// 8. TEST: 0 False-Flag Legitimate Resource Pack
runTest('0 False-Flag: Gerçek doku paketi (yalnızca png, mcmeta, json, ogg) temiz kalmalı', () => {
  const cleanEntries = [
    'pack.mcmeta',
    'pack.png',
    'assets/minecraft/textures/gui/icons.png',
    'assets/minecraft/sounds/ambient/cave/cave1.ogg',
    'assets/minecraft/models/item/diamond_sword.json'
  ];

  const findings = windowEvasionScanner.evaluateResourcePackClasses(cleanEntries, 'C:\\Users\\User\\AppData\\Roaming\\.minecraft\\resourcepacks\\CleanPack.zip');
  assert.strictEqual(findings.length, 0);
});

console.log('\n====================================================');
console.log(`   SONUC: ${passedTests} / ${totalTests} TEST BASARILI!`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
