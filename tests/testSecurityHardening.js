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

function request(port, route, cookie = '') {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1', port, path: route, method: 'GET',
      headers: cookie ? { Cookie: cookie } : {}
    }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const serverSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'main', 'server.js'), 'utf8');
  const playerSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', 'js', 'player.js'), 'utf8');
  assert(serverSource.includes("JSON.stringify({ type: 'PROGRESS', percent })"), 'Player telemetry must be percentage-only');
  assert(!serverSource.includes("finishScan('SCAN_COMPLETE', { data: results"), 'Player completion event must not contain scan results');
  assert(!playerSource.includes('finding') && !playerSource.includes('reportData'), 'Player UI must not process forensic evidence');

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
    const setCookie = root.headers['set-cookie'] && root.headers['set-cookie'][0];
    assert(setCookie && setCookie.includes('HttpOnly') && setCookie.includes('SameSite=Strict'), 'Root must mint a hardened session cookie');
    assert(root.body.includes('Atlas AC Scanner'), 'Root must serve the minimal player scanner');
    assert(!root.body.includes('Detection Results'), 'Player UI must not expose forensic results');
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
