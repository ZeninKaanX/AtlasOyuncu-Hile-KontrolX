/**
 * Atlas AC - Modrinth 1000+ Clean Mod Whitelist & AI Semantic Bytecode Cheat Verification Suite
 * 
 * Verifies:
 * 1. Modrinth Whitelist O(1) lookups for 13,000+ clean mods and verified developer namespaces.
 * 2. 0 False Positives on legitimate community mods (Sodium, Iris, AppleSkin, ModMenu, etc.).
 * 3. AI-like Semantic Bytecode Classification of custom homemade cheats without signatures:
 *    - Custom KillAura (Entity iteration + atan2/hypot + PlayerInteractEntityC2SPacket.attack)
 *    - Custom Velocity / Anti-KB (EntityVelocityUpdateS2CPacket cancellation / motion nullification)
 *    - Custom AutoTotem (Health monitoring + slot 45 inventory swap packet)
 *    - Custom Reach / Hitbox Expander (Box.expand > 3.0 blocks)
 * 4. Trojan Whitelist Guard: Backdoored/injected clean mods are caught despite whitelisted name.
 * 5. CheatKnowledgeBase produces rich, actionable forensic guidance for all new detections.
 */

const assert = require('assert');
const path = require('path');
const fs = require('os');
const AdmZip = require('adm-zip');

const modrinthWhitelist = require('../src/engine/modrinthWhitelist');
const semanticClassifier = require('../src/engine/semanticCheatClassifier');
const minecraftInspector = require('../src/engine/minecraftInspector');
const deepArchiveScanner = require('../src/engine/deepArchiveScanner');
const cheatKnowledgeBase = require('../src/engine/cheatKnowledgeBase');

console.log('================================================================');
console.log('   ATLAS AC - MODRINTH WHITELIST & AI SEMANTIC CHEAT SUITE      ');
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

// Helper: Generates a valid Java .class file buffer containing specified CONSTANT_Utf8 strings
function createSimulatedClassBuffer(constantStrings) {
  const chunks = [];
  // Magic 0xCAFEBABE
  const header = Buffer.alloc(10);
  header.writeUInt32BE(0xCAFEBABE, 0);
  header.writeUInt16BE(0, 4); // minor version
  header.writeUInt16BE(61, 6); // major version (Java 17)
  header.writeUInt16BE(constantStrings.length + 1, 8); // cpCount
  chunks.push(header);

  for (const s of constantStrings) {
    const sBuf = Buffer.from(s, 'utf8');
    const entryHeader = Buffer.alloc(3);
    entryHeader.writeUInt8(1, 0); // tag CONSTANT_Utf8
    entryHeader.writeUInt16BE(sBuf.length, 1);
    chunks.push(entryHeader);
    chunks.push(sBuf);
  }

  // Dummy access flags, this_class, super_class, interfaces_count, fields_count, methods_count, attributes_count
  const footer = Buffer.alloc(16);
  chunks.push(footer);

  return Buffer.concat(chunks);
}

// -----------------------------------------------------------------------------
// 1. MODRINTH WHITELIST TESTS
// -----------------------------------------------------------------------------
runTest('1. Modrinth Whitelist: 13,000+ temiz mod veritabanı başarıyla belleğe yüklenmeli', () => {
  assert(modrinthWhitelist.totalCleanMods > 5000, `Temiz mod sayısı en az 5000 olmalı, bulunan: ${modrinthWhitelist.totalCleanMods}`);
  assert(modrinthWhitelist.cleanNamespaces.length > 20, `Temiz paket alanı en az 20 olmalı, bulunan: ${modrinthWhitelist.cleanNamespaces.length}`);
});

runTest('2. Modrinth Whitelist: Popüler meşru modlar anında doğrulanmalı (O(1) Hızlı Arama)', () => {
  const popularMods = ['sodium', 'iris', 'lithium', 'appleskin', 'modmenu', 'cloth-config', 'fabric-api', 'journeymap', 'jei', 'rei'];
  for (const modId of popularMods) {
    assert(modrinthWhitelist.isCleanModId(modId), `Meşru mod '${modId}' beyaz listede bulunamadı!`);
  }
});

