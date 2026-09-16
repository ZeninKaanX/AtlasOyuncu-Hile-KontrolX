/**
 * Atlas AC — Chibi Cyber Companion Robot
 * Exactly matching user reference (Interactive blue robot with LED visor expressions)
 */

const BOT_KNOWLEDGE = [
  {
    id: 'nedir',
    title: 'Atlas AC Nedir?',
    desc: 'Adli bilişim, 33 tarama motoru ve çalışma prensibi',
    icon: '🛡️',
    answer: `<strong>Atlas AC</strong>, Minecraft toplulukları ve sunucu yetkilileri için geliştirilmiş yeni nesil <em>adli bilişim (forensic) hile kontrol</em> platformudur.<br><br>
    Tipki Ocean AC mantığında çalışır; hem aktif Minecraft süreçlerini hem de silinmiş/gizlenmiş hile dosyalarını (USN Journal, Prefetch, BAM, tahrif edilmiş JVM) saniyeler içinde kesin kanıta dönüştürür.`
  },
  {
    id: 'linux',
    title: 'Linux Desteği & Kurulum',
    desc: 'Ubuntu, Arch, Debian üzerinde tek tıkla çalıştırma',
    icon: '🐧',
    answer: `Evet! <strong>Atlas AC tam Linux uyumludur!</strong><br><br>
    • Panelimizden <strong>Linux (x64)</strong> binary dosyasını indirin.<br>
    • Terminalde doğrudan çalıştırın:<br>
    <code style="display:block;padding:6px;background:rgba(0,0,0,0.4);border-radius:4px;margin:6px 0;font-size:11px;">chmod +x AtlasAC-Linux && ./AtlasAC-Linux</code>
    • Veya proje içindeki <code>./baslat.sh</code> betiğini kullanabilirsiniz. Ek paket veya Node.js kurulumu gerekmez.`
  },
  {
    id: 'lisans',
    title: 'Lisans & Kayıt',
    desc: 'Davet koduyla hesap açma ve Ed25519 lisans alma',
    icon: '🔑',
    answer: `Atlas AC herkese açık bir indirme değildir; <strong>kontrollü davet modeli</strong> ile korunur.<br><br>
    1. Yöneticinizden tek kullanımlık bir <strong>Davet Kodu</strong> alın.<br>
    2. Siteden hesabınızı açın ve giriş yapın.<br>
    3. Bilgisayarınızdaki Atlas AC'nin verdiği 64 haneli <strong>Makine Kimliği (Machine ID)</strong>'ni panele girin.<br>
    4. Saniyeler içinde yalnızca sizin cihazınız için geçerli <strong>Ed25519 imzalı lisansınız</strong> üretilir.`
  },
  {
    id: 'kont',
    title: 'Ekran Kontrolü (Kont)',
    desc: 'Siber dikdörtgen ilerleme ekranı ve adli onay kutusu',
    icon: '📊',
    answer: `Yetkili oyuncuyu kontrole (ekran paylaşımına) çektiğinde oyuncu <code>AtlasAC</code> uygulamasını açar.<br><br>
    • Ekranda fütüristik <strong>siber dikdörtgen yüzdelik bar</strong> belirir.<br>
    • 33 adli motor %0'dan %100'e kadar sistemi saniyeler içinde tarar.<br>
    • Tarama bittiğinde ekranda net bir <strong>🟢 TEMİZ (0 İHLAL)</strong> veya <strong>🔴 İHLAL BULUNDU</strong> karar kutusu kalır.`
  },
  {
    id: 'bypass',
    title: 'Bypass & Güvenlik',
    desc: 'Freecam atlatma engeli ve 13.321 mod koruması',
    icon: '🚫',
    answer: `Atlas AC, piyasadaki atlatma tekniklerine karşı <strong>fail-closed</strong> mimarisiyle güçlendirilmiştir.<br><br>
    • Freecam dosya adı kamuflajları engellendi.<br>
    • .png / .tmp uzantılı hileler bytecode seviyesinde yakalanır.<br>
    • Silinen dosyalar USN kütüğünden kurtarılır.<br>
    • 13.321 girdili Modrinth temiz listesi ile masum modlar (Sodium, Lithium vb.) asla sahte banlanmaz.`
  },
  {
    id: 'machine',
    title: 'Makine Kimliği (HWID)',
    desc: '64 karakterli cihaz GUID bilgisi nereden alınır?',
    icon: '💻',
    answer: `Atlas AC uygulamasını bilgisayarınızda açtığınızda ekranda 64 karakterli SHA-256 tabanlı <strong>Makine Kimliği</strong> (Machine GUID) görüntülenir.<br><br>
    Bu kimliği kopyalayıp web panelindeki kutuya yapıştırmanız yeterlidir.`
  }
];

