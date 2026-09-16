-- ============================================
-- OBS Overlays - Supabase Database Schema
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

-- auto-create profile saat signUp (private_key auto-generated, tahan banting)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  begin
    insert into public.profiles (id, username, email, avatar_url, private_key)
    values (
      new.id,
      new.raw_user_meta_data->>'username',
      new.email,
      new.raw_user_meta_data->>'avatar_url',
      encode(gen_random_bytes(32), 'hex')
    );
  exception
    when undefined_column then
      insert into public.profiles (id, username, email, avatar_url)
      values (new.id, new.raw_user_meta_data->>'username', new.email, new.raw_user_meta_data->>'avatar_url');
    when others then
      raise warning 'handle_new_user failed: %', SQLERRM;
  end;
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

-- ============================================
-- RLS (Row Level Security) - aktif + policy per user
-- ============================================
alter table public.profiles enable row level security;
alter table public.stream_briefings enable row level security;
alter table public.chat_messages enable row level security;
alter table public.activity_logs enable row level security;
alter table public.gift_logs enable row level security;
alter table public.obs_configs enable row level security;
alter table public.tiktok_configs enable row level security;
alter table public.streamerbot_configs enable row level security;
alter table public.dashboard_layouts enable row level security;

-- profiles: read/update/insert milik sendiri (JANGAN using(true):
-- kolom private_key tidak boleh terbaca publik via anon key)
drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

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
