/**
 * Atlas AC - Cheat Knowledgebase & Staff Guidance Test Suite
 * Validates:
 * 1. Resolution of explanatory guidance for Window Cloaking (WDA_EXCLUDEFROMCAPTURE)
 * 2. Resolution of explanatory guidance for Testsigning boot mode
 * 3. Resolution of explanatory guidance for Spotify DLL hijacking
 * 4. Resolution of explanatory guidance for USN journal deletion
 * 5. Resolution of explanatory guidance for RecentApps deleted cheat execution
 * 6. Resolution of explanatory guidance for Resource Pack hidden bytecode
 * 7. Resolution of explanatory guidance for Font Crash Exploit
 * 8. Resolution of explanatory guidance for CryptnetUrlCache cheat domain trace
 * 9. Resolution of explanatory guidance for Injected DLL crash in javaw.exe
 * 10. Resolution of explanatory guidance for Minecraft session log banner
 * 11. Finding enrichment with Turkish and English explanations
 */

const assert = require('assert');
const cheatKnowledgeBase = require('../src/engine/cheatKnowledgeBase');

console.log('====================================================');
console.log('   ATLAS AC - CHEAT KNOWLEDGEBASE & STAFF SUITE     ');
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

// 1. TEST: Window Cloaking Guidance
runTest('Rehber: WDA_EXCLUDEFROMCAPTURE ekran paylaşımı gizleme açıklaması doğru çözülmeli', () => {
  const fakeFinding = { type: 'WINDOW_CLOAKED_FROM_SCREENSHARE', name: 'Ekran Paylaşımından Gizlenmiş Pencere' };
  const expl = cheatKnowledgeBase.getExplanation(fakeFinding, 'tr');
  assert(expl, 'Açıklama boş olamaz');
  assert(expl.howItWorks.includes('Discord'), 'Discord ekran paylaşımı atlatma bilgisi içermeli');
  assert(expl.adminAction.includes('BAN'), 'Ban tavsiyesi içermeli');
  assert(expl.whyConcrete.includes('0x11'), '0x11 somut kanıt bilgisi içermeli');
});

// 2. TEST: Testsigning Guidance
runTest('Rehber: TESTSIGNING modunun ring-0 sürücü yükleme amacı açıklanmalı', () => {
  const fakeFinding = { type: 'TESTSIGNING_BOOT_MODE_ENABLED' };
  const expl = cheatKnowledgeBase.getExplanation(fakeFinding, 'tr');
  assert(expl.howItWorks.includes('imzasız'), 'İmzasız sürücü bilgisi içermeli');
  assert(expl.adminAction.includes('BYPASS'), 'Bypass tespiti içermeli');
});

// 3. TEST: Spotify DLL Hijack Guidance
runTest('Rehber: Spotify DLL kancalama ve Truva Atı yöntemi açıklanmalı', () => {
  const fakeFinding = { type: 'SPOTIFY_DLL_HIJACK' };
  const expl = cheatKnowledgeBase.getExplanation(fakeFinding, 'tr');
  assert(expl.howItWorks.includes('version.dll') || expl.howItWorks.includes('winmm.dll'));
  assert(expl.adminAction.includes('BAN'));
});

// 4. TEST: USN Wiping Guidance
runTest('Rehber: USN Journal silinmesinin kanıt karartma olduğu açıklanmalı', () => {
  const fakeFinding = { type: 'USN_JOURNAL_DELETION_DETECTED' };
  const expl = cheatKnowledgeBase.getExplanation(fakeFinding, 'tr');
  assert(expl.howItWorks.includes('fsutil usn deletejournal'));
  assert(expl.adminAction.includes('KANIT KARARTMA'));
});

// 5. TEST: RecentApps Deleted Cheat Guidance
runTest('Rehber: RecentApps üzerinden silinmiş hilenin tespiti açıklanmalı', () => {
  const fakeFinding = { type: 'RECENTAPPS_CHEAT_EXECUTION_RECORD' };
  const expl = cheatKnowledgeBase.getExplanation(fakeFinding, 'tr');
  assert(expl.howItWorks.includes('silmiştir') || expl.howItWorks.includes('RecentApps'));
  assert(expl.whyConcrete.includes('FILETIME'));
});

