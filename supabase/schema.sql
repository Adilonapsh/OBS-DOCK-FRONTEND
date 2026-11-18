-- ============================================
-- Keluno - Supabase Database Schema
-- Jalankan di Supabase Dashboard → SQL Editor → New query → Paste & Run
-- Project: https://tdsbidgbhltmjjdrdkla.supabase.co
-- ============================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. PROFILES (1:1 dengan auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  email text,
  avatar_url text,
  private_key text unique default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_private_keys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  private_key text unique not null default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into public.user_private_keys (user_id, private_key)
select id, private_key
from public.profiles
where private_key is not null
on conflict (user_id) do nothing;

-- auto-create profile saat signUp with the same key in both key stores.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Jangan pakai gen_random_bytes() di sini: pgcrypto ada di schema
  -- `extensions` sedangkan fungsi ini dijalankan dengan
  -- search_path = public, pg_temp (lihat migrations/029).
  v_private_key text := replace(gen_random_uuid()::text, '-', '')
                     || replace(gen_random_uuid()::text, '-', '');
begin
  insert into public.profiles (id, username, email, avatar_url, private_key)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    v_private_key
  );

  insert into public.user_private_keys (user_id, private_key)
  values (new.id, v_private_key);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. STREAM BRIEFINGS (migrasi dari localStorage streamBriefing)
create table if not exists public.stream_briefings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text default '',
  goal text default '',
  notes text default '',
  outline jsonb default '[]'::jsonb, -- [{text, checked}]
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_briefings_user on public.stream_briefings(user_id);

-- 4. CHAT MESSAGES (opsional: persist Live Stream Chat, bisa juga tetap di memory)
create table if not exists public.chat_messages (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  platform text check (platform in ('twitch','youtube','tiktok','kick')) not null,
  username text not null,
  message text not null,
  avatar_url text,
  emotes jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_chat_created on public.chat_messages(created_at desc);
create index if not exists idx_chat_platform on public.chat_messages(platform);

-- 5. ACTIVITY LOGS (join, like → Aktivitas Terbaru)
create table if not exists public.activity_logs (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  platform text not null,
  text text not null, -- "👋 Rizky telah bergabung"
  created_at timestamptz default now()
);
create index if not exists idx_activity_created on public.activity_logs(created_at desc);

-- 6. GIFT LOGS (TikTok gift, Twitch cheer/sub, YouTube SuperChat → Gift & Superchat)
create table if not exists public.gift_logs (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  platform text not null,
  sender text not null,
  gift_name text,
  amount text, -- "500" / "Rp 10.000" / "Tier 1"
  count int default 1,
  avatar_url text,
  created_at timestamptz default now()
);
create index if not exists idx_gift_created on public.gift_logs(created_at desc);
create index if not exists idx_gift_platform on public.gift_logs(platform);

-- 7. OBS CONFIG (ganti localStorage obs-config)
create table if not exists public.obs_configs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  address text default '127.0.0.1',
  port text default '4455',
  password text default '',
  auto_connect boolean default true,
  updated_at timestamptz default now()
);

-- 8. TIKTOK CONFIG
create table if not exists public.tiktok_configs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text default '',
  auto_connect boolean default false,
  updated_at timestamptz default now()
);

-- 9. STREAMER.BOT CONFIG
create table if not exists public.streamerbot_configs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  address text default '127.0.0.1',
  port text default '8080',
  endpoint text default 'streamerbot',
  password text default '',
  auto_connect boolean default true,
  updated_at timestamptz default now()
);

-- 10. DASHBOARD LAYOUT (section-visible)
create table if not exists public.dashboard_layouts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  streaming boolean default true,
  activity boolean default true,
  gift boolean default true,
  chat boolean default true,
  card_yt boolean default true,
  card_tw boolean default false,
  card_tt boolean default true,
  updated_at timestamptz default now()
);

