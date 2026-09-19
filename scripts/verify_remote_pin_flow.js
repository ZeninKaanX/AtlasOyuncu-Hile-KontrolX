#!/usr/bin/env node

/** Remote smoke test for the deployed PIN protocol. */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SUPABASE_URL = 'https://grxcdtcalukzhlqisbgr.supabase.co';
const config = fs.readFileSync(path.join(__dirname, '..', 'docs', 'assets', 'config.js'), 'utf8');
const anonKey = config.match(/SUPABASE_PUBLISHABLE_KEY\s*=\s*'([^']+)'/)?.[1];
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!anonKey || !secretKey) throw new Error('SUPABASE_SECRET_KEY is required and the public key must be configured.');

const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const pin = Array.from(crypto.randomBytes(8), byte => alphabet[byte % alphabet.length]).join('');
const adminHeaders = { apikey: secretKey, Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' };
const publicHeaders = { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json' };
let sessionId = null;

async function jsonFetch(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function publicAction(body) {
  return jsonFetch(`${SUPABASE_URL}/functions/v1/scan-sync`, {
    method: 'POST', headers: publicHeaders, body: JSON.stringify(body)
  });
}

async function main() {
  try {
    const created = await jsonFetch(`${SUPABASE_URL}/rest/v1/scan_sessions`, {
      method: 'POST',
      headers: { ...adminHeaders, Prefer: 'return=representation' },
      body: JSON.stringify({
        session_code: pin, player_name: 'REMOTE_SMOKE_TEST', game: 'Minecraft Java (PC)',
        status: 'pending', expires_at: new Date(Date.now() + 10 * 60_000).toISOString()
      })
    });
    if (!created.response.ok || !created.data?.[0]?.id) throw new Error(`Test session create failed (${created.response.status}).`);
    sessionId = created.data[0].id;

    const download = await publicAction({ action: 'download', pin, platform: 'windows' });
    if (!download.response.ok || !download.data.url?.includes('/storage/v1/object/sign/')) throw new Error('Signed download URL was not issued.');
    const range = await fetch(download.data.url, { headers: { Range: 'bytes=0-0' } });
    if (![200, 206].includes(range.status)) throw new Error(`Signed object is not readable (${range.status}).`);
    await range.body?.cancel();

    const clientIds = [crypto.randomBytes(32).toString('hex'), crypto.randomBytes(32).toString('hex')];
    const competingClaims = await Promise.all(clientIds.map(clientId => publicAction({
      action: 'claim', pin, clientId, clientPlatform: 'linux',
      systemInfo: { platform: 'linux', osName: 'Linux Remote Smoke Test', cpu: 'Test CPU', cpuCores: 4, ram: '8 GB', uptimeMinutes: 12 }
    })));
    const successfulClaims = competingClaims.filter(result => result.response.ok);
    const rejectedClaims = competingClaims.filter(result => result.response.status === 409);
    if (successfulClaims.length !== 1 || rejectedClaims.length !== 1) throw new Error('Atomic single-device claim protection failed.');
    const claim = successfulClaims[0];
    const clientId = clientIds[competingClaims.indexOf(claim)];
    if (!claim.data.clientToken || claim.data.sessionId !== sessionId) throw new Error('PIN claim failed.');

    const forged = await publicAction({ action: 'progress', pin, percent: 50 });
    if (forged.response.status !== 401) throw new Error('PIN-only telemetry write was not rejected.');

    const progress = await publicAction({
      action: 'progress', sessionId, clientToken: claim.data.clientToken,
      percent: 50, stage: 'Remote smoke test', log: 'Authenticated telemetry', objectsCount: 1
    });
    if (!progress.response.ok) throw new Error('Authenticated progress update failed.');

    const stored = await jsonFetch(`${SUPABASE_URL}/rest/v1/scan_sessions?id=eq.${encodeURIComponent(sessionId)}&select=progress,objects_count,client_platform,system_info`, {
      method: 'GET', headers: adminHeaders
    });
    const liveRow = stored.data?.[0];
    if (!stored.response.ok || liveRow?.progress !== 50 || liveRow?.objects_count !== 1) {
      throw new Error('Live progress was accepted but not persisted.');
    }
    if (liveRow.client_platform !== 'linux' || liveRow.system_info?.osName !== 'Linux Remote Smoke Test') {
      throw new Error('Early client platform metadata was not persisted.');
    }

    const complete = await publicAction({
      action: 'complete', sessionId, clientToken: claim.data.clientToken,
      findings: [], reportData: { scannedObjects: 1, durationSeconds: 1 }, systemInfo: { platform: 'test' }
    });
    if (!complete.response.ok || complete.data.verdict !== 'clean') throw new Error('Completion failed.');

    const replay = await publicAction({ action: 'claim', pin, clientId });
    if (replay.response.status !== 404) throw new Error('Completed PIN could be replayed.');
    console.log('PASS remote PIN flow: private download, device binding, live persistence, platform metadata, completion, replay protection.');
  } finally {
    if (sessionId) {
      await fetch(`${SUPABASE_URL}/rest/v1/scan_sessions?id=eq.${encodeURIComponent(sessionId)}`, {
        method: 'DELETE', headers: adminHeaders
      });
    }
  }
}

main().catch(error => {
  console.error(`FAIL remote PIN flow: ${error.message}`);
  process.exitCode = 1;
});
