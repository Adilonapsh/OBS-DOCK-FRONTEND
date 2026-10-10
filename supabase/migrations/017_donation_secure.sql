-- ============================================
-- Migration 017: Donasi secure — currency + RPC privateKey
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Pastikan donation_logs punya kolom currency & amount_formatted (jika migration 016 sudah jalan, ini hanya add jika belum ada)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='donation_logs' and column_name='currency'
  ) then
    alter table public.donation_logs add column currency text not null default 'IDR' check (char_length(currency)=3);
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='donation_logs' and column_name='amount_formatted'
  ) then
    alter table public.donation_logs add column amount_formatted text not null default '' ;
  end if;
end $$;

-- Index untuk history per user
create index if not exists idx_donation_user_created on public.donation_logs(user_id, created_at desc);

-- RLS sudah ada di 016 (donation_owner: auth.uid() = user_id). Pastikan tetap enabled.
alter table public.donation_logs enable row level security;

drop policy if exists "donation_owner" on public.donation_logs;
create policy "donation_owner" on public.donation_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Service_role bypass RLS otomatis, tidak perlu policy tambahan.
-- Anon/authenticated hanya bisa lihat milik sendiri via donation_owner.

-- RPC secure: insert donasi via private_key (dipakai backend webhook tanpa auth)
-- SECURITY DEFINER agar bisa lookup profiles.private_key dan insert sebagai service
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
begin
  if p_key is null or length(trim(p_key)) < 8 then
    raise exception 'privateKey tidak valid';
  end if;
  if p_platform not in ('saweria','tiptap','trakteer','bagibagi','socialbuzz','tako','sibagi','generic') then
    raise exception 'platform tidak valid: %', p_platform;
  end if;
  select id into v_user from public.profiles where private_key = p_key limit 1;
  if v_user is null then
    -- fallback ke user_private_keys (legacy)
    select user_id into v_user from public.user_private_keys where private_key = p_key limit 1;
  end if;
  if v_user is null then
    raise exception 'privateKey tidak ditemukan';
  end if;

  insert into public.donation_logs (
    user_id, platform, donor_name, amount, currency, amount_formatted, message, transaction_id, raw
  ) values (
    v_user,
    p_platform,
    left(coalesce(p_donor_name,'Donatur'), 80),
    greatest(0, p_amount),
    upper(left(coalesce(p_currency,'IDR'),3)),
    left(coalesce(p_amount_formatted,''),32),
    left(coalesce(p_message,''),500),
    left(coalesce(p_transaction_id, gen_random_uuid()::text),80),
    coalesce(p_raw, '{}'::jsonb)
  ) returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.insert_donation_by_private_key(text,text,text,integer,text,text,text,text,jsonb) from public;
grant execute on function public.insert_donation_by_private_key(text,text,text,integer,text,text,text,text,jsonb) to anon, authenticated, service_role;

-- RPC baca history via privateKey (untuk dock tanpa login, tapi tetap isolasi)
create or replace function public.get_donations_by_private_key(p_key text, p_limit int default 20)
returns setof public.donation_logs
language sql
security definer
set search_path = public
as $$
  select d.* from public.donation_logs d
  where d.user_id = (
    select id from public.profiles where private_key = p_key
    union all
    select user_id from public.user_private_keys where private_key = p_key
    limit 1
  )
  order by d.created_at desc
  limit greatest(1, least(coalesce(p_limit,20), 50));
$$;
grant execute on function public.get_donations_by_private_key(text, int) to anon, authenticated, service_role;

-- Pastikan get_user_id_by_private_key ada (dipakai fallback)
create or replace function public.get_user_id_by_private_key(p_key text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from public.profiles where private_key = p_key
  union all
  select user_id from public.user_private_keys where private_key = p_key
  limit 1;
$$;
grant execute on function public.get_user_id_by_private_key(text) to anon, authenticated, service_role;
