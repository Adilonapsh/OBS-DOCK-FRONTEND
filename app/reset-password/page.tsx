'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle, Sparkles, LogIn } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import AuthLayout from "../components/AuthLayout";

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
        <AuthLayout
            icon={<KeyRound className="w-4 h-4 text-blue-400" />}
            title="Password Baru"
            subtitle="Buat password baru untuk akunmu."
            tagline={
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-blue-400" /> TruOverlay • Stream Control
                </p>
            }
        >
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
        </AuthLayout>
    );
}
