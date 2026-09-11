/**
 * Atlas AC - Discord & SRUM Forensics Unit Test Suite
 * Tests:
 * 1. Discord LevelDB: Detection of cheat attachment URLs (Vape, Slinky, Doomsday)
 * 2. Discord LevelDB: 0 False-Flag for clean mods (OptiFine, Sodium, Iris, ReplayMod)
 * 3. Discord LevelDB: 0 False-Flag for images, screenshots, videos
 * 4. Discord Cache: ZIP archive with Raven B+ classes detected as DISCORD_CACHE_CHEAT_ARCHIVE
 * 5. Discord Cache: PE binary with cheat strings detected as DISCORD_CACHE_CHEAT_EXECUTABLE
 * 6. Discord Cache: 0 False-Flag for legitimate Discord overlay DLLs (DiscordHook64)
 * 7. SRUM: Missing SRUDB.dat detected as SRUDB_DATABASE_WIPED
 * 8. SRUM: 0-byte SRUDB.dat detected as SRUDB_DATABASE_TRUNCATED
 * 9. SRUM: Recently re-created SRUDB.dat on running system detected as SRUDB_DATABASE_RECENTLY_RECREATED
 * 10. SRUM: 0 False-Flag for normal SRUDB.dat on running system
 * 11. SRUM: Extracted application paths in SRUDB detected (vape.exe, slinky.exe)
 * 12. SRUM: 0 False-Flag for legitimate apps in SRUDB (chrome.exe, discord.exe, xlite, farben ac)
 */

const assert = require('assert');
const discordForensics = require('../src/engine/discordForensics');
const srumForensics = require('../src/engine/srumForensics');

console.log('====================================================');
console.log('   ATLAS AC - DISCORD & SRUM FORENSICS SUITE        ');
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

// 1. TEST: Discord LevelDB Cheat Attachment URL Detection
runTest('Discord Eklentileri: cdn.discordapp.com vape_v4.exe linki somut kanıtla yakalanmalı', () => {
  const url = 'https://cdn.discordapp.com/attachments/1029384756/9876543210/vape_v4.exe?ex=65e&is=65c';
  const finding = discordForensics.evaluateDiscordAttachmentUrl(url, 'discord/Local Storage/leveldb/000123.ldb');

  assert.ok(finding, 'Hile linki tespit edilmeli');
  assert.strictEqual(finding.type, 'DISCORD_CHEAT_ATTACHMENT_RECORD');
  assert.strictEqual(finding.level, 'CRITICAL');
  assert.strictEqual(finding.fileName, 'vape_v4.exe');
});

// 2. TEST: Discord LevelDB Slinky Loader JAR
runTest('Discord Eklentileri: media.discordapp.net slinky_loader.jar linki yakalanmalı', () => {
  const url = 'https://media.discordapp.net/attachments/1122334455/6677889900/slinky_loader.jar';
  const finding = discordForensics.evaluateDiscordAttachmentUrl(url);

  assert.ok(finding);
  assert.strictEqual(finding.type, 'DISCORD_CHEAT_ATTACHMENT_RECORD');
  assert.strictEqual(finding.fileName, 'slinky_loader.jar');
});

// 3. TEST: Discord LevelDB Doomsday ZIP
runTest('Discord Eklentileri: cdn.discord.com doomsday_client.zip linki yakalanmalı', () => {
  const url = 'https://cdn.discord.com/attachments/5544332211/9988776655/doomsday_client.zip';
  const finding = discordForensics.evaluateDiscordAttachmentUrl(url);

  assert.ok(finding);
  assert.strictEqual(finding.type, 'DISCORD_CHEAT_ATTACHMENT_RECORD');
  assert.strictEqual(finding.fileName, 'doomsday_client.zip');
});

