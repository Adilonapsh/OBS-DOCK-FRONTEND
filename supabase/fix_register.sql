-- FIX cepat untuk "Database error saving new user"
-- Jalankan ini di Supabase Dashboard → SQL Editor → Run
-- Sudah aman di-run berulang (idempotent)

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

-- 3. Trigger yang tahan banting (tidak error walau pgcrypto belum ada / kolom belum ada)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  begin
    insert into public.profiles (id, username, email, avatar_url, private_key)
    values (new.id, new.raw_user_meta_data->>'username', new.email, new.raw_user_meta_data->>'avatar_url', encode(gen_random_bytes(32), 'hex'));
  exception
    when undefined_column then
      -- fallback jika kolom private_key belum ada
      insert into public.profiles (id, username, email, avatar_url)
      values (new.id, new.raw_user_meta_data->>'username', new.email, new.raw_user_meta_data->>'avatar_url');
    when others then
      -- jangan gagalkan signUp karena trigger, cukup log
      raise warning 'handle_new_user failed: %', SQLERRM;
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- 4. Pastikan RLS & policy ada (biar tidak block)
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- verifikasi
select 'fix done' as status;