// 6. TEST: Resource Pack Bytecode Guidance
runTest('Rehber: Resource Pack içinde Java .class bulunmasının hile olduğu açıklanmalı', () => {
  const fakeFinding = { type: 'RESOURCEPACK_HIDDEN_JAVA_CLASSES' };
  const expl = cheatKnowledgeBase.getExplanation(fakeFinding, 'tr');
  assert(expl.howItWorks.includes('doku paketi'));
  assert(expl.adminAction.includes('BAN'));
});

// 7. TEST: Font Crash Exploit Guidance
runTest('Rehber: Özyinelemeli font çökertme istismarı açıklanmalı', () => {
  const fakeFinding = { type: 'MINECRAFT_FONT_CIRCULAR_CRASH_EXPLOIT' };
  const expl = cheatKnowledgeBase.getExplanation(fakeFinding, 'tr');
  assert(expl.howItWorks.includes('StackOverflowError') || expl.howItWorks.includes('çöker'));
  assert(expl.adminAction.includes('EXPLOIT'));
});

// 8. TEST: CryptnetUrlCache Guidance
runTest('Rehber: Windows CryptnetUrlCache hile doğrulama önbelleği açıklanmalı', () => {
  const fakeFinding = { type: 'CRYPTNET_URLCACHE_CHEAT_DOMAIN_FOUND' };
  const expl = cheatKnowledgeBase.getExplanation(fakeFinding, 'tr');
  assert(expl.howItWorks.includes('CryptoAPI') || expl.howItWorks.includes('CryptnetUrlCache'));
});

// 9. TEST: Injected DLL Crash Guidance
runTest('Rehber: javaw.exe içinde harici DLL çökmesi açıklanmalı', () => {
  const fakeFinding = { type: 'JAVAW_INJECTED_MODULE_CRASH' };
  const expl = cheatKnowledgeBase.getExplanation(fakeFinding, 'tr');
  assert(expl.howItWorks.includes('javaw.exe') || expl.howItWorks.includes('Temp'));
  assert(expl.adminAction.includes('BAN'));
});

// 10. TEST: Minecraft Session Log Guidance
runTest('Rehber: Minecraft oturum günlüğü hile izleri açıklanmalı', () => {
  const fakeFinding = { type: 'MINECRAFT_LOG_CHEAT_EXECUTION' };
  const expl = cheatKnowledgeBase.getExplanation(fakeFinding, 'tr');
  assert(expl.howItWorks.includes('latest.log') || expl.howItWorks.includes('logs'));
  assert(expl.adminAction.includes('BAN'));
});

// 11. TEST: enrichFinding helper
runTest('Entegrasyon: enrichFinding fonksiyonu bulguya Türkçe ve İngilizce rehber eklemeli', () => {
  const rawFinding = {
    level: 'CRITICAL',
    type: 'WINDOW_CLOAKED_FROM_SCREENSHARE',
    name: 'WDA_EXCLUDEFROMCAPTURE',
    description: 'Pencere gizlendi'
  };

  const enriched = cheatKnowledgeBase.enrichFinding(rawFinding);
  assert(enriched.explanation, 'Türkçe açıklama objesi eklenmeli');
  assert(enriched.explanationEn, 'İngilizce açıklama objesi eklenmeli');
  assert(enriched.tacticInfo, 'tacticInfo alanı eklenmeli');
  assert(enriched.adminGuide, 'adminGuide alanı eklenmeli');
});

console.log(`\n====================================================`);
console.log(`   SONUC: ${passedTests} / ${totalTests} TEST BASARILI!`);
console.log(`====================================================\n`);

if (require.main === module) {
  process.exit(passedTests === totalTests ? 0 : 1);
} else if (passedTests !== totalTests) {
  process.exit(1);
}
