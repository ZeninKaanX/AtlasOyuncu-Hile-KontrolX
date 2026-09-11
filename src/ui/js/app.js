/**
 * Atlas AC - Client-side UI Controller & Telemetry Engine
 * Ocean-Style Dashboard aesthetic, polar radar dynamic geometry,
 * category explorer, subfiltering, continuous real-time progress interpolation,
 * SVG circular progress ring, live inspected file stream, bilingual i18n (EN/TR),
 * full timestamp/path forensic display, auto-report generation notification.
 */

// i18n Localization Dictionary
const translations = {
  en: {
    nav_overview: 'Dashboard',
    nav_scanner: 'Scanner HUD',
    nav_minecraft: 'Minecraft & Mods',
    nav_ai: 'AI Bytecode Engine',
    nav_bypass: 'Bypass & Injection',
    nav_usn: 'USN Deletion Log',
    nav_prefetch: 'Prefetch & BAM',
    nav_browsers: 'Browser Downloads',
    nav_usb: 'USB Storage',
    nav_macros: 'Macros & Clickers',
    nav_terminal: 'Live Telemetry',
    nav_export: 'Export Report',
    btn_hud_view: 'Scan View',
    btn_shutdown: 'Exit / Shut Down',
    btn_start_scan: 'Start Full Scan',
    hero_scan_results: 'Inspection Verdict',
    hero_scan_desc: 'AI & Modrinth Heuristic Verdict',
    meta_pin: 'Identity Pin',
    meta_duration: 'Scan Duration',
    panel_scan_overview: 'Scan Overview',
    status_realtime: 'Realtime active',
    stat_critical: 'Detections',
    stat_suspicious: 'Warnings',
    stat_scanned: 'Legit',
    stat_verdict: 'System Verdict',
    findings_title: 'Detection Results',
    dash_empty: 'No scan running. Click "Start Full Scan" above to initiate a comprehensive forensic client integrity inspection.',
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
    export_desc: 'Exports all detected findings, SHA-256 file hashes, timestamps, and integrity evidence directly to your Downloads folder as a self-contained HTML report.',
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
    badge_allowed: 'ALLOWED POLICY',
    lbl_timestamp: 'Timestamp',
    lbl_file_path: 'File Path',
    lbl_url: 'Target URL',
    lbl_evidence: 'Evidence',
    lbl_confidence: 'Confidence',
    verdict_standby: 'STANDBY',
    verdict_scanning: 'SCANNING...',
    verdict_clean: 'CLEAN',
    verdict_flagged: 'CHEATING',
    verdict_suspicious: 'SUSPICIOUS',
    scanning_in_progress: 'Analysis in progress... Live findings will appear immediately upon detection.',
    auto_report_title: 'Inspection Report Automatically Saved to Desktop',
    report_saved_msg: 'Inspection Report Saved Successfully:',
    why_flagged_crit: 'WHY FLAGGED AS CRITICAL THREAT?',
    why_flagged_warn: 'WHY FLAGGED AS SUSPICIOUS?',
    why_flagged_allowed: 'WHY MARKED AS ALLOWED / WHITELISTED?',
    guide_tactic_title: 'HOW CHEATERS USE THIS TECHNIQUE (MECHANISM)',
    guide_action_title: 'STAFF / ADMIN INSPECTION & BAN GUIDANCE',
    guide_concrete_title: 'CONCRETE EVIDENCE & 0 FALSE-FLAG PROOF'
  },
  tr: {
    nav_overview: 'Genel Bakış',
    nav_scanner: 'Tarama Ekranı',
    nav_minecraft: 'Minecraft ve Modlar',
    nav_ai: 'YZ Baytkod Motoru',
    nav_bypass: 'Bypass ve Enjeksiyon',
    nav_usn: 'USN Günlüğü',
    nav_prefetch: 'Prefetch ve BAM',
    nav_browsers: 'Tarayıcı İndirmeleri',
    nav_usb: 'USB Bellekler',
    nav_macros: 'Tıklayıcı ve Makrolar',
    nav_terminal: 'Canlı Telemetri',
    nav_export: 'Raporu Dışa Aktar',
    btn_hud_view: 'Tarama Ekranı',
    btn_shutdown: 'Çıkış / Kapat',
    btn_start_scan: 'Tam Taramayı Başlat',
    hero_scan_results: 'Denetim Kararı',
    hero_scan_desc: 'Yapay Zeka ve Modrinth Sezgisel Kararı',
    meta_pin: 'Kimlik Pini',
    meta_duration: 'Tarama Süresi',
    panel_scan_overview: 'Tarama Özeti',
    status_realtime: 'Gerçek zamanlı aktif',
    stat_critical: 'Tespitler',
    stat_suspicious: 'Uyarılar',
    stat_scanned: 'Güvenli',
    stat_verdict: 'Sistem Durumu',
    findings_title: 'Tespit Sonuçları',
    dash_empty: 'Tarama çalışmıyor. İstemci denetimini başlatmak için yukarıdaki "Tam Taramayı Başlat" butonuna tıklayın.',
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
    export_desc: 'Tespit edilen tüm bulguları, SHA-256 dosya özetlerini, zaman damgalarını ve bütünlük kanıtlarını doğrudan İndirilenler (Downloads) klasörünüze HTML raporu olarak kaydeder.',
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
    badge_allowed: 'SUNUCU İZNİ',
    lbl_timestamp: 'Zaman Damgası',
    lbl_file_path: 'Dosya Yolu',
    lbl_url: 'Hedef URL',
    lbl_evidence: 'Kanıt',
    lbl_confidence: 'Güvenilirlik',
    verdict_standby: 'BEKLEMEDE',
    verdict_scanning: 'TARANIYOR...',
    verdict_clean: 'TEMİZ',
    verdict_flagged: 'HİLE TESPİTİ',
    verdict_suspicious: 'ŞÜPHELİ',
    scanning_in_progress: 'Denetim sürüyor... Bulgular tespit edildikçe anında listelenecektir.',
    auto_report_title: 'Denetim Raporu Otomatik Olarak Masaüstüne Kaydedildi',
    report_saved_msg: 'Denetim Raporu Başarıyla Kaydedildi:',
    why_flagged_crit: 'NEDEN KRİTİK İŞARETLENDİ?',
    why_flagged_warn: 'NEDEN ŞÜPHELİYE ALINDI?',
    why_flagged_allowed: 'NEDEN İZİNLİ / SERBEST SAYILDI?',
    guide_tactic_title: 'HİLECİLER NEDEN VE NASIL KULLANIR? (ÇALIŞMA YÖNTEMİ)',
    guide_action_title: 'YETKİLİ / ADMİN İNCELEME VE CEZA REHBERİ',
    guide_concrete_title: 'SOMUT KANIT NİTELİĞİ VE 0 YANLIŞ ALARM GÜVENCESİ'
  }
};

