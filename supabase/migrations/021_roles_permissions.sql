-- ============================================
-- Migration 021: Role & Permission (RBAC)
--
-- Model:
--   guest -> akses display/overlay + dock dengan private key (default anon)
--   user  -> pemilik workspace (dashboard, widgets, donasi, integrasi, akun)
--   admin -> semua akses user + panel admin & manajemen role
--
-- Catatan:
--   - Permission matrix ada di kode: FRONTEND/lib/auth/permissions.ts
--   - DB hanya menyimpan role + helper is_admin(), karena RLS yang ada
--     masih berbasis kepemilikan data (auth.uid() = user_id).
--   - Jalankan di Supabase SQL Editor / `supabase db push`.
-- ============================================

-- 1. ENUM ROLE -------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'app_role' and n.nspname = 'public'
  ) then
    create type public.app_role as enum ('guest', 'user', 'admin');
  end if;
end $$;

-- 2. KOLOM role DI profiles ------------------------------------

alter table public.profiles add column if not exists role public.app_role;

-- User lama otomatis jadi 'user'. Admin di-bootstrap manual (lihat bawah).
update public.profiles set role = 'user' where role is null;

alter table public.profiles alter column role set default 'user';
alter table public.profiles alter column role set not null;

create index if not exists idx_profiles_role on public.profiles(role);

comment on column public.profiles.role is
  'RBAC role: guest (read-only/private-key), user (workspace owner), admin (full access)';

-- 3. HELPER FUNCTIONS ------------------------------------------
-- SECURITY DEFINER + search_path tetap supaya aman dipakai di RLS
-- dan tidak memicu rekursi policy pada tabel profiles.

create or replace function public.auth_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.role from public.profiles p where p.id = auth.uid()),
    'guest'::public.app_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_role() = 'admin'::public.app_role;
$$;

revoke all on function public.auth_role() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.auth_role() to anon, authenticated, service_role;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- 4. GUARD: USER BIASA TIDAK BOLEH NAIKKAN ROLE SENDIRI --
-- Policy profiles_update_own mengizinkan update baris sendiri.
-- Tanpa guard ini, user bisa `update profiles set role='admin'`.

create or replace function public.guard_profile_role_update()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Hanya admin yang boleh mengubah role pengguna'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_role_guard on public.profiles;
create trigger trg_profiles_role_guard
  before update on public.profiles
  for each row execute procedure public.guard_profile_role_update();

create or replace function public.guard_profile_role_insert()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from 'user'::public.app_role and not public.is_admin() then
    raise exception 'Tidak boleh membuat profil dengan role %', new.role
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_role_insert_guard on public.profiles;
create trigger trg_profiles_role_insert_guard
  before insert on public.profiles
  for each row execute procedure public.guard_profile_role_insert();

-- 5. ADMIN RPC: LIST USER --------------------------------------
-- Sengaja TIDAK membuka SELECT profiles ke admin, karena tabel profiles
-- menyimpan private_key. Admin membaca lewat RPC yang hanya mengembalikan
-- kolom aman.

create or replace function public.admin_list_users(
  p_search text default '',
  p_limit int default 100,
  p_offset int default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_search text := lower(trim(coalesce(p_search, '')));
  v_limit int := least(greatest(coalesce(p_limit, 100), 1), 500);
  v_offset int := greatest(coalesce(p_offset, 0), 0);
  v_users jsonb;
  v_total int;
  v_counts jsonb;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: khusus admin' using errcode = '42501';
  end if;

  select count(*)
  into v_total
  from public.profiles p
  left join auth.users u on u.id = p.id
  where v_search = ''
     or lower(coalesce(p.username, '')) like '%' || v_search || '%'
     or lower(coalesce(p.email, '')) like '%' || v_search || '%';

  select coalesce(jsonb_agg(row_to_json(t) order by t.created_at desc), '[]'::jsonb)
  into v_users
  from (
    select
      p.id,
      p.username,
      p.email,
      p.avatar_url,
      p.role::text as role,
      p.created_at,
      p.updated_at,
      u.last_sign_in_at
    from public.profiles p
    left join auth.users u on u.id = p.id
    where v_search = ''
       or lower(coalesce(p.username, '')) like '%' || v_search || '%'
       or lower(coalesce(p.email, '')) like '%' || v_search || '%'
    order by p.created_at desc
    limit v_limit offset v_offset
  ) t;

  select jsonb_build_object(
    'admin', count(*) filter (where role = 'admin'),
    'user',  count(*) filter (where role = 'user'),
    'guest', count(*) filter (where role = 'guest')
  )
  into v_counts
  from public.profiles;

  return jsonb_build_object(
    'users', v_users,
    'total', v_total,
    'counts', v_counts,
    'limit', v_limit,
    'offset', v_offset
  );
end;
$$;

revoke all on function public.admin_list_users(text, int, int) from public;
grant execute on function public.admin_list_users(text, int, int) to authenticated, service_role;

-- 6. ADMIN RPC: UBAH ROLE --------------------------------------
-- Pengamanan:
--   - hanya admin
--   - tidak bisa menurunkan diri sendiri (mencegah lockout)
--   - tidak bisa menghapus admin terakhir

create or replace function public.admin_set_user_role(
  p_user_id uuid,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old public.app_role;
  v_new public.app_role;
  v_admin_count int;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: khusus admin' using errcode = '42501';
  end if;

  if p_user_id is null then
    raise exception 'p_user_id wajib diisi';
  end if;

  if p_role is null or p_role not in ('guest', 'user', 'admin') then
    raise exception 'Role tidak valid: %', p_role;
  end if;
  v_new := p_role::public.app_role;

  select role into v_old
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'User tidak ditemukan';
  end if;

  if v_old = v_new then
    return jsonb_build_object(
      'id', p_user_id,
      'role', v_new::text,
      'previous_role', v_old::text,
      'unchanged', true
    );
  end if;

  if p_user_id = auth.uid() and v_new <> 'admin'::public.app_role then
    raise exception 'Tidak bisa mengubah role akun sendiri';
  end if;

  if v_old = 'admin'::public.app_role and v_new <> 'admin'::public.app_role then
    select count(*) into v_admin_count from public.profiles where role = 'admin';
    if v_admin_count <= 1 then
      raise exception 'Tidak bisa menurunkan admin terakhir';
    end if;
  end if;

  update public.profiles set role = v_new where id = p_user_id;

  return jsonb_build_object(
    'id', p_user_id,
    'role', v_new::text,
    'previous_role', v_old::text,
    'unchanged', false
  );
end;
$$;

revoke all on function public.admin_set_user_role(uuid, text) from public;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated, service_role;

-- 7. BOOTSTRAP ADMIN -------------------------------------------
-- Setelah migration jalan, jadikan akun pertama sebagai admin:
--
--   update public.profiles
--   set role = 'admin'
--   where email = 'email-kamu@example.com';
--
-- Atau lewat Supabase Studio > Table Editor > profiles > kolom role.
-- Jangan lupa: role disimpan di DB, bukan di user_metadata.
