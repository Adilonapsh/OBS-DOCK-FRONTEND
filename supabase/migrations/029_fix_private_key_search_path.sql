-- ============================================
-- Migration 029: Fix signup gagal "Database error saving new user"
--
-- PENYEBAB
-- Di Supabase, pgcrypto terpasang di schema `extensions`, bukan `public`.
-- handle_new_user() (dan regenerate_private_key()) dipasang dengan
--   set search_path = public, pg_temp
-- sehingga `gen_random_bytes()` tidak ditemukan saat fungsi dijalankan:
--   ERROR: function gen_random_bytes(integer) does not exist
-- GoTrue menyamarkan error trigger tsb menjadi:
--   unexpected_failure / "Database error saving new user"
-- (termasuk untuk signup Google, karena semua lewat auth.users insert).
--
-- PERBAIKAN
-- Private key dibuat tanpa pgcrypto memakai gen_random_uuid()
-- (pg_catalog, selalu tersedia sejak Postgres 13): 2 x 32 char hex = 64 char,
-- formatnya sama dengan encode(gen_random_bytes(32), 'hex').
--
-- Cek cepat setelah run:
--   select length(public.new_private_key());  -- 64
-- lalu coba daftar / login Google lagi.
-- ============================================

-- 1. HELPER PEMBUAT PRIVATE KEY -------------------------------------

create or replace function public.new_private_key()
returns text
language sql
volatile
as $$
  select replace(gen_random_uuid()::text, '-', '')
      || replace(gen_random_uuid()::text, '-', '');
$$;

revoke all on function public.new_private_key() from public;
grant execute on function public.new_private_key() to anon, authenticated, service_role;

-- 2. TRIGGER SIGNUP -------------------------------------------------
-- Logika sama dengan migration 022, hanya sumber private key yang diganti.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_private_key text := public.new_private_key();
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

-- 3. REGENERATE PRIVATE KEY -----------------------------------------
-- Versi migration 024 punya bug search_path yang sama.

create or replace function public.regenerate_private_key()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_key text := public.new_private_key();
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Sesi tidak valid';
  end if;

  if not public.is_active_user() then
    raise exception 'Akun tidak aktif';
  end if;

  update public.profiles
  set private_key = new_key
  where id = uid;

  insert into public.user_private_keys(user_id, private_key)
  values (uid, new_key)
  on conflict (user_id) do update
    set private_key = excluded.private_key,
        updated_at = now();

  return new_key;
end;
$$;

revoke all on function public.regenerate_private_key() from public;
grant execute on function public.regenerate_private_key() to authenticated;

-- 4. VERIFIKASI -----------------------------------------------------

do $$
declare
  v_key text := public.new_private_key();
begin
  if v_key is null or length(v_key) <> 64 then
    raise exception 'new_private_key() tidak menghasilkan 64 char hex: %', v_key;
  end if;
end $$;

select 'migration 029 applied' as status, public.new_private_key() as contoh_private_key;
