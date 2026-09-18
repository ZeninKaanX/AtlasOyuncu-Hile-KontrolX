import { admin, cors, json, randomKey, sha256 } from '../_shared/common.ts';

const PIN_RE = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/;
const HEX_64_RE = /^[a-fA-F0-9]{64}$/;
const MAX_FINDINGS = 500;
type Db = ReturnType<typeof admin>;

function text(value: unknown, max: number) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

function ipAddress(req: Request) {
  return text(req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For')?.split(',')[0] || 'unknown', 80);
}

async function rateLimited(db: Db, req: Request, action: 'download' | 'claim') {
  const ipHash = await sha256(`${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''}:${ipAddress(req)}`);
  const since = new Date(Date.now() - 10 * 60_000).toISOString();
  const { count } = await db.from('pin_request_log').select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash).eq('action', action).gte('created_at', since);
  if ((count || 0) >= 20) return true;
  await db.from('pin_request_log').insert({ ip_hash: ipHash, action });
  return false;
}

function safeFinding(raw: Record<string, unknown>) {
  const candidate = text(raw.severity || raw.risk, 16).toUpperCase();
  return {
    title: text(raw.title || raw.name || 'Şüpheli Nesne', 120),
    category: text(raw.category || 'Genel', 60),
    severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(candidate) ? candidate : 'MEDIUM',
    path: text(raw.path || raw.file, 500),
    details: text(raw.details || raw.evidence || raw.desc, 1000),
    timestamp: text(raw.timestamp || new Date().toISOString(), 40)
  };
}

async function clientSession(db: Db, body: Record<string, unknown>) {
  const sessionId = text(body.sessionId, 64);
  const clientToken = text(body.clientToken, 128);
  if (!/^[0-9a-f-]{36}$/i.test(sessionId) || !/^[A-F0-9]{64}$/.test(clientToken)) return null;
  const tokenHash = await sha256(clientToken);
  const { data } = await db.from('scan_sessions')
    .select('id,session_code,status,findings,findings_count')
    .eq('id', sessionId).eq('client_token_hash', tokenHash).eq('status', 'scanning').maybeSingle();
  return data || null;
}

