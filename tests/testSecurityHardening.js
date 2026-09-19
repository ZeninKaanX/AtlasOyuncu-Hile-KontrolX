'use strict';

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const AdmZip = require('adm-zip');

process.env.ATLAS_NO_BROWSER = '1';

const reporter = require('../src/engine/reporter');
const minecraftInspector = require('../src/engine/minecraftInspector');
const { CloudSync } = require('../src/engine/cloudSync');

function request(port, route, cookie = '', method = 'GET', payload = null) {
  return new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : '';
    const req = http.request({
      hostname: '127.0.0.1', port, path: route, method,
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {})
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end(body);
  });
}

async function main() {
  const serverSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'main', 'server.js'), 'utf8');
  const playerSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', 'js', 'player.js'), 'utf8');
  assert(serverSource.includes("broadcastPlayer({ type: 'PROGRESS', percent })"), 'Player telemetry must be percentage-only');
  assert(!serverSource.includes("finishScan('SCAN_COMPLETE', { data: results"), 'Player completion event must not contain scan results');
  assert(!serverSource.includes('fuser -k') && !serverSource.includes('taskkill /F'), 'Port collision handling must never kill unrelated processes');
  assert(!playerSource.includes('finding') && !playerSource.includes('reportData'), 'Player UI must not process forensic evidence');

  const orderedSync = new CloudSync();
  orderedSync.activeSessionId = '00000000-0000-4000-8000-000000000001';
  orderedSync.clientToken = 'A'.repeat(64);
  const sentPercents = [];
  orderedSync.request = async payload => {
    await new Promise(resolve => setTimeout(resolve, payload.percent === 10 ? 20 : 1));
    sentPercents.push(payload.percent);
    return { ok: true };
  };
  await Promise.all([
    orderedSync.sendProgress(10, 'A', 'A'),
    orderedSync.sendProgress(20, 'B', 'B'),
    orderedSync.sendProgress(30, 'C', 'C')
  ]);
  assert.deepStrictEqual(sentPercents, [10, 20, 30], 'Cloud progress writes must remain ordered');

  const malicious = '<img src=x onerror="globalThis.__atlas_xss=1">';
  const html = reporter.generateHtmlReport({
    allFindings: [],
    serverStatus: {
      online: true,
      host: malicious,
      version: malicious,
      motd: malicious,
      favicon: 'x" onerror="alert(1)',
      players: { online: 1, max: 1 }
    }
  });
  assert(!html.includes(malicious), 'Remote server metadata must be HTML escaped');
  assert(!html.includes('x" onerror="alert(1)'), 'Untrusted favicon must be rejected');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-hardening-'));
  const fakeFreecam = path.join(tmpDir, 'trusted-freecam.jar');
  const zip = new AdmZip();
  zip.addFile('net/ccbluex/liquidbounce/LiquidBounce.class', Buffer.from('CAFEBABE'));
  zip.addFile('net/ccbluex/liquidbounce/features/module/modules/combat/KillAura.class', Buffer.from('CAFEBABE'));
  zip.writeZip(fakeFreecam);
  const detections = minecraftInspector.inspectJarFile(fakeFreecam, true);
  assert(detections.some(f => f.level === 'CRITICAL'), 'Freecam policy must not bypass cheat inspection');
  fs.rmSync(tmpDir, { recursive: true, force: true });

  const { startServer, server } = require('../src/main/server');
  const serverOutcome = new Promise(resolve => {
    server.once('listening', () => resolve({ listening: true }));
    server.once('error', error => resolve({ error }));
  });
  startServer(0);
  const outcome = await serverOutcome;
  if (outcome.error && outcome.error.code === 'EPERM') {
    console.log('[SKIP] Loopback integration test (sandbox socket policy)');
  } else {
    if (outcome.error) throw outcome.error;
    const address = server.address();
    assert.strictEqual(address.address, '127.0.0.1', 'Control server must bind only to loopback');
    const denied = await request(address.port, '/api/shutdown');
    assert.strictEqual(denied.status, 403, 'API must reject requests without a session');
    const root = await request(address.port, '/');
    assert.strictEqual(root.headers['x-atlas-scanner'], '1', 'Root must identify a genuine Atlas scanner instance');
    const setCookie = root.headers['set-cookie'] && root.headers['set-cookie'][0];
    assert(setCookie && setCookie.includes('HttpOnly') && setCookie.includes('SameSite=Strict'), 'Root must mint a hardened session cookie');
    assert(root.body.includes('Atlas AC Scanner'), 'Root must serve the minimal player scanner');
    assert(!root.body.includes('Detection Results'), 'Player UI must not expose forensic results');
    const invalidPin = await request(address.port, '/api/session-code', setCookie.split(';')[0], 'POST', { sessionCode: 'INVALID!' });
    assert.strictEqual(invalidPin.status, 400, 'Existing scanner PIN forwarding must validate input');
    const hiddenReport = await request(address.port, '/api/report/latest', setCookie.split(';')[0]);
    assert.strictEqual(hiddenReport.status, 404, 'Local forensic report route must not exist');
    const legacyUi = await request(address.port, '/index.html', setCookie.split(';')[0]);
    assert.strictEqual(legacyUi.status, 404, 'Legacy staff UI must not be served to the player');
    await new Promise(resolve => server.close(resolve));
  }

  console.log('[PASS] Security hardening regression suite');
}

main().catch(err => {
  console.error('[FAIL] Security hardening regression suite:', err.stack || err.message);
  process.exit(1);
});
