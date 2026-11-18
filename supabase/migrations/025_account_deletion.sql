-- ============================================
-- Migration 025: Hapus akun sendiri
--
-- Tujuan:
--   - chat_messages / activity_logs / gift_logs ikut terhapus saat akun
--     dihapus. Sebelumnya FK-nya ON DELETE SET NULL sehingga log tetap
--     tersimpan dengan user_id NULL.
--   - RPC prepare_admin_self_deletion() mengunci proses penghapusan admin
--     supaya dua admin tidak bisa saling menghapus bersamaan dan
--     menyisakan nol admin aktif.
--   - Audit log admin tetap ON DELETE SET NULL agar riwayat keamanan tidak
--     hilang; server action akan mengosongkan identifier PII sebelum delete.
-- ============================================

-- 1. Log stream ikut terhapus saat pemilik workspace dihapus ---------

do $$
declare
  r record;
begin
  for r in
    select c.relname as table_name, con.conname as constraint_name
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('chat_messages', 'activity_logs', 'gift_logs')
      and con.contype = 'f'
      and con.confrelid = 'auth.users'::regclass
  loop
    execute format(
      'alter table public.%I drop constraint %I',
      r.table_name,
      r.constraint_name
    );
  end loop;
end $$;

alter table public.chat_messages
  add constraint chat_messages_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.activity_logs
  add constraint activity_logs_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.gift_logs
  add constraint gift_logs_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- Mempercepat cascade delete dan lookup per user.
create index if not exists idx_chat_user
  on public.chat_messages(user_id);
create index if not exists idx_activity_user
  on public.activity_logs(user_id);
create index if not exists idx_gift_user
  on public.gift_logs(user_id);

-- 2. Guard race condition admin terakhir saat self-delete -------------
-- Admin dipanggil dari server action sebelum auth.users dihapus. Fungsi
-- ini menandai akun nonaktif di dalam advisory lock, sehingga admin lain
-- yang mencoba delete bersamaan akan melihat admin ini sudah tidak aktif.

create or replace function public.prepare_admin_self_deletion()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.app_role;
  v_other_active_admins int;
begin
  if v_uid is null then
    raise exception 'Sesi tidak valid' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext('obs_dock_admin_mutation')::bigint);

  select role
  into v_role
  from public.profiles
  where id = v_uid
    and is_active
  for update;

  if not found then
    raise exception 'Akun tidak ditemukan atau sudah nonaktif'
      using errcode = '42501';
  end if;

  if v_role <> 'admin'::public.app_role then
    raise exception 'RPC ini hanya untuk admin' using errcode = '42501';
  end if;

  select count(*)
  into v_other_active_admins
  from public.profiles
  where role = 'admin'::public.app_role
    and is_active
    and id <> v_uid;

  if v_other_active_admins < 1 then
    raise exception 'Tidak bisa menghapus akun admin aktif terakhir';
  end if;

  update public.profiles
  set
    is_active = false,
    blocked_at = now(),
    blocked_by = v_uid,
    block_reason = 'Penghapusan akun'
  where id = v_uid;
end;
$$;

revoke all on function public.prepare_admin_self_deletion() from public;
grant execute on function public.prepare_admin_self_deletion()
  to authenticated, service_role;

comment on function public.prepare_admin_self_deletion() is
  'Menandai admin self-delete sebagai nonaktif dengan advisory lock, agar last-admin tidak bisa nol.';
