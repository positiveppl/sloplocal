-- SLOP LOCAL attestation migration
-- Run this in Supabase SQL Editor before deploying the attestation UI.

alter table public.profiles
  add column if not exists agreed_to_terms boolean default false,
  add column if not exists agreed_to_terms_at timestamptz;

alter table public.submissions
  add column if not exists attested boolean default false,
  add column if not exists attested_at timestamptz;

create or replace function public.handle_new_user()
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

  insert into public.profiles (
    id,
    username,
    display_name,
    avatar_url,
    github_handle,
    agreed_to_terms,
    agreed_to_terms_at
  )
  values (
    NEW.id,
    candidate_username,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'user_name',
    coalesce((NEW.raw_user_meta_data->>'agreed_to_terms')::boolean, false),
    (NEW.raw_user_meta_data->>'agreed_to_terms_at')::timestamptz
  )
  on conflict (id) do nothing;

  return NEW;
end;
$$ language plpgsql security definer set search_path = public, auth;

drop policy if exists "Own insert" on public.submissions;
create policy "Own insert" on public.submissions for insert
  with check (
    auth.uid() = submitter_id and
    attested = true and
    attested_at is not null and
    not exists (select 1 from public.profiles where id = auth.uid() and is_banned = true)
  );