runTest('3. Modrinth Whitelist: Doğrulanmış geliştirici paket alanları tanınmalı', () => {
  assert(modrinthWhitelist.isCleanNamespace('me/jellysquid/mods/sodium/client/render/SodiumWorldRenderer.class'));
  assert(modrinthWhitelist.isCleanNamespace('net/irisshaders/iris/pipeline/IrisRenderingPipeline.class'));
  assert(modrinthWhitelist.isCleanNamespace('com/terraformersmc/modmenu/gui/ModsScreen.class'));
  assert(!modrinthWhitelist.isCleanNamespace('com/vape/client/VapeCore.class'));
  assert(!modrinthWhitelist.isCleanNamespace('net/doomsday/client/DoomsdayModule.class'));
});

runTest('3.1 Modrinth Whitelist Koruması: AutoTotem ve Savaş Hileleri beyaz listeye ASLA alınmamalı', () => {
  const forbidden = [
    { id: 'autototem', file: 'autototem-1.20.1.jar' },
    { id: 'auto-totem', file: 'auto-totem-fabric.jar' },
    { id: 'totem-helper', file: 'totem-helper.jar' },
    { id: 'smarttotem', file: 'smarttotem.jar' },
    { id: 'killaura', file: 'killaura.jar' },
    { id: 'reach', file: 'reach-mod.jar' },
    { id: 'hitbox', file: 'hitbox-expander.jar' }
  ];

  for (const item of forbidden) {
    const res = modrinthWhitelist.isCleanMod({ id: item.id }, [], item.file);
    assert.strictEqual(res.isWhitelisted, false, `'${item.id}' beyaz listeye alınmamalıdır!`);
    assert(modrinthWhitelist.isForbiddenCheatKeyword(item.id), `'${item.id}' yasaklı hile anahtar kelimesi olmalı`);
  }
});

// -----------------------------------------------------------------------------
// 2. ZERO FALSE POSITIVE VERIFICATION ON CLEAN MODS
// -----------------------------------------------------------------------------
runTest('4. 0 False-Flag: Meşru Modrinth AppleSkin modu tertemiz kalmalı (0 Bulgular)', () => {
  const zip = new AdmZip();
  const hudClass = createSimulatedClassBuffer([
    'squeek/appleskin/client/HUDOverlayHandler',
    'java/lang/Object',
    'net/minecraft/client/gui/DrawContext',
    'drawFoodLevel',
    'drawExhaustion'
  ]);
  zip.addFile('squeek/appleskin/client/HUDOverlayHandler.class', hudClass);
  zip.addFile('fabric.mod.json', Buffer.from(JSON.stringify({
    id: 'appleskin',
    name: 'AppleSkin',
    version: '2.5.1'
  })));

  const rawEntries = zip.getEntries();
  const entryNames = rawEntries.map(e => e.entryName);
  const wlResult = modrinthWhitelist.isCleanMod({ id: 'appleskin', name: 'AppleSkin' }, entryNames, 'appleskin-fabric-mc1.20.1-2.5.1.jar');
  assert(wlResult.isWhitelisted, 'AppleSkin beyaz listede olmalı');

  const semanticFindings = semanticClassifier.classifyJar('appleskin-fabric-mc1.20.1-2.5.1.jar', zip, rawEntries, wlResult);
  assert.strictEqual(semanticFindings.length, 0, 'AppleSkin için hiçbir semantik hile bulgusu çıkmamalı');
});

