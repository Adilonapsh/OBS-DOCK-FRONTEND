-- ============================================
-- Migration: Mobile Dock config (kredensial + URL tiap panel)
-- Satu baris per user. Dibaca/ditulis halaman /mobile-dock.
-- Jalankan di Supabase Dashboard → SQL Editor → New query → Paste & Run
-- ============================================

create table if not exists public.mobile_dock_configs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  discord_user_id text default '',
  deck_id text default '',
  tiptap_private_key text default '',
  tiptap_alert_widget_id text default '',
  manual_video_id text default '',
  bgm_room text default '',
  deck_url text default '',
  control_url text default '',
  alert_url text default '',
  monitor_url text default '',
  chat_url text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.mobile_dock_configs enable row level security;

drop policy if exists "mobile_dock_owner" on public.mobile_dock_configs;
create policy "mobile_dock_owner" on public.mobile_dock_configs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists trg_mobile_dock_updated on public.mobile_dock_configs;
create trigger trg_mobile_dock_updated
  before update on public.mobile_dock_configs
  for each row execute procedure public.set_updated_at();

-- Upsert via private_key (bypass tanpa login, SECURITY DEFINER)
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
  p_chat_url text
) returns void language plpgsql security definer as $$
declare uid uuid := public.get_user_id_by_private_key(p_key);
begin
  if uid is null then raise exception 'Private key tidak valid'; end if;
  insert into public.mobile_dock_configs (
    user_id, discord_user_id, deck_id, tiptap_private_key, tiptap_alert_widget_id,
    manual_video_id, bgm_room, deck_url, control_url, alert_url, monitor_url, chat_url
  )
  values (
    uid, p_discord, p_deck, p_tiptap_key, p_widget,
    p_manual, p_room, p_deck_url, p_control_url, p_alert_url, p_monitor_url, p_chat_url
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
    updated_at = now();
end;
$$;

grant execute on function public.upsert_mobile_dock_config_by_private_key(text,text,text,text,text,text,text,text,text,text,text,text) to anon, authenticated;

-- Extend get_all_by_private_key agar ikut mengembalikan mobile_dock_config
-- (field lama dipertahankan apa adanya supaya caller lain tidak rusak)
create or replace function public.get_all_by_private_key(p_key text)
returns json language plpgsql security definer as $$
declare
  uid uuid;
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
    'mobile_dock_config', (select row_to_json(m) from public.mobile_dock_configs m where m.user_id = uid),
    'private_key', p_key
  );
end;
$$;

grant execute on function public.get_all_by_private_key(text) to anon, authenticated;
