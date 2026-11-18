-- ============================================
-- Migration 024: Admin hardening + audit log
--
-- Mencakup:
--   - metadata blokir (blocked_at/by/reason)
--   - helper is_active_user() + pengetatan RLS
--   - guard agar user tidak bisa mengubah status akun sendiri
--   - audit log admin (single + bulk)
--   - advisory lock untuk mencegah race condition last-admin
--   - filter/pagination admin_list_users
--   - reset akses widget (single + bulk)
--   - RPC donasi private-key memakai helper yang menolak akun nonaktif
--
-- Jalankan setelah migration 023.
-- ============================================

-- 1. METADATA BLOKIR ------------------------------------------------

alter table public.profiles add column if not exists blocked_at timestamptz;
alter table public.profiles add column if not exists blocked_by uuid
  references auth.users(id) on delete set null;
alter table public.profiles add column if not exists block_reason text;

create index if not exists idx_profiles_blocked_by
  on public.profiles(blocked_by);

comment on column public.profiles.blocked_at is
  'Waktu akun diblokir (null jika aktif)';
comment on column public.profiles.blocked_by is
  'Admin yang memblokir akun';
comment on column public.profiles.block_reason is
  'Alasan blokir (opsional, maksimal 500 karakter)';

-- 2. HELPER STATUS AKTIF ---------------------------------------------

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_active from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_active_user() from public;
grant execute on function public.is_active_user() to anon, authenticated, service_role;

-- 3. GUARD: HANYA ADMIN YANG BOLEH MENGUBAH STATUS AKUN --------------

create or replace function public.guard_profile_status_update()
returns trigger
language plpgsql
as $$
begin
  if (
    new.is_active is distinct from old.is_active
    or new.blocked_at is distinct from old.blocked_at
    or new.blocked_by is distinct from old.blocked_by
    or new.block_reason is distinct from old.block_reason
  ) and not public.is_admin()
    and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Hanya admin yang boleh mengubah status akun'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_status_guard on public.profiles;
create trigger trg_profiles_status_guard
  before update on public.profiles
  for each row execute procedure public.guard_profile_status_update();

-- 4. RLS: AKUN NONAKTIF TIDAK BISA MEMBACA/MENULIS DATA WORKSPACE ---
-- profiles_select_own sengaja TIDAK ditambahi is_active_user() agar
-- getAuthContext() dan halaman /blocked tetap bisa membaca is_active.
-- profiles_insert_own juga dibiarkan agar signup tetap bisa membuat profil.

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update
  using (auth.uid() = id and (select public.is_active_user()))
  with check (auth.uid() = id and (select public.is_active_user()));

drop policy if exists "private_keys_owner" on public.user_private_keys;
create policy "private_keys_owner" on public.user_private_keys
  for all
  using (auth.uid() = user_id and (select public.is_active_user()))
  with check (auth.uid() = user_id and (select public.is_active_user()));

drop policy if exists "briefings_owner" on public.stream_briefings;
create policy "briefings_owner" on public.stream_briefings
  for all
  using (auth.uid() = user_id and (select public.is_active_user()))
  with check (auth.uid() = user_id and (select public.is_active_user()));

drop policy if exists "chat_select_auth" on public.chat_messages;
create policy "chat_select_auth" on public.chat_messages
  for select
  using (auth.role() = 'authenticated' and (select public.is_active_user()));

drop policy if exists "chat_insert_auth" on public.chat_messages;
create policy "chat_insert_auth" on public.chat_messages
  for insert
  with check (auth.role() = 'authenticated' and (select public.is_active_user()));

drop policy if exists "activity_select_auth" on public.activity_logs;
create policy "activity_select_auth" on public.activity_logs
  for select
  using (auth.role() = 'authenticated' and (select public.is_active_user()));

drop policy if exists "activity_insert_auth" on public.activity_logs;
create policy "activity_insert_auth" on public.activity_logs
  for insert
  with check (auth.role() = 'authenticated' and (select public.is_active_user()));

drop policy if exists "gift_select_auth" on public.gift_logs;
create policy "gift_select_auth" on public.gift_logs
  for select
  using (auth.role() = 'authenticated' and (select public.is_active_user()));

drop policy if exists "gift_insert_auth" on public.gift_logs;
create policy "gift_insert_auth" on public.gift_logs
  for insert
  with check (auth.role() = 'authenticated' and (select public.is_active_user()));

drop policy if exists "obs_owner" on public.obs_configs;
create policy "obs_owner" on public.obs_configs
  for all
  using (auth.uid() = user_id and (select public.is_active_user()))
  with check (auth.uid() = user_id and (select public.is_active_user()));

drop policy if exists "tiktok_owner" on public.tiktok_configs;
create policy "tiktok_owner" on public.tiktok_configs
  for all
  using (auth.uid() = user_id and (select public.is_active_user()))
  with check (auth.uid() = user_id and (select public.is_active_user()));

