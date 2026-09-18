import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

const PIN_RE = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/;
const byId = id => document.getElementById(id);
let selectedPlatform = 'windows';

function renderPlatform() {
  for (const [id, platform] of [['cardWin', 'windows'], ['cardLin', 'linux']]) {
    const button = byId(id);
    const active = selectedPlatform === platform;
    button?.classList.toggle('active', active);
    button?.setAttribute('aria-pressed', String(active));
  }
  byId('dlLinuxQuickStart')?.classList.toggle('hidden', selectedPlatform !== 'linux');
}

function renderPin() {
  const input = byId('dlKeyInput');
  const value = String(input?.value || '').toUpperCase().replace(/[^23456789A-HJ-NP-Z]/g, '').slice(0, 8);
  if (input) input.value = value;
  document.querySelectorAll('#pinPreviewSlots span').forEach((slot, index) => {
    slot.textContent = value[index] || '';
    slot.setAttribute('data-filled', String(index < value.length));
  });
}

function setStatus(message, kind = '') {
  const status = byId('dlResultStatus');
  status.textContent = message;
  status.className = `pin-status ${kind}`.trim();
}

byId('cardWin')?.addEventListener('click', () => {
  selectedPlatform = 'windows';
  renderPlatform();
});

byId('cardLin')?.addEventListener('click', () => {
  selectedPlatform = 'linux';
  renderPlatform();
});

byId('dlKeyInput')?.addEventListener('input', renderPin);

const params = new URLSearchParams(location.search);
const suppliedPin = String(params.get('pin') || '').toUpperCase();
if (PIN_RE.test(suppliedPin)) byId('dlKeyInput').value = suppliedPin;
if (params.get('platform') === 'linux') selectedPlatform = 'linux';
renderPlatform();
renderPin();

byId('dlKeyForm')?.addEventListener('submit', async event => {
  event.preventDefault();
  const pin = byId('dlKeyInput').value.trim().toUpperCase();
  if (!PIN_RE.test(pin)) {
    setStatus('PIN sekiz karakter olmalıdır.', 'error');
    byId('dlKeyInput').focus();
    return;
  }

  const button = byId('btnVerifyDownload');
  button.disabled = true;
  button.textContent = 'PIN doğrulanıyor…';
  setStatus('Güvenli indirme bağlantısı hazırlanıyor…');
  byId('dlMirrorsContainer')?.classList.add('hidden');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/scan-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
      },
      body: JSON.stringify({ action: 'download', pin, platform: selectedPlatform })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.url) throw new Error(result.error || 'İndirme bağlantısı alınamadı.');

    const link = byId('btnPrimaryDl');
    link.href = result.url;
    link.setAttribute('download', result.filename || 'AtlasAC');
    byId('lblPrimaryDl').textContent = `${result.filename || 'AtlasAC'} dosyasını indir`;
    byId('dlMirrorsContainer')?.classList.remove('hidden');
    setStatus('PIN doğrulandı. Özel indirme bağlantınız 90 saniye geçerli.', 'success');
    link.click();
  } catch (error) {
    setStatus(error.message || 'PIN doğrulanamadı.', 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'PIN Doğrula ve İndir';
  }
});
