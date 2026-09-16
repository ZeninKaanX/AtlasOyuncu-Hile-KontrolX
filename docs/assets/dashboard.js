import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, configured } from './config.js';

if (!configured) location.replace('auth.html');
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const { data: sessionData } = await supabase.auth.getSession();
if (!sessionData.session) location.replace('auth.html');
const session = sessionData.session;

const byId = id => document.getElementById(id);
let activePollingTimer = null;
let currentInspectedScan = null;
let currentFindingsFilter = 'all';

// Universal Portal API Caller
async function portal(action, extra = {}) {
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
      Authorization: `Bearer ${session.access_token}`
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

// --------------------------------------------------------------------------
// 1. ACCOUNT & LICENSE DATA
// --------------------------------------------------------------------------
function renderLicenses(licenses) {
  byId('deviceCount').textContent = licenses.length;
  if (!licenses.length) return;
  byId('licenseRows').innerHTML = licenses.map(item => `
    <div class="device-row">
      <code>${escapeHtml(item.machine_id.slice(0, 16))}••••${escapeHtml(item.machine_id.slice(-8))}</code>
      <span>${new Date(item.expires_at).toLocaleDateString('tr-TR')}</span>
    </div>
  `).join('');
}

async function loadAccount() {
  try {
    const data = await portal('me');
    byId('username').textContent = data.user.username;
    byId('userEmail').textContent = data.user.email;
    byId('accountStatus').textContent = data.entitlement.status === 'active' ? 'Aktif' : data.entitlement.status;
    byId('deviceLimit').textContent = data.entitlement.max_devices;
    const expiry = new Date(data.entitlement.expires_at);
    byId('daysLeft').textContent = `${Math.max(0, Math.ceil((expiry - Date.now()) / 86400000))} gün`;
    renderLicenses(data.licenses || []);
  } catch (error) {
    showAlert(error.message);
  }
}

// --------------------------------------------------------------------------
// 2. REMOTE SCREEN CHECK (KONTROL) MANAGEMENT
// --------------------------------------------------------------------------
async function loadScans() {
  try {
    const res = await portal('list_scans');
    const scans = res.scans || [];
    byId('activeScansCount').textContent = scans.length;
    renderScansTable(scans);
  } catch (err) {
    console.warn('Scans loading error:', err);
  }
}

function renderScansTable(scans) {
  const tbody = byId('scansTableBody');
  if (!scans.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:#64748b;">Henüz başlatılmış bir kontrol oturumu bulunmuyor.</td></tr>`;
    return;
  }

  tbody.innerHTML = scans.map(s => {
    let statusPill = '';
    if (s.status === 'pending') {
      statusPill = `<span class="status-pill status-pending"><span class="live-radar-dot"></span> Oyuncu Bekleniyor</span>`;
    } else if (s.status === 'scanning') {
      statusPill = `<span class="status-pill status-scanning"><span class="live-radar-dot"></span> Taranıyor (%${s.progress || 0})</span>`;
    } else if (s.verdict === 'banned') {
      statusPill = `<span class="status-pill status-banned"><span class="h-1.5 w-1.5 rounded-full bg-red-400"></span> CHEATING</span>`;
    } else if (s.verdict === 'clean') {
      statusPill = `<span class="status-pill status-clean"><span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> TEMİZ</span>`;
    } else {
      statusPill = `<span class="status-pill status-pending">Tamamlandı</span>`;
    }

    const findingsBadge = (s.findings_count > 0)
      ? `<strong style="color:#ef4444;">${s.findings_count} İhlal</strong>`
      : `<span style="color:#22c55e;">0 Bulgu</span>`;

    const platformBadge = (s.client_platform === 'linux') ? 'Linux' : 'Windows';
    const dateStr = new Date(s.created_at).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });

    return `
      <tr>
        <td>
          <span class="scan-code-pill" style="cursor:pointer;" title="Kopyalamak için tıklayın" data-copy="${escapeHtml(s.session_code)}">
            ${escapeHtml(s.session_code)}
          </span>
        </td>
        <td><strong>${escapeHtml(s.player_name)}</strong></td>
        <td>${statusPill}</td>
        <td>${findingsBadge}</td>
        <td><small style="color:#94a3b8;">${platformBadge}</small></td>
        <td><small style="color:#64748b;">${dateStr}</small></td>
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
      inspectScan(code);
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
    try {
      const res = await portal('get_scan', { code: codeOrId });
      const scan = res.scan;
      if (!scan) throw new Error('Oturum bulunamadı.');
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
    } catch (err) {
      showAlert(`Kontrol yüklenirken hata: ${err.message}`);
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
    verdictTitle.textContent = 'HİLE TESPİT EDİLDİ (KRİTİK İHLAL)';
    verdictDesc.textContent = `Bu bilgisayarda ${scan.findings_count} adet doğrulanmış hile izi, kalıntı veya gizleme girişimi bulundu!`;
  } else if (scan.status === 'completed' && scan.verdict === 'clean') {
    verdictBanner.classList.add('verdict-banner-clean');
    verdictIcon.textContent = '';
    verdictTitle.textContent = 'BİLGİSAYAR TEMİZ';
    verdictDesc.textContent = 'Yapılan 33 motorlu adli bilişim taramasında herhangi bir hile izine veya tahrifata rastlanmadı.';
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
  const container = byId('inspectFindingsList');
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
byId('btnOpenCreateScanModal').addEventListener('click', () => {
  byId('createScanResultBox').classList.add('hidden');
  byId('formCreateScan').classList.remove('hidden');
  byId('inputScanPlayerName').value = '';
  byId('modalCreateScan').classList.remove('hidden');
});

byId('btnCloseCreateModal').addEventListener('click', () => {
  byId('modalCreateScan').classList.add('hidden');
});

byId('formCreateScan').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = byId('btnSubmitCreateScan');
  btn.disabled = true;
  const playerName = byId('inputScanPlayerName').value.trim() || 'Şüpheli Oyuncu';

  try {
    const result = await portal('create_scan', { playerName });
    const session = result.session;
    byId('createdScanCodeDisplay').textContent = session.session_code;
    byId('formCreateScan').classList.add('hidden');
    byId('createScanResultBox').classList.remove('hidden');
    await loadScans();

    byId('btnWatchLiveScan').onclick = () => {
      byId('modalCreateScan').classList.add('hidden');
      inspectScan(session.session_code);
    };
  } catch (err) {
    showAlert(`Oturum açılamadı: ${err.message}`);
  } finally {
    btn.disabled = false;
  }
});

byId('btnCopyCreatedCode').addEventListener('click', async () => {
  const code = byId('createdScanCodeDisplay').textContent;
  await navigator.clipboard.writeText(code);
  byId('btnCopyCreatedCode').textContent = 'Kopyalandı!';
  setTimeout(() => { byId('btnCopyCreatedCode').textContent = 'PIN Kopyala'; }, 1500);
});

byId('btnCopyCreatedLink')?.addEventListener('click', async () => {
  const code = byId('createdScanCodeDisplay').textContent;
  const link = `https://zeninkaanx.github.io/AtlasOyuncu-Hile-KontrolX/download.html?pin=${encodeURIComponent(code)}`;
  await navigator.clipboard.writeText(link);
  byId('btnCopyCreatedLink').textContent = 'Link Kopyalandı!';
  setTimeout(() => { byId('btnCopyCreatedLink').textContent = 'İndirme Linkini Kopyala'; }, 1500);
});

