'use client';
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { User, Lock, Eye, EyeOff, LogIn, Monitor, Sparkles, AlertCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Logo from "../../components/Logo";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get("next") || "/dashboard";
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
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
                            <LogIn className="w-4 h-4 text-blue-400" /> Login
                        </h1>
                        <p className="text-gray-500 text-[10px] mt-1">Masuk dengan akun terdaftar.</p>
                    </div>

                    <form onSubmit={handleLogin} className="p-6 space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold px-3 py-2 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}
                        {info && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold px-3 py-2 rounded-lg">
                                {info}
                            </div>
                        )}

                        <div>
                            <label className="block text-[8px] font-black tracking-widest uppercase text-gray-400 mb-1.5">Email</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="email@contoh.com"
                                    className="w-full h-10 pl-9 pr-3 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[8px] font-black tracking-widest uppercase text-gray-400 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                <input
                                    type={showPass ? "text" : "password"}
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    placeholder="••••••••"
                                    className="w-full h-10 pl-9 pr-9 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-colors"
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                    {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.remember} onChange={(e) => setForm({ ...form, remember: e.target.checked })} className="w-3 h-3 accent-blue-600" />
                                <span className="text-[10px] font-bold text-gray-400">Ingat saya</span>
                            </label>
                            <button type="button" className="text-[10px] font-bold text-blue-400 hover:text-blue-300">Lupa password?</button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-10 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.35)] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                            {loading ? "Memproses..." : "Masuk"}
                        </button>

                        <div className="flex items-center gap-3 py-1">
                            <div className="flex-1 h-px bg-white/5" />
                            <span className="text-[8px] font-black tracking-widest uppercase text-gray-600">atau</span>
                            <div className="flex-1 h-px bg-white/5" />
                        </div>

                        <button type="button" onClick={() => { const gk = "guest_" + Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, "0")).join(""); sessionStorage.setItem("guest_private_key", gk); sessionStorage.setItem("dock_private_verified", gk); router.push("/dock"); }} className="w-full h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                            <Monitor className="w-3.5 h-3.5" /> Masuk sebagai Guest
                        </button>
                    </form>

                    <div className="px-6 py-3 bg-black/20 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[8px] font-bold text-gray-600 uppercase">© 2026 OBS Overlays</span>
                        <span className="text-[8px] font-bold text-gray-500 uppercase">v1.0 • TruOverlay</span>
                    </div>
                </div>

                <p className="text-center text-[10px] text-gray-600 mt-4">
                    Belum punya akun? <Link href="/register" className="text-blue-400 font-bold hover:text-blue-300">Daftar</Link> • Butuh bantuan? <span className="text-gray-400">Hubungi admin</span>
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500 text-sm">Memuat…</div>}>
            <LoginContent />
        </Suspense>
    );
}
