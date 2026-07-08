-- SLOP LOCAL agent/MCP migration
-- Run this if you already applied the original schema.sql before Agent Access existed.

alter table submissions
  add column if not exists type text default 'web'
  check (type in ('web', 'desktop', 'cli', 'plugin', 'mobile'));

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  key_hash text not null unique,
  key_preview text not null,
  label text,
  created_at timestamptz default now(),
  last_used_at timestamptz,
  is_active boolean default true
);

alter table api_keys enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'api_keys' and policyname = 'Own API keys read'
  ) then
    create policy "Own API keys read" on api_keys for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'api_keys' and policyname = 'Own API keys insert'
  ) then
    create policy "Own API keys insert" on api_keys for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'api_keys' and policyname = 'Own API keys update'
  ) then
    create policy "Own API keys update" on api_keys for update using (auth.uid() = user_id);
  end if;
end $$;