drop policy if exists "sbot_owner" on public.streamerbot_configs;
create policy "sbot_owner" on public.streamerbot_configs
  for all
  using (auth.uid() = user_id and (select public.is_active_user()))
  with check (auth.uid() = user_id and (select public.is_active_user()));

drop policy if exists "layout_owner" on public.dashboard_layouts;
create policy "layout_owner" on public.dashboard_layouts
  for all
  using (auth.uid() = user_id and (select public.is_active_user()))
  with check (auth.uid() = user_id and (select public.is_active_user()));

drop policy if exists "highlights_owner" on public.highlights;
create policy "highlights_owner" on public.highlights
  for all
  using (auth.uid() = user_id and (select public.is_active_user()))
  with check (auth.uid() = user_id and (select public.is_active_user()));

drop policy if exists "mediatx_owner" on public.mediatx_servers;
create policy "mediatx_owner" on public.mediatx_servers
  for all
  using (auth.uid() = user_id and (select public.is_active_user()))
  with check (auth.uid() = user_id and (select public.is_active_user()));

drop policy if exists "integration_settings_owner" on public.integration_settings;
create policy "integration_settings_owner" on public.integration_settings
  for all
  using (auth.uid() = user_id and (select public.is_active_user()))
  with check (auth.uid() = user_id and (select public.is_active_user()));

drop policy if exists "mobile_dock_owner" on public.mobile_dock_configs;
create policy "mobile_dock_owner" on public.mobile_dock_configs
  for all
  using (auth.uid() = user_id and (select public.is_active_user()))
  with check (auth.uid() = user_id and (select public.is_active_user()));

drop policy if exists "hyperate_owner" on public.hyperate_configs;
create policy "hyperate_owner" on public.hyperate_configs
  for all
  using (auth.uid() = user_id and (select public.is_active_user()))
  with check (auth.uid() = user_id and (select public.is_active_user()));

drop policy if exists "donation_owner" on public.donation_logs;
create policy "donation_owner" on public.donation_logs
  for all
  using (auth.uid() = user_id and (select public.is_active_user()))
  with check (auth.uid() = user_id and (select public.is_active_user()));

drop policy if exists "user_widget_permissions_select_own"
  on public.user_widget_permissions;
create policy "user_widget_permissions_select_own"
  on public.user_widget_permissions
  for select
  using (auth.uid() = user_id and (select public.is_active_user()));

drop policy if exists "avatars_upload_own" on storage.objects;
create policy "avatars_upload_own" on storage.objects
  for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (select public.is_active_user())
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (select public.is_active_user())
  )
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (select public.is_active_user())
  );

-- 5. AUDIT LOG -------------------------------------------------------

