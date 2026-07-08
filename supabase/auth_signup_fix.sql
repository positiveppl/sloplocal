-- SLOP LOCAL signup trigger fix
-- Run this in Supabase SQL Editor if /auth/v1/signup returns 500.

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
    split_part(coalesce(NEW.email, ''), '@', 1),
    'builder'
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();
