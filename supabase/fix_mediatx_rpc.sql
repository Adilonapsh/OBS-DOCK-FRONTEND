-- FIX untuk ERROR: function upsert_mediatx_by_private_key(uuid, text, ...) does not exist
-- Jalankan ini di SQL Editor

drop function if exists public.upsert_mediatx_by_private_key(uuid, text, text, text, text, text);
drop function if exists public.upsert_mediatx_by_private_key(text, uuid, text, text, text, text, text);

create or replace function public.upsert_mediatx_by_private_key(
  p_key text, p_id uuid, p_name text, p_api text, p_player text, p_user text, p_pass text
) returns uuid language plpgsql security definer as $$
declare uid uuid := public.get_user_id_by_private_key(p_key);
declare new_id uuid := coalesce(p_id, gen_random_uuid());
begin
  if uid is null then raise exception 'Private key tidak valid'; end if;
  insert into public.mediatx_servers (id, user_id, server_name, api_url, player_url_base, basic_user, basic_pass)
  values (new_id, uid, p_name, p_api, p_player, p_user, p_pass)
  on conflict (id) do update set server_name=excluded.server_name, api_url=excluded.api_url, player_url_base=excluded.player_url_base, basic_user=excluded.basic_user, basic_pass=excluded.basic_pass, updated_at=now();
  return new_id;
end;
$$;
grant execute on function public.upsert_mediatx_by_private_key(text, uuid, text, text, text, text, text) to anon, authenticated;

-- pastikan get & delete juga ada
create or replace function public.get_mediatx_by_private_key(p_key text)
returns json language plpgsql security definer as $$
declare uid uuid := public.get_user_id_by_private_key(p_key);
begin
  if uid is null then return '[]'::json; end if;
  return coalesce((select json_agg(row_to_json(t) order by t.created_at) from public.mediatx_servers t where t.user_id = uid), '[]'::json);
end;
$$;
grant execute on function public.get_mediatx_by_private_key(text) to anon, authenticated;

create or replace function public.delete_mediatx_by_private_key(p_key text, p_id uuid)
returns void language plpgsql security definer as $$
declare uid uuid := public.get_user_id_by_private_key(p_key);
begin
  if uid is null then raise exception 'Private key tidak valid'; end if;
  delete from public.mediatx_servers where id = p_id and user_id = uid;
end;
$$;
grant execute on function public.delete_mediatx_by_private_key(text,uuid) to anon, authenticated;

select 'fix_mediatx done' as status;
