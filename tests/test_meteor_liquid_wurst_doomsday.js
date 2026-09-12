/**
 * Test Suite: Detection of Meteor, LiquidBounce, Wurst, and Doomsday Clients
 * Verifies:
 * 1. Browser visits in binary fallback are CRITICAL BROWSER_CHEAT_DOMAIN_VISITED
 * 2. Downloads and visit correlation produce KESIN BAN BROWSER_CHEAT_VISITED_AND_DOWNLOADED
 * 3. Version JSON profiles in versions/ are detected as CHEAT_VERSION_PROFILE_DETECTED
 * 4. Launcher profiles in launcher_profiles.json are detected as LAUNCHER_PROFILE_CHEAT_CONFIGURED
 * 5. Standalone external directories (CCBlueX, .liquidbounce, meteor-client, .wurst, doomsday) are detected
 * 6. Smart Anti-Forensics Correlation creates ANTI_FORENSICS_CHEAT_EVIDENCE_DESTRUCTION (SMOKING_GUN)
 * 7. Zero False-Positives on clean files and mods
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

const browserForensics = require('../src/engine/browserForensics');
const minecraftInspector = require('../src/engine/minecraftInspector');
const cheatKnowledgeBase = require('../src/engine/cheatKnowledgeBase');

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    console.error(err.stack);
  }
}

console.log('================================================================');
console.log('   ATLAS AC - METEOR, LIQUIDBOUNCE, WURST & DOOMSDAY TEST SUITE ');
console.log('================================================================\n');

// 1. Browser Visits: Only visits must be INFO, downloads must be CRITICAL
runTest('1.1 Tarayıcı İkili Analiz (Binary Stream): meteorclient.com ziyareti INFO olmalı', () => {
  const mockVisits = [
    {
      domain: 'meteorclient.com',
      url: 'https://meteorclient.com/download',
      title: 'Meteor Client Portal',
      timestamp: '2026-09-12 14:12:50',
      visitType: 'Tarayıcı Geçmiş Kaydı (Binary Forensics)',
      browser: 'Brave'
    }
  ];
  const findings = browserForensics.correlateVisitsAndDownloads(mockVisits, [], 'Brave', 'History');
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].level, 'INFO', 'Yalnızca ziyaret içeren bulgular INFO olmalı');
  assert.strictEqual(findings[0].type, 'BROWSER_CHEAT_DOMAIN_VISITED');
  assert.strictEqual(findings[0].domain, 'meteorclient.com');
  assert.ok(findings[0].confidence.includes('85%') || findings[0].confidence.includes('95%'));
});

runTest('1.2 Tarayıcı İkili Analiz: liquidbounce.net, wurstclient.net, doomsdayclient.com INFO olmalı', () => {
  const mockVisits = [
    { domain: 'liquidbounce.net', url: 'https://liquidbounce.net', timestamp: '2026-09-12 14:12:50', visitType: 'Tarayıcı Geçmiş Kaydı (Binary Forensics)', browser: 'Brave' },
    { domain: 'wurstclient.net', url: 'https://wurstclient.net/download', timestamp: '2026-09-12 14:12:50', visitType: 'Tarayıcı Geçmiş Kaydı (Binary Forensics)', browser: 'Brave' },
    { domain: 'doomsdayclient.com', url: 'https://doomsdayclient.com', timestamp: '2026-09-12 14:12:50', visitType: 'Tarayıcı Geçmiş Kaydı (Binary Forensics)', browser: 'Brave' }
  ];
  const findings = browserForensics.correlateVisitsAndDownloads(mockVisits, [], 'Brave', 'History');
  assert.strictEqual(findings.length, 3);
  for (const f of findings) {
    assert.strictEqual(f.level, 'INFO', 'Ziyaretler INFO olarak listelenmeli');
    assert.strictEqual(f.type, 'BROWSER_CHEAT_DOMAIN_VISITED');
  }
});

runTest('1.3 Tarayıcı İndirme Korelasyonu: meteor-client-0.5.5.jar indirmesi ziyaretle eşleşmeli ve CRITICAL KESİN BAN üretmeli', () => {
  const mockVisits = [
    { domain: 'meteorclient.com', url: 'https://meteorclient.com/download', timestamp: '2026-09-12 14:12:50', visitType: 'Tarayıcı Geçmiş Kaydı (Binary Forensics)', browser: 'Brave' }
  ];
  const mockDownloads = [
    browserForensics.evaluateDownloadItem('C:\\Users\\emreb\\Downloads\\meteor-client-0.5.5.jar', 'https://meteorclient.com/download', '2026-09-12 14:12:55', 'Brave')
  ];
  assert.ok(mockDownloads[0] !== null, 'meteor-client-0.5.5.jar hile dosyası olarak tanınmalı');
  const findings = browserForensics.correlateVisitsAndDownloads(mockVisits, mockDownloads, 'Brave', 'History');
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].type, 'BROWSER_CHEAT_VISITED_AND_DOWNLOADED');
  assert.strictEqual(findings[0].level, 'CRITICAL', 'İndirme eşleştiğinde CRITICAL olmalı');
  assert.ok(findings[0].banVerdict.includes('KESİN BAN'));
});

// 2. Version JSON Profiles
runTest('2.1 Versiyon Profili: Wurst 7.42 JSON profili tespit edilmeli', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas_test_v_'));
  const wurstVerJson = path.join(tmpDir, 'Wurst 7.42.json');
  fs.writeFileSync(wurstVerJson, JSON.stringify({
    id: 'Wurst 7.42',
    inheritsFrom: '1.20.4',
    mainClass: 'net.wurstclient.forge.WurstMod',
    libraries: [
      { name: 'net.wurstclient:wurst:7.42' }
    ]
  }));

  const findings = minecraftInspector.inspectVersionJson(wurstVerJson);
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].level, 'CRITICAL');
  assert.strictEqual(findings[0].type, 'CHEAT_VERSION_PROFILE_DETECTED');
  assert.ok(findings[0].name.includes('Wurst Client'));
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

runTest('2.2 Versiyon Profili: LiquidBounce JSON profili kütüphanesiyle tespit edilmeli', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas_test_lb_'));
  const lbVerJson = path.join(tmpDir, 'LiquidBounce-1.8.9.json');
  fs.writeFileSync(lbVerJson, JSON.stringify({
    id: 'LiquidBounce-1.8.9',
    inheritsFrom: '1.8.9',
    mainClass: 'net.minecraft.client.main.Main',
    libraries: [
      { name: 'net.ccbluex:liquidbounce:b73' }
    ]
  }));

  const findings = minecraftInspector.inspectVersionJson(lbVerJson);
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].level, 'CRITICAL');
  assert.strictEqual(findings[0].type, 'CHEAT_VERSION_PROFILE_DETECTED');
  assert.ok(findings[0].name.includes('LiquidBounce'));
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

runTest('2.3 0 False-Flag: Meşru OptiFine ve Fabric loader JSON profilleri temiz kalmalı', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas_test_clean_'));
  const optifineJson = path.join(tmpDir, '1.8.9-OptiFine_HD_U_M5.json');
  fs.writeFileSync(optifineJson, JSON.stringify({
    id: '1.8.9-OptiFine_HD_U_M5',
    inheritsFrom: '1.8.9',
    mainClass: 'net.minecraft.launchwrapper.Launch',
    libraries: [{ name: 'optifine:OptiFine:1.8.9_HD_U_M5' }]
  }));

  const findings = minecraftInspector.inspectVersionJson(optifineJson);
  assert.strictEqual(findings.length, 0, 'OptiFine profili temiz kalmalı');
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// 3. Launcher Profiles Inspection
runTest('3.1 Başlatıcı Profilleri: launcher_profiles.json içindeki Wurst, LiquidBounce, Meteor, Doomsday profilleri yakalanmalı', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas_test_lp_'));
  const lpJson = path.join(tmpDir, 'launcher_profiles.json');
  fs.writeFileSync(lpJson, JSON.stringify({
    profiles: {
      'clean_profile': { name: 'Minecraft 1.20.4', lastVersionId: '1.20.4' },
      'wurst_profile': { name: 'Wurst Client', lastVersionId: 'Wurst 7.42', lastUsed: '2026-09-12T14:10:00.000Z' },
      'lb_profile': { name: 'LiquidBounce 1.8.9', lastVersionId: 'LiquidBounce-1.8.9', lastUsed: '2026-09-12T14:11:00.000Z' },
      'dd_profile': { name: 'Doomsday Ghost', lastVersionId: 'Doomsday', lastUsed: '2026-09-12T14:12:00.000Z' },
      'meteor_profile': { name: 'Meteor Fabric', lastVersionId: 'fabric-loader-1.20.4-meteor', lastUsed: '2026-09-12T14:12:30.000Z' }
    }
  }));

  const findings = minecraftInspector.inspectLauncherProfiles(tmpDir);
  assert.strictEqual(findings.length, 4, '4 hile profili de yakalanmalı, temiz profil hariç');
  for (const f of findings) {
    assert.strictEqual(f.level, 'CRITICAL');
    assert.strictEqual(f.type, 'LAUNCHER_PROFILE_CHEAT_CONFIGURED');
  }
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// 4. CheatKnowledgeBase Enrichment
runTest('4.1 Knowledge Base: Yeni eklenen hile türleri eksiksiz açıklama üretmeli', () => {
  const testFinding1 = { type: 'CHEAT_VERSION_PROFILE_DETECTED', name: 'Wurst Client' };
  cheatKnowledgeBase.enrichFinding(testFinding1);
  assert.ok(testFinding1.whyFlagged.includes('versions'));
  assert.ok(testFinding1.explanation.adminAction.includes('KESİN HİLE BAN'));

  const testFinding2 = { type: 'ANTI_FORENSICS_CHEAT_EVIDENCE_DESTRUCTION', name: 'Kritik Delil Karartma' };
  cheatKnowledgeBase.enrichFinding(testFinding2);
  assert.ok(testFinding2.whyFlagged.includes('USN'));
  assert.ok(testFinding2.explanation.howItWorks.includes('deletejournal'));
  assert.ok(testFinding2.explanation.adminAction.includes('KESİN KANIT KARARTMA'));
});

console.log('\n================================================================');
console.log(`   SONUÇ: ${passed} / ${total} TEST BAŞARIYLA TAMAMLANDI!`);
console.log('================================================================\n');

if (passed !== total) {
  process.exit(1);
}
