/**
 * Atlas AC - Client-side UI Controller & Telemetry Engine
 * Snow-White Glass aesthetic, continuous real-time progress interpolation,
 * SVG circular progress ring, live inspected file stream, bilingual i18n (EN/TR),
 * full timestamp/path forensic display, auto-report generation notification, and zero emojis.
 */

// i18n Localization Dictionary
const translations = {
  en: {
    nav_overview: 'Overview',
    nav_bypass: 'Bypass & Injection',
    nav_usn: 'USN Journal',
    nav_prefetch: 'Prefetch & BAM',
    nav_minecraft: 'Minecraft & Mods',
    nav_browsers: 'Browser Downloads',
    nav_usb: 'USB Storage',
    nav_macros: 'Clickers & Macros',
    nav_terminal: 'Live Telemetry',
    nav_export: 'Export Report',
    btn_hud_view: 'Scanning View',
    btn_shutdown: 'Exit / Shut Down',
    hero_title: 'Atlas AC Integrity Inspection Engine',
    hero_desc: 'High-performance client inspection covering 12 target cheat clients (Raven B+, Doomsday, Aristois, LiquidBounce, Wurst, Meteor, Impact, Inertia, ThunderHack, CatLean, Ares, BleachHack), Spotify SpotX DLL injection hooks, disguised trojan mods, and external Python background scripts with 0% false positives.',
    btn_start_scan: 'Start Full Scan',
    stat_critical: 'Critical Threats',
    stat_suspicious: 'Suspicious / Macros',
    stat_scanned: 'Scanned Modules',
    stat_verdict: 'System Verdict',
    findings_title: 'Detected Findings & Evidence Log',
    dash_empty: "No scan running. Click 'Start Full Scan' above to launch complete client inspection.",
    clean_all: 'All engines completed inspection. No active cheats, injection hooks, or bypass mechanisms detected (CLEAN).',
    clean_category: 'No suspicious or malicious artifacts found in this category (Clean).',
    bypass_heading: 'Bypass & Injection Analysis',
    bypass_desc: 'Spotify SpotX disguised DLL hijacking, kernel-level BYOVD drivers, DNS cache poisoning, and JVM -javaagent injection hooks.',
    usn_heading: 'NTFS USN & Deletion Evidence',
    usn_desc: 'Shift+Deleted cheat JARs/EXEs, .bplus Raven configurations, self-destruct scripts, and deleted file change journals.',
    prefetch_heading: 'Prefetch & BAM Execution History',
    prefetch_desc: 'MAM decompressed JAVAW.EXE executed resources and BAM Windows Registry execution trails of deleted cheat binaries.',
    mc_heading: 'Minecraft Mods & Trojan Heuristics',
    mc_desc: 'PrismLauncher, .minecraft, and instance directory verification for disguised JARs, hidden triggers, and native input injection bytecode.',
    browser_heading: 'Browser History & Downloads',
    browser_desc: 'Downloaded cheat binaries and visited cheat provider domains across Chrome, Edge, Brave, Opera, and Firefox.',
    usb_heading: 'USB & Removable Storage History',
    usb_desc: 'Historical records of connected flash drives, hardware IDs, and binaries executed from external storage devices.',
    macro_heading: 'AutoClickers, Hardware Macros & External Python',
    macro_desc: 'OP AutoClicker, Murgee, SpeedClicker, Logitech LUA scripts, Razer Synapse macros, Bloody AMC, and external Python cheat processes.',
    term_heading: 'Live Telemetry & Inspection Stream',
    export_heading: 'Inspection Verification Report',
    export_desc: 'Exports all detected findings, SHA-256 file hashes, timestamps, and integrity evidence directly to your desktop as a self-contained HTML report.',
    btn_export: 'Export Report',
    hud_title: 'Atlas AC Inspection',
    hud_close: 'Close',
    hud_active_target: 'Active Target:',
    hud_standby: 'Standby',
    hud_scanning: 'Scanning...',
    hud_clean: 'Clean',
    hud_threat: 'Threat Detected',
    hud_suspicious: 'Suspicious',
    hud_init: 'Initializing Inspection Engine...',
    hud_complete: 'Inspection Completed Successfully',
    hud_finished_ticker: 'All inspection engines finished. Rendering evidence...',
    hud_calibrating: 'Calibrating inspection modules...',
    objects: 'objects',
    step_bypass: 'Bypass & Injection',
    step_memory: 'Memory & Processes',
    step_usn: 'USN Deletion Journal',
    step_prefetch: 'Prefetch & BAM',
    step_mods: 'Minecraft & Mods',
    step_browsers: 'Browser Downloads',
    step_usb: 'USB Storage History',
    step_macros: 'Clickers & Macros',
    step_python: 'External Python',
    badge_critical: 'CRITICAL THREAT',
    badge_high: 'SUSPICIOUS',
    badge_info: 'VERIFIED INFO',
    lbl_timestamp: 'Timestamp',
    lbl_file_path: 'File Path',
    lbl_url: 'Target URL',
    lbl_evidence: 'Evidence',
    lbl_confidence: 'Confidence',
    verdict_standby: 'STANDBY',
    verdict_scanning: 'SCANNING...',
    verdict_clean: 'CLEAN',
    verdict_flagged: 'FLAGGED',
    verdict_suspicious: 'SUSPICIOUS',
    scanning_in_progress: 'Analysis in progress... Live findings will appear immediately upon detection.',
    auto_report_title: 'Inspection Report Automatically Saved to Desktop',
    report_saved_msg: 'Inspection Report Saved Successfully:'
  },
  tr: {
    nav_overview: 'Genel Bakış',
    nav_bypass: 'Bypass ve Enjeksiyon',
    nav_usn: 'USN Günlüğü',
    nav_prefetch: 'Prefetch ve BAM',
    nav_minecraft: 'Minecraft ve Modlar',
    nav_browsers: 'Tarayıcı İndirmeleri',
    nav_usb: 'USB Bellekler',
    nav_macros: 'Tıklayıcı ve Makrolar',
    nav_terminal: 'Canlı Telemetri',
    nav_export: 'Raporu Dışa Aktar',
    btn_hud_view: 'Tarama Ekranı',
    btn_shutdown: 'Çıkış / Kapat',
    hero_title: 'Atlas AC İstemci Bütünlük Denetimi',
    hero_desc: '12 hedef hile istemcisi (Raven B+, Doomsday, Aristois, LiquidBounce, Wurst, Meteor, Impact, Inertia, ThunderHack, CatLean, Ares, BleachHack), Spotify SpotX DLL enjeksiyon kancaları, gizlenmiş truva modları ve harici Python betiklerini %0 hatalı pozitif ile yakalayan yüksek performanslı istemci denetimi.',
    btn_start_scan: 'Tam Taramayı Başlat',
    stat_critical: 'Kritik Tehditler',
    stat_suspicious: 'Şüpheli / Makrolar',
    stat_scanned: 'Taranan Modüller',
    stat_verdict: 'Sistem Durumu',
    findings_title: 'Tespit Edilen Bulgular ve Kanıt Günlüğü',
    dash_empty: "Tarama çalışmıyor. İstemci denetimini başlatmak için yukarıdaki 'Tam Taramayı Başlat' butonuna tıklayın.",
    clean_all: 'Tüm motorlar denetimi tamamladı. Aktif hile, enjeksiyon veya bypass mekanizması tespit edilmedi (TEMİZ).',
    clean_category: 'Bu kategoride şüpheli veya zararlı öğe bulunamadı (Temiz).',
    bypass_heading: 'Bypass ve Enjeksiyon Analizi',
    bypass_desc: 'Spotify SpotX kılıflı DLL ele geçirme, çekirdek düzeyinde BYOVD sürücüleri, DNS önbellek zehirleme ve JVM -javaagent enjeksiyon kancaları.',
    usn_heading: 'NTFS USN ve Silinme Kanıtları',
    usn_desc: 'Shift+Delete ile silinmiş hile JAR/EXE dosyaları, .bplus Raven yapılandırmaları, kendini imha betikleri ve silinen dosya değişiklik günlükleri.',
    prefetch_heading: 'Prefetch ve BAM Çalıştırma Geçmişi',
    prefetch_desc: 'MAM sıkıştırması açılmış JAVAW.EXE kaynakları ve silinen hilelerin BAM Windows Kayıt Defteri izleri.',
    mc_heading: 'Minecraft Modları ve Truva Sezgisel Analizi',
    mc_desc: 'PrismLauncher, .minecraft ve örnek dizinlerinde gizlenmiş JAR dosyaları, gizli tetikleyiciler ve yerel giriş enjeksiyon baytkodları.',
    browser_heading: 'Tarayıcı Geçmişi ve İndirmeler',
    browser_desc: 'Chrome, Edge, Brave, Opera ve Firefox üzerinden indirilmiş hile dosyaları ve ziyaret edilen hile siteleri.',
    usb_heading: 'USB ve Harici Depolama Geçmişi',
    usb_desc: 'Bağlanan flash belleklerin geçmiş kayıtları, donanım kimlikleri ve harici sürücülerden çalıştırılan ikili dosyalar.',
    macro_heading: 'Otomatik Tıklayıcılar, Donanım Makroları ve Harici Python',
    macro_desc: 'OP AutoClicker, Murgee, SpeedClicker, Logitech LUA betikleri, Razer Synapse makroları, Bloody AMC ve harici Python hile süreçleri.',
    term_heading: 'Canlı Telemetri ve Denetim Akışı',
    export_heading: 'Denetim Doğrulama Raporu',
    export_desc: 'Tespit edilen tüm bulguları, SHA-256 dosya özetlerini, zaman damgalarını ve bütünlük kanıtlarını doğrudan masaüstünüze HTML raporu olarak kaydeder.',
    btn_export: 'Raporu Dışa Aktar',
    hud_title: 'Atlas AC Denetimi',
    hud_close: 'Kapat',
    hud_active_target: 'Aktif Hedef:',
    hud_standby: 'Beklemede',
    hud_scanning: 'Taranıyor...',
    hud_clean: 'Temiz',
    hud_threat: 'Tehdit Tespit Edildi',
    hud_suspicious: 'Şüpheli',
    hud_init: 'Denetim Motoru Başlatılıyor...',
    hud_complete: 'Denetim Başarıyla Tamamlandı',
    hud_finished_ticker: 'Tüm denetim motorları tamamlandı. Kanıtlar listeleniyor...',
    hud_calibrating: 'Denetim modülleri kalibre ediliyor...',
    objects: 'nesne',
    step_bypass: 'Bypass ve Enjeksiyon',
    step_memory: 'Bellek ve Süreçler',
    step_usn: 'USN Silme Günlüğü',
    step_prefetch: 'Prefetch ve BAM',
    step_mods: 'Minecraft ve Modlar',
    step_browsers: 'Tarayıcı İndirmeleri',
    step_usb: 'USB Bellek Geçmişi',
    step_macros: 'Tıklayıcı ve Makrolar',
    step_python: 'Harici Python',
    badge_critical: 'KRİTİK TEHDİT',
    badge_high: 'ŞÜPHELİ',
    badge_info: 'BİLGİ',
    lbl_timestamp: 'Zaman Damgası',
    lbl_file_path: 'Dosya Yolu',
    lbl_url: 'Hedef URL',
    lbl_evidence: 'Kanıt',
    lbl_confidence: 'Güvenilirlik',
    verdict_standby: 'BEKLEMEDE',
    verdict_scanning: 'TARANIYOR...',
    verdict_clean: 'TEMİZ',
    verdict_flagged: 'TEHDİT VAR',
    verdict_suspicious: 'ŞÜPHELİ',
    scanning_in_progress: 'Denetim sürüyor... Bulgular tespit edildikçe anında listelenecektir.',
    auto_report_title: 'Denetim Raporu Otomatik Olarak Masaüstüne Kaydedildi',
    report_saved_msg: 'Denetim Raporu Başarıyla Kaydedildi:'
  }
};

