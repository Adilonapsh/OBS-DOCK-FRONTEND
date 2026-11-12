'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, Check, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import AuthLayout from "../components/AuthLayout";

const inputClass =
    "block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 transition-colors focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50 focus:bg-white placeholder-slate-400 focus:outline-none";
const iconClass =
    "absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400";

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
            title="Password Baru"
            subtitle="Buat password baru untuk akunmu."
            footer={
                <>
                    <p>
                        Ingat password?{" "}
                        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                            Masuk
                        </Link>
                    </p>
                    <p className="mt-1">
                        Butuh bantuan?{" "}
                        <span className="font-medium text-slate-700">Hubungi admin</span>
                    </p>
                </>
            }
        >
            {checking ? (
                <div className="flex items-center justify-center gap-2 py-6 text-slate-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memverifikasi link reset...
                </div>
            ) : !hasSession ? (
                <div className="space-y-5">
                    <div role="alert" className="bg-red-50 border border-red-200 text-red-600 text-sm px-3.5 py-2.5 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Link reset tidak valid atau sudah kedaluwarsa. Minta link baru.</span>
                    </div>
                    <Link
                        href="/forgot-password"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-600 transition-all active:scale-[0.99]"
                    >
                        Minta Link Baru
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div role="alert" className="bg-red-50 border border-red-200 text-red-600 text-sm px-3.5 py-2.5 rounded-lg flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3.5 py-2.5 rounded-lg flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{success}</span>
                        </div>
                    )}

                    {/* New Password Field */}
                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password Baru</label>
                        <div className="relative">
                            <div className={iconClass}>
                                <Lock className="w-[18px] h-[18px]" />
                            </div>
                            <input
                                type={showPass ? "text" : "password"}
                                id="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                placeholder="•••••••• (min 6)"
                                autoComplete="new-password"
                                required
                                className={`${inputClass} pr-10`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                            >
                                {showPass ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                        <label htmlFor="confirm" className="block text-sm font-medium text-slate-700">Konfirmasi Password</label>
                        <div className="relative">
                            <div className={iconClass}>
                                <Lock className="w-[18px] h-[18px]" />
                            </div>
                            <input
                                type={showConfirm ? "text" : "password"}
                                id="confirm"
                                value={form.confirm}
                                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                                placeholder="Ulangi password baru"
                                autoComplete="new-password"
                                required
                                className={`${inputClass} pr-10`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                aria-label={showConfirm ? "Sembunyikan password" : "Tampilkan password"}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                            >
                                {showConfirm ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                            </button>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-600 transition-all active:scale-[0.99] gap-2 items-center disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {loading ? "Menyimpan..." : "Simpan Password"}
                    </button>

                    <Link
                        href="/login"
                        className="w-full flex items-center justify-center py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 transition-colors gap-3"
                    >
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Login
                    </Link>
                </form>
            )}
        </AuthLayout>
    );
}
