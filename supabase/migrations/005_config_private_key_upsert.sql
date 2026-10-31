-- Upsert config via private_key (bypass tanpa login)
create or replace function public.upsert_obs_config_by_private_key(
  p_key text, p_address text, p_port text, p_password text, p_auto boolean
) returns void language plpgsql security definer as $$
declare uid uuid := public.get_user_id_by_private_key(p_key);
begin
  if uid is null then raise exception 'Private key tidak valid'; end if;
  insert into public.obs_configs (user_id, address, port, password, auto_connect)
  values (uid, p_address, p_port, p_password, p_auto)
  on conflict (user_id) do update set address=excluded.address, port=excluded.port, password=excluded.password, auto_connect=excluded.auto_connect, updated_at=now();
end;
$$;
grant execute on function public.upsert_obs_config_by_private_key(text,text,text,text,boolean) to anon, authenticated;

create or replace function public.upsert_streamerbot_config_by_private_key(
  p_key text, p_address text, p_port text, p_endpoint text, p_password text, p_auto boolean
) returns void language plpgsql security definer as $$
declare uid uuid := public.get_user_id_by_private_key(p_key);
begin
  if uid is null then raise exception 'Private key tidak valid'; end if;
  insert into public.streamerbot_configs (user_id, address, port, endpoint, password, auto_connect)
  values (uid, p_address, p_port, p_endpoint, p_password, p_auto)
  on conflict (user_id) do update set address=excluded.address, port=excluded.port, endpoint=excluded.endpoint, password=excluded.password, auto_connect=excluded.auto_connect, updated_at=now();
end;
$$;
grant execute on function public.upsert_streamerbot_config_by_private_key(text,text,text,text,text,boolean) to anon, authenticated;

create or replace function public.upsert_tiktok_config_by_private_key(
  p_key text, p_username text, p_auto boolean
) returns void language plpgsql security definer as $$
declare uid uuid := public.get_user_id_by_private_key(p_key);
begin
  if uid is null then raise exception 'Private key tidak valid'; end if;
  insert into public.tiktok_configs (user_id, username, auto_connect)
  values (uid, p_username, p_auto)
  on conflict (user_id) do update set username=excluded.username, auto_connect=excluded.auto_connect, updated_at=now();
end;
$$;
grant execute on function public.upsert_tiktok_config_by_private_key(text,text,boolean) to anon, authenticated;
