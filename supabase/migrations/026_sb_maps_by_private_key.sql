-- ============================================
-- Migration: mapping Streamer.bot lewat private key
-- Dipakai dock tanpa login (OBS Custom Browser Dock / ?key=) yang tidak bisa
-- membaca/menulis tabel integration_settings karena RLS.
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Baca ketiga mapping sekaligus (dock = eksekutor)
create or replace function public.get_sb_maps_by_private_key(p_key text)
returns json language plpgsql security definer as $$
declare uid uuid := public.get_user_id_by_private_key(p_key);
begin
  if uid is null then return json_build_object('error', 'Private key tidak valid'); end if;
  return json_build_object(
    'tiktok_sb_map', (select to_jsonb(i) -> 'tiktok_sb_map' from public.integration_settings i where i.user_id = uid),
    'widget_sb_map', (select to_jsonb(i) -> 'widget_sb_map' from public.integration_settings i where i.user_id = uid),
    'donation_sb_map', (select to_jsonb(i) -> 'donation_sb_map' from public.integration_settings i where i.user_id = uid)
  );
end;
$$;
grant execute on function public.get_sb_maps_by_private_key(text) to anon, authenticated;

-- Simpan satu mapping dari halaman /integrations mode tanpa login.
-- p_kind: 'tiktok' | 'widget' | 'donation'
create or replace function public.upsert_sb_map_by_private_key(p_key text, p_kind text, p_map jsonb)
returns void language plpgsql security definer as $$
declare
  uid uuid := public.get_user_id_by_private_key(p_key);
  col text;
begin
  if uid is null then raise exception 'Private key tidak valid'; end if;
  col := case lower(coalesce(p_kind, ''))
    when 'tiktok' then 'tiktok_sb_map'
    when 'widget' then 'widget_sb_map'
    when 'donation' then 'donation_sb_map'
    else null
  end;
  if col is null then raise exception 'Jenis mapping tidak valid'; end if;

  insert into public.integration_settings (user_id) values (uid)
  on conflict (user_id) do nothing;

  execute format(
    'update public.integration_settings set %I = $1, updated_at = now() where user_id = $2',
    col
  ) using p_map, uid;
end;
$$;
grant execute on function public.upsert_sb_map_by_private_key(text, text, jsonb) to anon, authenticated;
