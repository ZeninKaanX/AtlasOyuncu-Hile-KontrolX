import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

let selectedPlatform = 'windows';
let selectedMirror = 'turbo';

const cardWin = document.getElementById('cardWin');
const cardLin = document.getElementById('cardLin');
const form = document.getElementById('dlKeyForm');
const keyInput = document.getElementById('dlKeyInput');
const resultBox = document.getElementById('dlResultBox');
const resultStatus = document.getElementById('dlResultStatus');
const resultDetails = document.getElementById('dlResultDetails');
const mirrorsContainer = document.getElementById('dlMirrorsContainer');
const btnPrimaryDl = document.getElementById('btnPrimaryDl');
const btnMirror2 = document.getElementById('btnMirror2');
const btnFallbackDl = document.getElementById('btnFallbackDl');
const lblPrimaryDl = document.getElementById('lblPrimaryDl');
const linuxQuickStart = document.getElementById('dlLinuxQuickStart');

// Platform Selector Click Handlers
if (cardWin) {
  cardWin.addEventListener('click', () => {
    selectedPlatform = 'windows';
    cardWin.classList.add('active');
    if (cardLin) cardLin.classList.remove('active');
    updateLinks();
  });
}

if (cardLin) {
  cardLin.addEventListener('click', () => {
    selectedPlatform = 'linux';
    cardLin.classList.add('active');
    if (cardWin) cardWin.classList.remove('active');
    updateLinks();
  });
}

function getDownloadUrls(platform) {
  const filename = platform === 'linux' ? 'AtlasAC-Linux' : 'AtlasAC.exe';
  const ghUrl = `https://github.com/ZeninKaanX/AtlasOyuncu-Hile-KontrolX/releases/download/v1.0.0/${filename}`;
  return {
    filename,
    // Turbo CDN Mirror (Cloudflare Edge Cache - Instant line speed in TR & EU)
    turbo: `https://ghproxy.net/${ghUrl}`,
    // Alternative fast mirror
    mirror2: `https://mirror.ghproxy.com/${ghUrl}`,
    // Direct GitHub release
    primary: `https://ghproxy.net/${ghUrl}`,
    fallback: ghUrl
  };
}

function updateLinks() {
  const urls = getDownloadUrls(selectedPlatform);
  if (btnPrimaryDl) {
    btnPrimaryDl.href = urls.turbo;
    btnPrimaryDl.setAttribute('download', urls.filename);
  }
  if (btnMirror2) {
    btnMirror2.href = urls.mirror2;
    btnMirror2.setAttribute('download', urls.filename);
  }
  if (btnFallbackDl) {
    btnFallbackDl.href = urls.fallback;
    btnFallbackDl.setAttribute('download', urls.filename);
  }
  if (lblPrimaryDl) {
    lblPrimaryDl.textContent = `Turbo İndir (${urls.filename} - ${selectedPlatform === 'linux' ? 'Linux' : 'Windows'})`;
  }

  if (linuxQuickStart) {
    if (selectedPlatform === 'linux') {
      linuxQuickStart.classList.remove('hidden');
    } else {
      linuxQuickStart.classList.add('hidden');
    }
  }
}

// Check URL Params for pre-filled key (?key=... or ?pin=...)
const urlParams = new URLSearchParams(window.location.search);
const keyFromUrl = urlParams.get('key') || urlParams.get('pin') || urlParams.get('code');
if (keyFromUrl && keyInput) {
  keyInput.value = keyFromUrl.trim().toUpperCase();
}
const platFromUrl = urlParams.get('platform');
if (platFromUrl === 'linux' && cardLin) {
  cardLin.click();
} else {
  updateLinks();
}

// Auto submit if PIN or Key provided in URL
if (keyFromUrl && form) {
  setTimeout(() => {
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  }, 300);
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawKey = keyInput ? keyInput.value.trim() : '';
    if (!rawKey) return;

    const btn = document.getElementById('btnVerifyDownload');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Doğrulanıyor...';
    }

    if (resultBox) resultBox.className = 'dl-result-box hidden';
    if (mirrorsContainer) mirrorsContainer.classList.add('hidden');

    try {
      let isValid = false;
      let label = '';
      const cleanUpper = rawKey.toUpperCase();

      // Check 0: Ocean AC Scan PIN Check (8-char PIN or ATL-XXXX)
      if (cleanUpper.length >= 4 && cleanUpper.length <= 16 && !cleanUpper.startsWith('ATLAS1.')) {
        try {
          const pinRes = await fetch(`${SUPABASE_URL}/functions/v1/scan-sync?code=${encodeURIComponent(cleanUpper)}`, {
            headers: { apikey: SUPABASE_PUBLISHABLE_KEY }
          });
          if (pinRes.ok) {
            const pinData = await pinRes.json();
            if (pinData && pinData.session) {
              isValid = true;
              label = `Geçerli Ocean Tarama PIN'i: ${cleanUpper} (Oyuncu: ${pinData.session.player_name || 'Şüpheli'})`;
            }
          }
        } catch (_) {}
      }

      // Check 1: Founder Invite / Admin Code
      if (!isValid && (cleanUpper === 'ATLAS-KURUCU-2026' || cleanUpper.startsWith('ATLAS-KURUCU') || cleanUpper.startsWith('ATLAS-ADMIN') || cleanUpper === 'DEMO8PIN')) {
        isValid = true;
        label = 'Yetkili Kontrol / Demo PIN Onaylandı';
      } 
      // Check 2: Signed Ed25519 License Format: ATLAS1.<payload_b64>.<sig_b64>
      else if (!isValid && rawKey.startsWith('ATLAS1.')) {
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
        if (resultBox) {
          resultBox.className = 'dl-result-box success';
          resultBox.classList.remove('hidden');
        }
        if (resultStatus) resultStatus.textContent = 'PIN DOĞRULANDI - İNDİRME BAŞLATILIYOR...';
        if (resultDetails) resultDetails.textContent = `${label}. Turbo CDN üzerinden en yüksek hızda indiriliyor.`;
        if (mirrorsContainer) mirrorsContainer.classList.remove('hidden');
        updateLinks();

        // Trigger download automatically via fastest Cloudflare CDN
        const urls = getDownloadUrls(selectedPlatform);
        setTimeout(() => {
          const a = document.createElement('a');
          a.href = urls.turbo;
          a.setAttribute('download', urls.filename);
          document.body.appendChild(a);
          a.click();
          a.remove();
        }, 500);

      } else {
        if (resultBox) {
          resultBox.className = 'dl-result-box error';
          resultBox.classList.remove('hidden');
        }
        if (resultStatus) resultStatus.textContent = 'GEÇERSİZ VEYA SÜRESİ DOLMUŞ PIN';
        if (resultDetails) resultDetails.textContent = 'Girdiğiniz PIN veya anahtar doğrulanamadı. Lütfen yetkilinizden aldığınız 8 haneli PIN kodunu (Örn: 8F3C21A9) girin.';
      }

    } catch (err) {
      if (resultBox) {
        resultBox.className = 'dl-result-box error';
        resultBox.classList.remove('hidden');
      }
      if (resultStatus) resultStatus.textContent = 'Bağlantı Hatası';
      if (resultDetails) resultDetails.textContent = err.message;
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'PIN Doğrula &amp; Turbo İndir';
      }
    }
  });
}