function initAtlasMascotBot() {
  // Check if already mounted
  if (document.getElementById('atlasCompanionWrapper')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'atlas-companion-wrapper';
  wrapper.id = 'atlasCompanionWrapper';

  wrapper.innerHTML = `
    <!-- Speech Prompt above Mascot -->
    <div class="mascot-speech-bubble" id="mascotBubble">Merhaba! Ben Atlas AC Asistanı 🤖</div>

    <!-- The Animated Chibi Cyber Robot (Matching User Image) -->
    <div class="mascot-avatar-stage" id="mascotStage" title="Atlas Bot — Tıklayarak sohbeti aç/kapat">
      <svg class="mascot-body-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cloudHeadGrad" x1="20" y1="10" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop stop-color="#60a5fa" />
            <stop offset="0.5" stop-color="#3b82f6" />
            <stop offset="1" stop-color="#1d4ed8" />
          </linearGradient>
          <linearGradient id="visorGrad" x1="30" y1="35" x2="70" y2="65" gradientUnits="userSpaceOnUse">
            <stop stop-color="#050814" />
            <stop offset="1" stop-color="#0f172a" />
          </linearGradient>
          <linearGradient id="bodyGrad" x1="35" y1="65" x2="65" y2="90" gradientUnits="userSpaceOnUse">
            <stop stop-color="#3b82f6" />
            <stop offset="1" stop-color="#1e40af" />
          </linearGradient>
          <filter id="neonVisorGlow" x="0" y="0" width="100" height="100" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Cute Chibi Limbs & Feet -->
        <rect x="36" y="78" width="10" height="14" rx="5" fill="#1d4ed8" />
        <rect x="54" y="78" width="10" height="14" rx="5" fill="#1d4ed8" />
        <ellipse cx="41" cy="91" rx="7" ry="4" fill="#60a5fa" />
        <ellipse cx="59" cy="91" rx="7" ry="4" fill="#60a5fa" />

        <!-- Robot Torso -->
        <rect x="35" y="64" width="30" height="20" rx="8" fill="url(#bodyGrad)" stroke="#60a5fa" stroke-width="1.5" />
        <!-- Cute Little Arms -->
        <rect x="25" y="66" width="9" height="15" rx="4.5" fill="#2563eb" transform="rotate(15 25 66)" />
        <rect x="66" y="68" width="9" height="15" rx="4.5" fill="#2563eb" transform="rotate(-15 66 68)" />

        <!-- Cloud Chibi Helmet / Head -->
        <path d="M26 44C22 44 18 48 18 53C18 58 22 62 27 62H73C78 62 82 58 82 53C82 48 78 44 74 44C74 42 74 40 73 38C70 30 62 24 53 24C45 24 38 29 34 36C31 38 28 41 26 44Z" 
              fill="url(#cloudHeadGrad)" filter="drop-shadow(0 4px 10px rgba(37,99,235,0.5))" />
        
        <!-- Top Cute Antenna Head Tufts -->
        <path d="M43 25C43 18 47 14 50 14C53 14 57 18 57 25Z" fill="#93c5fd" />

        <!-- Dark Robot Visor Screen -->
        <rect x="28" y="38" width="44" height="24" rx="10" fill="url(#visorGrad)" stroke="#38bdf8" stroke-width="1.5" />

        <!-- Dynamic Visor LED Eyes (SVG Text/Shapes) -->
        <g id="mascotEyesG" class="eye-glow">
          <!-- Default Friendly Eyes: > < or • • -->
          <text id="mascotEyesText" x="50" y="55" font-family="'JetBrains Mono', monospace, sans-serif" font-size="14" font-weight="900" fill="#00f0ff" text-anchor="middle" letter-spacing="4">&gt;_&lt;</text>
        </g>
      </svg>
      <div class="mascot-shadow"></div>
    </div>

    <!-- Dropdown Topic & Chat Drawer (Exact Look from User Reference) -->
    <div class="companion-drawer hidden" id="companionDrawer">
      <div class="drawer-header">
        <strong><span>🤖</span> Atlas AC Asistan</strong>
        <button class="drawer-close" id="btnDrawerClose">✕</button>
      </div>

      <div class="drawer-chat-area" id="drawerChatArea">
        <div class="drawer-chat-msg bot">
          <div class="drawer-bubble">
            Selam! Ben <strong>Atlas AC Robotu</strong>. Hile kontrol sistemi, Linux/Windows kurulumu veya lisanslama hakkında sorularını cevaplayabilirim.
          </div>
        </div>
      </div>

      <!-- Quick Topics List (Like "Eklentiler" in User Screenshot) -->
      <div class="drawer-topics-list" id="drawerTopicsList">
        ${BOT_KNOWLEDGE.map(k => `
          <button class="drawer-topic-item" data-id="${k.id}">
            <div class="topic-icon">${k.icon}</div>
            <div class="topic-text">
              <span class="topic-title">${k.title}</span>
              <span class="topic-desc">${k.desc}</span>
            </div>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Floating Input Pill Bar (Matching User Screenshot: [+] Soru sor... [↑]) -->
    <form class="companion-pill-bar" id="companionPillForm">
      <button type="button" class="btn-pill-action" id="btnPillToggle" title="Konular & Eklentiler Menüsü">+</button>
      <input type="text" class="companion-input" id="companionInput" placeholder="Yeni soru sorun veya konu seçin..." autocomplete="off">
      <button type="submit" class="btn-pill-send" id="btnPillSend" title="Gönder">↑</button>
    </form>
  `;

  document.body.appendChild(wrapper);

  // References
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

  // Eye Expression Controller
  const EXPRESSIONS = ['>_<', '^‿^', '•‿•', '>_>', '•_•', '~_~'];
  let currentExprIdx = 0;

  function setMascotExpression(expr) {
    if (eyesText) eyesText.textContent = expr;
  }

  // Periodic Cute Idle Blinks
  setInterval(() => {
    if (!drawer.classList.contains('hidden')) return;
    setMascotExpression('--');
    setTimeout(() => {
      currentExprIdx = (currentExprIdx + 1) % EXPRESSIONS.length;
      setMascotExpression(EXPRESSIONS[currentExprIdx]);
    }, 250);
  }, 4000);

  function toggleDrawer(open) {
    const shouldOpen = typeof open === 'boolean' ? open : drawer.classList.contains('hidden');
    if (shouldOpen) {
      drawer.classList.remove('hidden');
      btnToggle.classList.add('active');
      setMascotExpression('^‿^');
      bubble.style.display = 'none';
      input.focus();
    } else {
      drawer.classList.add('hidden');
      btnToggle.classList.remove('active');
      setMascotExpression('>_<');
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
      setMascotExpression('^‿^');
      appendChat(answerHtml, false);
    }, 450);
  }

  function handleQuery(text) {
    const clean = text.trim().toLowerCase();
    if (!clean) return;

    toggleDrawer(true);
    appendChat(escapeHtml(text), true);

    let match = BOT_KNOWLEDGE.find(k => k.id === clean);
    if (!match) {
      match = BOT_KNOWLEDGE.find(k => clean.includes(k.id) || k.title.toLowerCase().includes(clean) || clean.includes(k.title.toLowerCase()));
    }
    if (!match) {
      if (clean.includes('linux') || clean.includes('ubuntu') || clean.includes('arch') || clean.includes('sh')) match = BOT_KNOWLEDGE.find(k => k.id === 'linux');
      else if (clean.includes('lisans') || clean.includes('key') || clean.includes('ücret') || clean.includes('fiyat')) match = BOT_KNOWLEDGE.find(k => k.id === 'lisans');
      else if (clean.includes('kont') || clean.includes('ekran') || clean.includes('tarama')) match = BOT_KNOWLEDGE.find(k => k.id === 'kont');
      else if (clean.includes('bypass') || clean.includes('hile') || clean.includes('vape')) match = BOT_KNOWLEDGE.find(k => k.id === 'bypass');
      else if (clean.includes('makine') || clean.includes('hwid') || clean.includes('id')) match = BOT_KNOWLEDGE.find(k => k.id === 'machine');
      else if (clean.includes('nedir') || clean.includes('ne işe')) match = BOT_KNOWLEDGE.find(k => k.id === 'nedir');
    }

    if (match) {
      simulateBotAnswer(match.answer);
    } else if (clean.includes('selam') || clean.includes('merhaba') || clean.includes('sa')) {
      simulateBotAnswer('Aleykümselam! Hoş geldin. Sana Atlas AC hile kontrol sistemiyle ilgili nasıl yardımcı olabilirim? Aşağıdaki konulardan birini seçebilirsin!');
    } else {
      simulateBotAnswer(`Bu soruyu not aldım! Atlas AC hakkında hızlı bilgi edinmek için aşağıdaki başlıklardan birine tıklayabilirsin 🤖`);
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