-- 11. HIGHLIGHTS (Sorotan 7 hari - TikTok live terbaru + StreamerBot YouTube/Twitch/Kick)
create table if not exists public.highlights (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  platform text not null check (platform in ('tiktok','youtube','twitch','kick','facebook','instagram','other')),
  title text not null default '',
  thumbnail_url text,
  video_url text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds int,
  viewers int default 0,
  source text not null default 'streamerbot' check (source in ('tiktok_live','streamerbot','manual')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_highlights_user on public.highlights(user_id);
create index if not exists idx_highlights_platform on public.highlights(platform);
create index if not exists idx_highlights_started on public.highlights(started_at desc);
create index if not exists idx_highlights_user_started on public.highlights(user_id, started_at desc);

-- ============================================
-- RLS (Row Level Security) - aktif + policy per user
-- ============================================
alter table public.profiles enable row level security;
alter table public.user_private_keys enable row level security;
alter table public.stream_briefings enable row level security;
alter table public.chat_messages enable row level security;
alter table public.activity_logs enable row level security;
alter table public.gift_logs enable row level security;
alter table public.obs_configs enable row level security;
alter table public.tiktok_configs enable row level security;
alter table public.streamerbot_configs enable row level security;
alter table public.dashboard_layouts enable row level security;
alter table public.highlights enable row level security;

-- profiles: read/update/insert milik sendiri (JANGAN using(true):
-- kolom private_key tidak boleh terbaca publik via anon key)
drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "private_keys_owner" on public.user_private_keys;
create policy "private_keys_owner" on public.user_private_keys
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- briefings: hanya owner
drop policy if exists "briefings_owner" on public.stream_briefings;
create policy "briefings_owner" on public.stream_briefings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- chat/activity/gift: authenticated read, insert milik sendiri (user_id boleh null untuk guest)
drop policy if exists "chat_select_auth" on public.chat_messages;
create policy "chat_select_auth" on public.chat_messages for select using (auth.role() = 'authenticated');
drop policy if exists "chat_insert_auth" on public.chat_messages;
create policy "chat_insert_auth" on public.chat_messages for insert with check (auth.role() = 'authenticated');

drop policy if exists "activity_select_auth" on public.activity_logs;
create policy "activity_select_auth" on public.activity_logs for select using (auth.role() = 'authenticated');
drop policy if exists "activity_insert_auth" on public.activity_logs;
create policy "activity_insert_auth" on public.activity_logs for insert with check (auth.role() = 'authenticated');

drop policy if exists "gift_select_auth" on public.gift_logs;
create policy "gift_select_auth" on public.gift_logs for select using (auth.role() = 'authenticated');
drop policy if exists "gift_insert_auth" on public.gift_logs;
create policy "gift_insert_auth" on public.gift_logs for insert with check (auth.role() = 'authenticated');

-- configs: hanya owner
drop policy if exists "obs_owner" on public.obs_configs;
create policy "obs_owner" on public.obs_configs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "tiktok_owner" on public.tiktok_configs;
create policy "tiktok_owner" on public.tiktok_configs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "sbot_owner" on public.streamerbot_configs;
create policy "sbot_owner" on public.streamerbot_configs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "layout_owner" on public.dashboard_layouts;
create policy "layout_owner" on public.dashboard_layouts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "highlights_owner" on public.highlights;
create policy "highlights_owner" on public.highlights for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================
-- UPDATED_AT trigger
-- ============================================
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles for each row execute procedure public.set_updated_at();
drop trigger if exists trg_briefings_updated on public.stream_briefings;
create trigger trg_briefings_updated before update on public.stream_briefings for each row execute procedure public.set_updated_at();
drop trigger if exists trg_obs_updated on public.obs_configs;
create trigger trg_obs_updated before update on public.obs_configs for each row execute procedure public.set_updated_at();
drop trigger if exists trg_tiktok_updated on public.tiktok_configs;
create trigger trg_tiktok_updated before update on public.tiktok_configs for each row execute procedure public.set_updated_at();
drop trigger if exists trg_sbot_updated on public.streamerbot_configs;
create trigger trg_sbot_updated before update on public.streamerbot_configs for each row execute procedure public.set_updated_at();
drop trigger if exists trg_layout_updated on public.dashboard_layouts;
create trigger trg_layout_updated before update on public.dashboard_layouts for each row execute procedure public.set_updated_at();
drop trigger if exists trg_highlights_updated on public.highlights;
create trigger trg_highlights_updated before update on public.highlights for each row execute procedure public.set_updated_at();

-- ============================================
-- HIGHLIGHTS RPC (private_key bypass) - untuk dashboard 7 hari
-- ============================================
create or replace function public.get_highlights_by_private_key(p_key text, p_days int default 7)
returns setof public.highlights language sql security definer as $$
  select h.* from public.highlights h
  where h.user_id = public.get_user_id_by_private_key(p_key)
    and h.started_at >= now() - (p_days || ' days')::interval
  order by h.started_at desc
  limit 50;
$$;
grant execute on function public.get_highlights_by_private_key(text, int) to anon, authenticated;

create or replace function public.upsert_highlight_by_private_key(
  p_key text, p_platform text, p_title text, p_thumbnail text, p_video text,
  p_started timestamptz, p_source text, p_metadata jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer as $$
declare uid uuid; nid uuid;
begin
  uid := public.get_user_id_by_private_key(p_key);
  if uid is null then raise exception 'Private key tidak valid'; end if;
  insert into public.highlights (user_id, platform, title, thumbnail_url, video_url, started_at, source, metadata)
  values (uid, p_platform, p_title, p_thumbnail, p_video, coalesce(p_started, now()), p_source, coalesce(p_metadata,'{}'::jsonb))
  returning id into nid;
  return nid;
end;
$$;
grant execute on function public.upsert_highlight_by_private_key(text, text, text, text, text, timestamptz, text, jsonb) to anon, authenticated;

-- Update judul highlight hari ini (dipakai saat judul asli roomInfo TikTok tiba)
create or replace function public.update_highlight_title_by_private_key(
  p_key text,
  p_platform text,
  p_title text,
  p_since timestamptz,
  p_metadata jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer as $$
declare
  uid uuid;
  nid uuid;
begin
  uid := public.get_user_id_by_private_key(p_key);
  if uid is null then
    raise exception 'Private key tidak valid';
  end if;

  if coalesce(trim(p_title), '') = '' then
    return null;
  end if;

  update public.highlights h
     set title = p_title,
         metadata = coalesce(h.metadata, '{}'::jsonb) || coalesce(p_metadata, '{}'::jsonb)
   where h.id = (
     select h2.id
       from public.highlights h2
      where h2.user_id = uid
        and h2.platform = p_platform
        and h2.started_at >= coalesce(p_since, now() - interval '1 day')
      order by h2.started_at desc
      limit 1
   )
  returning h.id into nid;

  return nid;
end;
$$;
grant execute on function public.update_highlight_title_by_private_key(text, text, text, timestamptz, jsonb) to anon, authenticated;

-- Update jumlah penonton (views) highlight hari ini - menyimpan nilai tertinggi
create or replace function public.update_highlight_viewers_by_private_key(
  p_key text,
  p_platform text,
  p_viewers int,
  p_since timestamptz
) returns uuid language plpgsql security definer as $$
declare
  uid uuid;
  nid uuid;
begin
  uid := public.get_user_id_by_private_key(p_key);
  if uid is null then
    raise exception 'Private key tidak valid';
  end if;

  if coalesce(p_viewers, 0) <= 0 then
    return null;
  end if;

  update public.highlights h
     set viewers = greatest(coalesce(h.viewers, 0), p_viewers)
   where h.id = (
     select h2.id
       from public.highlights h2
      where h2.user_id = uid
        and h2.platform = p_platform
        and h2.started_at >= coalesce(p_since, now() - interval '1 day')
      order by h2.started_at desc
      limit 1
   )
  returning h.id into nid;

  return nid;
end;
$$;

grant execute on function public.update_highlight_viewers_by_private_key(text, text, int, timestamptz) to anon, authenticated;

-- ============================================
-- Support tickets / bug report
-- ============================================
create table if not exists public.support_tickets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null default '',
  email text not null default '',
  category text not null default 'bug'
    check (category in ('bug', 'account', 'widget', 'integration', 'feature', 'other')),
  subject text not null default '',
  message text not null default '',
  page_url text,
  user_agent text,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_support_tickets_created on public.support_tickets(created_at desc);
create index if not exists idx_support_tickets_status on public.support_tickets(status);
create index if not exists idx_support_tickets_user on public.support_tickets(user_id);

alter table public.support_tickets enable row level security;

drop trigger if exists trg_support_tickets_updated on public.support_tickets;
create trigger trg_support_tickets_updated
  before update on public.support_tickets
  for each row execute procedure public.set_updated_at();

drop policy if exists "support_tickets_insert_public" on public.support_tickets;
create policy "support_tickets_insert_public" on public.support_tickets
  for insert to anon, authenticated
  with check (
    char_length(btrim(name)) between 0 and 120
    and char_length(btrim(email)) between 3 and 200
    and char_length(btrim(subject)) between 3 and 200
    and char_length(btrim(message)) between 10 and 5000
  );

drop policy if exists "support_tickets_admin_select" on public.support_tickets;
create policy "support_tickets_admin_select" on public.support_tickets
  for select to authenticated using (public.is_admin());

drop policy if exists "support_tickets_admin_update" on public.support_tickets;
create policy "support_tickets_admin_update" on public.support_tickets
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "support_tickets_owner_select" on public.support_tickets;
create policy "support_tickets_owner_select" on public.support_tickets
  for select to authenticated using (auth.uid() = user_id);

grant insert on public.support_tickets to anon, authenticated;
grant select, update on public.support_tickets to authenticated;

-- ============================================
-- Support tickets hardening (rate limit + anti-bypass)
-- ============================================
alter table public.support_tickets add column if not exists ip_hash text;

create index if not exists idx_support_tickets_ip_created on public.support_tickets(ip_hash, created_at desc);
create index if not exists idx_support_tickets_email_created on public.support_tickets(lower(email), created_at desc);
create index if not exists idx_support_tickets_user_created on public.support_tickets(user_id, created_at desc);

drop policy if exists "support_tickets_insert_public" on public.support_tickets;
revoke insert on public.support_tickets from anon, authenticated;

create or replace function public.submit_support_ticket(
  p_name text,
  p_email text,
  p_category text,
  p_subject text,
  p_message text,
  p_page_url text default null,
  p_user_agent text default null,
  p_honeypot text default '',
  p_elapsed_ms int default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_ip text;
  v_ip_hash text;
  v_name text := btrim(coalesce(p_name, ''));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_category text := lower(btrim(coalesce(p_category, 'other')));
  v_subject text := btrim(coalesce(p_subject, ''));
  v_message text := btrim(coalesce(p_message, ''));
  v_id uuid;
  v_count int;
  v_headers jsonb;
begin
  if coalesce(btrim(p_honeypot), '') <> '' then
    return null;
  end if;

  if p_elapsed_ms is not null and p_elapsed_ms >= 0 and p_elapsed_ms < 1200 then
    raise exception 'TOO_FAST';
  end if;

  if v_email = '' or v_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'INVALID_EMAIL';
  end if;
  if char_length(v_name) > 120 then raise exception 'INVALID_NAME'; end if;
  if char_length(v_email) > 200 then raise exception 'INVALID_EMAIL'; end if;
  if char_length(v_subject) < 3 or char_length(v_subject) > 200 then raise exception 'INVALID_SUBJECT'; end if;
  if char_length(v_message) < 10 or char_length(v_message) > 5000 then raise exception 'INVALID_MESSAGE'; end if;

  if v_category not in ('bug', 'account', 'widget', 'integration', 'feature', 'other') then
    v_category := 'other';
  end if;

  begin
    v_headers := coalesce(current_setting('request.headers', true), '{}')::jsonb;
  exception when others then
    v_headers := '{}'::jsonb;
  end;
  v_ip := coalesce(
    nullif(btrim(v_headers->>'cf-connecting-ip'), ''),
    nullif(btrim(v_headers->>'x-real-ip'), ''),
    nullif(btrim(split_part(coalesce(v_headers->>'x-forwarded-for', ''), ',', 1)), ''),
    'unknown'
  );
  v_ip_hash := md5(v_ip);

  select count(*) into v_count from public.support_tickets t
   where t.subject = v_subject and t.message = v_message
     and t.created_at > now() - interval '10 minutes';
  if v_count > 0 then raise exception 'DUPLICATE_TICKET'; end if;

  select count(*) into v_count from public.support_tickets t
   where t.ip_hash = v_ip_hash and t.created_at > now() - interval '10 minutes';
  if v_count >= 3 then raise exception 'RATE_LIMIT_IP'; end if;

  select count(*) into v_count from public.support_tickets t
   where t.ip_hash = v_ip_hash and t.created_at > now() - interval '1 hour';
  if v_count >= 10 then raise exception 'RATE_LIMIT_IP'; end if;

  select count(*) into v_count from public.support_tickets t
   where t.ip_hash = v_ip_hash and t.created_at > now() - interval '1 day';
  if v_count >= 25 then raise exception 'RATE_LIMIT_IP'; end if;

  select count(*) into v_count from public.support_tickets t
   where lower(t.email) = v_email and t.created_at > now() - interval '1 hour';
  if v_count >= 5 then raise exception 'RATE_LIMIT_EMAIL'; end if;

  select count(*) into v_count from public.support_tickets t
   where lower(t.email) = v_email and t.created_at > now() - interval '1 day';
  if v_count >= 15 then raise exception 'RATE_LIMIT_EMAIL'; end if;

  if v_uid is not null then
    select count(*) into v_count from public.support_tickets t
     where t.user_id = v_uid and t.created_at > now() - interval '1 hour';
    if v_count >= 10 then raise exception 'RATE_LIMIT_USER'; end if;
  end if;

  select count(*) into v_count from public.support_tickets t
   where t.created_at > now() - interval '10 minutes';
  if v_count >= 200 then raise exception 'RATE_LIMIT_GLOBAL'; end if;

  insert into public.support_tickets (
    user_id, name, email, category, subject, message, page_url, user_agent, ip_hash, status
  ) values (
    v_uid, v_name, v_email, v_category, v_subject, v_message,
    left(coalesce(p_page_url, ''), 500), left(coalesce(p_user_agent, ''), 500), v_ip_hash, 'open'
  ) returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_support_ticket(text, text, text, text, text, text, text, text, int) from public;
grant execute on function public.submit_support_ticket(text, text, text, text, text, text, text, text, int) to anon, authenticated;
