-- ============================================
-- Migration: mapping event Widget -> action Streamer.bot
-- Satu baris per user (JSONB), dibaca dock (eksekutor) + halaman /integrations (manager)
-- Jalankan di Supabase SQL Editor
-- ============================================

alter table if exists public.integration_settings
  add column if not exists widget_sb_map jsonb not null default '{
    "poll_started":   { "enabled": false, "action": "Widget_Poll_Started" },
    "poll_ended":     { "enabled": false, "action": "Widget_Poll_Ended" },
    "task_added":     { "enabled": false, "action": "Widget_Task_Added" },
    "task_done":      { "enabled": false, "action": "Widget_Task_Done" },
    "task_cleared":   { "enabled": false, "action": "Widget_Task_Cleared" },
    "timer_started":  { "enabled": false, "action": "Widget_Timer_Started" },
    "timer_finished": { "enabled": false, "action": "Widget_Timer_Finished" },
    "timer_extended": { "enabled": false, "action": "Widget_Timer_Extended" },
    "song_requested": { "enabled": false, "action": "Widget_Song_Requested" },
    "song_next":      { "enabled": false, "action": "Widget_Song_Next" },
    "chat_pinned":    { "enabled": false, "action": "Widget_Chat_Pinned" },
    "chat_unpinned":  { "enabled": false, "action": "Widget_Chat_Unpinned" }
  }'::jsonb;
