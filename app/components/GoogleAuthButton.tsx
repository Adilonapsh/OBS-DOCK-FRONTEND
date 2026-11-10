'use client';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
            <path fill="#FBBC05" d="M5.27 14.19c-.25-.72-.38-1.49-.38-2.19s.14-1.47.38-2.19V6.72H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.28l3.98-3.09z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.72l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
        </svg>
    );
}

// Tombol login/daftar Google via Supabase OAuth.
// Sukses → browser redirect ke Google, lalu balik ke /auth/confirm?next=...
// yang menukar code jadi session cookie (route sudah ada).
export default function GoogleAuthButton({
    next = '/dashboard',
    label = 'Masuk dengan Google',
    onError,
}: {
    next?: string;
    label?: string;
    onError?: (msg: string) => void;
}) {
    const [loading, setLoading] = useState(false);

    const handleGoogle = async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
                },
            });
            if (error) {
                onError?.(error.message);
                setLoading(false);
            }
            // tanpa error → browser pindah ke halaman Google, halaman ini ditinggalkan
        } catch (e) {
            onError?.(e instanceof Error ? e.message : 'Gagal membuka login Google.');
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full h-10 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
            {loading ? (
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
                <GoogleIcon className="w-4 h-4" />
            )}
            {loading ? 'Membuka Google...' : label}
        </button>
    );
}
