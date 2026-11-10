-- ============================================
-- Migration 023: Status akun + aksi massal
--
-- Menambahkan:
--   - profiles.is_active (aktif / diblokir)
--   - auth_role() menganggap akun nonaktif sebagai guest
--   - admin_list_users() mengembalikan status akun
--   - RPC aktivasi/blokir (single + bulk)
--   - RPC ubah role massal
--   - RPC ubah akses widget massal
--
-- Catatan keamanan:
--   - Akun nonaktif tetap bisa login ke Supabase Auth (kecuali diblokir
--     lewat Admin API), tetapi proxy + server action menolak akses aplikasi.
--   - Server action juga memanggil Supabase Admin API (jika
--     NEXT_SUPABASE_SECRET_KEY tersedia) untuk memblokir login.
-- ============================================

-- 1. KOLOM is_active --------------------------------------------

alter table public.profiles add column if not exists is_active boolean;

update public.profiles set is_active = true where is_active is null;

alter table public.profiles alter column is_active set default true;
alter table public.profiles alter column is_active set not null;

create index if not exists idx_profiles_is_active on public.profiles(is_active);

comment on column public.profiles.is_active is
  'Status akun: true = aktif, false = diblokir/nonaktif';

-- 2. HELPER ROLE: akun nonaktif diperlakukan sebagai guest -------
-- Ini membuat RPC admin menolak akun yang diblokir, termasuk admin.

create or replace function public.auth_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select p.role
      from public.profiles p
      where p.id = auth.uid()
        and p.is_active
    ),
    'guest'::public.app_role
  );
$$;

revoke all on function public.auth_role() from public;
grant execute on function public.auth_role() to anon, authenticated, service_role;

-- 2b. PRIVATE KEY: akun nonaktif tidak bisa memakai private key -----
-- Semua RPC overlay/config memakai helper ini, jadi cukup satu titik.

