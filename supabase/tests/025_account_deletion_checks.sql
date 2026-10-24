-- ============================================
-- SQL verification checks untuk migration 025.
-- Jalankan di Supabase SQL Editor SETELAH 025.
--
-- Fokus:
--   - log stream ikut cascade saat auth user dihapus
--   - audit log admin tetap set null (riwayat tidak hilang)
--   - index lookup/cascade user_id tersedia
--   - RPC prepare_admin_self_deletion() terpasang dan hanya untuk authenticated
-- ============================================

do $$
declare
  v_count int;
begin
  -- 1. Tiga log stream harus ON DELETE CASCADE ke auth.users
  select count(*) into v_count
  from pg_constraint con
  join pg_class c on c.oid = con.conrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('chat_messages', 'activity_logs', 'gift_logs')
    and con.contype = 'f'
    and con.confrelid = 'auth.users'::regclass
    and con.confdeltype = 'c';

  if v_count < 3 then
    raise exception 'FAIL: FK log stream belum ON DELETE CASCADE (found %, expected 3)', v_count;
  end if;

  -- 2. Profil tetap cascade
  if not exists (
    select 1
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'profiles'
      and con.contype = 'f'
      and con.confrelid = 'auth.users'::regclass
      and con.confdeltype = 'c'
  ) then
    raise exception 'FAIL: FK profiles -> auth.users bukan ON DELETE CASCADE';
  end if;

  -- 3. Audit log admin harus tetap SET NULL, bukan cascade
  select count(*) into v_count
  from pg_constraint con
  join pg_class c on c.oid = con.conrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'admin_audit_log'
    and con.contype = 'f'
    and con.confrelid = 'auth.users'::regclass
    and con.confdeltype = 'n';

  if v_count < 2 then
    raise exception 'FAIL: FK actor_id/target_id admin_audit_log harus ON DELETE SET NULL';
  end if;

  -- 4. Index untuk cascade delete
  if to_regclass('public.idx_chat_user') is null then
    raise exception 'FAIL: index idx_chat_user belum ada';
  end if;

  if to_regclass('public.idx_activity_user') is null then
    raise exception 'FAIL: index idx_activity_user belum ada';
  end if;

  if to_regclass('public.idx_gift_user') is null then
    raise exception 'FAIL: index idx_gift_user belum ada';
  end if;

  -- 5. RPC guard self-delete admin
  if to_regprocedure('public.prepare_admin_self_deletion()') is null then
    raise exception 'FAIL: public.prepare_admin_self_deletion() belum ada';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.prepare_admin_self_deletion()',
    'execute'
  ) then
    raise exception 'FAIL: authenticated harus bisa memanggil prepare_admin_self_deletion()';
  end if;

  if has_function_privilege(
    'anon',
    'public.prepare_admin_self_deletion()',
    'execute'
  ) then
    raise exception 'FAIL: anon tidak boleh memanggil prepare_admin_self_deletion()';
  end if;

  raise notice 'PASS: semua invariant migration 025 terpenuhi';
end;
$$;
