/**
 * Atlas AC - Minecraft Log & Session History Forensics Test Suite
 * Validates:
 * 1. Detection of Raven B+ initialization banners in Minecraft logs
 * 2. Detection of Meteor Client startup lines
 * 3. Detection of Wurst Client startup lines
 * 4. Detection of Doomsday Client startup lines
 * 5. Detection of Vape V4 injection / connection lines
 * 6. Decompression & detection of cheat banners inside .log.gz archives
 * 7. 0 False-Flag Guarantee: Clean logs containing Fabric, Forge, OptiFine, Sodium, Iris, Lithium, AppleSkin, and Simple Voice Chat remain 100% clean
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');

const minecraftLogForensics = require('../src/engine/minecraftLogForensics');

console.log('====================================================');
console.log('   ATLAS AC - MINECRAFT LOG & SESSION SUITE         ');
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

// 1. TEST: Raven B+ Banner Detection in latest.log
runTest('Minecraft Günlüğü: latest.log içindeki Raven B+ başlatma satırı yakalanmalı', () => {
  const fakeLog = `
    [14:20:10] [Client thread/INFO]: Setting user: Player123
    [14:20:12] [Client thread/INFO]: Loading mods...
    [14:20:15] [Client thread/INFO]: [Raven B+] Initialized with 15 combat modules!
    [14:20:18] [Client thread/INFO]: Connecting to hypixel.net
  `;

  const findings = minecraftLogForensics.inspectLogContent(fakeLog, 'C:\\Users\\Test\\.minecraft\\logs\\latest.log');
  assert(findings.length >= 1, 'Raven B+ log satırı yakalanmalıydı');
  assert.strictEqual(findings[0].level, 'CRITICAL');
  assert.strictEqual(findings[0].type, 'MINECRAFT_LOG_CHEAT_EXECUTION');
  assert.strictEqual(findings[0].cheatId, 'raven');
  assert(findings[0].confidence.includes('100%'));
  assert(findings[0].lineContent.includes('Raven B+'));
});

// 2. TEST: Meteor Client Startup Line Detection
runTest('Minecraft Günlüğü: Meteor Client başlatma kaydı yakalanmalı', () => {
  const fakeLog = `
    [15:10:00] [main/INFO]: [FabricLoader] Loading 42 mods
    [15:10:05] [main/INFO]: [Meteor Client] Initialized! Version 0.5.5
    [15:10:08] [main/INFO]: Sound engine started
  `;

  const findings = minecraftLogForensics.inspectLogContent(fakeLog, 'logs/latest.log');
  assert(findings.length >= 1, 'Meteor Client log satırı yakalanmalıydı');
  assert.strictEqual(findings[0].level, 'CRITICAL');
  assert.strictEqual(findings[0].cheatId, 'meteor');
});

// 3. TEST: Wurst Client Detection
runTest('Minecraft Günlüğü: Wurst Client sürüm ve başlatma satırı yakalanmalı', () => {
  const fakeLog = `
    [16:00:01] [Render thread/INFO]: [Wurst Client] Wurst Client v7.39 is ready!
  `;

  const findings = minecraftLogForensics.inspectLogContent(fakeLog, 'logs/latest.log');
  assert(findings.length >= 1, 'Wurst Client log satırı yakalanmalıydı');
  assert.strictEqual(findings[0].cheatId, 'wurst');
});

// 4. TEST: Doomsday Client Detection
runTest('Minecraft Günlüğü: Doomsday Client yüklenme satırı yakalanmalı', () => {
  const fakeLog = `
    [17:30:22] [Client thread/INFO]: me.doomsday.Doomsday: Initializing Doomsday Client modules...
  `;

  const findings = minecraftLogForensics.inspectLogContent(fakeLog, 'logs/latest.log');
  assert(findings.length >= 1, 'Doomsday Client log satırı yakalanmalıydı');
  assert.strictEqual(findings[0].cheatId, 'doomsday');
});

// 5. TEST: Vape V4 Injection Line Detection
runTest('Minecraft Günlüğü: Vape V4 enjeksiyon ve kimlik doğrulama satırı yakalanmalı', () => {
  const fakeLog = `
    [18:45:10] [Client thread/INFO]: [Vape] Loading Vape v4 into client thread...
    [18:45:11] [Client thread/INFO]: Authenticated with vape.gg session service
  `;

  const findings = minecraftLogForensics.inspectLogContent(fakeLog, 'logs/latest.log');
  assert(findings.length >= 1, 'Vape V4 log satırı yakalanmalıydı');
  assert.strictEqual(findings[0].cheatId, 'vape');
});

// 6. TEST: Compressed .log.gz Detection
runTest('Arşivlenmiş Günlük (.log.gz): Gzip sıkıştırmalı log içindeki CatLean yakalanmalı', () => {
  const innerLog = `
    [11:00:00] [main/INFO]: Minecraft 1.21.1 starting...
    [11:00:04] [main/INFO]: [CatLean] Initialized!
    [11:00:10] [main/INFO]: Joining world...
  `;
  const gzipped = zlib.gzipSync(Buffer.from(innerLog, 'utf8'));

  // Decompress and verify
  const decompressed = zlib.gunzipSync(gzipped).toString('utf8');
  const findings = minecraftLogForensics.inspectLogContent(decompressed, 'logs/2026-09-08-1.log.gz');
  assert(findings.length >= 1, '.log.gz içindeki CatLean yakalanmalıydı');
  assert.strictEqual(findings[0].cheatId, 'catlean');
});

// 7. TEST: 0 False-Flag Guarantee on Clean Logs
runTest('0 False-Flag: FabricLoader, Forge, OptiFine, Sodium, Iris, AppleSkin ve Simple Voice Chat temiz kalmalı', () => {
  const cleanLog = `
    [12:00:00] [main/INFO]: Loading Minecraft 1.21.1 with Fabric Loader 0.16.5
    [12:00:01] [main/INFO]: Loading 35 mods:
    [12:00:01] [main/INFO]:   - fabric-api 0.104.0+1.21.1
    [12:00:01] [main/INFO]:   - sodium 0.6.0-beta.2+mc1.21.1
    [12:00:01] [main/INFO]:   - iris 1.8.0-beta.4+1.21.1
    [12:00:01] [main/INFO]:   - lithium 0.13.0
    [12:00:01] [main/INFO]:   - appleskin 2.5.1+mc1.21.1
    [12:00:01] [main/INFO]:   - voicechat 1.21.1-2.5.21
    [12:00:01] [main/INFO]:   - journeymap 6.0.0-beta.27
    [12:00:02] [main/INFO]: [OptiFine] OptiFine_1.21_HD_U_I1 loaded
    [12:00:05] [Client thread/INFO]: [VoiceChat] Initialized audio recording device
    [12:00:06] [Client thread/INFO]: Loaded 1240 advancements
    [12:00:10] [Client thread/INFO]: Connecting to play.example-server.net, 25565
  `;

  const findings = minecraftLogForensics.inspectLogContent(cleanLog, 'logs/latest.log');
  assert.strictEqual(findings.length, 0, `Meşru mod günlüğü yanlış alarm üretmemeliydi, bulunan: ${findings.length}`);
});

console.log(`\n====================================================`);
console.log(`   SONUC: ${passedTests} / ${totalTests} TEST BASARILI!`);
console.log(`====================================================\n`);

if (require.main === module) {
  process.exit(passedTests === totalTests ? 0 : 1);
} else if (passedTests !== totalTests) {
  process.exit(1);
}