create or replace function public.get_user_id_by_private_key(p_key text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.profiles p
  where p.private_key = p_key
    and p.is_active
  union
  select upk.user_id
  from public.user_private_keys upk
  join public.profiles p on p.id = upk.user_id
  where upk.private_key = p_key
    and p.is_active
  limit 1;
$$;

create or replace function public.verify_private_key(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.private_key = p_key
      and p.is_active
    union
    select 1
    from public.user_private_keys upk
    join public.profiles p on p.id = upk.user_id
    where upk.private_key = p_key
      and p.is_active
  );
$$;

revoke all on function public.get_user_id_by_private_key(text) from public;
revoke all on function public.verify_private_key(text) from public;
grant execute on function public.get_user_id_by_private_key(text)
  to anon, authenticated, service_role;
grant execute on function public.verify_private_key(text)
  to anon, authenticated, service_role;

-- 3. ADMIN RPC: LIST USER (tambah is_active + status_counts) -----

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
  v_status_counts jsonb;
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
      p.is_active,
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

  select jsonb_build_object(
    'active', count(*) filter (where is_active),
    'blocked', count(*) filter (where not is_active)
  )
  into v_status_counts
  from public.profiles;

  return jsonb_build_object(
    'users', v_users,
    'total', v_total,
    'counts', v_counts,
    'status_counts', v_status_counts,
    'limit', v_limit,
    'offset', v_offset
  );
end;
$$;

revoke all on function public.admin_list_users(text, int, int) from public;
grant execute on function public.admin_list_users(text, int, int) to authenticated, service_role;

-- 4. ADMIN RPC: BLOKIR / AKTIFKAN SATU USER ---------------------

create or replace function public.admin_set_user_active(
  p_user_id uuid,
  p_is_active boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old boolean;
  v_role public.app_role;
  v_other_active_admins int;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: khusus admin' using errcode = '42501';
  end if;

  if p_user_id is null then
    raise exception 'p_user_id wajib diisi';
  end if;

  if p_is_active is null then
    raise exception 'Status akun wajib diisi';
  end if;

  select is_active, role into v_old, v_role
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'User tidak ditemukan';
  end if;

  if v_old = p_is_active then
    return jsonb_build_object(
      'id', p_user_id,
      'is_active', p_is_active,
      'previous_is_active', v_old,
      'unchanged', true
    );
  end if;

  if not p_is_active then
    if p_user_id = auth.uid() then
      raise exception 'Tidak bisa memblokir akun sendiri';
    end if;

    if v_role = 'admin'::public.app_role then
      select count(*) into v_other_active_admins
      from public.profiles
      where role = 'admin'::public.app_role
        and is_active
        and id <> p_user_id;

      if v_other_active_admins < 1 then
        raise exception 'Tidak bisa memblokir admin aktif terakhir';
      end if;
    end if;
  end if;

  update public.profiles set is_active = p_is_active where id = p_user_id;

  return jsonb_build_object(
    'id', p_user_id,
    'is_active', p_is_active,
    'previous_is_active', v_old,
    'unchanged', false
  );
end;
$$;

revoke all on function public.admin_set_user_active(uuid, boolean) from public;
grant execute on function public.admin_set_user_active(uuid, boolean)
  to authenticated, service_role;

-- 5. ADMIN RPC: BLOKIR / AKTIFKAN MASSAL ------------------------

create or replace function public.admin_bulk_set_user_active(
  p_user_ids uuid[],
  p_is_active boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_old boolean;
  v_role public.app_role;
  v_other_active_admins int;
  v_updated int := 0;
  v_skipped int := 0;
  v_unchanged int := 0;
  v_updated_ids uuid[] := '{}';
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: khusus admin' using errcode = '42501';
  end if;

  if p_is_active is null then
    raise exception 'Status akun wajib diisi';
  end if;

  if p_user_ids is null or array_length(p_user_ids, 1) is null then
    raise exception 'Pilih minimal satu user';
  end if;

  if array_length(p_user_ids, 1) > 200 then
    raise exception 'Maksimal 200 user per aksi';
  end if;

  for v_id in
    select distinct x from unnest(p_user_ids) as x order by x
  loop
    select is_active, role into v_old, v_role
    from public.profiles
    where id = v_id
    for update;

    if not found then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    if v_old = p_is_active then
      v_unchanged := v_unchanged + 1;
      continue;
    end if;

    if not p_is_active then
      if v_id = auth.uid() then
        v_skipped := v_skipped + 1;
        continue;
      end if;

      if v_role = 'admin'::public.app_role then
        select count(*) into v_other_active_admins
        from public.profiles
        where role = 'admin'::public.app_role
          and is_active
          and id <> v_id;

        if v_other_active_admins < 1 then
          v_skipped := v_skipped + 1;
          continue;
        end if;
      end if;
    end if;

    update public.profiles set is_active = p_is_active where id = v_id;

    v_updated := v_updated + 1;
    v_updated_ids := array_append(v_updated_ids, v_id);
  end loop;

  return jsonb_build_object(
    'updated', v_updated,
    'skipped', v_skipped,
    'unchanged', v_unchanged,
    'updated_ids', to_jsonb(v_updated_ids)
  );
end;
$$;

revoke all on function public.admin_bulk_set_user_active(uuid[], boolean) from public;
grant execute on function public.admin_bulk_set_user_active(uuid[], boolean)
  to authenticated, service_role;

-- 6. ADMIN RPC: UBAH ROLE MASSAL --------------------------------

create or replace function public.admin_bulk_set_user_role(
  p_user_ids uuid[],
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_old public.app_role;
  v_new public.app_role;
  v_other_active_admins int;
  v_updated int := 0;
  v_skipped int := 0;
  v_unchanged int := 0;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: khusus admin' using errcode = '42501';
  end if;

  if p_user_ids is null or array_length(p_user_ids, 1) is null then
    raise exception 'Pilih minimal satu user';
  end if;

  if array_length(p_user_ids, 1) > 200 then
    raise exception 'Maksimal 200 user per aksi';
  end if;

  if p_role is null or p_role not in ('guest', 'user', 'admin') then
    raise exception 'Role tidak valid: %', p_role;
  end if;

  v_new := p_role::public.app_role;

  for v_id in
    select distinct x from unnest(p_user_ids) as x order by x
  loop
    select role into v_old
    from public.profiles
    where id = v_id
    for update;

    if not found then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    if v_old = v_new then
      v_unchanged := v_unchanged + 1;
      continue;
    end if;

    if v_id = auth.uid() and v_new <> 'admin'::public.app_role then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    if v_old = 'admin'::public.app_role and v_new <> 'admin'::public.app_role then
      select count(*) into v_other_active_admins
      from public.profiles
      where role = 'admin'::public.app_role
        and is_active
        and id <> v_id;

      if v_other_active_admins < 1 then
        v_skipped := v_skipped + 1;
        continue;
      end if;
    end if;

    update public.profiles set role = v_new where id = v_id;

    v_updated := v_updated + 1;
  end loop;

  return jsonb_build_object(
    'updated', v_updated,
    'skipped', v_skipped,
    'unchanged', v_unchanged
  );
end;
$$;

revoke all on function public.admin_bulk_set_user_role(uuid[], text) from public;
grant execute on function public.admin_bulk_set_user_role(uuid[], text)
  to authenticated, service_role;

-- 7. ADMIN RPC: AKSES WIDGET MASSAL ----------------------------
-- Hanya diterapkan ke user dengan role 'user'. Admin (selalu full) dan
-- guest (tidak punya akses workspace) dilewati.

create or replace function public.admin_bulk_set_user_widget_permissions(
  p_user_ids uuid[],
  p_permissions jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_role public.app_role;
  v_rec record;
  v_updated int := 0;
  v_skipped int := 0;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: khusus admin' using errcode = '42501';
  end if;

  if p_user_ids is null or array_length(p_user_ids, 1) is null then
    raise exception 'Pilih minimal satu user';
  end if;

  if array_length(p_user_ids, 1) > 200 then
    raise exception 'Maksimal 200 user per aksi';
  end if;

  if p_permissions is null or jsonb_typeof(p_permissions) <> 'object' then
    raise exception 'Format permission widget tidak valid';
  end if;

  for v_rec in
    select key, value from jsonb_each(p_permissions)
  loop
    if v_rec.key !~ '^[a-z0-9][a-z0-9-]{0,39}$' then
      raise exception 'Widget key tidak valid: %', v_rec.key;
    end if;

    if jsonb_typeof(v_rec.value) <> 'boolean' then
      raise exception 'Nilai permission widget harus boolean';
    end if;
  end loop;

  for v_id in
    select distinct x from unnest(p_user_ids) as x order by x
  loop
    select role into v_role
    from public.profiles
    where id = v_id
    for update;

    if not found or v_role <> 'user'::public.app_role then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    delete from public.user_widget_permissions where user_id = v_id;

    insert into public.user_widget_permissions(
      user_id, widget_key, allowed, updated_by
    )
    select
      v_id,
      key,
      (value #>> '{}')::boolean,
      auth.uid()
    from jsonb_each(p_permissions);

    v_updated := v_updated + 1;
  end loop;

  return jsonb_build_object(
    'updated', v_updated,
    'skipped', v_skipped
  );
end;
$$;

revoke all on function public.admin_bulk_set_user_widget_permissions(uuid[], jsonb) from public;
grant execute on function public.admin_bulk_set_user_widget_permissions(uuid[], jsonb)
  to authenticated, service_role;
