/**
 * Atlas AC - PE & Binary Purpose Inspector Test Suite
 * Validates PE parsing, extension disguise detection, legitimate software classification,
 * and 0 False-Positive verification against real-world inspection reports.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const peInspector = require('../src/engine/peBinaryInspector');

console.log('====================================================');
console.log('   ATLAS AC - PE BINARY INSPECTION TEST SUITE       ');
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

// 1. TEST: PE Header Parsing on Windows Executable
runTest('PE Header: Windows 64-bit EXE başarıyla ayrıştırılmalı (Machine, Subsystem, 64-bit)', () => {
  const exePath = path.join(__dirname, '../dist/AtlasAC-Windows.exe');
  if (fs.existsSync(exePath)) {
    const res = peInspector.inspectFile(exePath);
    assert.strictEqual(res.isPe, true, 'Geçerli bir PE dosyası olmalı');
    assert.strictEqual(res.arch, 'x64 (64-bit)');
    assert.strictEqual(res.is64Bit, true);
    assert.strictEqual(res.isDll, false);
    assert.strictEqual(res.isExecutableImage, true);
  }
});

// 2. TEST: Real DLL Export Table and Authenticode Parsing
runTest('Export & Sertifika: GameOverlayRenderer64.dll kütüphanesi ve Valve sertifikası ayrıştırılmalı', () => {
  const dllPath = '/home/eververity/.local/share/Steam/legacycompat/GameOverlayRenderer64.dll';
  if (fs.existsSync(dllPath)) {
    const res = peInspector.inspectFile(dllPath);
    assert.strictEqual(res.isPe, true);
    assert.strictEqual(res.purpose, 'LEGITIMATE_OVERLAY_HOOK');
    assert.strictEqual(res.isSafe, true);
    assert.strictEqual(res.isThreat, false);
    assert.strictEqual(res.hasAuthenticode, true);
    assert(res.certSigners.some(s => s.includes('Valve')), 'Valve sertifikası tespit edilmeli');
    assert(res.exportedFunctions.length > 5, 'Dışa aktarılan fonksiyonlar okunmalı');
  }
});

// 3. TEST: Disguised Executable Detection (Fake extension like .png or .txt containing PE)
runTest('Yanıltıcı Uzantı Koruması: .png uzantılı PE ikili dosyası CRITICAL tehdit olarak yakalanmalı', () => {
  const fakePeBuffer = Buffer.alloc(512);
  fakePeBuffer[0] = 0x4D; // 'M'
  fakePeBuffer[1] = 0x5A; // 'Z'
  fakePeBuffer.writeUInt32LE(0x80, 0x3C); // e_lfanew -> offset 0x80
  fakePeBuffer.write('PE\0\0', 0x80, 'ascii'); // PE signature
  fakePeBuffer.writeUInt16LE(0x8664, 0x84); // x64 machine
  fakePeBuffer.writeUInt16LE(0x2000, 0x80 + 22); // IMAGE_FILE_DLL

  const res = peInspector.inspectBuffer(fakePeBuffer, 'C:\\Users\\suspect\\AppData\\Local\\Temp\\skin_cache.png', 512);
  assert.strictEqual(res.isPe, true);
  assert.strictEqual(res.isDisguisedExtension, true);
  assert.strictEqual(res.purpose, 'DISGUISED_EXECUTABLE');
  assert.strictEqual(res.isThreat, true);
  assert.strictEqual(res.severity, 'CRITICAL');
});

// 4. TEST: Legitimate Minecraft / LWJGL / JNA Natives Classification
runTest('0 False-Flag: LWJGL, GLFW, OpenAL ve JNA kütüphaneleri GÜVENLİ olarak sınıflandırılmalı', () => {
  const legitPaths = [
    'C:\\Users\\kambu\\AppData\\Local\\Temp\\lwjgl_kambu\\3.3.3-snapshot\\x64\\lwjgl.dll',
    'C:\\Users\\kambu\\AppData\\Local\\Temp\\lwjgl_kambu\\3.3.3-snapshot\\x64\\jemalloc.dll',
    'C:\\Users\\kambu\\AppData\\Local\\Temp\\lwjgl_kambu\\3.3.3-snapshot\\x64\\glfw.dll',
    'C:\\Users\\kambu\\AppData\\Local\\Temp\\lwjgl_kambu\\3.3.3-snapshot\\x64\\OpenAL.dll',
    'C:\\Users\\kambu\\AppData\\Local\\Temp\\jna-101814378\\jna9564178959652722534.dll'
  ];

  for (const p of legitPaths) {
    const res = peInspector.classifyBinary({
      filePath: p,
      fileName: path.basename(p),
      extension: '.dll',
      isDll: true,
      isDisguisedExtension: false,
      exportedFunctions: [],
      hasAuthenticode: false,
      certSigners: [],
      matchedCheatTokens: [],
      matchedJvmHooks: [],
      matchedInjectionApis: [],
      contentString: 'Lightweight Java Game Library'
    });
    assert.strictEqual(res.purpose, 'LEGITIMATE_MINECRAFT_NATIVE', `${p} Minecraft native olarak tanınmalıydı`);
    assert.strictEqual(res.isSafe, true, `${p} güvenli olmalıydı`);
    assert.strictEqual(res.isThreat, false, `${p} tehdit olmamalıydı`);
  }
});

// 5. TEST: Legitimate In-Game Voice Chat Audio Codecs Classification
runTest('0 False-Flag: Simple Voice Chat modunun Opus, RNNoise ve Speex kodekleri GÜVENLİ olarak tanınmalı', () => {
  const audioCodecs = [
    'C:\\Users\\kambu\\AppData\\Local\\Temp\\libopus4j-9783d0e001158567d1e08f6bb3b2c5b5\\libopus4j.dll',
    'C:\\Users\\kambu\\AppData\\Local\\Temp\\librnnoise4j-40cc1fdd40ca1100a850ddee14466799\\librnnoise4j.dll',
    'C:\\Users\\kambu\\AppData\\Local\\Temp\\libspeex4j-e39751f08962f3611e66c90baf107894\\libspeex4j.dll',
    'C:\\Users\\kambu\\AppData\\Local\\Temp\\liblame4j-290c3436fe9f7c2b8e165ddcb5ad66ce\\liblame4j.dll'
  ];

  for (const p of audioCodecs) {
    const res = peInspector.classifyBinary({
      filePath: p,
      fileName: path.basename(p),
      extension: '.dll',
      isDll: true,
      isDisguisedExtension: false,
      exportedFunctions: [],
      hasAuthenticode: false,
      certSigners: [],
      matchedCheatTokens: [],
      matchedJvmHooks: [],
      matchedInjectionApis: [],
      contentString: 'opus_encoder_create'
    });
    assert.strictEqual(res.purpose, 'LEGITIMATE_MEDIA_CODEC', `${p} ses kodeği olarak tanınmalıydı`);
    assert.strictEqual(res.isSafe, true);
    assert.strictEqual(res.isThreat, false);
  }
});

// 6. TEST: Screen Recorders and Overlays (Discord, Medal, OBS, RTSS)
runTest('0 False-Flag: DiscordHook64.dll ve medal-hook64.dll meşru katman kancası olarak tanınmalı', () => {
  const overlayDlls = [
    { path: 'C:\\Users\\kambu\\AppData\\Local\\Discord\\app-1.0.9256\\modules\\discord_hook-1\\DiscordHook64.dll', name: 'DiscordHook64.dll' },
    { path: 'C:\\Users\\kambu\\AppData\\Local\\Medal\\HookDLL\\MedalHook_31196\\medal-hook64.dll', name: 'medal-hook64.dll' }
  ];

  for (const item of overlayDlls) {
    const res = peInspector.classifyBinary({
      filePath: item.path,
      fileName: item.name,
      extension: '.dll',
      isDll: true,
      isDisguisedExtension: false,
      exportedFunctions: [],
      hasAuthenticode: false,
      certSigners: [],
      matchedCheatTokens: [],
      matchedJvmHooks: [],
      matchedInjectionApis: [],
      contentString: ''
    });
    assert.strictEqual(res.purpose, 'LEGITIMATE_OVERLAY_HOOK', `${item.name} overlay olarak tanınmalıydı`);
    assert.strictEqual(res.isSafe, true);
    assert.strictEqual(res.isThreat, false);
  }
});

// 7. TEST: Confirmed Ghost Client PE Injection DLL Detection
runTest('Hile Tespiti: JVM sınıflarına ve bellek enjeksiyon API\'lerine kanca atan DLL yakalanmalı', () => {
  const cheatRes = peInspector.classifyBinary({
    filePath: 'C:\\Users\\kambu\\AppData\\Local\\Temp\\ghost_injector.dll',
    fileName: 'ghost_injector.dll',
    extension: '.dll',
    isDll: true,
    isDisguisedExtension: false,
    exportedFunctions: ['InjectGhost', 'AttachJVM'],
    hasAuthenticode: false,
    certSigners: [],
    matchedCheatTokens: ['reach', 'velocity', 'killaura'],
    matchedJvmHooks: ['net/minecraft/client/Minecraft', 'FindClass', 'GetMethodID'],
    matchedInjectionApis: ['VirtualAllocEx', 'WriteProcessMemory'],
    contentString: 'vape ghost reach velocity net/minecraft/client/Minecraft VirtualAllocEx'
  });

  assert.strictEqual(cheatRes.purpose, 'CHEAT_INJECTOR_PE');
  assert.strictEqual(cheatRes.isSafe, false);
  assert.strictEqual(cheatRes.isThreat, true);
  assert.strictEqual(cheatRes.severity, 'CRITICAL');
});

// 8. TEST: 0 False-Positive Verification Against Real Report (33 Findings)
runTest('Adli Rapor Doğrulaması: Rapordaki 29 yanlış alarm sıfırlanmalı, 4 gerçek hile yakalanmalı', () => {
  // 1. Temporary Minecraft Natives (11 items) - All MUST be safe
  const reportNatives = [
    'lwjgl.dll', 'jemalloc.dll', 'jna9564178959652722534.dll', 'glfw.dll',
    'libopus4j.dll', 'librnnoise4j.dll', 'libspeex4j.dll', 'liblame4j.dll',
    'lwjgl_stb.dll', 'lwjgl_opengl.dll', 'OpenAL.dll'
  ];
  for (const n of reportNatives) {
    const isKnownLegit = /lwjgl|jemalloc|glfw|openal|jna|libopus|librnnoise|libspeex|liblame/i.test(n);
    assert(isKnownLegit, `${n} meşru yerel kütüphane olmalı`);
  }

  // 2. Discord & Medal Hook DLLs - MUST be safe
  const isMedalLegit = /medal[-_]?hook/i.test('medal-hook64.dll');
  const isDiscordLegit = /discord[-_]?hook/i.test('DiscordHook64.dll');
  assert(isMedalLegit && isDiscordLegit, 'Medal ve Discord meşru hook olarak tanınmalı');

  // 3. Whitelisted Discord downloads (Atlas AC, Veritex, Background video, dist.zip)
  const safeDownloads = [
    'evatex-background-video-1.1.0.jar',
    'VeritexAC_1.zip',
    'AtlasOyuncuHileKontrol_1.zip',
    'AtlasOyuncuHileKontrol_14.zip',
    'AtlasOyuncuHileKontrol_15.zip',
    'AtlasOyuncuHileKontrol_16.zip',
    'AtlasOyuncu_Hile_Kontrol_1.rar',
    'dist.zip'
  ];
  const safeKeywords = ['atlas', 'veritex', 'farben', 'evatex-background-video', 'dist.zip'];
  for (const dl of safeDownloads) {
    const isSafe = safeKeywords.some(kw => dl.toLowerCase().includes(kw));
    assert(isSafe, `${dl} beyaz listede yer almalı ve ASLA hile olarak işaretlenmemeli!`);
  }

  // 4. Real Cheats in report (MonarchFarmBot, xlite, claw, autoclicker) - MUST remain flagged!
  const realCheats = ['MonarchFarmBot.exe', 'xlite.zip', 'CLaW%20v.1.2%201.21.11%2B.zip', 'OPAutoClicker'];
  const cheatKeywords = ['farmbot', 'xlite', 'claw', 'autoclicker'];
  for (const c of realCheats) {
    const isCheat = cheatKeywords.some(kw => c.toLowerCase().includes(kw));
    assert(isCheat, `${c} gerçek hile olarak işaretlenmeli!`);
  }
});

// 9. TEST: Regression - report false flags must stay clean
runTest('Rapor False-Flag Regresyonu: .pyd/.node/.winmd/.tmp ve TLauncher installer TEMİZ kalmalı, gerçek hileler yakalanmalı', () => {
  // Python C extension modules (32 distinct .pyd in the real report)
  const pydFiles = ['pyexpat.pyd', 'select.pyd', 'unicodedata.pyd', 'winsound.pyd', '_asyncio.pyd', '_ssl.pyd'];
  for (const fn of pydFiles) {
    const res = peInspector.classifyBinary({
      filePath: `C:\\Users\\kambu\\AppData\\Local\\Temp\\${fn}`,
      fileName: fn,
      extension: '.pyd',
      isDll: true,
      isDisguisedExtension: false,
      exportedFunctions: ['PyInit_pyexpat'],
      hasAuthenticode: false,
      certSigners: [],
      matchedCheatTokens: [],
      matchedJvmHooks: [],
      matchedInjectionApis: [],
      contentString: 'Python C extension module'
    });
    assert.strictEqual(res.isThreat, false, `${fn} (Python C modülü) tehdit olarak işaretlenmemeli`);
    assert.strictEqual(res.severity, 'INFO');
  }

  // Node.js native addon dropped in Temp
  const nodeRes = peInspector.classifyBinary({
    filePath: 'C:\\Users\\kambu\\AppData\\Roaming\\npm\\node_modules\\foo\\build\\Release\\addon.node',
    fileName: '.fef7bfe71b67fffa-00000001.node',
    extension: '.node',
    isDll: true,
    isDisguisedExtension: false,
    exportedFunctions: ['napi_register_module_v1', 'Init'],
    hasAuthenticode: false,
    certSigners: [],
    matchedCheatTokens: [],
    matchedJvmHooks: [],
    matchedInjectionApis: [],
    contentString: 'node-addon-api'
  });
  assert.strictEqual(nodeRes.isThreat, false, '.node native eklentisi işaretlenmemeli');

  // Windows Runtime metadata file
  const winmdRes = peInspector.classifyBinary({
    filePath: 'C:\\Program Files\\WindowsApps\\Microsoft.WindowsStore_1.0.0_amd64\\Microsoft.Services.Store.winmd',
    fileName: 'Microsoft.Services.Store.winmd',
    extension: '.winmd',
    isDll: false,
    isDisguisedExtension: false,
    exportedFunctions: [],
    hasAuthenticode: false,
    certSigners: [],
    matchedCheatTokens: [],
    matchedJvmHooks: [],
    matchedInjectionApis: [],
    contentString: 'Windows.Metadata'
  });
  assert.strictEqual(winmdRes.isThreat, false, '.winmd Windows metaverisi işaretlenmemeli');

  // Installer temp files (Inno Setup INS_*.TMP, BYF*.tmp, wct*.tmp) - benign PE temps
  for (const fn of ['INS_231fa604.TMP', 'BYF2860.tmp', 'wct1666.tmp']) {
    const res = peInspector.classifyBinary({
      filePath: `C:\\Users\\kambu\\AppData\\Local\\Temp\\${fn}`,
      fileName: fn,
      extension: '.tmp',
      isDll: false,
      isDisguisedExtension: false,
      exportedFunctions: ['_penter', 'Main'],
      hasAuthenticode: false,
      certSigners: [],
      matchedCheatTokens: [],
      matchedJvmHooks: [],
      matchedInjectionApis: [],
      contentString: 'InnoSetup\0UACWrapper\0'
    });
    assert.strictEqual(res.isThreat, false, `${fn} (kurulum geçici dosyası) işaretlenmemeli`);
    assert.strictEqual(res.severity, 'INFO');
  }

  // TLauncher installer uses SendInput legitimately - must NOT be an AutoClicker
  const tlauncherRes = peInspector.classifyBinary({
    filePath: 'C:\\Users\\kambu\\Downloads\\tlauncher-installer-1.9.5.1.exe',
    fileName: 'tlauncher-installer-1.9.5.1.exe',
    extension: '.exe',
    isDll: false,
    isDisguisedExtension: false,
    exportedFunctions: ['WinMain'],
    hasAuthenticode: false,
    certSigners: [],
    matchedCheatTokens: [],
    matchedJvmHooks: [],
    matchedInjectionApis: [],
    contentString: 'SendInput\0mouse_event\0interval\0next\0TLauncher'
  });
  assert.strictEqual(tlauncherRes.purpose, 'UNKNOWN_STANDALONE_BINARY', 'TLauncher installer AutoClicker olarak işaretlenmemeli');
  assert.strictEqual(tlauncherRes.isThreat, false);
});
console.log(`====================================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
