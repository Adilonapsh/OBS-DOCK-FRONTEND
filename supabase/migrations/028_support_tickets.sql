-- ============================================
-- Migration: 028_support_tickets
-- Form support / bug report dari halaman /support.
--
-- - Semua orang (termasuk guest di landing page) boleh MENGIRIM tiket.
-- - Hanya admin yang boleh melihat & mengubah status tiket.
-- - User login hanya bisa melihat tiket miliknya sendiri (opsional).
--
-- Jalankan di Supabase Dashboard → SQL Editor.
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

-- Trigger updated_at (fungsi set_updated_at sudah dibuat di migration 014)
drop trigger if exists trg_support_tickets_updated on public.support_tickets;
create trigger trg_support_tickets_updated
  before update on public.support_tickets
  for each row execute procedure public.set_updated_at();

-- 1. Siapa pun boleh mengirim tiket (dengan batas panjang sederhana).
drop policy if exists "support_tickets_insert_public" on public.support_tickets;
create policy "support_tickets_insert_public" on public.support_tickets
  for insert
  to anon, authenticated
  with check (
    char_length(btrim(name)) between 0 and 120
    and char_length(btrim(email)) between 3 and 200
    and char_length(btrim(subject)) between 3 and 200
    and char_length(btrim(message)) between 10 and 5000
  );

-- 2. Admin boleh membaca semua tiket.
drop policy if exists "support_tickets_admin_select" on public.support_tickets;
create policy "support_tickets_admin_select" on public.support_tickets
  for select
  to authenticated
  using (public.is_admin());

-- 3. Admin boleh mengubah status tiket.
drop policy if exists "support_tickets_admin_update" on public.support_tickets;
create policy "support_tickets_admin_update" on public.support_tickets
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 4. User login boleh melihat tiket miliknya sendiri.
drop policy if exists "support_tickets_owner_select" on public.support_tickets;
create policy "support_tickets_owner_select" on public.support_tickets
  for select
  to authenticated
  using (auth.uid() = user_id);

grant insert on public.support_tickets to anon, authenticated;
grant select, update on public.support_tickets to authenticated;
