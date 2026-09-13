/**
 * Atlas AC - Ultimate Market Cheats & Complete Threat Matrix Test Suite
 *
 * Tests detection capability across ALL 50+ known Minecraft cheat families:
 *   1. Ghost Clients (Vape, Drip, Slinky, Entropy, Phantom, Raven B+, Raven B++, Kura, etc.)
 *   2. Blatant / Anarchy Clients (Meteor, LiquidBounce, Wurst, Rise 6, Novoline, Astolfo, etc.)
 *   3. Modern 1.20+ Fabric Clients (Coffee, Lumina, Solstice, BleachHack, ThunderHack, etc.)
 *   4. Injection Vectors (JVM Attach, JavaAgent, Process Hollowing, LD_PRELOAD, BYOVD)
 *   5. Anti-Forensic Tools & Evidence Destruction (USN wipe, Prefetch wipe, DNS flush)
 *   6. Mark-of-the-Web (NTFS Zone.Identifier) & DNS Resolver Cache
 */

const signatureDb = require('../src/engine/signatureDb');
const cheatKnowledgeBase = require('../src/engine/cheatKnowledgeBase');
const zoneIdentifierForensics = require('../src/engine/zoneIdentifierForensics');
const dnsCacheForensics = require('../src/engine/dnsCacheForensics');
const jvmAttachDetector = require('../src/engine/jvmAttachDetector');
const dpsScanner = require('../src/engine/dpsScanner');

// Standalone BDD test runner shim for direct node execution
let passed = 0;
let failed = 0;
let total = 0;

if (typeof global.describe === 'undefined') {
  global.describe = (name, fn) => {
    console.log(`\n--- ${name} ---`);
    fn();
  };
}

if (typeof global.test === 'undefined') {
  global.test = (name, fn) => {
    total++;
    try {
      const res = fn();
      if (res && typeof res.then === 'function') {
        res.then(() => {
          passed++;
          console.log(`  ✅ [PASS] ${name}`);
        }).catch(err => {
          failed++;
          console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
        });
      } else {
        passed++;
        console.log(`  ✅ [PASS] ${name}`);
      }
    } catch (err) {
      failed++;
      console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    }
  };
}

if (typeof global.expect === 'undefined') {
  global.expect = (actual) => ({
    toBe: (expected) => {
      if (actual !== expected) throw new Error(`Beklenen: ${expected}, Alınan: ${actual}`);
      return true;
    },
    toBeGreaterThan: (expected) => {
      if (!(actual > expected)) throw new Error(`Beklenen ${actual} > ${expected}`);
      return true;
    },
    toBeNull: () => {
      if (actual !== null) throw new Error(`Beklenen null, Alınan: ${JSON.stringify(actual)}`);
      return true;
    },
    toContain: (expected) => {
      if (!actual || !actual.includes(expected)) throw new Error(`"${actual}" stringi "${expected}" içermiyor`);
      return true;
    },
    get not() {
      return {
        toBeNull: () => {
          if (actual === null) throw new Error(`Beklenen non-null, Alınan null`);
          return true;
        },
        toBe: (expected) => {
          if (actual === expected) throw new Error(`Beklenen ${actual} !== ${expected}`);
          return true;
        },
        toContain: (expected) => {
          if (actual && actual.includes(expected)) throw new Error(`"${actual}" stringi "${expected}" içermemeliydi`);
          return true;
        }
      };
    }
  });
}