// 4. TEST: 0 False-Flag: Clean Minecraft Mods in Discord Attachments
runTest('0 False-Flag: OptiFine ve Sodium Discord eklentileri KESİNLİKLE işaretlenmemeli', () => {
  const optifineUrl = 'https://cdn.discordapp.com/attachments/123/456/OptiFine_1.8.9_HD_U_M5.jar';
  const sodiumUrl = 'https://cdn.discordapp.com/attachments/123/456/sodium-fabric-mc1.20.4-0.5.8.jar';
  const replayModUrl = 'https://cdn.discordapp.com/attachments/123/456/replaymod-1.20.1-2.6.14.jar';

  assert.strictEqual(discordForensics.evaluateDiscordAttachmentUrl(optifineUrl), null);
  assert.strictEqual(discordForensics.evaluateDiscordAttachmentUrl(sodiumUrl), null);
  assert.strictEqual(discordForensics.evaluateDiscordAttachmentUrl(replayModUrl), null);
});

// 5. TEST: 0 False-Flag: Image attachments mentioning cheat words
runTest('0 False-Flag: vape_screenshot.png veya hile_foto.jpg eklentileri ASLA hile dosyası sayılmamalı', () => {
  const imgUrl = 'https://cdn.discordapp.com/attachments/123/456/vape_ban_proof.png';
  const mp4Url = 'https://cdn.discordapp.com/attachments/123/456/drip_showcase.mp4';

  assert.strictEqual(discordForensics.evaluateDiscordAttachmentUrl(imgUrl), null);
  assert.strictEqual(discordForensics.evaluateDiscordAttachmentUrl(mp4Url), null);
});

// 6. TEST: Discord Cache ZIP Archive with Raven B+ Classes
runTest('Discord Önbelleği: İçinde Raven B+ Reach sınıfı barındıran ZIP arşivi yakalanmalı', () => {
  const zipHeader = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
  const content = Buffer.from('PADDING...keystrokes/raven/module/modules/combat/Reach.class...PADDING');
  const cacheBuf = Buffer.concat([zipHeader, content]);

  const finding = discordForensics.evaluateCacheBuffer(cacheBuf, 'discord/Cache/Cache_Data/f_000abc');
  assert.ok(finding);
  assert.strictEqual(finding.type, 'DISCORD_CACHE_CHEAT_ARCHIVE');
});

// 7. TEST: Discord Cache Windows PE with Cheat Strings
runTest('Discord Önbelleği: vape.gg imzası taşıyan MZ ikili dosyası yakalanmalı', () => {
  const mzHeader = Buffer.from([0x4D, 0x5A]);
  const peBody = Buffer.from('PE HEADER...https://vape.gg/auth/token...INJECTOR');
  const cacheBuf = Buffer.concat([mzHeader, peBody]);

  const finding = discordForensics.evaluateCacheBuffer(cacheBuf, 'discord/Cache/Cache_Data/f_000pe1');
  assert.ok(finding);
  assert.strictEqual(finding.type, 'DISCORD_CACHE_CHEAT_EXECUTABLE');
});

// 8. TEST: 0 False-Flag: DiscordHook64.dll in Discord Cache
runTest('0 False-Flag: DiscordHook64.dll ve zararsız resim önbellek dosyaları temiz kalmalı', () => {
  const hookHeader = Buffer.from([0x4D, 0x5A]);
  const hookBody = Buffer.from('PE HEADER...DiscordHook64.dll...Valve Corporation');
  const cacheBuf = Buffer.concat([hookHeader, hookBody]);

  assert.strictEqual(discordForensics.evaluateCacheBuffer(cacheBuf, 'discord/Cache/DiscordHook64.dll'), null);

  const pngBuf = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  assert.strictEqual(discordForensics.evaluateCacheBuffer(pngBuf, 'discord/Cache/f_000img'), null);
});