byId('btnCopyCreatedMsg')?.addEventListener('click', async () => {
  const code = byId('createdScanCodeDisplay').textContent;
  const link = `https://zeninkaanx.github.io/AtlasOyuncu-Hile-KontrolX/download.html?pin=${encodeURIComponent(code)}`;
  const msg = `Atlas AC ile ekran kontrolüne alındınız.\nLütfen 5 dakika içinde istemciyi indirip PIN kodunu giriniz:\nİndirme Bağlantısı: ${link}\nTarama PIN: ${code}\n(İstemci açıldığında PIN'i girmeniz yeterlidir, lisans gerekmez.)`;
  await navigator.clipboard.writeText(msg);
  byId('btnCopyCreatedMsg').textContent = 'Mesaj Kopyalandı!';
  setTimeout(() => { byId('btnCopyCreatedMsg').textContent = 'Kontrol Mesajını Kopyala'; }, 1500);
});

// Inspector Close
byId('btnCloseInspectModal').addEventListener('click', () => {
  if (activePollingTimer) {
    clearInterval(activePollingTimer);
    activePollingTimer = null;
  }
  byId('modalInspectScan').classList.add('hidden');
});

// Search Scan by Code
byId('btnSearchScan').addEventListener('click', () => {
  const code = byId('scanSearchInput').value.trim().toUpperCase();
  if (code) inspectScan(code);
});

