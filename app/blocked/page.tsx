'use client';

import { useEffect, useMemo, useState } from 'react';
import { Ban, LogOut } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { logoutToLogin } from '@/utils/logout';

export default function BlockedPage() {
  const supabase = useMemo(() => createClient(), []);
  const [leaving, setLeaving] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadReason = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      const { data } = await supabase
        .from('profiles')
        .select('block_reason')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (!cancelled) {
        setReason((data as { block_reason?: string | null } | null)?.block_reason ?? null);
      }
    };

    loadReason();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const handleLogout = async () => {
    setLeaving(true);
    await logoutToLogin(supabase);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] grid place-items-center p-4">
      <div className="w-full max-w-md bg-[#161616] border border-white/10 rounded-2xl p-7 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/25 grid place-items-center">
          <Ban className="w-7 h-7 text-red-400" />
        </div>

        <h1 className="text-white font-black text-[20px] mt-5">Akun Diblokir</h1>
        <p className="text-gray-400 text-[12px] leading-relaxed mt-2">
          Akun ini sedang dinonaktifkan oleh admin. Kamu tidak bisa mengakses
          dashboard, widget, atau fitur workspace sampai admin mengaktifkan
          kembali akunmu.
        </p>
        <p className="text-gray-600 text-[10px] leading-relaxed mt-3">
          Hubungi admin jika menurutmu ini sebuah kesalahan.
        </p>

        {reason && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-3 py-2.5 text-left">
            <p className="text-[9px] font-black uppercase tracking-widest text-red-300/70">
              Alasan
            </p>
            <p className="text-[11px] text-red-200/80 mt-1 leading-relaxed whitespace-pre-wrap">
              {reason}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          disabled={leaving}
          className="mt-6 w-full h-10 inline-flex items-center justify-center gap-2 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
        >
          <LogOut className="w-3.5 h-3.5" />
          {leaving ? 'Keluar...' : 'Keluar dari akun'}
        </button>
      </div>
    </div>
  );
}