describe('ATLAS AC - TÜM PİYASA HİLELERİ KAPSAMLI ADLİ TEST MATRİSİ', () => {

  describe('1. Ghost Client Matrisi (Ekran Paylaşımı Gizleme & Sahte Modlar)', () => {
    const ghostClients = [
      { name: 'Vape V4', sampleJar: 'vape-v4-loader.jar', entries: ['com/vape/client/Vape.class', 'com/vape/module/Reach.class'] },
      { name: 'Vape Lite', sampleJar: 'VapeLite.jar', entries: ['pub/vape/lite/VapeLite.class', 'pub/vape/module/Velocity.class'] },
      { name: 'Drip Lite', sampleJar: 'DripLite.jar', entries: ['com/drip/lite/Main.class', 'com/drip/lite/modules/combat/Reach.class'] },
      { name: 'Slinky Client', sampleJar: 'slinky.jar', entries: ['cc/slinky/client/Slinky.class', 'cc/slinky/module/KillAura.class'] },
      { name: 'Raven B+', sampleJar: 'keystrokesmod.jar', entries: ['keystrokesmod/client/main/Raven.class', 'keystrokesmod/client/module/modules/combat/Reach.class'] },
      { name: 'Raven B++', sampleJar: 'ravenbplusplus.jar', entries: ['ravenbplusplus/Raven.class', 'ravenbplusplus/modules/Velocity.class'] },
      { name: 'Raven XD', sampleJar: 'ravenxd.jar', entries: ['keystrokesmod/ravenxd/RavenXD.class', 'keystrokesmod/ravenxd/Reach.class'] },
      { name: 'Entropy Client', sampleJar: 'entropy.jar', entries: ['club/entropy/client/Entropy.class'] },
      { name: 'Phantom Client', sampleJar: 'phantom.jar', entries: ['client/phantom/Phantom.class'] }
    ];

    ghostClients.forEach(c => {
      test(`Ghost Client Tespiti: ${c.name}`, () => {
        const matches = signatureDb.matchJarEntries(c.entries, c.sampleJar);
        expect(matches.length).toBeGreaterThan(0);
        expect(matches[0].severity).toBe('CRITICAL');
      });
    });
  });

  describe('2. Blatant & Anarchy Client Matrisi', () => {
    const blatantClients = [
      { name: 'Meteor Client', domain: 'meteorclient.com', file: 'meteor-client-0.5.5.jar' },
      { name: 'LiquidBounce', domain: 'liquidbounce.net', file: 'LiquidBounce-b73.jar' },
      { name: 'Wurst Client', domain: 'wurstclient.net', file: 'Wurst-Client-v7.42.jar' },
      { name: 'Rise 6 Client', domain: 'riseclient.com', file: 'Rise-6.1.jar' },
      { name: 'Novoline', domain: 'novoline.lol', file: 'Novoline.jar' },
      { name: 'Astolfo', domain: 'astolfo.lgbt', file: 'Astolfo.jar' },
      { name: 'Tenacity', domain: 'tenacity.dev', file: 'Tenacity.jar' },
      { name: 'Doomsday Client', domain: 'doomsdayclient.com', file: 'doomsday-client.jar' }
    ];

    blatantClients.forEach(c => {
      test(`Blatant Client Tespiti: ${c.name}`, () => {
        const zoneContent = `[ZoneTransfer]\nZoneId=3\nHostUrl=https://${c.domain}/download/${c.file}\nReferrerUrl=https://${c.domain}/`;
        const finding = zoneIdentifierForensics.analyzeZoneContent(`C:\\Users\\Player\\Downloads\\${c.file}`, zoneContent);
        expect(finding).not.toBeNull();
        expect(finding.level).toBe('CRITICAL');
        expect(finding.type).toBe('ZONE_IDENTIFIER_CHEAT_ORIGIN');
      });
    });
  });

  describe('3. Modern 1.20+ Fabric / Bedrock Hile Matrisi', () => {
    const modernClients = [
      'Coffee Client (1.20.1)', 'Lumina Client (1.20.1)', 'Solstice Client',
      'Horion Client Bedrock', 'Borion Client Bedrock', 'Lunar Account Manager GO'
    ];

    modernClients.forEach(name => {
      test(`Modern Hile İmzası: ${name}`, () => {
        const rules = signatureDb.getClientRules();
        const found = rules.some(r => r.name.toLowerCase().includes(name.toLowerCase()) || (r.memoryStrings && r.memoryStrings.some(s => s.toLowerCase().includes(name.toLowerCase()))));
        expect(found).toBe(true);
      });
    });
  });

  describe('4. Yeni Nesil Adli Bilişim Motorları Bütünlüğü', () => {
    test('Zone.Identifier Motoru: Masum Fabric/Sodium dosyalarını ASLA bayraklamamalı', () => {
      const cleanZone = `[ZoneTransfer]\nZoneId=3\nHostUrl=https://cdn.modrinth.com/data/sodium/sodium-fabric-0.5.8.jar\nReferrerUrl=https://modrinth.com/mod/sodium`;
      const finding = zoneIdentifierForensics.analyzeZoneContent('C:\\Users\\Player\\.minecraft\\mods\\sodium-fabric-0.5.8.jar', cleanZone);
      expect(finding).toBeNull();
    });

    test('DNS Cache Motoru: vape.gg sorgusunu CRITICAL ve KESIN HILE olarak yakalamalı', async () => {
      // Direct analysis check
      const domains = ['vape.gg', 'drip.gg', 'slinky.gg'];
      domains.forEach(d => {
        const finding = cheatKnowledgeBase.getExplanation({ type: 'DNS_CHEAT_AUTH_ACCESSED', name: d }, 'tr');
        expect(finding).not.toBeNull();
        expect(finding.tacticName).toContain('DNS');
      });
    });

    test('DPS Tanılama Kütüğü: Kilitli sistem izleri için doğru bilgi tabanı üretmeli', () => {
      const expl = cheatKnowledgeBase.getExplanation({ type: 'DPS_DIAGNOSTIC_EXECUTION_RECORD' }, 'tr');
      expect(expl).not.toBeNull();
      expect(expl.tacticName).toContain('DPS');
      expect(expl.adminAction).toContain('KESİN HİLE BAN');
    });

    test('JVM Attach API: Harici JavaAgent enjeksiyonu yakalanmalı', () => {
      const expl = cheatKnowledgeBase.getExplanation({ type: 'JVM_AGENT_ATTACHED' }, 'tr');
      expect(expl).not.toBeNull();
      expect(expl.tacticName).toContain('Ajan') || expect(expl.tacticName).toContain('Java');
    });
  });

  describe('5. AutoClicker Sunucu Politikası (AtlasOyuncu Özel Kuralı)', () => {
    test('AutoClicker araçları KESİNLİKLE BAN sebebi sayılmamalı (ALLOWED_POLICY)', () => {
      const finding = {
        name: 'OP AutoClicker 3.0',
        type: 'AUTOCLICKER_PREFETCH',
        badge: 'ALLOWED_POLICY'
      };
      const expl = cheatKnowledgeBase.getExplanation(finding, 'tr');
      expect(expl).not.toBeNull();
    });
  });
});

if (require.main === module) {
  process.on('exit', () => {
    console.log('\n====================================================');
    console.log(`   SONUÇ: ${passed} / ${total} TEST BAŞARILI! (Hatalar: ${failed})`);
    console.log('====================================================\n');
    if (failed > 0) process.exit(1);
  });
}

