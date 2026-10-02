-- ============================================
-- Migration: tambah event Timer Reduced ke default widget_sb_map
-- Menggabungkan key baru tanpa menimpa mapping milik user yang sudah ada.
-- Jalankan di Supabase SQL Editor
-- ============================================

update public.integration_settings
set widget_sb_map = coalesce(widget_sb_map, '{}'::jsonb)
  || '{"timer_reduced": { "enabled": false, "action": "Widget_Timer_Reduced", "params": {} }}'::jsonb,
  updated_at = now()
where not (widget_sb_map ? 'timer_reduced');

alter table if exists public.integration_settings
  alter column widget_sb_map set default '{
    "poll_started":   { "enabled": false, "action": "Widget_Poll_Started", "params": {} },
    "poll_ended":     { "enabled": false, "action": "Widget_Poll_Ended", "params": {} },
    "task_added":     { "enabled": false, "action": "Widget_Task_Added", "params": {} },
    "task_done":      { "enabled": false, "action": "Widget_Task_Done", "params": {} },
    "task_cleared":   { "enabled": false, "action": "Widget_Task_Cleared", "params": {} },
    "timer_started":  { "enabled": false, "action": "Widget_Timer_Started", "params": {} },
    "timer_finished": { "enabled": false, "action": "Widget_Timer_Finished", "params": {} },
    "timer_extended": { "enabled": false, "action": "Widget_Timer_Extended", "params": {} },
    "timer_reduced":  { "enabled": false, "action": "Widget_Timer_Reduced", "params": {} },
    "song_requested": { "enabled": false, "action": "Widget_Song_Requested", "params": {} },
    "song_next":      { "enabled": false, "action": "Widget_Song_Next", "params": {} },
    "chat_pinned":    { "enabled": false, "action": "Widget_Chat_Pinned", "params": {} },
    "chat_unpinned":  { "enabled": false, "action": "Widget_Chat_Unpinned", "params": {} }
  }'::jsonb;
