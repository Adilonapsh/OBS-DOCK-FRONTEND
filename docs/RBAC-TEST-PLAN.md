# RBAC Hardening Test Plan (Migration 024–025)

Dokumen ini adalah checklist manual untuk memverifikasi hardening RBAC,
audit log, UX admin, dan hapus akun. Jalankan setelah migration `021`–`025`.

## 1. Verifikasi Database

Jalankan [`supabase/tests/024_rbac_checks.sql`](../supabase/tests/024_rbac_checks.sql)
dan [`supabase/tests/025_account_deletion_checks.sql`](../supabase/tests/025_account_deletion_checks.sql)
di Supabase SQL Editor. Script harus berhenti dengan notice:

```text
PASS: semua invariant migration 024 terpenuhi
PASS: semua invariant migration 025 terpenuhi
```

Cek manual tambahan:

```sql
-- Semua policy owner workspace harus menyebut is_active_user
select schemaname, tablename, policyname, qual, with_check
from pg_policies
where coalesce(qual, '') like '%is_active_user%'
   or coalesce(with_check, '') like '%is_active_user%'
order by schemaname, tablename, policyname;

-- Audit log tidak boleh bisa dibaca langsung
select * from public.admin_audit_log limit 1;
-- expected: permission denied (kecuali service_role)
```

## 2. Login & Status Akun

| Skenario | Langkah | Expected |
| --- | --- | --- |
| Admin aktif bisa masuk `/admin` | Login admin → buka `/admin` | Halaman tampil, badge **Auth ban** sesuai env |
| User aktif tidak bisa masuk `/admin` | Login user → buka `/admin` | Redirect ke route aman / ditolak |
| Admin blokir user | Klik **Blokir** → isi alasan → konfirmasi | User pindah ke Nonaktif, alasan tampil di tabel |
| User diblokir tidak bisa akses app | Login sebagai user yang diblokir / refresh | Diarahkan ke `/blocked` |
| User diblokir tidak bisa pakai private key | Panggil RPC overlay dengan private key user tersebut | RPC menolak / tidak mengembalikan data |
| Aktifkan kembali | Klik **Aktifkan** → konfirmasi | Status kembali Aktif, metadata blokir dibersihkan |
| Blokir diri sendiri | Klik tombol blokir di baris sendiri | Tombol disabled; RPC juga menolak |
| Blokir admin aktif terakhir | Blokir satu-satunya admin aktif | Ditolak dengan pesan jelas |

## 3. Race Condition Last Admin

Gunakan dua sesi admin (A dan B) di dua browser:

1. A dan B membuka `/admin` bersamaan.
2. A menurunkan role B menjadi `user`; B mencoba memblokir A.
3. Ulangi dengan dua admin yang saling memblokir.

Expected: salah satu aksi gagal dengan pesan “admin aktif terakhir” / “tidak
bisa mengubah role sendiri”; tidak mungkin menyisakan nol admin aktif.

## 4. RLS Data Workspace

| Skenario | Langkah | Expected |
| --- | --- | --- |
| User aktif baca config sendiri | Buka `/connection`, `/integrations`, `/widgets` | Data tampil normal |
| User diblokir baca config sendiri | Login/refresh setelah diblokir | Redirect `/blocked`; query langsung dengan anon key gagal |
| User diblokir update profil | Panggil `profiles` update dengan anon key | Ditolak RLS / trigger |
| User aktif upload avatar | Ganti avatar di `/account` | Upload sukses |
| User diblokir upload avatar | Coba upload setelah diblokir | Ditolak policy storage |
| User biasa ubah `is_active` | Update `profiles.is_active` sendiri | Ditolak trigger `trg_profiles_status_guard` |

## 5. Filter, Pagination, Statistik

| Skenario | Langkah | Expected |
| --- | --- | --- |
| Search | Cari username/email | Hanya user cocok yang tampil, footer `total` ikut berubah |
| Filter role | Pilih `Admin` | Hanya admin tampil; kartu statistik tetap global |
| Filter status | Pilih `Nonaktif` | Hanya akun diblokir tampil |
| Pagination | Buat > 50 user / turunkan `PAGE_SIZE` sementara | Tombol prev/next bekerja; pilihan checkbox reset saat pindah halaman |
| Total user | Bandingkan kartu **Total user** dengan jumlah seluruh profil | Sama, tidak terpengaruh search/filter |
| Muat ulang | Klik **Muat ulang** | Data halaman aktif dimuat ulang |

## 6. Aksi Massal

