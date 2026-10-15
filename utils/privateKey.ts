import type { SupabaseClient } from '@supabase/supabase-js';

// Helper private key yang tahan terhadap baris user yang belum ada.
// Latar belakang bug: RPC regenerate_private_key() hanya menjalankan UPDATE.
// Jika baris user belum ada di profiles / user_private_keys (mis. signup Google
// tanpa trigger DB), UPDATE kena 0 baris tapi tetap me-return key baru → UI
// menampilkan key palsu, refresh baca DB lagi → null. Helper di sini selalu
// memakai UPSERT + verifikasi baca-ulang sehingga key yang ditampilkan
// dijamin benar-benar tersimpan.

export function randomPrivateKey(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function readPrivateKey(supabase: SupabaseClient, userId: string): Promise<string | null> {
    try {
        const { data } = await supabase.from('profiles').select('private_key').eq('id', userId).single();
        if ((data as any)?.private_key) return (data as any).private_key as string;
    } catch {}
    try {
        const { data } = await supabase.from('user_private_keys').select('private_key').eq('user_id', userId).single();
        if ((data as any)?.private_key) return (data as any).private_key as string;
    } catch {}
    return null;
}

// Tulis key ke kedua tabel via UPSERT (bikin baris bila belum ada).
// Field profil yang sudah ada dipertahankan agar tidak tertimpa null.
async function writePrivateKey(supabase: SupabaseClient, userId: string, newKey: string): Promise<boolean> {
    try {
        let existing: any = null;
        try {
            const { data } = await supabase.from('profiles').select('username, email, avatar_url').eq('id', userId).single();
            existing = data;
        } catch {}
        const { error: e1 } = await supabase.from('profiles').upsert({
            id: userId,
            username: existing?.username ?? null,
            email: existing?.email ?? null,
            avatar_url: existing?.avatar_url ?? null,
            private_key: newKey,
        } as any, { onConflict: 'id' });
        const { error: e2 } = await supabase.from('user_private_keys').upsert(
            { user_id: userId, private_key: newKey } as any,
            { onConflict: 'user_id' }
        );
        return !e1 && !e2;
    } catch {
        return false;
    }
}

// Ambil key yang ada; buatkan bila kosong. Tidak pernah overwrite key yang sudah ada.
export async function getOrCreatePrivateKey(supabase: SupabaseClient, userId: string): Promise<string | null> {
    const existing = await readPrivateKey(supabase, userId);
    if (existing) return existing;
    const newKey = randomPrivateKey();
    const ok = await writePrivateKey(supabase, userId, newKey);
    if (!ok) return null;
    return (await readPrivateKey(supabase, userId)) ?? newKey;
}

// Regenerate: selalu key baru. Coba RPC resmi dulu (security definer, menembus RLS),
// tapi verifikasi hasilnya — bila tidak tersimpan (baris belum ada), tulis manual via upsert.
export async function regeneratePrivateKey(
    supabase: SupabaseClient,
    userId: string
): Promise<{ key: string | null; error?: string }> {
    try {
        const { data, error } = await (supabase as any).rpc('regenerate_private_key');
        if (!error && typeof data === 'string' && data) {
            const check = await readPrivateKey(supabase, userId);
            if (check) return { key: check };
            // RPC return key tapi tidak tersimpan (baris belum ada) → lanjut jalur manual.
        }
    } catch {}
    const newKey = randomPrivateKey();
    const ok = await writePrivateKey(supabase, userId, newKey);
    if (!ok) {
        const check = await readPrivateKey(supabase, userId);
        if (check) return { key: check };
        return { key: null, error: 'Gagal menyimpan key (kemungkinan tabel/RLS belum siap). Jalankan supabase/fix_register.sql di SQL Editor.' };
    }
    return { key: (await readPrivateKey(supabase, userId)) ?? newKey };
}
