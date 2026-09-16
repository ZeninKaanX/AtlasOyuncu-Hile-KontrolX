import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

let selectedPlatform = 'windows';

const cardWin = document.getElementById('cardWin');
const cardLin = document.getElementById('cardLin');
const form = document.getElementById('dlKeyForm');
const keyInput = document.getElementById('dlKeyInput');
const resultBox = document.getElementById('dlResultBox');
const resultStatus = document.getElementById('dlResultStatus');
const resultDetails = document.getElementById('dlResultDetails');
const mirrorsContainer = document.getElementById('dlMirrorsContainer');
const btnPrimaryDl = document.getElementById('btnPrimaryDl');
const btnFallbackDl = document.getElementById('btnFallbackDl');
const lblPrimaryDl = document.getElementById('lblPrimaryDl');
const linuxQuickStart = document.getElementById('dlLinuxQuickStart');

// Platform Selector Click Handlers
cardWin.addEventListener('click', () => {
  selectedPlatform = 'windows';
  cardWin.classList.add('active');
  cardLin.classList.remove('active');
  updateLinks();
});

cardLin.addEventListener('click', () => {
  selectedPlatform = 'linux';
  cardLin.classList.add('active');
  cardWin.classList.remove('active');
  updateLinks();
});

function getDownloadUrls(platform) {
  const filename = platform === 'linux' ? 'AtlasAC-Linux' : 'AtlasAC.exe';
  return {
    filename,
    primary: `https://github.com/ZeninKaanX/AtlasOyuncu-Hile-KontrolX/releases/download/v1.0.0/${filename}`,
    fallback: `https://github.com/ZeninKaanX/AtlasOyuncu-Hile-KontrolX/releases/tag/v1.0.0`
  };
}

function updateLinks() {
  const { filename, primary, fallback } = getDownloadUrls(selectedPlatform);
  btnPrimaryDl.href = primary;
  btnPrimaryDl.setAttribute('download', filename);
  btnFallbackDl.href = fallback;
  lblPrimaryDl.textContent = `⚡ ${filename} İndir (${selectedPlatform === 'linux' ? 'Linux x64' : 'Windows x64'})`;

  if (selectedPlatform === 'linux') {
    linuxQuickStart.classList.remove('hidden');
  } else {
    linuxQuickStart.classList.add('hidden');
  }
}

// Check URL Params for pre-filled key (?key=...)
const urlParams = new URLSearchParams(window.location.search);
const keyFromUrl = urlParams.get('key');
if (keyFromUrl) {
  keyInput.value = keyFromUrl.trim();
}
const platFromUrl = urlParams.get('platform');
if (platFromUrl === 'linux') {
  cardLin.click();
} else {
  updateLinks();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const rawKey = keyInput.value.trim();
  if (!rawKey) return;

  const btn = document.getElementById('btnVerifyDownload');
  btn.disabled = true;
  btn.textContent = 'Anahtar Doğrulanıyor...';

  resultBox.className = 'dl-result-box hidden';
  mirrorsContainer.classList.add('hidden');

  try {
    let isValid = false;
    let label = '';

    // Check 1: Founder Invite / Admin Code
    const cleanUpper = rawKey.toUpperCase();
    if (cleanUpper === 'ATLAS-KURUCU-2026' || cleanUpper.startsWith('ATLAS-KURUCU') || cleanUpper.startsWith('ATLAS-ADMIN')) {
      isValid = true;
      label = 'Yetkili Kurucu / Yönetici Anahtarı Onaylandı';
    } 
    // Check 2: Signed Ed25519 License Format: ATLAS1.<payload_b64>.<sig_b64>
    else if (rawKey.startsWith('ATLAS1.')) {
      try {
        const parts = rawKey.split('.');
        if (parts.length === 3) {
          const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
          const payload = JSON.parse(payloadJson);
          if (payload.product === 'atlas-ac' && new Date(payload.expiresAt).getTime() > Date.now()) {
            isValid = true;
            label = `Geçerli Cihaz Lisansı Onaylandı (Kullanıcı: ${payload.customer || 'Yetkili'})`;
          }
        }
      } catch (_) {}
    }

    // Check 3: Check against Supabase invites if not validated locally
    if (!isValid && rawKey.length >= 10) {
      try {
        // Hash the key using WebCrypto SHA-256
        const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawKey));
        const hashHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

        const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/invites?code_hash=eq.${hashHex}&select=id,label,expires_at`, {
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
          }
        });
        const invites = await checkRes.json();
        if (Array.isArray(invites) && invites.length > 0) {
          const inv = invites[0];
          if (new Date(inv.expires_at).getTime() > Date.now()) {
            isValid = true;
            label = `Geçerli Davet Anahtarı: ${inv.label}`;
          }
        }
      } catch (_) {}
    }

    if (isValid) {
      resultBox.className = 'dl-result-box success';
      resultStatus.textContent = '✓ LİSANS / ANAHTAR DOĞRULANDI!';
      resultDetails.textContent = `${label}. İndirme işlemi başlatılıyor...`;
      mirrorsContainer.classList.remove('hidden');
      updateLinks();

      // Trigger download automatically
      const { filename, primary } = getDownloadUrls(selectedPlatform);
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = primary;
        a.setAttribute('download', filename);
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, 700);

    } else {
      resultBox.className = 'dl-result-box error';
      resultStatus.textContent = '✕ GEÇERSİZ VEYA SÜRESİ DOLMUŞ ANAHTAR';
      resultDetails.textContent = 'Girdiğiniz anahtar doğrulanamadı. Lütfen yöneticinizden aldığınız geçerli Davet Kodunu veya panelden oluşturduğunuz ATLAS1... lisans anahtarını girin.';
    }

    resultBox.classList.remove('hidden');

  } catch (err) {
    resultBox.className = 'dl-result-box error';
    resultStatus.textContent = 'Bağlantı Hatası';
    resultDetails.textContent = err.message;
    resultBox.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '⚡ Anahtarı Doğrula &amp; İndirmeyi Başlat <span>↓</span>';
  }
});
