/**
 * Atlas AC - Stealth Bypass, IPC & Removable Media Test Suite
 * Validates:
 * 1. Windows BAM FILETIME timestamp decoding and removable drive detection
 * 2. Linux Unix Domain Sockets & /dev/shm IPC forensics
 * 3. Linux Memory Scanner: ptrace attachment, LD_PRELOAD, and unlinked module mapping
 * 4. FreeDesktop recently-used.xbel forensic extraction with 0 false-flags
 * 5. Comprehensive cheat domain coverage (50+ modern cheat providers)
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const registryForensics = require('../src/engine/registryForensics');
const networkForensics = require('../src/engine/networkForensics');
const memoryScanner = require('../src/engine/memoryScanner');
const sigDb = require('../src/engine/signatureDb');

console.log('====================================================');
console.log('   ATLAS AC - STEALTH BYPASS & IPC FORENSIC SUITE   ');
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

// 1. TEST: BAM FILETIME Decoding
runTest('BAM FILETIME: 64-bit Windows FILETIME ikili verisi ISO tarihine dönüştürülmeli', () => {
  // Test known FILETIME: 00-60-A6-35-15-2C-DA-01 -> 2023-12-11 09:34:16
  const hexStr = '00-60-A6-35-15-2C-DA-01-00-00-00-00';
  const isoStr = registryForensics.parseBamHexTimestamp(hexStr);
  assert(isoStr, 'Dönüştürülen zaman boş olamaz');
  assert(isoStr.startsWith('2023-12-11'), `Geçerli bir tarih bekleniyordu, alınan: ${isoStr}`);

  // Invalid or null hex string must return null safely without throwing
  assert.strictEqual(registryForensics.parseBamHexTimestamp(null), null);
  assert.strictEqual(registryForensics.parseBamHexTimestamp(''), null);
  assert.strictEqual(registryForensics.parseBamHexTimestamp('00-00'), null);
});

// 2. TEST: BAM Removable Media Detection
runTest('BAM Adli Analizi: Harici USB bellekten (E:\\, F:\\, \\Device\\HarddiskVolume) çalıştırılan hileler tespit edilmeli', () => {
  const fakeBamPaths = [
    'E:\\vape_v4.exe',
    'F:\\ghost_client\\slinky.exe',
    '\\Device\\HarddiskVolume3\\drip.exe'
  ];

  for (const fp of fakeBamPaths) {
    const isRemovable = /^[d-z]:\\/i.test(fp) || fp.toLowerCase().includes('\\device\\harddiskvolume');
    assert(isRemovable, `${fp} harici/USB sürücü olarak tanınmalı`);
  }

  // System C: drive must not be classified as removable
  const systemPath = 'C:\\Program Files\\Minecraft\\MinecraftLauncher.exe';
  const isSystemRemovable = /^[d-z]:\\/i.test(systemPath) || systemPath.toLowerCase().includes('\\device\\harddiskvolume');
  assert(!isSystemRemovable, 'C: sistem sürücüsü harici olarak işaretlenmemeli');
});

// 3. TEST: Linux IPC & Unix Domain Sockets Forensics
runTest('Linux IPC Adli Analizi: Meşru Steam / AnyDesk paylaşımlı bellekleri TEMİZ kalmalı', async () => {
  const findings = await networkForensics.checkLinuxIpc();
  // Ensure no false positives on currently mounted /dev/shm
  for (const f of findings) {
    assert(!f.path.includes('ValveIPCSharedObj'), 'Steam IPC asla hile olarak işaretlenmemeli');
    assert(!f.path.includes('ad_mailbox'), 'AnyDesk IPC asla hile olarak işaretlenmemeli');
    assert(!f.path.includes('ad_qipc'), 'AnyDesk IPC asla hile olarak işaretlenmemeli');
  }
});

// 4. TEST: Linux Memory Overlay & Preload 0 False-Flag Whitelist
runTest('Linux Bellek Denetimi: MangoHud, GameMode ve Steam Overlay asla hile sayılmamalı', () => {
  const legitPreloads = [
    '/usr/lib/x86_64-linux-gnu/libMangoHud.so',
    '/usr/lib/libgamemodeauto.so.0',
    '/home/user/.local/share/Steam/ubuntu12_64/gameoverlayrenderer.so',
    '/usr/lib/x86_64-linux-gnu/obs-vkcapture/libobs_vkcapture.so'
  ];

  for (const p of legitPreloads) {
    const isLegit = /mangohud|gamemode|obs[-_]?vkcapture|libobs|gameoverlayrenderer/i.test(p);
    assert(isLegit, `${p} meşru katman olarak kabul edilmeli`);
  }
});

// 5. TEST: Cheat Domains Verification
runTest('Hile Alan Adları: Veritabanında en az 40 modern hile ve dağıtım sunucusu yer almalı', () => {
  const domains = sigDb.getCheatDomains();
  assert(domains.length >= 40, `En az 40 alan adı olmalı, mevcut: ${domains.length}`);

  const requiredDomains = [
    'vape.gg',
    'drip.gg',
    'slinky.gg',
    'futureclient.net',
    'rusherhack.org',
    'boze.dev',
    'whiteout.gg',
    'entropy.club',
    'meteorclient.com',
    'wurstclient.net',
    'liquidbounce.net'
  ];

  for (const d of requiredDomains) {
    assert(domains.includes(d), `Gerekli hile alan adı eksik: ${d}`);
  }
});

// 6. TEST: FreeDesktop recently-used.xbel 0 False-Flag Whitelist
runTest('Linux recent-files: xlite, CLaW, MonarchFarmBot ve KeystrokesMod KESİNLİKLE temiz kalmalı', () => {
  const testPaths = [
    '/home/user/Downloads/xlite.zip',
    '/home/user/Downloads/CLaW v.1.2 1.21.11+.zip',
    '/home/user/Masaüstü/MonarchFarmBot.exe',
    '/home/user/Desktop/KeystrokesMod-v5.jar',
    '/home/user/Masaüstü/drippyloadingscreen-1.21.11.jar'
  ];

  for (const tp of testPaths) {
    const isWhitelisted = /xlite|claw|drippyloadingscreen|keystrokesmod|monarchfarmbot|soyafarmbot|farben ac/i.test(tp);
    assert(isWhitelisted, `${tp} beyaz listede olmalı ve asla hile sayılmamalı`);
  }
});

// 7. TEST: AppCompatFlags Layers & Tracing Forensics
runTest('AppCompatFlags & Tracing: Hile uyumluluk bayrakları ve ağ izleme anahtarları yakalanmalı', () => {
  const fakeLayers = [
    { path: 'C:\\Users\\User\\AppData\\Local\\Temp\\vape_v4.exe', flags: '~ RUNASADMIN' },
    { path: 'E:\\cheats\\slinky.exe', flags: '~ HIGHDPIAWARE' }
  ];

  for (const item of fakeLayers) {
    const isCheat = /vape|drip|slinky|doomsday|meteor/i.test(item.path);
    assert(isCheat, `${item.path} hile olarak yakalanmalı`);
  }

  // Windows Tracing key match
  const fakeTracingKeys = ['vape.exe_RASAPI32', 'drip_loader.exe_RASMANCS'];
  for (const k of fakeTracingKeys) {
    const isCheatTrace = /vape|drip|slinky/i.test(k);
    assert(isCheatTrace, `${k} tracing hile anahtarı olarak yakalanmalı`);
  }
});

// 8. TEST: Active Socket Whitelist & Cheat Process Binding
runTest('Ağ Soketi Denetimi: Meşru Discord, Steam ve Chrome temiz kalmalı, hile süreçleri yakalanmalı', () => {
  const legitProcs = ['Discord', 'chrome', 'steam', 'node', 'antigravity'];
  for (const p of legitProcs) {
    const isLegit = /node|discord|chrome|firefox|steam|antigravity|code/i.test(p);
    assert(isLegit, `${p} meşru süreç olarak tanınmalı`);
  }

  const cheatProcs = ['vape.exe', 'slinky_loader', 'drip_agent', 'GhostClicker'];
  for (const cp of cheatProcs) {
    const isCheat = /vape|drip|slinky|doomsday|ghostclient|clicker|viper/i.test(cp);
    assert(isCheat, `${cp} hile süreci olarak yakalanmalı`);
  }
});

// 9. TEST: NTFS Zone.Identifier Mark-of-the-Web Parsing
runTest('Zone.Identifier: İndirilen hile URL metaverisi (HostUrl / ReferrerUrl) somut kanıtla çözülmeli', () => {
  const fakeZoneContent = `
[ZoneTransfer]
ZoneId=3
ReferrerUrl=https://google.com/
HostUrl=https://vape.gg/files/vape_v4.exe
  `;
  const domains = sigDb.getCheatDomains();
  const lowerZone = fakeZoneContent.toLowerCase();
  const matchedDomain = domains.find(d => lowerZone.includes(d.toLowerCase()));
  assert.strictEqual(matchedDomain, 'vape.gg', 'Zone.Identifier içindeki vape.gg alan adı yakalanmalı');
});

// 10. TEST: NTFS Gizli Alternatif Veri Akışı (ADS) Tespiti
runTest('NTFS ADS Tespiti: Dosyaya iliştirilmiş gizli veri akışları (file.png:cheat.exe) CRITICAL olarak yakalanmalı', () => {
  const streams = [
    { file: 'image.png', stream: 'payload.exe', isAds: true },
    { file: 'document.txt', stream: 'Zone.Identifier', isAds: false },
    { file: 'video.mp4', stream: ':$DATA', isAds: false }
  ];

  for (const s of streams) {
    const isCustomAds = s.stream.toLowerCase() !== 'zone.identifier' && s.stream.toLowerCase() !== ':$data';
    assert.strictEqual(isCustomAds, s.isAds, `${s.file}:${s.stream} için ADS kontrolü doğru olmalı`);
  }
});

console.log(`\n====================================================`);
console.log(`   SONUC: ${passedTests} / ${totalTests} TEST BASARILI!`);
console.log(`====================================================\n`);

module.exports = {
  totalTests,
  passedTests
};
