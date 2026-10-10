-- ============================================
-- Migration: Donation webhook integration
-- Simpan per-platform token + enabled + future widget actions
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Tambah kolom donation_configs di integration_settings (JSONB map per platform)
-- Bentuk: { "saweria": {enabled, token}, "tiptap": {...}, ... }
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='integration_settings' and column_name='donation_configs'
  ) then
    alter table public.integration_settings
      add column donation_configs jsonb not null default '{}'::jsonb;
  end if;
end $$;

-- Alternatif: table terpisah untuk history donasi (optional persist)
create table if not exists public.donation_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  platform text not null check (platform in ('saweria','tiptap','trakteer','bagibagi','socialbuzz','tako','sibagi','generic')),
  donor_name text not null default 'Donatur',
  amount integer not null default 0,
  message text default '',
  transaction_id text,
  raw jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_donation_user on public.donation_logs(user_id);
create index if not exists idx_donation_platform on public.donation_logs(platform);
create index if not exists idx_donation_created on public.donation_logs(created_at desc);

alter table public.donation_logs enable row level security;
drop policy if exists "donation_owner" on public.donation_logs;
create policy "donation_owner" on public.donation_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- RPC bypass privateKey (konsisten dengan highlight/tiktok)
create or replace function public.get_user_id_by_private_key(p_key text)
returns uuid language sql security definer as $$
  select id from public.profiles where private_key = p_key limit 1;
$$;
grant execute on function public.get_user_id_by_private_key(text) to anon, authenticated;
