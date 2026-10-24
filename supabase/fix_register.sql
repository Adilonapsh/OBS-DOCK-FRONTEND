-- Repair signup profile/private-key creation on an existing Supabase project.
-- Prefer applying migrations/022_create_profile_on_signup.sql via Supabase CLI.

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- 1. Pastikan tabel profiles ada (jika belum pernah run schema.sql)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  email text,
  avatar_url text,
  private_key text unique default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Tambah kolom private_key jika belum ada
alter table public.profiles add column if not exists private_key text unique default encode(gen_random_bytes(32), 'hex');
update public.profiles set private_key = encode(gen_random_bytes(32), 'hex') where private_key is null;

create table if not exists public.user_private_keys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  private_key text unique not null default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

with missing_profiles as (
  select
    u.id,
    u.email,
    u.raw_user_meta_data->>'username' as username,
    u.raw_user_meta_data->>'avatar_url' as avatar_url,
    row_number() over (
      partition by u.raw_user_meta_data->>'username'
      order by u.created_at, u.id
    ) as username_rank
  from auth.users u
  where not exists (
    select 1 from public.profiles p where p.id = u.id
  )
)
insert into public.profiles (id, username, email, avatar_url, private_key)
select
  m.id,
  case
    when m.username is not null
      and m.username_rank = 1
      and not exists (
        select 1 from public.profiles p where p.username = m.username
      )
    then m.username
    else null
  end,
  m.email,
  m.avatar_url,
  encode(gen_random_bytes(32), 'hex')
from missing_profiles m;

insert into public.user_private_keys (user_id, private_key)
select id, private_key from public.profiles
where private_key is not null
on conflict (user_id) do update
  set private_key = excluded.private_key,
      updated_at = now();

alter table public.user_private_keys enable row level security;
drop policy if exists "private_keys_owner" on public.user_private_keys;
create policy "private_keys_owner" on public.user_private_keys
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Do not swallow failures: a signup must not succeed without its profile/key.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_private_key text := encode(gen_random_bytes(32), 'hex');
begin
  insert into public.profiles as profile (id, username, email, avatar_url, private_key)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    v_private_key
  )
  on conflict (id) do update
    set username = coalesce(profile.username, excluded.username),
        email = excluded.email,
        avatar_url = coalesce(profile.avatar_url, excluded.avatar_url),
        private_key = coalesce(profile.private_key, excluded.private_key)
  returning private_key into v_private_key;

  insert into public.user_private_keys (user_id, private_key)
  values (new.id, v_private_key)
  on conflict (user_id) do update
    set private_key = excluded.private_key,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- 4. Pastikan RLS & policy ada (biar tidak block)
alter table public.profiles enable row level security;
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);

-- verifikasi
select 'fix done' as status;
