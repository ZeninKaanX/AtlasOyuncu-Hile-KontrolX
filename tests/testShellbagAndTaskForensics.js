/**
 * Atlas AC - Shellbags, Scheduled Tasks & ScriptBlock Forensics Unit Test Suite
 * Validates:
 * 1. PowerShell ScriptBlock Logging (Event ID 4104): Anti-forensic commands & cheat downloads
 * 2. 0 False-Flag: Legitimate PowerShell commands in Event ID 4104
 * 3. Shellbag BagMRU Hex Parsing: UTF-16LE and ASCII folder name extraction
 * 4. Shellbag Hile Klasor Tespiti: Deleted vs existing cheat folder records
 * 5. 0 False-Flag Shellbag: Legitimate Windows, .minecraft, node_modules folders
 * 6. Scheduled Tasks: Direct cheat task detection (VapeTask running vape.exe)
 * 7. Scheduled Tasks: Suspicious Temp executable task detection
 * 8. 0 False-Flag Scheduled Tasks: Google, Microsoft Edge, Discord tasks
 * 9. BITS Job Forensics: BITS transfer job downloading from cheat domain
 * 10. 0 False-Flag BITS: Normal background file downloads
 */

const assert = require('assert');
const cleanerDetector = require('../src/engine/cleanerDetector');
const shellbagForensics = require('../src/engine/shellbagForensics');
const scheduledTaskForensics = require('../src/engine/scheduledTaskForensics');

console.log('====================================================');
console.log('   ATLAS AC - SHELLBAG, TASKS & SCRIPTBLOCK SUITE   ');
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

// 1. TEST: PowerShell ScriptBlock Logging Event ID 4104
runTest('ScriptBlock (Event ID 4104): fsutil usn deletejournal veya Stop-Service DPS yakalanmalı', () => {
  const badScript = 'fsutil usn deletejournal /d C:';
  const badScript2 = 'Stop-Service -Name DPS -Force; wevtutil cl Security';

  const findings1 = cleanerDetector.evaluateScriptBlock(badScript, '2026-09-09 08:00:00');
  const findings2 = cleanerDetector.evaluateScriptBlock(badScript2, '2026-09-09 08:00:01');

  assert.strictEqual(findings1.length, 1);
  assert.strictEqual(findings1[0].type, 'POWERSHELL_SCRIPTBLOCK_CHEAT_EXECUTION');
  assert.strictEqual(findings1[0].level, 'CRITICAL');

  assert.strictEqual(findings2.length, 1);
  assert.strictEqual(findings2[0].type, 'POWERSHELL_SCRIPTBLOCK_CHEAT_EXECUTION');
});

// 2. TEST: 0 False-Flag on Normal PowerShell ScriptBlock
runTest('0 False-Flag: Standart PowerShell komutları (Get-Process, npm start, git status) temiz kalmalı', () => {
  const cleanScript = 'Get-Process | Where-Object { $_.CPU -gt 10 } | Select-Object ProcessName, CPU';
  const cleanScript2 = 'npm run build; node --version';

  assert.strictEqual(cleanerDetector.evaluateScriptBlock(cleanScript).length, 0);
  assert.strictEqual(cleanerDetector.evaluateScriptBlock(cleanScript2).length, 0);
});

// 3. TEST: Shellbag BagMRU Hex Parsing (UTF-16LE & ASCII)
runTest('Shellbag Ayrıştırma: BagMRU REG_BINARY içindeki Klasör İsmi Başarıyla Çıkarılmalı', () => {
  // UTF-16LE encoded "vape_v4"
  const utf16Buf = Buffer.from('vape_v4', 'utf16le');
  const hexStr = utf16Buf.toString('hex').match(/.{1,2}/g).join('-');

  const extracted = shellbagForensics.parseBagMruHex(hexStr);
  assert.ok(extracted.includes('vape_v4'), 'vape_v4 klasör ismi hex veriden çıkarılmalıdır');
});

// 4. TEST: Shellbag Cheat Folder Evaluation
runTest('Shellbag Hile Klasörü: Silinmiş vape_v4 veya doomsday_client klasörü somut kanıtla yakalanmalı', () => {
  const fakeFolders = [
    'C:\\Users\\User\\Downloads\\vape_v4',
    'D:\\Cheats\\doomsday_client',
    'C:\\Users\\User\\AppData\\Local\\Temp\\slinky'
  ];

  const findings = shellbagForensics.evaluateFolderStrings(fakeFolders, 'BagMRU\\1');
  assert.strictEqual(findings.length, 3);
  for (const f of findings) {
    assert.ok(f.type.includes('SHELLBAG_'));
    assert.strictEqual(f.level, 'CRITICAL');
  }
});

