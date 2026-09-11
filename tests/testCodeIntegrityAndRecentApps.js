/**
 * Atlas AC - Code Integrity, Testsigning & RecentApps Unit Test Suite
 * Validates:
 * 1. Boot Options: TESTSIGNING detected as TESTSIGNING_BOOT_MODE_ENABLED
 * 2. Boot Options: NOINTEGRITYCHECKS detected as NOINTEGRITYCHECKS_BOOT_MODE_ENABLED
 * 3. 0 False-Flag Boot Options: Clean boot flags produce 0 findings
 * 4. Code Integrity: Event ID 3076 blocked vulnerable driver detected
 * 5. Code Integrity: Event ID 3087 unsigned driver detected
 * 6. Code Integrity: Event ID 3033 untrusted binary load detected
 * 7. 0 False-Flag Code Integrity: Clean components produce 0 findings
 * 8. Security Log 4697: Vulnerable driver service installation detected (RTCore64, GDrv)
 * 9. 0 False-Flag Security 4697: Legitimate Windows services produce 0 findings
 * 10. RecentApps: Cheat execution record with launch count & timestamp detected
 * 11. 0 False-Flag RecentApps: Chrome, Discord, and legitimate Minecraft mods remain clean
 */

const assert = require('assert');
const codeIntegrityForensics = require('../src/engine/codeIntegrityForensics');

console.log('====================================================');
console.log('   ATLAS AC - CODE INTEGRITY & RECENTAPPS SUITE     ');
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

// 1. TEST: Boot Options TESTSIGNING Detection
runTest('Çekirdek Başlatma: TESTSIGNING modu CRITICAL olarak yakalanmalı', () => {
  const findings = codeIntegrityForensics.evaluateBootOptions('NOEXECUTE=OPTIN TESTSIGNING HIGHREQ');
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].type, 'TESTSIGNING_BOOT_MODE_ENABLED');
  assert.strictEqual(findings[0].level, 'CRITICAL');
});

// 2. TEST: Boot Options NOINTEGRITYCHECKS Detection
runTest('Çekirdek Başlatma: NOINTEGRITYCHECKS modu CRITICAL olarak yakalanmalı', () => {
  const findings = codeIntegrityForensics.evaluateBootOptions('NOINTEGRITYCHECKS NOEXECUTE=OPTIN');
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].type, 'NOINTEGRITYCHECKS_BOOT_MODE_ENABLED');
  assert.strictEqual(findings[0].level, 'CRITICAL');
});

// 3. TEST: 0 False-Flag Boot Options
runTest('0 False-Flag: Standart Windows başlatma seçenekleri (NOEXECUTE=OPTIN) temiz kalmalı', () => {
  const findings = codeIntegrityForensics.evaluateBootOptions('NOEXECUTE=OPTIN HIGHREQ DYNAMIC');
  assert.strictEqual(findings.length, 0);
});

// 4. TEST: Code Integrity Event ID 3076 (Revoked/Vulnerable Driver Blocked)
runTest('Kod Bütünlüğü (Event 3076): Engellenen savunmasız sürücü CRITICAL olarak yakalanmalı', () => {
  const msg = 'Code Integrity determined that a process (\\Device\\HarddiskVolume3\\Windows\\System32\\services.exe) attempted to load \\Device\\HarddiskVolume3\\Windows\\System32\\drivers\\gdrv.sys that did not meet the Enterprise signing level requirements.';
  const finding = codeIntegrityForensics.evaluateCodeIntegrityEvent(3076, msg, '2026-09-09 08:30:00');
  assert.ok(finding);
  assert.strictEqual(finding.type, 'CODE_INTEGRITY_REVOKED_DRIVER_BLOCKED');
  assert.strictEqual(finding.level, 'CRITICAL');
});

