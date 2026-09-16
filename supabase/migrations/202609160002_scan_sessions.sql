create table if not exists public.scan_sessions (
  id uuid primary key default gen_random_uuid(),
  session_code text not null unique,
  staff_id uuid references auth.users(id) on delete set null,
  player_name text not null default 'Şüpheli Oyuncu',
  status text not null default 'pending' check (status in ('pending', 'scanning', 'completed', 'failed', 'cancelled')),
  progress integer not null default 0 check (progress between 0 and 100),
  current_stage text default 'Bekleniyor',
  current_log text default '',
  target text default '',
  objects_count integer default 0,
  verdict text default 'pending' check (verdict in ('pending', 'clean', 'suspicious', 'banned')),
  risk_score integer default 0,
  findings_count integer default 0,
  findings jsonb default '[]'::jsonb,
  report_data jsonb default '{}'::jsonb,
  system_info jsonb default '{}'::jsonb,
  client_ip text,
  client_platform text default 'windows',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.scan_sessions enable row level security;

create policy "staff can read scans" on public.scan_sessions
  for select to authenticated using (true);

create policy "staff can insert scans" on public.scan_sessions
  for insert to authenticated with check (true);

create policy "staff can update scans" on public.scan_sessions
  for update to authenticated using (true);

create index if not exists scan_sessions_code_idx on public.scan_sessions(session_code);
create index if not exists scan_sessions_staff_idx on public.scan_sessions(staff_id, created_at desc);
create index if not exists scan_sessions_created_idx on public.scan_sessions(created_at desc);