let currentLang = 'tr';
try {
  const saved = localStorage.getItem('atlas_ac_lang');
  if (saved && (saved === 'tr' || saved === 'en')) {
    currentLang = saved;
  }
} catch (e) {}

// Global Session Identity Pin (Ocean-Style)
let sessionPin = '';
function generateSessionPin() {
  const chars = '0123456789ABCDEF';
  let pin = '';
  for (let i = 0; i < 8; i++) {
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pin;
}
sessionPin = generateSessionPin();

// State management
let ws = null;
let isScanActive = false;
let currentPercent = 0;
let targetPercent = 0;
let scannedObjectsCount = 0;
let progressInterval = null;
let currentScanData = null;
let scanStartTime = 0;
let scanDurationTimer = null;
const flaggedStages = new Set();

// Filtering state
let currentCategoryFilter = 'all';
let currentSubFilter = 'all';
let currentSearchQuery = '';

// SVG Circular Progress Constants
const RING_RADIUS = 95;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

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
  initPin();
  initLanguage();
  initTabs();
  initCategoryExplorer();
  initSearch();
  initWebSocket();
  initActionButtons();
  initKeyboardShortcuts();
  initPolarRadar(0, 0, 0);
  initSystemStats();
});

function initPin() {
  const heroPinBadge = document.getElementById('heroPinBadge');
  const topNavPinId = document.getElementById('topNavPinId');
  if (heroPinBadge) heroPinBadge.textContent = sessionPin;
  if (topNavPinId) topNavPinId.textContent = sessionPin;

  const btnCopyPin = document.getElementById('btnCopyPin');
  if (btnCopyPin) {
    btnCopyPin.addEventListener('click', () => {
      copyToClipboard(sessionPin, btnCopyPin);
    });
  }
}

function initSystemStats() {
  const isLinux = navigator.userAgent.includes('Linux');
  const osEl = document.getElementById('pcSystemOS');
  if (osEl) {
    osEl.textContent = isLinux ? 'Linux x86_64' : 'Windows 11 Pro (x64)';
  }
  const dateEl = document.getElementById('pcInstallDate');
  if (dateEl) {
    const d = new Date();
    dateEl.textContent = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}

// Language Initialization & Switching
function initLanguage() {
  const langBtn = document.getElementById('btnLangToggle');
  const langLabel = document.getElementById('currentLangLabel');
  if (langLabel) {
    langLabel.textContent = currentLang.toUpperCase();
  }
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      const nextLang = currentLang === 'tr' ? 'en' : 'tr';
      setLanguage(nextLang);
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

  const langLabel = document.getElementById('currentLangLabel');
  if (langLabel) {
    langLabel.textContent = lang.toUpperCase();
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
  const heroVerdictCard = document.getElementById('heroVerdictCard');
  if (dashVerdict) {
    if (!isScanActive && !currentScanData) {
      dashVerdict.textContent = dict.verdict_standby;
      if (heroVerdictCard) {
        heroVerdictCard.className = 'hero-verdict-banner verdict-state-standby';
      }
    } else if (isScanActive) {
      if (liveCriticalCount > 0) {
        dashVerdict.textContent = dict.verdict_flagged;
        if (heroVerdictCard) heroVerdictCard.className = 'hero-verdict-banner';
      } else if (liveHighCount > 0) {
        dashVerdict.textContent = dict.verdict_suspicious;
        if (heroVerdictCard) heroVerdictCard.className = 'hero-verdict-banner';
      } else {
        dashVerdict.textContent = dict.verdict_scanning;
        if (heroVerdictCard) heroVerdictCard.className = 'hero-verdict-banner verdict-state-standby';
      }
    }
  }

  const dashList = document.getElementById('dashFindingsList');
  if (dashList && !currentScanData && !isScanActive) {
    const empty = dashList.querySelector('.empty-state-card p');
    if (empty) empty.textContent = dict.dash_empty;
  }
}

// Sidebar Tab Switching
function initTabs() {
  const tabs = document.querySelectorAll('.nav-btn[data-tab]');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');

      if (target === 'hud') {
        openHud();
        return;
      }

      if (target === 'ai_opinion') {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        panes.forEach(p => p.classList.remove('active'));
        const dashPane = document.getElementById('pane-dashboard');
        if (dashPane) dashPane.classList.add('active');
        setCategoryFilter('ai');
        return;
      }

      const targetPaneId = (target === 'dashboard') ? 'pane-dashboard' : `pane-${target}`;
      const targetPane = document.getElementById(targetPaneId);

      if (targetPane) {
        tabs.forEach(t => t.classList.remove('active'));
        panes.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        targetPane.classList.add('active');
      }
    });
  });
}

// Category Explorer & Subfiltering
function initCategoryExplorer() {
  const catBtns = document.querySelectorAll('.cat-btn[data-filter]');
  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');
      setCategoryFilter(filter);
    });
  });

  const subfilterBtns = document.querySelectorAll('.filter-pill-btn[data-subfilter]');
  subfilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      subfilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSubFilter = btn.getAttribute('data-subfilter');
      applyFindingsFilter();
    });
  });

  const btnCopyAll = document.getElementById('btnCopyAllFindings');
  if (btnCopyAll) {
    btnCopyAll.addEventListener('click', () => {
      copyFindingsReport(btnCopyAll);
    });
  }
}

