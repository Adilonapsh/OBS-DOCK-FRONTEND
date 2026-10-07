'use client';
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, KeyRound, Send, CheckCircle2, AlertCircle, ArrowLeft, Sparkles } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import AuthLayout from "../components/AuthLayout";

function ForgotPasswordContent() {
    const searchParams = useSearchParams();
    const expired = searchParams.get("error") === "expired";
    const supabase = createClient();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(expired ? "Link reset sudah kedaluwarsa atau tidak valid. Minta link baru di bawah." : "");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!email.trim()) {
            setError("Email wajib diisi.");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError("Format email tidak valid.");
            return;
        }

        setLoading(true);
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
        });
        setLoading(false);

        if (resetError) {
            setError(resetError.message);
            return;
        }
        setSuccess("Link reset dikirim! Cek inbox/spam email kamu, link berlaku terbatas. Setelah klik link, kamu akan diarahkan untuk membuat password baru.");
    };

    return (
        <AuthLayout
            icon={<KeyRound className="w-4 h-4 text-blue-400" />}
            title="Lupa Password"
            subtitle="Masukkan email terdaftar, kami kirim link reset."
            tagline={
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-blue-400" /> TruOverlay • Stream Control
                </p>
            }
        >
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
                            <label className="block text-[8px] font-black tracking-widest uppercase text-gray-400 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@contoh.com"
                                    className="w-full h-10 pl-9 pr-3 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-colors"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-10 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            {loading ? "Mengirim..." : "Kirim Link Reset"}
                        </button>

                        <Link href="/login" className="w-full h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Login
                        </Link>
                    </form>
        </AuthLayout>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500 text-sm">Memuat…</div>}>
            <ForgotPasswordContent />
        </Suspense>
    );
}
