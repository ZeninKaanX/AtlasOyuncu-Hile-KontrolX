/**
 * Atlas AC - Advanced Forensics Test Suite
 * Tests LNK/JumpList parsing, AppCompatCache (ShimCache) decoding,
 * Injected Process Memory & Unbacked Module Detection, and Active Network Sockets.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const lnkForensics = require('../src/engine/lnkForensics');
const shimCacheScanner = require('../src/engine/shimCacheScanner');
const unloadedModulesScanner = require('../src/engine/unloadedModulesScanner');
const networkForensics = require('../src/engine/networkForensics');

console.log('====================================================');
console.log('   ATLAS AC - ADVANCED FORENSICS TEST SUITE         ');
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

// 1. FILETIME to Date Conversion
runTest('FILETIME Dönüşümü: 64-bit Windows FILETIME doğru ISO tarih/saat dizgisine çevrilmeli', () => {
  // 133500000000000000 FILETIME represents a valid 21st century date
  const sampleFt = 133500000000000000n;
  const isoStr = lnkForensics.filetimeToDate(sampleFt);
  assert(isoStr, 'Geçerli bir tarih dizgisi dönmeli');
  assert(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(isoStr), `Format YYYY-MM-DD HH:mm:ss olmalı, gelen: ${isoStr}`);
});

// 2. LNK Binary Buffer Parsing
runTest('LNK Ayrıştırıcı: Geçerli MS-SHLLINK ikili başlığı ve hedef yolu ayrıştırılmalı', () => {
  const buf = Buffer.alloc(256);
  // HeaderSize: 0x4C (76)
  buf.writeUInt32LE(0x4C, 0);
  // CLSID
  buf[4] = 0x01; buf[5] = 0x14; buf[6] = 0x02; buf[7] = 0x00;
  // Flags
  buf.writeUInt32LE(0x01, 0x14);
  // FileSize: 1048576 (1 MB)
  buf.writeUInt32LE(1048576, 0x34);
  // Write a UTF-16LE drive path: E:\cheats\vape_v4.exe
  const targetStr = 'E:\\cheats\\vape_v4.exe';
  buf.write(targetStr, 80, 'utf16le');

  const parsed = lnkForensics.parseLnkBuffer(buf, 'Recent/vape.lnk');
  assert(parsed, 'LNK ayrıştırma nesnesi dönmeli');
  assert(parsed.targetPath.includes('vape_v4.exe'), `Hedef yolu vape_v4.exe içermeli, bulunan: ${parsed.targetPath}`);
  assert.strictEqual(parsed.fileSize, 1048576, 'Dosya boyutu 1048576 bayt olmalı');
});

// 3. 0 False-Flag LNK Protection
runTest('0 False-Flag LNK: Meşru OptiFine, Discord, xlite veya KeystrokesMod asla işaretlenmemeli', () => {
  const legitPaths = [
    'C:\\Users\\Player\\.minecraft\\mods\\OptiFine_1.8.9_HD_U_M5.jar',
    'C:\\Program Files\\Discord\\Discord.exe',
    'C:\\Users\\Player\\Downloads\\xlite.zip',
    'C:\\Users\\Player\\.minecraft\\mods\\KeystrokesMod-v5.jar'
  ];

  for (const p of legitPaths) {
    const isWhitelisted = lnkForensics.isWhitelisted(p);
    assert(isWhitelisted, `${p} beyaz listede yer almalı ve temiz kalmalı`);
  }
});

// 4. LNK Somut Kanıt Doğrulaması
runTest('LNK Hile Tespiti: Silinmiş vape_v4.exe için LNK kısayolu somut kanıtla yakalanmalı', () => {
  const mockParsed = {
    lnkPath: 'C:\\Users\\Target\\AppData\\Roaming\\Microsoft\\Windows\\Recent\\vape.lnk',
    targetPath: 'E:\\cheats\\vape_v4.exe',
    fileSize: 452100,
    creationTime: '2026-09-04 14:20:10',
    writeTime: '2026-09-04 14:35:00'
  };
  const mockStats = { mtime: new Date() };

  const finding = lnkForensics.evaluateTarget(mockParsed, mockStats);
  assert(finding, 'Finding nesnesi oluşmalı');
  assert.strictEqual(finding.level, 'CRITICAL');
  assert(finding.name.includes('vape_v4.exe'));
  assert(finding.confidence.includes('100%'));
  assert(finding.evidence.some(e => e.includes('E:\\cheats\\vape_v4.exe')));
});

// 5. ShimCache Windows 10/11 "10ts" Decoding
runTest('ShimCache Ayrıştırma: 10ts ikili başlığı, hedef yolu ve son değiştirilme çözülmeli', () => {
  const buf = Buffer.alloc(512);
  // Write "10ts" signature at offset 32
  buf.write('10ts', 32, 'ascii');
  // Data size
  buf.writeUInt32LE(120, 32 + 8);
  // Path length in bytes
  const cheatPath = 'C:\\Users\\Target\\AppData\\Local\\Temp\\drip_client.exe';
  const pathBuf = Buffer.from(cheatPath, 'utf16le');
  buf.writeUInt16LE(pathBuf.length, 32 + 12);
  pathBuf.copy(buf, 32 + 14);

  // Write FILETIME after path
  const ftOffset = 32 + 14 + pathBuf.length;
  buf.writeBigUInt64LE(133500000000000000n, ftOffset);

  const entries = shimCacheScanner.parseShimCacheBuffer(buf);
  assert(entries.length >= 1, 'ShimCache girdisi çözülmeli');
  assert(entries[0].path.includes('drip_client.exe'), `Hedef yolu drip_client.exe olmalı, bulunan: ${entries[0].path}`);
  assert(entries[0].timestamp, 'Zaman damgası çözülmeli');
});

// 6. 0 False-Flag ShimCache Whitelist
runTest('0 False-Flag ShimCache: Steam, Chrome, xlite ve meşru oyunlar temiz kalmalı', () => {
  const cleanApps = [
    'C:\\Program Files (x86)\\Steam\\steam.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Users\\Player\\Desktop\\xlite.zip',
    'C:\\Users\\Player\\Downloads\\MonarchFarmBot.exe'
  ];

  for (const app of cleanApps) {
    const whitelisted = shimCacheScanner.isWhitelisted(app);
    assert(whitelisted, `${app} ShimCache tarafından yanlış işaretlenmemeli`);
  }
});

// 7. Unloaded Module & Memory Whitelist
runTest('0 False-Flag Enjeksiyon: DiscordHook64, medal-hook ve GLFW meşru kalmalı', () => {
  const cleanLibs = [
    'C:\\Users\\User\\AppData\\Local\\Discord\\app-1.0.9001\\DiscordHook64.dll',
    'C:\\Users\\User\\AppData\\Local\\Medal\\medal-hook64.dll',
    'C:\\Users\\User\\AppData\\Local\\Temp\\glfw.dll',
    'C:\\Users\\User\\AppData\\Local\\Temp\\openal.dll'
  ];

  for (const lib of cleanLibs) {
    const isClean = unloadedModulesScanner.isWhitelistedModule(lib);
    assert(isClean, `${lib} meşru kütüphane olarak tanınmalı`);
  }
});

// 8. Active Socket & Network Matching
runTest('Ağ Forensiği: Aktif soket ve DNS denetim fonksiyonları başarıyla yanıt vermeli', async () => {
  const hostsFindings = networkForensics.checkHostsFile();
  assert(Array.isArray(hostsFindings), 'Hosts bulguları dizi olmalı');
  const socketFindings = await networkForensics.checkActiveSockets();
  assert(Array.isArray(socketFindings), 'Soket bulguları dizi olmalı');
});

console.log(`\n====================================================`);
console.log(`   SONUC: ${passedTests} / ${totalTests} ILERI ADLI TEST BASARILI!`);
console.log(`====================================================\n`);
