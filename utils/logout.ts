import type { SupabaseClient } from '@supabase/supabase-js';

// Logout universal: signOut + bersihkan sisa session di storage + hard reload ke /login.
// Hard reload itu penting: router.push() lunak sering kalah dengan cookie session di
// middleware (proxy mengira user masih login lalu melempar balik ke /dashboard),
// sehingga pencet Keluar tidak pernah sampai ke halaman login.
export async function logoutToLogin(supabase: SupabaseClient, redirect = '/login') {
    try {
        await supabase.auth.signOut();
    } catch {}
    try {
        localStorage.removeItem('obs-login');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user_private_key');
        sessionStorage.clear();
    } catch {}
    window.location.href = redirect;
}
