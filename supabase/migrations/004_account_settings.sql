-- Account Settings: timezone + avatar handling
alter table public.profiles add column if not exists timezone text default 'Asia/Jakarta';
alter table public.profiles add column if not exists avatar_url text;

-- pastikan private_key ada (dari 002)
alter table public.profiles add column if not exists private_key text unique default encode(gen_random_bytes(32), 'hex');

-- storage bucket untuk avatar (buat via dashboard Storage jika belum ada, ini fallback via SQL)
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- policy storage avatars: public read, authenticated upload own folder
do $$ begin
  if not exists (select 1 from pg_policies where policyname='avatars_public_read' and tablename='objects') then
    create policy "avatars_public_read" on storage.objects for select using (bucket_id='avatars');
  end if;
  if not exists (select 1 from pg_policies where policyname='avatars_upload_own' and tablename='objects') then
    create policy "avatars_upload_own" on storage.objects for insert with check (bucket_id='avatars' and auth.role()='authenticated');
  end if;
  if not exists (select 1 from pg_policies where policyname='avatars_update_own' and tablename='objects') then
    create policy "avatars_update_own" on storage.objects for update using (bucket_id='avatars' and auth.role()='authenticated');
  end if;
end $$;