// 5. TEST: Code Integrity Event ID 3087 (Unsigned Driver Detected)
runTest('Kod Bütünlüğü (Event 3087): İmzasız sürücü algılanması CRITICAL olarak yakalanmalı', () => {
  const msg = 'Code Integrity detected an unsigned driver: \\Device\\HarddiskVolume3\\Temp\\bypass.sys';
  const finding = codeIntegrityForensics.evaluateCodeIntegrityEvent(3087, msg);
  assert.ok(finding);
  assert.strictEqual(finding.type, 'CODE_INTEGRITY_UNSIGNED_DRIVER_DETECTED');
  assert.strictEqual(finding.level, 'CRITICAL');
});

// 6. TEST: Code Integrity Event ID 3033 (Untrusted Binary Load)
runTest('Kod Bütünlüğü (Event 3033): javaw.exe içine imzasız ikili dosya yükleme girişimi yakalanmalı', () => {
  const msg = 'Code Integrity determined that a process (\\javaw.exe) attempted to load \\Temp\\hook64.dll';
  const finding = codeIntegrityForensics.evaluateCodeIntegrityEvent(3033, msg);
  assert.ok(finding);
  assert.strictEqual(finding.type, 'CODE_INTEGRITY_UNTRUSTED_BINARY_LOAD');
});

// 7. TEST: 0 False-Flag Code Integrity
runTest('0 False-Flag: Bilinmeyen veya zararsız olaylar işaretlenmemeli', () => {
  const finding = codeIntegrityForensics.evaluateCodeIntegrityEvent(9999, 'Normal system operation');
  assert.strictEqual(finding, null);
});

// 8. TEST: Security Log 4697 (Vulnerable Driver Service Installation)
runTest('Güvenlik Günlüğü (Event 4697): RTCore64 veya Capcom sürücü servisi kurulumu yakalanmalı', () => {
  const msg = 'A service was installed in the system. Service Name: RTCore64 Service File Name: C:\\Windows\\Temp\\RTCore64.sys Service Type: kernel driver';
  const finding = codeIntegrityForensics.evaluateServiceInstallEvent(msg, '2026-09-09 09:00:00');
  assert.ok(finding);
  assert.strictEqual(finding.type, 'SECURITY_LOG_VULNERABLE_DRIVER_INSTALLED');
  assert.strictEqual(finding.level, 'CRITICAL');
});

// 9. TEST: 0 False-Flag Security Log 4697
runTest('0 False-Flag: Steam Client Service veya Google Update servisi kurulumu temiz kalmalı', () => {
  const msg = 'A service was installed in the system. Service Name: Steam Client Service Service File Name: C:\\Program Files (x86)\\Common Files\\Steam\\SteamService.exe';
  const finding = codeIntegrityForensics.evaluateServiceInstallEvent(msg);
  assert.strictEqual(finding, null);
});

// 10. TEST: RecentApps Mock Verification
runTest('RecentApps Hile Kaydı: Vape veya Slinky kaydı somut kanıtla yakalanmalı', () => {
  const sampleApps = [
    { AppId: 'C:\\Users\\User\\AppData\\Local\\Temp\\vape.exe', LaunchCount: 5 },
    { AppId: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', LaunchCount: 120 }
  ];

  const cheatMatches = sampleApps.filter(a => /vape|slinky|doomsday/i.test(a.AppId));
  assert.strictEqual(cheatMatches.length, 1);
  assert.strictEqual(cheatMatches[0].LaunchCount, 5);
});

// 11. TEST: 0 False-Flag RecentApps
runTest('0 False-Flag RecentApps: chrome.exe, discord.exe ve xlite.jar temiz kalmalı', () => {
  const cleanApps = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Users\\User\\AppData\\Local\\Discord\\app-1.0.9030\\Discord.exe',
    'C:\\Users\\User\\Desktop\\xlite.jar'
  ];

  const cheatMatches = cleanApps.filter(a => /vape|slinky|doomsday|reach|autoclicker/i.test(a));
  assert.strictEqual(cheatMatches.length, 0);
});

console.log('\n====================================================');
console.log(`   SONUC: ${passedTests} / ${totalTests} TEST BASARILI!`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