byId('scanSearchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const code = byId('scanSearchInput').value.trim().toUpperCase();
    if (code) inspectScan(code);
  }
});

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
  const cmd = `/ban ${currentInspectedScan.player_name} 30d Hile Kullanımı [AtlasAC-${currentInspectedScan.session_code}]`;
  await navigator.clipboard.writeText(cmd);
  showAlert(`Ban komutu panoya kopyalandı: ${cmd}`);
});

byId('btnCopyDiscordReport').addEventListener('click', async () => {
  if (!currentInspectedScan) return;
  const s = currentInspectedScan;
  const reportText = `**[ATLAS AC ADLİ BİLİŞİM RAPORU]**\n` +
    `**Oyuncu:** \`${s.player_name}\`\n` +
    `**Kontrol Kodu:** \`${s.session_code}\`\n` +
    `**Karar:** ${s.verdict === 'banned' ? '**CHEATING (HİLE TESPİT EDİLDİ)**' : '**CLEAN (TEMİZ)**'}\n` +
    `**Risk Skoru:** %${s.risk_score || 0} (${s.findings_count || 0} İhlal)\n` +
    `**Tarih:** ${new Date(s.created_at).toLocaleString('tr-TR')}\n` +
    `**Rapor Linki:** ${location.origin + location.pathname}?scan=${s.session_code}`;
  await navigator.clipboard.writeText(reportText);
  showAlert('Discord raporu panoya kopyalandı!');
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

// --------------------------------------------------------------------------
// 5. DOWNLOAD & LOGOUT
// --------------------------------------------------------------------------
byId('logoutButton').addEventListener('click', async () => {
  await supabase.auth.signOut();
  location.replace('auth.html');
});

byId('licenseForm').addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  try {
    const result = await portal('license', { machineId: byId('machineId').value.trim().toUpperCase() });
    byId('licenseKey').textContent = result.key;
    byId('keyExpiry').textContent = `Geçerlilik: ${new Date(result.expiresAt).toLocaleString('tr-TR')}`;
    byId('keyResult').classList.remove('hidden');
    await loadAccount();
  } catch (error) {
    showAlert(error.message);
  } finally {
    button.disabled = false;
  }
});

byId('copyKey').addEventListener('click', async () => {
  await navigator.clipboard.writeText(byId('licenseKey').textContent);
  byId('copyKey').textContent = 'Kopyalandı';
  setTimeout(() => { byId('copyKey').textContent = 'Kopyala'; }, 1500);
});

async function handleDownload(btn, platform) {
  const key = byId('licenseKey')?.textContent?.trim() || '';
  const keyParam = key ? `&key=${encodeURIComponent(key)}` : '';
  location.href = `download.html?platform=${platform}${keyParam}`;
}

const btnWin = byId('downloadWindowsButton');
if (btnWin) btnWin.addEventListener('click', () => handleDownload(btnWin, 'windows'));

const btnLin = byId('downloadLinuxButton');
if (btnLin) btnLin.addEventListener('click', () => handleDownload(btnLin, 'linux'));

// Initialize Everything
await loadAccount();
await loadScans();

// Auto refresh scans table every 10 seconds
setInterval(loadScans, 10000);

// Check URL Params for direct scan view (?scan=ATL-XXXX)
const urlParams = new URLSearchParams(window.location.search);
const directScan = urlParams.get('scan');
if (directScan) {
  inspectScan(directScan);
}