let currentLang = 'tr';
try {
  const saved = localStorage.getItem('atlas_ac_lang');
  if (saved && (saved === 'tr' || saved === 'en')) {
    currentLang = saved;
  }
} catch (e) {
  currentLang = 'tr';
}

let ws = null;
let currentScanData = null;
let flaggedStages = new Set();

// High-speed real-time progress engine variables
let currentPercent = 0;
let targetPercent = 0;
let scannedObjectsCount = 0;
let isScanActive = false;
let progressInterval = null;

const CIRCUMFERENCE = 596.9; // 2 * PI * 95

const STAGES = [
  { id: 'BYPASS_ANALIZI', key: 'bypass', target: 25, labelKey: 'bypass' },
  { id: 'BELLEK_TARAMASI', key: 'memory', target: 38, labelKey: 'memory' },
  { id: 'USN_JOURNAL', key: 'usn', target: 50, labelKey: 'usn' },
  { id: 'PREFETCH_BAM', key: 'prefetch', target: 65, labelKey: 'prefetch' },
  { id: 'MINECRAFT_MODLARI', key: 'mods', target: 78, labelKey: 'mods' },
  { id: 'TARAYICI_GECMISI', key: 'browsers', target: 86, labelKey: 'browsers' },
  { id: 'USB_ANALIZI', key: 'usb', target: 91, labelKey: 'usb' },
  { id: 'MAKRO_KLIKER', key: 'macros', target: 96, labelKey: 'macros' },
  { id: 'PYTHON_HILELERI', key: 'python', target: 99, labelKey: 'python' }
];

const ALL_HUD_KEYS = ['bypass', 'memory', 'usn', 'prefetch', 'mods', 'browsers', 'usb', 'macros', 'python'];

const STAGE_TO_KEY = {
  'BYPASS_ANALIZI': 'bypass',
  'KOD_BUTUNLUGU': 'bypass',
  'AG_ANALIZI': 'bypass',
  'SERTIFIKA_ONBELLEGI': 'bypass',
  'POWERSHELL_ANALIZI': 'bypass',
  'BELLEK_TARAMASI': 'memory',
  'SURECGIZLEME_ANALIZI': 'memory',
  'LDPRELOAD_ANALIZI': 'memory',
  'UYGULAMA_COKMELERI': 'memory',
  'PENCERE_GIZLEME': 'memory',
  'USN_JOURNAL': 'usn',
  'GERI_DONUSUM': 'usn',
  'PREFETCH_BAM': 'prefetch',
  'SRUM_ANALIZI': 'prefetch',
  'GOREV_ANALIZI': 'prefetch',
  'TEMIZLIK_KONTROLU': 'prefetch',
  'GUVENLIK_ANALIZI': 'prefetch',
  'MINECRAFT_MODLARI': 'mods',
  'MINECRAFT_LOGLARI': 'mods',
  'DERIN_ARSIV_TARAMASI': 'mods',
  'TARAYICI_GECMISI': 'browsers',
  'DISCORD_ANALIZI': 'browsers',
  'USB_ANALIZI': 'usb',
  'MAKRO_KLIKER': 'macros',
  'PYTHON_HILELERI': 'python'
};

function getStageKeyForFinding(f, stage) {
  if (stage && STAGE_TO_KEY[stage]) return STAGE_TO_KEY[stage];
  const t = ((f && f.type) || '').toUpperCase();
  const c = ((f && f.category) || '').toUpperCase();
  const p = ((f && f.path) || '').toLowerCase();
  
  if (c.includes('MINECRAFT') || c.includes('MOD') || c.includes('CLIENT') || c.includes('CHEAT') || t.includes('MOD') || t.includes('JAR') || t.includes('RAVEN') || t.includes('TROJAN') || t.includes('ZORTAX') || t.includes('DO_DO') || p.endsWith('.jar')) {
    return 'mods';
  }
  if (t.includes('MEMORY') || t.includes('GHOST') || t.includes('INJECT') || t.includes('HOLLOW') || t.includes('LDPRELOAD')) {
    return 'memory';
  }
  if (t.includes('USN') || t.includes('RECYCLE') || t.includes('TRASH') || t.includes('UNLINKED')) {
    return 'usn';
  }
  if (t.includes('PREFETCH') || t.includes('BAM') || t.includes('SHIMCACHE') || t.includes('PCA') || t.includes('SRUM') || t.includes('DEFENDER') || t.includes('TASK')) {
    return 'prefetch';
  }
  if (t.includes('BROWSER') || t.includes('DOWNLOAD') || t.includes('DISCORD')) {
    return 'browsers';
  }
  if (t.includes('USB') || t.includes('STORAGE')) {
    return 'usb';
  }
  if (t.includes('MACRO') || t.includes('AUTOCLICKER')) {
    return 'macros';
  }
  if (t.includes('PYTHON')) {
    return 'python';
  }
  return 'bypass';
}

document.addEventListener('DOMContentLoaded', () => {
  const bgVid = document.querySelector('.bg-video');
  if (bgVid) {
    bgVid.addEventListener('error', () => {
      bgVid.style.display = 'none';
    });
  }
  initLanguage();
  initTabs();
  initWebSocket();
  initActionButtons();
  initKeyboardShortcuts();
});

// Language Initialization & Switching
function initLanguage() {
  const selector = document.getElementById('languageSelect');
  if (selector) {
    selector.value = currentLang;
    selector.addEventListener('change', (e) => {
      setLanguage(e.target.value);
    });
  }
  applyLanguage(currentLang);
}

function setLanguage(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  try {
    localStorage.setItem('atlas_ac_lang', lang);
  } catch (e) {}

  const selector = document.getElementById('languageSelect');
  if (selector && selector.value !== lang) {
    selector.value = lang;
  }

  applyLanguage(lang);

  if (currentScanData) {
    renderFullResults(currentScanData);
  }
}

function applyLanguage(lang) {
  const dict = translations[lang] || translations.en;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  const dashVerdict = document.getElementById('dashVerdict');
  if (dashVerdict) {
    if (!isScanActive && !currentScanData) {
      dashVerdict.textContent = dict.verdict_standby;
      dashVerdict.className = 'stat-val standby';
    } else if (isScanActive) {
      if (liveCriticalCount > 0) {
        dashVerdict.textContent = dict.verdict_flagged;
        dashVerdict.className = 'stat-val crit';
      } else if (liveHighCount > 0) {
        dashVerdict.textContent = dict.verdict_suspicious;
        dashVerdict.className = 'stat-val warn';
      } else {
        dashVerdict.textContent = dict.verdict_scanning;
        dashVerdict.className = 'stat-val info';
      }
    }
  }

  // Update empty state text if no findings yet and scan is idle
  const dashList = document.getElementById('dashFindingsList');
  if (dashList && !currentScanData && !isScanActive) {
    const empty = dashList.querySelector('.empty-state-text');
    if (empty) empty.textContent = dict.dash_empty;
  }
}