// 9. TEST: SRUM Missing SRUDB.dat Wiping
runTest('SRUM Bütünlüğü: SRUDB.dat dosyasının silinmiş olması SRUDB_DATABASE_WIPED olarak yakalanmalı', () => {
  const findings = srumForensics.evaluateSrUdbState(false, 0, null, 10000);
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].type, 'SRUDB_DATABASE_WIPED');
  assert.strictEqual(findings[0].level, 'CRITICAL');
});

// 10. TEST: SRUM 0-byte Truncated SRUDB.dat
runTest('SRUM Bütünlüğü: 0 bayt boyutundaki SRUDB.dat SRUDB_DATABASE_TRUNCATED olarak yakalanmalı', () => {
  const findings = srumForensics.evaluateSrUdbState(true, 0, new Date(), 10000);
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].type, 'SRUDB_DATABASE_TRUNCATED');
  assert.strictEqual(findings[0].level, 'CRITICAL');
});

// 11. TEST: SRUM Recently Recreated SRUDB.dat
runTest('SRUM Bütünlüğü: Sistem 10 saat açıkken 10 dakika önce oluşturulmuş 50KB SRUDB.dat yakalanmalı', () => {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const uptimeSeconds = 10 * 3600; // 10 hours
  const fileSize = 50 * 1024; // 50 KB

  const findings = srumForensics.evaluateSrUdbState(true, fileSize, tenMinutesAgo, uptimeSeconds);
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].type, 'SRUDB_DATABASE_RECENTLY_RECREATED');
  assert.strictEqual(findings[0].level, 'CRITICAL');
});

// 12. TEST: 0 False-Flag: Normal SRUDB.dat on clean system
runTest('0 False-Flag: Normal 25MB boyutundaki ve sistem açılışından beri süregelen SRUDB.dat temiz kalmalı', () => {
  const fiveHoursAgo = new Date(Date.now() - 5 * 3600 * 1000);
  const uptimeSeconds = 5 * 3600;
  const fileSize = 25 * 1024 * 1024; // 25 MB

  const findings = srumForensics.evaluateSrUdbState(true, fileSize, fiveHoursAgo, uptimeSeconds);
  assert.strictEqual(findings.length, 0, 'Normal SRUDB asla alarm vermemeli');
});

// 13. TEST: SRUM Extracted Cheat Binary Execution Paths
runTest('SRUM Yürütme: SRUDB.dat içinden çıkarılan vape.exe ve slinky.exe yolları somut kanıtla yakalanmalı', () => {
  const samplePaths = [
    'C:\\Users\\User\\AppData\\Local\\Temp\\vape.exe',
    'C:\\Windows\\System32\\svchost.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'D:\\Games\\Minecraft\\slinky.exe'
  ];

  const findings = srumForensics.evaluateExtractedPaths(samplePaths);
  assert.strictEqual(findings.length, 2);
  for (const f of findings) {
    assert.strictEqual(f.type, 'SRUM_APPLICATION_EXECUTION_RECORD');
    assert.strictEqual(f.level, 'CRITICAL');
  }
});

// 14. TEST: 0 False-Flag: Legitimate Applications in SRUM Extracted Paths
runTest('0 False-Flag: chrome.exe, discord.exe, xlite.jar ve farben ac SRUM kayıtlarında temiz kalmalı', () => {
  const cleanPaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Users\\User\\AppData\\Local\\Discord\\app-1.0.9030\\Discord.exe',
    'C:\\Farben AC\\AtlasAC-Windows.exe',
    'C:\\Users\\User\\Desktop\\xlite.jar',
    'C:\\Users\\User\\Downloads\\CLaW v.1.2.zip'
  ];

  const findings = srumForensics.evaluateExtractedPaths(cleanPaths);
  assert.strictEqual(findings.length, 0, 'Meşru yazılımlar SRUM analizi sırasında temiz kalmalıdır');
});

console.log('\n====================================================');
console.log(`   SONUC: ${passedTests} / ${totalTests} DISCORD & SRUM TESTI BASARILI!`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
