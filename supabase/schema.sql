-- SLOP LOCAL — Supabase schema
-- Run this in the Supabase SQL editor on a fresh project.

-- ============ TABLES ============

create table profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  github_handle text,
  is_admin boolean default false,
  is_banned boolean default false,
  ban_reason text,
  created_at timestamptz default now()
);

create table categories (
  id serial primary key,
  name text not null,
  slug text unique not null,
  emoji text
);

insert into categories (name, slug, emoji) values
  ('Tools & Utilities', 'tools', '🛠️'),
  ('Creative & Generative', 'creative', '🎨'),
  ('Games & Entertainment', 'games', '🎮'),
  ('Productivity', 'productivity', '📈'),
  ('Weird & Niche', 'weird', '🧪');

create table submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  submitter_id uuid references profiles(id),
  name text not null,
  slug text unique not null,
  url text not null,
  normalized_url text unique,
  tagline text not null check (char_length(tagline) <= 120),
  description text check (char_length(description) <= 500),
  category_slug text references categories(slug),
  built_with text[],
  type text default 'web' check (type in ('web', 'desktop', 'cli', 'plugin', 'mobile')),
  submitted_via text default 'web' check (submitted_via in ('web', 'api')),
  screenshot_url text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text,
  vote_count int default 0,
  flag_count int default 0
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  user_id uuid references profiles(id),
  created_at timestamptz default now(),
  unique (submission_id, user_id)
);

create table api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  key_hash text not null unique,
  key_preview text not null,
  label text,
  created_at timestamptz default now(),
  last_used_at timestamptz,
  is_active boolean default true
);

create table flags (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  user_id uuid references profiles(id),
  reason text check (reason in ('spam', 'not_free', 'broken', 'low_effort', 'harmful')),
  created_at timestamptz default now(),
  unique (submission_id, user_id)
);

create table submission_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  attempted_at timestamptz default now(),
  source text check (source in ('web', 'api'))
);

-- ============ VOTE COUNT TRIGGER ============

create or replace function update_vote_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update submissions set vote_count = vote_count + 1 where id = NEW.submission_id;
  elsif TG_OP = 'DELETE' then
    update submissions set vote_count = vote_count - 1 where id = OLD.submission_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger vote_count_trigger
after insert or delete on votes
for each row execute function update_vote_count();

-- ============ FLAG THRESHOLD TRIGGER ============

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

create trigger flag_threshold_trigger
after insert on flags
for each row execute function check_flag_threshold();

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
-- Username defaults from GitHub handle / submitted handle. Never expose email.

create or replace function handle_new_user()
returns trigger as $$
declare
  base_username text;
  candidate_username text;
  suffix int := 0;
begin
  base_username := lower(regexp_replace(coalesce(
    NEW.raw_user_meta_data->>'user_name',
    NEW.raw_user_meta_data->>'preferred_username',
    'builder-' || substr(md5(NEW.id::text), 1, 6)
  ), '[^a-z0-9_]+', '-', 'g'));

  base_username := trim(both '-' from base_username);
  if base_username = '' then
    base_username := 'builder';
  end if;

  candidate_username := base_username;
  while exists (select 1 from public.profiles where username = candidate_username) loop
    suffix := suffix + 1;
    candidate_username := base_username || '-' || substr(md5(NEW.id::text || suffix::text), 1, 4);
  end loop;

  insert into public.profiles (id, username, display_name, avatar_url, github_handle)
  values (
    NEW.id,
    candidate_username,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'user_name'
  )
  on conflict (id) do nothing;

  return NEW;
end;
$$ language plpgsql security definer set search_path = public, auth;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- ============ ADMIN HELPER ============

create or replace function is_admin()
returns boolean as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$ language sql security definer stable;

-- ============ ROW LEVEL SECURITY ============

alter table profiles enable row level security;
create policy "Public profiles" on profiles for select using (true);
create policy "Own profile update" on profiles for update using (auth.uid() = id);

alter table categories enable row level security;
create policy "Public categories" on categories for select using (true);

alter table submissions enable row level security;
-- Everyone sees approved. Submitters see their own. Admins see everything.
create policy "Read approved or own or admin" on submissions for select
  using (status = 'approved' or auth.uid() = submitter_id or is_admin());
create policy "Own insert" on submissions for insert
  with check (
    auth.uid() = submitter_id and
    not exists (select 1 from profiles where id = auth.uid() and is_banned = true)
  );
-- FIX from original spec: admins need update rights to approve/reject.
create policy "Admin update" on submissions for update
  using (is_admin());

alter table votes enable row level security;
create policy "Public votes" on votes for select using (true);
create policy "Own vote insert" on votes for insert with check (
  auth.uid() = user_id and
  not exists (select 1 from profiles where id = auth.uid() and is_banned = true)
);
create policy "Own vote delete" on votes for delete using (auth.uid() = user_id);

alter table api_keys enable row level security;
create policy "Own API keys read" on api_keys for select using (auth.uid() = user_id);
create policy "Own API keys insert" on api_keys for insert with check (auth.uid() = user_id);
create policy "Own API keys update" on api_keys for update using (auth.uid() = user_id);

alter table flags enable row level security;
create policy "Own flags read" on flags for select using (auth.uid() = user_id or is_admin());
create policy "Own flag insert" on flags for insert with check (
  auth.uid() = user_id and
  not exists (select 1 from profiles where id = auth.uid() and is_banned = true)
);

alter table submission_attempts enable row level security;
create policy "Own attempts read" on submission_attempts for select using (auth.uid() = user_id);
create policy "Own attempts insert" on submission_attempts for insert with check (auth.uid() = user_id);

-- ============ AFTER RUNNING ============
-- 1. Enable GitHub OAuth in Authentication > Providers (optional but recommended).
-- 2. Make yourself admin:
--    update profiles set is_admin = true where username = 'YOUR_USERNAME';
