/**
 * Atlas AC — Enhanced Chibi Cyber Companion Robot
 * Interactive blue robot with LED visor expressions (Zero emojis version)
 */

const BOT_KNOWLEDGE = [
  {
    id: 'indir',
    title: 'Istemciyi Indir (Download)',
    desc: 'Windows (.exe) ve Linux icin guvenli indirme baglantisi',
    iconColor: '#3b82f6',
    icon: '',
    answer: `Atlas AC istemcisini indirmek icin ozel indirme portalimiz hazirdir:<br><br>
    <a href="download.html" style="color:#0ea5e9;font-weight:700;text-decoration:underline;">[Yetkili Indirme Sayfasi: download.html]</a><br><br>
    • Bu sayfaya giderek yetkilinizden veya panelden olusturulan <strong>8 Haneli PIN Kodunu</strong> (orn: <code>8F3C21A9</code>) giriniz.<br>
    • PIN dogrulandigi anda <strong>Windows x64</strong> (<code>AtlasAC.exe</code>) veya <strong>Linux x64</strong> (<code>AtlasAC-Linux</code>) icin 90 saniyelik ozel indirme baglantisi olusturulur.`
  },
  {
    id: 'kont',
    title: 'Ekran Kontrolu Nasil Yapilir?',
    desc: 'Siteden canli izleme ve oyuncunun bilgisayarini tarama',
    iconColor: '#ef4444',
    icon: '',
    answer: `Supheli oyuncuyu ekran kontrolune aldiginizda adimlar soyledir:<br><br>
    1. <a href="dashboard.html" style="color:#0ea5e9;font-weight:700;text-decoration:underline;">Dashboard Paneline</a> girin ve <strong>+ Yeni Tarama PIN'i</strong> butonuna basin.<br>
    2. Sistem size 8 haneli bir PIN kodu uretir (Orn: <code>8F3C21A9</code>).<br>
    3. Bu kodu oyuncuya iletin: <em>"Atlas AC'yi ac ve bu PIN kodunu gir."</em><br>
    4. Oyuncunun ekraninda yalinizca minimal ilerleme cubugu calisirken, <strong>tum bulgular aninda web panelinize canli olarak akar!</strong><br>
    5. Oyuncudan asla lisans veya kayit istenmez.`
  },
  {
    id: 'linux',
    title: 'Linux Destegi & Kurulum',
    desc: 'Ubuntu, Arch, Debian uzerinde tek tikla calistirma',
    iconColor: '#10b981',
    icon: '',
    answer: `Atlas AC tam Linux uyumludur.<br><br>
    • Indirme sayfasindan (<code>download.html</code>) <strong>Linux x64</strong> binary dosyasini indirin.<br>
    • Terminalde calistirma izni verip baslatin:<br>
    <code style="display:block;padding:6px;background:rgba(0,0,0,0.5);border-radius:4px;margin:6px 0;font-size:11px;color:#38bdf8;">chmod +x AtlasAC-Linux && ./AtlasAC-Linux</code><br>
    • Ekstra kutuphane veya runtime kurulumu gerektirmez.`
  },
  {
    id: 'lisans',
    title: 'Lisans & PIN Mimarisi',
    desc: 'Tek kullanımlık PIN ile uzaktan kontrol yönetimi',
    iconColor: '#f59e0b',
    icon: '',
    answer: `Atlas AC bulut tabanlı uzaktan kontrol mimarisini kullanır:<br><br>
    1. Lisans sadece sitede yetkili tarafından kullanılır.<br>
    2. Şüpheli oyuncudan kesinlikle lisans istenmez.<br>
    3. Yetkili panelden tek kullanımlık 8 haneli PIN üretir ve oyuncu sadece PIN ile tarama yapar.`
  },
  {
    id: 'bypass',
    title: 'Tespit Motorlari & Adli Derinlik',
    desc: 'Vape V4, Drip Lite, silinen hileler ve bellek analizi',
    iconColor: '#06b6d4',
    icon: '',
    answer: `Atlas AC su motorlarla tarama gerceklestirir:<br><br>
    • <strong>Bellek (JVM Strings & Injection):</strong> Enjekte edilmis DLL'ler ve gizli combat paketleri.<br>
    • <strong>USN Journal:</strong> Tarama oncesi silinmis dosya kayitlari.<br>
    • <strong>Windows Forensics:</strong> Prefetch, Amcache, BAM, ShimCache, DPS loglari.<br>
    • <strong>DNS Cache:</strong> Hile sunucularina yapilan ag istekleri.`
  },
  {
    id: 'hwid',
    title: 'Makine Kimligi (Machine ID) Nedir?',
    desc: '64 karakterli cihaz kimligi ve yan hesap tespiti',
    iconColor: '#8b5cf6',
    icon: '',
    answer: `Atlas AC uygulamasinda donanim bilesenleri baz alinarak 64 karakterli benzersiz bir SHA-256 donanim parmak izi uretilir.<br><br>
    Bu kimlik sayesinde oyuncunun daha once tarandigi yan hesaplar (alts) otomatik olarak tespit edilir.`
  }
];