function setCategoryFilter(filter) {
  currentCategoryFilter = filter;
  const catBtns = document.querySelectorAll('.cat-btn[data-filter]');
  catBtns.forEach(b => {
    if (b.getAttribute('data-filter') === filter) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });

  const titleEl = document.getElementById('activeCategoryTitle');
  if (titleEl) {
    const isTr = currentLang === 'tr';
    const titles = {
      'all': isTr ? 'Tüm Bulgular' : 'All Findings',
      'minecraft': isTr ? 'Minecraft & Mod Bulguları' : 'Minecraft & Mod Findings',
      'ai': isTr ? 'Yapay Zeka & Baytkod Analizi' : 'AI & Bytecode Opinions',
      'integrity': isTr ? 'Sistem Bütünlüğü & Bypass' : 'Integrity & Bypass Logs',
      'suspicious': isTr ? 'Şüpheli & Makro İzleri' : 'Suspicious & Macro Logs'
    };
    titleEl.textContent = titles[filter] || (isTr ? 'Bulgular' : 'Findings');
  }

  applyFindingsFilter();
}

function initSearch() {
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.toLowerCase().trim();
      applyFindingsFilter();
    });
  }

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (searchInput) searchInput.focus();
    }
  });
}

function applyFindingsFilter() {
  if (!currentScanData || !currentScanData.allFindings) return;
  const findings = currentScanData.allFindings;
  const filtered = filterFindingsArray(findings, currentCategoryFilter, currentSubFilter, currentSearchQuery);
  renderFindingsToContainer('dashFindingsList', filtered);
}

function filterFindingsArray(findings, category, subfilter, query) {
  return findings.filter(f => {
    if (category === 'minecraft') {
      if (!isMinecraftFinding(f)) return false;
    } else if (category === 'ai') {
      if (!isAiFinding(f)) return false;
    } else if (category === 'integrity') {
      if (!isIntegrityFinding(f)) return false;
    } else if (category === 'suspicious') {
      if (!isSuspiciousFinding(f)) return false;
    }

    const level = (f.level || f.severity || 'INFO').toUpperCase();
    if (subfilter === 'critical') {
      if (level !== 'CRITICAL') return false;
    } else if (subfilter === 'warning') {
      if (level !== 'HIGH') return false;
    } else if (subfilter === 'allowed') {
      if (level === 'CRITICAL' || level === 'HIGH') return false;
    }

    if (query) {
      const searchTarget = `${f.name || ''} ${f.type || ''} ${f.path || ''} ${f.description || ''} ${f.description_tr || ''} ${f.whyFlagged || ''}`.toLowerCase();
      if (!searchTarget.includes(query)) return false;
    }

    return true;
  });
}

function isMinecraftFinding(f) {
  const t = (f.type || '').toUpperCase();
  const c = (f.category || '').toUpperCase();
  const p = (f.path || '').toLowerCase();
  return c.includes('MINECRAFT') || c.includes('MOD') || c.includes('CLIENT') || c.includes('CHEAT') ||
    t.includes('MOD') || t.includes('JAR') || t.includes('CONFIG') || t.includes('RAVEN') ||
    t.includes('TROJAN') || t.includes('SIGNATURE') || t.includes('ARCHIVE') || t.includes('DO_DO') ||
    t.includes('ZORTAX') || p.endsWith('.jar');
}

function isAiFinding(f) {
  const t = (f.type || '').toUpperCase();
  return t.includes('AI_') || t.includes('SEMANTIC') || t.includes('BYTECODE') ||
    t.includes('CUSTOM_HOMEMADE') || t.includes('MODRINTH') || Boolean(f.isAiGenerated);
}

function isIntegrityFinding(f) {
  const t = (f.type || '').toUpperCase();
  const c = (f.category || '').toUpperCase();
  return t.includes('BYPASS') || t.includes('SPOTIFY') || t.includes('KERNEL') || t.includes('DNS') ||
    t.includes('JVM') || t.includes('SECURITY_LOG') || t.includes('PREFETCH_WIPED') || t.includes('TESTSIGNING') ||
    t.includes('DRIVER') || t.includes('USB') || t.includes('USN') || t.includes('BAM') ||
    t.includes('SHIMCACHE') || t.includes('PCA') || c.includes('BYPASS') || c.includes('INTEGRITY');
}

function isSuspiciousFinding(f) {
  const level = (f.level || f.severity || 'INFO').toUpperCase();
  const t = (f.type || '').toUpperCase();
  return level === 'HIGH' || t.includes('MACRO') || t.includes('AUTOCLICKER') || t.includes('CLICKER') ||
    t.includes('PYTHON') || t.includes('ALLOWED_POLICY') || t.includes('CLEANER');
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeHud();
    }
  });
}

// Polar Radar Chart Dynamic Geometry
function initPolarRadar(crit, warn, legit) {
  updatePolarRadar(crit, warn, legit);
}

