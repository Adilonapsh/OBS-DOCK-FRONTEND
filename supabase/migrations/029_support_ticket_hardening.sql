-- ============================================
-- Migration: 029_support_ticket_hardening
-- Hardening form support: anti-spam, anti-flood, dan anti-bypass.
--
-- Sebelumnya siapa pun yang punya anon key bisa insert langsung ke tabel
-- support_tickets tanpa batas. Sekarang:
--   - INSERT langsung ke tabel DICABUT.
--   - Satu-satunya jalan masuk adalah RPC submit_support_ticket().
--   - RPC membatasi jumlah tiket per IP, per email, per user, plus dedupe
--     dan honeypot. IP diambil dari header request (di-hash, bukan disimpan
--     mentah) dan dipakai sebagai kunci rate limit.
--
-- Catatan: rate limit ini melindungi database/aplikasi dari spam & flood.
-- Untuk serangan DDoS volumetrik tetap perlu proteksi di edge (Cloudflare/WAF).
--
-- Jalankan di Supabase Dashboard → SQL Editor.
-- ============================================

-- 1. Kolom fingerprint IP (hash) untuk rate limit.
alter table public.support_tickets
  add column if not exists ip_hash text;

create index if not exists idx_support_tickets_ip_created
  on public.support_tickets(ip_hash, created_at desc);

create index if not exists idx_support_tickets_email_created
  on public.support_tickets(lower(email), created_at desc);

create index if not exists idx_support_tickets_user_created
  on public.support_tickets(user_id, created_at desc);

-- 2. Tutup jalur insert publik. Mulai sekarang hanya lewat RPC.
drop policy if exists "support_tickets_insert_public" on public.support_tickets;
revoke insert on public.support_tickets from anon, authenticated;

-- 3. RPC utama pengiriman tiket (SECURITY DEFINER + validasi + rate limit).
create or replace function public.submit_support_ticket(
  p_name text,
  p_email text,
  p_category text,
  p_subject text,
  p_message text,
  p_page_url text default null,
  p_user_agent text default null,
  p_honeypot text default '',
  p_elapsed_ms int default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_ip text;
  v_ip_hash text;
  v_name text := btrim(coalesce(p_name, ''));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_category text := lower(btrim(coalesce(p_category, 'other')));
  v_subject text := btrim(coalesce(p_subject, ''));
  v_message text := btrim(coalesce(p_message, ''));
  v_id uuid;
  v_count int;
  v_headers jsonb;
begin
  -- Honeypot: field tersembunyi yang hanya diisi bot. Pura-pura sukses.
  if coalesce(btrim(p_honeypot), '') <> '' then
    return null;
  end if;

  -- Terlalu cepat = hampir pasti bot. Minimal 1,2 detik dari form dibuka.
  if p_elapsed_ms is not null and p_elapsed_ms >= 0 and p_elapsed_ms < 1200 then
    raise exception 'TOO_FAST';
  end if;

  if v_email = '' or v_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'INVALID_EMAIL';
  end if;

  if char_length(v_name) > 120 then
    raise exception 'INVALID_NAME';
  end if;
  if char_length(v_email) > 200 then
    raise exception 'INVALID_EMAIL';
  end if;
  if char_length(v_subject) < 3 or char_length(v_subject) > 200 then
    raise exception 'INVALID_SUBJECT';
  end if;
  if char_length(v_message) < 10 or char_length(v_message) > 5000 then
    raise exception 'INVALID_MESSAGE';
  end if;

  if v_category not in ('bug', 'account', 'widget', 'integration', 'feature', 'other') then
    v_category := 'other';
  end if;

  -- Ambil IP dari header proxy (Cloudflare / Supabase edge), lalu hash.
  begin
    v_headers := coalesce(current_setting('request.headers', true), '{}')::jsonb;
  exception when others then
    v_headers := '{}'::jsonb;
  end;
  v_ip := coalesce(
    nullif(btrim(v_headers->>'cf-connecting-ip'), ''),
    nullif(btrim(v_headers->>'x-real-ip'), ''),
    nullif(btrim(split_part(coalesce(v_headers->>'x-forwarded-for', ''), ',', 1)), ''),
    'unknown'
  );
  v_ip_hash := md5(v_ip);

  -- Dedupe: laporan identik dalam 10 menit dianggap dobel.
  select count(*) into v_count
    from public.support_tickets t
   where t.subject = v_subject
     and t.message = v_message
     and t.created_at > now() - interval '10 minutes';
  if v_count > 0 then
    raise exception 'DUPLICATE_TICKET';
  end if;

  -- Rate limit per IP (anti flood dari satu sumber).
  select count(*) into v_count
    from public.support_tickets t
   where t.ip_hash = v_ip_hash
     and t.created_at > now() - interval '10 minutes';
  if v_count >= 3 then
    raise exception 'RATE_LIMIT_IP';
  end if;

  select count(*) into v_count
    from public.support_tickets t
   where t.ip_hash = v_ip_hash
     and t.created_at > now() - interval '1 hour';
  if v_count >= 10 then
    raise exception 'RATE_LIMIT_IP';
  end if;

  select count(*) into v_count
    from public.support_tickets t
   where t.ip_hash = v_ip_hash
     and t.created_at > now() - interval '1 day';
  if v_count >= 25 then
    raise exception 'RATE_LIMIT_IP';
  end if;

  -- Rate limit per email (mencegah satu orang membanjiri inbox).
  select count(*) into v_count
    from public.support_tickets t
   where lower(t.email) = v_email
     and t.created_at > now() - interval '1 hour';
  if v_count >= 5 then
    raise exception 'RATE_LIMIT_EMAIL';
  end if;

  select count(*) into v_count
    from public.support_tickets t
   where lower(t.email) = v_email
     and t.created_at > now() - interval '1 day';
  if v_count >= 15 then
    raise exception 'RATE_LIMIT_EMAIL';
  end if;

  -- Rate limit per akun login.
  if v_uid is not null then
    select count(*) into v_count
      from public.support_tickets t
     where t.user_id = v_uid
       and t.created_at > now() - interval '1 hour';
    if v_count >= 10 then
      raise exception 'RATE_LIMIT_USER';
    end if;
  end if;

  -- Cap global tinggi: pengaman terakhir kalau ada flood terdistribusi.
  select count(*) into v_count
    from public.support_tickets t
   where t.created_at > now() - interval '10 minutes';
  if v_count >= 200 then
    raise exception 'RATE_LIMIT_GLOBAL';
  end if;

  insert into public.support_tickets (
    user_id, name, email, category, subject, message,
    page_url, user_agent, ip_hash, status
  ) values (
    v_uid, v_name, v_email, v_category, v_subject, v_message,
    left(coalesce(p_page_url, ''), 500),
    left(coalesce(p_user_agent, ''), 500),
    v_ip_hash, 'open'
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_support_ticket(text, text, text, text, text, text, text, text, int) from public;
grant execute on function public.submit_support_ticket(text, text, text, text, text, text, text, text, int) to anon, authenticated;
