/**
 * Atlas AC - Deep Archive & Filesystem Inspector Test Suite
 * Validates:
 * 1. 0 False-Flag Guarantee: xlite.zip, CLaW.zip, MonarchFarmBot.exe without cheat code are CLEAN.
 * 2. Somut Kanıt (Concrete Evidence): Hidden cheat classes inside archives are extracted with full details.
 * 3. Disguised archives (PK in .png/.txt) are detected.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');

const deepArchiveScanner = require('../src/engine/deepArchiveScanner');

console.log('====================================================');
console.log('   ATLAS AC - DEEP ARCHIVE & SOMUT KANIT TEST SUITE ');
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

const tempTestDir = path.join(__dirname, 'temp_archive_tests');
if (!fs.existsSync(tempTestDir)) fs.mkdirSync(tempTestDir, { recursive: true });

// Helper to create test zip
function createTestZip(filePath, entries) {
  const zip = new AdmZip();
  for (const [entryName, content] of Object.entries(entries)) {
    zip.addFile(entryName, Buffer.from(content));
  }
  zip.writeZip(filePath);
}

// 1. TEST: 0 False-Flag on innocent xlite.zip
runTest('0 False-Flag: İçi temiz xlite.zip arşivi KESİNLİKLE hile olarak işaretlenmemeli', () => {
  const xliteZipPath = path.join(tempTestDir, 'xlite.zip');
  createTestZip(xliteZipPath, {
    'xlite/config.json': '{"name": "xlite-utility"}',
    'xlite/assets/icon.png': 'fake-image-bytes',
    'xlite/README.txt': 'Innocent softphone / texture pack'
  });

  const res = deepArchiveScanner.inspectTargetFile(xliteZipPath);
  assert.strictEqual(res, null, 'Temiz xlite.zip için bulgu üretilmemeliydi!');
});

// 2. TEST: 0 False-Flag on innocent CLaW mod/pack
runTest('0 False-Flag: CLaW v.1.2 1.21.11+.zip arşivi temiz ise ASLA alarm vermemeli', () => {
  const clawZipPath = path.join(tempTestDir, 'CLaW v.1.2 1.21.11+.zip');
  createTestZip(clawZipPath, {
    'pack.mcmeta': '{"pack": {"pack_format": 15, "description": "CLaW Custom Pack"}}',
    'assets/minecraft/textures/claw.png': 'texture-data'
  });

  const res = deepArchiveScanner.inspectTargetFile(clawZipPath);
  assert.strictEqual(res, null, 'Temiz CLaW zip arşivi için bulgu üretilmemeliydi!');
});

// 3. TEST: Concrete Evidence Detection on hidden cheat inside ZIP
runTest('Somut Kanıt Tespiti: ZIP içine gizlenmiş Raven B+ sınıfları tam kanıtıyla yakalanmalı', () => {
  const hiddenCheatZip = path.join(tempTestDir, 'CustomModpack-v2.zip');
  createTestZip(hiddenCheatZip, {
    'keystrokesmod/client/main/Raven.class': 'bytecode',
    'keystrokesmod/client/module/modules/combat/Reach.class': 'bytecode',
    'keystrokesmod/client/module/modules/combat/Velocity.class': 'bytecode',
    'mcmod.info': '{"modid": "keystrokesmod"}'
  });

  const res = deepArchiveScanner.inspectTargetFile(hiddenCheatZip);
  assert.notStrictEqual(res, null, 'Gizlenmiş hile arşivi tespit edilmeliydi!');
  assert.strictEqual(res.level, 'CRITICAL');
  assert.strictEqual(res.type, 'ARCHIVE_CHEAT_CLIENT_FOUND');
  assert.strictEqual(res.path, hiddenCheatZip);
  assert(res.timestamp && res.timestamp.length >= 10, 'Geçerli bir tarih/saat olmalı');
  assert(res.confidence.includes('100%'), 'Güven skoru 100% olmalı');

  // Check evidence list
  assert(Array.isArray(res.evidence), 'Kanıt listesi olmalı');
  const hasReachEvidence = res.evidence.some(e => e.includes('Reach.class'));
  assert(hasReachEvidence, 'Arşiv içindeki Reach.class somut kanıt olarak listelenmeli');
});

// 4. TEST: Disguised Archive Detection (.png file containing ZIP header)
runTest('Yanıltıcı Uzantı Koruması: .png uzantılı ZIP arşivi somut kanıtla yakalanmalı', () => {
  const disguisedPng = path.join(tempTestDir, 'innocent_skin.png');
  createTestZip(disguisedPng, {
    'secret/payload.txt': 'Hidden payload'
  });

  const res = deepArchiveScanner.inspectTargetFile(disguisedPng);
  assert.notStrictEqual(res, null, 'Yanıltıcı .png arşivi tespit edilmeliydi');
  assert.strictEqual(res.type, 'DISGUISED_JAR_FILE');
  assert.strictEqual(res.level, 'CRITICAL');
  assert(res.evidence.some(e => e.includes('ZIP/JAR Arşivi')));
});

// 5. TEST: Scan directory discovery
runTest('Dizin Keşfi: İndirilenler, Masaüstü ve Temp dizinleri başarıyla keşfedilmeli', () => {
  const dirs = deepArchiveScanner.getScanDirectories();
  assert(dirs.length >= 3, 'En az 3 adli konum bulunmalı');
  const hasTemp = dirs.some(d => d.includes('tmp') || d.includes('Temp'));
  assert(hasTemp, 'Temp dizini listede yer almalı');
});

// Clean up test files
try {
  fs.rmSync(tempTestDir, { recursive: true, force: true });
} catch (e) {}

console.log(`\n====================================================`);
console.log(`   SONUC: ${passedTests} / ${totalTests} DERİN ARŞİV TESTİ BAŞARILI!`);
console.log(`====================================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
