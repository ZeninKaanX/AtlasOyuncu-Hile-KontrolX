'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pages = ['index.html', 'auth.html', 'download.html', 'dashboard.html', 'results.html'];

for (const page of pages) {
  const html = read(`docs/${page}`);
  assert(html.includes('assets/app.css'), `${page}: ortak tasarım sistemi eksik`);
  assert(!/bot\.(?:css|js)|ocean\.css|site\.css/.test(html), `${page}: eski arayüz varlığı kullanılıyor`);
  assert(/Content-Security-Policy/.test(html), `${page}: CSP eksik`);

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  assert.strictEqual(ids.length, new Set(ids).size, `${page}: yinelenen id var`);
}

const dashboardHtml = read('docs/dashboard.html');
const dashboardJs = read('docs/assets/dashboard.js');
assert(dashboardHtml.includes('Minecraft Java (Linux)'), 'dashboard: Linux Java kontrol seçeneği eksik');
assert(dashboardHtml.includes('Minecraft Bedrock (PC)'), 'dashboard: Bedrock Windows kontrol seçeneği eksik');
assert(dashboardJs.includes("&platform=linux"), 'dashboard: Linux oturumu indirme bağlantısına platform bilgisi eklemeli');
assert(!dashboardJs.includes('setInterval(fetchDetails'), 'dashboard: canlı detay istekleri üst üste binmemeli');
const referencedIds = [...dashboardJs.matchAll(/byId\('([^']+)'\)/g)].map(match => match[1]);
const missingIds = [...new Set(referencedIds)].filter(id => !dashboardHtml.includes(`id="${id}"`));
assert.deepStrictEqual(missingIds, [], `dashboard: HTML'de eksik JS hedefleri: ${missingIds.join(', ')}`);

const playerHtml = read('src/ui/player.html');
const playerJs = read('src/ui/js/player.js');
const playerIds = [...playerJs.matchAll(/byId\('([^']+)'\)/g)].map(match => match[1]);
const missingPlayerIds = [...new Set(playerIds)].filter(id => !playerHtml.includes(`id="${id}"`));
assert.deepStrictEqual(missingPlayerIds, [], `player: HTML'de eksik JS hedefleri: ${missingPlayerIds.join(', ')}`);
assert(playerHtml.includes('ADVANCED INTEGRITY SCANNER'), 'player: kompakt Atlas tarama kimliği eksik');
assert(dashboardJs.includes('freshSessionData'), 'dashboard: API çağrıları taze oturum kullanmalı');
assert(!dashboardJs.includes('minotar.net'), 'dashboard: harici oyuncu avatarına bağımlı olmamalı');
assert(dashboardJs.includes('results.html?scan='), 'dashboard: incele eylemi tam sayfa sonuç ekranına gitmeli');

const resultsHtml = read('docs/results.html');
const resultsJs = read('docs/assets/results.js');
const resultIds = [...resultsJs.matchAll(/byId\('([^']+)'\)/g)].map(match => match[1]);
const missingResultIds = [...new Set(resultIds)].filter(id => !resultsHtml.includes(`id="${id}"`));
assert.deepStrictEqual(missingResultIds, [], `results: HTML'de eksik JS hedefleri: ${missingResultIds.join(', ')}`);
assert(resultsJs.includes("portal('get_scan'"), 'results: güvenli portal rapor akışı kullanılmalı');
assert(resultsJs.includes('setTimeout(loadScan'), 'results: canlı tarama istekleri sıralı çalışmalı');
assert(!resultsJs.includes('innerHTML'), 'results: sunucudan gelen kanıtlar güvenli DOM API ile işlenmeli');

const packageJson = JSON.parse(read('package.json'));
assert(!packageJson.pkg.assets.some(value => value.includes('*.png') || value.includes('*.svg')),
  'paket: geniş UI varlık globları kullanılmamalı');
assert(packageJson.pkg.assets.includes('src/ui/assets/atlas_logo.png'), 'paket: oyuncu logosu eksik');
assert(packageJson.pkg.assets.includes('src/ui/assets/atlas.ico'), 'paket: oyuncu ikonu eksik');

console.log('[PASS] Web portal UI, CSP, DOM bağlantıları ve paket varlık sınırı doğrulandı');
