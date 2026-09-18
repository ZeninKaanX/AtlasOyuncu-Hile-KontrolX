-- Secure, single-purpose PIN sessions for the Atlas AC player flow.
-- The PIN is only a short bootstrap secret. After claim, the client receives
-- a 256-bit bearer token which is required for every telemetry write.

alter table public.scan_sessions
  add column if not exists game text not null default 'Minecraft Java (PC)',
  add column if not exists expires_at timestamptz,
  add column if not exists claimed_at timestamptz,
  add column if not exists last_heartbeat_at timestamptz,
  add column if not exists client_id_hash text,
  add column if not exists client_token_hash text,
  add column if not exists download_count integer not null default 0;

update public.scan_sessions
set expires_at = coalesce(expires_at, created_at + interval '20 minutes');

alter table public.scan_sessions
  alter column expires_at set default (now() + interval '20 minutes'),
  alter column expires_at set not null;

alter table public.scan_sessions drop constraint if exists scan_sessions_status_check;
alter table public.scan_sessions
  add constraint scan_sessions_status_check
  check (status in ('pending', 'scanning', 'completed', 'failed', 'cancelled', 'expired'));

alter table public.scan_sessions drop constraint if exists scan_sessions_client_id_hash_check;
alter table public.scan_sessions
  add constraint scan_sessions_client_id_hash_check
  check (client_id_hash is null or client_id_hash ~ '^[a-f0-9]{64}$');

alter table public.scan_sessions drop constraint if exists scan_sessions_client_token_hash_check;
alter table public.scan_sessions
  add constraint scan_sessions_client_token_hash_check
  check (client_token_hash is null or client_token_hash ~ '^[a-f0-9]{64}$');

-- No browser receives direct table access. Authenticated staff use the portal
-- Edge Function, which applies ownership checks with the service role.
drop policy if exists "staff can read scans" on public.scan_sessions;
drop policy if exists "staff can insert scans" on public.scan_sessions;
drop policy if exists "staff can update scans" on public.scan_sessions;
revoke all on public.scan_sessions from anon, authenticated;

create index if not exists scan_sessions_active_code_idx
  on public.scan_sessions(session_code, expires_at)
  where status in ('pending', 'scanning');

create index if not exists scan_sessions_staff_recent_idx
  on public.scan_sessions(staff_id, created_at desc);

-- Lightweight persistent throttling for public PIN endpoints. IP addresses are
-- hashed before insertion; raw addresses are never stored.
create table if not exists public.pin_request_log (
  id bigint generated always as identity primary key,
  ip_hash text not null check (ip_hash ~ '^[a-f0-9]{64}$'),
  action text not null check (action in ('download', 'claim')),
  created_at timestamptz not null default now()
);

alter table public.pin_request_log enable row level security;
revoke all on public.pin_request_log from anon, authenticated;
create index if not exists pin_request_log_window_idx
  on public.pin_request_log(ip_hash, action, created_at desc);

