-- ============================================
-- Migration: mapping event Donasi -> action Streamer.bot
-- Satu baris per user (JSONB), dibaca dock (eksekutor) + halaman /integrations (manager)
-- Jalankan di Supabase SQL Editor
-- ============================================

alter table if exists public.integration_settings
  add column if not exists donation_sb_map jsonb not null default '{
    "donation": { "enabled": false, "action": "Donation_Received" }
  }'::jsonb;
