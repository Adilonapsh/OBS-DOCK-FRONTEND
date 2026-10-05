-- ============================================
-- Migration: 014_highlights - Sorotan 7 hari terakhir
-- TikTok live terbaru + StreamerBot (YouTube/Twitch/Kick)
-- Tabel highlights per user + RLS + RPC private_key bypass
-- Jalankan di Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Tabel highlights (idempotent)
create table if not exists public.highlights (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  platform text not null check (platform in ('tiktok','youtube','twitch','kick','facebook','instagram','trovo','other')),
  title text not null default '',
  thumbnail_url text,
  video_url text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds int,
  viewers int default 0,
  source text not null default 'streamerbot' check (source in ('tiktok_live','streamerbot','manual')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_highlights_user on public.highlights(user_id);
create index if not exists idx_highlights_platform on public.highlights(platform);
create index if not exists idx_highlights_started on public.highlights(started_at desc);
create index if not exists idx_highlights_user_started on public.highlights(user_id, started_at desc);

-- 2. RLS
alter table public.highlights enable row level security;
drop policy if exists "highlights_owner" on public.highlights;
create policy "highlights_owner" on public.highlights for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. updated_at trigger (reuse set_updated_at())
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_highlights_updated on public.highlights;
create trigger trg_highlights_updated before update on public.highlights for each row execute procedure public.set_updated_at();

-- 4. Helper sudah ada di 003: get_user_id_by_private_key(p_key text)
--    Pastikan ada (idempotent fallback)
create or replace function public.get_user_id_by_private_key(p_key text)
returns uuid language sql security definer as $$
  select id from public.profiles where private_key = p_key
  union
  select user_id from public.user_private_keys where private_key = p_key
  limit 1;
$$;
grant execute on function public.get_user_id_by_private_key(text) to anon, authenticated;

-- 5. RPC: ambil highlights 7 hari via private_key (bypass RLS, SECURITY DEFINER)
create or replace function public.get_highlights_by_private_key(p_key text, p_days int default 7)
returns setof public.highlights language sql security definer as $$
  select h.* from public.highlights h
  where h.user_id = public.get_user_id_by_private_key(p_key)
    and h.started_at >= now() - (p_days || ' days')::interval
  order by h.started_at desc
  limit 50;
$$;
grant execute on function public.get_highlights_by_private_key(text, int) to anon, authenticated;

-- 6. RPC: simpan highlight via private_key
create or replace function public.upsert_highlight_by_private_key(
  p_key text, p_platform text, p_title text, p_thumbnail text, p_video text,
  p_started timestamptz, p_source text, p_metadata jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer as $$
declare uid uuid; nid uuid;
begin
  uid := public.get_user_id_by_private_key(p_key);
  if uid is null then raise exception 'Private key tidak valid'; end if;
  insert into public.highlights (user_id, platform, title, thumbnail_url, video_url, started_at, source, metadata)
  values (uid, p_platform, p_title, p_thumbnail, p_video, coalesce(p_started, now()), p_source, coalesce(p_metadata,'{}'::jsonb))
  returning id into nid;
  return nid;
end;
$$;
grant execute on function public.upsert_highlight_by_private_key(text, text, text, text, text, timestamptz, text, jsonb) to anon, authenticated;

-- 7. Optional: perluas get_all_by_private_key agar dashboard bisa prefetch highlights ringkas
create or replace function public.get_all_by_private_key(p_key text)
returns json language plpgsql security definer as $$
declare
  uid uuid;
begin
  uid := public.get_user_id_by_private_key(p_key);
  if uid is null then
    return json_build_object('error', 'Private key tidak valid');
  end if;
  return json_build_object(
    'user_id', uid,
    'profile', (select row_to_json(p) from public.profiles p where p.id = uid),
    'obs_config', (select row_to_json(o) from public.obs_configs o where o.user_id = uid),
    'tiktok_config', (select row_to_json(t) from public.tiktok_configs t where t.user_id = uid),
    'streamerbot_config', (select row_to_json(s) from public.streamerbot_configs s where s.user_id = uid),
    'dashboard_layout', (select row_to_json(d) from public.dashboard_layouts d where d.user_id = uid),
    'briefing', (select row_to_json(b) from public.stream_briefings b where b.user_id = uid order by updated_at desc limit 1),
    'highlights', (select coalesce(json_agg(row_to_json(h) order by h.started_at desc), '[]'::json) from (select * from public.highlights where user_id = uid and started_at >= now() - interval '7 days' order by started_at desc limit 20) h),
    'private_key', p_key
  );
end;
$$;
grant execute on function public.get_all_by_private_key(text) to anon, authenticated;
