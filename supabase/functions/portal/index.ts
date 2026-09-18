import { admin, cors, json, randomKey, sha256 } from '../_shared/common.ts';

const PIN_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const ACTIVE_STATUSES = ['pending', 'scanning'];

function clean(value: unknown, max: number) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

function createPin() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, byte => PIN_ALPHABET[byte % PIN_ALPHABET.length]).join('');
}

Deno.serve(async req => {
  const origin = req.headers.get('Origin') || '';
  const headers = cors(origin);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!['GET', 'POST'].includes(req.method)) return json({ error: 'Method not allowed' }, 405, headers);

  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const db = admin();
  const { data: authData, error: authError } = await db.auth.getUser(token);
  if (authError || !authData.user) return json({ error: 'Oturum geçersiz. Yeniden giriş yapın.' }, 401, headers);
  const user = authData.user;

  const { data: profile } = await db.from('profiles').select('username,role,disabled_at').eq('id', user.id).maybeSingle();
  const { data: entitlement } = await db.from('entitlements').select('status,expires_at,max_devices').eq('user_id', user.id).maybeSingle();
  if (!profile || profile.disabled_at || !entitlement) return json({ error: 'Hesap kullanılamıyor.' }, 403, headers);

  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
  const url = new URL(req.url);
  const action = clean(url.searchParams.get('action') || body.action || 'me', 32);

  if (action === 'me') {
    return json({
      user: { email: user.email, username: profile.username, role: profile.role },
      entitlement: { status: entitlement.status, expires_at: entitlement.expires_at }
    }, 200, headers);
  }

  if (entitlement.status !== 'active' || new Date(entitlement.expires_at).getTime() <= Date.now()) {
    return json({ error: 'Panel kullanım hakkı aktif değil.' }, 403, headers);
  }

  if (action === 'create_invite') {
    if (profile.role !== 'admin') return json({ error: 'Bu işlem yalnız yöneticilere açıktır.' }, 403, headers);
    const label = clean(body.label || 'Yetkili Daveti', 80);
    const days = Math.min(30, Math.max(1, Number(body.days) || 7));
    const inviteKey = `ATLAS-${randomKey(16)}`;
    const { error } = await db.from('invites').insert({
      code_hash: await sha256(inviteKey), label,
      expires_at: new Date(Date.now() + days * 86400000).toISOString(), max_uses: 1
    });
    if (error) return json({ error: 'Davet oluşturulamadı.' }, 500, headers);
    await audit(db, user.id, 'invite.created', req, { label, days });
    return json({ inviteKey, label, days }, 201, headers);
  }

  if (action === 'create_scan') {
    const playerName = clean(body.playerName || 'Şüpheli Oyuncu', 32);
    const game = clean(body.game || 'Minecraft Java (PC)', 40);
    const allowedGames = ['Minecraft Java (PC)', 'Minecraft Java (Linux)', 'Minecraft Bedrock (PC)'];
    if (!allowedGames.includes(game)) return json({ error: 'Desteklenmeyen oyun türü.' }, 400, headers);

    let inserted = null;
    for (let attempt = 0; attempt < 8 && !inserted; attempt++) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 20 * 60_000).toISOString();
      const { data, error } = await db.from('scan_sessions').insert({
        session_code: createPin(), staff_id: user.id, player_name: playerName, game,
        status: 'pending', progress: 0, current_stage: 'Oyuncu bağlantısı bekleniyor',
        expires_at: expiresAt, updated_at: now.toISOString()
      }).select('id,session_code,player_name,game,status,progress,created_at,expires_at').single();
      if (!error) inserted = data;
      else if (error.code !== '23505') return json({ error: 'PIN oluşturulamadı.' }, 500, headers);
    }
    if (!inserted) return json({ error: 'Benzersiz PIN üretilemedi. Tekrar deneyin.' }, 503, headers);
    await audit(db, user.id, 'scan.created', req, { scanId: inserted.id, game });
    return json({ session: inserted }, 201, headers);
  }

  if (action === 'list_scans') {
    const now = new Date().toISOString();
    await db.from('scan_sessions').update({ status: 'expired', updated_at: now })
      .eq('staff_id', user.id).eq('status', 'pending').lt('expires_at', now);
    const { data, error } = await db.from('scan_sessions')
      .select('id,session_code,player_name,game,status,progress,current_stage,current_log,target,objects_count,verdict,risk_score,findings_count,client_platform,created_at,expires_at,claimed_at,completed_at')
      .eq('staff_id', user.id).order('created_at', { ascending: false }).limit(100);
    if (error) return json({ error: 'Oturumlar alınamadı.' }, 500, headers);
    return json({ scans: data || [] }, 200, headers);
  }

  if (action === 'get_scan') {
    const id = clean(body.id || url.searchParams.get('id'), 64);
    const code = clean(body.code || url.searchParams.get('code'), 8).toUpperCase();
    let query = db.from('scan_sessions').select(
      'id,session_code,player_name,game,status,progress,current_stage,current_log,target,objects_count,verdict,risk_score,findings_count,findings,report_data,system_info,client_platform,created_at,updated_at,expires_at,claimed_at,last_heartbeat_at,completed_at'
    ).eq('staff_id', user.id);
    if (/^[0-9a-f-]{36}$/i.test(id)) query = query.eq('id', id);
    else if (/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(code)) query = query.eq('session_code', code);
    else return json({ error: 'Geçerli bir oturum seçin.' }, 400, headers);
    const { data } = await query.maybeSingle();
    if (!data) return json({ error: 'Kontrol oturumu bulunamadı.' }, 404, headers);
    return json({ scan: data }, 200, headers);
  }

  if (action === 'cancel_scan') {
    const id = clean(body.id, 64);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'Geçersiz oturum.' }, 400, headers);
    const { data } = await db.from('scan_sessions').update({
      status: 'cancelled', client_token_hash: null, updated_at: new Date().toISOString()
    }).eq('id', id).eq('staff_id', user.id).in('status', ACTIVE_STATUSES).select('id').maybeSingle();
    if (!data) return json({ error: 'Aktif oturum bulunamadı.' }, 404, headers);
    await audit(db, user.id, 'scan.cancelled', req, { scanId: id });
    return json({ ok: true }, 200, headers);
  }

  return json({ error: 'Unknown action' }, 400, headers);
});

async function audit(db: ReturnType<typeof admin>, userId: string, action: string, req: Request, metadata: unknown) {
  const ip = req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For') || '';
  const pepper = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  await db.from('audit_log').insert({ user_id: userId, action, ip_hash: ip ? await sha256(`${pepper}:${ip}`) : null, metadata });
}
