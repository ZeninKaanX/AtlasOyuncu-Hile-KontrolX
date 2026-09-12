/**
 * Atlas AC - Test Suite for 86 Cyde.xyz Cheat Clients & False-Positive Verification
 */

const assert = require('assert');
const signatureDb = require('../src/engine/signatureDb');
const peInspector = require('../src/engine/peBinaryInspector');
const cheatKnowledgeBase = require('../src/engine/cheatKnowledgeBase');

console.log('================================================================');
console.log('   ATLAS AC - 86 CYDE.XYZ CLIENTS DETECTION & IMMUNITY TEST     ');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
  }
}

// 1. Test False Positive Guard for CaffeineMC Hydrogen
runTest('Immunity Guard: CaffeineMC Hydrogen mod must NEVER be flagged', () => {
  const entries = [
    'fabric.mod.json',
    'me/jellysquid/mods/hydrogen/Hydrogen.class',
    'me/jellysquid/mods/hydrogen/common/HydrogenConfig.class',
    'me/jellysquid/mods/hydrogen/mixin/ChunkMemoryMixin.class'
  ];
  const metadata = { id: 'hydrogen', name: 'Hydrogen (CaffeineMC)' };
  const matches = signatureDb.matchJarEntries(entries, 'hydrogen-fabric-mc1.20.1-0.4.1.jar', '/mods/hydrogen.jar', metadata);
  assert.strictEqual(matches.length, 0, `Expected 0 matches for CaffeineMC Hydrogen, got ${matches.length}`);
});

// 2. Test False Positive Guard for CaffeineMC Lithium
runTest('Immunity Guard: CaffeineMC Lithium mod must NEVER be flagged', () => {
  const entries = [
    'fabric.mod.json',
    'me/jellysquid/mods/lithium/Lithium.class',
    'me/jellysquid/mods/lithium/common/LithiumMod.class',
    'me/jellysquid/mods/lithium/mixin/AIWorldPhysicsMixin.class'
  ];
  const metadata = { id: 'lithium', name: 'Lithium (CaffeineMC)' };
  const matches = signatureDb.matchJarEntries(entries, 'lithium-fabric-mc1.20.1-0.11.2.jar', '/mods/lithium.jar', metadata);
  assert.strictEqual(matches.length, 0, `Expected 0 matches for CaffeineMC Lithium, got ${matches.length}`);
});

// 3. Test Detection of Hydrogen Cheat Client (with combat classes)
runTest('Detection: Hydrogen Cheat Client is detected when combat classes are present', () => {
  const entries = [
    'me/hydrogen/client/HydrogenClient.class',
    'me/hydrogen/client/modules/KillAura.class',
    'me/hydrogen/client/modules/Reach.class'
  ];
  const matches = signatureDb.matchJarEntries(entries, 'HydrogenCheat.jar', '/mods/HydrogenCheat.jar', null);
  assert.ok(matches.length > 0, 'Hydrogen Cheat Client should be detected');
  assert.strictEqual(matches[0].ruleId, 'hydrogen_cheat_client');
});

// 4. Test Detection of Lithium Ghost Client (with reach/velocity)
runTest('Detection: Lithium Ghost Client is detected when combat classes are present', () => {
  const entries = [
    'me/curse/lithium/LithiumGhost.class',
    'me/curse/lithium/modules/Reach.class',
    'me/curse/lithium/modules/Velocity.class'
  ];
  const matches = signatureDb.matchJarEntries(entries, 'LithiumGhost.jar', '/mods/LithiumGhost.jar', null);
  assert.ok(matches.length > 0, 'Lithium Ghost Client should be detected');
  assert.strictEqual(matches[0].ruleId, 'lithium_cheat_client');
});

// 5. Test 67 Client
runTest('Detection: 67 Client', () => {
  const entries = ['me/sixseven/client/67Client.class', 'me/sixseven/client/Reach.class'];
  const matches = signatureDb.matchJarEntries(entries, '67_client.jar', '/mods/67_client.jar');
  assert.ok(matches.some(m => m.ruleId === 'sixtyseven_client'));
});

