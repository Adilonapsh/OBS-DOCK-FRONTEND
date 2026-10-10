-- ============================================
-- Migration 018: Donasi dedup — transaction_id unik per user+platform
-- Mencegah retry webhook / double-hit tercatat 2x di DB.
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Bersihkan duplikat yang mungkin sudah ada (sisakan 1 terlama per user+platform+transaction_id)
-- Hanya untuk transaction_id native (bukan fallback don_/test_/sock_test_ yang memang random).
delete from public.donation_logs a
using public.donation_logs b
where a.id > b.id
  and a.user_id = b.user_id
  and a.platform = b.platform
  and a.transaction_id is not null
  and a.transaction_id <> ''
  and a.transaction_id = b.transaction_id
  and a.transaction_id not like 'don\_%'
  and a.transaction_id not like 'test\_%'
  and a.transaction_id not like 'sock\_test\_%';

-- Unique index agar DB menolak duplikat walau 2 request masuk bersamaan.
-- Partial index: hanya untuk transaction_id native (fallback random tidak perlu dibatasi,
-- tapi tetap aman karena nilainya selalu unik).
create unique index if not exists uq_donation_user_platform_tx
  on public.donation_logs (user_id, platform, transaction_id)
  where transaction_id is not null and transaction_id <> '';

-- Update RPC insert: kembalikan id lama jika transaction_id sudah tercatat
-- (idempotent — retry webhook aman, tidak double).
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
  select id into v_user from public.profiles where private_key = p_key limit 1;
  if v_user is null then
    -- fallback ke user_private_keys (legacy)
    select user_id into v_user from public.user_private_keys where private_key = p_key limit 1;
  end if;
  if v_user is null then
    raise exception 'privateKey tidak ditemukan';
  end if;

  v_tx := left(coalesce(nullif(trim(p_transaction_id), ''), gen_random_uuid()::text), 80);

  -- Dedup: jika transaction_id native sudah ada untuk user+platform, kembalikan id lama
  if v_tx not like 'don\_%' and v_tx not like 'test\_%' and v_tx not like 'sock\_test\_%' then
    select id into v_id from public.donation_logs
    where user_id = v_user and platform = p_platform and transaction_id = v_tx
    limit 1;
    if v_id is not null then
      return v_id;
    end if;
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
    v_tx,
    coalesce(p_raw, '{}'::jsonb)
  )
  on conflict (user_id, platform, transaction_id)
    where transaction_id is not null and transaction_id <> ''
    do nothing
  returning id into v_id;

  -- Jika conflict (race condition), ambil id yang sudah ada
  if v_id is null then
    select id into v_id from public.donation_logs
    where user_id = v_user and platform = p_platform and transaction_id = v_tx
    limit 1;
  end if;

  return v_id;
end;
$$;

revoke all on function public.insert_donation_by_private_key(text,text,text,integer,text,text,text,text,jsonb) from public;
grant execute on function public.insert_donation_by_private_key(text,text,text,integer,text,text,text,text,jsonb) to anon, authenticated, service_role;
