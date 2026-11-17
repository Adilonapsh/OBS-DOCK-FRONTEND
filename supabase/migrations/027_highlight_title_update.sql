-- ============================================
-- Migration: 027_highlight_title_update
-- Update judul + jumlah penonton (views) highlight hari ini via private key.
--
-- Latar belakang: highlight TikTok pertama kali dibuat dengan judul generik
-- ("Live TikTok @user") sebelum judul asli roomInfo tersedia. Saat event
-- `tiktok-title` datang, baris highlight hari ini harus di-update dengan
-- judul asli tersebut. Mode login memakai update langsung (RLS owner),
-- sedangkan mode private key butuh RPC ini karena anon tidak punya akses RLS.
--
-- Kolom `viewers` diisi dari penonton sesi live (TikTok: totalUser/akumulasi,
-- YouTube: viewCount, Twitch/Kick: puncak penonton online).
--
-- Jalankan di Supabase Dashboard → SQL Editor.
-- ============================================

create or replace function public.update_highlight_title_by_private_key(
  p_key text,
  p_platform text,
  p_title text,
  p_since timestamptz,
  p_metadata jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer as $$
declare
  uid uuid;
  nid uuid;
begin
  uid := public.get_user_id_by_private_key(p_key);
  if uid is null then
    raise exception 'Private key tidak valid';
  end if;

  if coalesce(trim(p_title), '') = '' then
    return null;
  end if;

  update public.highlights h
     set title = p_title,
         metadata = coalesce(h.metadata, '{}'::jsonb) || coalesce(p_metadata, '{}'::jsonb)
   where h.id = (
     select h2.id
       from public.highlights h2
      where h2.user_id = uid
        and h2.platform = p_platform
        and h2.started_at >= coalesce(p_since, now() - interval '1 day')
      order by h2.started_at desc
      limit 1
   )
  returning h.id into nid;

  return nid;
end;
$$;

grant execute on function public.update_highlight_title_by_private_key(text, text, text, timestamptz, jsonb) to anon, authenticated;

-- ============================================
-- Jumlah penonton sesi live (views) untuk highlight hari ini.
-- Nilai disimpan sebagai maximum (greatest) supaya tidak turun saat
-- penonton berkurang di tengah sesi.
-- ============================================
create or replace function public.update_highlight_viewers_by_private_key(
  p_key text,
  p_platform text,
  p_viewers int,
  p_since timestamptz
) returns uuid language plpgsql security definer as $$
declare
  uid uuid;
  nid uuid;
begin
  uid := public.get_user_id_by_private_key(p_key);
  if uid is null then
    raise exception 'Private key tidak valid';
  end if;

  if coalesce(p_viewers, 0) <= 0 then
    return null;
  end if;

  update public.highlights h
     set viewers = greatest(coalesce(h.viewers, 0), p_viewers)
   where h.id = (
     select h2.id
       from public.highlights h2
      where h2.user_id = uid
        and h2.platform = p_platform
        and h2.started_at >= coalesce(p_since, now() - interval '1 day')
      order by h2.started_at desc
      limit 1
   )
  returning h.id into nid;

  return nid;
end;
$$;

grant execute on function public.update_highlight_viewers_by_private_key(text, text, int, timestamptz) to anon, authenticated;