// 6. Test Dark Client
runTest('Detection: Dark Client', () => {
  const entries = ['darkclient/DarkClient.class', 'darkclient/combat/Reach.class'];
  const matches = signatureDb.matchJarEntries(entries, 'DarkClient.jar', '/mods/DarkClient.jar');
  assert.ok(matches.some(m => m.ruleId === 'dark_client'));
});

// 7. Test Tuff Client
runTest('Detection: Tuff Client', () => {
  const entries = ['me/tuff/client/TuffClient.class', 'me/tuff/client/Velocity.class'];
  const matches = signatureDb.matchJarEntries(entries, 'TuffClient.jar', '/mods/TuffClient.jar');
  assert.ok(matches.some(m => m.ruleId === 'tuff_client'));
});

// 8. Test Breeze Client
runTest('Detection: Breeze Client', () => {
  const entries = ['me/breeze/client/BreezeClient.class', 'me/breeze/client/AimAssist.class'];
  const matches = signatureDb.matchJarEntries(entries, 'BreezeClient.jar', '/mods/BreezeClient.jar');
  assert.ok(matches.some(m => m.ruleId === 'breeze_client'));
});

// 9. Test Silk Client
runTest('Detection: Silk Client', () => {
  const entries = ['me/silk/client/SilkClient.class', 'me/silk/client/Reach.class'];
  const matches = signatureDb.matchJarEntries(entries, 'SilkClient.jar', '/mods/SilkClient.jar');
  assert.ok(matches.some(m => m.ruleId === 'silk_client'));
});

// 10. Test Cyemer Client
runTest('Detection: Cyemer Client', () => {
  const entries = ['me/cyemer/client/CyemerClient.class', 'me/cyemer/client/AutoClicker.class'];
  const matches = signatureDb.matchJarEntries(entries, 'Cyemer.jar', '/mods/Cyemer.jar');
  assert.ok(matches.some(m => m.ruleId === 'cyemer_client'));
});

// 11. Test Volt Client
runTest('Detection: Volt Client', () => {
  const entries = ['me/volt/client/VoltClient.class', 'me/volt/client/Velocity.class'];
  const matches = signatureDb.matchJarEntries(entries, 'VoltClient.jar', '/mods/VoltClient.jar');
  assert.ok(matches.some(m => m.ruleId === 'volt_client'));
});

// 12. Test Remnant Client
runTest('Detection: Remnant Client', () => {
  const entries = ['me/remnant/client/RemnantClient.class', 'me/remnant/client/Reach.class'];
  const matches = signatureDb.matchJarEntries(entries, 'RemnantClient.jar', '/mods/RemnantClient.jar');
  assert.ok(matches.some(m => m.ruleId === 'remnant_client'));
});

// 13. Test Haru Reborn Client
runTest('Detection: Haru Reborn Client', () => {
  const entries = ['me/harureborn/HaruReborn.class', 'me/harureborn/combat/Reach.class'];
  const matches = signatureDb.matchJarEntries(entries, 'HaruReborn.jar', '/mods/HaruReborn.jar');
  assert.ok(matches.some(m => m.ruleId === 'haru_client'));
});

// 14. Test Arsenic Client
runTest('Detection: Arsenic Client', () => {
  const entries = ['me/blebdapleb/arsenic/Arsenic.class', 'me/blebdapleb/arsenic/modules/Reach.class'];
  const matches = signatureDb.matchJarEntries(entries, 'ArsenicClient.jar', '/mods/ArsenicClient.jar');
  assert.ok(matches.some(m => m.ruleId === 'arsenic_client'));
});

// 15. Test Tarasande Client
runTest('Detection: Tarasande Client', () => {
  const entries = ['me/tarasande/Tarasande.class', 'me/tarasande/client/SilentAim.class'];
  const matches = signatureDb.matchJarEntries(entries, 'tarasande.jar', '/mods/tarasande.jar');
  assert.ok(matches.some(m => m.ruleId === 'tarasande_client'));
});

