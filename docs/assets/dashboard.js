import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, configured } from './config.js';

if (!configured) location.replace('auth.html');
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const { data: sessionData } = await supabase.auth.getSession();
if (!sessionData.session) location.replace('auth.html');
const byId = id => document.getElementById(id);
let activePollingTimer = null;
let currentInspectedScan = null;
let currentFindingsFilter = 'all';
let cachedScans = [];
let scansLoading = false;
let createdScanGame = 'Minecraft Java (PC)';

function openLiveScan(code) {
  const cleanCode = String(code || '').trim().toUpperCase();
  if (!cleanCode) return;
  const url = new URL(location.href);
  url.searchParams.set('scan', cleanCode);
  history.pushState({ scan: cleanCode }, '', url);
  inspectScan(cleanCode);
}

// Universal Portal API Caller
async function portal(action, extra = {}) {
  const { data: freshSessionData } = await supabase.auth.getSession();
  const accessToken = freshSessionData.session?.access_token;
  if (!accessToken) {
    location.replace('auth.html');
    throw new Error('Oturumunuz sona erdi.');
  }
  const isGet = action === 'me' || action === 'list_scans';
  const url = new URL(`${SUPABASE_URL}/functions/v1/portal`);
  url.searchParams.set('action', action);
  if (isGet && extra.id) url.searchParams.set('id', extra.id);
  if (isGet && extra.code) url.searchParams.set('code', extra.code);

  const response = await fetch(url.toString(), {
    method: isGet ? 'GET' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${accessToken}`
    },
    body: isGet ? undefined : JSON.stringify({ action, ...extra })
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'İşlem başarısız.');
  return result;
}

function showAlert(message) {
  const el = byId('dashboardStatus');
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 6000);
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

async function loadAccount() {
  try {
    const data = await portal('me');
    byId('username').textContent = data.user.username;
    byId('userEmail').textContent = data.user.email;
    byId('btnCreateStaffInvite').classList.toggle('hidden', data.user.role !== 'admin');
  } catch (error) {
    showAlert(error.message);
  }
}

// --------------------------------------------------------------------------
// 2. REMOTE SCREEN CHECK (KONTROL) MANAGEMENT
// --------------------------------------------------------------------------
async function loadScans() {
  if (scansLoading) return;
  scansLoading = true;
  try {
    const res = await portal('list_scans');
    const allScans = res.scans || [];
    cachedScans = allScans;

    const total = allScans.length;
    const pending = allScans.filter(s => s.status === 'pending' || s.status === 'scanning').length;
    const finished = allScans.filter(s => s.status === 'completed').length;
    const expired = allScans.filter(s => ['expired', 'cancelled', 'failed'].includes(s.status)).length;

    if (byId('activeScansCount')) byId('activeScansCount').textContent = `${pending} canlı oturum`;
    if (byId('statPendingPins')) byId('statPendingPins').textContent = pending;
    if (byId('statFinishedPins')) byId('statFinishedPins').textContent = finished;
    if (byId('statExpiredPins')) byId('statExpiredPins').textContent = expired;
    if (byId('statDailyPins')) byId('statDailyPins').textContent = total;
    if (byId('myPinsCountBadge')) byId('myPinsCountBadge').textContent = total;
    renderScansTable(allScans);
  } catch (err) {
    showAlert(err.message);
    renderScansTable([]);
  } finally {
    scansLoading = false;
  }
}

function renderScansTable(scans) {
  const tbody = byId('scansTableBody');
  if (!scans.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:35px;color:#64748b;">Henüz kontrol oturumu yok. “PIN oluştur” düğmesiyle ilk kontrolü başlatın.</td></tr>`;
    return;
  }

  tbody.innerHTML = scans.map(s => {
    let statusPill = '';
    if (s.status === 'pending') {
      statusPill = `<span class="status-pill status-pending"><span class="live-radar-dot"></span> Bekleniyor</span>`;
    } else if (s.status === 'scanning') {
      statusPill = `<span class="status-pill status-scanning"><span class="live-radar-dot"></span> Taranıyor (%${s.progress || 0})</span>`;
    } else if (s.status === 'completed') {
      statusPill = `<span class="status-pill status-finished">Tamamlandı</span>`;
    } else {
      statusPill = `<span class="status-pill">${escapeHtml(s.status === 'expired' ? 'Süresi doldu' : s.status === 'cancelled' ? 'İptal' : 'Başarısız')}</span>`;
    }

    let resultPill = '';
    if (s.verdict === 'banned' || (s.findings_count > 0)) {
      resultPill = `<span class="result-pill result-cheat">BULGU VAR</span>`;
    } else if (s.status === 'completed' || s.status === 'finished' || s.verdict === 'clean') {
      resultPill = `<span class="result-pill result-clean">BULGU YOK</span>`;
    } else {
      resultPill = `<span style="font-size:11px;color:#64748b;">Henüz Yok</span>`;
    }

    const gameName = s.game || 'Minecraft Java (PC)';
    const isBedrock = gameName.includes('Bedrock');
    const isLinux = gameName.includes('Linux');
    const gameBadgeColor = isBedrock ? '#7c3aed' : (isLinux ? '#e87924' : '#10b981');
    const gameLetter = isBedrock ? 'B' : (isLinux ? 'L' : 'J');

    const playerName = s.player_name || 'Oyuncu';
    const playerInitial = escapeHtml(playerName.slice(0, 1).toUpperCase());

    return `
      <tr>
        <td>
          <span class="scan-code-pill" style="cursor:pointer;" title="Kopyalamak için tıklayın" data-copy="${escapeHtml(s.session_code)}">
            ${escapeHtml(s.session_code)}
          </span>
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:28px;height:28px;border-radius:6px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid var(--border);">
              <strong aria-hidden="true" style="color:var(--brand-light);font-size:11px;">${playerInitial}</strong>
            </div>
            <div>
              <strong style="color:#f8fafc;font-size:13px;display:block;">${escapeHtml(playerName)}</strong>
              <small style="color:#64748b;font-size:11px;">${new Date(s.created_at || Date.now()).toLocaleDateString('tr-TR')}</small>
            </div>
          </div>
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:18px;height:18px;border-radius:4px;background:${gameBadgeColor};display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:700;">${gameLetter}</div>
            <span style="font-size:12px;color:#cbd5e1;">${escapeHtml(gameName)}</span>
          </div>
        </td>
        <td>${statusPill}</td>
        <td>${resultPill}</td>
        <td>
          <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#94a3b8;background:rgba(255,255,255,0.04);padding:2px 8px;border-radius:4px;border:1px solid var(--border);">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            Private
          </span>
        </td>
        <td style="text-align:right;">
          <button class="button button-sm btn-inspect" data-code="${escapeHtml(s.session_code)}">
            İncele
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Attach click listeners for codes and buttons
  tbody.querySelectorAll('.scan-code-pill').forEach(el => {
    el.addEventListener('click', async () => {
      const code = el.getAttribute('data-copy');
      await navigator.clipboard.writeText(code);
      const orig = el.textContent;
      el.textContent = 'KOPYALANDI';
      setTimeout(() => { el.textContent = orig; }, 1200);
    });
  });

  tbody.querySelectorAll('.btn-inspect').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.getAttribute('data-code');
      openLiveScan(code);
    });
  });
}

// --------------------------------------------------------------------------
// 3. INSPECTOR MODAL & LIVE TELEMETRY
// --------------------------------------------------------------------------
async function inspectScan(codeOrId) {
  if (activePollingTimer) {
    clearInterval(activePollingTimer);
    activePollingTimer = null;
  }

  const modal = byId('modalInspectScan');
  modal.classList.remove('hidden');

  async function fetchDetails() {
    let scan = null;
    try {
      const res = await portal('get_scan', { code: codeOrId });
      scan = res.scan;
    } catch (err) {
      console.warn('Portal get_scan fallback to local storage:', err.message);
    }

    if (!scan) {
      showAlert('Belirtilen PIN ile kontrol oturumu bulunamadı.');
      return;
    }

    currentInspectedScan = scan;
    renderInspectionView(scan);

    // Continue polling if scan is ongoing
    if (scan.status === 'scanning' || scan.status === 'pending') {
      if (!activePollingTimer) {
        activePollingTimer = setInterval(fetchDetails, 1500);
      }
    } else {
      if (activePollingTimer) {
        clearInterval(activePollingTimer);
        activePollingTimer = null;
      }
    }
  }

  await fetchDetails();
}

function renderInspectionView(scan) {
  byId('inspectPlayerTitle').textContent = scan.player_name;
  byId('inspectSessionCode').textContent = scan.session_code;
  
  const sys = scan.system_info || {};
  const osStr = sys.osName || (scan.client_platform === 'linux' ? 'Linux 64-bit' : 'Windows 64-bit');
  const cpuStr = sys.cpu ? ` • ${sys.cpu}` : '';
  const ramStr = sys.ram ? ` • ${sys.ram} RAM` : '';
  byId('inspectSystemMeta').textContent = `${osStr}${cpuStr}${ramStr}`;
  
  const createdDate = new Date(scan.created_at).toLocaleString('tr-TR');
  byId('inspectTimeMeta').textContent = createdDate;

  // HUD Progress Visibility
  const hudBox = byId('inspectHudBox');
  if (scan.status === 'scanning') {
    hudBox.classList.remove('hidden');
    const pct = scan.progress || 0;
    byId('inspectPercent').textContent = pct;
    byId('inspectProgressBarFill').style.width = `${pct}%`;
    byId('inspectStageLabel').textContent = scan.current_stage || 'Adli Taramada...';
    byId('inspectLogSnippet').textContent = scan.current_log || 'İnceleme motorları yürütülüyor...';
    byId('inspectObjectsLabel').textContent = `${(scan.objects_count || 0).toLocaleString('tr-TR')} nesne`;
  } else {
    hudBox.classList.add('hidden');
  }

  // Verdict Banner
  const verdictBanner = byId('inspectVerdictBanner');
  const verdictIcon = byId('inspectVerdictIcon');
  const verdictTitle = byId('inspectVerdictTitle');
  const verdictDesc = byId('inspectVerdictDesc');

  verdictBanner.className = 'verdict-banner';
  if (scan.status === 'pending') {
    verdictBanner.classList.add('verdict-banner-suspicious');
    verdictIcon.textContent = '';
    verdictTitle.textContent = 'OYUNCU BAĞLANTISI BEKLENİYOR';
    verdictDesc.textContent = `Oyuncunun Atlas AC uygulamasını açıp ${scan.session_code} kodunu girmesi bekleniyor...`;
  } else if (scan.verdict === 'banned' || (scan.findings_count > 0)) {
    verdictBanner.classList.add('verdict-banner-banned');
    verdictIcon.textContent = '';
    verdictTitle.textContent = 'TEKNİK BULGU VAR — YETKİLİ İNCELEMESİ GEREKİYOR';
    verdictDesc.textContent = `${scan.findings_count} bulgu raporlandı. Yaptırım uygulamadan önce kanıt ayrıntılarını ve bağlamı inceleyin.`;
  } else if (scan.status === 'completed' && scan.verdict === 'clean') {
    verdictBanner.classList.add('verdict-banner-clean');
    verdictIcon.textContent = '';
    verdictTitle.textContent = 'RAPORLANAN BULGU YOK';
    verdictDesc.textContent = 'Bu tarama kapsamında etkin kurallarla eşleşen bir bulgu raporlanmadı. Nihai karar yetkili incelemesine aittir.';
  } else {
    verdictBanner.classList.add('verdict-banner-suspicious');
    verdictIcon.textContent = '';
    verdictTitle.textContent = 'TARAMA SÜRÜYOR...';
    verdictDesc.textContent = 'Adli bilişim motorları oyuncunun belleğini ve dosya kütüklerini canlı inceliyor.';
  }

  // Stats
  const riskScore = scan.risk_score || 0;
  const riskEl = byId('statRiskScore');
  riskEl.textContent = `%${riskScore}`;
  riskEl.style.color = riskScore >= 70 ? '#ef4444' : (riskScore > 0 ? '#eab308' : '#22c55e');

  const rep = scan.report_data || {};
  byId('statTotalFindings').textContent = scan.findings_count || 0;
  byId('statScannedObjects').textContent = (scan.objects_count || rep.scannedObjects || 0).toLocaleString('tr-TR');
  byId('statDuration').textContent = `${rep.durationSeconds || '0.0'}s`;

  // Filter Counts & Findings List
  const findings = Array.isArray(scan.findings) ? scan.findings : [];
  updateFindingsTabs(findings);
  renderFindingsList(findings, currentFindingsFilter);
}

function updateFindingsTabs(findings) {
  let crit = 0, usn = 0, mem = 0, pf = 0, net = 0;
  for (const f of findings) {
    const sev = String(f.severity || '').toUpperCase();
    const cat = String(f.category || '').toLowerCase();
    const title = String(f.title || '').toLowerCase();

    if (sev === 'CRITICAL' || sev === 'HIGH') crit++;
    if (cat.includes('usn') || title.includes('usn') || title.includes('silin')) usn++;
    if (cat.includes('memory') || cat.includes('bellek') || cat.includes('jvm')) mem++;
    if (cat.includes('prefetch') || cat.includes('bam')) pf++;
    if (cat.includes('dns') || cat.includes('net') || cat.includes('ağ')) net++;
  }

  byId('countCatAll').textContent = findings.length;
  byId('countCatCrit').textContent = crit;
  byId('countCatUsn').textContent = usn;
  byId('countCatMem').textContent = mem;
  byId('countCatPf').textContent = pf;
  byId('countCatNet').textContent = net;
}

function renderFindingsList(findings, filter) {
  const container = byId('findingsContainer');
  let list = findings;

  if (filter === 'critical') {
    list = findings.filter(f => ['CRITICAL', 'HIGH'].includes(String(f.severity).toUpperCase()));
  } else if (filter === 'usn') {
    list = findings.filter(f => (f.category + f.title).toLowerCase().includes('usn') || (f.category + f.title).toLowerCase().includes('silin'));
  } else if (filter === 'memory') {
    list = findings.filter(f => (f.category + f.title).toLowerCase().includes('memory') || (f.category + f.title).toLowerCase().includes('jvm') || (f.category + f.title).toLowerCase().includes('bellek'));
  } else if (filter === 'prefetch') {
    list = findings.filter(f => (f.category + f.title).toLowerCase().includes('prefetch') || (f.category + f.title).toLowerCase().includes('bam'));
  } else if (filter === 'network') {
    list = findings.filter(f => (f.category + f.title).toLowerCase().includes('dns') || (f.category + f.title).toLowerCase().includes('net') || (f.category + f.title).toLowerCase().includes('ağ'));
  }

  if (!list.length) {
    container.innerHTML = `<p style="color:#64748b;font-size:12px;padding:24px 0;text-align:center;">Bu kategoride tespit edilen bulgu yok.</p>`;
    return;
  }

  container.innerHTML = list.map(f => {
    const sev = String(f.severity || 'MEDIUM').toUpperCase();
    const badgeClass = sev === 'CRITICAL' ? 'badge-critical' : (sev === 'HIGH' ? 'badge-high' : 'badge-medium');
    const isCritical = sev === 'CRITICAL';

    return `
      <div class="finding-card ${isCritical ? 'severity-critical' : ''}">
        <div class="finding-top">
          <span class="finding-title">${escapeHtml(f.title || 'Tespit Edilen Nesne')}</span>
          <span class="finding-badge ${badgeClass}">${escapeHtml(sev)}</span>
        </div>
        ${f.path ? `<div class="finding-path"><span style="color:var(--brand-light);font-family:var(--font-mono);font-size:11px;">[DOSYA]</span> ${escapeHtml(f.path)}</div>` : ''}
        ${f.details ? `<div class="finding-details">${escapeHtml(f.details)}</div>` : ''}
      </div>
    `;
  }).join('');
}

// --------------------------------------------------------------------------
// 4. EVENT LISTENERS
// --------------------------------------------------------------------------

// Create Scan Modal Triggers
function openCreateModal() {
  byId('createScanResultBox').classList.add('hidden');
  byId('formCreateScan').classList.remove('hidden');
  byId('inputScanPlayerName').value = '';
  byId('modalCreateScan').classList.remove('hidden');
}

byId('btnOpenCreateScanModal').addEventListener('click', openCreateModal);
byId('btnOpenCreateScanModalAlt').addEventListener('click', openCreateModal);
byId('btnCreateStaffInvite').addEventListener('click', async () => {
  const button = byId('btnCreateStaffInvite');
  button.disabled = true;
  try {
    const result = await portal('create_invite', { label: 'Panel Yetkilisi', days: 7 });
    await navigator.clipboard.writeText(result.inviteKey);
    showAlert(`Tek kullanımlık davet anahtarı panoya kopyalandı: ${result.inviteKey}`);
  } catch (error) {
    showAlert(error.message);
  } finally {
    button.disabled = false;
  }
});

byId('btnCloseCreateModal').addEventListener('click', () => {
  byId('modalCreateScan').classList.add('hidden');
});
byId('btnCancelCreateModal').addEventListener('click', () => byId('btnCloseCreateModal').click());

document.querySelectorAll('.game-grid-btn').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.game-grid-btn').forEach(item => item.classList.remove('selected'));
    button.classList.add('selected');
    byId('selectedGameLabel').textContent = button.getAttribute('data-game');
  });
});

byId('formCreateScan').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = byId('btnSubmitCreateScan');
  btn.disabled = true;
  const playerName = byId('inputScanPlayerName').value.trim() || 'Oyuncu';
  const selectedGameBtn = document.querySelector('.game-grid-btn.selected');
  const selectedGame = selectedGameBtn ? selectedGameBtn.getAttribute('data-game') : 'Minecraft Java (PC)';

  try {
    const result = await portal('create_scan', { playerName, game: selectedGame });
    const session = result.session;
    createdScanGame = session.game || selectedGame;
    byId('createdScanCodeDisplay').textContent = session.session_code;
    byId('formCreateScan').classList.add('hidden');
    byId('createScanResultBox').classList.remove('hidden');
    await loadScans();
    byId('btnWatchLiveScan').onclick = () => {
      byId('modalCreateScan').classList.add('hidden');
      openLiveScan(session.session_code);
    };
  } catch (err) {
    showAlert(`PIN oluşturulamadı: ${err.message}`);
  } finally {
    btn.disabled = false;
  }
});

byId('btnCopyCreatedCode').addEventListener('click', async () => {
  const code = byId('createdScanCodeDisplay').textContent;
  await navigator.clipboard.writeText(code);
  byId('btnCopyCreatedCode').textContent = 'Kopyalandı';
  setTimeout(() => { byId('btnCopyCreatedCode').textContent = 'PIN\'i kopyala'; }, 1500);
});

byId('btnCopyCreatedLink')?.addEventListener('click', async () => {
  const code = byId('createdScanCodeDisplay').textContent;
  const platform = createdScanGame.includes('Linux') ? '&platform=linux' : '';
  const link = `https://zeninkaanx.github.io/AtlasOyuncu-Hile-KontrolX/download.html?pin=${encodeURIComponent(code)}${platform}`;
  await navigator.clipboard.writeText(link);
  byId('btnCopyCreatedLink').textContent = 'Link kopyalandı';
  setTimeout(() => { byId('btnCopyCreatedLink').textContent = 'İndirme linkini kopyala'; }, 1500);
});

byId('btnCopyCreatedMsg')?.addEventListener('click', async () => {
  const code = byId('createdScanCodeDisplay').textContent;
  const platform = createdScanGame.includes('Linux') ? '&platform=linux' : '';
  const link = `https://zeninkaanx.github.io/AtlasOyuncu-Hile-KontrolX/download.html?pin=${encodeURIComponent(code)}${platform}`;
  const msg = `Atlas AC kontrol bağlantınız hazır.\nPlatform: ${createdScanGame}\n20 dakika içinde indirin ve uygulamada PIN'i girin:\n${link}\nPIN: ${code}\nBaşka bir lisans veya cihaz kodu gerekmez.`;
  await navigator.clipboard.writeText(msg);
  byId('btnCopyCreatedMsg').textContent = 'Mesaj kopyalandı';
  setTimeout(() => { byId('btnCopyCreatedMsg').textContent = 'Kontrol mesajını kopyala'; }, 1500);
});

// Inspector Close
byId('btnCloseInspectModal').addEventListener('click', () => {
  if (activePollingTimer) {
    clearInterval(activePollingTimer);
    activePollingTimer = null;
  }
  byId('modalInspectScan').classList.add('hidden');
  const url = new URL(location.href);
  url.searchParams.delete('scan');
  history.replaceState(null, '', url);
});

byId('btnRefreshInspection').addEventListener('click', () => {
  if (currentInspectedScan) inspectScan(currentInspectedScan.session_code);
});

byId('scanSearchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const code = byId('scanSearchInput').value.trim().toUpperCase();
    if (code) openLiveScan(code);
  }
});

