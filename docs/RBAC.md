# Role & Permission (RBAC)

Dokumen ini menjelaskan model akses OBS Dock: **guest**, **user**, dan **admin**.

## 1. Konsep

| Role | Siapa | Akses |
| --- | --- | --- |
| `guest` | Pengunjung / OBS Browser Source / pemakai private key tanpa login | `overlay.read`, `dock.control` |
| `user` | Pemilik akun & workspace | Semua akses guest + dashboard, widget, donasi, integrasi, koneksi, akun |
| `admin` | Operator platform | Semua akses user + panel Role & Permission (role + akses widget) |

Hierarki: `guest < user < admin`.

Selain role, setiap profil punya status **aktif / nonaktif** (`profiles.is_active`).
Akun nonaktif (diblokir) diperlakukan seperti guest: tidak bisa mengakses
workspace dan diarahkan ke `/blocked`.

- **Guest bukan berarti "tanpa izin"**. Guest tetap boleh membuka `/dock` dan
  `/overlay/display` selama punya private key yang valid. Verifikasi private key
  tetap dilakukan oleh halaman/socket seperti sebelumnya.
- **Role disimpan di database** (`public.profiles.role`), **bukan** di
  `user_metadata`. `user_metadata` bisa diubah sendiri oleh user, jadi tidak
  aman untuk otorisasi.
- **Permission adalah sumber kebenaran** untuk UI & route guard. Role hanya
  kumpulan permission.

## 2. Permission Matrix

Definisi lengkap: [`lib/auth/permissions.ts`](../lib/auth/permissions.ts).

| Permission | guest | user | admin |
| --- | :-: | :-: | :-: |
| `overlay.read` | ✅ | ✅ | ✅ |
| `dock.control` | ✅ | ✅ | ✅ |
| `workspace.view` | — | ✅ | ✅ |
| `widget.read` | — | ✅ | ✅ |
| `widget.write` | — | ✅ | ✅ |
| `donation.read` | — | ✅ | ✅ |
| `donation.write` | — | ✅ | ✅ |
| `integration.manage` | — | ✅ | ✅ |
| `connection.manage` | — | ✅ | ✅ |
| `account.manage` | — | ✅ | ✅ |
| `admin.access` | — | — | ✅ |
| `admin.users.read` | — | — | ✅ |
| `admin.users.manage` | — | — | ✅ |

Route → permission ada di [`lib/auth/routes.ts`](../lib/auth/routes.ts).

Di atas permission base, ada **akses widget per user** yang diatur admin di
halaman Role & Permission. Detailnya di bagian 5.

## 3. Lapisan Enforcement

Urutannya dari yang paling kuat:

1. **Database (RLS + trigger)** — pertahanan utama.
   - `public.profiles.role` hanya bisa diubah admin.
   - Trigger `trg_profiles_role_guard` menolak user yang mencoba
     `update profiles set role = 'admin'` lewat anon key.
   - Admin membaca/mengubah role lewat RPC `SECURITY DEFINER`:
     `admin_list_users()` dan `admin_set_user_role()`.
   - Override widget disimpan di `public.user_widget_permissions` dan hanya
     bisa ditulis lewat RPC `admin_set_user_widget_permissions()`.
   - Status akun disimpan di `profiles.is_active`. `auth_role()` mengembalikan
     `guest` untuk akun nonaktif, sehingga RPC admin otomatis menolaknya.
   - Migration `024` menambahkan `public.is_active_user()` dan memakainya di
     policy RLS owner-based (config, log, widget override, storage avatar).
     Akun nonaktif tidak bisa membaca/menulis data workspace lewat anon key.
     `profiles_select_own` sengaja tetap terbuka agar status blokir bisa dibaca
     oleh `getAuthContext()` dan halaman `/blocked`.
   - Trigger `trg_profiles_status_guard` menolak user biasa yang mencoba
     mengubah `is_active`, `blocked_at`, `blocked_by`, atau `block_reason`.
   - Tabel `profiles` tetap **owner-only** untuk SELECT, karena berisi
     `private_key`. Admin tidak diberi SELECT langsung ke tabel itu.
   - Setiap aksi admin dicatat ke `public.admin_audit_log` lewat helper
     `log_admin_action()`; tabel ini tidak punya policy SELECT langsung dan
     hanya bisa dibaca lewat RPC admin.
