'use server';

import { getAuthContext } from '@/lib/auth/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export type DeleteAccountResult =
  | { ok: true; data: { deleted: true } }
  | { ok: false; error: string };

/**
 * Hapus akun milik user yang sedang login.
 *
 * Penghapusan auth.users memakai service role (Admin API), lalu FK cascade
 * membersihkan profile, config, widget permission, private key, dan data
 * workspace. Avatar di Storage dibersihkan best-effort setelahnya.
 *
 * Admin yang menghapus akunnya sendiri harus melewati
 * prepare_admin_self_deletion() agar race condition last-admin tidak bisa
 * menyisakan nol admin aktif.
 */
export async function deleteAccountAction(
  confirmation: string
): Promise<DeleteAccountResult> {
  const context = await getAuthContext();

  if (!context) {
    return { ok: false, error: 'Sesi berakhir. Silakan login ulang.' };
  }

  if (typeof confirmation !== 'string') {
    return { ok: false, error: 'Konfirmasi tidak valid.' };
  }

  const expected = (context.user.email?.trim() || 'HAPUS').toLowerCase();
  if (confirmation.trim().toLowerCase() !== expected) {
    return {
      ok: false,
      error: `Ketik "${context.user.email || 'HAPUS'}" untuk konfirmasi.`,
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      error:
        'Fitur hapus akun belum dikonfigurasi di server. Hubungi admin.',
    };
  }

  const userId = context.user.id;

  // Untuk admin: kunci + validasi last-admin + tandai nonaktif. Kalau dua
  // admin delete bersamaan, yang kedua akan ditolak.
  if (context.role === 'admin') {
    const supabase = await createClient();
    const { error: prepareError } = await supabase.rpc(
      'prepare_admin_self_deletion'
    );

    if (prepareError) {
      return {
        ok: false,
        error: prepareError.message,
      };
    }
  }

  // Jangan tinggalkan identifier PII di audit log. Baris audit tetap ada
  // untuk keamanan; actor_id/target_id akan otomatis SET NULL saat user
  // dihapus, dan email/label kita kosongkan lebih dulu.
  try {
    const { error: actorAuditError } = await admin
      .from('admin_audit_log')
      .update({ actor_email: null })
      .eq('actor_id', userId);

    const { error: targetAuditError } = await admin
      .from('admin_audit_log')
      .update({ target_label: null })
      .eq('target_id', userId);

    if (actorAuditError || targetAuditError) {
      console.warn(
        '[account-delete] gagal anonymize audit log:',
        actorAuditError?.message || targetAuditError?.message
      );
    }
  } catch (error) {
    console.warn('[account-delete] gagal anonymize audit log:', error);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(
    userId,
    false
  );

  if (deleteError) {
    // Kalau admin sudah ditandai nonaktif oleh prepare RPC, pulihkan agar
    // akun tidak tertinggal dalam kondisi blocked karena kegagalan API.
    if (context.role === 'admin') {
      const { error: restoreError } = await admin
        .from('profiles')
        .update({
          is_active: true,
          blocked_at: null,
          blocked_by: null,
          block_reason: null,
        })
        .eq('id', userId);

      if (restoreError) {
        return {
          ok: false,
          error: `Gagal menghapus akun: ${deleteError.message}. Akun juga gagal diaktifkan kembali: ${restoreError.message}. Hubungi admin lain.`,
        };
      }
    }

    return {
      ok: false,
      error: `Gagal menghapus akun: ${deleteError.message}. Akun kamu tetap aktif.`,
    };
  }

  // Best-effort: hapus file avatar milik user. Jangan gagalkan proses hapus
  // akun hanya karena cleanup storage bermasalah.
  try {
    const { data: files } = await admin.storage
      .from('avatars')
      .list(userId, { limit: 1000 });

    if (files && files.length > 0) {
      await admin.storage
        .from('avatars')
        .remove(files.map((file) => `${userId}/${file.name}`));
    }
  } catch (error) {
    console.warn('[account-delete] gagal membersihkan avatar:', error);
  }

  return { ok: true, data: { deleted: true } };
}