function applyTableFilters() {
  const query = byId('scanSearchTableInput').value.trim().toLocaleLowerCase('tr-TR');
  const statusLabel = byId('filterStatusSelect').value.toLowerCase();
  const game = byId('filterGameSelect').value;
  const statusMap = { finished: 'completed', scanning: 'scanning', pending: 'pending', expired: 'expired' };
  const filtered = cachedScans.filter(scan => {
    const matchesQuery = !query || `${scan.session_code} ${scan.player_name}`.toLocaleLowerCase('tr-TR').includes(query);
    const matchesStatus = statusLabel === 'all status' || scan.status === statusMap[statusLabel];
    const matchesGame = game === 'Tüm Platformlar' || scan.game === game;
    return matchesQuery && matchesStatus && matchesGame;
  });
  renderScansTable(filtered);
}

byId('scanSearchTableInput').addEventListener('input', applyTableFilters);
byId('filterStatusSelect').addEventListener('change', applyTableFilters);
byId('filterGameSelect').addEventListener('change', applyTableFilters);

// Evidence Tab Switching
document.querySelectorAll('.evidence-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.evidence-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFindingsFilter = btn.getAttribute('data-cat');
    if (currentInspectedScan) {
      renderFindingsList(currentInspectedScan.findings || [], currentFindingsFilter);
    }
  });
});