function updatePolarRadar(crit, warn, legit) {
  const poly = document.getElementById('radarLivePolygon');
  const dotCrit = document.getElementById('radarDotCrit');
  const dotWarn = document.getElementById('radarDotWarn');
  const dotClean = document.getElementById('radarDotClean');
  const summaryLine = document.getElementById('radarSummaryLine');

  const cx = 160;
  const cy = 115;

  const critRatio = crit > 0 ? Math.min(1, 0.3 + (crit / 5) * 0.7) : 0.08;
  const v1x = cx;
  const v1y = cy - critRatio * 90;

  const warnRatio = warn > 0 ? Math.min(1, 0.3 + (warn / 6) * 0.7) : 0.08;
  const v2x = cx + warnRatio * 90;
  const v2y = cy + warnRatio * 30;

  const legitRatio = legit > 0 ? Math.min(1, 0.4 + (legit / 20) * 0.6) : (crit === 0 && warn === 0 && currentScanData ? 0.95 : 0.2);
  const v3x = cx - legitRatio * 90;
  const v3y = cy + legitRatio * 30;

  const pointsStr = `${v1x.toFixed(1)},${v1y.toFixed(1)} ${v2x.toFixed(1)},${v2y.toFixed(1)} ${v3x.toFixed(1)},${v3y.toFixed(1)}`;
  if (poly) poly.setAttribute('points', pointsStr);

  if (dotCrit) {
    dotCrit.setAttribute('cx', v1x.toFixed(1));
    dotCrit.setAttribute('cy', v1y.toFixed(1));
  }
  if (dotWarn) {
    dotWarn.setAttribute('cx', v2x.toFixed(1));
    dotWarn.setAttribute('cy', v2y.toFixed(1));
  }
  if (dotClean) {
    dotClean.setAttribute('cx', v3x.toFixed(1));
    dotClean.setAttribute('cy', v3y.toFixed(1));
  }

  if (summaryLine) {
    const isTr = currentLang === 'tr';
    if (crit > 0) {
      summaryLine.textContent = isTr 
        ? `${crit} adet kesin tehdit ve hile mekanizması tespit edildi.` 
        : `${crit} detection(s) identified across client inspection.`;
    } else if (warn > 0) {
      summaryLine.textContent = isTr
        ? `${warn} adet şüpheli parametre / makro uyarısı incelendi.`
        : `${warn} warning(s) analyzed during client inspection.`;
    } else if (currentScanData) {
      summaryLine.textContent = isTr
        ? 'İstemci bütünlüğü doğrulandı. Sıfır hile ve yetkisiz müdahale.'
        : 'Client integrity fully verified. Zero threats or injections.';
    } else {
      summaryLine.textContent = isTr
        ? 'Denetim hazır. Başlamak için taramayı çalıştırın.'
        : 'Ready for inspection. Run scan to evaluate.';
    }
  }
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
    const isTr = currentLang === 'tr';
    logTerminal('SUCCESS', isTr ? `Rapor İndirilenler klasörüne kaydedildi: ${msg.path}` : `Report saved to Downloads: ${msg.path}`);
    showToast(
      isTr ? 'Rapor İndirilenlere Kaydedildi' : 'Report Saved to Downloads',
      msg.path,
      'success',
      6000
    );
  }
}

let animFrameId = null;
let liveCriticalCount = 0;
let liveHighCount = 0;
const liveFindingKeys = new Set();
const liveFindingsList = [];

