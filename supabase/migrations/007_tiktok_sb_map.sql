-- ============================================
-- Migration: mapping event TikTok -> action Streamer.bot
-- Satu baris per user (JSONB), dibaca dock (eksekutor) + halaman /integrations (manager)
-- Jalankan di Supabase SQL Editor
-- ============================================

create table if not exists public.integration_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tiktok_sb_map jsonb not null default '{
    "chat":   { "enabled": false, "action": "TikTok_Chat" },
    "gift":   { "enabled": false, "action": "TikTok_Gift" },
    "like":   { "enabled": false, "action": "TikTok_Like" },
    "follow": { "enabled": false, "action": "TikTok_Follow" },
    "member": { "enabled": false, "action": "TikTok_Member" }
  }'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.integration_settings enable row level security;

drop policy if exists "integration_settings_owner" on public.integration_settings;
create policy "integration_settings_owner" on public.integration_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
