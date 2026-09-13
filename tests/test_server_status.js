/**
 * Test Suite: Minecraft Live Server Status Telemetry (mc.atlasoyuncu.com)
 */

const assert = require('assert');
const serverStatus = require('../src/engine/serverStatus');
const reporter = require('../src/engine/reporter');

async function runTests() {
  console.log('================================================================');
  console.log('   ATLAS AC - MINECRAFT LIVE SERVER STATUS TEST SUITE           ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${e.message}\n`);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${e.message}\n`);
    }
  }

  // 1. Live Fetch from mc.atlasoyuncu.com
  await testAsync('1.1 Canlı Veri Çekme: mc.atlasoyuncu.com sunucusundan canlı durum alınmalı', async () => {
    const status = await serverStatus.fetchStatus(true);
    assert.strictEqual(status.host, 'mc.atlasoyuncu.com', 'Host must be mc.atlasoyuncu.com');
    assert.strictEqual(status.port, 25565, 'Port must be 25565');
    assert.strictEqual(typeof status.online, 'boolean', 'Online must be boolean');
    if (status.online) {
      assert.ok(status.players && typeof status.players.online === 'number', 'Players online must be a number');
      assert.ok(status.players.max > 0, 'Players max must be > 0');
      assert.ok(typeof status.motd === 'string' && status.motd.length > 0, 'MOTD must be non-empty string');
      assert.ok(typeof status.latency === 'number' && status.latency >= 0, 'Latency must be valid');
    }
  });

  // 1.2 In-memory caching
  await testAsync('1.2 Önbellek Koruması: İkinci çağrıda önbellek (cached: true) dönmeli', async () => {
    const status2 = await serverStatus.fetchStatus(false);
    assert.strictEqual(status2.cached, true, 'Subsequent fetch within TTL must be cached');
    assert.strictEqual(status2.host, 'mc.atlasoyuncu.com');
  });

  // 1.3 MOTD formatting helper
  test('1.3 MOTD Temizleme: JSON veya renk kodlu MOTD nesneleri düz metne dönüştürülmeli', () => {
    const rawMotd = {
      text: '§6Atlas§r ',
      extra: [
        { text: '§aSkyblock', color: 'green' },
        { text: ' | §bBoxPvP', extra: [{ text: ' 1.21' }] }
      ]
    };
    const cleaned = serverStatus.extractMotdText(rawMotd);
    assert.strictEqual(cleaned, 'Atlas Skyblock | BoxPvP 1.21');
  });

  // 1.4 Graceful fallback on unreachable host
  await testAsync('1.4 Hata Toleransı: Erişilemeyen sunucu durumunda çökme olmadan online: false dönmeli', async () => {
    try {
      await serverStatus.pingServer('127.0.0.1', 59999, 400);
      assert.fail('Should have timed out or failed');
    } catch (err) {
      assert.ok(err.message, 'Must fail gracefully with error message');
    }
  });

  // 1.5 Synchronous getter
  test('1.5 Senkron Durum Okuma: getStatusSync() anında geçerli veri döndürmeli', () => {
    const syncStatus = serverStatus.getStatusSync();
    assert.ok(syncStatus, 'Sync status must not be null');
    assert.strictEqual(syncStatus.host, 'mc.atlasoyuncu.com');
    assert.ok(syncStatus.players && syncStatus.players.max > 0);
  });

  // 1.6 Reporter HTML output
  test('1.6 Rapor Entegrasyonu: Üretilen HTML raporunda mc.atlasoyuncu.com ve oyuncu bilgisi yer almalı', () => {
    const html = reporter.generateHtmlReport({
      allFindings: [],
      isScanning: false,
      serverStatus: {
        online: true,
        host: 'mc.atlasoyuncu.com',
        port: 25565,
        players: { online: 580, max: 2026 },
        version: '1.21.11',
        motd: 'TR mc.atlasoyuncu.com 1.21.11 | GERÇEK KALİTE',
        latency: 95
      }
    });

    assert.ok(html.includes('mc.atlasoyuncu.com'), 'HTML must include mc.atlasoyuncu.com');
    assert.ok(html.includes('580 / 2026'), 'HTML must include 580 / 2026');
    assert.ok(!html.includes('play.atlasoyuncu.com'), 'HTML must NOT include play.atlasoyuncu.com');
    assert.ok(html.includes('server-widget-top-row'), 'HTML must include modern 3-box server widget');
    assert.ok(html.includes('active-game-indicator-bar'), 'HTML must include active game detection bar');
  });

  // 1.7 Active Minecraft process & socket detection module
  await testAsync('1.7 Canlı Minecraft Süreç & Bağlantı Tespiti: detectActiveServer() geçerli şema döndürmeli', async () => {
    const activeDetector = require('../src/engine/activeMinecraftServerDetector');
    const detection = await activeDetector.detectActiveServer(true);
    assert.ok(detection, 'Detection must return object');
    assert.strictEqual(typeof detection.minecraftRunning, 'boolean');
    assert.strictEqual(typeof detection.connected, 'boolean');
    assert.ok(['IN_GAME', 'MENU_OR_LOCAL', 'NOT_RUNNING'].includes(detection.gameState));
    assert.ok(typeof detection.statusText === 'string');
    assert.ok(detection.server && typeof detection.server.host === 'string');
  });

  // 1.8 ServerStatus attaches activeMinecraft telemetry
  await testAsync('1.8 Canlı Durum Entegrasyonu: fetchStatus() activeMinecraft telemetrisini iliştirmeli', async () => {
    const status = await serverStatus.fetchStatus(true);
    assert.ok(status.activeMinecraft, 'Status response must contain activeMinecraft');
    assert.strictEqual(typeof status.activeMinecraft.minecraftRunning, 'boolean');
  });

  console.log('\n================================================================');
  console.log(`   SONUÇ: ${passed} / ${total} TEST BAŞARIYLA TAMAMLANDI!`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