// Sidebar Tab Switching
function initTabs() {
  const tabs = document.querySelectorAll('.nav-item');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPane = document.getElementById(target);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeHud();
    }
  });
}

// WebSocket Connection & Real-time Event Handling
function initWebSocket() {
  let wsUrl;
  try {
    const isHttps = window.location.protocol === 'https:';
    const host = (window.location.host && window.location.host.trim().length > 0)
      ? window.location.host
      : '127.0.0.1:3317';
    wsUrl = `${isHttps ? 'wss:' : 'ws:'}//${host}/ws`;
  } catch (e) {
    wsUrl = 'ws://127.0.0.1:3317/ws';
  }

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      logTerminal('INFO', 'Atlas AC Telemetry Engine connected to server.');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleServerMessage(msg);
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };

    ws.onclose = () => {
      setTimeout(initWebSocket, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };
  } catch (err) {
    console.error('WS Connection error:', err);
  }
}

// Dispatch Server Messages
function handleServerMessage(msg) {
  if (msg.type === 'PROGRESS') {
    handleProgressUpdate(msg);
  } else if (msg.type === 'SCAN_COMPLETE') {
    handleScanComplete(msg.data);
  } else if (msg.type === 'UPDATE_RESULT') {
    logTerminal('INFO', msg.message);
  } else if (msg.type === 'EXPORT_RESULT') {
    const status = document.getElementById('exportStatusMsg');
    const t = translations[currentLang] || translations.en;
    const reportUrl = msg.url || '/api/report/latest';
    if (status) {
      status.innerHTML = `
        ${t.report_saved_msg} <br>
        <code style="color: var(--chroma-cyan); font-size: 13px;">${escapeHtml(msg.path)}</code>
        <div style="margin-top: 10px;">
          <a href="${reportUrl}" target="_blank" class="btn-open-report">${currentLang === 'tr' ? 'Raporu Tarayıcıda Aç' : 'Open Report in Browser'} &rarr;</a>
        </div>
      `;
    }
    logTerminal('SUCCESS', `Report saved: ${msg.path}`);
  }
}

let animFrameId = null;
let liveCriticalCount = 0;
let liveHighCount = 0;
const liveFindingKeys = new Set();

// Start Live Smooth Progress Animation Loop with requestAnimationFrame (Low CPU)
function startProgressAnimation() {
  isScanActive = true;
  currentPercent = 0;
  targetPercent = 4;
  scannedObjectsCount = 0;
  liveCriticalCount = 0;
  liveHighCount = 0;
  liveFindingKeys.clear();

  const btnShowHud = document.getElementById('btnShowHud');
  if (btnShowHud) {
    btnShowHud.classList.add('scanning-active');
  }

  const btnScan = document.getElementById('btnStartScan');
  if (btnScan) {
    btnScan.disabled = false;
    btnScan.textContent = currentLang === 'tr' ? 'Taramayı Görüntüle' : 'View Running Scan';
  }

  if (animFrameId) cancelAnimationFrame(animFrameId);

  const percentEl = document.getElementById('hudProgressPercent');
  const ringCircle = document.getElementById('hudProgressRingCircle');
  const objectsEl = document.getElementById('hudObjectsCount');
  const tickerText = document.getElementById('hudTickerText');
  const t = translations[currentLang] || translations.en;

  if (tickerText) {
    tickerText.textContent = t.hud_calibrating || 'Initializing inspection modules...';
  }

  if (objectsEl) {
    objectsEl.textContent = `0 ${t.objects}`;
  }

  let lastDrawnPercent = -1;
  const updateLoop = () => {
    if (!isScanActive) return;

    if (currentPercent < targetPercent) {
      const diff = targetPercent - currentPercent;
      currentPercent += Math.max(0.08, diff * 0.08);
      if (currentPercent > targetPercent) currentPercent = targetPercent;
    }

    const intVal = Math.min(Math.floor(currentPercent), 100);
    if (intVal !== lastDrawnPercent) {
      lastDrawnPercent = intVal;
      if (percentEl) percentEl.textContent = intVal;
      if (ringCircle) {
        const offset = CIRCUMFERENCE - (intVal / 100) * CIRCUMFERENCE;
        ringCircle.style.strokeDashoffset = offset;
      }
    }

    animFrameId = requestAnimationFrame(updateLoop);
  };
  animFrameId = requestAnimationFrame(updateLoop);
}

// Real-Time Progress Updater from Server
function handleProgressUpdate(msg) {
  const hudActiveLbl = document.getElementById('hudActiveStepLabel');
  const tickerText = document.getElementById('hudTickerText');
  const objectsEl = document.getElementById('hudObjectsCount');
  const t = translations[currentLang] || translations.en;

  if (typeof msg.percent === 'number') {
    targetPercent = Math.max(targetPercent, msg.percent);
  }

  if (typeof msg.objectsCount === 'number') {
    scannedObjectsCount = msg.objectsCount;
    if (objectsEl) {
      objectsEl.textContent = `${scannedObjectsCount.toLocaleString('en-US')} ${t.objects}`;
    }
  }

  if (msg.target) {
    if (tickerText) {
      tickerText.textContent = msg.target;
    }
  }

  const currentKey = STAGE_TO_KEY[msg.stage];
  if (currentKey) {
    if (hudActiveLbl) {
      hudActiveLbl.textContent = msg.log || `${t.hud_scanning} (${currentKey})`;
    }
    advanceHudStep(currentKey);
  } else if (msg.log && hudActiveLbl) {
    hudActiveLbl.textContent = msg.log;
  }

  if (msg.log) {
    logTerminal('INFO', msg.log);
  }

  if (msg.finding) {
    const f = msg.finding;
    const isThreat = f.level === 'CRITICAL' || f.severity === 'CRITICAL';
    const isSuspicious = f.level === 'HIGH' || f.severity === 'HIGH';

    const targetHudKey = getStageKeyForFinding(f, msg.stage);
    if (targetHudKey && (isThreat || isSuspicious)) {
      flaggedStages.add(targetHudKey);
      markStepFlagged(targetHudKey, isThreat ? t.hud_threat : t.hud_suspicious);
    }

    const loc = getLocalizedFinding(f, currentLang);
    if (isThreat) {
      logTerminal('CRITICAL', `[TEHDİT] ${loc.name}: ${loc.description}`);
    } else if (isSuspicious) {
      logTerminal('WARN', `[ŞÜPHELİ] ${loc.name}: ${loc.description}`);
    }

    renderLiveFindingCard(f);
  }
}

function advanceHudStep(currentKey) {
  if (!currentKey) return;
  const t = translations[currentLang] || translations.en;
  const card = document.getElementById(`stepCard-${currentKey}`);
  const state = document.getElementById(`stepState-${currentKey}`);
  if (!card || !state) return;

  // Never overwrite an already flagged threat/suspicious state
  if (flaggedStages.has(currentKey)) return;

  // While scan is running, only set to active/scanning — NEVER clean prematurely!
  card.className = 'step-card active';
  state.textContent = t.hud_scanning;
}

function markStepFlagged(key, label) {
  const card = document.getElementById(`stepCard-${key}`);
  const state = document.getElementById(`stepState-${key}`);
  if (card) card.className = 'step-card flagged';
  if (state) state.textContent = label;
}

// Scan Complete Handler
function handleScanComplete(data) {
  currentScanData = data;
  targetPercent = 100;
  const t = translations[currentLang] || translations.en;

  const finishWait = setInterval(() => {
    if (currentPercent >= 99) {
      clearInterval(finishWait);
      isScanActive = false;
      if (progressInterval) clearInterval(progressInterval);

      const percentEl = document.getElementById('hudProgressPercent');
      const ringCircle = document.getElementById('hudProgressRingCircle');
      const hudActiveLbl = document.getElementById('hudActiveStepLabel');
      const tickerText = document.getElementById('hudTickerText');
      const objectsEl = document.getElementById('hudObjectsCount');

      if (percentEl) percentEl.textContent = '100';
      if (ringCircle) ringCircle.style.strokeDashoffset = '0';
      if (hudActiveLbl) hudActiveLbl.textContent = t.hud_complete;
      if (tickerText) tickerText.innerHTML = `<span style="color: var(--threat-clean); font-weight: 700;">${t.hud_finished_ticker}</span>`;
      if (typeof data.scannedObjects === 'number' && objectsEl) {
        objectsEl.textContent = `${data.scannedObjects.toLocaleString('en-US')} ${t.objects}`;
      }

      // Only now at 100% scan completion, mark unflagged cards as clean
      ALL_HUD_KEYS.forEach(key => {
        if (!flaggedStages.has(key)) {
          const card = document.getElementById(`stepCard-${key}`);
          const state = document.getElementById(`stepState-${key}`);
          if (card) card.className = 'step-card complete';
          if (state) state.textContent = t.hud_clean;
        }
      });

      const totalFindings = (data.allFindings || []).length;
      logTerminal('SUCCESS', `Inspection complete. Analyzed findings count: ${totalFindings}.`);

      if (data.autoReportPath) {
        logTerminal('SUCCESS', `Report automatically generated: ${data.autoReportPath}`);
      }

      renderFullResults(data);

      setTimeout(() => {
        const hudModal = document.getElementById('scanModalHud');
        if (hudModal) {
          hudModal.classList.remove('active');
        }
        const btnShowHud = document.getElementById('btnShowHud');
        if (btnShowHud) {
          btnShowHud.classList.remove('scanning-active');
        }
        const btnScan = document.getElementById('btnStartScan');
        if (btnScan) {
          btnScan.disabled = false;
          btnScan.textContent = currentLang === 'tr' ? 'Yeniden Tara' : 'Start Full Scan';
        }
      }, 1200);
    }
  }, 40);
}

