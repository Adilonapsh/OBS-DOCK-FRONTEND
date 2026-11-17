-- ============================================
-- Migration 028: Song History (riwayat lagu diputar)
-- Tetap memakai SATU tabel public.song_entries.
-- Riwayat dilacak lewat kolom:
--   played_at  = kapan terakhir lagu diputar
--   play_count = sudah berapa kali diputar
-- Satu URL hanya punya SATU baris (unique user_id, url), jadi lagu yang
-- sudah pernah tercatat tidak akan masuk dua kali - hanya di-update.
-- status baru 'played' = baris yang murni riwayat (belum liked/blocked).
-- Jalankan setelah 027_song_entries.sql di Supabase SQL Editor.
-- ============================================

alter table public.song_entries
  add column if not exists played_at timestamptz,
  add column if not exists play_count integer not null default 0;

create index if not exists idx_song_entries_user_played
  on public.song_entries(user_id, played_at desc);

-- Izinkan status 'played' untuk lagu yang hanya ada di riwayat.
alter table public.song_entries drop constraint if exists song_entries_status_check;
alter table public.song_entries
  add constraint song_entries_status_check
  check (status in ('liked', 'blocked', 'played'));

-- ============================================
-- RPC: catat lagu yang diputar (dipanggil backend)
-- ============================================
create or replace function public.record_song_played_by_private_key(
  p_key text,
  p_url text,
  p_video_id text default null,
  p_kind text default 'youtube',
  p_title text default '',
  p_channel text default '',
  p_thumbnail text default '',
  p_requested_by text default '',
  p_platform text default '',
  p_metadata jsonb default '{}'::jsonb
)
returns public.song_entries
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := public.get_user_id_by_private_key(p_key);
  result public.song_entries;
  v_url text := btrim(coalesce(p_url, ''));
  v_kind text := case lower(coalesce(p_kind, 'youtube')) when 'audio' then 'audio' else 'youtube' end;
begin
  if uid is null then
    raise exception 'Private key tidak valid';
  end if;
  if v_url = '' then
    raise exception 'URL tidak valid';
  end if;

  insert into public.song_entries (
    user_id, status, url, video_id, kind, title, channel, thumbnail_url,
    requested_by, platform, metadata, played_at, play_count
  ) values (
    uid,
    'played',
    v_url,
    nullif(btrim(coalesce(p_video_id, '')), ''),
    v_kind,
    coalesce(nullif(btrim(p_title), ''), v_url),
    nullif(btrim(coalesce(p_channel, '')), ''),
    nullif(btrim(coalesce(p_thumbnail, '')), ''),
    nullif(btrim(coalesce(p_requested_by, '')), ''),
    nullif(btrim(coalesce(p_platform, '')), ''),
    coalesce(p_metadata, '{}'::jsonb),
    now(),
    1
  )
  on conflict (user_id, url) do update set
    -- status liked/blocked yang sudah ada DIPERTAHANKAN.
    video_id = coalesce(excluded.video_id, public.song_entries.video_id),
    kind = excluded.kind,
    title = case when excluded.title <> '' then excluded.title else public.song_entries.title end,
    channel = coalesce(excluded.channel, public.song_entries.channel),
    thumbnail_url = coalesce(excluded.thumbnail_url, public.song_entries.thumbnail_url),
    requested_by = coalesce(excluded.requested_by, public.song_entries.requested_by),
    platform = coalesce(excluded.platform, public.song_entries.platform),
    metadata = public.song_entries.metadata || excluded.metadata,
    played_at = now(),
    play_count = public.song_entries.play_count + 1,
    updated_at = now()
  returning * into result;

  return result;
end;
$$;
grant execute on function public.record_song_played_by_private_key(
  text, text, text, text, text, text, text, text, text, jsonb
) to anon, authenticated;

-- ============================================
-- RPC: baca riwayat
-- ============================================
create or replace function public.get_song_history_by_private_key(
  p_key text,
  p_limit integer default 200
)
returns setof public.song_entries
language sql
stable
security definer
set search_path = public
as $$
  select s.*
  from public.song_entries s
  where s.user_id = public.get_user_id_by_private_key(p_key)
    and s.played_at is not null
  order by s.played_at desc
  limit greatest(1, least(coalesce(p_limit, 200), 500));
$$;
grant execute on function public.get_song_history_by_private_key(text, integer)
  to anon, authenticated;

-- ============================================
-- RPC: hapus satu item riwayat
-- Baris yang juga liked/blocked hanya dikosongkan riwayatnya,
-- supaya tidak ikut terhapus dari Liked/Blacklist.
-- ============================================
create or replace function public.delete_song_history_by_private_key(p_key text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := public.get_user_id_by_private_key(p_key);
begin
  if uid is null then
    raise exception 'Private key tidak valid';
  end if;

  update public.song_entries
  set played_at = null, play_count = 0, updated_at = now()
  where id = p_id and user_id = uid
    and status in ('liked', 'blocked')
    and played_at is not null;

  delete from public.song_entries
  where id = p_id and user_id = uid and status = 'played';
end;
$$;
grant execute on function public.delete_song_history_by_private_key(text, uuid)
  to anon, authenticated;

-- ============================================
-- RPC: hapus semua riwayat
-- ============================================
create or replace function public.clear_song_history_by_private_key(p_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := public.get_user_id_by_private_key(p_key);
begin
  if uid is null then
    raise exception 'Private key tidak valid';
  end if;

  delete from public.song_entries
  where user_id = uid and status = 'played';

  update public.song_entries
  set played_at = null, play_count = 0, updated_at = now()
  where user_id = uid and played_at is not null;
end;
$$;
grant execute on function public.clear_song_history_by_private_key(text)
  to anon, authenticated;

-- ============================================
-- Un-like / unblock: baris yang sudah punya riwayat jangan dihapus,
-- cukup turunkan statusnya jadi 'played' agar riwayat tetap ada.
-- ============================================
create or replace function public.delete_liked_song_by_private_key(p_key text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := public.get_user_id_by_private_key(p_key);
begin
  if uid is null then
    raise exception 'Private key tidak valid';
  end if;

  update public.song_entries
  set status = 'played', updated_at = now()
  where id = p_id and user_id = uid and status = 'liked' and played_at is not null;

  delete from public.song_entries
  where id = p_id and user_id = uid and status = 'liked';
end;
$$;
grant execute on function public.delete_liked_song_by_private_key(text, uuid)
  to anon, authenticated;

create or replace function public.delete_song_blacklist_by_private_key(p_key text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := public.get_user_id_by_private_key(p_key);
begin
  if uid is null then
    raise exception 'Private key tidak valid';
  end if;

  update public.song_entries
  set status = 'played', reason = '', updated_at = now()
  where id = p_id and user_id = uid and status = 'blocked' and played_at is not null;

  delete from public.song_entries
  where id = p_id and user_id = uid and status = 'blocked';
end;
$$;
grant execute on function public.delete_song_blacklist_by_private_key(text, uuid)
  to anon, authenticated;
