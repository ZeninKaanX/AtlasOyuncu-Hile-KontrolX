import { admin, cors, json, sha256 } from '../_shared/common.ts';

Deno.serve(async req => {
  const origin = req.headers.get('Origin') || '';
  const headers = cors(origin);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  const isAllowed = !origin || origin === Deno.env.get('APP_ORIGIN') || origin.endsWith('github.io') || origin.includes('localhost') || origin.includes('127.0.0.1');
  if (!isAllowed || req.method !== 'POST') return json({ error: 'Forbidden' }, 403, headers);
  try {
    const { email = '', username = '', password = '', inviteKey = '' } = await req.json();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanUsername = String(username).trim();
    const cleanInvite = String(inviteKey).trim().toUpperCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || !/^[A-Za-z0-9_.-]{3,32}$/.test(cleanUsername) || String(password).length < 10 || cleanInvite.length < 12) {
      return json({ error: 'Bilgiler geçersiz. Şifre en az 10 karakter olmalı.' }, 400, headers);
    }
    const db = admin();
    const { data: inviteId, error: inviteError } = await db.rpc('consume_invite', { invite_hash: await sha256(cleanInvite) });
    if (inviteError || !inviteId) return json({ error: 'Davet anahtarı geçersiz, süresi dolmuş veya kullanılmış.' }, 403, headers);

    const { data: created, error: authError } = await db.auth.admin.createUser({ email: cleanEmail, password: String(password), email_confirm: true });
    if (authError || !created.user) {
      await db.rpc('refund_invite', { invite_id: inviteId });
      return json({ error: 'Bu e-posta zaten kayıtlı veya kabul edilmedi.' }, 409, headers);
    }
    const expires = new Date(Date.now() + Number(Deno.env.get('LICENSE_DAYS') || 30) * 86400000).toISOString();
    const { error: setupError } = await db.from('profiles').insert({ id: created.user.id, username: cleanUsername });
    const { error: entitlementError } = await db.from('entitlements').insert({ user_id: created.user.id, status: 'active', expires_at: expires, max_devices: 1 });
    if (setupError || entitlementError) {
      await db.auth.admin.deleteUser(created.user.id);
      await db.rpc('refund_invite', { invite_id: inviteId });
      return json({ error: 'Kullanıcı adı kullanılıyor veya hesap kurulamadı.' }, 409, headers);
    }
    return json({ ok: true, message: 'Hesap oluşturuldu. Şimdi giriş yapabilirsiniz.' }, 201, headers);
  } catch (_) {
    return json({ error: 'Kayıt isteği işlenemedi.' }, 400, headers);
  }
});
