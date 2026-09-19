'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const projectUrl = 'https://grxcdtcalukzhlqisbgr.supabase.co';
const serviceKey = process.env.ATLAS_STORAGE_KEY;
const config = fs.readFileSync(path.join(__dirname, '..', 'docs', 'assets', 'config.js'), 'utf8');
const anonKey = config.match(/SUPABASE_PUBLISHABLE_KEY\s*=\s*'([^']+)'/)?.[1];
const release = `v${JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).version}`;
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

if (!serviceKey) throw new Error('ATLAS_STORAGE_KEY ortam değişkeni gerekli.');
if (!anonKey) throw new Error('Yayınlanabilir Supabase anahtarı bulunamadı.');

function pin() {
  return Array.from(crypto.randomBytes(8), byte => alphabet[byte % alphabet.length]).join('');
}

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${response.status}: ${body.error || body.message || 'istek başarısız'}`);
  return body;
}

async function main() {
  const adminHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  const profiles = await jsonRequest(`${projectUrl}/rest/v1/profiles?username=eq.EverVerity&select=id`, { headers: adminHeaders });
  if (!profiles[0]?.id) throw new Error('EverVerity yetkili profili bulunamadı.');

  const sessionCode = pin();
  let scanId = null;
  try {
    const inserted = await jsonRequest(`${projectUrl}/rest/v1/scan_sessions`, {
      method: 'POST',
      headers: { ...adminHeaders, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({
        staff_id: profiles[0].id,
        session_code: sessionCode,
        player_name: 'AtlasReleaseCheck',
        game: 'Minecraft Java (PC)',
        status: 'pending',
        progress: 0,
        current_stage: 'Paket doğrulaması',
        expires_at: new Date(Date.now() + 10 * 60_000).toISOString()
      })
    });
    scanId = inserted[0]?.id;
    if (!scanId) throw new Error('Geçici kontrol oturumu oluşturulamadı.');

    for (const platform of ['windows', 'linux']) {
      const result = await jsonRequest(`${projectUrl}/functions/v1/scan-sync`, {
        method: 'POST',
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'download', pin: sessionCode, platform })
      });
      if (result.release !== release || !result.url.includes(`/releases/${release}/`)) {
        throw new Error(`${platform} indirmesi güncel ${release} paket yolunu kullanmıyor.`);
      }
      const response = await fetch(result.url);
      if (!response.ok) throw new Error(`${platform} imzalı indirmesi ${response.status} döndürdü.`);
      const remote = Buffer.from(await response.arrayBuffer());
      const filename = platform === 'linux' ? 'AtlasAC-Linux.zip' : 'AtlasAC-Windows.zip';
      const local = fs.readFileSync(path.join(__dirname, '..', 'dist', filename));
      const remoteHash = crypto.createHash('sha256').update(remote).digest('hex');
      const localHash = crypto.createHash('sha256').update(local).digest('hex');
      if (remoteHash !== localHash) throw new Error(`${filename} uzak ve yerel SHA-256 değerleri eşleşmiyor.`);
      console.log(`[PASS] ${filename}: ${remoteHash}`);
    }
  } finally {
    if (scanId) {
      await fetch(`${projectUrl}/rest/v1/scan_sessions?id=eq.${encodeURIComponent(scanId)}`, {
        method: 'DELETE', headers: adminHeaders
      });
    }
  }
}

main().catch(error => {
  console.error(`[FAIL] ${error.message}`);
  process.exitCode = 1;
});
