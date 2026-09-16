import { admin, cors, json, sha256 } from '../_shared/common.ts';

const encoder = new TextEncoder();

Deno.serve(async req => {
  const origin = req.headers.get('Origin') || '';
  const headers = cors(origin);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  const isAllowed = !origin || origin === Deno.env.get('APP_ORIGIN') || origin.endsWith('github.io') || origin.includes('localhost') || origin.includes('127.0.0.1');
  if (!isAllowed) return json({ error: 'Forbidden' }, 403, headers);
  const auth = req.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const db = admin();
  const { data: authData, error: authError } = await db.auth.getUser(token);
  if (authError || !authData.user) return json({ error: 'Oturum geçersiz.' }, 401, headers);
  const user = authData.user;
  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
  const action = new URL(req.url).searchParams.get('action') || body.action || 'me';
  const { data: profile } = await db.from('profiles').select('username,disabled_at').eq('id', user.id).single();
  const { data: entitlement } = await db.from('entitlements').select('status,expires_at,max_devices').eq('user_id', user.id).single();
  if (!profile || profile.disabled_at || !entitlement) return json({ error: 'Hesap kullanılamıyor.' }, 403, headers);

  if (action === 'me') {
    const { data: licenses } = await db.from('licenses').select('id,machine_id,expires_at,created_at').eq('user_id', user.id).is('revoked_at', null).order('created_at', { ascending: false });
    return json({ user: { email: user.email, username: profile.username }, entitlement, licenses: licenses || [] }, 200, headers);
  }
  if (entitlement.status !== 'active' || new Date(entitlement.expires_at).getTime() <= Date.now()) return json({ error: 'Kullanım hakkı aktif değil.' }, 403, headers);

  if (action === 'license') {
    const machineId = String(body.machineId || '').trim().toUpperCase();
    if (!/^[A-F0-9]{64}$/.test(machineId)) return json({ error: 'Makine Kimliği 64 karakterli olmalıdır.' }, 400, headers);
    const { data: active } = await db.from('licenses').select('id,machine_id').eq('user_id', user.id).is('revoked_at', null);
    const existing = active?.find(x => x.machine_id === machineId);
    if (!existing && (active?.length || 0) >= entitlement.max_devices) return json({ error: 'Cihaz limitine ulaşıldı.' }, 409, headers);
    const now = new Date();
    const expiresAt = new Date(Math.min(new Date(entitlement.expires_at).getTime(), Date.now() + Number(Deno.env.get('LICENSE_DAYS') || 30) * 86400000));
    const licenseId = existing?.id || crypto.randomUUID();
    const payload = { version: 1, product: 'atlas-ac', licenseId, customer: profile.username, issuedAt: now.toISOString(), expiresAt: expiresAt.toISOString(), machineId, features: ['scan'] };
    const key = await signLicense(payload);
    await db.from('licenses').upsert({ id: licenseId, user_id: user.id, machine_id: machineId, expires_at: expiresAt.toISOString(), created_at: now.toISOString(), revoked_at: null }, { onConflict: 'user_id,machine_id' });
    await audit(db, user.id, 'license.created', req, { licenseId });
    return json({ key, expiresAt: expiresAt.toISOString() }, 201, headers);
  }
  if (action === 'download') {
    const platform = String(body.platform || new URL(req.url).searchParams.get('platform') || 'windows').toLowerCase();
    const filename = platform === 'linux' ? 'AtlasAC-Linux' : 'AtlasAC.exe';
    const { data, error } = await db.storage.from('atlas-downloads').createSignedUrl(filename, 60, { download: filename });
    if (error || !data) {
      const releaseUrl = `https://github.com/ZeninKaanX/AtlasOyuncu-Hile-KontrolX/releases/download/v1.0.0/${filename}`;
      await audit(db, user.id, `download.${platform}.github`, req, {});
      return json({ url: releaseUrl, expiresIn: 60, filename }, 200, headers);
    }
    await audit(db, user.id, `download.${platform}`, req, {});
    return json({ url: data.signedUrl, expiresIn: 60, filename }, 200, headers);
  }

  // SCREEN CHECK (KONTROL) ACTIONS FOR STAFF
  if (action === 'create_scan') {
    const playerName = String(body.playerName || 'Şüpheli Oyuncu').trim().slice(0, 32);
    // Generate unique 8-character Ocean AC style PIN (e.g. 8F3C21A9)
    const pinChars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let sessionCode = '';
    for (let attempt = 0; attempt < 5; attempt++) {
      let code = '';
      const rnd = new Uint8Array(8);
      crypto.getRandomValues(rnd);
      for (let i = 0; i < 8; i++) code += pinChars[rnd[i] % pinChars.length];
      const { data: existing } = await db.from('scan_sessions').select('id').eq('session_code', code).maybeSingle();
      if (!existing) {
        sessionCode = code;
        break;
      }
    }
    if (!sessionCode) sessionCode = `ATL-${Date.now().toString().slice(-4)}`;

    const { data: inserted, error: insErr } = await db.from('scan_sessions').insert({
      session_code: sessionCode,
      staff_id: user.id,
      player_name: playerName,
      status: 'pending',
      progress: 0,
      current_stage: 'Oyuncu Bağlantısı Bekleniyor'
    }).select().single();

    if (insErr) return json({ error: insErr.message }, 500, headers);
    await audit(db, user.id, 'scan.created', req, { sessionCode, playerName });
    return json({ success: true, session: inserted }, 201, headers);
  }

  if (action === 'list_scans') {
    const { data: scans, error } = await db
      .from('scan_sessions')
      .select('id,session_code,player_name,status,progress,current_stage,current_log,target,objects_count,verdict,risk_score,findings_count,client_platform,created_at,completed_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return json({ error: error.message }, 500, headers);
    return json({ scans: scans || [] }, 200, headers);
  }

  if (action === 'get_scan') {
    const scanId = String(body.id || new URL(req.url).searchParams.get('id') || '').trim();
    const code = String(body.code || new URL(req.url).searchParams.get('code') || '').trim().toUpperCase();

    let query = db.from('scan_sessions').select('*');
    if (scanId) query = query.eq('id', scanId);
    else if (code) query = query.eq('session_code', code);
    else return json({ error: 'id or code required' }, 400, headers);

    const { data: scan, error } = await query.maybeSingle();
    if (error || !scan) return json({ error: 'Scan not found' }, 404, headers);
    return json({ scan }, 200, headers);
  }

  if (action === 'delete_scan') {
    const scanId = String(body.id || '').trim();
    if (!scanId) return json({ error: 'id required' }, 400, headers);
    await db.from('scan_sessions').delete().eq('id', scanId);
    await audit(db, user.id, 'scan.deleted', req, { scanId });
    return json({ success: true }, 200, headers);
  }

  return json({ error: 'Unknown action' }, 400, headers);
});

async function signLicense(payload: Record<string, unknown>) {
  const b64 = Deno.env.get('LICENSE_PRIVATE_KEY_PKCS8_B64');
  if (!b64) throw new Error('Signing key missing');
  const der = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey('pkcs8', der, { name: 'Ed25519' }, false, ['sign']);
  const canonical = JSON.stringify({ version: 1, product: String(payload.product), licenseId: String(payload.licenseId), customer: String(payload.customer), issuedAt: String(payload.issuedAt), expiresAt: String(payload.expiresAt), machineId: String(payload.machineId).toUpperCase(), features: ['scan'] });
  const signature = new Uint8Array(await crypto.subtle.sign('Ed25519', privateKey, encoder.encode(canonical)));
  return `ATLAS1.${b64url(encoder.encode(JSON.stringify(payload)))}.${b64url(signature)}`;
}

async function audit(db: ReturnType<typeof admin>, userId: string, action: string, req: Request, metadata: unknown) {
  const ip = req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For') || '';
  await db.from('audit_log').insert({ user_id: userId, action, ip_hash: ip ? await sha256(ip) : null, metadata });
}

function b64url(bytes: Uint8Array) {
  let raw = '';
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
