#!/usr/bin/env node

const crypto = require('node:crypto');

const projectUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const secretKey = String(process.env.SUPABASE_SECRET_KEY || '');
const adminEmail = String(process.env.ATLAS_ADMIN_EMAIL || '').trim().toLowerCase();
const revokedInvite = String(process.env.ATLAS_REVOKE_INVITE || '');

if (!projectUrl || !secretKey || !adminEmail) {
  console.error('SUPABASE_URL, SUPABASE_SECRET_KEY and ATLAS_ADMIN_EMAIL are required.');
  process.exit(1);
}

const headers = {
  apikey: secretKey,
  Authorization: `Bearer ${secretKey}`,
  'Content-Type': 'application/json'
};

async function request(path, options = {}) {
  const response = await fetch(`${projectUrl}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${options.method || 'GET'} ${path} failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  return response;
}

async function main() {
  let target = null;
  for (let page = 1; page <= 20 && !target; page += 1) {
    const response = await request(`/auth/v1/admin/users?page=${page}&per_page=100`);
    const payload = await response.json();
    const users = Array.isArray(payload.users) ? payload.users : [];
    target = users.find(user => String(user.email || '').toLowerCase() === adminEmail);
    if (users.length < 100) break;
  }
  if (!target) throw new Error('Configured administrator account was not found.');

  const profileResponse = await request(`/rest/v1/profiles?id=eq.${encodeURIComponent(target.id)}&select=id,role`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ role: 'admin' })
  });
  const profiles = await profileResponse.json();
  if (profiles.length !== 1 || profiles[0].role !== 'admin') {
    throw new Error('Administrator profile could not be verified.');
  }

  if (revokedInvite) {
    const codeHash = crypto.createHash('sha256').update(revokedInvite).digest('hex');
    await request(`/rest/v1/invites?code_hash=eq.${codeHash}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' }
    });
  }

  console.log('Administrator role configured and the legacy invite was revoked.');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