// Staff Action Toolbar Buttons
byId('btnCopyBanCmd').addEventListener('click', async () => {
  if (!currentInspectedScan) return;
  const cmd = `/kick ${currentInspectedScan.player_name} Atlas AC incelemesi tamamlandı [${currentInspectedScan.session_code}]`;
  await navigator.clipboard.writeText(cmd);
  showAlert(`Moderasyon komutu panoya kopyalandı: ${cmd}`);
});

byId('btnCopyDiscordReport').addEventListener('click', async () => {
  if (!currentInspectedScan) return;
  const s = currentInspectedScan;
  const reportText = `**[ATLAS AC ADLİ BİLİŞİM RAPORU]**\n` +
    `**Oyuncu:** \`${s.player_name}\`\n` +
    `**Kontrol Kodu:** \`${s.session_code}\`\n` +
    `**Sonuç:** ${(s.findings_count || 0) > 0 ? '**TEKNİK BULGU VAR**' : '**RAPORLANAN BULGU YOK**'}\n` +
    `**Risk Skoru:** %${s.risk_score || 0} (${s.findings_count || 0} bulgu)\n` +
    `**Tarih:** ${new Date(s.created_at).toLocaleString('tr-TR')}\n` +
    `**Rapor Linki:** ${location.origin + location.pathname}?scan=${s.session_code}`;
  await navigator.clipboard.writeText(reportText);
  showAlert('Yetkili özeti panoya kopyalandı.');
});