// Start Live Smooth Progress Animation Loop with requestAnimationFrame (Low CPU)
function startProgressAnimation() {
  isScanActive = true;
  currentPercent = 0;
  targetPercent = 4;
  scannedObjectsCount = 0;
  liveCriticalCount = 0;
  liveHighCount = 0;
  liveFindingKeys.clear();
  liveFindingsList.length = 0;
  scanStartTime = Date.now();

  const heroVerdictCard = document.getElementById('heroVerdictCard');
  if (heroVerdictCard) {
    heroVerdictCard.className = 'hero-verdict-banner verdict-state-standby';
  }

  const dashVerdict = document.getElementById('dashVerdict');
  if (dashVerdict) {
    dashVerdict.textContent = (currentLang === 'tr') ? 'TARANIYOR...' : 'SCANNING...';
  }

  const riskScoreVal = document.getElementById('riskScoreVal');
  if (riskScoreVal) riskScoreVal.textContent = '0%';

  const dashCrit = document.getElementById('dashCritical');
  const dashHigh = document.getElementById('dashHigh');
  const dashJars = document.getElementById('dashJars');
  if (dashCrit) dashCrit.textContent = '0';
  if (dashHigh) dashHigh.textContent = '0';
  if (dashJars) dashJars.textContent = '0';

  updatePolarRadar(0, 0, 0);
  updateCountsDisplay(0, 0, 0, 0, 0);

  if (scanDurationTimer) clearInterval(scanDurationTimer);
  scanDurationTimer = setInterval(() => {
    const elapsedSec = Math.floor((Date.now() - scanStartTime) / 1000);
    const m = Math.floor(elapsedSec / 60);
    const s = elapsedSec % 60;
    const elM = document.getElementById('heroScanMinutes');
    const elS = document.getElementById('heroScanSeconds');
    if (elM) elM.textContent = m;
    if (elS) elS.textContent = String(s).padStart(2, '0');
  }, 1000);

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
    const dashJars = document.getElementById('dashJars');
    if (dashJars) {
      dashJars.textContent = scannedObjectsCount;
    }
  }

  if (msg.target && tickerText) {
    tickerText.textContent = msg.target;
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

  if (flaggedStages.has(currentKey)) return;

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
  currentPercent = 100;
  isScanActive = false;
  const t = translations[currentLang] || translations.en;

  if (scanDurationTimer) {
    clearInterval(scanDurationTimer);
    scanDurationTimer = null;
  }
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }

  // 1. Instantly render full results and populate all findings, counts, and radar!
  renderFullResults(data);

  // 2. Complete HUD graphics
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
    btnExport.addEventListener('click', async () => {
      const isTr = currentLang === 'tr';
      const originalHtml = btnExport.innerHTML;
      btnExport.classList.add('btn-loading');
      btnExport.innerHTML = `
        <svg class="spin-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        <span>${isTr ? 'İndiriliyor...' : 'Exporting...'}</span>
      `;

      try {
        // 1. Direct browser download trigger into user's Downloads folder
        const timestamp = Date.now();
        const dlLink = document.createElement('a');
        dlLink.href = `/api/report/download?t=${timestamp}`;
        dlLink.download = `AtlasAC_Report_${timestamp}.html`;
        document.body.appendChild(dlLink);
        dlLink.click();
        document.body.removeChild(dlLink);

        // 2. Also command server to save report into host machine's Downloads / İndirilenler folder
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: 'EXPORT_REPORT' }));
        } else {
          // Fallback via HTTP API
          fetch('/api/export')
            .then(res => res.json())
            .then(data => {
              if (data && data.path) {
                logTerminal('SUCCESS', isTr ? `Rapor İndirilenler klasörüne kaydedildi: ${data.path}` : `Report saved to Downloads: ${data.path}`);
                showToast(
                  isTr ? 'Rapor İndirilenlere Kaydedildi' : 'Report Saved to Downloads',
                  data.path,
                  'success',
                  7000
                );
              }
            })
            .catch(() => {});
        }
      } catch (err) {
        showToast(
          isTr ? 'Dışa Aktarma Hatası' : 'Export Error',
          err.message || 'Rapor dışa aktarılırken bir hata oluştu.',
          'error'
        );
      } finally {
        setTimeout(() => {
          btnExport.classList.remove('btn-loading');
          btnExport.innerHTML = originalHtml;
        }, 1500);
      }
    });
  }

  const btnToggleSidebar = document.getElementById('btnToggleSidebar');
  const appSidebar = document.querySelector('.app-sidebar');
  if (btnToggleSidebar && appSidebar) {
    btnToggleSidebar.addEventListener('click', () => {
      appSidebar.classList.toggle('collapsed');
    });
  }

  const btnViewPcStats = document.getElementById('btnViewPcStats');
  if (btnViewPcStats) {
    btnViewPcStats.addEventListener('click', () => {
      const pcRow = document.querySelector('.pc-details-list');
      if (pcRow) {
        pcRow.scrollIntoView({ behavior: 'smooth' });
        pcRow.style.outline = '1px solid var(--chroma-cyan)';
        setTimeout(() => { pcRow.style.outline = 'none'; }, 1500);
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
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#ffffff;background:#060913;text-align:center;padding:24px;">
            <div style="width:64px;height:64px;border-radius:50%;background:rgba(56,189,248,0.1);border:1px solid #38bdf8;display:flex;align-items:center;justify-content:center;margin-bottom:20px;box-shadow:0 0 24px rgba(56,189,248,0.3);">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
            </div>
            <h2 style="color:#ffffff;font-size:24px;font-weight:700;margin-bottom:10px;letter-spacing:0.5px;">${isTr ? 'Atlas AC Başarıyla Kapatıldı' : 'Atlas AC Successfully Shut Down'}</h2>
            <p style="color:#94a3b8;font-size:14px;max-width:440px;line-height:1.6;margin-bottom:16px;">${isTr ? 'Sunucu ve tarama süreçleri güvenli biçimde sonlandırıldı. Bu pencereyi kapatabilirsiniz.' : 'Server and forensic background processes have been safely terminated. You can now close this window.'}</p>
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
  const placeholderHtml = `
    <div class="empty-state-card">
      <div class="empty-icon-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m10 15 5-3-5-3v6Z"/></svg>
      </div>
      <h4>${t.hud_scanning}</h4>
      <p>${t.scanning_in_progress}</p>
    </div>
  `;

  const dashList = document.getElementById('dashFindingsList');
  if (dashList) dashList.innerHTML = placeholderHtml;

  const tabLists = ['bypassList', 'usnList', 'prefetchList', 'minecraftList', 'browsersList', 'usbList', 'macrosList'];
  tabLists.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = placeholderHtml;
  });

  const dashCrit = document.getElementById('dashCritical');
  const dashHigh = document.getElementById('dashHigh');
  const dashJars = document.getElementById('dashJars');

  if (dashCrit) dashCrit.textContent = '0';
  if (dashHigh) dashHigh.textContent = '0';
  if (dashJars) dashJars.textContent = '0';

  updatePolarRadar(0, 0, 0);
  updateCountsDisplay(0, 0, 0, 0, 0);
}

function updateCountsDisplay(total, mc, ai, integrity, suspicious) {
  const elTotal = document.getElementById('totalLogsCounter');
  const elGrand = document.getElementById('grandTotalBadge');
  const elAll = document.getElementById('catCountAll');
  const elMc = document.getElementById('catCountMc');
  const elAi = document.getElementById('catCountAi');
  const elInt = document.getElementById('catCountIntegrity');
  const elSusp = document.getElementById('catCountSuspicious');

  if (elTotal) elTotal.textContent = total;
  if (elGrand) elGrand.textContent = total;
  if (elAll) elAll.textContent = total;
  if (elMc) elMc.textContent = mc;
  if (elAi) elAi.textContent = ai;
  if (elInt) elInt.textContent = integrity;
  if (elSusp) elSusp.textContent = suspicious;
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

  let name = f.name || f.type || 'Denetim Kaydı';
  let desc = f.description_tr || f.description || f.reason || '';
  let conf = f.confidence || '';
  let evidence = f.evidence;

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
    'BAM_CHEAT_RECORD': 'Windows BAM Hile Çalıştırma Kaydı',
    'SHIMCACHE_EXECUTED_CHEAT': 'ShimCache Hile İzi',
    'PCA_EXECUTED_CHEAT': 'PCA Hile Çalıştırma İzi',
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
    'DISGUISED_EXECUTABLE': 'Gizlenmiş PE Dosyası (Yanıltıcı Uzantı)',
    'DISGUISED_EXECUTABLE_IN_JVM': 'Minecraft Belleğinde Gizlenmiş PE Modülü',
    'CHEAT_INJECTOR_PE': 'Minecraft Bellek Enjektörü / Hayalet Hile DLL',
    'AUTOCLICKER_BINARY': 'Müstakil AutoClicker / Fare Makro İkili Dosyası',
    'LEGITIMATE_OVERLAY_HOOK': 'Ekran Kaydedici / Oyun İçi Katman Kancası (Güvenli)',
    'LEGITIMATE_MINECRAFT_NATIVE': 'Minecraft Yerel Çalışma Zamanı Kütüphanesi (Güvenli)',
    'LEGITIMATE_MEDIA_CODEC': 'Sesli Sohbet Kodek Kütüphanesi (Güvenli)',
    'INJECTED_DLL_FROM_TEMP': 'Temp Dizininden Enjekte Edilmiş DLL',
    'KNOWN_CHEAT_DLL_LOADED': 'Bellekte Yüklü Bilinen Hile DLL Modülü',
    'RECENTLY_USED_CHEAT_FILE': 'Sistem Geçmişinde Hile Dosyası Erişimi',
    'ALLOWED_POLICY_AUTOCLICKER_SUMMARY': 'AutoClicker / Makro Tespiti (Sunucu İzni: Serbest)',
    'CUSTOM_HOMEMADE_CHEAT_DETECTED': 'YZ Semantik: Özel Kodlanmış Hile Baytkodu',
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

  if (conf) {
    if (conf.includes('Zero False Positive Verified')) conf = '%100 (Sıfır Hatalı Pozitif Doğrulandı)';
    else if (conf.includes('Browser Download Database Record')) conf = '%100 (Tarayıcı İndirme Veritabanı Kaydı)';
    else if (conf.includes('JVM Commandline Argument')) conf = '%100 (JVM Komut Satırı Doğrulandı)';
    else if (conf.includes('/proc/maps Memory Region')) conf = '%100 (/proc/maps Bellek Bölgesi Doğrulandı)';
    else if (conf.includes('Found in Linux Trash')) conf = '%100 (Linux Çöp Kutusunda Bulundu)';
    else if (conf.includes('Open /proc fd pointing to deleted file')) conf = '%100 (Silinmiş Dosyaya Açık FD)';
    else if (conf.includes('High (Linux Activity Record)')) conf = 'Yüksek (Linux Aktivite Kaydı)';
    else if (conf.includes('High (Binary Stream Match)')) conf = 'Yüksek (İkili Akış Eşleşmesi)';
    else if (conf.includes('Static Bytecode Heuristic Analysis')) conf = '%100 (Statik Baytkod Sezgisel Analizi)';
    else if (conf.includes('100%')) conf = conf.replace('100%', '%100');
  }

  if (evidence && Array.isArray(evidence)) {
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

  return { name, description: desc, confidence: conf, evidence };
}

// Ocean Anti-Cheat Style Card Template
function createFindingCardElement(f) {
  const t = translations[currentLang] || translations.en;
  const loc = getLocalizedFinding(f, currentLang);
  const level = (f.level || f.severity || 'INFO').toUpperCase();

  const isThreat = level === 'CRITICAL';
  const isWarn = level === 'HIGH';
  const isAllowed = f.isSafe || f.badge === 'ALLOWED_POLICY' || level === 'INFO';

  let cardVariantClass = 'crit';
  let badgeVariantClass = 'badge-crit';
  let levelLabel = t.badge_critical;

  if (isAllowed) {
    cardVariantClass = 'allowed';
    badgeVariantClass = 'badge-allowed';
    levelLabel = f.badgeText || t.badge_allowed;
  } else if (isWarn) {
    cardVariantClass = 'warn';
    badgeVariantClass = 'badge-warn';
    levelLabel = t.badge_high;
  } else if (!isThreat) {
    cardVariantClass = 'info';
    badgeVariantClass = 'badge-info';
    levelLabel = t.badge_info;
  }

  const card = document.createElement('div');
  card.className = `finding-item-card ${cardVariantClass}`;

  const pathValue = f.path || f.file || f.url || 'System Memory';
  const isUrl = Boolean(f.url && !f.path);
  const timestampValue = f.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19);

  let evidenceHtml = '';
  if (loc.evidence && Array.isArray(loc.evidence) && loc.evidence.length > 0) {
    evidenceHtml = `
      <div class="evidence-box">
        <strong>${t.lbl_evidence}:</strong>
        <ul style="margin: 6px 0 0 16px; padding: 0;">
          ${loc.evidence.map(e => `<li>${escapeHtml(e)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  const expl = (currentLang === 'tr' ? f.explanation : f.explanationEn) || f.explanation || f.explanationEn;
  const whyReason = f.whyFlagged || (expl && expl.whyConcrete) || f.reason || 
    (isThreat ? (currentLang === 'tr' ? 'Yetkisiz hile imzası veya enjeksiyon kancası tespit edildi.' : 'Unauthorized injection hook or cheat signature detected.') :
     isAllowed ? (currentLang === 'tr' ? 'Sunucu politikası gereği bu işlem veya mod serbest bırakılmıştır.' : 'This module or process is explicitly allowed by server policy.') :
     (currentLang === 'tr' ? 'Şüpheli parametre veya optimizasyon aracı incelendi.' : 'Suspicious parameter or automation tool inspected.'));

  let guidanceHtml = '';
  if (whyReason) {
    const whyTitle = isThreat ? t.why_flagged_crit : (isAllowed ? t.why_flagged_allowed : t.why_flagged_warn);
    guidanceHtml += `
      <div class="guide-box box-why">
        <span class="guide-box-title">${whyTitle}</span>
        <div>${escapeHtml(whyReason)}</div>
      </div>
    `;
  }

  if (expl) {
    if (expl.howItWorks) {
      guidanceHtml += `
        <div class="guide-box box-tactic">
          <span class="guide-box-title">${t.guide_tactic_title}</span>
          <div>${escapeHtml(expl.howItWorks)}</div>
        </div>
      `;
    }
    if (expl.adminAction) {
      guidanceHtml += `
        <div class="guide-box box-action">
          <span class="guide-box-title">${t.guide_action_title}</span>
          <div>${escapeHtml(expl.adminAction)}</div>
        </div>
      `;
    }
    if (expl.whyConcrete) {
      guidanceHtml += `
        <div class="guide-box box-concrete">
          <span class="guide-box-title">${t.guide_concrete_title}</span>
          <div>${escapeHtml(expl.whyConcrete)}</div>
        </div>
      `;
    }
  }

  card.innerHTML = `
    <div class="item-card-header">
      <span class="badge-tag ${badgeVariantClass}">${escapeHtml(levelLabel)}</span>
      <span class="item-card-title">${escapeHtml(loc.name)}</span>
      ${loc.confidence ? `<span class="item-card-confidence">${escapeHtml(loc.confidence)}</span>` : ''}
      <button class="btn-copy-all btn-card-copy" title="Copy Card Information">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
      </button>
    </div>
    <div class="item-card-body">
      <p class="item-desc-text">${escapeHtml(loc.description)}</p>
      <div class="code-path-box">
        <strong>${isUrl ? t.lbl_url : t.lbl_file_path}:</strong> <code>${escapeHtml(pathValue)}</code>
        ${timestampValue ? ` <span style="opacity: 0.6; margin-left: 8px;">[${escapeHtml(timestampValue)}]</span>` : ''}
      </div>
      ${evidenceHtml}
      ${guidanceHtml}
    </div>
  `;

  const copyBtn = card.querySelector('.btn-card-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const textToCopy = `[Atlas AC - ${levelLabel}]\n${loc.name}\nPath: ${pathValue}\nTime: ${timestampValue}\nDescription: ${loc.description}\nWhy: ${whyReason}`;
      copyToClipboard(textToCopy, copyBtn);
    });
  }

  return card;
}

function renderLiveFindingCard(f) {
  const findingId = `${f.type || ''}|${f.path || ''}|${f.name || ''}|${f.file || ''}`;
  if (liveFindingKeys.has(findingId)) return;
  liveFindingKeys.add(findingId);
  liveFindingsList.push(f);

  if (!currentScanData) {
    currentScanData = { allFindings: liveFindingsList };
  } else {
    currentScanData.allFindings = liveFindingsList;
  }

  const isThreat = f.level === 'CRITICAL' || f.severity === 'CRITICAL';
  const isSuspicious = f.level === 'HIGH' || f.severity === 'HIGH';
  if (isThreat) liveCriticalCount++;
  else if (isSuspicious) liveHighCount++;

  const dashCrit = document.getElementById('dashCritical');
  const dashHigh = document.getElementById('dashHigh');
  const dashJars = document.getElementById('dashJars');
  const dashVerdict = document.getElementById('dashVerdict');
  const heroVerdictCard = document.getElementById('heroVerdictCard');
  const riskScoreVal = document.getElementById('riskScoreVal');
  const t = translations[currentLang] || translations.en;

  if (dashCrit) dashCrit.textContent = liveCriticalCount;
  if (dashHigh) dashHigh.textContent = liveHighCount;
  if (dashJars) dashJars.textContent = scannedObjectsCount || liveFindingsList.length;

  if (heroVerdictCard && dashVerdict) {
    if (liveCriticalCount > 0) {
      heroVerdictCard.className = 'hero-verdict-banner';
      dashVerdict.textContent = t.verdict_flagged;
      if (riskScoreVal) riskScoreVal.textContent = '100%';
    } else if (liveHighCount > 0) {
      heroVerdictCard.className = 'hero-verdict-banner';
      dashVerdict.textContent = t.verdict_suspicious;
      if (riskScoreVal) riskScoreVal.textContent = '65%';
    }
  }

  updatePolarRadar(liveCriticalCount, liveHighCount, Math.max(1, scannedObjectsCount || liveFindingsList.length));

  // Dynamically update category explorer badges in real time as findings arrive
  const mcCount = liveFindingsList.filter(isMinecraftFinding).length;
  const aiCount = liveFindingsList.filter(isAiFinding).length;
  const intCount = liveFindingsList.filter(isIntegrityFinding).length;
  const suspCount = liveFindingsList.filter(isSuspiciousFinding).length;
  updateCountsDisplay(liveFindingsList.length, mcCount, aiCount, intCount, suspCount);

  const container = document.getElementById('dashFindingsList');
  if (container) {
    const emptyCard = container.querySelector('.empty-state-card');
    if (emptyCard) {
      container.removeChild(emptyCard);
    }
    const card = createFindingCardElement(f);
    container.prepend(card);
  }

  addLiveFindingToTab(f);
}

function addLiveFindingToTab(f) {
  const t = (f.type || '').toUpperCase();
  const c = (f.category || '').toUpperCase();
  const p = (f.path || '').toLowerCase();

  const appendTo = (listId) => {
    const el = document.getElementById(listId);
    if (!el) return;
    const ph = el.querySelector('.empty-state-card');
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
  const scannedJars = data.scannedJars || 0;

  const dashCrit = document.getElementById('dashCritical');
  const dashHigh = document.getElementById('dashHigh');
  const dashJars = document.getElementById('dashJars');
  const dashVerdict = document.getElementById('dashVerdict');
  const heroVerdictCard = document.getElementById('heroVerdictCard');
  const riskScoreVal = document.getElementById('riskScoreVal');
  const verdictSvgIcon = document.getElementById('verdictSvgIcon');

  if (dashCrit) dashCrit.textContent = critical;
  if (dashHigh) dashHigh.textContent = high;
  if (dashJars) dashJars.textContent = scannedJars;

  if (heroVerdictCard && dashVerdict) {
    if (critical > 0) {
      heroVerdictCard.className = 'hero-verdict-banner';
      dashVerdict.textContent = t.verdict_flagged;
      if (riskScoreVal) riskScoreVal.textContent = '100%';
      if (verdictSvgIcon) {
        verdictSvgIcon.innerHTML = '<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';
      }
    } else if (high > 0) {
      heroVerdictCard.className = 'hero-verdict-banner';
      dashVerdict.textContent = t.verdict_suspicious;
      if (riskScoreVal) riskScoreVal.textContent = '65%';
      if (verdictSvgIcon) {
        verdictSvgIcon.innerHTML = '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>';
      }
    } else {
      heroVerdictCard.className = 'hero-verdict-banner verdict-state-clean';
      dashVerdict.textContent = t.verdict_clean;
      if (riskScoreVal) riskScoreVal.textContent = '0%';
      if (verdictSvgIcon) {
        verdictSvgIcon.innerHTML = '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path>';
      }
    }
  }

  if (data.durationSeconds) {
    const dur = Math.round(parseFloat(data.durationSeconds));
    const m = Math.floor(dur / 60);
    const s = dur % 60;
    const elM = document.getElementById('heroScanMinutes');
    const elS = document.getElementById('heroScanSeconds');
    if (elM) elM.textContent = m;
    if (elS) elS.textContent = String(s).padStart(2, '0');
  }

  updatePolarRadar(critical, high, scannedJars);

  const mcCount = findings.filter(isMinecraftFinding).length;
  const aiCount = findings.filter(isAiFinding).length;
  const intCount = findings.filter(isIntegrityFinding).length;
  const suspCount = findings.filter(isSuspiciousFinding).length;
  updateCountsDisplay(findings.length, mcCount, aiCount, intCount, suspCount);

  populateTab('bypassList', findings.filter(f => f.type && (f.type.includes('SPOTIFY') || f.type.includes('KERNEL') || f.type.includes('DNS') || f.type.includes('JVM') || f.type.includes('SECURITY_LOG') || f.type.includes('PREFETCH_WIPED'))));
  populateTab('usnList', findings.filter(f => f.type && (f.type.includes('USN') || f.type.includes('RECYCLE') || f.type.includes('TRASH') || f.type.includes('UNLINKED'))));
  populateTab('prefetchList', findings.filter(f => f.type && (f.type.includes('PREFETCH') || f.type.includes('BAM') || f.type.includes('USERASSIST') || f.type.includes('RECENT') || f.type.includes('BASH_HISTORY') || f.type.includes('SELF_DESTRUCT') || f.type.includes('SHIMCACHE') || f.type.includes('LNK') || f.type.includes('PCA') || f.type.includes('WER') || f.type.includes('SRUM'))));
  populateTab('minecraftList', findings.filter(isMinecraftFinding));
  populateTab('browsersList', findings.filter(f => f.type && (f.type.includes('BROWSER') || f.type.includes('DOWNLOAD') || f.type.includes('HISTORY') || f.type.includes('DISCORD'))));
  populateTab('usbList', findings.filter(f => (f.type && (f.type.includes('USB') || f.type.includes('DRIVE') || f.type.includes('STORAGE'))) || f.connectedStatus));
  populateTab('macrosList', findings.filter(f => f.type && (f.type.includes('MACRO') || f.type.includes('AUTOCLICKER') || f.type.includes('CLICKER') || f.type.includes('PYTHON') || f.type.includes('PYINSTALLER'))));

  applyFindingsFilter();
}

function renderFindingsToContainer(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const t = translations[currentLang] || translations.en;

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card" style="border-color: rgba(16, 185, 129, 0.25);">
        <div class="empty-icon-box" style="background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); color: var(--color-clean);">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
        </div>
        <h4 style="color: var(--color-clean);">${t.clean_all}</h4>
        <p>${t.clean_category}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  items.forEach(f => {
    container.appendChild(createFindingCardElement(f));
  });
}

function populateTab(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const t = translations[currentLang] || translations.en;

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card" style="border-color: rgba(16, 185, 129, 0.2);">
        <h4 style="color: var(--color-clean);">${t.clean_category}</h4>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  items.forEach(f => {
    container.appendChild(createFindingCardElement(f));
  });
}

function copyFindingsReport(triggerBtn) {
  if (!currentScanData || !currentScanData.allFindings) {
    copyToClipboard('Atlas AC - No scan data available.', triggerBtn);
    return;
  }
  const findings = currentScanData.allFindings;
  const filtered = filterFindingsArray(findings, currentCategoryFilter, currentSubFilter, currentSearchQuery);
  const textLines = [
    `=== ATLAS AC INSPECTION REPORT [PIN: ${sessionPin}] ===`,
    `Date: ${new Date().toISOString()}`,
    `Total Findings: ${filtered.length}`,
    ''
  ];
  filtered.forEach((f, idx) => {
    const loc = getLocalizedFinding(f, currentLang);
    textLines.push(`[${idx + 1}] ${f.level || 'INFO'} - ${loc.name}`);
    textLines.push(`    Path: ${f.path || f.file || 'Memory'}`);
    textLines.push(`    Desc: ${loc.description}`);
    if (f.whyFlagged) textLines.push(`    Why: ${f.whyFlagged}`);
    textLines.push('');
  });

  copyToClipboard(textLines.join('\n'), triggerBtn);
}

function copyToClipboard(text, triggerEl) {
  try {
    navigator.clipboard.writeText(text).then(() => {
      showCopyFeedback(triggerEl);
    }).catch(() => {
      fallbackCopy(text, triggerEl);
    });
  } catch (e) {
    fallbackCopy(text, triggerEl);
  }
}

function fallbackCopy(text, triggerEl) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showCopyFeedback(triggerEl);
  } catch (e) {}
  document.body.removeChild(ta);
}

function showCopyFeedback(el) {
  if (!el) return;
  el.style.borderColor = 'var(--color-clean)';
  el.style.color = 'var(--color-clean)';
  setTimeout(() => {
    el.style.borderColor = '';
    el.style.color = '';
  }, 1200);
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

function showToast(title, message, type = 'success', duration = 4500) {
  let container = document.querySelector('.atlas-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'atlas-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `atlas-toast ${type}`;

  const iconSvg = type === 'success'
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

  toast.innerHTML = `
    <div class="atlas-toast-icon">${iconSvg}</div>
    <div class="atlas-toast-body">
      <div class="atlas-toast-title">${escapeHtml(title)}</div>
      <div class="atlas-toast-msg">${escapeHtml(message)}</div>
    </div>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  const removeTimer = setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hiding');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 400);
  }, duration);

  toast.addEventListener('click', () => {
    clearTimeout(removeTimer);
    toast.classList.remove('show');
    toast.classList.add('hiding');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 400);
  });
}
