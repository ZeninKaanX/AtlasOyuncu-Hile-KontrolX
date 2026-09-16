/**
 * Atlas AC — Enhanced Chibi Cyber Companion Robot
 * Exactly matching user reference (Interactive blue robot with LED visor expressions)
 */

const BOT_KNOWLEDGE = [
  {
    id: 'indir',
    title: 'İstemciyi İndir (Download)',
    desc: 'Windows (.exe) ve Linux için güvenli indirme linki',
    iconColor: '#3b82f6',
    icon: '📥',
    answer: `Atlas AC istemcisini indirmek için özel indirme portalımız hazırdır:<br><br>
    👉 <a href="download.html" style="color:#00f0ff;font-weight:700;text-decoration:underline;">[Yetkili İndirme Sayfası: download.html]</a><br><br>
    • Bu sayfaya giderek yöneticinizden aldığınız <strong>Davet Kodunu</strong> (örn: <code>ATLAS-KURUCU-2026</code>) veya <strong>Lisans Anahtarınızı</strong> giriniz.<br>
    • Anahtarınız doğrulandığı anda <strong>Windows x64</strong> (<code>AtlasAC.exe</code>) veya <strong>Linux x64</strong> (<code>AtlasAC-Linux</code>) indirmesi anında başlayacaktır.`
  },
  {
    id: 'kont',
    title: 'Ekran Kontrolü (Kont) Nasıl Yapılır?',
    desc: 'Siteden canlı izleme ve oyuncunun bilgisayarını tarama',
    iconColor: '#ef4444',
    icon: '🛡️',
    answer: `Şüpheli oyuncuyu ekran kontrolüne çektiğinizde adımlar şöyledir:<br><br>
    1. <a href="dashboard.html#screencheck" style="color:#00f0ff;font-weight:700;text-decoration:underline;">Web Dashboard</a>'a girin ve <strong>🛡️ Canlı Kontrol</strong> sekmesinden <em>"Yeni Kontrol Başlat"</em> butonuna basın.<br>
    2. Sistem size bir kod verir: <strong>ATL-XXXX</strong> (Örn: <code>ATL-7842</code>).<br>
    3. Bu kodu oyuncuya verin: <em>"Atlas AC'yi aç ve bu kodu girip taramayı başlat."</em><br>
    4. Oyuncu taramayı başlattığında fütüristik <strong>siber dikdörtgen yüzdelik bar</strong> oyuncunun ekranında akar, <strong>tüm bulgular anında sizin web panelinize canlı yansır!</strong><br>
    5. Tarama bittiğinde tek tıkla <em>"Ban Komutunu Kopyala"</em> butonuna basabilirsiniz.`
  },
  {
    id: 'linux',
    title: 'Linux Desteği & Kurulum',
    desc: 'Ubuntu, Arch, Debian üzerinde tek tıkla çalıştırma',
    iconColor: '#10b981',
    icon: '🐧',
    answer: `Evet! <strong>Atlas AC tam Linux uyumludur!</strong><br><br>
    • İndirme sayfasından (<code>download.html</code>) <strong>Linux x64</strong> binary dosyasını indirin.<br>
    • Terminalde şu komutla doğrudan çalıştırın:<br>
    <code style="display:block;padding:6px;background:rgba(0,0,0,0.5);border-radius:4px;margin:6px 0;font-size:11px;color:#00f0ff;">chmod +x AtlasAC-Linux && ./AtlasAC-Linux</code>
    • Veya arşivdeki <code>./baslat.sh</code> betiğini kullanabilirsiniz. Ekstra Node.js veya kütüphane kurulumu gerektirmez.`
  },
  {
    id: 'lisans',
    title: 'Lisans & Kayıt Sistemi',
    desc: 'Davet koduyla hesap açma ve Ed25519 lisans alma',
    iconColor: '#f59e0b',
    icon: '🔑',
    answer: `Atlas AC herkese açık bir indirme değildir; <strong>kontrollü davet modeli</strong> ile korunur.<br><br>
    1. Yöneticinizden tek kullanımlık bir <strong>Davet Kodu</strong> (örn: <code>ATLAS-KURUCU-2026</code>) alın.<br>
    2. <a href="auth.html" style="color:#00f0ff;font-weight:700;">Giriş / Kayıt sayfasından</a> hesabınızı açın.<br>
    3. Bilgisayarınızdaki Atlas AC'nin gösterdiği 64 haneli <strong>Makine Kimliği (Machine ID)</strong>'ni panele girin.<br>
    4. Saniyeler içinde yalnızca o cihaz için geçerli <strong>Ed25519 imzalı lisansınız</strong> üretilir.`
  },
  {
    id: 'bypass',
    title: 'Bypass Koruması & Tespit Edilenler',
    desc: 'Vape V4, Raven, silinen hileler ve 13.321 Modrinth koruması',
    iconColor: '#06b6d4',
    icon: '🚫',
    answer: `Atlas AC, piyasadaki bilinen tüm atlatma taktiklerini engeller:<br><br>
    • <strong>USN Journal:</strong> Kontrolden 5 dakika önce silinmiş hileleri (Shift+Delete dahil) dosya adıyla tespit eder.<br>
    • <strong>BAM & Prefetch:</strong> Çalıştırılıp kapatılmış hilelerin kesin saat damgasını yakalar.<br>
    • <strong>Bellek / JVM Dökümü:</strong> Aktif Java sürecindeki gizli dize ve DLL enjeksiyonlarını bulur.<br>
    • <strong>Sıfır Sahte Ban:</strong> 13.321 girdili resmi Modrinth temiz listesi ile masum modlar (Sodium, Iris vb.) asla banlanmaz.`
  },
  {
    id: 'hwid',
    title: 'Makine Kimliği (HWID) Nedir?',
    desc: '64 karakterli cihaz kimliği nereden öğrenilir?',
    iconColor: '#8b5cf6',
    icon: '💻',
    answer: `Atlas AC uygulamasını bilgisayarınızda açtığınızda ekranda 64 karakterli SHA-256 tabanlı <strong>Makine Kimliği</strong> (Machine GUID) görüntülenir.<br><br>
    Bu kimliği kopyalayıp web panelindeki kutuya yapıştırdığınızda o bilgisayara özel lisansınız üretilir.`
  }
];

