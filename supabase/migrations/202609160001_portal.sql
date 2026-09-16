create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[A-Za-z0-9_.-]{3,32}$'),
  created_at timestamptz not null default now(),
  disabled_at timestamptz
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  label text not null,
  expires_at timestamptz not null,
  max_uses integer not null default 1 check (max_uses between 1 and 100),
  uses integer not null default 0 check (uses >= 0),
  created_at timestamptz not null default now()
);

create table public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','suspended','expired')),
  expires_at timestamptz not null,
  max_devices integer not null default 1 check (max_devices between 1 and 20),
  created_at timestamptz not null default now()
);

create table public.licenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  machine_id text not null check (machine_id ~ '^[A-F0-9]{64}$'),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (user_id, machine_id)
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  ip_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.invites enable row level security;
alter table public.entitlements enable row level security;
alter table public.licenses enable row level security;
alter table public.audit_log enable row level security;

create policy "profile own read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "entitlement own read" on public.entitlements for select to authenticated using (user_id = auth.uid());
create policy "licenses own read" on public.licenses for select to authenticated using (user_id = auth.uid());

-- Private by default. The Edge Function creates a 60-second signed URL only
-- after validating the caller's active entitlement.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('atlas-downloads', 'atlas-downloads', false, 209715200, array['application/octet-stream','application/vnd.microsoft.portable-executable'])
on conflict (id) do update set public = false;

create index licenses_user_active_idx on public.licenses(user_id) where revoked_at is null;
create index audit_user_created_idx on public.audit_log(user_id, created_at desc);

create or replace function public.consume_invite(invite_hash text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare selected_id uuid;
begin
  update public.invites
     set uses = uses + 1
   where code_hash = invite_hash
     and expires_at > now()
     and uses < max_uses
  returning id into selected_id;
  return selected_id;
end;
$$;

revoke all on function public.consume_invite(text) from public, anon, authenticated;
grant execute on function public.consume_invite(text) to service_role;

create or replace function public.refund_invite(invite_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.invites set uses = greatest(0, uses - 1) where id = invite_id;
$$;

revoke all on function public.refund_invite(uuid) from public, anon, authenticated;
grant execute on function public.refund_invite(uuid) to service_role;
