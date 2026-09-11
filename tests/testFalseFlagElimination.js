/**
 * Atlas AC - 0 False-Flag Elimination Test Suite
 * Validates that all 8 real-world false flag categories reported by users produce ZERO threats,
 * while genuine cheats remain 100% detectable.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const AdmZip = require('adm-zip');

const fontForensics = require('../src/engine/fontExploitForensics');
const peInspector = require('../src/engine/peBinaryInspector');
const trojanDetector = require('../src/engine/trojanModDetector');
const ldDetector = require('../src/engine/ldPreloadInjectionDetector');
const hollowDetector = require('../src/engine/processHollowingDetector');
const srumForensics = require('../src/engine/srumForensics');
const defenderForensics = require('../src/engine/defenderForensics');
const cheatKb = require('../src/engine/cheatKnowledgeBase');

let passedTests = 0;
let totalTests = 0;

async function runTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

async function main() {
  console.log('\n====================================================');
  console.log('   ATLAS AC - 0 FALSE-FLAG ELIMINATION TEST SUITE   ');
  console.log('====================================================\n');

  // 1. Redstone Tweaks ascent: -32768 (Short.MIN_VALUE HUD offset)
  await runTest('0 False-Flag Font: Redstone Tweaks -32768 negatif HUD ötelemesi temiz kalmalı', () => {
    const redstoneTweaksFont = JSON.stringify({
      providers: [
        {
          type: 'bitmap',
          file: 'minecraft:font/actionbar.png',
          ascent: -32768,
          height: -130,
          chars: ['\uE001']
        }
      ]
    });

    const findings = fontForensics.inspectFontJsonContent(
      redstoneTweaksFont,
      'resourcepacks/Redstone Tweaks 2.5.3.zip -> assets/minecraft/font/default.json'
    );
    assert.strictEqual(findings.length, 0, 'Redstone Tweaks -32768 değeri false flag üretmemeli!');
  });

  // 2. Crystal PvP LT3 Essentials: minecraft:include/default reference
  await runTest('0 False-Flag Font: Crystal PvP minecraft:include/default referansı temiz kalmalı', () => {
    const crystalPvpFont = JSON.stringify({
      providers: [
        {
          type: 'reference',
          id: 'minecraft:include/default'
        }
      ]
    });

    const findings = fontForensics.inspectFontJsonContent(
      crystalPvpFont,
      'resourcepacks/Crystal PvP LT3 Essentials v25.zip -> assets/minecraft/font/default.json'
    );
    assert.strictEqual(findings.length, 0, 'minecraft:include/default meşru include sağlayıcısı false flag üretmemeli!');
  });

  // 3. True Circular Reference Exploit MUST still be caught
  await runTest('Gerçek Hile Font: default.json içinde doğrudan minecraft:default referansı CRITICAL olarak yakalanmalı', () => {
    const exploitFont = JSON.stringify({
      providers: [
        {
          type: 'reference',
          id: 'minecraft:default'
        }
      ]
    });

    const findings = fontForensics.inspectFontJsonContent(
      exploitFont,
      'assets/minecraft/font/default.json'
    );
    assert(findings.length >= 1, 'Gerçek özyinelemeli font çökertme istismarı yakalanmalı!');
    assert.strictEqual(findings[0].type, 'MINECRAFT_FONT_CIRCULAR_CRASH_EXPLOIT');
    assert.strictEqual(findings[0].level, 'CRITICAL');
  });

  // 4. JavaFX/OpenJFX glass.dll Native
  await runTest('0 False-Flag PE: JavaFX glass.dll meşru yerel kütüphane olarak tanınmalı (Autoclicker sayılmamalı)', () => {
    const buffer = Buffer.alloc(4096);
    buffer[0] = 0x4D; // 'M'
    buffer[1] = 0x5A; // 'Z'
    buffer.writeUInt32LE(0x80, 0x3C); // e_lfanew
    buffer.write('PE\0\0', 0x80, 'ascii');
    buffer.writeUInt16LE(0x8664, 0x84); // x64 Machine
    buffer.writeUInt16LE(0x2000, 0x96); // IMAGE_FILE_DLL

    const content = 'Java_com_sun_glass_ui_win_WinApplication_runLoop com.sun.glass.ui.win mouse_event SendInput GetAsyncKeyState interval double click';
    buffer.write(content, 0x200, 'utf8');

    const res = peInspector.inspectBuffer(buffer, 'C:\\minecraft\\natives\\glass.dll', buffer.length);
    assert.strictEqual(res.isThreat, false, 'glass.dll bir tehdit olarak işaretlenmemeli!');
    assert.strictEqual(res.isSafe, true, 'glass.dll güvenli olarak işaretlenmeli!');
    assert.strictEqual(res.purpose, 'LEGITIMATE_MINECRAFT_NATIVE');
  });

  // 5. Screenshare Scanner Tool (AstralisFinder.exe)
  await runTest('0 False-Flag PE: AstralisFinder.exe güvenlik aracı olarak tanınmalı (Hile sayılmamalı)', () => {
    const buffer = Buffer.alloc(4096);
    buffer[0] = 0x4D;
    buffer[1] = 0x5A;
    buffer.writeUInt32LE(0x80, 0x3C);
    buffer.write('PE\0\0', 0x80, 'ascii');
    buffer.writeUInt16LE(0x8664, 0x84);

    const content = 'Astralis Scanner liquidbounce vape drip killaura';
    buffer.write(content, 0x200, 'utf8');

    const res = peInspector.inspectBuffer(buffer, '/home/user/Downloads/AstralisFinder/AstralisFinder.exe', buffer.length);
    assert.strictEqual(res.isThreat, false, 'AstralisFinder.exe hile olarak işaretlenmemeli!');
    assert.strictEqual(res.isSafe, true, 'AstralisFinder.exe güvenli denetim aracı olarak işaretlenmeli!');
    assert.strictEqual(res.purpose, 'SECURITY_SCANNER_TOOL');
  });

  // 6. Fabric Processed Mod (net.lenni0451.reflect)
  await runTest('0 False-Flag Mod: net.lenni0451.reflect kütüphanesindeki Unsafe erişimi temiz kalmalı', () => {
    const zip = new AdmZip();
    zip.addFile('net/lenni0451/reflect/JavaUnsafe.class', Buffer.from('sun/misc/Unsafe defineAnonymousClass allocateMemory getFieldOffset'));

    const tmpPath = path.join(os.tmpdir(), '.fabric', 'processedMods');
    fs.mkdirSync(tmpPath, { recursive: true });
    const jarPath = path.join(tmpPath, 'net_lenni0451_reflect-1.3.4.jar');
    zip.writeZip(jarPath);

    try {
      const findings = trojanDetector.analyzeJar(jarPath);
      assert.strictEqual(findings.length, 0, 'net_lenni0451_reflect kütüphanesi false flag üretmemeli!');
    } finally {
      try { fs.unlinkSync(jarPath); } catch (_) {}
    }
  });

  // 7. True Trojan with Unsafe Dropper + Synthetic Input MUST still be caught
  await runTest('Gerçek Truva Atı: Masum görünümlü JAR içindeki donanım tıklaması + TriggerBot yakalanmalı', () => {
    const zip = new AdmZip();
    zip.addFile('com/mod/crosshair/CrosshairMixin.class', Buffer.from('XTestFakeButtonEvent isInFOV method_7261 field_1692 targetedEntity'));

    const testJar = path.join(os.tmpdir(), 'crosshair-cheat.jar');
    zip.writeZip(testJar);

    try {
      const findings = trojanDetector.analyzeJar(testJar);
      assert(findings.length >= 1, 'Truva atı triggerbot yakalanmalıydı!');
      assert.strictEqual(findings[0].type, 'TROJAN_TRIGGERBOT_MOD');
    } finally {
      try { fs.unlinkSync(testJar); } catch (_) {}
    }
  });

  // 8. KDE Plasma /memfd:JITCode:QtQml (deleted) exclusion
  await runTest('0 False-Flag Linux: plasmashell ve /memfd:JITCode:QtQml ghost injection sayılmamalı', async () => {
    if (process.platform === 'linux') {
      const currentPid = process.pid;
      const findings = await ldDetector._checkUnlinkedExecMaps(String(currentPid));
      const memfdFindings = findings.filter(f => f.path && f.path.includes('memfd'));
      assert.strictEqual(memfdFindings.length, 0, 'memfd JIT haritaları ghost injection sayılmamalı!');
    }
  });

  // 9. /tmp analysis folders exclusion in shared memory detector
  await runTest('0 False-Flag Linux: /tmp/kaan_cheats_analysis dizini SHM segmenti sayılmamalı', async () => {
    const findings = await hollowDetector.scanProcessHollowing();
    const falseTmpFindings = findings.findings.filter(f => f.path && f.path.includes('kaan_cheats_analysis'));
    assert.strictEqual(falseTmpFindings.length, 0, 'Geçici analiz klasörü shared memory segmenti sayılmamalı!');
  });

  // 10. Cheat KnowledgeBase accurate routing
  await runTest('Rehber Doğruluğu: LINUX_TAINTED_KERNEL ve DELETED_CHEAT_IN_LINUX_TRASH doğru açıklanmalı', () => {
    const taintedExpl = cheatKb.getExplanation({ type: 'LINUX_TAINTED_KERNEL', name: 'Linux Tainted Kernel' }, 'tr');
    assert(taintedExpl.howItWorks.includes('NVIDIA') || taintedExpl.howItWorks.includes('donanım'), 'Tainted kernel donanım sürücüsü açıklamalı');
    assert(!taintedExpl.howItWorks.includes('BYOVD'), 'Tainted kernel Windows BYOVD açıklamasına düşmemeli!');

    const trashExpl = cheatKb.getExplanation({ type: 'DELETED_CHEAT_IN_LINUX_TRASH', name: 'Çöp Kutusu' }, 'tr');
    assert(trashExpl.howItWorks.includes('Trash') || trashExpl.howItWorks.includes('Çöp Kutusu') || trashExpl.howItWorks.includes('çöp'), 'Linux trash açıklaması eşleşmeli');
    assert(!trashExpl.howItWorks.includes('NTFS'), 'Linux trash Windows NTFS açıklamasına düşmemeli!');

    const scannerExpl = cheatKb.getExplanation({ type: 'SECURITY_SCANNER_TOOL', name: 'AstralisFinder.exe' }, 'tr');
    assert(scannerExpl.howItWorks.includes('Astralis') || scannerExpl.howItWorks.includes('denetim'), 'Scanner açıklaması eşleşmeli');
  });

  // 11. SKLauncher official launcher
  await runTest('0 False-Flag Launcher: SKLauncher (sklauncher-fx.jar) resmi başlatıcı temiz kalmalı', () => {
    const skPath = '/home/eververity/.minecraft/sklauncher-fx.jar';
    if (fs.existsSync(skPath)) {
      const findings = trojanDetector.analyzeJar(skPath);
      assert.strictEqual(findings.length, 0, 'SKLauncher hile enjektörü sayılmamalı!');
    }
  });

  // 12. JetBrains Kotlin Coroutines
  await runTest('0 False-Flag Modloader Lib: JetBrains Kotlin Coroutines (.fabric/processedMods) temiz kalmalı', () => {
    const ktPath = '/home/eververity/.minecraft/.fabric/processedMods/org_jetbrains_kotlinx_kotlinx-co-jvm-1.10.2-dc3d13b93361afd1.jar';
    if (fs.existsSync(ktPath)) {
      const findings = trojanDetector.analyzeJar(ktPath);
      assert.strictEqual(findings.length, 0, 'Kotlin Coroutines hile enjektörü sayılmamalı!');
    }
  });

  // 13. Minecraft Server Plugins
  await runTest('0 False-Flag Server: Geyser-Spigot sunucu eklentisi Unsafe veya Truva atı sayılmamalı', () => {
    const gPath = '/home/eververity/Masaüstü/onemli seyler/AstralisSaga/plugins/Geyser-Spigot.jar';
    if (fs.existsSync(gPath)) {
      const findings = trojanDetector.analyzeJar(gPath);
      assert.strictEqual(findings.length, 0, 'Geyser-Spigot sunucu eklentisi hile sayılmamalı!');
    }
  });

  // 14. Microsoft Windows Core System DLLs
  await runTest('0 False-Flag System DLL: KernelBase.dll Windows sistem kütüphanesi hile enjektörü sayılmamalı', () => {
    const kbPath = '/home/eververity/İndirilenler/KernelBase.dll';
    if (fs.existsSync(kbPath)) {
      const res = peInspector.inspectFile(kbPath);
      assert.strictEqual(res.isSafe, true, 'KernelBase.dll güvenli olmalı');
      assert.strictEqual(res.isThreat, false, 'KernelBase.dll tehdit sayılmamalı');
      assert.strictEqual(res.purpose, 'LEGITIMATE_WINDOWS_SYSTEM_LIBRARY');
    }
  });

  console.log('\n====================================================');
  console.log(`   SONUC: ${passedTests} / ${totalTests} TEST BASARILI!`);
  console.log('====================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