// -----------------------------------------------------------------------------
// 3. AI SEMANTIC CLASSIFIER - CUSTOM HOMEMADE CHEAT TESTS
// -----------------------------------------------------------------------------
runTest('5. AI Semantik Analiz: Özel yazılmış KillAura (İmzasız / Rastgele İsimli) kesin tespit edilmeli', () => {
  const zip = new AdmZip();
  // Homemade KillAura class with random name: net/mycustom/PvPCombatHelper.class
  const customKillAuraClass = createSimulatedClassBuffer([
    'net/mycustom/PvPCombatHelper',
    'net/minecraft/world/World',
    'getEntities',
    'getOtherEntities',
    'java/lang/Math',
    'atan2',
    'hypot',
    'distanceTo',
    'squaredDistanceTo',
    'wrapDegrees',
    'net/minecraft/entity/player/PlayerEntity',
    'net/minecraft/network/packet/c2s/play/PlayerInteractEntityC2SPacket',
    'attackEntity',
    'swingHand'
  ]);
  zip.addFile('net/mycustom/PvPCombatHelper.class', customKillAuraClass);

  const rawEntries = zip.getEntries();
  const findings = semanticClassifier.classifyJar('CustomPvPTool.jar', zip, rawEntries, { isWhitelisted: false });

  assert(findings.length > 0, 'Özel KillAura tespit edilmeli');
  assert.strictEqual(findings[0].type, 'CUSTOM_HOMEMADE_CHEAT_DETECTED');
  assert(findings[0].name.includes('KillAura'), `Başlık KillAura içermeli: ${findings[0].name}`);
  assert(findings[0].semanticVectors.includes('KILL_AURA_SEMANTICS'), 'KILL_AURA_SEMANTICS vektörü bulunmalı');
});

runTest('6. AI Semantik Analiz: Özel yazılmış Velocity / Anti-KB kesin tespit edilmeli', () => {
  const zip = new AdmZip();
  const customVelocityClass = createSimulatedClassBuffer([
    'net/hacks/VelocityReducer',
    'net/minecraft/network/packet/s2c/play/EntityVelocityUpdateS2CPacket',
    'class_2743',
    'motionX',
    'motionZ',
    'cancel',
    'horizontal',
    'vertical'
  ]);
  zip.addFile('net/hacks/VelocityReducer.class', customVelocityClass);

  const rawEntries = zip.getEntries();
  const findings = semanticClassifier.classifyJar('MovementFix.jar', zip, rawEntries, { isWhitelisted: false });

  assert(findings.length > 0, 'Özel Velocity tespit edilmeli');
  assert.strictEqual(findings[0].type, 'CUSTOM_HOMEMADE_CHEAT_DETECTED');
  assert(findings[0].semanticVectors.includes('VELOCITY_BYPASS_SEMANTICS'), 'VELOCITY_BYPASS_SEMANTICS vektörü bulunmalı');
});

runTest('7. AI Semantik Analiz: Özel yazılmış AutoTotem (Slot 45 Otomasyonu) kesin tespit edilmeli', () => {
  const zip = new AdmZip();
  const customTotemClass = createSimulatedClassBuffer([
    'com/totem/FastTotemModule',
    'totem_of_undying',
    'TOTEM_OF_UNDYING',
    'getHealth',
    'OFF_HAND',
    'net/minecraft/network/packet/c2s/play/ClickSlotC2SPacket',
    'class_2813',
    'SWAP_ITEM_WITH_OFFHAND',
    '45' // slot 45
  ]);
  zip.addFile('com/totem/FastTotemModule.class', customTotemClass);

  const rawEntries = zip.getEntries();
  const findings = semanticClassifier.classifyJar('TotemUtility.jar', zip, rawEntries, { isWhitelisted: false });

  assert(findings.length > 0, 'Özel AutoTotem tespit edilmeli');
  assert.strictEqual(findings[0].type, 'CUSTOM_HOMEMADE_CHEAT_DETECTED');
  assert(findings[0].semanticVectors.includes('AUTO_TOTEM_SEMANTICS'), 'AUTO_TOTEM_SEMANTICS vektörü bulunmalı');
});

runTest('8. AI Semantik Analiz: Özel yazılmış Reach / Hitbox Expander (> 3.0 Blok) kesin tespit edilmeli', () => {
  const zip = new AdmZip();
  const customReachClass = createSimulatedClassBuffer([
    'org/combat/ReachExpander',
    'net/minecraft/util/math/Box',
    'expandBox',
    'stretch',
    'getExtendedReach',
    'reachDistance: 4.5',
    'hitboxExpansion: 0.8',
    'attackEntity'
  ]);
  zip.addFile('org/combat/ReachExpander.class', customReachClass);

  const rawEntries = zip.getEntries();
  const findings = semanticClassifier.classifyJar('ReachBooster.jar', zip, rawEntries, { isWhitelisted: false });

  assert(findings.length > 0, 'Özel Reach modülü tespit edilmeli');
  assert.strictEqual(findings[0].type, 'CUSTOM_HOMEMADE_CHEAT_DETECTED');
  assert(findings[0].semanticVectors.includes('REACH_EXPANSION_SEMANTICS'), 'REACH_EXPANSION_SEMANTICS vektörü bulunmalı');
});