function initAtlasMascotBot() {
  if (document.getElementById('atlasCompanionWrapper')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'atlas-companion-wrapper';
  wrapper.id = 'atlasCompanionWrapper';

  wrapper.innerHTML = `
    <!-- Speech Prompt above Mascot -->
    <div class="mascot-speech-bubble" id="mascotBubble">Istemciyi indirmek veya soru sormak icin tiklayin</div>

    <!-- The Animated Chibi Cyber Robot -->
    <div class="mascot-avatar-stage" id="mascotStage" title="Atlas Robot - Tiklayarak yardim penceresini acin">
      <svg class="mascot-body-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cloudHeadGrad" x1="20" y1="10" x2="80" y2="75" gradientUnits="userSpaceOnUse">
            <stop stop-color="#60a5fa" />
            <stop offset="0.45" stop-color="#3b82f6" />
            <stop offset="1" stop-color="#1d4ed8" />
          </linearGradient>
          <linearGradient id="cloudCheekGrad" x1="15" y1="35" x2="85" y2="70" gradientUnits="userSpaceOnUse">
            <stop stop-color="#93c5fd" />
            <stop offset="0.6" stop-color="#3b82f6" />
            <stop offset="1" stop-color="#1e40af" />
          </linearGradient>
          <linearGradient id="visorGrad" x1="26" y1="35" x2="74" y2="65" gradientUnits="userSpaceOnUse">
            <stop stop-color="#070b19" />
            <stop offset="1" stop-color="#0f172a" />
          </linearGradient>
          <linearGradient id="bodyGrad" x1="35" y1="65" x2="65" y2="90" gradientUnits="userSpaceOnUse">
            <stop stop-color="#3b82f6" />
            <stop offset="1" stop-color="#1e40af" />
          </linearGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Limbs & Feet -->
        <rect x="36" y="80" width="10" height="13" rx="5" fill="#1d4ed8" />
        <rect x="54" y="80" width="10" height="13" rx="5" fill="#1d4ed8" />
        <ellipse cx="41" cy="92" rx="7" ry="4" fill="#60a5fa" />
        <ellipse cx="59" cy="92" rx="7" ry="4" fill="#60a5fa" />

        <!-- Robot Torso -->
        <rect x="34" y="65" width="32" height="20" rx="8" fill="url(#bodyGrad)" stroke="#60a5fa" stroke-width="1.5" />
        <!-- Little Arms -->
        <rect x="23" y="68" width="9" height="15" rx="4.5" fill="#2563eb" transform="rotate(18 23 68)" />
        <rect x="68" y="71" width="9" height="15" rx="4.5" fill="#2563eb" transform="rotate(-18 68 71)" />

        <!-- Puffy Cloud Head -->
        <circle cx="50" cy="32" r="20" fill="url(#cloudHeadGrad)" />
        <circle cx="31" cy="40" r="17" fill="url(#cloudHeadGrad)" />
        <circle cx="69" cy="40" r="17" fill="url(#cloudHeadGrad)" />
        <circle cx="27" cy="54" r="15" fill="url(#cloudCheekGrad)" />
        <circle cx="73" cy="54" r="15" fill="url(#cloudCheekGrad)" />
        <rect x="30" y="44" width="40" height="20" rx="10" fill="url(#cloudCheekGrad)" />

        <!-- Dark Curved LED Screen -->
        <rect x="25" y="40" width="50" height="24" rx="12" fill="url(#visorGrad)" stroke="#1e3a8a" stroke-width="1.2" />

        <!-- LED Cyan Eyes -->
        <text id="mascotEyesText" x="50" y="56" fill="#38bdf8" font-family="'Courier New', monospace" font-size="11" font-weight="900" text-anchor="middle" letter-spacing="2" filter="url(#softGlow)">&gt; = &lt;</text>
      </svg>
    </div>

    <!-- Interactive Chat Drawer -->
    <div class="companion-drawer hidden" id="companionDrawer">
      <div class="drawer-header">
        <div class="drawer-header-left">
          <span class="drawer-status-dot"></span>
          <strong>Atlas Asistani</strong>
          <small>Cevrimici</small>
        </div>
        <button type="button" class="drawer-close" id="btnDrawerClose" title="Kapat">&times;</button>
      </div>

      <div class="drawer-chat-area" id="drawerChatArea">
        <div class="drawer-chat-msg bot">
          <div class="drawer-bubble">
            Merhaba! Ben <strong>Atlas AC Robot Yardimcisiyim</strong>.<br>
            Sorularinizi sorabilir, PIN olusturma rehberine ulasabilir veya 8 haneli PIN'inizi buraya yapistirarak indirmeyi baslatabilirsiniz.
          </div>
        </div>
      </div>

      <!-- Quick Topics Pills -->
      <div class="drawer-topics-list" id="drawerTopicsList">
        ${BOT_KNOWLEDGE.map(k => `
          <button type="button" class="drawer-topic-item" data-id="${k.id}">
            <span class="topic-dot" style="background:${k.iconColor};"></span>
            <span>${k.title}</span>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Floating Input Pill Bar -->
    <form class="companion-pill-bar" id="companionPillForm">
      <button type="button" class="btn-pill-action" id="btnPillToggle" title="Hizli Menu">+</button>
      <input type="text" class="companion-input" id="companionInput" placeholder="Soru sorun veya PIN girin..." autocomplete="off">
      <button type="submit" class="btn-pill-send" id="btnPillSend" title="Gonder">&uarr;</button>
    </form>
  `;

  document.body.appendChild(wrapper);

  const stage = document.getElementById('mascotStage');
  const drawer = document.getElementById('companionDrawer');
  const btnToggle = document.getElementById('btnPillToggle');
  const btnClose = document.getElementById('btnDrawerClose');
  const form = document.getElementById('companionPillForm');
  const input = document.getElementById('companionInput');
  const chatArea = document.getElementById('drawerChatArea');
  const topicsList = document.getElementById('drawerTopicsList');
  const eyesText = document.getElementById('mascotEyesText');
  const bubble = document.getElementById('mascotBubble');

  const EXPRESSIONS = ['> = <', '>_<', '^‿^', '•‿•', 'o_O', '•_•', '(★‿★)'];
  let currentExprIdx = 0;

  function setMascotExpression(expr) {
    if (eyesText) eyesText.textContent = expr;
  }

  stage.addEventListener('mouseenter', () => setMascotExpression('^‿^'));
  stage.addEventListener('mouseleave', () => {
    if (drawer.classList.contains('hidden')) setMascotExpression('> = <');
  });

  setInterval(() => {
    if (!drawer.classList.contains('hidden')) return;
    setMascotExpression('--');
    setTimeout(() => {
      currentExprIdx = (currentExprIdx + 1) % (EXPRESSIONS.length - 1);
      setMascotExpression(EXPRESSIONS[currentExprIdx]);
    }, 250);
  }, 5000);

  const TIPS = [
    "Istemciyi indirmek icin tiklayin",
    "PIN kodunuzu buraya yapistirip indirebilirsiniz",
    "Ekran kontrolu nasil yapilir?",
    "Linux icin ./AtlasAC-Linux hazir",
    "Soru sormak icin yazmaya baslayin"
  ];
  let tipIdx = 0;
  setInterval(() => {
    if (!drawer.classList.contains('hidden')) return;
    tipIdx = (tipIdx + 1) % TIPS.length;
    if (bubble) bubble.textContent = TIPS[tipIdx];
  }, 9000);

  function toggleDrawer(open) {
    const shouldOpen = typeof open === 'boolean' ? open : drawer.classList.contains('hidden');
    if (shouldOpen) {
      drawer.classList.remove('hidden');
      btnToggle.classList.add('active');
      setMascotExpression('^‿^');
      if (bubble) bubble.style.display = 'none';
      input.focus();
    } else {
      drawer.classList.add('hidden');
      btnToggle.classList.remove('active');
      setMascotExpression('> = <');
    }
  }

  stage.addEventListener('click', () => toggleDrawer());
  btnToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDrawer();
  });
  btnClose.addEventListener('click', () => toggleDrawer(false));

  function appendChat(html, isUser = false) {
    const msg = document.createElement('div');
    msg.className = `drawer-chat-msg ${isUser ? 'user' : 'bot'}`;
    msg.innerHTML = `<div class="drawer-bubble">${html}</div>`;
    chatArea.appendChild(msg);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  function simulateBotAnswer(answerHtml) {
    setMascotExpression('•_•');
    const typing = document.createElement('div');
    typing.className = 'drawer-chat-msg bot';
    typing.innerHTML = `<div class="drawer-bubble typing-dots"><span></span><span></span><span></span></div>`;
    chatArea.appendChild(typing);
    chatArea.scrollTop = chatArea.scrollHeight;

    setTimeout(() => {
      typing.remove();
      setMascotExpression('(★‿★)');
      appendChat(answerHtml, false);
      setTimeout(() => setMascotExpression('^‿^'), 1500);
    }, 350);
  }

  function handleQuery(text) {
    const rawTrim = text.trim();
    const clean = rawTrim.toLowerCase();
    if (!clean) return;

    toggleDrawer(true);
    appendChat(escapeHtml(rawTrim), true);

    const upper = rawTrim.toUpperCase();

    // Format recognition only; the protected download endpoint performs the
    // actual server-side PIN validation.
    if (/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(upper)) {
      setMascotExpression('(★‿★)');
      simulateBotAnswer(`
        <strong>PIN biçimi algılandı.</strong><br>
        <span style="color:#34d399;">Kod: ${escapeHtml(upper)}</span><br><br>
        Geçerlilik kontrolü ve özel indirme bağlantısı için platform seçin:<br><br>
        <div style="display:grid;gap:8px;margin:8px 0;">
          <a href="download.html?pin=${encodeURIComponent(upper)}" style="display:flex;align-items:center;justify-content:space-between;background:#0d111a;border:1px solid #0ea5e9;color:#0ea5e9;padding:10px 14px;border-radius:8px;font-weight:700;text-decoration:none;">
            <span>Windows x64 Indir (AtlasAC.exe)</span>
            <span>&darr;</span>
          </a>
          <a href="download.html?pin=${encodeURIComponent(upper)}&platform=linux" style="display:flex;align-items:center;justify-content:space-between;background:#0d111a;border:1px solid #38bdf8;color:#38bdf8;padding:10px 14px;border-radius:8px;font-weight:700;text-decoration:none;">
            <span>Linux x64 Indir (AtlasAC-Linux)</span>
            <span>&darr;</span>
          </a>
        </div>
      `);
      return;
    }

    // 404 or Download Query Dispatcher
    if (clean.includes('404') || clean.includes('indir') || clean.includes('download') || clean.includes('link') || clean.includes('exe')) {
      simulateBotAnswer(`
        <strong>Atlas AC Istemci Indirme Portali</strong><br><br>
        Guvenli ve yuksek hizli indirme icin indirme portalimiz hazirdir:<br><br>
        <a href="download.html" style="color:#0ea5e9;font-weight:700;font-size:13px;text-decoration:underline;">[Indirme Portali: download.html]</a><br><br>
        1. Sayfaya gidin ve Windows veya Linux secin.<br>
        2. 8 haneli PIN kodunuzu girin.<br>
        3. Sistem 90 saniye gecerli ozel indirme baglantisini olusturacaktir.
      `);
      return;
    }

    // Smart Keyword Dispatcher
    let match = null;
    if (clean.includes('kont') || clean.includes('ekran') || clean.includes('tarama') || clean.includes('ss') || clean.includes('adli')) {
      match = BOT_KNOWLEDGE.find(k => k.id === 'kont');
    } else if (clean.includes('linux') || clean.includes('ubuntu') || clean.includes('arch') || clean.includes('sh')) {
      match = BOT_KNOWLEDGE.find(k => k.id === 'linux');
    } else if (clean.includes('lisans') || clean.includes('key') || clean.includes('ucret') || clean.includes('fiyat') || clean.includes('davet')) {
      match = BOT_KNOWLEDGE.find(k => k.id === 'lisans');
    } else if (clean.includes('bypass') || clean.includes('hile') || clean.includes('vape') || clean.includes('raven') || clean.includes('yakala')) {
      match = BOT_KNOWLEDGE.find(k => k.id === 'bypass');
    } else if (clean.includes('makine') || clean.includes('hwid') || clean.includes('id')) {
      match = BOT_KNOWLEDGE.find(k => k.id === 'hwid');
    }

    if (match) {
      simulateBotAnswer(match.answer);
    } else if (clean.includes('selam') || clean.includes('merhaba') || clean.includes('sa') || clean.includes('hey') || clean.includes('naber')) {
      simulateBotAnswer('Aleykumselam, hos geldiniz. Size Atlas AC hile kontrol sistemi, PIN olusturma veya indirme portalinda yardimci olabilirim. Bir soru sorabilir veya PIN kodunuzu yazabilirsiniz.');
    } else {
      simulateBotAnswer(`Sorunuzu anladim. Hizli islem yapmak icin <a href="download.html" style="color:#0ea5e9;font-weight:700;">Indirme Portali</a>'na gidebilir veya <a href="dashboard.html" style="color:#0ea5e9;font-weight:700;">Yetkili Paneli</a>'nden canli kontrol baslatabilirsiniz.`);
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = input.value;
    input.value = '';
    handleQuery(val);
  });

  topicsList.addEventListener('click', (e) => {
    const item = e.target.closest('.drawer-topic-item');
    if (item) {
      const id = item.getAttribute('data-id');
      const found = BOT_KNOWLEDGE.find(k => k.id === id);
      if (found) {
        handleQuery(found.title);
      }
    }
  });

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAtlasMascotBot);
} else {
  initAtlasMascotBot();
}
