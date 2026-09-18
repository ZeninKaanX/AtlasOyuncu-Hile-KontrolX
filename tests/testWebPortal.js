'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pages = ['index.html', 'auth.html', 'download.html', 'dashboard.html'];

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
const referencedIds = [...dashboardJs.matchAll(/byId\('([^']+)'\)/g)].map(match => match[1]);
const missingIds = [...new Set(referencedIds)].filter(id => !dashboardHtml.includes(`id="${id}"`));
assert.deepStrictEqual(missingIds, [], `dashboard: HTML'de eksik JS hedefleri: ${missingIds.join(', ')}`);
assert(dashboardJs.includes('freshSessionData'), 'dashboard: API çağrıları taze oturum kullanmalı');
assert(!dashboardJs.includes('minotar.net'), 'dashboard: harici oyuncu avatarına bağımlı olmamalı');

const packageJson = JSON.parse(read('package.json'));
assert(!packageJson.pkg.assets.some(value => value.includes('*.png') || value.includes('*.svg')),
  'paket: geniş UI varlık globları kullanılmamalı');
assert(packageJson.pkg.assets.includes('src/ui/assets/atlas_logo.png'), 'paket: oyuncu logosu eksik');
assert(packageJson.pkg.assets.includes('src/ui/assets/atlas.ico'), 'paket: oyuncu ikonu eksik');

console.log('[PASS] Web portal UI, CSP, DOM bağlantıları ve paket varlık sınırı doğrulandı');
