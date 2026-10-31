-- Hyperate config: channel_id (hr:99c877) + token_url (wss://...?token=xxx)
create table if not exists public.hyperate_configs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  channel_id text default '',
  token_url text default '',
  -- alias untuk kompatibilitas lama
  hyperate_id text default '',
  auto_connect boolean default true,
  updated_at timestamptz default now()
);

alter table public.hyperate_configs enable row level security;
drop policy if exists "hyperate_owner" on public.hyperate_configs;
create policy "hyperate_owner" on public.hyperate_configs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists trg_hyperate_updated on public.hyperate_configs;
create trigger trg_hyperate_updated before update on public.hyperate_configs for each row execute procedure public.set_updated_at();

-- update get_all_by_private_key agar return hyperate_config (untuk Connection & widget)
create or replace function public.get_all_by_private_key(p_key text)
returns json language plpgsql security definer as $$
declare uid uuid;
begin
  uid := public.get_user_id_by_private_key(p_key);
  if uid is null then return json_build_object('error', 'Private key tidak valid'); end if;
  return json_build_object(
    'user_id', uid,
    'profile', (select row_to_json(p) from public.profiles p where p.id = uid),
    'obs_config', (select row_to_json(o) from public.obs_configs o where o.user_id = uid),
    'tiktok_config', (select row_to_json(t) from public.tiktok_configs t where t.user_id = uid),
    'streamerbot_config', (select row_to_json(s) from public.streamerbot_configs s where s.user_id = uid),
    'hyperate_config', (select row_to_json(h) from public.hyperate_configs h where h.user_id = uid),
    'dashboard_layout', (select row_to_json(d) from public.dashboard_layouts d where d.user_id = uid),
    'briefing', (select row_to_json(b) from public.stream_briefings b where b.user_id = uid order by updated_at desc limit 1),
    'private_key', p_key
  );
end;
$$;
grant execute on function public.get_all_by_private_key(text) to anon, authenticated;

-- upsert via private_key (dipakai Connection page saat tanpa login)
create or replace function public.upsert_hyperate_config_by_private_key(
  p_key text, p_channel text, p_token text, p_auto boolean
) returns void language plpgsql security definer as $$
declare uid uuid := public.get_user_id_by_private_key(p_key);
begin
  if uid is null then raise exception 'Private key tidak valid'; end if;
  insert into public.hyperate_configs (user_id, channel_id, token_url, hyperate_id, auto_connect)
  values (uid, p_channel, p_token, p_channel, p_auto)
  on conflict (user_id) do update set channel_id=excluded.channel_id, token_url=excluded.token_url, hyperate_id=excluded.hyperate_id, auto_connect=excluded.auto_connect, updated_at=now();
end;
$$;
grant execute on function public.upsert_hyperate_config_by_private_key(text,text,text,boolean) to anon, authenticated;

-- fetch khusus (dipakai display jika butuh)
create or replace function public.get_hyperate_by_private_key(p_key text)
returns json language plpgsql security definer as $$
declare uid uuid := public.get_user_id_by_private_key(p_key);
begin
  if uid is null then return null; end if;
  return (select row_to_json(h) from public.hyperate_configs h where h.user_id = uid);
end;
$$;
grant execute on function public.get_hyperate_by_private_key(text) to anon, authenticated;

-- kompatibilitas: alias p_id/p_token lama (Connection versi awal kirim p_id)
create or replace function public.upsert_hyperate_config_by_private_key(
  p_key text, p_id text, p_auto boolean
) returns void language plpgsql security definer as $$
declare uid uuid := public.get_user_id_by_private_key(p_key);
begin
  if uid is null then raise exception 'Private key tidak valid'; end if;
  insert into public.hyperate_configs (user_id, channel_id, hyperate_id, auto_connect)
  values (uid, p_id, p_id, p_auto)
  on conflict (user_id) do update set channel_id=excluded.channel_id, hyperate_id=excluded.hyperate_id, auto_connect=excluded.auto_connect, updated_at=now();
end;
$$;
-- grant sudah di atas, overload tetap perlu grant
grant execute on function public.upsert_hyperate_config_by_private_key(text,text,boolean) to anon, authenticated;
