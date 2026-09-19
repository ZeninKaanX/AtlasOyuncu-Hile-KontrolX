import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, configured } from './config.js';

if (!configured) location.replace('auth.html');
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const byId = id => document.getElementById(id);
const scanCode = new URLSearchParams(location.search).get('scan')?.trim().toUpperCase();
let currentScan = null;
let pollTimer = null;
let pollGeneration = 0;
let categoryFilter = 'all';
let severityFilter = 'all';
let searchFilter = '';

if (!scanCode) location.replace('dashboard.html');

async function portal(action, extra = {}) {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) {
    location.replace(`auth.html?next=${encodeURIComponent(`results.html?scan=${scanCode}`)}`);
    throw new Error('Oturumunuz sona erdi.');
  }
  const isGet = action === 'me';
  const url = new URL(`${SUPABASE_URL}/functions/v1/portal`);
  url.searchParams.set('action', action);
  const response = await fetch(url.toString(), {
    method: isGet ? 'GET' : 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${accessToken}` },
    body: isGet ? undefined : JSON.stringify({ action, ...extra })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Rapor alınamadı.');
  return result;
}

function setText(id, value) {
  const element = byId(id);
  if (element) element.textContent = value ?? '—';
}

function showStatus(message) {
  setText('resultsStatus', message);
  byId('resultsStatus').classList.toggle('hidden', !message);
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value, fallback = '—') {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleString('tr-TR');
}

function formatDuration(scan) {
  let seconds = number(scan.report_data?.durationSeconds);
  if (!seconds && scan.claimed_at) {
    const end = scan.completed_at ? new Date(scan.completed_at).getTime() : Date.now();
    seconds = Math.max(0, (end - new Date(scan.claimed_at).getTime()) / 1000);
  }
  const whole = Math.floor(seconds);
  return { minutes: Math.floor(whole / 60), seconds: String(whole % 60).padStart(2, '0') };
}

function severityOf(finding) {
  const severity = String(finding?.severity || 'LOW').toLowerCase();
  if (severity === 'critical' || severity === 'high' || severity === 'medium') return severity;
  return 'low';
}

function haystackOf(finding) {
  return `${finding?.category || ''} ${finding?.title || ''} ${finding?.path || ''} ${finding?.details || ''}`.toLocaleLowerCase('tr-TR');
}

function categoryOf(finding) {
  const text = haystackOf(finding);
  if (/minecraft|mod|fabric|forge|lunar|badlion|cheat|client/.test(text)) return 'minecraft';
  if (/inject|bypass|dll|hook|process|bellek|memory|jvm/.test(text)) return 'injection';
  if (/usn|silin|deleted|journal|recycle/.test(text)) return 'deleted';
  if (/prefetch|bam|execution|çalıştır|yürüt|recent/.test(text)) return 'execution';
  if (/dns|network|internet|download|tarayıcı|browser|ağ|vpn/.test(text)) return 'network';
  return 'other';
}

function verdictState(scan, findings) {
  if (scan.status === 'pending') return { state: 'pending', title: 'BAĞLANTI BEKLENİYOR', risk: 'Oyuncu PIN girişi bekleniyor', symbol: '…' };
  if (scan.status === 'scanning') return { state: 'scanning', title: 'TARANIYOR', risk: `%${number(scan.progress)} tamamlandı`, symbol: '⌁' };
  const dangerous = findings.some(item => ['critical', 'high'].includes(severityOf(item)));
  if (scan.verdict === 'banned' || dangerous || number(scan.findings_count) > 0) return { state: 'danger', title: 'HİLE TESPİTİ', risk: `%${number(scan.risk_score)} oyuncu risk skoru`, symbol: '!' };
  if (scan.status === 'completed' || scan.verdict === 'clean') return { state: 'clean', title: 'TEMİZ', risk: 'Raporlanan teknik bulgu yok', symbol: '✓' };
  return { state: 'loading', title: 'İNCELEME GEREKLİ', risk: 'Tarama durumu doğrulanıyor', symbol: '?' };
}

function renderFinding(finding) {
  const severity = severityOf(finding);
  const card = document.createElement('article');
  card.className = `professional-finding severity-${severity}`;
  const header = document.createElement('header');
  const title = document.createElement('h3');
  title.textContent = finding.title || 'Tespit edilen nesne';
  const badge = document.createElement('span');
  badge.className = 'finding-severity';
  badge.textContent = severity === 'critical' ? 'KRİTİK TEHDİT' : severity === 'high' ? 'YÜKSEK' : severity === 'medium' ? 'UYARI' : 'BİLGİ';
  header.append(title, badge);
  card.append(header);
  if (finding.details) {
    const details = document.createElement('p');
    details.textContent = finding.details;
    card.append(details);
  }
  if (finding.path) {
    const path = document.createElement('code');
    path.textContent = `[DOSYA] ${finding.path}`;
    card.append(path);
  }
  return card;
}

function renderFindings() {
  const findings = Array.isArray(currentScan?.findings) ? currentScan.findings : [];
  const list = findings.filter(finding => {
    const categoryMatches = categoryFilter === 'all' || categoryOf(finding) === categoryFilter;
    const severity = severityOf(finding);
    const severityMatches = severityFilter === 'all' || (severityFilter === 'critical' ? ['critical', 'high'].includes(severity) : severity === severityFilter);
    return categoryMatches && severityMatches && (!searchFilter || haystackOf(finding).includes(searchFilter));
  });
  byId('findingsList').replaceChildren(...list.map(renderFinding));
  byId('emptyFindings').classList.toggle('hidden', list.length > 0);
  setText('visibleFindingsLabel', `${list.length} kayıt gösteriliyor`);
}

function updateCounts(findings) {
  const categories = { minecraft: 0, injection: 0, deleted: 0, execution: 0, network: 0, other: 0 };
  const severities = { critical: 0, medium: 0, low: 0 };
  findings.forEach(finding => {
    categories[categoryOf(finding)]++;
    const severity = severityOf(finding);
    if (severity === 'critical' || severity === 'high') severities.critical++;
    else if (severity === 'medium') severities.medium++;
    else severities.low++;
  });
  setText('countAll', findings.length);
  setText('countMinecraft', categories.minecraft);
  setText('countInjection', categories.injection);
  setText('countDeleted', categories.deleted);
  setText('countExecution', categories.execution);
  setText('countNetwork', categories.network);
  setText('countOther', categories.other);
  setText('severityAll', findings.length);
  setText('severityCritical', severities.critical);
  setText('severityMedium', severities.medium);
  setText('severityLow', severities.low);
  setText('findingsTotal', findings.length);
  setText('summaryCritical', severities.critical);
  setText('summaryWarnings', severities.medium);
  const criticalX = 150;
  const criticalY = Math.max(22, 150 - Math.min(128, severities.critical * 8));
  const warningX = 150 + Math.min(118, severities.medium * 7);
  const safeX = 150 - Math.min(118, Math.log10(number(currentScan?.objects_count) + 1) * 35);
  byId('radarValue').setAttribute('points', `${criticalX},${criticalY} ${warningX},150 ${safeX},150`);
}

function renderScan(scan) {
  currentScan = scan;
  const findings = Array.isArray(scan.findings) ? scan.findings : [];
  const system = scan.system_info || {};
  const duration = formatDuration(scan);
  const verdict = verdictState(scan, findings);
  const objects = number(scan.objects_count || scan.report_data?.scannedObjects);
  const expectsLinux = scan.client_platform === 'linux' || String(scan.game || '').toLowerCase().includes('linux');
  const os = system.osName || system.platform || (expectsLinux ? 'Linux 64-bit' : 'Windows 64-bit');

  document.title = `${scan.player_name || 'Oyuncu'} · ${scan.session_code} | Atlas AC`;
  setText('resultPinTop', scan.session_code);
  setText('heroPin', scan.session_code);
  setText('heroSubtitle', `${scan.player_name || 'Oyuncu'} için teknik tarama ve yetkili karar ekranı`);
  setText('durationMinutes', duration.minutes);
  setText('durationSeconds', duration.seconds);
  setText('heroGame', scan.game || 'Minecraft');
  setText('heroPlatform', os);
  setText('heroVerdict', verdict.title);
  setText('heroRisk', verdict.risk);
  byId('heroVerdictPanel').className = `result-hero state-${verdict.state}`;
  byId('heroVerdictPanel').querySelector('.verdict-symbol').textContent = verdict.symbol;
  setText('summaryVerdictBadge', verdict.state === 'danger' ? 'Tespitler' : verdict.state === 'clean' ? 'Temiz' : 'Canlı');
  setText('summaryScanned', objects.toLocaleString('tr-TR'));

  const isLive = scan.status === 'pending' || scan.status === 'scanning';
  byId('liveProgressPanel').classList.toggle('hidden', !isLive);
  setText('liveStage', scan.current_stage || (scan.status === 'pending' ? 'Oyuncu bağlantısı bekleniyor' : 'Tarama sürüyor'));
  setText('liveLog', scan.current_log || 'İstemciden güncel telemetri bekleniyor.');
  setText('liveProgress', number(scan.progress));
  byId('liveProgressBar').style.width = `${Math.max(0, Math.min(100, number(scan.progress)))}%`;
  setText('liveObjects', `${objects.toLocaleString('tr-TR')} nesne`);
  setText('liveHeartbeat', scan.last_heartbeat_at ? `Son sinyal: ${formatDate(scan.last_heartbeat_at)}` : 'Son sinyal bekleniyor');

  setText('sysOs', os);
  setText('sysCpu', system.cpu || 'Raporlanmadı');
  setText('sysRam', system.ram || '—');
  setText('sysPlayer', scan.player_name || 'Oyuncu');
  setText('sysPlatform', scan.game || scan.client_platform || '—');
  setText('sysUptime', system.uptimeMinutes ? `${number(system.uptimeMinutes).toLocaleString('tr-TR')} dakika` : '—');
  setText('sysStarted', formatDate(scan.claimed_at || scan.created_at));
  setText('sysCompleted', scan.completed_at ? formatDate(scan.completed_at) : isLive ? 'Tarama sürüyor' : '—');
  setText('sysObjects', objects.toLocaleString('tr-TR'));
  setText('systemState', isLive ? 'CANLI' : scan.status === 'completed' ? 'TAMAMLANDI' : String(scan.status || '').toUpperCase());
  updateCounts(findings);
  renderFindings();
}

async function loadAccount() {
  const response = await portal('me');
  setText('resultsUser', response.user?.username || 'Yetkili');
  setText('resultsEmail', response.user?.email || '');
}

async function loadScan() {
  const generation = ++pollGeneration;
  if (pollTimer) clearTimeout(pollTimer);
  try {
    const response = await portal('get_scan', { code: scanCode });
    if (generation !== pollGeneration) return;
    renderScan(response.scan);
    showStatus('');
    if (['pending', 'scanning'].includes(response.scan.status)) pollTimer = setTimeout(loadScan, 1200);
  } catch (error) {
    if (generation !== pollGeneration) return;
    showStatus(error.message);
    pollTimer = setTimeout(loadScan, 4000);
  }
}

async function copyText(value, button, success) {
  await navigator.clipboard.writeText(value);
  const original = button.textContent;
  button.textContent = success;
  setTimeout(() => { button.textContent = original; }, 1400);
}

document.querySelectorAll('.result-nav-button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.result-nav-button').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  categoryFilter = button.dataset.category;
  renderFindings();
  document.querySelector('.findings-explorer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}));

document.querySelectorAll('.result-filter').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.result-filter').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  severityFilter = button.dataset.severity;
  renderFindings();
}));

byId('resultSearch').addEventListener('input', event => {
  searchFilter = event.target.value.trim().toLocaleLowerCase('tr-TR');
  renderFindings();
});
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    byId('resultSearch').focus();
  }
});
byId('btnRefreshResult').addEventListener('click', loadScan);
byId('btnBackDashboard').addEventListener('click', () => location.assign('dashboard.html'));
byId('btnCopyHeroPin').addEventListener('click', event => copyText(currentScan?.session_code || scanCode, event.currentTarget, 'PIN KOPYALANDI'));
byId('btnExportResult').addEventListener('click', () => {
  if (!currentScan) return;
  const blob = new Blob([JSON.stringify(currentScan, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `AtlasAC_Report_${currentScan.session_code}_${currentScan.player_name || 'Oyuncu'}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
});
byId('btnLogoutResult').addEventListener('click', async () => { await supabase.auth.signOut(); location.replace('auth.html'); });
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && currentScan && ['pending', 'scanning'].includes(currentScan.status)) loadScan();
});

setText('resultPinTop', scanCode);
setText('heroPin', scanCode);
try {
  await loadAccount();
  await loadScan();
} catch (error) {
  showStatus(error.message);
}
