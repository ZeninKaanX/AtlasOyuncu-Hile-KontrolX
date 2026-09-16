import { admin, cors, json } from '../_shared/common.ts';

Deno.serve(async req => {
  const origin = req.headers.get('Origin') || '';
  const headers = cors(origin);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  const url = new URL(req.url);
  const db = admin();

  // Public GET: Query scan summary by code (e.g. ?code=ATL-7842)
  if (req.method === 'GET') {
    const code = (url.searchParams.get('code') || '').trim().toUpperCase();
    if (!code) return json({ error: 'Session code required' }, 400, headers);

    const { data: session, error } = await db
      .from('scan_sessions')
      .select('id,session_code,player_name,status,progress,current_stage,current_log,target,objects_count,verdict,risk_score,findings_count,findings,report_data,system_info,client_platform,created_at,completed_at')
      .eq('session_code', code)
      .maybeSingle();

    if (error || !session) return json({ error: 'Scan session not found' }, 404, headers);
    return json({ session }, 200, headers);
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, headers);

  const body = await req.json().catch(() => ({}));
  const action = url.searchParams.get('action') || body.action || '';
  const ip = req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For') || '';

  // 1. INIT SCAN SESSION
  if (action === 'init') {
    let sessionCode = String(body.sessionCode || '').trim().toUpperCase();
    const playerName = String(body.playerName || 'Şüpheli Oyuncu').trim().slice(0, 32);
    const platform = String(body.platform || 'windows').toLowerCase();
    const systemInfo = body.systemInfo || {};

    if (sessionCode) {
      // Check if session pre-created by staff
      const { data: existing } = await db
        .from('scan_sessions')
        .select('id,session_code,player_name')
        .eq('session_code', sessionCode)
        .maybeSingle();

      if (existing) {
        await db.from('scan_sessions').update({
          status: 'scanning',
          progress: 0,
          current_stage: 'Tarama Başlatılıyor...',
          client_ip: ip,
          client_platform: platform,
          system_info: systemInfo,
          updated_at: new Date().toISOString()
        }).eq('id', existing.id);

        return json({ success: true, sessionCode: existing.session_code, id: existing.id }, 200, headers);
      } else {
        return json({ error: 'Geçersiz veya süresi dolmuş Tarama PIN kodu.' }, 404, headers);
      }
    }

    // If code not provided, auto-generate unique 8-character Ocean AC style PIN
    const pinChars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const rnd = new Uint8Array(8);
    crypto.getRandomValues(rnd);
    for (let i = 0; i < 8; i++) sessionCode += pinChars[rnd[i] % pinChars.length];

    const { data: inserted, error: insErr } = await db.from('scan_sessions').insert({
      session_code: sessionCode,
      player_name: playerName,
      status: 'scanning',
      progress: 0,
      current_stage: 'Tarama Başlatılıyor...',
      client_ip: ip,
      client_platform: platform,
      system_info: systemInfo,
      updated_at: new Date().toISOString()
    }, { onConflict: 'session_code' }).select('id,session_code').single();

    if (insErr) return json({ error: insErr.message }, 500, headers);
    return json({ success: true, sessionCode: inserted.session_code, id: inserted.id }, 201, headers);
  }

  // 2. PROGRESS STREAMING
  if (action === 'progress') {
    const sessionCode = String(body.sessionCode || '').trim().toUpperCase();
    if (!sessionCode) return json({ error: 'sessionCode required' }, 400, headers);

    const percent = Math.min(100, Math.max(0, parseInt(body.percent, 10) || 0));
    const stage = String(body.stage || '').slice(0, 100);
    const log = String(body.log || '').slice(0, 300);
    const target = String(body.target || '').slice(0, 200);
    const objectsCount = parseInt(body.objectsCount, 10) || 0;
    const newFinding = body.finding || null;

    const { data: current } = await db
      .from('scan_sessions')
      .select('id,findings,findings_count')
      .eq('session_code', sessionCode)
      .maybeSingle();

    if (!current) return json({ error: 'Session not found' }, 404, headers);

    const updatePayload: Record<string, unknown> = {
      progress: percent,
      current_stage: stage,
      current_log: log,
      target: target,
      objects_count: objectsCount,
      updated_at: new Date().toISOString()
    };

    if (newFinding) {
      const existingFindings = Array.isArray(current.findings) ? current.findings : [];
      // avoid duplicates
      const dup = existingFindings.some((f: any) => f.title === newFinding.title && f.path === newFinding.path);
      if (!dup) {
        existingFindings.push(newFinding);
        updatePayload.findings = existingFindings;
        updatePayload.findings_count = existingFindings.length;
      }
    }

    await db.from('scan_sessions').update(updatePayload).eq('id', current.id);
    return json({ success: true }, 200, headers);
  }

  // 3. SCAN COMPLETED
  if (action === 'complete') {
    const sessionCode = String(body.sessionCode || '').trim().toUpperCase();
    if (!sessionCode) return json({ error: 'sessionCode required' }, 400, headers);

    const findings = Array.isArray(body.findings) ? body.findings : [];
    const reportData = body.reportData || {};
    const riskScore = parseInt(body.riskScore, 10) || (findings.length > 0 ? 95 : 0);
    let verdict = String(body.verdict || '').toLowerCase();
    if (!['clean', 'suspicious', 'banned'].includes(verdict)) {
      verdict = findings.length === 0 ? 'clean' : (riskScore >= 70 ? 'banned' : 'suspicious');
    }
    const systemInfo = body.systemInfo || {};

    const { data: session } = await db
      .from('scan_sessions')
      .select('id')
      .eq('session_code', sessionCode)
      .maybeSingle();

    if (!session) return json({ error: 'Session not found' }, 404, headers);

    const now = new Date().toISOString();
    await db.from('scan_sessions').update({
      status: 'completed',
      progress: 100,
      verdict,
      risk_score: riskScore,
      findings,
      findings_count: findings.length,
      report_data: reportData,
      system_info: systemInfo,
      current_stage: 'Tarama Tamamlandı',
      current_log: verdict === 'clean' ? 'Bilgisayar temiz, ihlal bulunamadı.' : `${findings.length} adet ihlal tespit edildi!`,
      completed_at: now,
      updated_at: now
    }).eq('id', session.id);

    return json({ success: true, sessionCode, verdict, findingsCount: findings.length }, 200, headers);
  }

  return json({ error: 'Unknown action' }, 400, headers);
});