function openHud() {
  const hudModal = document.getElementById('scanModalHud');
  if (hudModal) {
    hudModal.classList.add('active');
  }
}

function closeHud() {
  const hudModal = document.getElementById('scanModalHud');
  if (hudModal && hudModal.classList.contains('active')) {
    hudModal.classList.remove('active');
  }
}

function initActionButtons() {
  const btnScan = document.getElementById('btnStartScan');
  if (btnScan) {
    btnScan.addEventListener('click', () => {
      // If scan is already running, clicking re-opens the Scan HUD view!
      if (isScanActive) {
        openHud();
        return;
      }

      flaggedStages.clear();
      resetHudCards();
      clearFindings();
      openHud();
      startProgressAnimation();

      logTerminal('INFO', 'Full client integrity inspection initiated...');
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'START_SCAN' }));
      }
    });
  }

  const btnShowHud = document.getElementById('btnShowHud');
  if (btnShowHud) {
    btnShowHud.addEventListener('click', openHud);
  }

  const btnCloseHud = document.getElementById('btnCloseHud');
  if (btnCloseHud) {
    btnCloseHud.addEventListener('click', closeHud);
  }

  const hudModal = document.getElementById('scanModalHud');
  if (hudModal) {
    hudModal.addEventListener('click', (e) => {
      if (e.target === hudModal) {
        closeHud();
      }
    });
  }

  const btnExport = document.getElementById('btnExportReport');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'EXPORT_REPORT' }));
      }
    });
  }

  const btnShutdown = document.getElementById('btnShutdownApp');
  if (btnShutdown) {
    btnShutdown.addEventListener('click', () => {
      const isTr = currentLang === 'tr';
      const msg = isTr 
        ? 'Atlas AC uygulamasını kapatmak ve arka plan sürecini sonlandırmak istiyor musunuz?' 
        : 'Do you want to shut down Atlas AC and terminate the background process?';
      if (confirm(msg)) {
        fetch('/api/shutdown', { method: 'POST' }).catch(() => {});
        if (ws && ws.readyState === WebSocket.OPEN) {
          try { ws.send(JSON.stringify({ action: 'SHUTDOWN' })); } catch (e) {}
        }
        document.body.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#ffffff;background:#050810;text-align:center;padding:24px;">
            <div style="width:64px;height:64px;border-radius:50%;background:rgba(0,240,255,0.1);border:1px solid #00f0ff;display:flex;align-items:center;justify-content:center;margin-bottom:20px;box-shadow:0 0 24px rgba(0,240,255,0.3);">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
            </div>
            <h2 style="color:#ffffff;font-size:24px;font-weight:700;margin-bottom:10px;letter-spacing:0.5px;">${isTr ? 'Atlas AC Başarıyla Kapatıldı' : 'Atlas AC Successfully Shut Down'}</h2>
            <p style="color:#a0aec0;font-size:14px;max-width:440px;line-height:1.6;margin-bottom:16px;">${isTr ? 'Sunucu ve tarama süreçleri güvenli biçimde sonlandırıldı. Bu tarayıcı sekmesini kapatabilirsiniz.' : 'Server and forensic background processes have been safely terminated. You can now close this browser tab.'}</p>
          </div>
        `;
      }
    });
  }
}

function resetHudCards() {
  const t = translations[currentLang] || translations.en;
  const percentEl = document.getElementById('hudProgressPercent');
  const ringCircle = document.getElementById('hudProgressRingCircle');
  const hudActiveLbl = document.getElementById('hudActiveStepLabel');
  const objectsEl = document.getElementById('hudObjectsCount');
  const tickerText = document.getElementById('hudTickerText');

  if (percentEl) percentEl.textContent = '0';
  if (ringCircle) ringCircle.style.strokeDashoffset = String(CIRCUMFERENCE);
  if (hudActiveLbl) hudActiveLbl.textContent = t.hud_init;
  if (objectsEl) objectsEl.textContent = `0 ${t.objects}`;
  if (tickerText) tickerText.textContent = t.hud_calibrating;

  ALL_HUD_KEYS.forEach(key => {
    const card = document.getElementById(`stepCard-${key}`);
    const state = document.getElementById(`stepState-${key}`);
    if (card) card.className = 'step-card';
    if (state) state.textContent = t.hud_standby;
  });
}

function clearFindings() {
  const t = translations[currentLang] || translations.en;
  const placeholderHtml = `<div class="scanning-live-placeholder"><div class="live-scanning-pulse"></div><span>${t.scanning_in_progress}</span></div>`;

  const dashList = document.getElementById('dashFindingsList');
  if (dashList) dashList.innerHTML = placeholderHtml;

  const autoContainer = document.getElementById('autoReportContainer');
  if (autoContainer) autoContainer.innerHTML = '';

  const tabLists = ['bypassList', 'usnList', 'prefetchList', 'minecraftList', 'browsersList', 'usbList', 'macrosList'];
  tabLists.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = placeholderHtml;
  });

  const dashCrit = document.getElementById('dashCritical');
  const dashHigh = document.getElementById('dashHigh');
  const dashJars = document.getElementById('dashJars');
  const dashVerdict = document.getElementById('dashVerdict');

  if (dashCrit) dashCrit.textContent = '0';
  if (dashHigh) dashHigh.textContent = '0';
  if (dashJars) dashJars.textContent = '0';
  if (dashVerdict) {
    dashVerdict.textContent = t.verdict_scanning;
    dashVerdict.className = 'stat-val info';
  }
}

function getLocalizedFinding(f, lang) {
  if (lang !== 'tr') {
    return {
      name: f.name || f.type || 'Detection Entry',
      description: f.description || f.reason || '',
      confidence: f.confidence || '',
      evidence: f.evidence || null
    };
  }

  // Turkish localization
  let name = f.name || f.type || 'Denetim Kaydı';
  let desc = f.description_tr || f.description || f.reason || '';
  let conf = f.confidence || '';
  let evidence = f.evidence;

  // 1. Localize Name
  const NAME_MAP_TR = {
    'TROJAN_TRIGGERBOT_MOD': 'Truva Atı TriggerBot Modu',
    'DISGUISED_JAR_FILE': 'Gizlenmiş JAR Dosyası',
    'SPOTIFY_DLL_HIJACK': 'Spotify DLL Ele Geçirme (SpotX Bypası)',
    'SPOTIFY_MODIFIED_CHROME_ELF': 'Spotify Modifiye chrome_elf.dll Enjeksiyonu',
    'UNLINKED_ACTIVE_MEMORY_FILE': 'Bellekte Aktif Tutulan Silinmiş Hile',
    'DELETED_CHEAT_IN_LINUX_TRASH': 'Çöp Kutusunda Silinmiş Hile Dosyası',
    'USN_JOURNAL_DELETED_CHEAT': 'USN Günlüğü Silinen Hile Kaydı',
    'USN_JOURNAL_PURGED': 'USN Değişiklik Günlüğü Silinmiş',
    'BROWSER_CHEAT_FILE_DOWNLOADED': 'Tarayıcıdan İndirilen Hile Dosyası',
    'BROWSER_CHEAT_DOMAIN_VISITED': 'Ziyaret Edilen Hile Web Sitesi',
    'DISCORD_CHEAT_DOWNLOAD': 'Discord Üzerinden İndirilen Hile',
    'RUNNING_PYTHON_CHEAT_PROCESS': 'Aktif Harici Python Hile Süreci',
    'EXTERNAL_PYTHON_CLICKER_SCRIPT': 'Harici Python Tıklayıcı Betiği',
    'PYINSTALLER_TEMP_DIR': 'PyInstaller Geçici Çalıştırma Klasörü',
    'ACTIVE_AUTOCLICKER_PROCESS': 'Aktif AutoClicker Süreci',
    'AUTOCLICKER_MACRO_CONFIG': 'Donanım Tıklayıcı / Makro Yapılandırması',
    'INJECTED_SO_LIBRARY_IN_JAVA': 'Java\'ya Enjekte Edilmiş Paylaşımlı Kütüphane (.so)',
    'INJECTED_JAVAAGENT': 'Yetkisiz -javaagent Baytkod Kancası',
    'JVM_AGENT_ATTACHED': 'Java Sürecine Bağlanmış -javaagent Kancası',
    'LINUX_EXECUTED_CHEAT': 'Terminal Geçmişi Hile Çalıştırma İzi',
    'BAM_EXECUTION_RECORD': 'Windows BAM Hile Çalıştırma Kaydı',
    'PREFETCH_WIPED': 'Prefetch Dosyaları Kasıtlı Silinmiş',
    'SECURITY_LOG_CLEARED': 'Güvenlik Olay Günlüğü Temizlenmiş (1102)',
    'LINUX_TAINTED_KERNEL': 'Çekirdek Lekelenmiş (İmzasız Modül)',
    'LINUX_VULNERABLE_DRIVER': 'Savunmasız Çekirdek Sürücüsü (BYOVD)',
    'VULNERABLE_KERNEL_DRIVER': 'Bellekte Yüklü Savunmasız Çekirdek Sürücüsü',
    'TESTSIGNING_ENABLED': 'Windows Test İmzalama Modu Açık',
    'INTEGRITY_CHECKS_DISABLED': 'Sürücü Bütünlük Doğrulaması Devre Dışı',
    'DNS_CHEAT_AUTH_ACCESSED': 'DNS Önbelleğinde Hile Sunucusu Sorgusu',
    'NAMED_PIPE_INJECTION': 'Şüpheli Named Pipe Enjeksiyon Kanalı',
    'CHEAT_NAMED_PIPE_ACTIVE': 'Aktif Hile Named Pipe Kanalı',
    'HOSTS_ANTI_CHEAT_BLOCKED': 'Hosts Dosyası Anti-Cheat Engellemesi',
    'HOSTS_CHEAT_AUTH_REDIRECT': 'Hosts Dosyası Hile Yönlendirmesi',
    'ANTI_FORENSIC_COMMAND_RECORDED': 'Adli İz Silme / Temizlik Komutu',
    'PREFETCH_DIRECTORY_WIPED': 'Prefetch Dizini Kasten Temizlenmiş',
    'SECURITY_EVENT_LOG_PURGED': 'Windows Güvenlik Olay Günlüğü Silinmiş (1102)',
    'ACTIVE_CLEANER_TOOL_RUNNING': 'Aktif İz Silme / Temizleyici Araç',
    'SELF_DESTRUCT_SCRIPT_FOUND': 'Kendini Yok Eden (Self-Destruct) Betik',
    'RECYCLE_BIN_DELETED_CHEAT': 'Geri Dönüşüm Kutusuna Silinen Hile',
    'LINUX_TRASH_DELETED_CHEAT': 'Çöp Kutusuna Silinen Hile',
    'MUICACHE_CHEAT_RECORD': 'MuiCache Hile Çalıştırma Kaydı',
    'OPENSAVE_CHEAT_RECORD': 'Dosya İletişim Kutusu Hile Seçimi',
    'ARCHIVE_CHEAT_CLIENT_FOUND': 'Arşiv İçi Doğrulanmış Hile İstemcisi',
    'TROJAN_MOD_DETECTED': 'Truva Atı Baytkod Modu',
    'DISGUISED_EXECUTABLE': 'Gizlenmiş PE Çalıştırılabilir Dosyası (Yanıltıcı Uzantı)',
    'DISGUISED_EXECUTABLE_IN_JVM': 'Minecraft Belleğinde Gizlenmiş PE Modülü',
    'CHEAT_INJECTOR_PE': 'Minecraft Bellek Enjektörü / Hayalet Hile DLL',
    'AUTOCLICKER_BINARY': 'Müstakil AutoClicker / Fare Makro İkili Dosyası',
    'LEGITIMATE_OVERLAY_HOOK': 'Ekran Kaydedici / Oyun İçi Katman Kancası (Güvenli)',
    'LEGITIMATE_MINECRAFT_NATIVE': 'Minecraft Yerel Çalışma Zamanı Kütüphanesi (Güvenli)',
    'LEGITIMATE_MEDIA_CODEC': 'Sesli Sohbet Kodek Kütüphanesi (Güvenli)',
    'INJECTED_DLL_FROM_TEMP': 'Temp Dizininden Enjekte Edilmiş DLL',
    'KNOWN_CHEAT_DLL_LOADED': 'Bellekte Yüklü Bilinen Hile DLL Modülü',
    'RECENTLY_USED_CHEAT_FILE': 'Sistem Geçmişinde Hile Dosyası Erişimi',
    'JOURNAL_WIPE_TOOL_EXECUTED': 'Günlük Silme Aracı (FSUTIL) Çalıştırılmış',
    'Raven B Series': 'Raven B Serisi (Hayalet Hile)',
    'Doomsday Client': 'Doomsday Hile İstemcisi',
    'Aristois Client': 'Aristois Hile İstemcisi',
    'LiquidBounce Client': 'LiquidBounce Hile İstemcisi',
    'Wurst Client': 'Wurst Hile İstemcisi',
    'Meteor Client': 'Meteor Hile İstemcisi',
    'Impact Client': 'Impact Hile İstemcisi',
    'Inertia Client': 'Inertia Hile İstemcisi',
    'ThunderHack Client': 'ThunderHack Hile İstemcisi',
    'CatLean Client': 'CatLean Hile İstemcisi',
    'Ares Client': 'Ares Hile İstemcisi',
    'BleachHack Client': 'BleachHack Hile İstemcisi',
    'Vape Ghost Client': 'Vape Hayalet Hile İstemcisi',
    'Drip Ghost Client': 'Drip Hayalet Hile İstemcisi',
    'Slinky Client': 'Slinky Hile İstemcisi'
  };

  if (NAME_MAP_TR[f.name]) name = NAME_MAP_TR[f.name];
  else if (NAME_MAP_TR[f.type]) name = NAME_MAP_TR[f.type];

  // 2. Localize Description
  if (!f.description_tr && desc) {
    if (desc.includes('Forge 1.8.9 Ghost Client designed to bypass screenshares')) {
      desc = 'Keystrokesmod veya OptiFine taklidi yaparak ekran kontrollerini atlatmak için tasarlanmış Forge 1.8.9 Hayalet Hilesi.';
    } else if (desc.includes('Ghost and utility client with cloud config loading')) {
      desc = 'Bulut yapılandırma yükleme, bellek enjeksiyonu ve harici yükleyiciye sahip hayalet hile istemcisi.';
    } else if (desc.includes('Open source hacked client by CCBlueX')) {
      desc = 'CCBlueX tarafından geliştirilen betik motorlu, Forge ve Fabric destekli açık kaynak hile istemcisi.';
    } else if (desc.includes('Famous open source Fabric client by Alexander01998')) {
      desc = 'Alexander01998 tarafından geliştirilen ünlü açık kaynaklı Fabric hile istemcisi.';
    } else if (desc.includes('Modern Fabric utility client by Meteor Development')) {
      desc = 'Meteor Development tarafından geliştirilen modern Fabric hile istemcisi.';
    } else if (desc.includes('Multi-version client running on EMC')) {
      desc = 'Fabric ve Forge üzerinde EMC çatısı altında çalışan çok sürümlü hile istemcisi.';
    } else if (desc.includes('Anarchy and utility client by Brady3')) {
      desc = 'Brady3 ve ImpactDevelopment tarafından geliştirilen anarchy hile istemcisi.';
    } else if (desc.includes('Formerly WWE Client, developed by THEREALWWEFAN231')) {
      desc = 'THEREALWWEFAN231 tarafından geliştirilen eski WWE hile istemcisi.';
    } else if (desc.includes('Anarchy PvP client for 1.12.2 Forge and 1.20+ Fabric')) {
      desc = 'Pan4ur ve ThunderHack Ekibi tarafından 1.12.2 Forge ve 1.20+ Fabric için geliştirilen PvP hile istemcisi.';
    } else if (desc.includes('Kotlin-based Fabric hacked client derived from ThunderHack')) {
      desc = 'ThunderHack tabanlı, Aimbot, ESP ve Triggerbot içeren Kotlin Fabric hile istemcisi.';
    } else if (desc.includes('Anarchy utility mod created by Tigermouthbear')) {
      desc = 'Tigermouthbear tarafından geliştirilen anarchy hile modu.';
    } else if (desc.includes('Open source Fabric hacked client by BleachDev')) {
      desc = 'BleachDev tarafından geliştirilen açık kaynaklı Fabric hile istemcisi.';
    } else if (desc.includes('Commercial ghost client by Manthe')) {
      desc = 'Manthe tarafından geliştirilen, yerel DLL/JNI veya harici yükleyici ile enjekte edilen ticari hayalet hile.';
    } else if (desc.includes('Kernel-injected or native JNI ghost client')) {
      desc = 'Yerel web arayüz sunucusuna sahip, çekirdekten enjekte edilen veya yerel JNI hayalet hilesi.';
    } else if (desc.includes('High-end kernel / mapped ghost client')) {
      desc = 'Üst düzey çekirdek veya bellek haritalı hayalet hile istemcisi.';
    } else if (desc.includes('Disguised mod contains combat modules Reach & Velocity')) {
      desc = 'Gizlenmiş mod savaş modülleri (Reach ve Velocity) içeriyor.';
    } else if (desc.includes('Cheat file was deleted from disk but is still kept active in process memory by PID')) {
      desc = desc.replace(/Cheat file was deleted from disk but is still kept active in process memory by PID (\d+) since ([^:]+): (.*)/, 'Hile dosyası diskten silinmiş ancak PID $1 tarafından $2 tarihinden beri süreç belleğinde aktif tutuluyor: $3');
    } else if (desc.includes('Deleted cheat binary identified in system Trash on')) {
      desc = desc.replace(/Deleted cheat binary identified in system Trash on ([^:]+): (.*)/, 'Sistem çöp kutusunda $1 tarihinde silinmiş hile dosyası tespit edildi: $2');
    } else if (desc.includes('Deleted cheat file identified in NTFS USN Change Journal:')) {
      desc = desc.replace(/Deleted cheat file identified in NTFS USN Change Journal:\s*(.*)/, 'NTFS USN Değişiklik Günlüğünde silinmiş hile dosyası tespit edildi: $1');
    } else if (desc.includes('Cheat binary download recorded in')) {
      desc = desc.replace(/Cheat binary download recorded in (.*) on ([^:]+):\s*(.*)/, '$1 tarayıcısında $2 tarihinde hile dosyası indirme kaydı tespit edildi: $3');
    } else if (desc.includes('User visited cheat website in')) {
      desc = desc.replace(/User visited cheat website in (.*?):\s*(.*)/, 'Kullanıcı $1 tarayıcısında hile dağıtım sitesini ziyaret etmiş: $2');
    } else if (desc.includes('Direct cheat binary downloaded from Discord:')) {
      desc = desc.replace(/Direct cheat binary downloaded from Discord:\s*(.*)/, 'Discord üzerinden doğrudan indirilen hile dosyası tespit edildi: $1');
    } else if (desc.includes('Disguised Trojan Mod:')) {
      desc = desc.replace(/Disguised Trojan Mod:\s*(.*)/, 'Gizlenmiş Truva Atı Modu: $1');
    } else if (desc.includes('Disguised JAR file detected! Extension is')) {
      desc = desc.replace(/Disguised JAR file detected! Extension is '([^']+)', but file header contains ZIP magic bytes \(PK\\x03\\x04\)\. Cheats disguise themselves this way\./, 'Gizlenmiş JAR dosyası tespit edildi! Uzantı \'$1\', ancak dosya başlığı ZIP sihirli baytları (PK) içeriyor. Hileler kendilerini bu şekilde gizler.');
    } else if (desc.includes('Suspicious proxy DLL found inside Spotify directory:')) {
      desc = desc.replace(/Suspicious proxy DLL found inside Spotify directory:\s*([^.]+)\.dll\. Cheats use this to inject into Minecraft while pretending SpotX was installed\./, 'Spotify dizini içinde şüpheli proxy DLL bulundu: $1.dll. Hileler bunu SpotX kurulu gibi göstererek Minecraft\'a enjekte olmak için kullanır.');
    } else if (desc.includes("Spotify's chrome_elf.dll contains cheat injection code & Minecraft hooks!")) {
      desc = desc.replace(/Spotify's chrome_elf\.dll contains cheat injection code & Minecraft hooks!\s*(.*)/, 'Spotify\'ın chrome_elf.dll kütüphanesi hile enjeksiyon kodu ve Minecraft kancaları içeriyor! $1');
    } else if (desc.includes('Minecraft process (PID:') && desc.includes('launched with unauthorized -javaagent')) {
      desc = desc.replace(/Minecraft process \(PID:\s*(\d+)\) launched with unauthorized -javaagent bytecode injection hook!/, 'Minecraft süreci (PID: $1) yetkisiz -javaagent baytkod enjeksiyon kancasıyla başlatılmış!');
    } else if (desc.includes('Minecraft virtual memory contains injected shared library (.so) mapped from volatile storage')) {
      desc = desc.replace(/Minecraft virtual memory contains injected shared library \(\.so\) mapped from volatile storage \(\/tmp or \/dev\/shm\):\s*(.*)/, 'Minecraft sanal belleğinde geçici depolamadan (/tmp veya /dev/shm) eşlenmiş enjekte paylaşımlı kütüphane (.so) bulundu: $1');
    } else if (desc.includes('Linux terminal history confirms execution of cheat script/binary:')) {
      desc = desc.replace(/Linux terminal history confirms execution of cheat script\/binary:\s*(.*)/, 'Linux terminal geçmişi hile betiğinin/ikili dosyasının çalıştırıldığını doğruluyor: $1');
    } else if (desc.includes('Windows BAM execution cache confirms execution of cheat binary:')) {
      desc = desc.replace(/Windows BAM execution cache confirms execution of cheat binary:\s*(.*)/, 'Windows BAM çalıştırma önbelleği hile dosyasının çalıştırıldığını doğruluyor: $1');
    } else if (desc.includes('Direct cheat DLL module loaded in Minecraft memory:')) {
      desc = desc.replace(/Direct cheat DLL module loaded in Minecraft memory:\s*(.*)/, 'Minecraft belleğinde doğrudan yüklenmiş hile DLL modülü tespit edildi: $1');
    } else if (desc.includes('Minecraft has an injected DLL loaded directly from TEMP directory:')) {
      desc = desc.replace(/Minecraft has an injected DLL loaded directly from TEMP directory:\s*(.*)!/, 'Minecraft sürecinde doğrudan TEMP klasöründen yüklenmiş enjekte DLL bulundu: $1!');
    } else if (desc.includes('Recent cheat file access recorded in Linux system history:')) {
      desc = desc.replace(/Recent cheat file access recorded in Linux system history:\s*(.*)/, 'Linux sistem geçmişinde son erişilen hile dosyası kaydı tespit edildi: $1');
    } else if (desc.includes('Disguised PE executable detected: File has extension')) {
      desc = desc.replace(/Disguised PE executable detected: File has extension "([^"]+)" but contains valid Windows PE machine bytecode! (.*)/, 'Yanıltıcı uzantılı PE dosyası tespit edildi: Dosya "$1" uzantısına sahip olsa da geçerli Windows PE makine baytkodu içermektedir! Hileler tespit edilmemek için DLL/EXE ikili dosyalarını resim veya veri dosyası kılığına sokar.');
    } else if (desc.includes('Active Minecraft cheat binary / memory injector identified')) {
      desc = desc.replace(/Active Minecraft cheat binary \/ memory injector identified \(([^)]+)\):\s*(.*)/, 'Aktif Minecraft hile ikili dosyası / bellek enjektörü tespit edildi ($1): Hayalet hile rutinleri ve yetkisiz JVM baytkod kancaları içermektedir!');
    } else if (desc.includes('Standalone AutoClicker executable detected')) {
      desc = desc.replace(/Standalone AutoClicker executable detected \(([^)]+)\):\s*(.*)/, 'Müstakil AutoClicker ikili dosyası tespit edildi ($1): Düşük seviyeli fare tıklama simülasyon döngüleri içermektedir.');
    } else if (desc.includes('Disguised PE executable loaded into Minecraft javaw.exe:')) {
      desc = desc.replace(/Disguised PE executable loaded into Minecraft javaw\.exe:\s*(.*)/, 'Minecraft javaw.exe sürecine yüklenmiş yanıltıcı uzantılı PE çalıştırılabilir modülü: $1');
    } else if (desc.includes('Windows Test Signing Mode is ENABLED!')) {
      desc = 'Windows Test İmzalama Modu AKTİF! Bu durum imzasız çekirdek hile sürücülerinin yüklenmesine izin verir.';
    } else if (desc.includes('Windows Driver Integrity Checks are DISABLED!')) {
      desc = 'Windows Sürücü Bütünlük Doğrulaması DEVRE DIŞI!';
    } else if (desc.includes('Windows Security Event Log was intentionally cleared')) {
      desc = 'Windows Güvenlik Olay Günlüğü kasıtlı olarak temizlenmiş (Olay Kimliği 1102)!';
    } else if (desc.includes('Prefetch folder has suspiciously few entries')) {
      desc = desc.replace(/Prefetch folder has suspiciously few entries \((\d+) \.pf files\)\. The player likely cleared Prefetch to hide cheat executions!/, 'Prefetch klasöründe şüpheli derecede az girdi var ($1 .pf dosyası). Oyuncu hile çalıştırma izlerini gizlemek için Prefetch\'i temizlemiş olabilir!');
    } else if (desc.includes('Active External Python Cheat Process:')) {
      desc = desc.replace(/Active External Python Cheat Process:\s*(.*)/, 'Aktif Harici Python Hile Süreci: $1');
    } else if (desc.includes('Python cheat script found on disk:')) {
      desc = desc.replace(/Python cheat script found on disk:\s*(.*)/, 'Diskte harici Python hile betiği bulundu: $1');
    } else if (desc.includes('Active Linux mouse click simulator running in background:')) {
      desc = desc.replace(/Active Linux mouse click simulator running in background:\s*(.*)/, 'Arka planda çalışan aktif Linux fare tıklama simülatörü tespit edildi: $1');
    } else if (desc.includes('Active AutoClicker process detected:')) {
      desc = desc.replace(/Active AutoClicker process detected:\s*(.*)/, 'Aktif AutoClicker süreci tespit edildi: $1');
    } else if (desc.includes('Hardware macro configuration file detected:')) {
      desc = desc.replace(/Hardware macro configuration file detected:\s*(.*)/, 'Donanım makro yapılandırma dosyası tespit edildi: $1');
    } else if (desc.includes('Linux Kernel is TAINTED')) {
      desc = desc.replace(/Linux Kernel is TAINTED \(Flag:\s*(\d+)\)\. Out-of-tree or unsigned kernel modules have been loaded!/, 'Linux Çekirdeği LEKELENMİŞ (Bayrak: $1). Ağaç dışı veya imzasız çekirdek modülleri yüklenmiş!');
    } else if (desc.includes('Known vulnerable kernel module identified:')) {
      desc = desc.replace(/Known vulnerable kernel module identified:\s*(.*)/, 'Bilinen güvenlik açığı barındıran çekirdek modülü tespit edildi: $1');
    } else if (desc.includes('Vulnerable kernel driver loaded in memory:')) {
      desc = desc.replace(/Vulnerable kernel driver loaded in memory:\s*(.*)/, 'Bellekte yüklü savunmasız çekirdek sürücüsü tespit edildi: $1');
    } else if (desc.includes('Kernel driver (.sys) found inside User Temp directory:')) {
      desc = desc.replace(/Kernel driver \(\.sys\) found inside User Temp directory:\s*(.*)/, 'Kullanıcı Temp dizini içinde çekirdek sürücüsü (.sys) bulundu: $1');
    } else if (desc.includes('Windows DNS cache contains recent lookup for cheat server:')) {
      desc = desc.replace(/Windows DNS cache contains recent lookup for cheat server:\s*(.*)/, 'Windows DNS önbelleğinde hile sunucusu sorgusu tespit edildi: $1');
    } else if (desc.includes('Detected -javaagent or -Xbootclasspath attached to Minecraft javaw.exe process!')) {
      desc = 'Minecraft javaw.exe sürecine eklenmiş -javaagent veya -Xbootclasspath tespit edildi! Hileler baytkodu dinamik olarak kancalamak için bunu kullanır.';
    } else if (desc.includes('Detected suspicious cheat Named Pipe:')) {
      desc = desc.replace(/Detected suspicious cheat Named Pipe:\s*(.*)/, 'Şüpheli hile Named Pipe kanalı tespit edildi: $1');
    }
  }

  // 3. Localize Confidence
  if (conf) {
    if (conf.includes('Zero False Positive Verified')) conf = '%100 (Sıfır Hatalı Pozitif Doğrulandı)';
    else if (conf.includes('Browser Download Database Record')) conf = '%100 (Tarayıcı İndirme Veritabanı Kaydı)';
    else if (conf.includes('JVM Commandline Argument')) conf = '%100 (JVM Komut Satırı Doğrulandı)';
    else if (conf.includes('/proc/maps Memory Region')) conf = '%100 (/proc/maps Bellek Bölgesi Doğrulandı)';
    else if (conf.includes('Found in Linux Trash')) conf = '%100 (Linux Çöp Kutusunda Bulundu)';
    else if (conf.includes('Open /proc fd pointing to deleted file')) conf = '%100 (Silinmiş Dosyaya Açık FD)';
    else if (conf.includes('High (Linux Activity Record)')) conf = 'Yüksek (Linux Aktivite Kaydı)';
    else if (conf.includes('High (Binary Stream Match)')) conf = 'Yüksek (İkili Akış Eşleşmesi)';
    else if (conf.includes('High (Binary Match)')) conf = 'Yüksek (İkili Eşleşme)';
    else if (conf.includes('Static Bytecode Heuristic Analysis')) conf = '%100 (Statik Baytkod Sezgisel Analizi)';
    else if (conf.includes('100%')) conf = conf.replace('100%', '%100');
  }

  // 4. Localize Evidence
  if (evidence) {
    if (Array.isArray(evidence)) {
      evidence = evidence.map(ev => {
        return ev
          .replace(/^Target Path:/i, 'Hedef Dosya Yolu:')
          .replace(/^Download URL:/i, 'İndirme Bağlantısı:')
          .replace(/^Timestamp:/i, 'Zaman Damgası:')
          .replace(/^Unlinked Path:/i, 'Silinmiş Dosya Yolu:')
          .replace(/^Holding PID:/i, 'Çalıştıran PID:')
          .replace(/^Execution Timestamp:/i, 'Çalıştırma Zamanı:')
          .replace(/^Trash Storage:/i, 'Çöp Kutusu Konumu:')
          .replace(/^Deletion Timestamp:/i, 'Silinme Zamanı:')
          .replace(/^Original Path:/i, 'Orijinal Dosya Yolu:');
      });
    }
  }

  return { name, description: desc, confidence: conf, evidence };
}

function createFindingCardElement(f) {
  const t = translations[currentLang] || translations.en;
  const loc = getLocalizedFinding(f, currentLang);
  const level = (f.level || f.severity || 'INFO').toUpperCase();
  const cardClass = level === 'CRITICAL' ? 'threat-crit' : (level === 'HIGH' ? 'threat-warn' : 'threat-clean');
  const badgeClass = level === 'CRITICAL' ? 'crit' : (level === 'HIGH' ? 'warn' : 'clean');
  const levelLabel = level === 'CRITICAL' ? t.badge_critical : (level === 'HIGH' ? t.badge_high : t.badge_info);

  const card = document.createElement('div');
  card.className = `finding-card ${cardClass}`;

  const timestampValue = f.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19);
  const pathValue = f.path || f.url || 'System Memory';
  const isUrl = Boolean(f.url && !f.path);

  let metaRowsHtml = `
    <div class="finding-meta-row">
      <strong>${t.lbl_timestamp}:</strong>
      <span class="finding-time-tag">${escapeHtml(timestampValue)}</span>
    </div>
    <div class="finding-meta-row">
      <strong>${isUrl ? t.lbl_url : t.lbl_file_path}:</strong>
      <code class="finding-path-code">${escapeHtml(pathValue)}</code>
    </div>
  `;

  if (f.size) {
    metaRowsHtml += `
      <div class="finding-meta-row">
        <strong>${currentLang === 'tr' ? 'Dosya Boyutu' : 'File Size'}:</strong>
        <span class="finding-size-tag">${escapeHtml(f.size)}</span>
      </div>
    `;
  }

  if (loc.evidence) {
    const evidenceText = Array.isArray(loc.evidence) ? loc.evidence.join(' | ') : loc.evidence;
    metaRowsHtml += `
      <div class="finding-meta-row">
        <strong>${t.lbl_evidence}:</strong>
        <span>${escapeHtml(evidenceText)}</span>
      </div>
    `;
  }

  if (loc.confidence) {
    metaRowsHtml += `
      <div class="finding-meta-row">
        <strong>${t.lbl_confidence}:</strong>
        <span class="finding-conf-tag">${escapeHtml(loc.confidence)}</span>
      </div>
    `;
  }

  let guidanceHtml = '';
  const expl = (currentLang === 'tr' ? f.explanation : f.explanationEn) || f.explanation || f.explanationEn;
  if (expl) {
    guidanceHtml = `
      <div class="finding-guidance-container">
        ${expl.howItWorks ? `
          <div class="finding-guide-item guide-tactic">
            <div class="guide-header">${currentLang === 'tr' ? 'HİLECİLER NEDEN VE NASIL KULLANIR? (ÇALIŞMA YÖNTEMİ)' : 'WHY & HOW CHEATERS USE THIS TECHNIQUE'}</div>
            <div class="guide-body">${escapeHtml(expl.howItWorks)}</div>
          </div>
        ` : ''}
        ${expl.adminAction ? `
          <div class="finding-guide-item guide-action">
            <div class="guide-header">${currentLang === 'tr' ? 'YETKİLİ / ADMİN İNCELEME REHBERİ' : 'STAFF / ADMIN INSPECTION GUIDANCE'}</div>
            <div class="guide-body">${escapeHtml(expl.adminAction)}</div>
          </div>
        ` : ''}
        ${expl.whyConcrete ? `
          <div class="finding-guide-item guide-proof">
            <div class="guide-header">${currentLang === 'tr' ? 'SOMUT KANIT NİTELİĞİ VE 0 YANLIŞ ALARM GÜVENCESİ' : 'CONCRETE EVIDENCE & 0 FALSE-FLAG PROOF'}</div>
            <div class="guide-body">${escapeHtml(expl.whyConcrete)}</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  const isThreat = f.level === 'CRITICAL' || f.severity === 'CRITICAL';
  const whyReason = f.whyFlagged || (expl && expl.whyConcrete) || f.reason || (isThreat ? (currentLang === 'tr' ? 'Hile imzası, enjeksiyon kancası veya yetkisiz müdahale parametreleri tespit edildi.' : 'Unauthorized injection hook or cheat signature detected.') : (currentLang === 'tr' ? 'Şüpheli dosya veya süreç parametresi tespit edildi.' : 'Suspicious process or file parameter detected.'));

  const whyBoxHtml = `
    <div class="finding-why-flagged-box">
      <div class="why-flagged-header">
        <span class="why-icon">${isThreat ? '⚠️' : '🔍'}</span>
        <strong>${currentLang === 'tr' ? (isThreat ? 'NEDEN KRİTİK İŞARETLENDİ?' : 'NEDEN ŞÜPHELİYE ALINDI?') : (isThreat ? 'WHY FLAGGED AS CRITICAL?' : 'WHY FLAGGED AS SUSPICIOUS?')}</strong>
      </div>
      <div class="why-flagged-body">${escapeHtml(whyReason)}</div>
    </div>
  `;

  card.innerHTML = `
    <div class="finding-top">
      <span class="finding-title">${escapeHtml(loc.name)}</span>
      <span class="finding-badge ${badgeClass}">${levelLabel}</span>
    </div>
    <p class="finding-desc">${escapeHtml(loc.description)}</p>
    ${whyBoxHtml}
    <div class="finding-meta-list">
      ${metaRowsHtml}
    </div>
    ${guidanceHtml}
  `;
  return card;
}

function renderLiveFindingCard(f) {
  const findingId = `${f.type || ''}|${f.path || ''}|${f.name || ''}|${f.file || ''}`;
  if (liveFindingKeys.has(findingId)) return;
  liveFindingKeys.add(findingId);

  const isThreat = f.level === 'CRITICAL' || f.severity === 'CRITICAL';
  const isSuspicious = f.level === 'HIGH' || f.severity === 'HIGH';
  if (isThreat) liveCriticalCount++;
  else if (isSuspicious) liveHighCount++;

  const dashCrit = document.getElementById('dashCritical');
  const dashHigh = document.getElementById('dashHigh');
  const dashVerdict = document.getElementById('dashVerdict');
  const t = translations[currentLang] || translations.en;

  if (dashCrit) dashCrit.textContent = liveCriticalCount;
  if (dashHigh) dashHigh.textContent = liveHighCount;
  if (dashVerdict) {
    if (liveCriticalCount > 0) {
      dashVerdict.textContent = t.verdict_flagged;
      dashVerdict.className = 'stat-val crit';
    } else if (liveHighCount > 0) {
      dashVerdict.textContent = t.verdict_suspicious;
      dashVerdict.className = 'stat-val warn';
    }
  }

  const container = document.getElementById('dashFindingsList');
  if (container) {
    const placeholder = container.querySelector('.empty-state-text, .scanning-live-placeholder');
    if (placeholder) {
      container.removeChild(placeholder);
    }
    const card = createFindingCardElement(f);
    container.prepend(card);
  }

  // Also add live finding to categorized tabs
  addLiveFindingToTab(f);
}

function addLiveFindingToTab(f) {
  const t = (f.type || '').toUpperCase();
  const c = (f.category || '').toUpperCase();
  const p = (f.path || '').toLowerCase();

  const appendTo = (listId) => {
    const el = document.getElementById(listId);
    if (!el) return;
    const ph = el.querySelector('.empty-state-text, .scanning-live-placeholder');
    if (ph) el.removeChild(ph);
    el.prepend(createFindingCardElement(f));
  };

  const isBypass = t.includes('SPOTIFY') || t.includes('KERNEL') || t.includes('DNS') || t.includes('JVM') || t.includes('SECURITY_LOG') || t.includes('PREFETCH_WIPED') || c.includes('BYPASS');
  const isUsn = t.includes('USN') || t.includes('RECYCLE') || t.includes('TRASH') || t.includes('UNLINKED') || c.includes('DELETION');
  const isPrefetch = t.includes('PREFETCH') || t.includes('BAM') || t.includes('USERASSIST') || t.includes('RECENT') || t.includes('BASH_HISTORY') || t.includes('SELF_DESTRUCT') || t.includes('SHIMCACHE') || t.includes('LNK') || t.includes('PCA') || t.includes('WER') || t.includes('SRUM');
  const isMinecraft = c.includes('MINECRAFT') || c.includes('MOD') || c.includes('CLIENT') || c.includes('CHEAT') || t.includes('MOD') || t.includes('JAR') || t.includes('CONFIG') || t.includes('RAVEN') || t.includes('TROJAN') || t.includes('SIGNATURE') || t.includes('ARCHIVE') || t.includes('JVM') || t.includes('INJECTOR') || t.includes('DO_DO') || t.includes('ZORTAX') || p.endsWith('.jar');
  const isBrowser = t.includes('BROWSER') || t.includes('DOWNLOAD') || t.includes('HISTORY') || t.includes('DISCORD') || c.includes('BROWSER');
  const isUsb = t.includes('USB') || t.includes('DRIVE') || t.includes('STORAGE') || f.connectedStatus;
  const isMacro = t.includes('MACRO') || t.includes('AUTOCLICKER') || t.includes('CLICKER') || t.includes('PYTHON') || t.includes('PYINSTALLER');

  if (isBypass) appendTo('bypassList');
  if (isUsn) appendTo('usnList');
  if (isPrefetch) appendTo('prefetchList');
  if (isMinecraft) appendTo('minecraftList');
  if (isBrowser) appendTo('browsersList');
  if (isUsb) appendTo('usbList');
  if (isMacro) appendTo('macrosList');
}

function renderFullResults(data) {
  const t = translations[currentLang] || translations.en;
  const findings = data.allFindings || [];
  const critical = findings.filter(f => f.level === 'CRITICAL' || f.severity === 'CRITICAL').length;
  const high = findings.filter(f => f.level === 'HIGH' || f.severity === 'HIGH').length;

  const dashCrit = document.getElementById('dashCritical');
  const dashHigh = document.getElementById('dashHigh');
  const dashJars = document.getElementById('dashJars');
  const dashVerdict = document.getElementById('dashVerdict');

  if (dashCrit) dashCrit.textContent = critical;
  if (dashHigh) dashHigh.textContent = high;
  if (dashJars) dashJars.textContent = data.scannedJars || 0;

  if (dashVerdict) {
    if (critical > 0) {
      dashVerdict.textContent = t.verdict_flagged;
      dashVerdict.className = 'stat-val crit';
    } else if (high > 0) {
      dashVerdict.textContent = t.verdict_suspicious;
      dashVerdict.className = 'stat-val warn';
    } else {
      dashVerdict.textContent = t.verdict_clean;
      dashVerdict.className = 'stat-val safe';
    }
  }

  // Render Automatic Report Notification Banner
  const autoContainer = document.getElementById('autoReportContainer');
  if (autoContainer && data.autoReportPath) {
    autoContainer.innerHTML = `
      <div class="auto-report-alert">
        <div>
          <div class="auto-report-title">${t.auto_report_title}</div>
          <div class="auto-report-path">${escapeHtml(data.autoReportPath)}</div>
        </div>
      </div>
    `;
  }

  const status = document.getElementById('exportStatusMsg');
  if (status && data.autoReportPath) {
    status.innerHTML = `
      ${t.auto_report_title}: <br>
      <code style="color: var(--chroma-cyan); font-size: 13px;">${escapeHtml(data.autoReportPath)}</code>
      <div style="margin-top: 10px;">
        <a href="/api/report/latest" target="_blank" class="btn-open-report">${currentLang === 'tr' ? 'Raporu Tarayıcıda Aç' : 'Open Report in Browser'} &rarr;</a>
      </div>
    `;
  }

  // Populate Categorized Tabs with complete criteria
  populateTab('bypassList', findings.filter(f => f.type && (f.type.includes('SPOTIFY') || f.type.includes('KERNEL') || f.type.includes('DNS') || f.type.includes('JVM') || f.type.includes('SECURITY_LOG') || f.type.includes('PREFETCH_WIPED'))));
  populateTab('usnList', findings.filter(f => f.type && (f.type.includes('USN') || f.type.includes('RECYCLE') || f.type.includes('TRASH') || f.type.includes('UNLINKED'))));
  populateTab('prefetchList', findings.filter(f => f.type && (f.type.includes('PREFETCH') || f.type.includes('BAM') || f.type.includes('USERASSIST') || f.type.includes('RECENT') || f.type.includes('BASH_HISTORY') || f.type.includes('SELF_DESTRUCT') || f.type.includes('SHIMCACHE') || f.type.includes('LNK') || f.type.includes('PCA') || f.type.includes('WER') || f.type.includes('SRUM'))));
  populateTab('minecraftList', findings.filter(f =>
    (f.category && (f.category.includes('MINECRAFT') || f.category.includes('MOD') || f.category.includes('CLIENT') || f.category.includes('CHEAT'))) ||
    (f.type && (f.type.includes('MOD') || f.type.includes('JAR') || f.type.includes('CONFIG') || f.type.includes('RAVEN') || f.type.includes('TROJAN') || f.type.includes('SIGNATURE') || f.type.includes('ARCHIVE') || f.type.includes('JVM') || f.type.includes('INJECTOR') || f.type.includes('DO_DO') || f.type.includes('ZORTAX'))) ||
    (f.path && f.path.toLowerCase().endsWith('.jar'))
  ));
  populateTab('browsersList', findings.filter(f => f.type && (f.type.includes('BROWSER') || f.type.includes('DOWNLOAD') || f.type.includes('HISTORY') || f.type.includes('DISCORD'))));
  populateTab('usbList', findings.filter(f => (f.type && (f.type.includes('USB') || f.type.includes('DRIVE') || f.type.includes('STORAGE'))) || f.connectedStatus));
  populateTab('macrosList', findings.filter(f => f.type && (f.type.includes('MACRO') || f.type.includes('AUTOCLICKER') || f.type.includes('CLICKER') || f.type.includes('PYTHON') || f.type.includes('PYINSTALLER'))));

  const dashList = document.getElementById('dashFindingsList');
  if (dashList) {
    if (findings.length === 0) {
      dashList.innerHTML = `<p class="empty-state-text" style="color: var(--threat-clean); border-color: rgba(16, 185, 129, 0.3);">${t.clean_all}</p>`;
    } else {
      dashList.innerHTML = '';
      findings.forEach(f => {
        dashList.appendChild(createFindingCardElement(f));
      });
    }
  }
}

function populateTab(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const t = translations[currentLang] || translations.en;

  if (!items || items.length === 0) {
    if (isScanActive) {
      container.innerHTML = `<div class="scanning-live-placeholder"><div class="live-scanning-pulse"></div><span>${t.scanning_in_progress}</span></div>`;
    } else {
      container.innerHTML = `<p class="empty-state-text" style="color: var(--threat-clean); border-color: rgba(16, 185, 129, 0.3);">${t.clean_category}</p>`;
    }
    return;
  }

  container.innerHTML = '';
  items.forEach(f => {
    container.appendChild(createFindingCardElement(f));
  });
}

function logTerminal(level, text) {
  const terminal = document.getElementById('terminalConsole');
  if (!terminal) return;
  const now = new Date().toTimeString().split(' ')[0];

  let cls = 'term-info';
  if (level === 'CRITICAL') cls = 'term-crit';
  else if (level === 'WARN' || level === 'HIGH') cls = 'term-warn';
  else if (level === 'SUCCESS') cls = 'term-success';

  const line = document.createElement('div');
  line.style.marginBottom = '6px';
  line.innerHTML = `<span class="term-time">[${now}]</span> <span class="${cls}">[${level}]</span> <span>${escapeHtml(text)}</span>`;
  terminal.appendChild(line);

  // Keep DOM lean for low CPU
  while (terminal.childNodes.length > 150) {
    terminal.removeChild(terminal.firstChild);
  }
  terminal.scrollTop = terminal.scrollHeight;
}

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str || '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
