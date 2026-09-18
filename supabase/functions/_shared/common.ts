import { createClient } from 'npm:@supabase/supabase-js@2';

export const cors = (origin: string) => {
  const configuredOrigin = Deno.env.get('APP_ORIGIN') || '';
  const allowedOrigins = new Set([
    configuredOrigin,
    'https://zeninkaanx.github.io',
    'http://localhost:8000',
    'http://127.0.0.1:8000'
  ].filter(Boolean));
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  };
  let isLocalDevelopment = false;
  try {
    const parsed = new URL(origin);
    isLocalDevelopment = parsed.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  } catch (_) {}
  const isAllowed = !origin || allowedOrigins.has(origin) || isLocalDevelopment;
  if (isAllowed) {
    headers['Access-Control-Allow-Origin'] = origin || '*';
    headers['Access-Control-Allow-Headers'] = 'authorization, apikey, content-type, x-admin-token';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
  }
  return headers;
};

export const admin = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export const json = (data: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(data), { status, headers });

export async function sha256(value: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export function secureEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function randomKey(bytes = 18) {
  const value = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(value, b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}
