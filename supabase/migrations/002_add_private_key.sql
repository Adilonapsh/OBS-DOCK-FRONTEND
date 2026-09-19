-- ============================================
-- Migration: tambah private_key ke user (profiles)
-- Jalankan di SQL Editor jika DB sudah ada (sudah run schema.sql sebelumnya)
-- ============================================

create extension if not exists "pgcrypto";

-- 1. tambah kolom ke profiles (jika belum ada)
alter table public.profiles
  add column if not exists private_key text unique default encode(gen_random_bytes(32), 'hex');

-- isi private_key untuk user lama yang masih null
update public.profiles
  set private_key = encode(gen_random_bytes(32), 'hex')
  where private_key is null;

-- 2. update trigger handle_new_user biar auto-generate private_key
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, email, avatar_url, private_key)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    encode(gen_random_bytes(32), 'hex')
  );
  return new;
end;
$$;

-- 3. (REKOMENDASI) tabel terpisah lebih aman - private_key hanya owner bisa baca
--    Jika mau column-level aman, pakai tabel ini daripada kolom di profiles (profiles_select_all expose ke semua)
create table if not exists public.user_private_keys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  private_key text unique not null default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- isi untuk user yang sudah ada
insert into public.user_private_keys (user_id, private_key)
  select id, private_key from public.profiles
  on conflict (user_id) do nothing;

alter table public.user_private_keys enable row level security;

drop policy if exists "private_keys_owner" on public.user_private_keys;
create policy "private_keys_owner" on public.user_private_keys
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- view public tanpa private_key (opsional)
create or replace view public.profiles_public as
  select id, username, email, avatar_url, created_at, updated_at
  from public.profiles;

-- 4. helper untuk regenerate private_key (panggil via RPC)
create or replace function public.regenerate_private_key()
returns text language plpgsql security definer as $$
declare new_key text := encode(gen_random_bytes(32), 'hex');
begin
  update public.profiles set private_key = new_key where id = auth.uid();
  update public.user_private_keys set private_key = new_key where user_id = auth.uid();
  return new_key;
end;
$$;

grant execute on function public.regenerate_private_key() to authenticated;