create table if not exists public.admin_audit_log (
  id bigserial primary key,
  batch_id uuid not null default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  target_id uuid references auth.users(id) on delete set null,
  target_label text,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_created
  on public.admin_audit_log(created_at desc);
create index if not exists idx_admin_audit_target
  on public.admin_audit_log(target_id, created_at desc);
create index if not exists idx_admin_audit_action
  on public.admin_audit_log(action, created_at desc);
create index if not exists idx_admin_audit_action
  on public.admin_audit_log(action, created_at desc);
create index if not exists idx_admin_audit_batch
  on public.admin_audit_log(batch_id);

alter table public.admin_audit_log enable row level security;

-- Tidak ada policy: hanya RPC SECURITY DEFINER yang boleh membaca.
revoke all on table public.admin_audit_log from public, anon, authenticated;
revoke all on sequence public.admin_audit_log_id_seq from public, anon, authenticated;
grant all on table public.admin_audit_log to service_role;
grant usage, select on sequence public.admin_audit_log_id_seq to service_role;

create or replace function public.log_admin_action(
  p_action text,
  p_target_id uuid,
  p_target_label text,
  p_old_value jsonb,
  p_new_value jsonb,
  p_reason text default null,
  p_batch_id uuid default null
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.admin_audit_log(
    batch_id,
    actor_id,
    actor_email,
    target_id,
    target_label,
    action,
    old_value,
    new_value,
    reason
  )
  values (
    coalesce(p_batch_id, gen_random_uuid()),
    auth.uid(),
    (select p.email from public.profiles p where p.id = auth.uid()),
    p_target_id,
    p_target_label,
    p_action,
    p_old_value,
    p_new_value,
    nullif(left(trim(coalesce(p_reason, '')), 500), '')
  );
$$;

revoke all on function public.log_admin_action(
  text, uuid, text, jsonb, jsonb, text, uuid
) from public, anon, authenticated;

-- 6. ADMIN LIST USER: FILTER + PAGINATION + METADATA BLOKIR ----------

drop function if exists public.admin_list_users(text, int, int);

create or replace function public.admin_list_users(
  p_search text default '',
  p_limit int default 50,
  p_offset int default 0,
  p_role text default null,
  p_status text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_search text := lower(trim(coalesce(p_search, '')));
  v_limit int := least(greatest(coalesce(p_limit, 50), 1), 500);
  v_offset int := greatest(coalesce(p_offset, 0), 0);
  v_role text := nullif(lower(trim(coalesce(p_role, ''))), '');
  v_status text := nullif(lower(trim(coalesce(p_status, ''))), '');
  v_users jsonb;
  v_total int;
  v_global_total int;
  v_counts jsonb;
  v_status_counts jsonb;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: khusus admin' using errcode = '42501';
  end if;

  if v_role is not null and v_role not in ('guest', 'user', 'admin') then
    raise exception 'Filter role tidak valid: %', v_role;
  end if;

  if v_status is not null and v_status not in ('active', 'blocked') then
    raise exception 'Filter status tidak valid: %', v_status;
  end if;

  select count(*)
  into v_total
  from public.profiles p
  where (v_search = ''
      or lower(coalesce(p.username, '')) like '%' || v_search || '%'
      or lower(coalesce(p.email, '')) like '%' || v_search || '%')
    and (v_role is null or p.role::text = v_role)
    and (
      v_status is null
      or (v_status = 'active' and p.is_active)
      or (v_status = 'blocked' and not p.is_active)
    );

  select coalesce(
    jsonb_agg(row_to_json(t) order by t.created_at desc, t.id desc),
    '[]'::jsonb
  )
  into v_users
  from (
    select
      p.id,
      p.username,
      p.email,
      p.avatar_url,
      p.role::text as role,
      p.is_active,
      p.blocked_at,
      p.blocked_by,
      p.block_reason,
      p.created_at,
      p.updated_at,
      u.last_sign_in_at
    from public.profiles p
    left join auth.users u on u.id = p.id
    where (v_search = ''
        or lower(coalesce(p.username, '')) like '%' || v_search || '%'
        or lower(coalesce(p.email, '')) like '%' || v_search || '%')
      and (v_role is null or p.role::text = v_role)
      and (
        v_status is null
        or (v_status = 'active' and p.is_active)
        or (v_status = 'blocked' and not p.is_active)
      )
    order by p.created_at desc, p.id desc
    limit v_limit offset v_offset
  ) t;

  select count(*)
  into v_global_total
  from public.profiles;

  select jsonb_build_object(
    'admin', count(*) filter (where role = 'admin'::public.app_role),
    'user',  count(*) filter (where role = 'user'::public.app_role),
    'guest', count(*) filter (where role = 'guest'::public.app_role)
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
    'global_total', v_global_total,
    'counts', v_counts,
    'status_counts', v_status_counts,
    'limit', v_limit,
    'offset', v_offset,
    'filters', jsonb_build_object(
      'search', v_search,
      'role', v_role,
      'status', v_status
    )
  );
end;
$$;

revoke all on function public.admin_list_users(text, int, int, text, text) from public;
grant execute on function public.admin_list_users(text, int, int, text, text)
  to authenticated, service_role;

-- 7. ADMIN SET ROLE (single) -----------------------------------------
-- Advisory lock mencegah dua admin saling menurunkan/memblokir bersamaan.

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
  v_old_active boolean;
  v_new public.app_role;
  v_label text;
  v_other_active_admins int;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: khusus admin' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext('obs_dock_admin_mutation')::bigint);

  if p_user_id is null then
    raise exception 'p_user_id wajib diisi';
  end if;

  if p_role is null or p_role not in ('guest', 'user', 'admin') then
    raise exception 'Role tidak valid: %', p_role;
  end if;
  v_new := p_role::public.app_role;

  select
    role,
    is_active,
    coalesce(username, email, id::text)
  into v_old, v_old_active, v_label
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

  if v_old = 'admin'::public.app_role
    and v_old_active
    and v_new <> 'admin'::public.app_role then
    select count(*) into v_other_active_admins
    from public.profiles
    where role = 'admin'::public.app_role
      and is_active
      and id <> p_user_id;

    if v_other_active_admins < 1 then
      raise exception 'Tidak bisa menurunkan admin aktif terakhir';
    end if;
  end if;

  update public.profiles set role = v_new where id = p_user_id;

  perform public.log_admin_action(
    'role.set',
    p_user_id,
    v_label,
    jsonb_build_object('role', v_old::text),
    jsonb_build_object('role', v_new::text),
    null,
    gen_random_uuid()
  );

  return jsonb_build_object(
    'id', p_user_id,
    'role', v_new::text,
    'previous_role', v_old::text,
    'unchanged', false
  );
end;
$$;

revoke all on function public.admin_set_user_role(uuid, text) from public;
grant execute on function public.admin_set_user_role(uuid, text)
  to authenticated, service_role;

-- 8. ADMIN SET ROLE (bulk) -------------------------------------------

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
  v_old_active boolean;
  v_new public.app_role;
  v_label text;
  v_other_active_admins int;
  v_batch_id uuid := gen_random_uuid();
  v_updated int := 0;
  v_skipped int := 0;
  v_unchanged int := 0;
  v_skipped_details jsonb := '[]'::jsonb;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: khusus admin' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext('obs_dock_admin_mutation')::bigint);

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
    select
      role,
      is_active,
      coalesce(username, email, id::text)
    into v_old, v_old_active, v_label
    from public.profiles
    where id = v_id
    for update;

    if not found then
      v_skipped := v_skipped + 1;
      v_skipped_details := v_skipped_details || jsonb_build_object(
        'id', v_id,
        'label', v_id::text,
        'reason', 'User tidak ditemukan'
      );
      continue;
    end if;

    if v_old = v_new then
      v_unchanged := v_unchanged + 1;
      continue;
    end if;

    if v_id = auth.uid() and v_new <> 'admin'::public.app_role then
      v_skipped := v_skipped + 1;
      v_skipped_details := v_skipped_details || jsonb_build_object(
        'id', v_id,
        'label', v_label,
        'reason', 'Tidak bisa mengubah role akun sendiri'
      );
      continue;
    end if;

    if v_old = 'admin'::public.app_role
      and v_old_active
      and v_new <> 'admin'::public.app_role then
      select count(*) into v_other_active_admins
      from public.profiles
      where role = 'admin'::public.app_role
        and is_active
        and id <> v_id;

      if v_other_active_admins < 1 then
        v_skipped := v_skipped + 1;
        v_skipped_details := v_skipped_details || jsonb_build_object(
          'id', v_id,
          'label', v_label,
          'reason', 'Tidak bisa menurunkan admin aktif terakhir'
        );
        continue;
      end if;
    end if;

    update public.profiles set role = v_new where id = v_id;

    perform public.log_admin_action(
      'role.bulk',
      v_id,
      v_label,
      jsonb_build_object('role', v_old::text),
      jsonb_build_object('role', v_new::text),
      null,
      v_batch_id
    );

    v_updated := v_updated + 1;
  end loop;

  return jsonb_build_object(
    'updated', v_updated,
    'skipped', v_skipped,
    'unchanged', v_unchanged,
    'skipped_details', v_skipped_details
  );
end;
$$;

revoke all on function public.admin_bulk_set_user_role(uuid[], text) from public;
grant execute on function public.admin_bulk_set_user_role(uuid[], text)
  to authenticated, service_role;

-- 9. ADMIN SET STATUS (single) ---------------------------------------

drop function if exists public.admin_set_user_active(uuid, boolean);

create or replace function public.admin_set_user_active(
  p_user_id uuid,
  p_is_active boolean,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_active boolean;
  v_role public.app_role;
  v_label text;
  v_old_blocked_at timestamptz;
  v_old_blocked_by uuid;
  v_old_reason text;
  v_new_blocked_at timestamptz;
  v_new_blocked_by uuid;
  v_new_reason text;
  v_other_active_admins int;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: khusus admin' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext('obs_dock_admin_mutation')::bigint);

  if p_user_id is null then
    raise exception 'p_user_id wajib diisi';
  end if;

  if p_is_active is null then
    raise exception 'Status akun wajib diisi';
  end if;

  select
    is_active,
    role,
    coalesce(username, email, id::text),
    blocked_at,
    blocked_by,
    block_reason
  into
    v_old_active,
    v_role,
    v_label,
    v_old_blocked_at,
    v_old_blocked_by,
    v_old_reason
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'User tidak ditemukan';
  end if;

  if v_old_active = p_is_active then
    return jsonb_build_object(
      'id', p_user_id,
      'is_active', p_is_active,
      'previous_is_active', v_old_active,
      'unchanged', true,
      'blocked_at', v_old_blocked_at,
      'blocked_by', v_old_blocked_by,
      'block_reason', v_old_reason
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

  v_new_blocked_at := case when p_is_active then null else now() end;
  v_new_blocked_by := case when p_is_active then null else auth.uid() end;
  v_new_reason := case
    when p_is_active then null
    else nullif(left(trim(coalesce(p_reason, '')), 500), '')
  end;

  update public.profiles
  set
    is_active = p_is_active,
    blocked_at = v_new_blocked_at,
    blocked_by = v_new_blocked_by,
    block_reason = v_new_reason
  where id = p_user_id;

  perform public.log_admin_action(
    case when p_is_active then 'status.activate' else 'status.block' end,
    p_user_id,
    v_label,
    jsonb_build_object(
      'is_active', v_old_active,
      'blocked_at', v_old_blocked_at,
      'blocked_by', v_old_blocked_by,
      'block_reason', v_old_reason
    ),
    jsonb_build_object(
      'is_active', p_is_active,
      'blocked_at', v_new_blocked_at,
      'blocked_by', v_new_blocked_by,
      'block_reason', v_new_reason
    ),
    p_reason,
    gen_random_uuid()
  );

  return jsonb_build_object(
    'id', p_user_id,
    'is_active', p_is_active,
    'previous_is_active', v_old_active,
    'unchanged', false,
    'blocked_at', v_new_blocked_at,
    'blocked_by', v_new_blocked_by,
    'block_reason', v_new_reason
  );
end;
$$;

revoke all on function public.admin_set_user_active(uuid, boolean, text) from public;
grant execute on function public.admin_set_user_active(uuid, boolean, text)
  to authenticated, service_role;

-- 10. ADMIN SET STATUS (bulk) ----------------------------------------

drop function if exists public.admin_bulk_set_user_active(uuid[], boolean);

create or replace function public.admin_bulk_set_user_active(
  p_user_ids uuid[],
  p_is_active boolean,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_old_active boolean;
  v_role public.app_role;
  v_label text;
  v_old_blocked_at timestamptz;
  v_old_blocked_by uuid;
  v_old_reason text;
  v_new_blocked_at timestamptz;
  v_new_blocked_by uuid;
  v_new_reason text;
  v_other_active_admins int;
  v_batch_id uuid := gen_random_uuid();
  v_updated int := 0;
  v_skipped int := 0;
  v_unchanged int := 0;
  v_updated_ids uuid[] := '{}';
  v_skipped_details jsonb := '[]'::jsonb;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: khusus admin' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext('obs_dock_admin_mutation')::bigint);

  if p_is_active is null then
    raise exception 'Status akun wajib diisi';
  end if;

  if p_user_ids is null or array_length(p_user_ids, 1) is null then
    raise exception 'Pilih minimal satu user';
  end if;

  if array_length(p_user_ids, 1) > 200 then
    raise exception 'Maksimal 200 user per aksi';
  end if;

  v_new_blocked_at := case when p_is_active then null else now() end;
  v_new_blocked_by := case when p_is_active then null else auth.uid() end;
  v_new_reason := case
    when p_is_active then null
    else nullif(left(trim(coalesce(p_reason, '')), 500), '')
  end;

  for v_id in
    select distinct x from unnest(p_user_ids) as x order by x
  loop
    select
      is_active,
      role,
      coalesce(username, email, id::text),
      blocked_at,
      blocked_by,
      block_reason
    into
      v_old_active,
      v_role,
      v_label,
      v_old_blocked_at,
      v_old_blocked_by,
      v_old_reason
    from public.profiles
    where id = v_id
    for update;

    if not found then
      v_skipped := v_skipped + 1;
      v_skipped_details := v_skipped_details || jsonb_build_object(
        'id', v_id,
        'label', v_id::text,
        'reason', 'User tidak ditemukan'
      );
      continue;
    end if;

    if v_old_active = p_is_active then
      v_unchanged := v_unchanged + 1;
      continue;
    end if;

    if not p_is_active then
      if v_id = auth.uid() then
        v_skipped := v_skipped + 1;
        v_skipped_details := v_skipped_details || jsonb_build_object(
          'id', v_id,
          'label', v_label,
          'reason', 'Tidak bisa memblokir akun sendiri'
        );
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
          v_skipped_details := v_skipped_details || jsonb_build_object(
            'id', v_id,
            'label', v_label,
            'reason', 'Tidak bisa memblokir admin aktif terakhir'
          );
          continue;
        end if;
      end if;
    end if;

    update public.profiles
    set
      is_active = p_is_active,
      blocked_at = v_new_blocked_at,
      blocked_by = v_new_blocked_by,
      block_reason = v_new_reason
    where id = v_id;

    perform public.log_admin_action(
      case
        when p_is_active then 'status.bulk_activate'
        else 'status.bulk_block'
      end,
      v_id,
      v_label,
      jsonb_build_object(
        'is_active', v_old_active,
        'blocked_at', v_old_blocked_at,
        'blocked_by', v_old_blocked_by,
        'block_reason', v_old_reason
      ),
      jsonb_build_object(
        'is_active', p_is_active,
        'blocked_at', v_new_blocked_at,
        'blocked_by', v_new_blocked_by,
        'block_reason', v_new_reason
      ),
      p_reason,
      v_batch_id
    );

    v_updated := v_updated + 1;
    v_updated_ids := array_append(v_updated_ids, v_id);
  end loop;

  return jsonb_build_object(
    'updated', v_updated,
    'skipped', v_skipped,
    'unchanged', v_unchanged,
    'updated_ids', to_jsonb(v_updated_ids),
    'skipped_details', v_skipped_details
  );
end;
$$;

revoke all on function public.admin_bulk_set_user_active(uuid[], boolean, text)
  from public;
grant execute on function public.admin_bulk_set_user_active(uuid[], boolean, text)
  to authenticated, service_role;

-- 11. ADMIN SET WIDGET (single) --------------------------------------

create or replace function public.admin_set_user_widget_permissions(
  p_user_id uuid,
  p_permissions jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.app_role;
  v_label text;
  v_old jsonb;
  v_rec record;
  v_count int := 0;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: khusus admin' using errcode = '42501';
  end if;

  if p_user_id is null then
    raise exception 'p_user_id wajib diisi';
  end if;

  select
    role,
    coalesce(username, email, id::text)
  into v_role, v_label
  from public.profiles
  where id = p_user_id;

  if not found then
    raise exception 'User tidak ditemukan';
  end if;

  if v_role = 'admin'::public.app_role then
    raise exception 'Admin selalu punya akses semua widget';
  end if;

  if p_permissions is null or jsonb_typeof(p_permissions) <> 'object' then
    raise exception 'Format permission widget tidak valid';
  end if;

  for v_rec in select key, value from jsonb_each(p_permissions) loop
    if v_rec.key !~ '^[a-z0-9][a-z0-9-]{0,39}$' then
      raise exception 'Widget key tidak valid: %', v_rec.key;
    end if;
    if jsonb_typeof(v_rec.value) <> 'boolean' then
      raise exception 'Nilai permission widget harus boolean';
    end if;
  end loop;

  select coalesce(jsonb_object_agg(widget_key, allowed), '{}'::jsonb)
  into v_old
  from public.user_widget_permissions
  where user_id = p_user_id;

  delete from public.user_widget_permissions where user_id = p_user_id;

  for v_rec in select key, value from jsonb_each(p_permissions) loop
    insert into public.user_widget_permissions(
      user_id, widget_key, allowed, updated_by
    )
    values (
      p_user_id,
      v_rec.key,
      (v_rec.value #>> '{}')::boolean,
      auth.uid()
    );

    v_count := v_count + 1;
  end loop;

  perform public.log_admin_action(
    'widget.set',
    p_user_id,
    v_label,
    v_old,
    p_permissions,
    null,
    gen_random_uuid()
  );

  return jsonb_build_object('user_id', p_user_id, 'count', v_count);
end;
$$;

revoke all on function public.admin_set_user_widget_permissions(uuid, jsonb)
  from public;
grant execute on function public.admin_set_user_widget_permissions(uuid, jsonb)
  to authenticated, service_role;

-- 12. ADMIN SET WIDGET (bulk) ----------------------------------------

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
  v_label text;
  v_old jsonb;
  v_rec record;
  v_batch_id uuid := gen_random_uuid();
  v_updated int := 0;
  v_skipped int := 0;
  v_skipped_details jsonb := '[]'::jsonb;
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

  for v_rec in select key, value from jsonb_each(p_permissions) loop
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
    select
      role,
      coalesce(username, email, id::text)
    into v_role, v_label
    from public.profiles
    where id = v_id
    for update;

    if not found then
      v_skipped := v_skipped + 1;
      v_skipped_details := v_skipped_details || jsonb_build_object(
        'id', v_id,
        'label', v_id::text,
        'reason', 'User tidak ditemukan'
      );
      continue;
    end if;

    if v_role <> 'user'::public.app_role then
      v_skipped := v_skipped + 1;
      v_skipped_details := v_skipped_details || jsonb_build_object(
        'id', v_id,
        'label', v_label,
        'reason', 'Hanya role User yang bisa diatur akses widget'
      );
      continue;
    end if;

    select coalesce(jsonb_object_agg(widget_key, allowed), '{}'::jsonb)
    into v_old
    from public.user_widget_permissions
    where user_id = v_id;

    delete from public.user_widget_permissions where user_id = v_id;

    for v_rec in select key, value from jsonb_each(p_permissions) loop
      insert into public.user_widget_permissions(
        user_id, widget_key, allowed, updated_by
      )
      values (
        v_id,
        v_rec.key,
        (v_rec.value #>> '{}')::boolean,
        auth.uid()
      );
    end loop;

    perform public.log_admin_action(
      'widget.bulk',
      v_id,
      v_label,
      v_old,
      p_permissions,
      null,
      v_batch_id
    );

    v_updated := v_updated + 1;
  end loop;

  return jsonb_build_object(
    'updated', v_updated,
    'skipped', v_skipped,
    'skipped_details', v_skipped_details
  );
end;
$$;

revoke all on function public.admin_bulk_set_user_widget_permissions(uuid[], jsonb)
  from public;
grant execute on function public.admin_bulk_set_user_widget_permissions(uuid[], jsonb)
  to authenticated, service_role;

-- 13. ADMIN RESET WIDGET (single) ------------------------------------

create or replace function public.admin_reset_user_widget_permissions(
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.app_role;
  v_label text;
  v_old jsonb;
  v_deleted int := 0;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: khusus admin' using errcode = '42501';
  end if;

  if p_user_id is null then
    raise exception 'p_user_id wajib diisi';
  end if;

  select
    role,
    coalesce(username, email, id::text)
  into v_role, v_label
  from public.profiles
  where id = p_user_id;

  if not found then
    raise exception 'User tidak ditemukan';
  end if;

  if v_role = 'admin'::public.app_role then
    raise exception 'Admin selalu punya akses semua widget';
  end if;

  select coalesce(jsonb_object_agg(widget_key, allowed), '{}'::jsonb)
  into v_old
  from public.user_widget_permissions
  where user_id = p_user_id;

  delete from public.user_widget_permissions where user_id = p_user_id;
  get diagnostics v_deleted = row_count;

  perform public.log_admin_action(
    'widget.reset',
    p_user_id,
    v_label,
    v_old,
    '{}'::jsonb,
    null,
    gen_random_uuid()
  );

  return jsonb_build_object(
    'user_id', p_user_id,
    'deleted', v_deleted
  );
end;
$$;

revoke all on function public.admin_reset_user_widget_permissions(uuid)
  from public;
grant execute on function public.admin_reset_user_widget_permissions(uuid)
  to authenticated, service_role;

-- 14. ADMIN RESET WIDGET (bulk) --------------------------------------

create or replace function public.admin_bulk_reset_user_widget_permissions(
  p_user_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_role public.app_role;
  v_label text;
  v_old jsonb;
  v_batch_id uuid := gen_random_uuid();
  v_updated int := 0;
  v_skipped int := 0;
  v_skipped_details jsonb := '[]'::jsonb;
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

  for v_id in
    select distinct x from unnest(p_user_ids) as x order by x
  loop
    select
      role,
      coalesce(username, email, id::text)
    into v_role, v_label
    from public.profiles
    where id = v_id
    for update;

    if not found then
      v_skipped := v_skipped + 1;
      v_skipped_details := v_skipped_details || jsonb_build_object(
        'id', v_id,
        'label', v_id::text,
        'reason', 'User tidak ditemukan'
      );
      continue;
    end if;

    if v_role = 'admin'::public.app_role then
      v_skipped := v_skipped + 1;
      v_skipped_details := v_skipped_details || jsonb_build_object(
        'id', v_id,
        'label', v_label,
        'reason', 'Admin selalu punya akses semua widget'
      );
      continue;
    end if;

    select coalesce(jsonb_object_agg(widget_key, allowed), '{}'::jsonb)
    into v_old
    from public.user_widget_permissions
    where user_id = v_id;

    delete from public.user_widget_permissions where user_id = v_id;

    perform public.log_admin_action(
      'widget.bulk_reset',
      v_id,
      v_label,
      v_old,
      '{}'::jsonb,
      null,
      v_batch_id
    );

    v_updated := v_updated + 1;
  end loop;

  return jsonb_build_object(
    'updated', v_updated,
    'skipped', v_skipped,
    'skipped_details', v_skipped_details
  );
end;
$$;

revoke all on function public.admin_bulk_reset_user_widget_permissions(uuid[])
  from public;
grant execute on function public.admin_bulk_reset_user_widget_permissions(uuid[])
  to authenticated, service_role;

-- 15. ADMIN AUDIT LOG: LIST ------------------------------------------

create or replace function public.admin_list_audit_log(
  p_limit int default 50,
  p_offset int default 0,
  p_action text default null,
  p_target_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit int := least(greatest(coalesce(p_limit, 50), 1), 200);
  v_offset int := greatest(coalesce(p_offset, 0), 0);
  v_action text := nullif(trim(coalesce(p_action, '')), '');
  v_entries jsonb;
  v_total int;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: khusus admin' using errcode = '42501';
  end if;

  select count(*)
  into v_total
  from public.admin_audit_log a
  where (v_action is null or a.action = v_action)
    and (p_target_id is null or a.target_id = p_target_id);

  select coalesce(
    jsonb_agg(row_to_json(t) order by t.created_at desc, t.id desc),
    '[]'::jsonb
  )
  into v_entries
  from (
    select
      a.id,
      a.batch_id,
      a.actor_id,
      a.actor_email,
      a.target_id,
      a.target_label,
      a.action,
      a.old_value,
      a.new_value,
      a.reason,
      a.created_at
    from public.admin_audit_log a
    where (v_action is null or a.action = v_action)
      and (p_target_id is null or a.target_id = p_target_id)
    order by a.created_at desc, a.id desc
    limit v_limit offset v_offset
  ) t;

  return jsonb_build_object(
    'entries', v_entries,
    'total', v_total,
    'limit', v_limit,
    'offset', v_offset
  );
end;
$$;

revoke all on function public.admin_list_audit_log(int, int, text, uuid)
  from public;
grant execute on function public.admin_list_audit_log(int, int, text, uuid)
  to authenticated, service_role;

-- 16. PRIVATE KEY DONATION RPC: PAKAI HELPER YANG CEK is_active ------

create or replace function public.insert_donation_by_private_key(
  p_key text,
  p_platform text,
  p_donor_name text,
  p_amount integer,
  p_currency text,
  p_amount_formatted text,
  p_message text,
  p_transaction_id text,
  p_raw jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_id uuid;
  v_tx text;
begin
  if p_key is null or length(trim(p_key)) < 8 then
    raise exception 'privateKey tidak valid';
  end if;
  if p_platform not in ('saweria','tiptap','trakteer','bagibagi','socialbuzz','tako','sibagi','generic') then
    raise exception 'platform tidak valid: %', p_platform;
  end if;

  v_user := public.get_user_id_by_private_key(p_key);
  if v_user is null then
    raise exception 'privateKey tidak ditemukan';
  end if;

  v_tx := left(
    coalesce(nullif(trim(p_transaction_id), ''), gen_random_uuid()::text),
    80
  );

  if v_tx not like 'don\_%'
    and v_tx not like 'test\_%'
    and v_tx not like 'sock\_test\_%' then
    select id into v_id
    from public.donation_logs
    where user_id = v_user
      and platform = p_platform
      and transaction_id = v_tx
    limit 1;

    if v_id is not null then
      return v_id;
    end if;
  end if;

  insert into public.donation_logs (
    user_id,
    platform,
    donor_name,
    amount,
    currency,
    amount_formatted,
    message,
    transaction_id,
    raw
  ) values (
    v_user,
    p_platform,
    left(coalesce(p_donor_name, 'Donatur'), 80),
    greatest(0, p_amount),
    upper(left(coalesce(p_currency, 'IDR'), 3)),
    left(coalesce(p_amount_formatted, ''), 32),
    left(coalesce(p_message, ''), 500),
    v_tx,
    coalesce(p_raw, '{}'::jsonb)
  )
  on conflict (user_id, platform, transaction_id)
    where transaction_id is not null and transaction_id <> ''
    do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id
    from public.donation_logs
    where user_id = v_user
      and platform = p_platform
      and transaction_id = v_tx
    limit 1;
  end if;

  return v_id;
end;
$$;

revoke all on function public.insert_donation_by_private_key(
  text, text, text, integer, text, text, text, text, jsonb
) from public;
grant execute on function public.insert_donation_by_private_key(
  text, text, text, integer, text, text, text, text, jsonb
) to anon, authenticated, service_role;

create or replace function public.get_donations_by_private_key(
  p_key text,
  p_limit int default 20
)
returns setof public.donation_logs
language sql
security definer
set search_path = public
as $$
  with target_user as (
    select public.get_user_id_by_private_key(p_key) as id
  )
  select d.*
  from public.donation_logs d
  where d.user_id = (select id from target_user)
  order by d.created_at desc
  limit greatest(1, least(coalesce(p_limit, 20), 50));
$$;

revoke all on function public.get_donations_by_private_key(text, int) from public;
grant execute on function public.get_donations_by_private_key(text, int)
  to anon, authenticated, service_role;

create or replace function public.get_donation_total_by_private_key(
  p_key text,
  p_before timestamptz default now()
)
returns table(total numeric, donation_count bigint)
language sql
security definer
set search_path = public
as $$
  with target_user as (
    select public.get_user_id_by_private_key(p_key) as id
  )
  select
    coalesce(sum(d.amount), 0)::numeric as total,
    count(*)::bigint as donation_count
  from public.donation_logs d
  where d.user_id = (select id from target_user)
    and (p_before is null or d.created_at < p_before);
$$;

revoke all on function public.get_donation_total_by_private_key(text, timestamptz)
  from public;
grant execute on function public.get_donation_total_by_private_key(text, timestamptz)
  to anon, authenticated, service_role;

-- 17. REGENERATE PRIVATE KEY: TOLAK AKUN NONAKTIF --------------------

create or replace function public.regenerate_private_key()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_key text := encode(gen_random_bytes(32), 'hex');
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

-- 18. VERIFIKASI CEPAT ------------------------------------------------
-- Setelah migration:
--   select public.is_active_user();
--   select public.admin_list_users('', 10, 0, null, null);
--   select public.admin_list_audit_log(10, 0, null, null);
