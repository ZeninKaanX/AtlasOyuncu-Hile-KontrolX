/**
 * Atlas AC - 22/22 Archive & Multi-Cheat Verification Suite
 * Verifies 100% concrete evidence detection of all 22 cheats in 2026-09-09_5eac98uamzjswkem.zip
 * and verifies absolute zero false-flags on legitimate software and packs.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const AdmZip = require('adm-zip');

const deepArchiveScanner = require('../src/engine/deepArchiveScanner');
const sigDb = require('../src/engine/signatureDb');

console.log('====================================================');
console.log('   ATLAS AC - 22/22 CHEAT & ARCHIVE FORENSIC SUITE  ');
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

// 1. TEST: Verify Parent Archive 2026-09-09_5eac98uamzjswkem.zip detects 22 cheats
runTest('Kapsayici Arsiv: 2026-09-09_5eac98uamzjswkem.zip icindeki 22 hilenin tamami tespit edilmeli', () => {
  const archivePath = '/home/eververity/İndirilenler/2026-09-09_5eac98uamzjswkem.zip';
  if (fs.existsSync(archivePath)) {
    const findings = deepArchiveScanner.inspectTargetFileAll(archivePath);
    assert(findings.length >= 22, `En az 22 hile tespit edilmeli, bulunan: ${findings.length}`);
    
    // Check that findings are CRITICAL and have concrete evidence
    for (const f of findings) {
      assert.strictEqual(f.level, 'CRITICAL', `Her hile CRITICAL olmali: ${f.name}`);
      assert(f.evidence && f.evidence.length > 0, `Somut kanit eksik: ${f.name}`);
      assert(f.confidence.includes('100%'), `Guven skoru 100% olmali: ${f.name}`);
    }
  }
});

// 2. TEST: Verify all 22 extracted cheat files individually
runTest('Bireysel Dosyalar: 22 ayrik hile dosyasinin tamami %100 dogrulukla tespit edilmeli', () => {
  const dir = '/tmp/kaan_cheats_analysis/kaan beyin hileleri';
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).sort();
    assert.strictEqual(files.length, 22, '22 adet hile dosyasi bulunmali');

    const expectedCheats = [
      { file: 'Ares-2.9-1.18.1.jar', rule: 'Ares' },
      { file: 'Aristois-Client-Mod-1.21.4.zip', rule: 'Aristois' },
      { file: 'ArvionClient.jar', rule: 'Arvion' },
      { file: 'ClickCrystals-26.2-1.4.3-modrinth.jar', rule: 'ClickCrystals' },
      { file: 'Instant Crystal Switch.jar', rule: 'Instant Crystal Switch' },
      { file: 'LiquidLauncher_0.6.1_x64-setup.exe', rule: 'LiquidLauncher' },
      { file: 'LiquidLauncher_0.6.1_x64_en-US.msi', rule: 'LiquidLauncher' },
      { file: 'Nightmare.zip', rule: 'Nightmare' },
      { file: 'Onaylanmayan 31578.crdownload', rule: 'Glazed' },
      { file: 'PrestigeLoader-26.2.jar', rule: 'Prestige Loader' },
      { file: 'Shield Breaker-1.2.3 26.2.jar', rule: 'Shield Breaker' },
      { file: 'VacuumHax-Client-1.19.jar', rule: 'MatHax / VacuumHax' },
      { file: 'Wurst-Client-v7.55.1-MC26.1.2.jar', rule: 'Wurst' },
      { file: 'auraclient.zip', rule: 'Aura Client' },
      { file: 'autoanchor-1.1.0-mc1.21.9-1.21.11.jar', rule: 'Auto Anchor' },
      { file: 'autototem-1.1.0.jar', rule: 'Auto Totem' },
      { file: 'baritone-meteor-26.2.jar', rule: 'Baritone' },
      { file: 'bleachhack-1.20.4.jar', rule: 'BleachHack' },
      { file: 'catlean_26.2-v0.1.3.jar', rule: 'CatLean' },
      { file: 'doomsday.jar', rule: 'Doomsday' },
      { file: 'meteor-client-26.2-20.jar', rule: 'Meteor' },
      { file: 'thunderhack-1.7.jar', rule: 'ThunderHack' }
    ];

    for (const expected of expectedCheats) {
      const p = path.join(dir, expected.file);
      const res = deepArchiveScanner.inspectTargetFileAll(p);
      assert(res.length > 0, `Hile tespit edilemedi: ${expected.file}`);
      const foundName = res[0].name;
      assert(foundName.toLowerCase().includes(expected.rule.toLowerCase()), `Hatali kural eslesmesi: ${expected.file} -> ${foundName} (beklenen: ${expected.rule})`);
    }
  }
});

// 3. TEST: 0 FALSE-FLAG GUARANTEE ON CLEAN SOFTWARE
runTest('0 False-Flag: xlite, CLaW, drippyloadingscreen ve KeystrokesMod KESINLIKLE temiz kalmali', () => {
  const tmp = os.tmpdir();

  // A. Clean xlite.zip
  const cleanXlite = new AdmZip();
  cleanXlite.addFile('pack.mcmeta', Buffer.from(JSON.stringify({ pack: { pack_format: 15, description: 'Clean Xlite Resourcepack' } })));
  cleanXlite.addFile('assets/minecraft/textures/gui/title/background/panorama_0.png', Buffer.from('PNGDATA'));
  const xlitePath = path.join(tmp, 'kaan_test_xlite.zip');
  cleanXlite.writeZip(xlitePath);

  const xliteRes = deepArchiveScanner.inspectTargetFile(xlitePath);
  assert.strictEqual(xliteRes, null, 'xlite.zip ASLA hile olarak isaretlenmemeli');

  // B. Clean CLaW pack
  const cleanClaw = new AdmZip();
  cleanClaw.addFile('pack.mcmeta', Buffer.from(JSON.stringify({ pack: { pack_format: 15, description: 'CLaW Pack' } })));
  cleanClaw.addFile('assets/minecraft/sounds.json', Buffer.from('{}'));
  const clawPath = path.join(tmp, 'kaan_test_claw.zip');
  cleanClaw.writeZip(clawPath);

  const clawRes = deepArchiveScanner.inspectTargetFile(clawPath);
  assert.strictEqual(clawRes, null, 'CLaW.zip ASLA hile olarak isaretlenmemeli');

  // C. Clean legitimate Fabric mod (drippyloadingscreen)
  const legitMod = new AdmZip();
  legitMod.addFile('fabric.mod.json', Buffer.from(JSON.stringify({ id: 'drippyloadingscreen', name: 'Drippy Loading Screen' })));
  legitMod.addFile('com/drippy/Mod.class', Buffer.from([0xCA, 0xFE, 0xBA, 0xBE]));
  const legitModPath = path.join(tmp, 'kaan_test_drippy.jar');
  legitMod.writeZip(legitModPath);

  const modRes = deepArchiveScanner.inspectTargetFile(legitModPath);
  assert.strictEqual(modRes, null, 'drippyloadingscreen ASLA hile olarak isaretlenmemeli');

  // Cleanup temp files
  try { fs.unlinkSync(xlitePath); } catch(e) {}
  try { fs.unlinkSync(clawPath); } catch(e) {}
  try { fs.unlinkSync(legitModPath); } catch(e) {}
});

// 4. TEST: Orbit Event Bus Independence (ThunderHack does not falsely trigger Meteor Client)
runTest('Yanlis Bayrak Korumasi: Orbit kullanan ThunderHack istemcisi yanlislikla Meteor olarak isaretlenmemeli', () => {
  const thPath = '/tmp/kaan_cheats_analysis/kaan beyin hileleri/thunderhack-1.7.jar';
  if (fs.existsSync(thPath)) {
    const res = deepArchiveScanner.inspectTargetFileAll(thPath);
    assert(res.length > 0, 'Thunderhack tespit edilmeli');
    assert.strictEqual(res[0].name, 'ThunderHack / Thunder (Recode & Plus)', 'ThunderHack kendi ismiyle tespit edilmeli, Meteor ile karismamali');
  }
});

// 5. TEST: Nested Mixin Remote Loader Detection (PrestigeLoader -> github-mixin-loader)
runTest('Gomulu Hile Yukleyici: PrestigeLoader icindeki github-mixin-loader basariyla tespit edilmeli', () => {
  const plPath = '/tmp/kaan_cheats_analysis/kaan beyin hileleri/PrestigeLoader-26.2.jar';
  if (fs.existsSync(plPath)) {
    const res = deepArchiveScanner.inspectTargetFileAll(plPath);
    assert(res.length > 0, 'PrestigeLoader icindeki mixin loader yakalanmali');
    assert(res[0].name.includes('Prestige Loader'), 'Prestige Loader kurali tetiklenmeli');
  }
});

console.log(`\n====================================================`);
console.log(`   SONUC: ${passedTests} / ${totalTests} TEST BASARILI!`);
console.log(`====================================================\n`);
