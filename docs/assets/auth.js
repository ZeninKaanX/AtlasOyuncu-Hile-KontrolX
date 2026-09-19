import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, configured } from './config.js';

const byId = id => document.getElementById(id);
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null;

function safeNextPage() {
  const candidate = new URLSearchParams(location.search).get('next') || '';
  if (candidate === 'dashboard.html') return candidate;
  if (/^results\.html\?scan=[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(candidate)) return candidate;
  return 'dashboard.html';
}

const nextPage = safeNextPage();

function authUrl(selectedMode) {
  const params = new URLSearchParams();
  if (selectedMode === 'register') params.set('mode', 'register');
  if (nextPage !== 'dashboard.html') params.set('next', nextPage);
  const query = params.toString();
  return query ? `auth.html?${query}` : 'auth.html';
}

function status(id, message, ok = false) {
  const element = byId(id);
  element.textContent = message;
  element.className = `form-status show ${ok ? 'ok' : 'error'}`;
  element.style.display = 'block';
}

function mode(value) {
  const register = value === 'register';
  byId('loginForm').classList.toggle('hidden', register);
  byId('registerForm').classList.toggle('hidden', !register);
  byId('loginTab').classList.toggle('active', !register);
  byId('registerTab').classList.toggle('active', register);
  byId('authTitle').textContent = register ? 'Davetinizle başlayın.' : 'Tekrar hoş geldiniz.';
  byId('authSubtitle').textContent = register
    ? 'Yetkili hesabınızı davet anahtarıyla oluşturun.'
    : 'Tarama PIN’leri oluşturmak ve raporları incelemek için giriş yapın.';
  history.replaceState(null, '', authUrl(register ? 'register' : 'login'));
}

if (!configured) byId('configWarning').classList.remove('hidden');
byId('loginTab').addEventListener('click', () => mode('login'));
byId('registerTab').addEventListener('click', () => mode('register'));
byId('toggleLoginPass').addEventListener('click', () => {
  const input = byId('loginPassword');
  input.type = input.type === 'password' ? 'text' : 'password';
});
byId('forgotPassword').addEventListener('click', event => {
  event.preventDefault();
  status('loginStatus', 'Şifre yenileme için sistem yöneticinizle iletişime geçin.');
});
byId('discordNotice').addEventListener('click', () => {
  status('loginStatus', 'Discord ile giriş etkin değil. E-posta ve şifrenizi kullanın.');
});

if (new URLSearchParams(location.search).get('mode') === 'register') mode('register');

if (supabase) {
  const { data } = await supabase.auth.getSession();
  if (data.session) location.replace(nextPage);
}

byId('loginForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (!supabase) return status('loginStatus', 'Supabase bağlantısı yapılandırılmadı.');
  const button = event.submitter;
  button.disabled = true;
  const { error } = await supabase.auth.signInWithPassword({
    email: byId('loginEmail').value.trim().toLowerCase(),
    password: byId('loginPassword').value
  });
  button.disabled = false;
  if (error) return status('loginStatus', 'E-posta veya şifre hatalı.');
  location.replace(nextPage);
});

byId('registerForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (!configured) return status('registerStatus', 'Supabase bağlantısı yapılandırılmadı.');
  const button = event.submitter;
  button.disabled = true;
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({
        username: byId('registerUsername').value.trim(),
        email: byId('registerEmail').value.trim().toLowerCase(),
        password: byId('registerPassword').value,
        inviteKey: byId('inviteKey').value.trim()
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Kayıt başarısız.');
    status('registerStatus', result.message, true);
    byId('loginEmail').value = byId('registerEmail').value.trim();
    setTimeout(() => mode('login'), 900);
  } catch (error) {
    status('registerStatus', error.message);
  } finally {
    button.disabled = false;
  }
});
