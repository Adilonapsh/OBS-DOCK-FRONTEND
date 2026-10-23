-- ============================================
-- Ketatkan baca profiles ke owner-only.
-- Sebelumnya policy profiles_select_all (USING true) membolehkan SIAPA PUN
-- (termasuk anon bermodal anon key publik) membaca kolom private_key.
-- Semua kode hanya baca baris milik sendiri (eq id = auth.uid), jadi aman.
-- Jalankan di Supabase SQL Editor.
-- ============================================

drop policy if exists "profiles_select_all" on public.profiles;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
