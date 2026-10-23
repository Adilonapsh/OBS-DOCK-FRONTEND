-- ============================================
-- Private Key sebagai BYPASS tanpa login
-- private_key bisa fetch semua konfigurasi & data tanpa Supabase session
-- ============================================

-- 1. Pastikan private_key ada (sudah di 002, tapi jaga)
create extension if not exists "pgcrypto";
alter table public.profiles add column if not exists private_key text unique default encode(gen_random_bytes(32), 'hex');

-- 2. Helper: cari user_id dari private_key (bypass)
create or replace function public.get_user_id_by_private_key(p_key text)
returns uuid language sql security definer as $$
  select id from public.profiles where private_key = p_key
  union
  select user_id from public.user_private_keys where private_key = p_key
  limit 1;
$$;

grant execute on function public.get_user_id_by_private_key(text) to anon, authenticated;

-- 3. Verifikasi private_key valid?
create or replace function public.verify_private_key(p_key text)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.profiles where private_key = p_key
    union select 1 from public.user_private_keys where private_key = p_key
  );
$$;

grant execute on function public.verify_private_key(text) to anon, authenticated;

-- 4. Fetch semua config & data via private_key (SECURITY DEFINER = bypass RLS)
create or replace function public.get_all_by_private_key(p_key text)
returns json language plpgsql security definer as $$
declare
  uid uuid;
  result json;
begin
  uid := public.get_user_id_by_private_key(p_key);
  if uid is null then
    return json_build_object('error', 'Private key tidak valid');
  end if;

  return json_build_object(
    'user_id', uid,
    'profile', (select row_to_json(p) from public.profiles p where p.id = uid),
    'obs_config', (select row_to_json(o) from public.obs_configs o where o.user_id = uid),
    'tiktok_config', (select row_to_json(t) from public.tiktok_configs t where t.user_id = uid),
    'streamerbot_config', (select row_to_json(s) from public.streamerbot_configs s where s.user_id = uid),
    'dashboard_layout', (select row_to_json(d) from public.dashboard_layouts d where d.user_id = uid),
    'briefing', (select row_to_json(b) from public.stream_briefings b where b.user_id = uid order by updated_at desc limit 1),
    'private_key', p_key
  );
end;
$$;

grant execute on function public.get_all_by_private_key(text) to anon, authenticated;

-- 5. Fetch chat/activity/gift via private_key (opsional, untuk overlay public tanpa login)
create or replace function public.get_recent_data_by_private_key(p_key text)
returns json language plpgsql security definer as $$
declare uid uuid;
begin
  uid := public.get_user_id_by_private_key(p_key);
  if uid is null then return json_build_object('error','Private key tidak valid'); end if;
  return json_build_object(
    'chat', (select coalesce(json_agg(row_to_json(c) order by c.created_at desc), '[]'::json) from (select * from public.chat_messages where user_id = uid order by created_at desc limit 20) c),
    'activity', (select coalesce(json_agg(row_to_json(a) order by a.created_at desc), '[]'::json) from (select * from public.activity_logs where user_id = uid order by created_at desc limit 20) a),
    'gift', (select coalesce(json_agg(row_to_json(g) order by g.created_at desc), '[]'::json) from (select * from public.gift_logs where user_id = uid order by created_at desc limit 20) g)
  );
end;
$$;

grant execute on function public.get_recent_data_by_private_key(text) to anon, authenticated;