byId('btnCopyShareLink').addEventListener('click', async () => {
  if (!currentInspectedScan) return;
  const link = `${location.origin}${location.pathname}?scan=${currentInspectedScan.session_code}`;
  await navigator.clipboard.writeText(link);
  showAlert(`Rapor bağlantısı kopyalandı: ${link}`);
});

byId('btnDownloadHtmlReport').addEventListener('click', () => {
  if (!currentInspectedScan) return;
  const s = currentInspectedScan;
  const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `AtlasAC_Report_${s.session_code}_${s.player_name}.json`;
  a.click();
});

byId('logoutButton').addEventListener('click', async () => {
  await supabase.auth.signOut();
  location.replace('auth.html');
});

// Initialize Everything
await loadAccount();
await loadScans();

// Arka plandaki sekmeler gereksiz istek göndermez.
setInterval(() => {
  if (!document.hidden) loadScans();
}, 10000);

// Check URL Params for direct scan view (?scan=ATL-XXXX)
const urlParams = new URLSearchParams(window.location.search);
const directScan = urlParams.get('scan');
if (directScan) {
  inspectScan(directScan);
}

window.addEventListener('popstate', () => {
  const code = new URLSearchParams(location.search).get('scan');
  if (code) inspectScan(code);
  else byId('modalInspectScan').classList.add('hidden');
});