2. **`proxy.ts` (middleware)** — menolak akses route sebelum halaman render.
   Guest yang belum login diarahkan ke `/login`; user yang rolenya tidak cukup
   diarahkan ke route aman (`/dashboard` atau `/dock`). Akun nonaktif selalu
   diarahkan ke `/blocked`. Untuk halaman settings `/widgets/<key>`, proxy juga
   mengecek override widget milik user.
3. **Server Component / Server Action** — `requirePermission()` /
   `getAuthContext()` di [`lib/auth/server.ts`](../lib/auth/server.ts).
   `getAuthContext()` mengembalikan `null` untuk akun nonaktif, serta
   menyediakan `widgets` dan `canWidget(key)`.
   Contoh: `/admin` memanggil `requirePermission(PERMISSIONS.ADMIN_ACCESS)`.
4. **Client (`RoleProvider`, `<Can>`)** — hanya untuk UX (sembunyikan menu/tombol).
   **Jangan pernah** mengandalkan ini sebagai keamanan. `usePermissions()`
   menyediakan `canWidget(key)` untuk menyembunyikan widget di UI.

## 4. Setup

Jalankan migration:

```sql
-- Supabase Dashboard > SQL Editor
-- jalankan berurutan:
-- 1) FRONTEND/supabase/migrations/021_roles_permissions.sql
-- 2) FRONTEND/supabase/migrations/022_user_widget_permissions.sql
-- 3) FRONTEND/supabase/migrations/023_user_status_bulk.sql
-- 4) FRONTEND/supabase/migrations/024_admin_hardening_audit.sql
-- 5) FRONTEND/supabase/migrations/025_account_deletion.sql
```

Atau via Supabase CLI:

```bash
supabase db push
```

### Bootstrap admin pertama

Setelah migration, promote akun sendiri:

```sql
update public.profiles
set role = 'admin'
where email = 'email-kamu@example.com';
```

Buka **Role & Permission** (`/admin`). Admin bisa mengubah role user lain,
mengatur widget yang boleh dipakai tiap user lewat tombol **Atur** di kolom
**Widget**, serta memblokir/mengaktifkan akun. Daftar user punya pencarian,
filter role/status, dan pagination 50 user per halaman. Aksi destruktif
(blokir, aktifkan, ubah role massal) memakai modal konfirmasi; blokir bisa
disertai alasan. Riwayat aksi tersedia di **Audit Log** (`/admin/audit`).

### Blokir login di level Supabase Auth (opsional)

`profiles.is_active` sudah menolak akses aplikasi lewat proxy. Kalau
`NEXT_SUPABASE_SECRET_KEY` diisi di environment server, server action juga
memanggil Supabase Admin API untuk memblokir login user tersebut. Tanpa secret
key, akun tetap diblokir dari aplikasi tetapi masih bisa login ke Supabase.

> Catatan: admin tidak bisa menurunkan role dirinya sendiri, dan admin terakhir
> tidak bisa diturunkan (mencegah lockout).

## 5. Permission Widget per User

Selain permission base, admin bisa mengatur **widget mana yang boleh dipakai
per user** di halaman `/admin` (label sidebar: **Role & Permission**).

### Model data

| Hal | Detail |
| --- | --- |
| Katalog widget | [`lib/auth/widgets.ts`](../lib/auth/widgets.ts) — 23 widget |
| Tabel override | `public.user_widget_permissions` |
| Kolom | `user_id`, `widget_key`, `allowed`, `updated_by`, `updated_at` |
| Arti "tidak ada baris" | Ikut default role |
| Default role | `admin` & `user`: semua widget; `guest`: tidak ada widget |
| Role admin | Selalu semua widget, override diabaikan (mencegah lockout) |
| RPC baca | `admin_get_user_widget_permissions(p_user_id)` |
| RPC tulis | `admin_set_user_widget_permissions(p_user_id, p_permissions)` |
| RPC tulis massal | `admin_bulk_set_user_widget_permissions(p_user_ids, p_permissions)` |

Override yang disimpan adalah hasil akhir per widget (`true` = boleh,
`false` = diblokir). Saat admin menyimpan, frontend mengirim seluruh key
katalog, jadi widget yang diblokir tersimpan eksplisit sebagai `allowed=false`.

