'use client';
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Send, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import AuthLayout from "../components/AuthLayout";

const inputClass =
    "block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 transition-colors focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50 focus:bg-white placeholder-slate-400 focus:outline-none";

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
            title="Lupa Password"
            subtitle="Masukkan email terdaftar, kami kirim link reset."
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

                {/* Email Field */}
                <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Mail className="w-[18px] h-[18px]" />
                        </div>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@contoh.com"
                            autoComplete="email"
                            required
                            className={inputClass}
                        />
                    </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                    Kami akan mengirim tautan aman ke email tersebut. Tautan hanya berlaku untuk waktu terbatas.
                </p>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-600 transition-all active:scale-[0.99] gap-2 items-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {loading ? "Mengirim..." : "Kirim Link Reset"}
                </button>

                <Link
                    href="/login"
                    className="w-full flex items-center justify-center py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 transition-colors gap-3"
                >
                    <ArrowLeft className="w-4 h-4" /> Kembali ke Login
                </Link>
            </form>
        </AuthLayout>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 grid place-items-center text-slate-500 text-sm">Memuat…</div>}>
            <ForgotPasswordContent />
        </Suspense>
    );
}
