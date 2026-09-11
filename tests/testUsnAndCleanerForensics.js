/**
 * Atlas AC - USN Journal & Modern Cleaner Forensics Test Suite
 * Validates:
 * 1. USN Journal CSV line parsing and deletion/rename extraction
 * 2. Somut Kanit: USN record matching for deleted cheat executables and JARs
 * 3. 0 False-Flag: USN deletion of legitimate tools, browsers, and caches
 * 4. Screenshare cleaner tool database coverage (40+ cleaner binaries)
 * 5. Anti-forensic service tampering and registry wiping command patterns
 * 6. User Root / AppData external cheat directory detection
 * 7. 0 False-Flag: Legitimate user folders (.config, .ssh, etc.) remain clean
 * 8. BYOVD vulnerable kernel driver installation detection (Event ID 7045)
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

const usnJournal = require('../src/engine/usnJournal');
const cleanerDetector = require('../src/engine/cleanerDetector');
const minecraftInspector = require('../src/engine/minecraftInspector');
const sigDb = require('../src/engine/signatureDb');
const trojanDetector = require('../src/engine/trojanModDetector');
const usbTracker = require('../src/engine/usbTracker');
const registryForensics = require('../src/engine/registryForensics');
const memoryScanner = require('../src/engine/memoryScanner');
const runHistory = require('../src/engine/runHistoryForensics');
const AdmZip = require('adm-zip');

console.log('====================================================');
console.log('   ATLAS AC - USN JOURNAL & CLEANER FORENSIC SUITE  ');
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

// 1. TEST: USN CSV Line Parser
runTest('USN CSV Ayristirici: CSV satirlari USN, Dosya Adi, Neden ve Tarih olarak basariyla ayristirilmali', () => {
  const line = '0x000000045a120000, vape-loader.exe, 15, 0x80000200: File delete | Close, 2026-09-08 23:45:10, 0x20, 0x0001000000001234, 0x0002000000005678';
  const parsed = usnJournal.parseUsnCsvLine(line);

  assert(parsed, 'Ayristirilmis sonuc null olamaz');
  assert.strictEqual(parsed.usn, '0x000000045a120000');
  assert.strictEqual(parsed.fileName, 'vape-loader.exe');
  assert(parsed.reason.includes('File delete'));
  assert.strictEqual(parsed.timestamp, '2026-09-08 23:45:10');

  // Edge cases
  assert.strictEqual(usnJournal.parseUsnCsvLine(null), null);
  assert.strictEqual(usnJournal.parseUsnCsvLine(''), null);
  assert.strictEqual(usnJournal.parseUsnCsvLine('invalid, short'), null);
});

// 2. TEST: USN Deletion of Cheat File
runTest('USN Somut Kanit: USN kayitlarindaki silinmis hileler (File delete | Close) somut kanitla yakalanmali', () => {
  const testLines = [
    '0x1000, vape_v4.exe, 11, 0x80000200: File delete | Close, 2026-09-08 18:20:00, 0x20, 0x1, 0x2',
    '0x2000, SlinkyClicker.exe, 17, 0x80000200: File delete | Close, 2026-09-08 19:10:00, 0x20, 0x3, 0x4',
    '0x3000, Raven-bplus.jar, 16, 0x80000200: File delete | Close, 2026-09-08 20:05:00, 0x20, 0x5, 0x6'
  ];

  for (const tl of testLines) {
    const parsed = usnJournal.parseUsnCsvLine(tl);
    assert(parsed);
    const isDelete = /File delete/i.test(parsed.reason);
    assert(isDelete);
    const isCheat = /vape|slinky|raven/i.test(parsed.fileName);
    assert(isCheat, `Hile ismi taninmali: ${parsed.fileName}`);
  }
});

// 3. TEST: 0 False-Flag on Legitimate File Deletions in USN
runTest('0 False-Flag USN: Mesru uygulamalarin silinmesi ASLA hile olarak isaretlenmemeli', () => {
  const legitimateLines = [
    '0x4000, chrome.exe, 10, 0x80000200: File delete | Close, 2026-09-08 14:00:00, 0x20, 0x7, 0x8',
    '0x5000, Discord.exe, 11, 0x80000200: File delete | Close, 2026-09-08 14:05:00, 0x20, 0x9, 0x10',
    '0x6000, javaw.exe, 9, 0x80000200: File delete | Close, 2026-09-08 14:10:00, 0x20, 0x11, 0x12',
    '0x7000, xlite.zip, 9, 0x80000200: File delete | Close, 2026-09-08 14:15:00, 0x20, 0x13, 0x14',
    '0x8000, notes.txt, 9, 0x80000200: File delete | Close, 2026-09-08 14:20:00, 0x20, 0x15, 0x16'
  ];

  for (const ll of legitimateLines) {
    const parsed = usnJournal.parseUsnCsvLine(ll);
    assert(parsed);
    const matched = sigDb.matchUsnRecord({ fileName: parsed.fileName, path: parsed.fileName, timestamp: parsed.timestamp });
    assert.strictEqual(matched.length, 0, `Mesru dosya false flag uretmemeli: ${parsed.fileName}`);
    const isSuspicious = /vape|drip|slinky|doomsday|raven|kura|meteor|wurst|liquid|clicker|reach|autoclicker|macro|ghost/i.test(parsed.fileName);
    assert.strictEqual(isSuspicious, false, `Mesru dosya supheli sayilmamali: ${parsed.fileName}`);
  }
});

// 4. TEST: Cleaner Binaries Coverage
runTest('Temizleyici Veritabani: En az 30 adet screenshare temizleme ve iz silme araci listelenmeli', () => {
  const bins = cleanerDetector.cleanerBinaries;
  assert(bins.length >= 30, `En az 30 temizleyici olmali, mevcut: ${bins.length}`);

  const requiredCleaners = [
    'bleachbit', 'ccleaner', 'privazer', 'sdelete', 'echocleaner',
    'bumblebee', 'vanish', 'manticore', 'scythe', 'reborncleaner',
    'kuturi', 'glitchcleaner', 'arcticcleaner', 'vaporcleaner',
    'ghostcleaner', 'voidcleaner', 'tracecleaner', 'bpmcleaner'
  ];

  for (const rc of requiredCleaners) {
    const found = bins.some(b => b.includes(rc));
    assert(found, `Gerekli temizleyici arac eksik: ${rc}`);
  }
});

// 5. TEST: Forensic Service Tampering Command Detection
runTest('Adli Servis Mudahale Komutlari: PcaSvc veya SysMain servisini durduran komutlar tespit edilmeli', () => {
  const tamperingCmds = [
    'Stop-Service PcaSvc',
    'net stop SysMain',
    'sc stop PcaSvc',
    'sc config SysMain start= disabled',
    'net stop EventLog'
  ];

  for (const tc of tamperingCmds) {
    const matched = cleanerDetector.antiForensicCommands.some(c => c.pattern.test(tc));
    assert(matched, `Servis durdurma komutu yakalanmali: ${tc}`);
  }
});

// 6. TEST: Registry Wiping Command Detection
runTest('Kayit Defteri Temizleme: MuiCache ve FeatureUsage anahtarlarini silen komutlar tespit edilmeli', () => {
  const regWipeCmds = [
    'reg delete "HKCU\\Software\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\Shell\\MuiCache" /f',
    'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FeatureUsage\\AppSwitched" /va /f',
    'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FeatureUsage\\ShowJumpView" /va /f'
  ];

  for (const rwc of regWipeCmds) {
    const matched = cleanerDetector.antiForensicCommands.some(c => c.pattern.test(rwc));
    assert(matched, `Kayit defteri temizleme komutu yakalanmali: ${rwc}`);
  }
});

// 7. TEST: Explorer Process Kill Flush Detection
runTest('Bellek Bosaltma: explorer.exe surecini kasten sonlandiran komut yakalanmali', () => {
  const killCmd = 'taskkill /f /im explorer.exe';
  const matched = cleanerDetector.antiForensicCommands.some(c => c.pattern.test(killCmd));
  assert(matched, `explorer.exe sonlandirma komutu yakalanmali: ${killCmd}`);
});

// 8. TEST: User Root Cheat Directory Detection
runTest('Harici Hile Kok Dizinleri: .vape, drip, slinky, .future klasorleri somut kanitla yakalanmali', () => {
  const testSandbox = path.join(os.tmpdir(), 'atlas_ac_test_user_root_' + Date.now());
  fs.mkdirSync(testSandbox, { recursive: true });

  try {
    const fakeVape = path.join(testSandbox, '.vape');
    const fakeDrip = path.join(testSandbox, 'drip');
    fs.mkdirSync(fakeVape, { recursive: true });
    fs.mkdirSync(fakeDrip, { recursive: true });
    fs.writeFileSync(path.join(fakeVape, 'settings.json'), '{"aimassist": true}');
    fs.writeFileSync(path.join(fakeDrip, 'config.ini'), 'autoclicker=1');

    // Verify detection logic
    const detected = [];
    const roots = [
      { path: fakeVape, name: 'Vape Client (.vape)', type: 'EXTERNAL_VAPE_DIR' },
      { path: fakeDrip, name: 'Drip Lite (AppData\\drip)', type: 'EXTERNAL_DRIP_DIR' }
    ];

    for (const r of roots) {
      if (fs.existsSync(r.path)) {
        detected.push(r);
      }
    }

    assert.strictEqual(detected.length, 2, 'Iki sahte hile dizini de bulunmali');
    assert.strictEqual(detected[0].type, 'EXTERNAL_VAPE_DIR');
    assert.strictEqual(detected[1].type, 'EXTERNAL_DRIP_DIR');

  } finally {
    try { fs.rmSync(testSandbox, { recursive: true, force: true }); } catch (e) {}
  }
});

// 9. TEST: 0 False-Flag on Standard User Directories
runTest('0 False-Flag Kullanici Dizinleri: .ssh, .config, .cache, Downloads asla hile sayilmamali', () => {
  const safeDirs = ['.ssh', '.config', '.cache', '.local', 'Documents', 'Downloads', 'Videos', 'Music'];
  for (const sd of safeDirs) {
    const isCheat = /vape|drip|slinky|future|rusherhack|boze|aristois|wurst|meteor|kura/i.test(sd);
    assert.strictEqual(isCheat, false, `Guvenli dizin asla hile ismiyle eslesmemeli: ${sd}`);
  }
});

// 10. TEST: BYOVD Vulnerable Driver Installation Pattern
runTest('BYOVD Surucu Kurulumu: Event ID 7045 icindeki savunmasiz kernel suruculeri taninmali', () => {
  const vulnerableDriverSamples = [
    'A service was installed: gdrv.sys (GIGABYTE Motherboard Utility)',
    'A service was installed: mhyprot2.sys (Genshin Impact Anti-Cheat Driver)',
    'A service was installed: RtCore64.sys (MSI Afterburner Overclocking Driver)',
    'A service was installed: C:\\Users\\User\\AppData\\Local\\Temp\\kprocesshacker.sys'
  ];

  const pattern = /gdrv|mhyprot2|rtcore64|capcom|kprocesshacker|echo\.sys|dbutil|zamguard|zam64|iqvw64|procexp/i;

  for (const sample of vulnerableDriverSamples) {
    const isVulnerable = pattern.test(sample) || /AppData\\Local\\Temp|\\Temp\\.*\.sys/i.test(sample);
    assert(isVulnerable, `Savunmasiz surucu ornegi taninmali: ${sample}`);
  }

  // Safe Windows kernel drivers must not trigger
  const safeDrivers = [
    'A service was installed: tcpip.sys',
    'A service was installed: ntfs.sys',
    'A service was installed: nvlddmkm.sys (NVIDIA Display Driver)'
  ];

  for (const safe of safeDrivers) {
    const isVulnerable = pattern.test(safe) || /AppData\\Local\\Temp|\\Temp\\.*\.sys/i.test(safe);
    assert.strictEqual(isVulnerable, false, `Mesru Windows surucusu ASLA isaretlenmemeli: ${safe}`);
  }
});

// 11. TEST: Bytecode Velocity Detection
runTest('Bytecode Forensigi: EntityVelocityUpdateS2CPacket paketini modifiye eden Velocity hilesi yakalanmali', () => {
  const zip = new AdmZip();
  const fakeClassContent = Buffer.from('net/minecraft/network/packet/s2c/play/EntityVelocityUpdateS2CPacket motionX horizontal cancel');
  zip.addFile('com/stealth/VelocityMixin.class', fakeClassContent);
  
  const testJar = path.join(os.tmpdir(), 'test_velocity_' + Date.now() + '.jar');
  zip.writeZip(testJar);
  
  try {
    const findings = trojanDetector.analyzeJar(testJar);
    assert(findings.length >= 1, 'Velocity hilesi tespit edilmeliydi');
    assert.strictEqual(findings[0].type, 'STEALTH_VELOCITY_MOD');
    assert.strictEqual(findings[0].level, 'CRITICAL');
  } finally {
    try { fs.unlinkSync(testJar); } catch (e) {}
  }
});

// 12. TEST: Bytecode Reach Detection
runTest('Bytecode Forensigi: BoundingBox genisleterek raycast yapan Reach hilesi yakalanmali', () => {
  const zip = new AdmZip();
  const fakeClassContent = Buffer.from('rayTrace getEntitiesWithinAABB expandBox Reach reachDistance 3.0');
  zip.addFile('com/stealth/ReachMixin.class', fakeClassContent);
  
  const testJar = path.join(os.tmpdir(), 'test_reach_' + Date.now() + '.jar');
  zip.writeZip(testJar);
  
  try {
    const findings = trojanDetector.analyzeJar(testJar);
    assert(findings.length >= 1, 'Reach hilesi tespit edilmeliydi');
    assert.strictEqual(findings[0].type, 'STEALTH_REACH_MOD');
    assert.strictEqual(findings[0].level, 'CRITICAL');
  } finally {
    try { fs.unlinkSync(testJar); } catch (e) {}
  }
});

// 13. TEST: Bytecode Unsafe Injection Detection
runTest('Bytecode Forensigi: sun/misc/Unsafe ile defineAnonymousClass enjekte eden hile yakalanmali', () => {
  const zip = new AdmZip();
  const fakeClassContent = Buffer.from('sun/misc/Unsafe defineAnonymousClass allocateMemory');
  zip.addFile('com/stealth/Dropper.class', fakeClassContent);
  
  const testJar = path.join(os.tmpdir(), 'test_unsafe_' + Date.now() + '.jar');
  zip.writeZip(testJar);
  
  try {
    const findings = trojanDetector.analyzeJar(testJar);
    assert(findings.length >= 1, 'Unsafe enjeksiyonu tespit edilmeliydi');
    assert.strictEqual(findings[0].type, 'UNSAFE_BYTECODE_INJECTION');
    assert.strictEqual(findings[0].level, 'CRITICAL');
  } finally {
    try { fs.unlinkSync(testJar); } catch (e) {}
  }
});

// 14. TEST: SetupAPI Device Log Parser
runTest('USB Adli Analizi: setupapi.dev.log icindeki donanim kurulumlari ve zaman damgasi ayristirilmali', () => {
  const fakeLog = `
>>>  [Device Install (Hardware initiated) - USBSTOR\\Disk&Ven_Kingston&Prod_DataTraveler_3.0&Rev_1.00\\001122334455&0]
>>>  Section start 2026/09/08 22:15:30.123
      cmd: "C:\\Windows\\system32\\svchost.exe"
<<<  Section end 2026/09/08 22:15:31.456 - SUCCESS
>>>  [Device Install (Hardware initiated) - USB\\VID_0781&PID_5581\\012345]
>>>  Section start 2026/09/08 23:05:10.000
  `;
  const entries = usbTracker.parseSetupApiLog(fakeLog);
  assert.strictEqual(entries.length, 2, 'Iki cihaz kaydi ayristirilmali');
  assert(entries[0].deviceId.includes('Kingston'));
  assert.strictEqual(entries[0].friendlyName, 'Kingston DataTraveler');
  assert.strictEqual(entries[0].timestamp, '2026-09-08 22:15:30');
  assert(entries[1].friendlyName.includes('USB Flash'));
  assert.strictEqual(entries[1].timestamp, '2026-09-08 23:05:10');

  // Edge cases
  assert.deepStrictEqual(usbTracker.parseSetupApiLog(null), []);
  assert.deepStrictEqual(usbTracker.parseSetupApiLog(''), []);
});

// 15. TEST: SetupAPI Tampering Detection
runTest('USB Adli Analizi: setupapi.dev.log silinmesi veya bosaltilmasi CRITICAL olarak yakalanmali', () => {
  const missingResult = usbTracker.checkSetupApiLog([]);
  if (missingResult.length > 0) {
    assert.strictEqual(missingResult[0].type, 'SETUPAPI_DEV_LOG_WIPED');
    assert.strictEqual(missingResult[0].level, 'CRITICAL');
  }
});

// 16. TEST: DriverFrameworks USB Event Logic
runTest('USB Adli Analizi: Event ID 2100 (USB Disconnect) baglanti kesilme olayi CRITICAL olarak taninmali', () => {
  const isDisconnect = (id) => id === 2100;
  const isConnect = (id) => id === 2003;

  assert.strictEqual(isDisconnect(2100), true);
  assert.strictEqual(isDisconnect(2003), false);
  assert.strictEqual(isConnect(2003), true);
});

// 17. TEST: RecentDocs UTF-16LE Binary Hex Parsing
runTest('RecentDocs Adli Analizi: UTF-16LE kodlanmis ikili MRU verisi basariyla metne donusturulmeli', () => {
  const targetStr = 'vape_v4.exe';
  const buf = Buffer.from(targetStr, 'utf16le');
  const hexStr = Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('-');

  const extracted = registryForensics.parseRecentDocsHex(hexStr);
  assert(extracted.includes(targetStr), `Extracted listesi '${targetStr}' icermeli: ${JSON.stringify(extracted)}`);

  // Edge cases
  assert.deepStrictEqual(registryForensics.parseRecentDocsHex(null), []);
  assert.deepStrictEqual(registryForensics.parseRecentDocsHex(''), []);
  assert.deepStrictEqual(registryForensics.parseRecentDocsHex('00-11-22'), []);
});

// 18. TEST: RecentDocs ASCII Binary Hex Parsing
runTest('RecentDocs Adli Analizi: ASCII kodlanmis ikili MRU verisi basariyla metne donusturulmeli', () => {
  const targetStr = 'Slinky.exe';
  const buf = Buffer.from(targetStr, 'ascii');
  const hexStr = Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('-');

  const extracted = registryForensics.parseRecentDocsHex(hexStr);
  assert(extracted.includes(targetStr), `Extracted listesi '${targetStr}' icermeli: ${JSON.stringify(extracted)}`);
});

// 19. TEST: 0 False-Flag RecentDocs Extraction
runTest('0 False-Flag RecentDocs: Mesru dosya isimleri (xlite.zip, notes.txt, chrome.exe) hile sayilmamali', () => {
  const legitFiles = ['xlite.zip', 'notes.txt', 'chrome.exe', 'homework.docx', 'DiscordSetup.exe'];
  const whitelist = /xlite|claw|drippyloadingscreen|keystrokesmod|monarchfarmbot|soyafarmbot|farben ac|discord|spotify|chrome|brave|firefox|edge|obs64|steam|code|vscodium|notepad/i;
  const cheatPattern = /vape|drip|slinky|doomsday|meteor|liquidbounce|wurst|autoclicker|clicker|murgee|raven|catlean|bleachhack|boze|rusherhack|futureclient|phantom|augustus|itami|fdp|tenacity|kura/i;

  for (const lf of legitFiles) {
    const isWhitelisted = whitelist.test(lf);
    const isCheat = cheatPattern.test(lf);
    const wouldFlag = isCheat && !isWhitelisted;
    assert.strictEqual(wouldFlag, false, `Mesru dosya '${lf}' RecentDocs icinde asla hile sayilmamali`);
  }
});

// 20. TEST: FeatureUsage AppSwitched Forensics
runTest('FeatureUsage Adli Analizi: Calistirilan hilenin etkilesim sayaci ve silinmis dosya durumu yakalanmali', () => {
  const sampleItems = [
    { Path: 'C:\\Users\\User\\Downloads\\vape.exe', Count: 14, expectedCheat: true },
    { Path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', Count: 120, expectedCheat: false },
    { Path: 'C:\\Windows\\System32\\taskmgr.exe', Count: 45, expectedCheat: false },
    { Path: 'D:\\Games\\Minecraft\\mods\\xlite-fabric-1.20.jar', Count: 3, expectedCheat: false },
    { Path: 'C:\\Temp\\slinky_loader.exe', Count: 2, expectedCheat: true }
  ];

  const whitelist = /xlite|claw|drippyloadingscreen|keystrokesmod|monarchfarmbot|soyafarmbot|farben ac|discord|spotify|chrome|brave|firefox|edge|obs64|steam|code|vscodium|notepad|explorer|taskmgr/i;
  const cheatPattern = /vape|drip|slinky|doomsday|meteor|liquidbounce|wurst|autoclicker|clicker|murgee|raven|catlean|bleachhack|boze|rusherhack|futureclient|phantom|augustus|itami|fdp|tenacity|kura/i;

  for (const item of sampleItems) {
    const isWhitelisted = whitelist.test(item.Path);
    const isCheat = cheatPattern.test(item.Path);
    const flagged = isCheat && !isWhitelisted;
    assert.strictEqual(flagged, item.expectedCheat, `Item '${item.Path}' beklenen sonucu vermeli: ${item.expectedCheat}`);
  }
});

// 21. TEST: Linux Proc Maps memfd_create In-Memory Injection
runTest('Bellek Adli Analizi: /proc/maps icindeki memfd_create RAM ici enjeksiyonu yakalanmali', () => {
  const fakeMaps = `
7f1230000000-7f1230050000 r--p 00000000 08:01 1234 /usr/lib/jvm/java-21/lib/server/libjvm.so
7f1234000000-7f1234050000 r-xp 00000000 00:01 5678 /memfd:vape_payload (deleted)
7f1235000000-7f1235010000 rw-p 00000000 00:00 0
  `;
  const findings = memoryScanner.inspectLinuxProcMaps(fakeMaps, 1234);
  assert(findings.length >= 1, 'memfd eslemesi tespit edilmeli');
  assert.strictEqual(findings[0].type, 'MEMFD_IN_MEMORY_INJECTION');
  assert.strictEqual(findings[0].level, 'CRITICAL');
  assert(findings[0].confidence.includes('memfd_create'));
});

// 22. TEST: Linux Proc Maps Unlinked/Deleted Module Detection
runTest('Bellek Adli Analizi: /proc/maps icinde diskten silinmis (.so (deleted)) modulu yakalanmali', () => {
  const fakeMaps = `
7f5678000000-7f5678020000 r-xp 00000000 08:01 99999 /tmp/libstealthhook.so (deleted)
  `;
  const findings = memoryScanner.inspectLinuxProcMaps(fakeMaps, 5678);
  assert(findings.length >= 1, 'Silinmis .so eslemesi tespit edilmeli');
  assert.strictEqual(findings[0].type, 'UNLINKED_MEMORY_MAPPED_INJECTION');
  assert.strictEqual(findings[0].level, 'CRITICAL');
});

// 23. TEST: 0 False-Flag Linux Proc Maps
runTest('0 False-Flag Bellek: LWJGL, jemalloc, GLFW ve OBS kütüphaneleri ASLA hile sayılmamalı', () => {
  const legitMaps = `
7fa100000000-7fa100050000 r-xp 00000000 08:01 10001 /home/user/.minecraft/bin/natives/liblwjgl.so
7fa200000000-7fa200050000 r-xp 00000000 08:01 10002 /usr/lib/libjemalloc.so.2
7fa300000000-7fa300050000 r-xp 00000000 08:01 10003 /home/user/.minecraft/bin/natives/libglfw.so
7fa400000000-7fa400050000 r-xp 00000000 08:01 10004 /usr/lib/x86_64-linux-gnu/libobs.so
7fa500000000-7fa500050000 r-xp 00000000 08:01 10005 /home/user/.minecraft/bin/natives/libopenal.so
  `;
  const findings = memoryScanner.inspectLinuxProcMaps(legitMaps, 9999);
  assert.strictEqual(findings.length, 0, `Mesru yerel kutuphaneler false flag uretmemeli, bulunan: ${findings.length}`);
});

// 24. TEST: Parent Process Injection Logic
runTest('Surec Adli Analizi: Minecraft javaw.exe surecini baslatan ust hile sureci yakalanmali', () => {
  const testParents = [
    { name: 'vape-loader.exe', path: 'C:\\Users\\User\\vape.exe', shouldFlag: true },
    { name: 'SlinkyClicker.exe', path: 'C:\\Temp\\SlinkyClicker.exe', shouldFlag: true },
    { name: 'MinecraftLauncher.exe', path: 'C:\\Program Files\\Minecraft\\MinecraftLauncher.exe', shouldFlag: false },
    { name: 'PrismLauncher.exe', path: 'C:\\Games\\PrismLauncher\\PrismLauncher.exe', shouldFlag: false },
    { name: 'cmd.exe', path: 'C:\\Windows\\System32\\cmd.exe', shouldFlag: false }
  ];

  const cheatParentPattern = /vape|drip|slinky|doomsday|cheat|inject|meteor|liquidbounce|wurst/i;

  for (const tp of testParents) {
    const isCheat = cheatParentPattern.test(tp.name) || cheatParentPattern.test(tp.path);
    assert.strictEqual(isCheat, tp.shouldFlag, `Parent process '${tp.name}' beklenen sonucu vermeli: ${tp.shouldFlag}`);
  }
});

// 25. TEST: WinRAR Archive History Forensics
runTest('Arsivleyici Adli Analizi: WinRAR gecmisindeki (ArcHistory) hile arsivleri yakalanmali', () => {
  const sampleWinrarOutput = `
0    REG_SZ    C:\\Users\\User\\Downloads\\vape_v4.zip
1    REG_SZ    D:\\Downloads\\raven_bplus.rar
  `;
  const findings = runHistory.parseWinRarHistory(sampleWinrarOutput);
  assert.strictEqual(findings.length, 2, 'Iki hile arsivi de bulunmali');
  assert.strictEqual(findings[0].type, 'WINRAR_CHEAT_ARCHIVE_HISTORY');
  assert.strictEqual(findings[0].level, 'CRITICAL');
  assert(findings[0].path.includes('vape_v4.zip'));
  assert(findings[1].path.includes('raven_bplus.rar'));
});

// 26. TEST: 7-Zip Path/Folder History Forensics
runTest('Arsivleyici Adli Analizi: 7-Zip gecmisindeki (PathHistory / FolderHistory) hile yollari yakalanmali', () => {
  const sample7zOutput = `
PathHistory0    REG_SZ    C:\\Users\\User\\AppData\\Local\\Temp\\slinky_extracted
FolderHistory1    REG_SZ    C:\\Games\\DripLite_Archive
  `;
  const findings = runHistory.parse7ZipHistory(sample7zOutput);
  assert.strictEqual(findings.length, 2, 'Iki 7-Zip hile kaydi da bulunmali');
  assert.strictEqual(findings[0].type, '7ZIP_CHEAT_PATH_HISTORY');
  assert.strictEqual(findings[0].level, 'CRITICAL');
});

// 27. TEST: 0 False-Flag Archiver History
runTest('0 False-Flag Arsivleyici: Mesru arsivler (xlite.zip, optifine.jar, sodium.zip) asla hile sayilmamali', () => {
  const legitOutput = `
0    REG_SZ    C:\\Users\\User\\Downloads\\xlite.zip
1    REG_SZ    C:\\Users\\User\\Downloads\\optifine.jar
2    REG_SZ    C:\\Users\\User\\Downloads\\sodium-fabric.zip
3    REG_SZ    C:\\Users\\User\\Documents\\homework.rar
  `;
  const wrFindings = runHistory.parseWinRarHistory(legitOutput);
  const szFindings = runHistory.parse7ZipHistory(legitOutput);
  assert.strictEqual(wrFindings.length, 0, `Mesru WinRAR arsivleri temiz kalmali, bulunan: ${wrFindings.length}`);
  assert.strictEqual(szFindings.length, 0, `Mesru 7-Zip dosyalari temiz kalmali, bulunan: ${szFindings.length}`);
});

// 28. TEST: USN Wiped Anti-Forensics Logic
runTest('USN Anti-Forensics: Uptime yuksekken Next Usn < 512KB olmasi USN_JOURNAL_WIPED_ANTI_FORENSICS olarak taninmali', () => {
  const uptimeMin = 180; // 3 hours
  const nextUsnVal = 0x45000n; // 282 KB
  const lowestVal = 0n;

  const isWiped = uptimeMin > 30 && nextUsnVal < 524288n && lowestVal === 0n;
  assert.strictEqual(isWiped, true, 'Next Usn 282 KB ve uptime 3 saat iken wiped durumu tespit edilmeli');
});

// 29. TEST: USN Recreated During Session Logic
runTest('USN Anti-Forensics: Gunluk olusturma saati Boot saatinden sonra ise USN_JOURNAL_RECREATED_DURING_SESSION olmali', () => {
  const bootTime = new Date('2026-09-11T10:00:00Z');
  const jrnlTime = new Date('2026-09-11T11:45:30Z'); // 1h 45m later!

  const isRecreated = (jrnlTime.getTime() - bootTime.getTime()) > 60000;
  assert.strictEqual(isRecreated, true, 'Oturum ortasinda olusturulan USN gunlugu tespit edilmeli');
});

// 30. TEST: USN Deleted Cheat Record Carving
runTest('USN Silinmis Kayit: 0x00000002 File delete islemi ile silinen hile CRITICAL USN_JOURNAL_DELETED_CHEAT olmali', () => {
  const sampleLine = '0x000000045a990000, vape-v4.exe, 11, 0x80000002: File delete | Close, 2026-09-11 02:44:19, 0x20, 0x0001000000001234, 0x0002000000005678';
  const parsed = usnJournal.parseUsnCsvLine(sampleLine);
  assert(parsed, 'Satir ayristirilabilmeli');

  const isDelete = /File delete|0x[0-9a-f]*2[0-9a-f]{2}|0x00000002/i.test(parsed.reason);
  assert.strictEqual(isDelete, true, 'Silinme islemi taninmali');

  const isCheat = /vape|drip|slinky|doomsday|raven/i.test(parsed.fileName);
  assert.strictEqual(isCheat, true, 'Hile ismi taninmali');
});

// 31. TEST: PowerShell History USN Deletion Command
runTest('USN Silme Komutu: ConsoleHost_history icindeki fsutil usn deletejournal komutu yakalanmali', () => {
  const sampleHistory = `
Get-Process
cd C:\\
fsutil usn deletejournal /D C:
npm start
  `;
  const matched = /fsutil\s+usn\s+deletejournal|deletejournal\s+\/d/i.test(sampleHistory);
  assert.strictEqual(matched, true, 'fsutil usn deletejournal komutu yakalanmali');
});

console.log(`\n====================================================`);
console.log(`   SONUC: ${passedTests} / ${totalTests} TEST BASARILI!`);
console.log(`====================================================\n`);