// 16. Test Acrimony Client
runTest('Detection: Acrimony Client', () => {
  const entries = ['me/aqac/acrimony/Acrimony.class', 'me/aqac/acrimony/modules/KillAura.class'];
  const matches = signatureDb.matchJarEntries(entries, 'Acrimony.jar', '/mods/Acrimony.jar', { id: 'acrimony' });
  assert.ok(matches.some(m => m.ruleId === 'acrimony_client'));
});

// 17. Test CrossSine Client
runTest('Detection: CrossSine Client', () => {
  const entries = ['cn/tianwen/crosssine/CrossSine.class', 'cn/tianwen/crosssine/modules/KillAura.class'];
  const matches = signatureDb.matchJarEntries(entries, 'CrossSine.jar', '/mods/CrossSine.jar', { id: 'crosssine' });
  assert.ok(matches.some(m => m.ruleId === 'crosssine_client'));
});

// 18. Test Sakura Client
runTest('Detection: Sakura Client', () => {
  const entries = ['me/sakura/Sakura.class', 'me/sakura/modules/KillAura.class'];
  const matches = signatureDb.matchJarEntries(entries, 'Sakura.jar', '/mods/Sakura.jar', { id: 'sakura' });
  assert.ok(matches.some(m => m.ruleId === 'sakura_client'));
});

// 19. Test Coffee Client (1.20.1)
runTest('Detection: Coffee Client (1.20.1)', () => {
  const entries = ['me/coffee/Coffee.class', 'me/coffee/modules/AutoCrystal.class'];
  const matches = signatureDb.matchJarEntries(entries, 'CoffeeClient.jar', '/mods/CoffeeClient.jar', { id: 'coffee' });
  assert.ok(matches.some(m => m.ruleId === 'coffee_client'));
});

// 20. Test Lumina Client (1.20.1)
runTest('Detection: Lumina Client (1.20.1)', () => {
  const entries = ['me/lumina/Lumina.class', 'me/lumina/modules/KillAura.class'];
  const matches = signatureDb.matchJarEntries(entries, 'LuminaClient.jar', '/mods/LuminaClient.jar', { id: 'lumina' });
  assert.ok(matches.some(m => m.ruleId === 'lumina_client'));
});

// 21. Test Solstice Client
runTest('Detection: Solstice Client', () => {
  const entries = ['me/solstice/Solstice.class', 'me/solstice/modules/KillAura.class'];
  const matches = signatureDb.matchJarEntries(entries, 'Solstice.jar', '/mods/Solstice.jar', { id: 'solstice' });
  assert.ok(matches.some(m => m.ruleId === 'solstice_client'));
});

// 22. Test Aoba Client
runTest('Detection: Aoba Client', () => {
  const entries = ['me/earth/aoba/Aoba.class', 'me/earth/aoba/modules/KillAura.class'];
  const matches = signatureDb.matchJarEntries(entries, 'Aoba.jar', '/mods/Aoba.jar', { id: 'aoba' });
  assert.ok(matches.some(m => m.ruleId === 'aoba_client'));
});

// 23. Test NightX Client
runTest('Detection: NightX Client', () => {
  const entries = ['me/nightx/NightX.class', 'me/nightx/modules/KillAura.class'];
  const matches = signatureDb.matchJarEntries(entries, 'NightX.jar', '/mods/NightX.jar', { id: 'nightx' });
  assert.ok(matches.some(m => m.ruleId === 'nightx_client'));
});

// 24. Test Nemui Client
runTest('Detection: Nemui Client', () => {
  const entries = ['me/nemui/Nemui.class', 'me/nemui/client/Reach.class'];
  const matches = signatureDb.matchJarEntries(entries, 'Nemui.jar', '/mods/Nemui.jar');
  assert.ok(matches.some(m => m.ruleId === 'nemui_client'));
});

// 25. Test Crypt Client
runTest('Detection: Crypt Client', () => {
  const entries = ['me/crypt/Crypt.class', 'me/crypt/modules/Velocity.class'];
  const matches = signatureDb.matchJarEntries(entries, 'CryptClient.jar', '/mods/CryptClient.jar');
  assert.ok(matches.some(m => m.ruleId === 'crypt_client'));
});