### Alur admin

1. Login sebagai admin, buka **Role & Permission** (`/admin`).
2. Pada baris user dengan role `user`, klik **Atur** di kolom **Widget**.
3. Toggle widget yang boleh dipakai, atau pakai **Semua** / **Tidak ada**.
4. Klik **Simpan Akses**.

Tombol **Atur** sengaja dinonaktifkan untuk role `admin` (selalu full) dan
`guest` (guest tidak punya akses workspace/widget). Untuk memberi guest akses
widget, ubah dulu role-nya menjadi `user`.

Untuk banyak user sekaligus: centang beberapa user di tabel, lalu klik
**Widget** pada bar aksi massal. Pengaturan yang dipilih akan menimpa akses
widget semua user role `user` yang dicentang; admin/guest otomatis dilewati.

### Enforcement

- **Daftar widget** (`/widgets`) menyembunyikan widget yang tidak diizinkan dan
  menampilkan jumlah widget yang disembunyikan.
- **URL langsung** `/widgets/<key>` dicek di `proxy.ts`. Jika diblokir, user
  diarahkan ke `/widgets?denied=widget.<key>`.
- **Overlay publik** `/widgets/<key>/display` **tidak** terkena aturan ini
  karena itu bukan halaman settings dan tetap memakai private key.
- **Client** mendapat `canWidget(key)` dari `RoleProvider`; ini hanya UX.
  Pemeriksaan sebenarnya tetap di proxy/database.
- Jika migration `022` belum dijalankan, aplikasi memakai default role
  (user boleh semua widget) dan panel admin menampilkan pesan agar migration
  dijalankan.

## 6. Status Akun & Aksi Massal

### Status akun

| Hal | Detail |
| --- | --- |
| Kolom | `public.profiles.is_active` (`true` = aktif) |
| Halaman blokir | `/blocked` (hanya logout yang tersedia) |
| Enforcement web | `proxy.ts` mengarahkan akun nonaktif ke `/blocked` |
| Enforcement server | `getAuthContext()` mengembalikan `null` |
| Enforcement DB | `auth_role()` mengembalikan `guest` untuk akun nonaktif; RLS memakai `is_active_user()` |
| Metadata blokir | `blocked_at`, `blocked_by`, `block_reason` |
| Private key / overlay | `get_user_id_by_private_key()` & `verify_private_key()` menolak akun nonaktif |
| Blokir login | Opsional via Supabase Admin API (`NEXT_SUPABASE_SECRET_KEY`) |

Aturan pengaman:

- Admin tidak bisa memblokir akun sendiri.
- Admin aktif terakhir tidak bisa diblokir.
- Admin tidak bisa menurunkan role sendiri lewat aksi massal.
- Admin aktif terakhir tidak bisa diturunkan (single maupun massal).
- RPC role/status memakai `pg_advisory_xact_lock` agar dua admin yang
  mengubah role/status bersamaan tidak bisa saling mengunci di luar sistem.
- User biasa tidak bisa mengubah status akunnya sendiri (trigger database).

### RPC aksi massal

| RPC | Fungsi |
| --- | --- |
| `admin_set_user_active(id, is_active, reason)` | Blokir/aktifkan satu user + alasan |
| `admin_bulk_set_user_active(ids, is_active, reason)` | Blokir/aktifkan banyak user + alasan |
| `admin_set_user_role(id, role)` | Ubah role satu user |
| `admin_bulk_set_user_role(ids, role)` | Ubah role banyak user |
| `admin_set_user_widget_permissions(id, permissions)` | Simpan akses widget satu user |
| `admin_bulk_set_user_widget_permissions(ids, permissions)` | Terapkan akses widget ke banyak user role `user` |
| `admin_reset_user_widget_permissions(id)` | Hapus override widget satu user |
| `admin_bulk_reset_user_widget_permissions(ids)` | Hapus override widget banyak user |
| `admin_list_audit_log(limit, offset, action, target_id)` | Baca audit log (admin) |

Semua RPC memeriksa `public.is_admin()`, membatasi maksimal 200 user per aksi,
dan mengembalikan ringkasan `updated` / `skipped` / `unchanged`. Aksi massal
juga mengembalikan `skipped_details` berisi `{ id, label, reason }` agar UI bisa
menjelaskan user mana yang dilewati dan alasannya.

