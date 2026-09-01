'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User, Mail, Lock, Eye, EyeOff, UserPlus, Monitor, Sparkles, CheckCircle2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

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
            else if (msg.includes("Database error saving new user")) msg = "Database error saving new user: private_key/trigger belum terpasang. Jalankan supabase/schema.sql atau 002_add_private_key.sql di Supabase SQL Editor.";
            setError(msg);
            setLoading(false);
            return;
        }

        // langsung tambahkan private key (trigger handle_new_user sudah buat, tapi pastikan ada)
        if (data.user) {
            // tunggu trigger selesai
            await new Promise(r => setTimeout(r, 600));
            let privateKey: string | null = null;
            try {
                const { data: prof } = await supabase.from("profiles").select("private_key").eq("id", data.user.id).single();
                privateKey = (prof as any)?.private_key || null;
            } catch {}
            if (!privateKey && data.session) {
                // fallback generate client-side jika trigger belum jalan / RLS block
                try {
                    const newKey = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");
                    await supabase.from("profiles").update({ private_key: newKey } as any).eq("id", data.user.id);
                    await supabase.from("user_private_keys").upsert({ user_id: data.user.id, private_key: newKey } as any);
                    privateKey = newKey;
                } catch {}
            }
            if (privateKey) {
                localStorage.setItem("user_private_key", privateKey);
            }
        }

        // jika supabase butuh konfirmasi email, session bisa null
        if (data.user && !data.session) {
            setSuccess("Akun dibuat! Private key sudah dibuat. Cek email untuk konfirmasi, lalu masuk.");
        } else {
            localStorage.setItem("obs-login", JSON.stringify({ email: form.email.trim(), username: form.username.trim(), userId: data.user?.id, loginAt: new Date().toISOString() }));
            localStorage.setItem("isLoggedIn", "true");
            setSuccess("Registrasi berhasil! Private key dibuat. Mengalihkan ke Dashboard...");
            setTimeout(() => router.push("/dashboard"), 800);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-32 -left-32 w-[480px] h-[480px] bg-blue-600/20 blur-[120px] rounded-full" />
                <div className="absolute -bottom-32 -right-32 w-[480px] h-[480px] bg-cyan-500/15 blur-[120px] rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] bg-[#FE2C55]/5 blur-[120px] rounded-full" />
            </div>

            <div className="relative w-full max-w-[440px]">
                <div className="flex flex-col items-center gap-3 mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-lg">
                            <Image src="/assets/logo/obs.png" alt="OBS" width={22} height={22} className="object-contain" />
                        </div>
                        <span className="font-black tracking-tighter text-white text-[18px]">OBS OVERLAYS</span>
                        <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-[8px] font-black tracking-widest text-white">DOCK</span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-blue-400" /> Buat Akun Baru
                    </p>
                </div>

                <div className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
                    <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-r from-blue-900/15 via-transparent to-cyan-900/10">
                        <h1 className="text-white font-black text-[14px] uppercase tracking-wide flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-blue-400" /> Daftar Akun Supabase
                        </h1>
                        <p className="text-gray-500 text-[10px] mt-1">Akun akan disimpan di Supabase Authentication. Cek email jika konfirmasi aktif.</p>
                    </div>

                    <form onSubmit={handleRegister} className="p-6 space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold px-3 py-2 rounded-lg">{error}</div>
                        )}
                        {success && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold px-3 py-2 rounded-lg flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5" /> {success}
                            </div>
                        )}

                        <div>
                            <label className="block text-[8px] font-black tracking-widest uppercase text-gray-400 mb-1.5">Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="adilonapsh" className="w-full h-10 pl-9 pr-3 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-colors" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[8px] font-black tracking-widest uppercase text-gray-400 mb-1.5">Email Supabase</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@contoh.com" className="w-full h-10 pl-9 pr-3 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-colors" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[8px] font-black tracking-widest uppercase text-gray-400 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                <input type={showPass ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="•••••••• (min 6)" className="w-full h-10 pl-9 pr-9 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-colors" />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                    {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[8px] font-black tracking-widest uppercase text-gray-400 mb-1.5">Konfirmasi Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                <input type={showConfirm ? "text" : "password"} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="Ulangi password" className="w-full h-10 pl-9 pr-9 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-colors" />
                                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                    {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full h-10 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.35)] disabled:opacity-60 disabled:cursor-not-allowed transition-all">
                            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                            {loading ? "Memproses..." : "Buat Akun"}
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
                        <Link href="/login" className="text-[8px] font-black tracking-widest uppercase text-blue-400 hover:text-blue-300">Sudah punya akun? Masuk</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
