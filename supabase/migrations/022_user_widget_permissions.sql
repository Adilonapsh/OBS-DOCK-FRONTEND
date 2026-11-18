-- ============================================
-- Migration 022: Per-user widget permissions
--
-- Menyimpan override akses widget per user.
-- - Tidak ada baris = ikut default role (user: semua boleh, guest: tidak)
-- - Role admin selalu boleh semua widget (tidak bisa dibatasi)
-- - Hanya admin yang bisa menulis, lewat RPC SECURITY DEFINER
--
-- Katalog widget ada di FRONTEND/lib/auth/widgets.ts.
-- ============================================

-- 1. TABEL ------------------------------------------------------

create table if not exists public.user_widget_permissions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  widget_key text not null,
  allowed boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (user_id, widget_key),
  constraint user_widget_permissions_key_format
    check (widget_key ~ '^[a-z0-9][a-z0-9-]{0,39}$')
);

-- PK (user_id, widget_key) sudah meng-cover lookup per user.

-- 2. RLS --------------------------------------------------------
-- User hanya boleh membaca override miliknya sendiri (dipakai client
-- untuk menyembunyikan widget). Insert/update/delete hanya via RPC admin.

alter table public.user_widget_permissions enable row level security;

drop policy if exists "user_widget_permissions_select_own"
  on public.user_widget_permissions;
create policy "user_widget_permissions_select_own"
  on public.user_widget_permissions
  for select using (auth.uid() = user_id);

revoke all on table public.user_widget_permissions from anon;
revoke all on table public.user_widget_permissions from authenticated;
grant select on table public.user_widget_permissions to authenticated;
grant all on table public.user_widget_permissions to service_role;

-- 3. ADMIN RPC: BACA OVERRIDE USER ------------------------------

create or replace function public.admin_get_user_widget_permissions(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.app_role;
  v_overrides jsonb;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: khusus admin' using errcode = '42501';
  end if;

  if p_user_id is null then
    raise exception 'p_user_id wajib diisi';
  end if;

  select role into v_role from public.profiles where id = p_user_id;
  if not found then
    raise exception 'User tidak ditemukan';
  end if;

  select coalesce(jsonb_object_agg(widget_key, allowed), '{}'::jsonb)
  into v_overrides
  from public.user_widget_permissions
  where user_id = p_user_id;

  return jsonb_build_object(
    'user_id', p_user_id,
    'role', v_role::text,
    'overrides', v_overrides
  );
end;
$$;

revoke all on function public.admin_get_user_widget_permissions(uuid) from public;
grant execute on function public.admin_get_user_widget_permissions(uuid)
  to authenticated, service_role;

-- 4. ADMIN RPC: SIMPAN OVERRIDE USER ----------------------------
-- Mengganti seluruh override user dengan p_permissions.
-- Frontend mengirim semua key katalog (true/false), jadi user yang
-- "tidak boleh widget X" tersimpan sebagai allowed=false.

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
  v_rec record;
  v_count int := 0;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: khusus admin' using errcode = '42501';
  end if;

  if p_user_id is null then
    raise exception 'p_user_id wajib diisi';
  end if;

  select role into v_role from public.profiles where id = p_user_id;
  if not found then
    raise exception 'User tidak ditemukan';
  end if;

  if v_role = 'admin'::public.app_role then
    raise exception 'Admin selalu punya akses semua widget';
  end if;

  if p_permissions is null or jsonb_typeof(p_permissions) <> 'object' then
    raise exception 'Format permission widget tidak valid';
  end if;

  delete from public.user_widget_permissions where user_id = p_user_id;

  for v_rec in select key, value from jsonb_each(p_permissions) loop
    if v_rec.key !~ '^[a-z0-9][a-z0-9-]{0,39}$' then
      raise exception 'Widget key tidak valid: %', v_rec.key;
    end if;
    if jsonb_typeof(v_rec.value) <> 'boolean' then
      raise exception 'Nilai permission widget harus boolean';
    end if;

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

  return jsonb_build_object('user_id', p_user_id, 'count', v_count);
end;
$$;

revoke all on function public.admin_set_user_widget_permissions(uuid, jsonb) from public;
grant execute on function public.admin_set_user_widget_permissions(uuid, jsonb)
  to authenticated, service_role;