### Alur di panel

1. Centang user pada kolom paling kiri (akun sendiri tidak bisa dicentang).
2. Bar aksi massal muncul:
   - **Ubah role** → pilih role → **Terapkan**
   - **Widget** → atur akses widget untuk semua user terpilih
   - **Blokir** / **Aktifkan** → ubah status akun
   - **Batal** → kosongkan pilihan
3. Status per user juga bisa diubah lewat tombol **Blokir/Aktifkan** di kolom
   **Status**.

### Filter, pagination, dan statistik

`admin_list_users(p_search, p_limit, p_offset, p_role, p_status)` mengembalikan:

- `total` — jumlah user yang cocok dengan search/filter (untuk pagination).
- `global_total` — jumlah seluruh user (untuk kartu statistik).
- `counts` dan `status_counts` — statistik global per role/status.
- `filters` — echo filter yang dipakai.

UI memakai `total` untuk footer pagination dan `global_total` untuk kartu
**Total user**, sehingga angka statistik tidak berubah saat mencari/memfilter.
Pilihan checkbox berlaku untuk halaman yang sedang tampil.

### Reset akses widget

Di modal **Atur Widget** ada tombol **Reset ke default**. Tombol ini menghapus
semua baris override user tersebut, sehingga akses kembali mengikuti default
role. Reset juga tersedia untuk aksi massal lewat `admin_bulk_reset_*`.
Semua reset dicatat di audit log.

### Audit log

Halaman `/admin/audit` menampilkan riwayat aksi admin:

| Kolom | Isi |
| --- | --- |
| Waktu | Timestamp aksi |
| Aktor | Email admin yang melakukan aksi |
| Aksi | `role.set`, `role.bulk`, `status.block`, `status.activate`, `status.bulk_*`, `widget.set`, `widget.bulk`, `widget.reset`, `widget.bulk_reset` |
| Target | Label user (username/email) |
| Detail | Nilai lama → nilai baru |
| Alasan | Alasan blokir (jika diisi) |

Aksi massal menyimpan `batch_id` yang sama untuk setiap target, sehingga bisa
ditelusuri sebagai satu operasi. Audit log tidak bisa dihapus/diubah lewat RLS
langsung; hanya RPC admin yang bisa membacanya.

## 7. Hapus Akun Sendiri

Halaman `/account` punya **danger zone** untuk menghapus akun secara permanen.
Alurnya:

1. User membuka modal dan mengetik email akunnya (fallback `HAPUS` jika akun
   tidak punya email) sebagai konfirmasi.
2. Server action [`app/actions/account.ts`](../app/actions/account.ts)
   memverifikasi sesi lewat `getAuthContext()` dan mencocokkan konfirmasi di
   server — bukan hanya di UI.
3. `NEXT_SUPABASE_SECRET_KEY` dipakai untuk memanggil Supabase Admin API
   `auth.admin.deleteUser(userId, false)` (hard delete).
4. FK `ON DELETE CASCADE` menghapus profil, config workspace, widget
   permission, private key, dan log stream. Migration `025` mengubah
   `chat_messages`, `activity_logs`, dan `gift_logs` dari `SET NULL` menjadi
   `CASCADE`.
5. File avatar di bucket `avatars` dibersihkan best-effort setelah auth user
   dihapus.
6. Identifier PII di `admin_audit_log` (`actor_email`, `target_label`)
   dikosongkan lebih dulu. Baris audit tetap disimpan untuk keamanan dan
   `actor_id`/`target_id` otomatis menjadi `NULL` lewat FK `SET NULL`.

Pengaman admin:

- Admin yang menghapus akunnya sendiri wajib memanggil RPC
  `prepare_admin_self_deletion()`.
- RPC memakai `pg_advisory_xact_lock` yang sama dengan aksi admin lain,
  menghitung admin aktif lain, lalu menandai akun nonaktif. Jika dua admin
  menghapus akun bersamaan, yang kedua ditolak sehingga tidak mungkin
  menyisakan nol admin aktif.
- Jika `deleteUser` gagal setelah RPC menandai nonaktif, server action
  mengaktifkan kembali profil admin lewat service role.
- Tanpa secret key, tombol hapus akun mengembalikan error yang jelas dan tidak
  menghapus apa pun.

## 8. Pemakaian di Kode

