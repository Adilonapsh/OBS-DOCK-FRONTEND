'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle, Sparkles, LogIn } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Logo from "../../components/Logo";

export default function ResetPasswordPage() {
    const router = useRouter();
    const supabase = createClient();
    const [checking, setChecking] = useState(true);
    const [hasSession, setHasSession] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [form, setForm] = useState({ password: "", confirm: "" });

    useEffect(() => {
        // Link email sudah ditukar jadi session oleh /auth/confirm.
        // Di sini pastikan recovery session benar-benar ada sebelum tampilkan form.
        supabase.auth.getUser().then(({ data: { user } }) => {
            setHasSession(!!user);
            setChecking(false);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' && session) {
                setHasSession(true);
                setChecking(false);
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!form.password.trim() || !form.confirm.trim()) {
            setError("Password baru dan konfirmasi wajib diisi.");
            return;
        }
        if (form.password.length < 6) {
            setError("Password minimal 6 karakter.");
            return;
        }
        if (form.password !== form.confirm) {
            setError("Konfirmasi password tidak cocok.");
            return;
        }

        setLoading(true);
        const { error: updateError } = await supabase.auth.updateUser({ password: form.password });
        setLoading(false);

        if (updateError) {
            setError(updateError.message);
            return;
        }
        setSuccess("Password berhasil diubah! Mengalihkan ke login...");
        await supabase.auth.signOut();
        setTimeout(() => router.replace("/login"), 1200);
    };

    return (
        <div className="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
            {/* background glow */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-32 -left-32 w-[480px] h-[480px] bg-blue-600/20 blur-[120px] rounded-full" />
                <div className="absolute -bottom-32 -right-32 w-[480px] h-[480px] bg-cyan-500/15 blur-[120px] rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] bg-[#FE2C55]/5 blur-[120px] rounded-full" />
            </div>

            <div className="relative w-full max-w-[420px]">
                {/* header branding */}
                <div className="flex flex-col items-center gap-3 mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-lg">
                            <Logo />
                        </div>
                        <span className="font-black tracking-tighter text-white text-[18px]">STREAM CONTROLS</span>
                        <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-[8px] font-black tracking-widest text-white">DOCK</span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-blue-400" /> TruOverlay • Stream Control
                    </p>
                </div>

                <div className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
                    <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-r from-blue-900/15 via-transparent to-cyan-900/10">
                        <h1 className="text-white font-black text-[14px] uppercase tracking-wide flex items-center gap-2">
                            <KeyRound className="w-4 h-4 text-blue-400" /> Password Baru
                        </h1>
                        <p className="text-gray-500 text-[10px] mt-1">Buat password baru untuk akunmu.</p>
                    </div>

                    <div className="p-6 space-y-4">
                        {checking ? (
                            <p className="text-gray-500 text-[12px] font-bold text-center py-4">Memverifikasi link reset...</p>
                        ) : !hasSession ? (
                            <>
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold px-3 py-2 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>Link reset tidak valid atau sudah kedaluwarsa. Minta link baru.</span>
                                </div>
                                <Link href="/forgot-password" className="w-full h-10 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                                    Minta Link Baru
                                </Link>
                            </>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold px-3 py-2 rounded-lg flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}
                                {success && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold px-3 py-2 rounded-lg flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span>{success}</span>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[8px] font-black tracking-widest uppercase text-gray-400 mb-1.5">Password Baru</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                        <input
                                            type={showPass ? "text" : "password"}
                                            value={form.password}
                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            placeholder="•••••••• (min 6)"
                                            className="w-full h-10 pl-9 pr-9 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-colors"
                                        />
                                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                            {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[8px] font-black tracking-widest uppercase text-gray-400 mb-1.5">Konfirmasi Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            value={form.confirm}
                                            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                                            placeholder="Ulangi password baru"
                                            className="w-full h-10 pl-9 pr-9 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-colors"
                                        />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                            {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-10 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                                >
                                    {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                                    {loading ? "Menyimpan..." : "Simpan Password"}
                                </button>
                            </form>
                        )}
                    </div>

                    <div className="px-6 py-3 bg-black/20 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[8px] font-bold text-gray-600 uppercase">© 2026 OBS Overlays</span>
                        <span className="text-[8px] font-bold text-gray-500 uppercase">v1.0 • TruOverlay</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