// 26. Test Eternal Client (Lite & V2)
runTest('Detection: Eternal Client', () => {
  const entries = ['me/eternal/Eternal.class', 'me/eternal/client/Velocity.class'];
  const matches = signatureDb.matchJarEntries(entries, 'EternalLite.jar', '/mods/EternalLite.jar');
  assert.ok(matches.some(m => m.ruleId === 'eternal_client'));
});

// 27. Test Weave Manager
runTest('Detection: Weave Manager / Loader', () => {
  const entries = ['net/weavemc/loader/Main.class', 'net/weavemc/loader/Hook.class'];
  const matches = signatureDb.matchJarEntries(entries, 'weave-loader-0.2.4.jar', '/.weave/loader.jar');
  assert.ok(matches.some(m => m.ruleId === 'weave_manager'));
});

// 28. Test Ripterms Ghost strings in Memory / Binary
runTest('Detection: Ripterms Ghost string patterns', () => {
  const strings = [
    'Ripterms',
    'mappings_lunar_1_8_9',
    'ClassPatcherJar'
  ];
  const matches = signatureDb.matchMemoryStrings(strings, 'Ripterms.dll');
  assert.ok(matches.some(m => m.ruleId === 'ripterms_ghost'));
});

// 29. Test Horion Client Bedrock string patterns
runTest('Detection: Horion Client Bedrock patterns', () => {
  const strings = [
    'Horion Client',
    'horionbeta.club',
    'HorionInjector.exe'
  ];
  const matches = signatureDb.matchMemoryStrings(strings, 'Horion.dll');
  assert.ok(matches.some(m => m.ruleId === 'horion_client'));
});

// 30. Test Borion Client Bedrock string patterns
runTest('Detection: Borion Client Bedrock patterns', () => {
  const strings = [
    'Borion Client',
    'BorionInjector.exe',
    'BorionBeta'
  ];
  const matches = signatureDb.matchMemoryStrings(strings, 'Borion.dll');
  assert.ok(matches.some(m => m.ruleId === 'borion_client'));
});

// 31. Test Lunar Account Manager GO string patterns
runTest('Detection: Lunar Account Manager GO patterns', () => {
  const strings = [
    'Lunar Account Manager GO',
    'lunar-accounts.json'
  ];
  const matches = signatureDb.matchMemoryStrings(strings, 'LAM.exe');
  assert.ok(matches.some(m => m.ruleId === 'lunar_account_manager'));
});

// 32. Test Badlion Offline string patterns
runTest('Detection: Badlion Offline patterns', () => {
  const strings = [
    'Badlion Offline',
    'BadlionOffline.exe',
    'blc-offline'
  ];
  const matches = signatureDb.matchMemoryStrings(strings, 'BadlionOffline.exe');
  assert.ok(matches.some(m => m.ruleId === 'badlion_offline'));
});

// 33. Test Feather Client Cracked string patterns
runTest('Detection: Feather Client Cracked patterns', () => {
  const strings = [
    'Feather Client Cracked',
    'FeatherBypass'
  ];
  const matches = signatureDb.matchMemoryStrings(strings, 'FeatherCracked.exe');
  assert.ok(matches.some(m => m.ruleId === 'feather_cracked'));
});

// 34. Test CheatKnowledgeBase Explanation for Weave and Bedrock
runTest('Knowledge Base: Weave & Bedrock resolution', () => {
  const weaveExpl = cheatKnowledgeBase.getExplanation({ ruleId: 'weave_manager', name: 'Weave Manager' }, 'tr');
  assert.ok(weaveExpl && weaveExpl.howItWorks.includes('Weave'), 'Weave explanation should be present');

  const bedrockExpl = cheatKnowledgeBase.getExplanation({ ruleId: 'horion_client', name: 'Horion Client' }, 'tr');
  assert.ok(bedrockExpl && bedrockExpl.howItWorks.includes('Bedrock'), 'Bedrock explanation should be present');
});

console.log('\n----------------------------------------------------------------');
console.log(`Test Tamamlandı: ${passedTests}/${totalTests} Başarılı!`);
console.log('----------------------------------------------------------------\n');

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  console.log('🎉 TÜM TESTLER BAŞARIYLA GEÇTİ!');
  process.exit(0);
}
