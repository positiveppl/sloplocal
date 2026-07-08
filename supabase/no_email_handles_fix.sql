-- SLOP LOCAL public handle privacy fix
-- Run this after auth_signup_fix.sql if existing profiles were created from email prefixes.
-- This makes future fallback handles builder-xxxxxx instead of email-derived.

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
    base_username := 'builder-' || substr(md5(NEW.id::text), 1, 6);
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- Optional targeted cleanup for a profile that was already created from an email.
-- Replace the id and username below, then run only that update.
--
-- update public.profiles
-- set username = 'your-handle'
-- where id = 'your-user-id';
