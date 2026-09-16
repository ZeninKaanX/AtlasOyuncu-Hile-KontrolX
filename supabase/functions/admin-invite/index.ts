import { admin, cors, json, randomKey, secureEqual, sha256 } from '../_shared/common.ts';

Deno.serve(async req => {
  const origin = req.headers.get('Origin') || '';
  const headers = cors(origin);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  const expected = Deno.env.get('ADMIN_TOKEN') || '';
  const supplied = req.headers.get('X-Admin-Token') || '';
  if (!expected || !secureEqual(await sha256(supplied), await sha256(expected))) return json({ error: 'Forbidden' }, 403, headers);
  try {
    const body = await req.json();
    const days = Math.min(Math.max(Number(body.days || 7), 1), 365);
    const maxUses = Math.min(Math.max(Number(body.maxUses || 1), 1), 100);
    const inviteKey = `ATLAS-${randomKey(12)}`;
    const { error } = await admin().from('invites').insert({ code_hash: await sha256(inviteKey), label: String(body.label || 'Davet').slice(0, 80), expires_at: new Date(Date.now() + days * 86400000).toISOString(), max_uses: maxUses });
    if (error) throw error;
    return json({ inviteKey, days, maxUses }, 201, headers);
  } catch (_) {
    return json({ error: 'Davet oluşturulamadı.' }, 400, headers);
  }
});
