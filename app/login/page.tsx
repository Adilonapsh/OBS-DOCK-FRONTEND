'use client';
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { User, Lock, Eye, EyeOff, Monitor, AlertCircle, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import AuthLayout from "../components/AuthLayout";
import GoogleAuthButton from "../components/GoogleAuthButton";

const inputClass =
    "block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 transition-colors focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50 focus:bg-white placeholder-slate-400 focus:outline-none";
const iconClass =
    "absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get("next") || "/dashboard";
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(() =>
        searchParams.get("error") === "oauth"
            ? "Login Google dibatalkan atau gagal. Pastikan provider Google aktif di Supabase Dashboard → Authentication → Providers, lalu coba lagi."
            : ""
    );
    const [info, setInfo] = useState(() =>
        searchParams.get("deleted") === "1" ? "Akun kamu sudah dihapus. Sampai jumpa!" : ""
    );
    const [form, setForm] = useState({ email: "", password: "", remember: true });
    const supabase = createClient();

    useEffect(() => {
        // cek session yang valid - getUser lebih reliable daripada getSession (hit server)
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) router.replace(next);
        });
        // dengarkan perubahan auth (mis. setelah signIn, cookie ter-set)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) router.replace(next);
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setInfo("");

        if (!form.email.trim() || !form.password.trim()) {
            setError("Email dan password wajib diisi.");
            return;
        }

        setLoading(true);
        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email: form.email.trim(),
            password: form.password,
        });

        if (authError) {
            let msg = authError.message;
            if (msg === "Invalid login credentials") msg = "Email atau password salah.";
            else if (msg.toLowerCase().includes("email not confirmed")) msg = "Email belum dikonfirmasi. Cek inbox/spam untuk link konfirmasi, atau matikan 'Confirm email' di Supabase Auth settings.";
            else if (msg.toLowerCase().includes("database error")) msg = "Database error: trigger private_key belum terpasang. Jalankan supabase/schema.sql di SQL Editor.";
            setError(msg);
            setLoading(false);
            return;
        }

        // Supabase bisa return user tanpa session jika email belum confirm
        if (data.user && !data.session) {
            setError("Login berhasil tapi session tidak terbentuk. Cek apakah email sudah dikonfirmasi (cek inbox/spam) atau 'Confirm email' aktif di Supabase Dashboard → Authentication → Providers → Email.");
            setLoading(false);
            return;
        }

        // verifikasi session benar-benar tersimpan (cookie + localStorage)
        const { data: { user: verifyUser }, error: verifyError } = await supabase.auth.getUser();
        if (verifyError || !verifyUser) {
            // fallback cek session
            const { data: { session: verifySession } } = await supabase.auth.getSession();
            if (!verifySession) {
                setError("Login berhasil tapi sesi tidak tersimpan. Coba refresh halaman, cek cookies tidak diblokir, dan pastikan middleware.ts ada (sudah diperbaiki). Jika tetap, coba clear cookies lalu login ulang.");
                console.error("verifyUser error", verifyError, "verifySession", verifySession, "data", data);
                setLoading(false);
                return;
            }
        }

        // simpan info tambahan untuk dock (opsional)
        try {
            localStorage.setItem("obs-login", JSON.stringify({ email: form.email.trim(), loginAt: new Date().toISOString(), userId: data.user?.id }));
            localStorage.setItem("isLoggedIn", "true");
            if (data.session) sessionStorage.setItem("dock_private_verified", data.session.access_token.slice(0, 32));
        } catch {}
        setInfo("Login berhasil! Mengalihkan...");
        // beri waktu cookie ter-set via middleware, lalu hard navigasi
        setTimeout(() => {
            router.replace(next);
            // fallback hard reload jika router.replace tidak bawa cookie
            setTimeout(() => { if (window.location.pathname === "/login") window.location.href = next; }, 800);
        }, 300);
        setLoading(false);
    };

    return (
        <AuthLayout
            title="Masuk"
            subtitle="Masuk dengan akun terdaftar untuk melanjutkan."
            footer={
                <>
                    <p>
                        Belum punya akun?{" "}
                        <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                            Daftar
                        </Link>
                    </p>
                    <p className="mt-1">
                        Butuh bantuan?{" "}
                        <span className="font-medium text-slate-700">Hubungi admin</span>
                    </p>
                </>
            }
        >
            <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                    <div role="alert" className="bg-red-50 border border-red-200 text-red-600 text-sm px-3.5 py-2.5 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}
                {info && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3.5 py-2.5 rounded-lg flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{info}</span>
                    </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                    <div className="relative">
                        <div className={iconClass}>
                            <User className="w-[18px] h-[18px]" />
                        </div>
                        <input
                            type="email"
                            id="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="email@contoh.com"
                            autoComplete="email"
                            required
                            className={inputClass}
                        />
                    </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
                    <div className="relative">
                        <div className={iconClass}>
                            <Lock className="w-[18px] h-[18px]" />
                        </div>
                        <input
                            type={showPass ? "text" : "password"}
                            id="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            placeholder="••••••••"
                            autoComplete="current-password"
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

                {/* Options Row */}
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            checked={form.remember}
                            onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                            className="h-4 w-4 accent-brand-600 border-slate-300 rounded cursor-pointer"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer select-none">
                            Ingat saya
                        </label>
                    </div>
                    <div className="text-sm">
                        <Link href="/forgot-password" className="font-medium text-brand-600 hover:text-brand-700 transition-colors">
                            Lupa password?
                        </Link>
                    </div>
                </div>

                {/* Main Login Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-600 transition-all active:scale-[0.99] gap-2 items-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {loading ? "Memproses..." : "Masuk"}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white text-slate-400 uppercase tracking-widest font-semibold">Atau</span>
                </div>
            </div>

            {/* Alternative Logins */}
            <div className="space-y-3">
                <GoogleAuthButton next={next} label="Masuk dengan Google" onError={setError} />

                <button
                    type="button"
                    onClick={() => { const gk = "guest_" + Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, "0")).join(""); sessionStorage.setItem("guest_private_key", gk); sessionStorage.setItem("dock_private_verified", gk); try { localStorage.setItem("dock_private_key", gk); } catch {} router.push("/dock"); }}
                    className="w-full flex items-center justify-center py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 transition-colors gap-3"
                >
                    <Monitor className="w-5 h-5 text-slate-600" /> Masuk sebagai Guest
                </button>
            </div>
        </AuthLayout>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 grid place-items-center text-slate-500 text-sm">Memuat…</div>}>
            <LoginContent />
        </Suspense>
    );
}