Deno.serve(async req => {
  const headers = cors(req.headers.get('Origin') || '');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, headers);
  if (Number(req.headers.get('content-length') || 0) > 1_000_000) return json({ error: 'Request too large' }, 413, headers);

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const action = text(body.action, 24).toLowerCase();
  const db = admin();

  if (action === 'download') {
    if (await rateLimited(db, req, 'download')) return json({ error: 'Çok fazla deneme. 10 dakika sonra tekrar deneyin.' }, 429, headers);
    const code = text(body.pin, 8).toUpperCase();
    const platform = body.platform === 'linux' ? 'linux' : 'windows';
    if (!PIN_RE.test(code)) return json({ error: 'PIN sekiz karakter olmalıdır.' }, 400, headers);
    const { data: session } = await db.from('scan_sessions').select('id,status,expires_at,download_count')
      .eq('session_code', code).in('status', ['pending', 'scanning']).maybeSingle();
    if (!session || new Date(session.expires_at).getTime() <= Date.now()) {
      if (session) await db.from('scan_sessions').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('id', session.id).eq('status', 'pending');
      return json({ error: 'PIN geçersiz veya süresi dolmuş.' }, 404, headers);
    }
    const filename = platform === 'linux' ? 'AtlasAC-Linux.zip' : 'AtlasAC-Windows.zip';
    const { data, error } = await db.storage.from('atlas-downloads').createSignedUrl(filename, 90, { download: filename });
    if (error || !data?.signedUrl) return json({ error: 'İndirme paketi şu anda hazır değil. Yetkiliye bildirin.' }, 503, headers);
    await db.from('scan_sessions').update({ download_count: (session.download_count || 0) + 1, updated_at: new Date().toISOString() }).eq('id', session.id);
    return json({ url: data.signedUrl, filename, expiresIn: 90 }, 200, headers);
  }

  if (action === 'claim') {
    if (await rateLimited(db, req, 'claim')) return json({ error: 'Çok fazla deneme. 10 dakika sonra tekrar deneyin.' }, 429, headers);
    const code = text(body.pin, 8).toUpperCase();
    const clientId = text(body.clientId, 64).toLowerCase();
    if (!PIN_RE.test(code) || !HEX_64_RE.test(clientId)) return json({ error: 'PIN veya istemci kimliği geçersiz.' }, 400, headers);
    const { data: session } = await db.from('scan_sessions')
      .select('id,session_code,player_name,status,expires_at,claimed_at,client_id_hash')
      .eq('session_code', code).in('status', ['pending', 'scanning']).maybeSingle();
    if (!session || new Date(session.expires_at).getTime() <= Date.now()) {
      if (session) await db.from('scan_sessions').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('id', session.id).eq('status', 'pending');
      return json({ error: 'PIN geçersiz, kullanılmış veya süresi dolmuş.' }, 404, headers);
    }
    const clientHash = await sha256(clientId);
    if (session.client_id_hash && session.client_id_hash !== clientHash) return json({ error: 'Bu PIN başka bir cihazda kullanılıyor.' }, 409, headers);
    const clientToken = randomKey(32);
    const now = new Date().toISOString();
    let claimQuery = db.from('scan_sessions').update({
      status: 'scanning', client_id_hash: clientHash, client_token_hash: await sha256(clientToken),
      claimed_at: session.claimed_at || now, last_heartbeat_at: now,
      current_stage: 'Tarama başlatılıyor', updated_at: now
    }).eq('id', session.id).in('status', ['pending', 'scanning']);
    // A previously claimed PIN may only be resumed by the same installation.
    // For a fresh PIN, the IS NULL predicate makes the first claim atomic so
    // two simultaneous devices cannot both receive a valid token.
    claimQuery = session.client_id_hash
      ? claimQuery.eq('client_id_hash', clientHash)
      : claimQuery.is('client_id_hash', null);
    const { data: claimed } = await claimQuery.select('id,session_code,player_name').maybeSingle();
    if (!claimed) return json({ error: 'PIN aynı anda başka bir cihaz tarafından kullanıldı.' }, 409, headers);
    return json({ sessionId: claimed.id, sessionCode: claimed.session_code, playerName: claimed.player_name, clientToken }, 200, headers);
  }

  const session = await clientSession(db, body);
  if (!session) return json({ error: 'İstemci oturumu geçersiz.' }, 401, headers);
  const tokenHash = await sha256(text(body.clientToken, 128));

  if (action === 'progress') {
    const percent = Math.min(99, Math.max(0, Number.parseInt(String(body.percent || 0), 10) || 0));
    const update: Record<string, unknown> = {
      progress: percent, current_stage: text(body.stage, 100), current_log: text(body.log, 300),
      target: text(body.target, 300), objects_count: Math.max(0, Math.min(Number(body.objectsCount) || 0, 2_000_000_000)),
      last_heartbeat_at: new Date().toISOString(), updated_at: new Date().toISOString()
    };
    if (body.finding && typeof body.finding === 'object') {
      const findings = Array.isArray(session.findings) ? session.findings.slice(0, MAX_FINDINGS) : [];
      const finding = safeFinding(body.finding as Record<string, unknown>);
      if (!findings.some((item: Record<string, unknown>) => item.title === finding.title && item.path === finding.path)) findings.push(finding);
      update.findings = findings.slice(0, MAX_FINDINGS);
      update.findings_count = Math.min(findings.length, MAX_FINDINGS);
    }
    await db.from('scan_sessions').update(update).eq('id', session.id).eq('client_token_hash', tokenHash);
    return json({ ok: true }, 200, headers);
  }

  if (action === 'complete') {
    const findings = (Array.isArray(body.findings) ? body.findings : []).slice(0, MAX_FINDINGS)
      .map(item => safeFinding((item || {}) as Record<string, unknown>));
    const critical = findings.filter(item => item.severity === 'CRITICAL').length;
    const high = findings.filter(item => item.severity === 'HIGH').length;
    const riskScore = critical ? Math.min(100, 85 + critical * 5) : high ? Math.min(90, 70 + high * 5) : findings.length ? Math.min(65, 40 + findings.length * 5) : 0;
    const verdict = critical || high ? 'banned' : findings.length ? 'suspicious' : 'clean';
    const report = body.reportData && typeof body.reportData === 'object' ? body.reportData as Record<string, unknown> : {};
    const now = new Date().toISOString();
    await db.from('scan_sessions').update({
      status: 'completed', progress: 100, verdict, risk_score: riskScore, findings, findings_count: findings.length,
      report_data: {
        timestamp: text(report.timestamp || now, 40), durationSeconds: Math.max(0, Math.min(Number(report.durationSeconds) || 0, 86400)),
        scannedObjects: Math.max(0, Math.min(Number(report.scannedObjects) || 0, 2_000_000_000)),
        scannedJars: Math.max(0, Math.min(Number(report.scannedJars) || 0, 10_000_000)),
        criticalCount: critical, highCount: high, totalFindings: findings.length
      },
      system_info: body.systemInfo && typeof body.systemInfo === 'object' ? body.systemInfo : {},
      current_stage: 'Tarama tamamlandı', current_log: verdict === 'clean' ? 'Doğrulanmış ihlal bulunamadı.' : `${findings.length} bulgu kaydedildi.`,
      completed_at: now, last_heartbeat_at: now, updated_at: now, client_token_hash: null
    }).eq('id', session.id).eq('client_token_hash', tokenHash);
    return json({ ok: true, sessionCode: session.session_code, verdict, findingsCount: findings.length }, 200, headers);
  }

  if (action === 'fail') {
    const now = new Date().toISOString();
    await db.from('scan_sessions').update({
      status: 'failed', current_stage: 'Tarama başarısız', current_log: text(body.message, 300),
      updated_at: now, last_heartbeat_at: now, client_token_hash: null
    }).eq('id', session.id).eq('client_token_hash', tokenHash);
    return json({ ok: true }, 200, headers);
  }

  return json({ error: 'Unknown action' }, 400, headers);
});
