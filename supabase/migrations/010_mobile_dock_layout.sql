-- ============================================
-- Migration 010: Dockable layout mobile-dock (Resizable & Dockable panels)
-- Menyimpan posisi/ukuran/susunan panel per user sebagai JSON.
-- Jalankan di Supabase Dashboard → SQL Editor → New query → Paste & Run
-- ============================================

alter table public.mobile_dock_configs
  add column if not exists layout_json jsonb default null;

-- Upsert via private_key: tambah p_layout_json opsional (DEFAULT NULL
-- supaya pemanggil lama tanpa param ini tetap jalan).
create or replace function public.upsert_mobile_dock_config_by_private_key(
  p_key text,
  p_discord text,
  p_deck text,
  p_tiptap_key text,
  p_widget text,
  p_manual text,
  p_room text,
  p_deck_url text,
  p_control_url text,
  p_alert_url text,
  p_monitor_url text,
  p_chat_url text,
  p_layout_json jsonb default null
) returns void language plpgsql security definer as $$
declare uid uuid := public.get_user_id_by_private_key(p_key);
begin
  if uid is null then raise exception 'Private key tidak valid'; end if;
  insert into public.mobile_dock_configs (
    user_id, discord_user_id, deck_id, tiptap_private_key, tiptap_alert_widget_id,
    manual_video_id, bgm_room, deck_url, control_url, alert_url, monitor_url, chat_url,
    layout_json
  )
  values (
    uid, p_discord, p_deck, p_tiptap_key, p_widget,
    p_manual, p_room, p_deck_url, p_control_url, p_alert_url, p_monitor_url, p_chat_url,
    p_layout_json
  )
  on conflict (user_id) do update set
    discord_user_id = excluded.discord_user_id,
    deck_id = excluded.deck_id,
    tiptap_private_key = excluded.tiptap_private_key,
    tiptap_alert_widget_id = excluded.tiptap_alert_widget_id,
    manual_video_id = excluded.manual_video_id,
    bgm_room = excluded.bgm_room,
    deck_url = excluded.deck_url,
    control_url = excluded.control_url,
    alert_url = excluded.alert_url,
    monitor_url = excluded.monitor_url,
    chat_url = excluded.chat_url,
    layout_json = coalesce(excluded.layout_json, public.mobile_dock_configs.layout_json),
    updated_at = now();
end;
$$;

grant execute on function public.upsert_mobile_dock_config_by_private_key(text,text,text,text,text,text,text,text,text,text,text,text,jsonb) to anon, authenticated;

-- get_all_by_private_key tidak perlu diubah: ia me-return row_to_json(mobile_dock_configs)
-- sehingga kolom layout_json otomatis ikut terkirim sebagai mobile_dock_config.layout_json.
