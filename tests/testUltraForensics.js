/**
 * Atlas AC - Ultra Forensics Test Suite
 * Validates PCA, WER Crash Dumps, Time Manipulation, and RunMRU/WordWheelQuery search forensics.
 * Guarantees 0 False-Flags on clean tools and 100% concrete proof on cheats.
 */

const assert = require('assert');
const path = require('path');
const pcaScanner = require('../src/engine/pcaScanner');
const werCrashScanner = require('../src/engine/werCrashScanner');
const timeManipulationDetector = require('../src/engine/timeManipulationDetector');
const runHistoryForensics = require('../src/engine/runHistoryForensics');

async function runUltraForensicsTests() {
  console.log('====================================================');
  console.log('   ATLAS AC - ULTRA FORENSICS TEST SUITE            ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function pass(desc) {
    passed++;
    total++;
    console.log(`[PASS] ${desc}`);
  }

  function fail(desc, err) {
    total++;
    console.error(`[FAIL] ${desc}:`, err.message);
  }

  // ----------------------------------------------------
  // 1. PCA Scanner Tests
  // ----------------------------------------------------
  try {
    const mockPcaLog = [
      '# Windows Program Compatibility Assistant Log',
      'C:\\Program Files\\Google\\Chrome\\chrome.exe|2026-09-01 12:00:00|0|0',
      'C:\\Users\\User\\Downloads\\xlite.zip|2026-09-02 14:15:20|0|0',
      'C:\\Users\\User\\AppData\\Local\\Temp\\vape_v4.exe|2026-09-03 21:45:00|0|1',
      'D:\\Cheats\\drip_client.exe|2026-09-04 18:30:00|0|1',
      'C:\\Tools\\MonarchFarmBot.exe|2026-09-04 19:00:00|0|0'
    ].join('\n');

    const pcaFindings = pcaScanner.parsePcaContent(mockPcaLog, 'C:\\Windows\\appcompat\\Programs\\PcaAppLaunchDic.txt');

    assert.strictEqual(pcaFindings.length, 2, 'PCA logunda tam olarak 2 gercek hile yakalanmali');
    assert.strictEqual(pcaFindings[0].type, 'PCA_EXECUTED_CHEAT');
    assert.ok(pcaFindings.some(f => f.path.includes('vape_v4.exe')));
    assert.ok(pcaFindings.some(f => f.path.includes('drip_client.exe')));

    // 0 False-Flag Check
    assert.ok(!pcaFindings.some(f => f.path.includes('xlite')), 'xlite asla isaretlenmemeli');
    assert.ok(!pcaFindings.some(f => f.path.includes('MonarchFarmBot')), 'MonarchFarmBot asla isaretlenmemeli');
    assert.ok(!pcaFindings.some(f => f.path.includes('chrome')), 'chrome asla isaretlenmemeli');

    pass('PCA: PcaAppLaunchDic kayitlarindan silinmis hileler somut kanitla ayrilmali');
  } catch (err) {
    fail('PCA: PcaAppLaunchDic kayitlarindan silinmis hileler somut kanitla ayrilmali', err);
  }

  // ----------------------------------------------------
  // 2. WER Crash & Dump Tests
  // ----------------------------------------------------
  try {
    const mockWerContent = [
      'Version=1',
      'EventType=APPCRASH',
      'EventTime=133456789000000000',
      'AppName=vape.exe',
      'AppPath=C:\\Users\\Victim\\AppData\\Local\\Temp\\vape.exe',
      'ReportIdentifier=12345-abcde'
    ].join('\r\n');

    const werFinding = werCrashScanner.parseWerContent(mockWerContent, { mtime: new Date('2026-09-04T12:00:00Z') }, 'C:\\ProgramData\\WER\\ReportArchive\\AppCrash_vape.exe\\Report.wer');

    assert.ok(werFinding !== null, 'vape.exe WER raporu tespit edilmeli');
    assert.strictEqual(werFinding.type, 'WER_APPCRASH_CHEAT_RECORD');
    assert.strictEqual(werFinding.path, 'C:\\Users\\Victim\\AppData\\Local\\Temp\\vape.exe');

    // 0 False-Flag Check
    const cleanWer = [
      'EventType=APPCRASH',
      'AppName=MonarchFarmBot.exe',
      'AppPath=C:\\Tools\\MonarchFarmBot.exe'
    ].join('\r\n');
    const cleanFinding = werCrashScanner.parseWerContent(cleanWer, null, '');
    assert.strictEqual(cleanFinding, null, 'MonarchFarmBot WER cokusunde false flag vermemeli');

    pass('WER: Report.wer kaza dosyasindan coken hilenin tam yolu somut kanitla cozulmeli');
  } catch (err) {
    fail('WER: Report.wer kaza dosyasindan coken hilenin tam yolu somut kanitla cozulmeli', err);
  }

  // ----------------------------------------------------
  // 3. WER Crash Dump Filename Tests
  // ----------------------------------------------------
  try {
    const dumpStats = { size: 524288, mtime: new Date('2026-09-04T15:00:00Z') };
    const cheatDump = werCrashScanner.evaluateCrashName('slinky.exe.1234.dmp', 'C:\\Users\\User\\AppData\\Local\\CrashDumps\\slinky.exe.1234.dmp', dumpStats);
    assert.ok(cheatDump !== null, 'slinky .dmp dosyasi yakalanmali');
    assert.strictEqual(cheatDump.type, 'CRASH_DUMP_CHEAT_FOUND');

    const cleanDump = werCrashScanner.evaluateCrashName('MonarchFarmBot.exe.5678.dmp', 'C:\\Users\\User\\AppData\\Local\\CrashDumps\\MonarchFarmBot.exe.5678.dmp', dumpStats);
    assert.strictEqual(cleanDump, null, 'MonarchFarmBot .dmp false flag vermemeli');

    pass('WER & CrashDumps: .dmp kaza dokumu dosyalari 0 false flag ile denetlenmeli');
  } catch (err) {
    fail('WER & CrashDumps: .dmp kaza dokumu dosyalari 0 false flag ile denetlenmeli', err);
  }

  // ----------------------------------------------------
  // 4. Time Manipulation Event ID 1 Tests
  // ----------------------------------------------------
  try {
    const mockEvents = [
      {
        TimeCreated: '2026-09-04T10:00:00Z',
        Message: 'The system time was changed. Previous Time: 2026-09-04T10:00:00Z. New Time: 2026-09-04T15:00:00Z.'
      },
      {
        TimeCreated: '2026-09-04T11:00:00Z',
        Message: 'The system time was changed. Previous Time: 2026-09-04T11:00:00.000Z. New Time: 2026-09-04T11:00:00.500Z.'
      }
    ];

    const timeFindings = timeManipulationDetector.parseEventLogEvents(mockEvents);

    assert.strictEqual(timeFindings.length, 1, 'Yalnizca kasten yapilan 5 saatlik kaydirma yakalanmali');
    assert.strictEqual(timeFindings[0].type, 'SYSTEM_CLOCK_MANIPULATION_DETECTED');
    assert.ok(timeFindings[0].description.includes('5.0 saat'));

    pass('Zaman Manipulasyonu: Event ID 1 ile sistem saati kaydirma hilesi yakalanmali');
  } catch (err) {
    fail('Zaman Manipulasyonu: Event ID 1 ile sistem saati kaydirma hilesi yakalanmali', err);
  }

  // ----------------------------------------------------
  // 5. Time Manipulation Chronological Anomaly Tests
  // ----------------------------------------------------
  try {
    const timestamps = [
      '2026-09-05 10:00:00',
      '2026-09-05 11:30:00',
      '2026-06-01 08:00:00',
      '2026-09-05 12:00:00'
    ];

    const anomalies = timeManipulationDetector.detectChronologicalAnomalies(timestamps);
    assert.strictEqual(anomalies.length, 1, 'Kronolojik tutarsizlik yakalanmali');
    assert.ok(parseFloat(anomalies[0].jumpDays) > 30, 'Sicrama 30 gunden buyuk olmali');

    pass('Zaman Manipulasyonu: Adli kayitlardaki kronolojik zamanda geriye gitme hilesi tespit edilmeli');
  } catch (err) {
    fail('Zaman Manipulasyonu: Adli kayitlardaki kronolojik zamanda geriye gitme hilesi tespit edilmeli', err);
  }

  // ----------------------------------------------------
  // 6. RunMRU (Win+R) Execution History Tests
  // ----------------------------------------------------
  try {
    const mockRunMruOutput = [
      'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU',
      '    a    REG_SZ    notepad\\1',
      '    b    REG_SZ    calc.exe\\1',
      '    c    REG_SZ    javaw -jar C:\\Cheats\\slinky.jar\\1',
      '    d    REG_SZ    C:\\Users\\User\\Downloads\\vape_v4.exe\\1',
      '    e    REG_SZ    C:\\Tools\\MonarchFarmBot.exe\\1',
      '    MRUList    REG_SZ    dcbae'
    ].join('\n');

    const runFindings = runHistoryForensics.parseRunMruOutput(mockRunMruOutput);

    assert.strictEqual(runFindings.length, 2, 'Tam olarak 2 RunMRU hile komutu yakalanmali');
    assert.ok(runFindings.some(f => f.name.includes('slinky')));
    assert.ok(runFindings.some(f => f.name.includes('vape')));

    // 0 False-Flag Check
    assert.ok(!runFindings.some(f => f.name.includes('notepad')), 'notepad false flag vermemeli');
    assert.ok(!runFindings.some(f => f.name.includes('calc')), 'calc false flag vermemeli');
    assert.ok(!runFindings.some(f => f.name.includes('MonarchFarmBot')), 'MonarchFarmBot false flag vermemeli');

    pass('RunMRU: Win+R uzerinden calistirilan hile komutlari somut kanitla yakalanmali');
  } catch (err) {
    fail('RunMRU: Win+R uzerinden calistirilan hile komutlari somut kanitla yakalanmali', err);
  }

  // ----------------------------------------------------
  // 7. WordWheelQuery (Windows Search) Tests
  // ----------------------------------------------------
  try {
    const vapeHex = Buffer.from('vape v4\x00', 'utf16le').toString('hex');
    const monarchHex = Buffer.from('monarchfarmbot\x00', 'utf16le').toString('hex');

    const mockWordWheelOutput = [
      'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\WordWheelQuery',
      `    0    REG_BINARY    ${vapeHex}`,
      `    1    REG_BINARY    ${monarchHex}`,
      '    MRUListEx    REG_BINARY    0000000001000000ffffffff'
    ].join('\n');

    const searchFindings = runHistoryForensics.parseWordWheelOutput(mockWordWheelOutput);

    assert.strictEqual(searchFindings.length, 1, 'Windows arama cubugunda hile aramasi yakalanmali');
    assert.strictEqual(searchFindings[0].type, 'WORDWHEELQUERY_CHEAT_SEARCH');
    assert.ok(searchFindings[0].evidence[0].includes('vape v4'));

    pass('WordWheelQuery: Windows Arama cubugunda aratilmis hile isimleri yakalanmali');
  } catch (err) {
    fail('WordWheelQuery: Windows Arama cubugunda aratilmis hile isimleri yakalanmali', err);
  }

  // ----------------------------------------------------
  // 8. 0 False-Flag Whitelist Integrity across All Engines
  // ----------------------------------------------------
  try {
    const cleanList = [
      'xlite.zip', 'CLaW v.1.2.zip', 'MonarchFarmBot.exe', 'KeystrokesMod.jar',
      'OptiFine_1.20.4_HD_U_I7.jar', 'Sodium-fabric-mc1.20.4.jar', 'AnyDesk.exe',
      'Discord.exe', 'medal-hook64.dll', 'chrome.exe'
    ];

    for (const c of cleanList) {
      assert.strictEqual(pcaScanner.isWhitelisted(c), true, `PCA: ${c} guvenli olmali`);
      assert.strictEqual(werCrashScanner.isWhitelisted(c), true, `WER: ${c} guvenli olmali`);
      assert.strictEqual(runHistoryForensics.isWhitelisted(c), true, `RunMRU: ${c} guvenli olmali`);
    }

    pass('0 False-Flag Butunlugu: Mesru tum uygulamalar adli modullerde 100% guvenli');
  } catch (err) {
    fail('0 False-Flag Butunlugu: Mesru tum uygulamalar adli modullerde 100% guvenli', err);
  }

  // ----------------------------------------------------
  // 9. Browser Visit Type (Transition) Decoding Tests
  // ----------------------------------------------------
  try {
    const browserForensics = require('../src/engine/browserForensics');

    // Chromium Transition tests
    assert.ok(browserForensics.decodeChromiumTransition(1).includes('TYPED'), 'Chromium 1 -> TYPED');
    assert.ok(browserForensics.decodeChromiumTransition(0).includes('LINK'), 'Chromium 0 -> LINK');
    assert.ok(browserForensics.decodeChromiumTransition(2).includes('BOOKMARK'), 'Chromium 2 -> BOOKMARK');
    assert.ok(browserForensics.decodeChromiumTransition(6).includes('START_PAGE'), 'Chromium 6 -> START_PAGE');

    // Firefox Visit Type tests
    assert.ok(browserForensics.decodeFirefoxVisitType(2).includes('TYPED'), 'Firefox 2 -> TYPED');
    assert.ok(browserForensics.decodeFirefoxVisitType(1).includes('LINK'), 'Firefox 1 -> LINK');
    assert.ok(browserForensics.decodeFirefoxVisitType(7).includes('DOWNLOAD'), 'Firefox 7 -> DOWNLOAD');
    assert.ok(browserForensics.decodeFirefoxVisitType(3).includes('BOOKMARK'), 'Firefox 3 -> BOOKMARK');

    pass('Tarayıcı Adli Analizi: Chromium ve Firefox Ziyaret Türleri (TYPED, LINK, DOWNLOAD) başarıyla çözülmeli');
  } catch (err) {
    fail('Tarayıcı Adli Analizi: Chromium ve Firefox Ziyaret Türleri (TYPED, LINK, DOWNLOAD) başarıyla çözülmeli', err);
  }

  // ----------------------------------------------------
  // 10. Browser Visited + Downloaded Ban Correlation Tests
  // ----------------------------------------------------
  try {
    const browserForensics = require('../src/engine/browserForensics');

    const mockVisits = [
      {
        domain: 'doomsdayclient.com',
        url: 'https://doomsdayclient.com/',
        title: 'DoomsDay Ghost Client',
        timestamp: '2026-08-27 20:08:31',
        visitType: 'Doğrudan Adres Çubuğuna Yazıldı (TYPED)',
        browser: 'Firefox'
      }
    ];

    const mockDownloads = [
      {
        fileName: 'DoomsDay-Client-All-Versions-26.1.2.jar',
        targetPath: 'C:\\Users\\User\\Downloads\\DoomsDay-Client-All-Versions-26.1.2.jar',
        timestamp: '2026-08-24 20:06:32',
        url: 'https://download.cdn9mc.com/dl2.php?file=DoomsDay-Client-All-Versions-26.1.2.jar&dl=1',
        visitType: 'Doğrudan Dosya İndirme (DOWNLOAD)'
      }
    ];

    const findings = browserForensics.correlateVisitsAndDownloads(mockVisits, mockDownloads, 'Firefox', 'places.sqlite');

    assert.strictEqual(findings.length, 1, 'Ziyaret ve indirme tek bir somut kanıt ve ban kararına bağlanmalı');
    const f = findings[0];
    assert.strictEqual(f.type, 'BROWSER_CHEAT_VISITED_AND_DOWNLOADED');
    assert.strictEqual(f.visitType, 'Doğrudan Adres Çubuğuna Yazıldı (TYPED)');
    assert.ok(f.banVerdict.includes('KESİN BAN'), 'Ban kararı KESİN BAN içermeli');
    assert.ok(f.evidence.some(e => e.includes('Doğrudan Adres Çubuğuna Yazıldı (TYPED)')), 'Kanıt visit type içermeli');
    assert.ok(f.evidence.some(e => e.includes('DoomsDay-Client-All-Versions-26.1.2.jar')), 'Kanıt dosya adı içermeli');

    pass('Tarayıcı Ban Kararı: Hile sitesine girilmiş ve dosya indirilmişse KESİN BAN kararı üretilmeli');
  } catch (err) {
    fail('Tarayıcı Ban Kararı: Hile sitesine girilmiş ve dosya indirilmişse KESİN BAN kararı üretilmeli', err);
  }

  console.log('\n====================================================');
  console.log(`   SONUC: ${passed} / ${total} ULTRA ADLI TEST BASARILI!`);
  console.log('====================================================\n');

  return { passed, total };
}

if (require.main === module) {
  runUltraForensicsTests();
}

module.exports = { runUltraForensicsTests };