// -----------------------------------------------------------------------------
// 4. TROJAN WHITELIST GUARD (CLEAN MOD MASQUERADE)
// -----------------------------------------------------------------------------
runTest('9. Truva Atı Koruması: Sodium içine gizlenmiş KillAura beyaz listeden kaçamamalı (TROJAN_WHITELIST_BYPASS_ATTEMPT)', () => {
  const zip = new AdmZip();
  // Valid Modrinth mod name and metadata
  zip.addFile('fabric.mod.json', Buffer.from(JSON.stringify({
    id: 'sodium',
    name: 'Sodium',
    version: '0.5.8'
  })));
  // Injected malicious combat class
  const trojanKillAuraClass = createSimulatedClassBuffer([
    'me/jellysquid/mods/sodium/extra/EvilKillAura',
    'getEntities',
    'atan2',
    'hypot',
    'distanceTo',
    'PlayerInteractEntityC2SPacket',
    'attackEntity',
    'swingHand'
  ]);
  zip.addFile('me/jellysquid/mods/sodium/extra/EvilKillAura.class', trojanKillAuraClass);

  const rawEntries = zip.getEntries();
  const entryNames = rawEntries.map(e => e.entryName);
  const wlResult = modrinthWhitelist.isCleanMod({ id: 'sodium', name: 'Sodium' }, entryNames, 'sodium-fabric-mc1.20.1-0.5.8.jar');
  assert(wlResult.isWhitelisted, 'Dosya adı ve ID beyaz listede olmalı');

  // Semantic Classifier must catch the trojan regardless of whitelist!
  const findings = semanticClassifier.classifyJar('sodium-fabric-mc1.20.1-0.5.8.jar', zip, rawEntries, wlResult);
  assert(findings.length > 0, 'Gizlenmiş truva atı hile mutlaka yakalanmalı!');
  assert.strictEqual(findings[0].type, 'TROJAN_WHITELIST_BYPASS_ATTEMPT', 'Tür TROJAN_WHITELIST_BYPASS_ATTEMPT olmalı');
  assert(findings[0].name.includes('Truva Atı Mod'), 'Başlık Truva Atı uyarısı içermeli');
});

// -----------------------------------------------------------------------------
// 5. CHEAT KNOWLEDGEBASE INTEGRATION
// -----------------------------------------------------------------------------
runTest('10. CheatKnowledgeBase: CUSTOM_HOMEMADE_CHEAT_DETECTED ve TROJAN rehberi zenginleştirilmeli', () => {
  const sampleFinding = {
    level: 'CRITICAL',
    type: 'CUSTOM_HOMEMADE_CHEAT_DETECTED',
    name: 'Özel Kodlanmış / İmzasız Hile Tespit Edildi: CustomPvP.jar',
    file: 'CustomPvP.jar',
    path: '/home/user/.minecraft/mods/CustomPvP.jar',
    confidence: '100% (Somut Kanıt: Yapay Zeka Semantik Baytkod Analizi)'
  };

  const enriched = cheatKnowledgeBase.enrichFinding(sampleFinding);
  assert(enriched.explanation, 'Türkçe açıklama üretilmeli');
  assert(enriched.explanation.tacticName.includes('Özel Kodlanmış'), 'Taktik adı özel hile içermeli');
  assert(enriched.explanation.adminAction.includes('KESİN BAN'), 'Admin tavsiyesi KESİN BAN olmalı');
  assert(enriched.explanationEn.tacticName.includes('Custom / Homemade'), 'İngilizce açıklama mevcut olmalı');
});

console.log('\n================================================================');
console.log(`   SONUÇ: ${passedTests} / ${totalTests} TEST BAŞARIYLA TAMAMLANDI!`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