// 5. TEST: 0 False-Flag Shellbags: Legitimate Windows & Gaming Folders
runTest('0 False-Flag Shellbag: Downloads, Desktop, .minecraft, node_modules klasörleri temiz kalmalı', () => {
  const cleanFolders = [
    'downloads',
    'desktop',
    'documents',
    'C:\\Users\\User\\AppData\\Roaming\\.minecraft\\resourcepacks',
    'C:\\Users\\User\\AppData\\Roaming\\.minecraft\\saves',
    'D:\\Projects\\node_modules',
    'C:\\Program Files\\Steam'
  ];

  const findings = shellbagForensics.evaluateFolderStrings(cleanFolders, 'BagMRU\\0');
  assert.strictEqual(findings.length, 0, 'Meşru klasörler Shellbag kontrolünde asla alarm vermemelidir');
});

// 6. TEST: Scheduled Tasks: Direct Cheat Task
runTest('Zamanlanmış Görevler: VapeUpdater veya SlinkyInject görevi CRITICAL olarak yakalanmalı', () => {
  const finding = scheduledTaskForensics.evaluateTask('VapeUpdaterTask', 'C:\\Users\\User\\AppData\\Local\\Temp\\vape.exe --silent', 'User');
  assert.ok(finding);
  assert.strictEqual(finding.type, 'SCHEDULED_CHEAT_TASK_PERSISTENCE');
  assert.strictEqual(finding.level, 'CRITICAL');
});

// 7. TEST: Scheduled Tasks: Suspicious Temp Executable Task
runTest('Zamanlanmış Görevler: Temp dizinindeki şüpheli çalıştırılabilir dosya yakalanmalı', () => {
  const finding = scheduledTaskForensics.evaluateTask('SysHelperService', 'C:\\Users\\User\\AppData\\Local\\Temp\\helper32.exe', 'System');
  assert.ok(finding);
  assert.strictEqual(finding.type, 'SUSPICIOUS_SCHEDULED_TASK_PAYLOAD');
  assert.strictEqual(finding.level, 'CRITICAL');
});

// 8. TEST: 0 False-Flag Scheduled Tasks: Google, Edge, Discord
runTest('0 False-Flag Görevler: GoogleUpdateTask, MicrosoftEdgeUpdate ve Discord temiz kalmalı', () => {
  assert.strictEqual(scheduledTaskForensics.evaluateTask('GoogleUpdateTaskMachineCore', 'C:\\Program Files (x86)\\Google\\Update\\GoogleUpdate.exe /c'), null);
  assert.strictEqual(scheduledTaskForensics.evaluateTask('MicrosoftEdgeUpdateTaskMachineUA', 'C:\\Program Files (x86)\\Microsoft\\EdgeUpdate\\MicrosoftEdgeUpdate.exe /ua'), null);
  assert.strictEqual(scheduledTaskForensics.evaluateTask('DiscordUpdate', 'C:\\Users\\User\\AppData\\Local\\Discord\\Update.exe --processStart Discord.exe'), null);
});

// 9. TEST: BITS Job Forensics: Download from Cheat Domain
runTest('BITS Forensiği: vape.gg veya drip.gg üzerinden indirme yapan BITS işi yakalanmalı', () => {
  const finding = scheduledTaskForensics.evaluateBitsJob('CheatDownloadJob', 'https://vape.gg/download/v4/vape.exe', 'C:\\Temp\\vape.exe');
  assert.ok(finding);
  assert.strictEqual(finding.type, 'BITS_CHEAT_PAYLOAD_TRANSFER');
  assert.strictEqual(finding.level, 'CRITICAL');
});

// 10. TEST: 0 False-Flag BITS: Normal Background Downloads
runTest('0 False-Flag BITS: Windows Update veya normal CDN indirmeleri temiz kalmalı', () => {
  const cleanFinding = scheduledTaskForensics.evaluateBitsJob('WUClientDownload', 'http://download.windowsupdate.com/d/msdownload/update.cab', 'C:\\Windows\\SoftwareDistribution\\Download\\update.cab');
  assert.strictEqual(cleanFinding, null);
});

console.log('\n====================================================');
console.log(`   SONUC: ${passedTests} / ${totalTests} TEST BASARILI!`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
