-- ============================================
-- Migration 027: Songs (Liked + Blacklist) - SATU tabel
-- Satu baris per lagu per akun dengan kolom status:
--   'liked'   = lagu favorit (bisa di-queue)
--   'blocked' = lagu diblokir (request ditolak backend)
-- Satu lagu hanya punya satu status: memblokir lagu yang sudah di-like
-- otomatis memindahkannya ke blacklist, dan sebaliknya.
-- Jalankan di Supabase Dashboard -> SQL Editor
-- ============================================

create table if not exists public.song_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  status text not null default 'liked' check (status in ('liked', 'blocked')),
  url text not null,
  video_id text,
  kind text not null default 'youtube' check (kind in ('youtube', 'audio')),
  title text not null default '',
  channel text,
  thumbnail_url text,
  requested_by text,
  platform text,
  note text not null default '',
  reason text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  liked_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, url)
);

create index if not exists idx_song_entries_user_liked
  on public.song_entries(user_id, status, liked_at desc);

create index if not exists idx_song_entries_user_blocked
  on public.song_entries(user_id, status, created_at desc);

create index if not exists idx_song_entries_video
  on public.song_entries(user_id, video_id);

alter table public.song_entries enable row level security;

drop policy if exists "song_entries_owner" on public.song_entries;
create policy "song_entries_owner" on public.song_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists trg_song_entries_updated on public.song_entries;
create trigger trg_song_entries_updated
  before update on public.song_entries
  for each row execute procedure public.set_updated_at();

-- ============================================
-- RPC Liked Songs (private key / OBS tanpa login)
-- ============================================

create or replace function public.get_liked_songs_by_private_key(p_key text)
returns setof public.song_entries
language sql
stable
security definer
set search_path = public
as $$
  select s.*
  from public.song_entries s
  where s.user_id = public.get_user_id_by_private_key(p_key)
    and s.status = 'liked'
  order by s.liked_at desc;
$$;
grant execute on function public.get_liked_songs_by_private_key(text) to anon, authenticated;

create or replace function public.upsert_liked_song_by_private_key(
  p_key text,
  p_url text,
  p_video_id text default null,
  p_kind text default 'youtube',
  p_title text default '',
  p_channel text default '',
  p_thumbnail text default '',
  p_requested_by text default '',
  p_platform text default '',
  p_note text default '',
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
    requested_by, platform, note, reason, metadata, liked_at
  ) values (
    uid,
    'liked',
    v_url,
    nullif(btrim(coalesce(p_video_id, '')), ''),
    v_kind,
    coalesce(nullif(btrim(p_title), ''), v_url),
    nullif(btrim(coalesce(p_channel, '')), ''),
    nullif(btrim(coalesce(p_thumbnail, '')), ''),
    nullif(btrim(coalesce(p_requested_by, '')), ''),
    nullif(btrim(coalesce(p_platform, '')), ''),
    coalesce(p_note, ''),
    '',
    coalesce(p_metadata, '{}'::jsonb),
    now()
  )
  on conflict (user_id, url) do update set
    status = 'liked',
    video_id = excluded.video_id,
    kind = excluded.kind,
    title = excluded.title,
    channel = excluded.channel,
    thumbnail_url = excluded.thumbnail_url,
    requested_by = coalesce(excluded.requested_by, public.song_entries.requested_by),
    platform = coalesce(excluded.platform, public.song_entries.platform),
    note = case when excluded.note <> '' then excluded.note else public.song_entries.note end,
    reason = '',
    metadata = public.song_entries.metadata || excluded.metadata,
    liked_at = now(),
    updated_at = now()
  returning * into result;

  return result;
end;
$$;
grant execute on function public.upsert_liked_song_by_private_key(
  text, text, text, text, text, text, text, text, text, text, jsonb
) to anon, authenticated;