function initAtlasMascotBot() {
  if (document.getElementById('atlasCompanionWrapper')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'atlas-companion-wrapper';
  wrapper.id = 'atlasCompanionWrapper';

  wrapper.innerHTML = `
    <!-- Speech Prompt above Mascot -->
    <div class="mascot-speech-bubble" id="mascotBubble">Selam! İstemciyi indirmek için tıkla 🤖</div>

    <!-- The Animated Chibi Cyber Robot (Matching User Reference Image) -->
    <div class="mascot-avatar-stage" id="mascotStage" title="Atlas Bot — Tıklayarak sohbeti veya indirmeyi aç">
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

        <!-- Cute Chibi Limbs & Feet -->
        <rect x="36" y="80" width="10" height="13" rx="5" fill="#1d4ed8" />
        <rect x="54" y="80" width="10" height="13" rx="5" fill="#1d4ed8" />
        <ellipse cx="41" cy="92" rx="7" ry="4" fill="#60a5fa" />
        <ellipse cx="59" cy="92" rx="7" ry="4" fill="#60a5fa" />

        <!-- Robot Torso -->
        <rect x="34" y="65" width="32" height="20" rx="8" fill="url(#bodyGrad)" stroke="#60a5fa" stroke-width="1.5" />
        <!-- Little Arms -->
        <rect x="23" y="68" width="9" height="15" rx="4.5" fill="#2563eb" transform="rotate(18 23 68)" />
        <rect x="68" y="71" width="9" height="15" rx="4.5" fill="#2563eb" transform="rotate(-18 68 71)" />

        <!-- Puffy Cloud Head (Exact Silhouette of Reference Image) -->
        <!-- Center top lobe -->
        <circle cx="50" cy="32" r="20" fill="url(#cloudHeadGrad)" />
        <!-- Left lobe -->
        <circle cx="31" cy="40" r="17" fill="url(#cloudHeadGrad)" />
        <!-- Right lobe -->
        <circle cx="69" cy="40" r="17" fill="url(#cloudHeadGrad)" />
        <!-- Lower left cheek -->
        <circle cx="27" cy="54" r="15" fill="url(#cloudCheekGrad)" />
        <!-- Lower right cheek -->
        <circle cx="73" cy="54" r="15" fill="url(#cloudCheekGrad)" />
        <!-- Chin base bridge -->
        <rect x="30" y="44" width="40" height="24" rx="10" fill="url(#cloudHeadGrad)" />

        <!-- Ear Nubbins / Antennas -->
        <path d="M44 16C44 11 48 8 50 8C52 8 56 11 56 16Z" fill="#93c5fd" />

        <!-- Dark Curved Robot Visor Screen -->
        <rect x="25" y="38" width="50" height="25" rx="12" fill="url(#visorGrad)" stroke="#38bdf8" stroke-width="1.5" />

        <!-- Dynamic Visor LED Eyes (Exact > = < match from screenshot) -->
        <g id="mascotEyesG" class="eye-glow">
          <text id="mascotEyesText" x="50" y="55" font-family="'JetBrains Mono', monospace, sans-serif" font-size="13" font-weight="900" fill="#00f0ff" text-anchor="middle" letter-spacing="2">&gt; = &lt;</text>
        </g>
      </svg>
      <div class="mascot-shadow"></div>
    </div>

    <!-- Dropdown Topic & Chat Drawer (Exact Match from Reference Screenshot) -->
    <div class="companion-drawer hidden" id="companionDrawer">
      <div class="drawer-header">
        <strong><span>🤖</span> Atlas AC Canlı Asistan &amp; İndirme</strong>
        <button class="drawer-close" id="btnDrawerClose">✕</button>
      </div>

      <div class="drawer-chat-area" id="drawerChatArea">
        <div class="drawer-chat-msg bot">
          <div class="drawer-bubble">
            Selam! Ben <strong>Atlas AC Robotu</strong> 🤖<br>
            İstemci indirme, anahtar doğrulama, siteden canlı ekran kontrolü veya Linux hakkında bana her şeyi sorabilir veya <strong>anahtarını buraya yazabilirsin!</strong>
          </div>
        </div>
      </div>

      <!-- Quick Topics List (Eklentiler Menu matching user reference) -->
      <div class="drawer-topics-list" id="drawerTopicsList">
        <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;margin:4px 8px 8px;letter-spacing:.06em;">
          EKLENTİLER &amp; HIZLI İŞLEMLER:
        </div>
        ${BOT_KNOWLEDGE.map(k => `
          <button class="drawer-topic-item" data-id="${k.id}">
            <div class="topic-icon" style="background:${k.iconColor}22;border-color:${k.iconColor}55;">${k.icon}</div>
            <div class="topic-text">
              <span class="topic-title">${k.title}</span>
              <span class="topic-desc">${k.desc}</span>
            </div>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Floating Input Pill Bar (Exact Match from User Screenshot: [+] Soru sor veya Key gir... [↑]) -->
    <form class="companion-pill-bar" id="companionPillForm">
      <button type="button" class="btn-pill-action" id="btnPillToggle" title="Hızlı Menü &amp; Eklentiler">+</button>
      <input type="text" class="companion-input" id="companionInput" placeholder="Yeni sohbet başlat veya Key gir..." autocomplete="off">
      <button type="submit" class="btn-pill-send" id="btnPillSend" title="Gönder">↑</button>
    </form>
  `;

  document.body.appendChild(wrapper);

  // Element Handles
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

  // Eye Expressions
  const EXPRESSIONS = ['> = <', '>_<', '^‿^', '•‿•', 'o_O', '•_•', '(★‿★)'];
  let currentExprIdx = 0;

  function setMascotExpression(expr) {
    if (eyesText) eyesText.textContent = expr;
  }

  // Hover animations
  stage.addEventListener('mouseenter', () => setMascotExpression('^‿^'));
  stage.addEventListener('mouseleave', () => {
    if (drawer.classList.contains('hidden')) setMascotExpression('> = <');
  });

  // Idle cycle
  setInterval(() => {
    if (!drawer.classList.contains('hidden')) return;
    setMascotExpression('--');
    setTimeout(() => {
      currentExprIdx = (currentExprIdx + 1) % (EXPRESSIONS.length - 1);
      setMascotExpression(EXPRESSIONS[currentExprIdx]);
    }, 250);
  }, 5000);

  // Speech bubble cycle
  const TIPS = [
    "İstemciyi indirmek için tıkla! 📥",
    "Anahtarını buraya yapıştırıp indirebilirsin! ⚡",
    "Yeni ekran kontrolü nasıl yapılır? 🛡️",
    "Linux için ./AtlasAC-Linux hazır! 🐧",
    "Soru sormak için yazmaya başla 🤖"
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

    // 1. Direct Key Validation right inside Robot!
    if (upper === 'ATLAS-KURUCU-2026' || upper.startsWith('ATLAS-KURUCU') || upper.startsWith('ATLAS-ADMIN') || rawTrim.startsWith('ATLAS1.')) {
      setMascotExpression('(★‿★)');
      const keyType = upper.startsWith('ATLAS-KURUCU') ? 'Yetkili Kurucu / Yönetici Anahtarı' : 'İmzalı Cihaz Lisansı';
      simulateBotAnswer(`
        🎉 <strong>Tebrikler! Anahtarınız Başarıyla Doğrulandı!</strong><br>
        <span style="color:#4ade80;">✓ ${keyType} Onaylandı.</span><br><br>
        İstemcinizi hemen indirmek için platformunuzu seçin:<br><br>
        <div style="display:grid;gap:8px;margin:8px 0;">
          <a href="https://github.com/ZeninKaanX/AtlasOyuncu-Hile-KontrolX/releases/download/v1.0.0/AtlasAC.exe" download="AtlasAC.exe" style="display:flex;align-items:center;justify-content:space-between;background:#0d111a;border:1px solid #00f0ff;color:#00f0ff;padding:10px 14px;border-radius:8px;font-weight:700;text-decoration:none;">
            <span>🪟 Windows x64 İndir (AtlasAC.exe)</span>
            <span>↓</span>
          </a>
          <a href="https://github.com/ZeninKaanX/AtlasOyuncu-Hile-KontrolX/releases/download/v1.0.0/AtlasAC-Linux" download="AtlasAC-Linux" style="display:flex;align-items:center;justify-content:space-between;background:#0d111a;border:1px solid #38bdf8;color:#38bdf8;padding:10px 14px;border-radius:8px;font-weight:700;text-decoration:none;">
            <span>🐧 Linux x64 İndir (AtlasAC-Linux)</span>
            <span>↓</span>
          </a>
        </div>
        <small style="color:#94a3b8;">Ayrıca anahtarınız girilmiş şekilde özel indirme portalını açmak için: <a href="download.html?key=${encodeURIComponent(rawTrim)}" style="color:#00f0ff;text-decoration:underline;">[download.html Portalını Aç]</a></small>
      `);
      return;
    }

    // 2. 404 or Download Query Dispatcher
    if (clean.includes('404') || clean.includes('indir') || clean.includes('download') || clean.includes('link') || clean.includes('exe')) {
      simulateBotAnswer(`
        🚀 <strong>Atlas AC İstemci İndirme &amp; Doğrulama Portalı</strong><br><br>
        Atlas AC doğrudan herkese açık dosya olarak sunulmaz; 404 almamak ve güvenli indirmek için özel indirme sayfamız hazırlanmıştır:<br><br>
        👉 <a href="download.html" style="color:#00f0ff;font-weight:700;font-size:13px;text-decoration:underline;">[Yetkili İndirme Sayfası: download.html]</a><br><br>
        1. Sayfaya gidin ve Windows veya Linux seçin.<br>
        2. Davet anahtarınızı (örn: <code>ATLAS-KURUCU-2026</code>) kutuya girin.<br>
        3. <em>"Anahtarı Doğrula &amp; İndirmeyi Başlat"</em> butonuna basın. Dosya anında inecektir!
      `);
      return;
    }

    // Smart Keyword Dispatcher
    let match = null;

    if (clean.includes('kont') || clean.includes('ekran') || clean.includes('tarama') || clean.includes('ss') || clean.includes('adli')) {
      match = BOT_KNOWLEDGE.find(k => k.id === 'kont');
    } else if (clean.includes('linux') || clean.includes('ubuntu') || clean.includes('arch') || clean.includes('sh')) {
      match = BOT_KNOWLEDGE.find(k => k.id === 'linux');
    } else if (clean.includes('lisans') || clean.includes('key') || clean.includes('ücret') || clean.includes('fiyat') || clean.includes('davet')) {
      match = BOT_KNOWLEDGE.find(k => k.id === 'lisans');
    } else if (clean.includes('bypass') || clean.includes('hile') || clean.includes('vape') || clean.includes('raven') || clean.includes('yakala')) {
      match = BOT_KNOWLEDGE.find(k => k.id === 'bypass');
    } else if (clean.includes('makine') || clean.includes('hwid') || clean.includes('id')) {
      match = BOT_KNOWLEDGE.find(k => k.id === 'hwid');
    }

    if (match) {
      simulateBotAnswer(match.answer);
    } else if (clean.includes('selam') || clean.includes('merhaba') || clean.includes('sa') || clean.includes('hey') || clean.includes('naber')) {
      simulateBotAnswer('Aleykümselam! Hoş geldin. Sana Atlas AC hile kontrol sistemi, istemci indirme portalı veya canlı adli kontrol hakkında yardımcı olmaktan mutluluk duyarım 🤖 Bir soru sorabilir veya lisans anahtarını yazabilirsin!');
    } else {
      simulateBotAnswer(`Sorduğun soruyu anladım! Hızlı işlem yapmak için doğrudan <a href="download.html" style="color:#00f0ff;font-weight:700;">İndirme Sayfası</a>'na gidebilir veya <a href="dashboard.html" style="color:#00f0ff;font-weight:700;">Yetkili Paneli</a>'nden Canlı Kontrol başlatabilirsin 🤖`);
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