| Skenario | Langkah | Expected |
| --- | --- | --- |
| Konfirmasi role massal | Pilih beberapa user → pilih role → Terapkan | Modal konfirmasi muncul sebelum RPC |
| Blokir massal + alasan | Pilih user → Blokir → isi alasan | Semua user terblokir, alasan tersimpan |
| Detail skipped | Pilih campuran user/admin untuk widget | Modal hasil menampilkan user yang dilewati + alasan |
| Batas 200 | Panggil RPC dengan >200 ID | Ditolak “Maksimal 200 user per aksi” |
| Admin sendiri | Pilih akun sendiri | Checkbox disabled; RPC menolak |

## 7. Reset Widget

| Skenario | Langkah | Expected |
| --- | --- | --- |
| Reset satu user | Buka **Atur** → **Reset ke default** → konfirmasi | Override terhapus, akses kembali default role |
| Reset massal | Pilih user → **Widget** → **Reset ke default** | Override semua user role `user` terhapus |
| Reset admin | Panggil RPC reset untuk admin | Ditolak “Admin selalu punya akses semua widget” |
| Audit | Buka `/admin/audit` | Entri `widget.reset` / `widget.bulk_reset` muncul |

## 8. Audit Log

| Skenario | Langkah | Expected |
| --- | --- | --- |
| Aksi single tercatat | Ubah role/blokir/aktifkan | Entri baru dengan aktor, target, old → new |
| Aksi massal tercatat | Blokir 3 user | 3 entri dengan `batch_id` sama |
| Alasan blokir | Blokir dengan alasan | Kolom alasan terisi |
| Filter aksi | Pilih `Blokir akun` | Hanya aksi tersebut tampil |
| Pagination | > 50 entri | Prev/next bekerja |
| Akses non-admin | Buka `/admin/audit` sebagai user | Ditolak / redirect |

## 9. Private Key & Donasi

| Skenario | Langkah | Expected |
| --- | --- | --- |
| User aktif kirim donasi | Panggil `insert_donation_by_private_key` | Donasi tersimpan |
| User diblokir kirim donasi | Panggil RPC yang sama | Ditolak “privateKey tidak ditemukan” |
| User diblokir baca donasi | Panggil `get_donations_by_private_key` | Kosong |
| User diblokir total donasi | Panggil `get_donation_total_by_private_key` | Total 0 |
| Regenerate key user aktif | Panggil `regenerate_private_key` | Key baru tersimpan |
| Regenerate key user diblokir | Panggil RPC | Ditolak “Akun tidak aktif” |

## 10. Hapus Akun Sendiri

| Skenario | Langkah | Expected |
| --- | --- | --- |
| Konfirmasi salah | Buka `/account` → **Hapus Akun Saya** → ketik teks salah | Tombol submit disabled; server action juga menolak jika dipanggil langsung |
| User biasa hapus akun | Ketik email akun → **Hapus Permanen** | Redirect `/login?deleted=1`; login dengan akun itu gagal |
| Data user ikut terhapus | Sebelum hapus, pastikan ada chat/activity/gift log | Setelah hapus, baris dengan `user_id` tersebut tidak ada (migration 025) |
| Avatar dibersihkan | Upload avatar → hapus akun → cek bucket `avatars/<user_id>` | Folder/file avatar tidak tersisa |
| Audit log dianonimkan | Blokir/ubah role user → user hapus akun → buka `/admin/audit` | Baris audit tetap ada, `actor_email`/`target_label` yang terkait user kosong |
| Admin dengan admin lain | Dua admin aktif → salah satu hapus akun | Berhasil; masih ada minimal satu admin aktif |
| Admin terakhir | Satu-satunya admin aktif coba hapus akun | Ditolak “Tidak bisa menghapus akun admin aktif terakhir” |
| Race dua admin terakhir | Dua admin terakhir hapus akun bersamaan | Salah satu berhasil, satu ditolak; tidak pernah nol admin |
| Tanpa secret key | Kosongkan `NEXT_SUPABASE_SECRET_KEY` di server | Muncul error konfigurasi; akun dan data tidak berubah |
| User nonaktif | Login sebagai akun diblokir lalu buka `/account` | Diarahkan `/blocked`; tidak bisa menghapus dari halaman ini |

## 11. Build & Lint

```bash
cd FRONTEND
npx tsc --noEmit
npx eslint app/account/page.tsx app/login/page.tsx \
  app/actions/account.ts app/admin/AdminClient.tsx app/admin/page.tsx \
  app/admin/audit/AuditClient.tsx app/admin/audit/page.tsx \
  app/actions/admin.ts lib/auth/admin-types.ts \
  app/components/Sidebar.tsx app/blocked/page.tsx
npm run build
```

Expected: tidak ada error TypeScript/ESLint pada file yang diubah; build sukses.
`npm run lint` untuk seluruh repo masih memiliki error pre-existing di
widget/timer, valorant, `utils/privateKey.ts`, dan sejenisnya — bukan regresi
dari perubahan RBAC ini.