create or replace function public.update_liked_song_by_private_key(
  p_key text,
  p_id uuid,
  p_title text default null,
  p_note text default null
)
returns public.song_entries
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := public.get_user_id_by_private_key(p_key);
  result public.song_entries;
begin
  if uid is null then
    raise exception 'Private key tidak valid';
  end if;

  update public.song_entries
  set
    title = coalesce(nullif(btrim(p_title), ''), title),
    note = coalesce(p_note, note),
    updated_at = now()
  where id = p_id and user_id = uid and status = 'liked'
  returning * into result;

  if result.id is null then
    raise exception 'Lagu tidak ditemukan';
  end if;

  return result;
end;
$$;
grant execute on function public.update_liked_song_by_private_key(text, uuid, text, text)
  to anon, authenticated;

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

  delete from public.song_entries
  where id = p_id and user_id = uid and status = 'liked';
end;
$$;
grant execute on function public.delete_liked_song_by_private_key(text, uuid)
  to anon, authenticated;

-- ============================================
-- RPC Blacklist Song (private key / OBS tanpa login)
-- ============================================

create or replace function public.get_song_blacklist_by_private_key(p_key text)
returns setof public.song_entries
language sql
stable
security definer
set search_path = public
as $$
  select b.*
  from public.song_entries b
  where b.user_id = public.get_user_id_by_private_key(p_key)
    and b.status = 'blocked'
  order by b.created_at desc;
$$;
grant execute on function public.get_song_blacklist_by_private_key(text) to anon, authenticated;

create or replace function public.upsert_song_blacklist_by_private_key(
  p_key text,
  p_url text,
  p_video_id text default null,
  p_title text default '',
  p_channel text default '',
  p_thumbnail text default '',
  p_reason text default '',
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
  v_video text := nullif(btrim(coalesce(p_video_id, '')), '');
begin
  if uid is null then
    raise exception 'Private key tidak valid';
  end if;
  if v_url = '' then
    raise exception 'URL tidak valid';
  end if;

  insert into public.song_entries (
    user_id, status, url, video_id, kind, title, channel, thumbnail_url,
    note, reason, metadata, liked_at
  ) values (
    uid,
    'blocked',
    v_url,
    v_video,
    case when v_video is not null then 'youtube' else 'audio' end,
    coalesce(nullif(btrim(p_title), ''), v_url),
    nullif(btrim(coalesce(p_channel, '')), ''),
    nullif(btrim(coalesce(p_thumbnail, '')), ''),
    '',
    coalesce(p_reason, ''),
    coalesce(p_metadata, '{}'::jsonb),
    now()
  )
  on conflict (user_id, url) do update set
    status = 'blocked',
    video_id = excluded.video_id,
    kind = excluded.kind,
    title = excluded.title,
    channel = excluded.channel,
    thumbnail_url = excluded.thumbnail_url,
    reason = excluded.reason,
    metadata = public.song_entries.metadata || excluded.metadata,
    updated_at = now()
  returning * into result;

  return result;
end;
$$;
grant execute on function public.upsert_song_blacklist_by_private_key(
  text, text, text, text, text, text, text, jsonb
) to anon, authenticated;

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

  delete from public.song_entries
  where id = p_id and user_id = uid and status = 'blocked';
end;
$$;
grant execute on function public.delete_song_blacklist_by_private_key(text, uuid)
  to anon, authenticated;

-- Cek cepat dari backend: URL sama ATAU videoId YouTube sama.
create or replace function public.is_song_blacklisted_by_private_key(
  p_key text,
  p_url text,
  p_video_id text default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.song_entries b
    where b.user_id = public.get_user_id_by_private_key(p_key)
      and b.status = 'blocked'
      and (
        b.url = btrim(coalesce(p_url, ''))
        or (
          nullif(btrim(coalesce(p_video_id, '')), '') is not null
          and b.video_id = nullif(btrim(p_video_id), '')
        )
      )
  );
$$;
grant execute on function public.is_song_blacklisted_by_private_key(text, text, text)
  to anon, authenticated;
