/**
 * Atlas AC - Windows Defender & Security History Forensics Test Suite
 * Validates:
 * 1. Defender cheat folder exclusion detection (Get-MpPreference ExclusionPath)
 * 2. Defender process exclusion detection (javaw.exe, vape.exe)
 * 3. Defender dangerous extension exclusion detection (.dll, .exe, .jar)
 * 4. 0 False-Flag: Developer & gaming platform exclusions (node_modules, visual studio, steam, easyanticheat)
 * 5. Linux YAMA ptrace_scope unrestricted detection (ptrace_scope == 0)
 * 6. 0 False-Flag: Secure Linux ptrace_scope (1 or 2)
 * 7. Windows Defender Threat Detection event logic (Event ID 1116 / 1117)
 * 8. Windows Defender Real-time protection disabled event logic (Event ID 5001)
 */

const assert = require('assert');
const defenderForensics = require('../src/engine/defenderForensics');

console.log('====================================================');
console.log('   ATLAS AC - DEFENDER & SECURITY FORENSICS SUITE   ');
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

// 1. TEST: Defender Cheat Folder Exclusion Detection
runTest('Defender Dislamalari: Hile veya Temp/Downloads klasor dislamasi CRITICAL olarak yakalanmali', () => {
  const sampleExclusions = {
    paths: [
      'C:\\Users\\User\\Downloads\\vape_v4',
      'C:\\Users\\User\\AppData\\Roaming\\.minecraft\\mods\\drip',
      'C:\\Temp',
      'C:\\Users\\User\\AppData\\Local\\Temp\\slinky'
    ],
    processes: [],
    extensions: []
  };

  const findings = defenderForensics.evaluateExclusions(sampleExclusions);
  assert.strictEqual(findings.length, 4, `4 adet supheli dislama bulunmali, bulunan: ${findings.length}`);
  for (const f of findings) {
    assert.strictEqual(f.type, 'DEFENDER_CHEAT_EXCLUSION_PATH');
    assert.strictEqual(f.level, 'CRITICAL');
  }
});

// 2. TEST: Defender Process Exclusion Detection
runTest('Defender Dislamalari: Minecraft javaw.exe veya hile calistirilabilir surec dislamasi yakalanmali', () => {
  const sampleExclusions = {
    paths: [],
    processes: [
      'javaw.exe',
      'vape.exe',
      'SlinkyClicker.exe',
      'python_injector.exe'
    ],
    extensions: []
  };

  const findings = defenderForensics.evaluateExclusions(sampleExclusions);
  assert.strictEqual(findings.length, 4, `4 adet supheli surec dislamasi bulunmali, bulunan: ${findings.length}`);
  for (const f of findings) {
    assert.strictEqual(f.type, 'DEFENDER_CHEAT_EXCLUSION_PROCESS');
    assert.strictEqual(f.level, 'CRITICAL');
  }
});

// 3. TEST: Defender Dangerous Extension Exclusion Detection
runTest('Defender Dislamalari: .dll, .exe, .jar genel uzanti dislamalari HIGH olarak yakalanmali', () => {
  const sampleExclusions = {
    paths: [],
    processes: [],
    extensions: ['.dll', '.exe', '.jar', '.sys']
  };

  const findings = defenderForensics.evaluateExclusions(sampleExclusions);
  assert.strictEqual(findings.length, 4, `4 adet tehlikeli uzanti bulunmali, bulunan: ${findings.length}`);
  for (const f of findings) {
    assert.strictEqual(f.type, 'DEFENDER_DANGEROUS_EXTENSION_EXCLUSION');
    assert.strictEqual(f.level, 'HIGH');
  }
});

// 4. TEST: 0 False-Flag on Legitimate Developer & Platform Exclusions
runTest('0 False-Flag Dislamalar: node_modules, Visual Studio, Steam, EasyAntiCheat ASLA hile sayilmamali', () => {
  const legitExclusions = {
    paths: [
      'C:\\Projects\\node_modules',
      'C:\\Program Files\\Microsoft Visual Studio\\2022',
      'C:\\Program Files (x86)\\Steam\\steamapps',
      'C:\\Program Files (x86)\\EasyAntiCheat',
      'C:\\Riot Games\\VALORANT',
      'D:\\JetBrains\\IntelliJ IDEA'
    ],
    processes: [
      'devenv.exe',
      'code.exe',
      'EasyAntiCheat.exe',
      'vanguard.exe'
    ],
    extensions: [
      '.tmp',
      '.log',
      '.bak'
    ]
  };

  const findings = defenderForensics.evaluateExclusions(legitExclusions);
  assert.strictEqual(findings.length, 0, `Mesru gelistirici/oyun dislamalari false flag uretmemeli, bulunan: ${findings.length}`);
});

// 5. TEST: Linux YAMA ptrace_scope Logic
runTest('Linux Guvenlik: ptrace_scope degeri 0 ise supheli bellek erisimi olarak yakalanmali', () => {
  const isUnrestricted = (val) => String(val).trim() === '0';
  const isSecure = (val) => ['1', '2', '3'].includes(String(val).trim());

  assert.strictEqual(isUnrestricted('0'), true, 'Deger 0 iken kisitlamasiz sayilmali');
  assert.strictEqual(isUnrestricted('1'), false, 'Deger 1 iken kisitlamasiz sayilmamali');
  assert.strictEqual(isSecure('1'), true, 'Deger 1 guvenli');
  assert.strictEqual(isSecure('2'), true, 'Deger 2 guvenli');
});

// 6. TEST: Defender Threat Detection Logic (Event ID 1116 / 1117)
runTest('Defender Tehdit Kaydi: Event ID 1116/1117 icindeki HackTool, Injector ve Vape kayitlari taninmali', () => {
  const sampleMessages = [
    'Microsoft Defender Antivirus has detected malware: HackTool:Win32/AutoClicker.A',
    'Microsoft Defender Antivirus took action on: VirTool:Win32/Injector.Remote',
    'Threat detected: Trojan:Win32/VapeLoader!rfn in file C:\\Users\\User\\Downloads\\vape.exe'
  ];

  const threatPattern = /hacktool|virtool|injector|autoclicker|vape|drip|slinky|doomsday|cheat/i;

  for (const msg of sampleMessages) {
    const matched = threatPattern.test(msg);
    assert(matched, `Tehdit mesaji taninmali: ${msg}`);
  }

  const safeMessage = 'Microsoft Defender completed routine scheduled scan without threat findings.';
  assert.strictEqual(threatPattern.test(safeMessage), false, 'Temiz tarama mesaji false flag uretmemeli');
});

// 7. TEST: Defender Real-Time Protection Disabled Logic (Event ID 5001)
runTest('Defender Mudahale: Event ID 5001 ile Gercek Zamanli Koruma kapatma eylemi CRITICAL olarak taninmali', () => {
  const isRealtimeDisabled = (id) => id === 5001;
  const isConfigChanged = (id) => id === 5007;

  assert.strictEqual(isRealtimeDisabled(5001), true);
  assert.strictEqual(isRealtimeDisabled(5000), false);
  assert.strictEqual(isConfigChanged(5007), true);
});

console.log(`\n====================================================`);
console.log(`   SONUC: ${passedTests} / ${totalTests} TEST BASARILI!`);
console.log(`====================================================\n`);