### Client Component — sembunyikan UI

```tsx
import Can from '@/app/components/auth/Can';
import { PERMISSIONS } from '@/lib/auth';

<Can permission={PERMISSIONS.ADMIN_ACCESS}>
  <Link href="/admin">Role & Permission</Link>
</Can>
```

### Client Component — cek manual

```tsx
const { can, canWidget, isAdmin, role } = usePermissions();

if (can(PERMISSIONS.WIDGET_WRITE)) {
  // tampilkan tombol edit
}

if (canWidget('chat')) {
  // tampilkan widget chat
}
```

### Server Component — wajib permission

```tsx
import { requirePermission } from '@/lib/auth/server';
import { PERMISSIONS } from '@/lib/auth';

export default async function Page() {
  const { user, role } = await requirePermission(PERMISSIONS.ADMIN_ACCESS);
  // ...
}
```

### Server Action — kembalikan error, jangan redirect

```ts
const context = await getAuthContext();
if (!context?.can(PERMISSIONS.ADMIN_USERS_MANAGE)) {
  return { ok: false, error: 'Akses ditolak.' };
}
```

## 9. Menambah Permission / Route Baru

1. Tambahkan konstanta di `PERMISSIONS`
   ([`lib/auth/permissions.ts`](../lib/auth/permissions.ts)).
2. Masukkan ke `GUEST_PERMISSIONS`, `USER_PERMISSIONS`, atau
   `ADMIN_PERMISSIONS`.
3. Kalau ada halaman baru, tambahkan mapping di `ROUTE_PERMISSIONS`
   ([`lib/auth/routes.ts`](../lib/auth/routes.ts)) dan pastikan path-nya masuk
   `matcher` di `proxy.ts`.
4. Di halaman server, pasang `requirePermission(...)`. Di UI, bungkus dengan
   `<Can>` atau cek `can(...)`.
5. Kalau route baru butuh data khusus admin, tambahkan RPC `SECURITY DEFINER`
   yang memanggil `public.is_admin()` — jangan buka RLS tabel sensitif.
6. Kalau menambah widget baru, tambahkan key-nya ke `WIDGET_CATALOG` di
   [`lib/auth/widgets.ts`](../lib/auth/widgets.ts). Widget otomatis muncul di
   panel Role & Permission dan mengikuti default role. Pastikan folder
   `app/widgets/<key>` dan `id` di halaman daftar widget memakai key yang sama.

## 10. Catatan Keamanan

- Jangan menaruh role di `user_metadata`, localStorage, atau JWT custom tanpa
  validasi server. Sumber kebenaran tetap `profiles.role`.
- Jangan memberi admin akses SELECT langsung ke `profiles` hanya untuk panel
  admin; gunakan RPC yang tidak mengembalikan `private_key`.
- `SUPABASE_SERVICE_ROLE_KEY` / `NEXT_SUPABASE_SECRET_KEY` hanya boleh ada di
  backend/server. Jangan pernah mengirimnya ke client.
- Blokir akun punya dua lapisan: `profiles.is_active` (proxy + server) dan
  opsional ban lewat Supabase Admin API. Kalau secret key tidak diisi, akun
  tetap tidak bisa memakai aplikasi, tetapi masih bisa login ke Supabase.
- Jangan menambahkan `is_active_user()` ke `profiles_select_own`. Kalau profil
  sendiri tidak terbaca, `getAuthContext()` tidak bisa membedakan akun aktif
  dan nonaktif, sehingga enforcement server bisa gagal.
- RPC donasi (`insert_donation_by_private_key`,
  `get_donations_by_private_key`, `get_donation_total_by_private_key`) memakai
  `get_user_id_by_private_key()` yang menolak akun nonaktif. Jangan
  mengembalikan query langsung ke `profiles.private_key` di RPC baru.
- Audit log bersifat append-only dari RPC admin. Jangan memberi grant SELECT
  langsung ke `authenticated`; gunakan `admin_list_audit_log()`.
- Backend Socket.IO saat ini masih memakai isolasi **private key per room**,
  bukan RBAC. RBAC di dokumen ini mengatur akses aplikasi web & panel admin.
  Kalau nanti backend butuh otorisasi role, tambahkan verifikasi JWT Supabase
  di handshake socket dan cek `profiles.role` di server.
