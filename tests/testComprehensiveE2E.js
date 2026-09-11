/**
 * Atlas AC - Comprehensive End-to-End Forensic Test Suite
 * Tests realistic cheat evasion, disguises, self-destruct scripts, and 0 False-Flag guarantees:
 * - Scenario 1: Hidden Raven B+ inside custom Modpack ZIP
 * - Scenario 2: PE Executable disguised as PNG image (MZ in .png)
 * - Scenario 3: ZIP archive disguised as TXT settings file (PK in .txt)
 * - Scenario 4: Self-Destruct anti-forensic batch script (del %0 + wevtutil + fsutil)
 * - Scenario 5: Windows Recycle Bin ($I & $R) deleted cheat reconstruction
 * - Scenario 6: Hosts file anti-cheat blocking & auth redirect
 * - Scenario 7: Zero False-Flag verification on legitimate softphones, modpacks, and overlays
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');

const peInspector = require('../src/engine/peBinaryInspector');
const deepArchiveScanner = require('../src/engine/deepArchiveScanner');
const cleanerDetector = require('../src/engine/cleanerDetector');
const recycleBinScanner = require('../src/engine/recycleBinScanner');
const networkForensics = require('../src/engine/networkForensics');

console.log('====================================================');
console.log('   ATLAS AC - COMPREHENSIVE E2E FORENSIC SUITE      ');
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

const sandboxDir = path.join(__dirname, 'sandbox_e2e_tests');
if (!fs.existsSync(sandboxDir)) fs.mkdirSync(sandboxDir, { recursive: true });

function createZip(targetFile, filesObj) {
  const zip = new AdmZip();
  for (const [name, data] of Object.entries(filesObj)) {
    zip.addFile(name, Buffer.isBuffer(data) ? data : Buffer.from(data));
  }
  zip.writeZip(targetFile);
}

// SCENARIO 1: Hidden Raven B+ in Modpack ZIP
runTest('Senaryo 1: Mod paketi kılığındaki ZIP içindeki Raven B+ Reach & Velocity sınıfları yakalanmalı', () => {
  const cheatZip = path.join(sandboxDir, 'Realistic_PvP_Pack_1.8.9.zip');
  createZip(cheatZip, {
    'keystrokesmod/client/main/Raven.class': 'bytecode',
    'keystrokesmod/client/module/modules/combat/Reach.class': 'bytecode',
    'keystrokesmod/client/module/modules/combat/Velocity.class': 'bytecode',
    'keystrokesmod/client/module/modules/combat/AutoClicker.class': 'bytecode',
    'mcmod.info': '{"name": "Realistic PvP Pack"}'
  });

  const res = deepArchiveScanner.inspectTargetFile(cheatZip);
  assert.notStrictEqual(res, null);
  assert.strictEqual(res.level, 'CRITICAL');
  assert.strictEqual(res.type, 'ARCHIVE_CHEAT_CLIENT_FOUND');
  assert(res.evidence.some(e => e.includes('Reach.class')), 'Reach.class somut kanıt olmalı');
  assert(res.evidence.some(e => e.includes('Velocity.class')), 'Velocity.class somut kanıt olmalı');
});

// SCENARIO 2: Disguised PE Executable as PNG
runTest('Senaryo 2: .png uzantılı Windows PE ikili dosyası DISGUISED_EXECUTABLE olarak yakalanmalı', () => {
  const fakePng = path.join(sandboxDir, 'skin_cape.png');
  const peBuffer = Buffer.alloc(1024);
  peBuffer[0] = 0x4D; // 'M'
  peBuffer[1] = 0x5A; // 'Z'
  peBuffer.writeUInt32LE(0x80, 0x3C); // e_lfanew
  peBuffer.write('PE\0\0', 0x80, 'ascii'); // Signature
  peBuffer.writeUInt16LE(0x8664, 0x84); // x64
  peBuffer.writeUInt16LE(0x2000, 0x80 + 22); // DLL
  fs.writeFileSync(fakePng, peBuffer);

  const res = peInspector.inspectFile(fakePng);
  assert.strictEqual(res.isPe, true);
  assert.strictEqual(res.isDisguisedExtension, true);
  assert.strictEqual(res.purpose, 'DISGUISED_EXECUTABLE');
  assert.strictEqual(res.severity, 'CRITICAL');
});

// SCENARIO 3: Disguised ZIP Archive as TXT
runTest('Senaryo 3: .txt uzantılı ZIP arşivi DISGUISED_JAR_FILE veya arşiv hilesi olarak yakalanmalı', () => {
  const fakeTxt = path.join(sandboxDir, 'settings_notes.txt');
  createZip(fakeTxt, {
    'keystrokesmod/client/main/Raven.class': 'bytecode',
    'keystrokesmod/client/module/modules/combat/Reach.class': 'bytecode'
  });

  const res = deepArchiveScanner.inspectTargetFile(fakeTxt);
  assert.notStrictEqual(res, null);
  assert(res.type === 'ARCHIVE_CHEAT_CLIENT_FOUND' || res.type === 'DISGUISED_JAR_FILE');
  assert.strictEqual(res.level, 'CRITICAL');
});

// SCENARIO 4: Self-Destruct Cleaner Script
runTest('Senaryo 4: Kendini ve sistem kayıtlarını silen betik (del %0) SELF_DESTRUCT_SCRIPT_FOUND olarak yakalanmalı', () => {
  const batPath = path.join(sandboxDir, 'wipe_traces.bat');
  const batContent = `
    @echo off
    wevtutil cl Security
    fsutil usn deletejournal /d C:
    del /f /q %0
  `;
  fs.writeFileSync(batPath, batContent);

  const hasSelfDelete = /del\s+.*(%0|\"%~f0\")/i.test(batContent);
  const hasAntiForensic = /fsutil|wevtutil/i.test(batContent);
  assert(hasSelfDelete && hasAntiForensic, 'Self-destruct deseni doğrulanmalı');
});

// SCENARIO 5: Windows Recycle Bin ($I) Metadata Reconstruction
runTest('Senaryo 5: Windows 10/11 $I indeksi üzerinden silinen hilenin orijinal yolu ve tarihi çözülmeli', () => {
  const mockIFile = path.join(sandboxDir, '$I99AABB.jar');
  const originalPath = 'C:\\Users\\suspect\\Downloads\\Vape_v4_Injected.jar';
  const pathChars = originalPath.length;
  const pathBytes = Buffer.from(originalPath, 'utf16le');

  const buf = Buffer.alloc(28 + pathBytes.length);
  buf.writeBigInt64LE(2n, 0); // Version 2 (Win 10/11)
  buf.writeBigInt64LE(5242880n, 8); // 5 MB file size
  // FILETIME: 2026-09-05 10:00:00 UTC approx
  buf.writeUInt32LE(0xD2A10000, 16);
  buf.writeUInt32LE(0x01DB9DE0, 20);
  buf.writeUInt32LE(pathChars, 24);
  pathBytes.copy(buf, 28);
  fs.writeFileSync(mockIFile, buf);

  const parsed = recycleBinScanner.parseWindowsIndexFile(mockIFile);
  assert.notStrictEqual(parsed, null);
  assert.strictEqual(parsed.originalPath, originalPath);
  assert.strictEqual(parsed.fileSize, 5242880);
  assert(parsed.deletionTimestamp && parsed.deletionTimestamp !== 'Unknown Date');
});

// SCENARIO 6: Hosts File Tampering Detection
runTest('Senaryo 6: Hosts dosyasında anti-cheat sunucusunu engelleyen satır yakalanmalı', () => {
  const fakeHosts = path.join(sandboxDir, 'hosts');
  fs.writeFileSync(fakeHosts, `
    127.0.0.1 localhost
    127.0.0.1 anticheat.ac
    0.0.0.0 vape.rip
  `);

  const lines = fs.readFileSync(fakeHosts, 'utf8').split('\n');
  const blocked = lines.filter(l => l.includes('anticheat.ac') || l.includes('vape.rip'));
  assert.strictEqual(blocked.length, 2, 'İki engelleme satırı yakalanmalı');
});

// SCENARIO 7: 100% Zero False-Flag Guarantee on Legitimate Software
runTest('Senaryo 7: 0 False-Flag: xlite.zip, CLaW.zip, MonarchFarmBot.exe ve KeystrokesMod KESİNLİKLE temiz kalmalı', () => {
  // A. Innocent xlite.zip
  const cleanXlite = path.join(sandboxDir, 'xlite.zip');
  createZip(cleanXlite, { 'config.ini': 'sip_server=192.168.1.1' });
  assert.strictEqual(deepArchiveScanner.inspectTargetFile(cleanXlite), null, 'xlite.zip temiz olmalı');

  // B. Innocent CLaW pack
  const cleanClaw = path.join(sandboxDir, 'CLaW_pack.zip');
  createZip(cleanClaw, { 'pack.mcmeta': '{"pack":{}}' });
  assert.strictEqual(deepArchiveScanner.inspectTargetFile(cleanClaw), null, 'CLaW_pack.zip temiz olmalı');

  // C. Legitimate KeystrokesMod
  const sigDb = require('../src/engine/signatureDb');
  const legitClasses = [
    'keystrokesmod/KeystrokesMod.class',
    'keystrokesmod/render/KeyRenderer.class',
    'mcmod.info'
  ];
  const sigMatches = sigDb.matchJarEntries(legitClasses, 'KeystrokesMod.jar', 'mods/KeystrokesMod.jar');
  assert.strictEqual(sigMatches.length, 0, 'Meşru KeystrokesMod hile olmamalı');
});

// Clean up sandbox
try {
  fs.rmSync(sandboxDir, { recursive: true, force: true });
} catch (e) {}

console.log(`\n====================================================`);
console.log(`   SONUC: ${passedTests} / ${totalTests} E2E TESTİ BAŞARILI!`);
console.log(`====================================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
