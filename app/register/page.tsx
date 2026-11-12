'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, Eye, EyeOff, UserPlus, Monitor, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import AuthLayout from "../components/AuthLayout";
import GoogleAuthButton from "../components/GoogleAuthButton";

const inputClass =
    "block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 transition-colors focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50 focus:bg-white placeholder-slate-400 focus:outline-none";
const iconClass =
    "absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400";

export default function RegisterPage() {
    const router = useRouter();
    const supabase = createClient();
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!form.username.trim() || !form.email.trim() || !form.password.trim() || !form.confirm.trim()) {
            setError("Semua field wajib diisi.");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            setError("Format email tidak valid.");
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
        const { data, error: authError } = await supabase.auth.signUp({
            email: form.email.trim(),
            password: form.password,
            options: {
                data: { username: form.username.trim() },
                emailRedirectTo: `${window.location.origin}/login`,
            },
        });

        if (authError) {
            let msg = authError.message;
            if (msg.includes("already registered")) msg = "Email sudah terdaftar. Silakan masuk.";
            else if (msg.includes("Database error saving new user")) msg = "Terjadi galat sistem saat membuat akun. Coba lagi atau hubungi admin.";
            setError(msg);
            setLoading(false);
            return;
        }

        // jika verifikasi email aktif, session bisa null
        if (data.user && !data.session) {
            setSuccess("Akun berhasil dibuat. Cek email untuk konfirmasi, lalu masuk.");
        } else {
            localStorage.setItem("obs-login", JSON.stringify({ email: form.email.trim(), username: form.username.trim(), userId: data.user?.id, loginAt: new Date().toISOString() }));
            localStorage.setItem("isLoggedIn", "true");
            setSuccess("Registrasi berhasil! Mengalihkan ke Dashboard...");
            setTimeout(() => router.push("/dashboard"), 800);
        }
        setLoading(false);
    };

    return (
        <AuthLayout
            title="Buat Akun"
            subtitle="Daftar untuk menyimpan widget dan private key kamu."
            footer={
                <>
                    <p>
                        Sudah punya akun?{" "}
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
            <form onSubmit={handleRegister} className="space-y-5">
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

                {/* Username Field */}
                <div className="space-y-2">
                    <label htmlFor="username" className="block text-sm font-medium text-slate-700">Username</label>
                    <div className="relative">
                        <div className={iconClass}>
                            <User className="w-[18px] h-[18px]" />
                        </div>
                        <input
                            type="text"
                            id="username"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            placeholder="adilonapsh"
                            autoComplete="username"
                            required
                            className={inputClass}
                        />
                    </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                    <div className="relative">
                        <div className={iconClass}>
                            <Mail className="w-[18px] h-[18px]" />
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
                            placeholder="Ulangi password"
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

                {/* Main Register Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-600 transition-all active:scale-[0.99] gap-2 items-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    {loading ? "Memproses..." : "Buat Akun"}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                </button>

                <p className="text-center text-xs text-slate-500 leading-relaxed">
                    Dengan mendaftar, kamu menyetujui{" "}
                    <Link href="/terms" className="font-semibold text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-brand-600">
                        Syarat &amp; Ketentuan
                    </Link>{" "}
                    dan{" "}
                    <Link href="/privacy" className="font-semibold text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-brand-600">
                        Kebijakan Privasi
                    </Link>{" "}
                    kami.
                </p>
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

            {/* Alternative Signups */}
            <div className="space-y-3">
                <GoogleAuthButton next="/dashboard" label="Daftar dengan Google" onError={setError} />

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
