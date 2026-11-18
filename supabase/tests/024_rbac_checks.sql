-- ============================================
-- SQL verification checks untuk migration 024.
-- Jalankan di Supabase SQL Editor SETELAH 024.
-- Script ini hanya membaca metadata dan akan raise exception kalau ada
-- invariant keamanan yang belum terpasang.
-- ============================================

do $$
declare
  v_count int;
  v_def text;
begin
  -- 1. Kolom metadata blokir
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'blocked_at'
  ) then
    raise exception 'FAIL: profiles.blocked_at belum ada';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'blocked_by'
  ) then
    raise exception 'FAIL: profiles.blocked_by belum ada';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'block_reason'
  ) then
    raise exception 'FAIL: profiles.block_reason belum ada';
  end if;

  -- 2. Helper dan guard
  if to_regprocedure('public.is_active_user()') is null then
    raise exception 'FAIL: public.is_active_user() belum ada';
  end if;

  if to_regprocedure('public.guard_profile_status_update()') is null then
    raise exception 'FAIL: guard_profile_status_update() belum ada';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'trg_profiles_status_guard'
      and tgrelid = 'public.profiles'::regclass
  ) then
    raise exception 'FAIL: trigger trg_profiles_status_guard belum ada';
  end if;

  -- 3. profiles_select_own HARUS tetap bisa dibaca akun nonaktif
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_select_own'
      and coalesce(qual, '') like '%is_active_user%'
  ) then
    raise exception 'FAIL: profiles_select_own tidak boleh memakai is_active_user()';
  end if;

  -- 4. Policy workspace harus memakai is_active_user()
  select count(*) into v_count
  from pg_policies
  where schemaname = 'public'
    and (
      coalesce(qual, '') like '%is_active_user%'
      or coalesce(with_check, '') like '%is_active_user%'
    );

  if v_count < 20 then
    raise exception 'FAIL: hanya % policy public yang memakai is_active_user(); expected >= 20', v_count;
  end if;

  select count(*) into v_count
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname in ('avatars_upload_own', 'avatars_update_own')
    and (
      coalesce(qual, '') like '%is_active_user%'
      or coalesce(with_check, '') like '%is_active_user%'
    );

  if v_count < 2 then
    raise exception 'FAIL: policy storage avatar belum memakai is_active_user()';
  end if;

  -- 5. Audit log
  if to_regclass('public.admin_audit_log') is null then
    raise exception 'FAIL: public.admin_audit_log belum ada';
  end if;

  if not exists (
    select 1 from pg_class
    where oid = 'public.admin_audit_log'::regclass
      and relrowsecurity
  ) then
    raise exception 'FAIL: RLS admin_audit_log belum aktif';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_audit_log'
  ) then
    raise exception 'FAIL: admin_audit_log tidak boleh punya policy direct access';
  end if;

  if to_regprocedure('public.log_admin_action(text, uuid, text, jsonb, jsonb, text, uuid)') is null then
    raise exception 'FAIL: log_admin_action() belum ada';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.log_admin_action(text, uuid, text, jsonb, jsonb, text, uuid)',
    'execute'
  ) then
    raise exception 'FAIL: authenticated tidak boleh bisa memanggil log_admin_action() langsung';
  end if;

  if has_table_privilege('authenticated', 'public.admin_audit_log', 'select') then
    raise exception 'FAIL: authenticated tidak boleh punya SELECT langsung ke admin_audit_log';
  end if;

  if to_regprocedure('public.admin_list_audit_log(int, int, text, uuid)') is null then
    raise exception 'FAIL: admin_list_audit_log() belum ada';
  end if;

  -- 6. RPC signature baru
  if to_regprocedure('public.admin_list_users(text, int, int, text, text)') is null then
    raise exception 'FAIL: admin_list_users() versi filter/pagination belum ada';
  end if;

  if to_regprocedure('public.admin_set_user_active(uuid, boolean, text)') is null then
    raise exception 'FAIL: admin_set_user_active(reason) belum ada';
  end if;

  if to_regprocedure('public.admin_bulk_set_user_active(uuid[], boolean, text)') is null then
    raise exception 'FAIL: admin_bulk_set_user_active(reason) belum ada';
  end if;

  if to_regprocedure('public.admin_reset_user_widget_permissions(uuid)') is null then
    raise exception 'FAIL: admin_reset_user_widget_permissions() belum ada';
  end if;

  if to_regprocedure('public.admin_bulk_reset_user_widget_permissions(uuid[])') is null then
    raise exception 'FAIL: admin_bulk_reset_user_widget_permissions() belum ada';
  end if;

  -- 7. RPC donasi tidak boleh query profiles.private_key langsung
  v_def := pg_get_functiondef(
    'public.insert_donation_by_private_key(text,text,text,integer,text,text,text,text,jsonb)'::regprocedure
  );
  if v_def not like '%get_user_id_by_private_key%' then
    raise exception 'FAIL: insert_donation_by_private_key belum memakai helper aktif';
  end if;

  v_def := pg_get_functiondef(
    'public.get_donations_by_private_key(text,int)'::regprocedure
  );
  if v_def not like '%get_user_id_by_private_key%' then
    raise exception 'FAIL: get_donations_by_private_key belum memakai helper aktif';
  end if;

  v_def := pg_get_functiondef(
    'public.get_donation_total_by_private_key(text,timestamptz)'::regprocedure
  );
  if v_def not like '%get_user_id_by_private_key%' then
    raise exception 'FAIL: get_donation_total_by_private_key belum memakai helper aktif';
  end if;

  raise notice 'PASS: semua invariant migration 024 terpenuhi';
end;
$$;
