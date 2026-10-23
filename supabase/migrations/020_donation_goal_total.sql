-- Total donasi untuk Donation Goal.
-- Sumber: public.donation_logs (semua transaksi milik private key).
-- p_before dipakai supaya event live yang masuk saat halaman baru dibuka
-- tidak ikut terhitung dua kali (log lama + increment live).
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
    select id from public.profiles where private_key = p_key
    union all
    select user_id from public.user_private_keys where private_key = p_key
    limit 1
  )
  select
    coalesce(sum(d.amount), 0)::numeric as total,
    count(*)::bigint as donation_count
  from public.donation_logs d
  where d.user_id = (select id from target_user)
    and (p_before is null or d.created_at < p_before);
$$;

grant execute on function public.get_donation_total_by_private_key(text, timestamptz) to anon, authenticated, service_role;
