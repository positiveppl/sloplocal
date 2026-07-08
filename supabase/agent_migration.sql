-- SLOP LOCAL agent/MCP migration
-- Run this if you already applied the original schema.sql before Agent Access existed.

alter table submissions
  add column if not exists type text default 'web'
  check (type in ('web', 'desktop', 'cli', 'plugin', 'mobile'));

alter table submissions add column if not exists normalized_url text;
alter table submissions add column if not exists submitted_via text default 'web' check (submitted_via in ('web', 'api'));
alter table submissions add column if not exists flag_count int default 0;
alter table profiles add column if not exists is_banned boolean default false;
alter table profiles add column if not exists ban_reason text;

create unique index if not exists submissions_normalized_url_key on submissions (normalized_url);

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

create table if not exists flags (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  user_id uuid references profiles(id),
  reason text check (reason in ('spam', 'not_free', 'broken', 'low_effort', 'harmful')),
  created_at timestamptz default now(),
  unique (submission_id, user_id)
);

create table if not exists submission_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  attempted_at timestamptz default now(),
  source text check (source in ('web', 'api'))
);

create or replace function check_flag_threshold()
returns trigger as $$
declare
  current_flag_count int;
begin
  select count(*) into current_flag_count
  from flags where submission_id = NEW.submission_id;

  update submissions
  set flag_count = current_flag_count,
      status = case when current_flag_count >= 3 then 'pending' else status end
  where id = NEW.submission_id;

  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists flag_threshold_trigger on flags;
create trigger flag_threshold_trigger
after insert on flags
for each row execute function check_flag_threshold();

alter table api_keys enable row level security;
alter table flags enable row level security;
alter table submission_attempts enable row level security;

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

  if not exists (
    select 1 from pg_policies where tablename = 'flags' and policyname = 'Own flags read'
  ) then
    create policy "Own flags read" on flags for select using (auth.uid() = user_id or is_admin());
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'flags' and policyname = 'Own flag insert'
  ) then
    create policy "Own flag insert" on flags for insert with check (
      auth.uid() = user_id and
      not exists (select 1 from profiles where id = auth.uid() and is_banned = true)
    );
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'submission_attempts' and policyname = 'Own attempts read'
  ) then
    create policy "Own attempts read" on submission_attempts for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'submission_attempts' and policyname = 'Own attempts insert'
  ) then
    create policy "Own attempts insert" on submission_attempts for insert with check (auth.uid() = user_id);
  end if;
end $$;

drop policy if exists "Own insert" on submissions;
create policy "Own insert" on submissions for insert
  with check (
    auth.uid() = submitter_id and
    not exists (select 1 from profiles where id = auth.uid() and is_banned = true)
  );

drop policy if exists "Own vote insert" on votes;
create policy "Own vote insert" on votes for insert with check (
  auth.uid() = user_id and
  not exists (select 1 from profiles where id = auth.uid() and is_banned = true)
);
