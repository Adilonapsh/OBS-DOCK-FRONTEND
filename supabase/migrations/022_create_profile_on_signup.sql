-- Ensure every new auth user has a profile and a private key.
create extension if not exists "pgcrypto";

alter table public.profiles
  add column if not exists private_key text unique default encode(gen_random_bytes(32), 'hex');

update public.profiles
set private_key = encode(gen_random_bytes(32), 'hex')
where private_key is null;

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

alter table public.user_private_keys enable row level security;

drop policy if exists "private_keys_owner" on public.user_private_keys;
create policy "private_keys_owner" on public.user_private_keys
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.user_private_keys (user_id, private_key)
select id, private_key
from public.profiles
where private_key is not null
on conflict (user_id) do update
  set private_key = excluded.private_key,
      updated_at = now();

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
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
