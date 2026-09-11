'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Monitor, LayoutDashboard, LogOut, Key, Copy, RefreshCw, Users, MessageSquare, Gift, Zap, BarChart3, Settings, ExternalLink, Menu, Eye, EyeOff, Layers, Palette } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Sidebar from "../components/Sidebar";

export default function DashboardPage() {
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const [privateKey, setPrivateKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showPrivate, setShowPrivate] = useState(false);
    const [showPrivateConfirm, setShowPrivateConfirm] = useState(false);

    useEffect(() => {
        const init = async () => {
            // pakai getUser (validasi server) lebih reliable daripada getSession
            let currentUser: any = null;
            const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
            if (authErr || !authUser) {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) {
                    console.warn("Dashboard: no user/session", authErr);
                    router.replace("/login");
                    return;
                }
                currentUser = session.user;
                setUser(session.user);
            } else {
                currentUser = authUser;
                setUser(authUser);
            }
            const userId = currentUser?.id;
            const userEmail = currentUser?.email;
            const userMeta = (currentUser?.user_metadata as any);
            if (!userId) { setLoading(false); return; }
            let key: string | null = null;
            try {
                const { data: p } = await supabase.from("profiles").select("private_key, username").eq("id", userId).single();
                key = (p as any)?.private_key || null;
            } catch {}
            if (!key) {
                try {
                    const { data: s } = await supabase.from("user_private_keys").select("private_key").eq("user_id", userId).single();
                    key = (s as any)?.private_key || null;
                } catch {}
            }
            if (!key) {
                try {
                    const { data: rpc } = await (supabase as any).rpc("regenerate_private_key");
                    if (rpc) key = rpc as string;
                } catch {}
            }
            if (!key) {
                const newKey = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");
                try {
                    await supabase.from("profiles").upsert({ id: userId, email: userEmail, username: userMeta?.username, private_key: newKey } as any, { onConflict: "id" });
                    key = newKey;
                } catch {}
            }
            setPrivateKey(key);
            setLoading(false);
        };
        init();
    }, []);

    const handleCopy = async () => {
        if (privateKey) { await navigator.clipboard.writeText(privateKey); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        if (typeof window !== "undefined") {
            localStorage.removeItem("isLoggedIn");
            sessionStorage.removeItem("dock_private_verified");
        }
        router.push("/login");
    };

    // jangan block full page saat pindah - tampilkan dashboard langsung, private key load di background
    const isInitialLoading = loading && !user && !privateKey;

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex">
            <Sidebar active="dashboard" open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

            <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
            <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded text-[8px] font-black tracking-widest text-white"><LayoutDashboard className="w-3 h-3" /> DASHBOARD</span>
                    <span className="hidden md:inline text-[10px] text-gray-500 font-bold">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/dock" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black border border-white rounded-lg text-[10px] font-black uppercase"><Monitor className="w-3 h-3" /> Dock</Link>
                    <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black uppercase text-gray-300">
                        <LogOut className="w-3 h-3" /> Keluar
                    </button>
                </div>
            </header>

            <main className="flex-1 p-4 md:p-6 max-w-[1100px] w-full mx-auto space-y-6">
                <div className="bg-[#161616] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-white font-black text-[18px] tracking-tight">Halo, {(user?.user_metadata as any)?.username || user?.email?.split("@")[0] || "Streamer"}</h1>
                        <p className="text-gray-500 text-[11px] mt-1">Kelola dock, private key, dan akses websocket isolasi per user.</p>
                    </div>
                    <Link href={`/dock?key=${privateKey}`} className="inline-flex items-center gap-2 px-5 py-3 bg-white text-black border border-white hover:bg-zinc-100 rounded-xl font-black text-[11px] uppercase tracking-widest">
                        <Monitor className="w-4 h-4" /> Buka Dock
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-[#161616] border border-white/10 rounded-2xl p-5 space-y-3">
                        <h3 className="text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-2"><Key className="w-3.5 h-3.5 text-white" /> Private Key</h3>
                        <p className="text-gray-500 text-[11px]">Dipakai sebagai <span className="text-white font-bold">room</span> Jaga kerahasiaannya.</p>
                        <div className="bg-black/30 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                            <code className={`flex-1 text-[11px] font-mono-custom break-all ${showPrivate ? "text-white" : "text-white blur-[4px] select-none"}`}>{showPrivate ? (privateKey || "- belum ada -") : (privateKey ? "•".repeat(32) : "- belum ada -")}</code>
                            <button onClick={() => { if (!showPrivate) setShowPrivateConfirm(true); else setShowPrivate(false); }} className="shrink-0 w-8 h-8 grid place-items-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white" title={showPrivate ? "Sembunyikan" : "Tampilkan (konfirmasi)"}>
                                {showPrivate ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={handleCopy} className="shrink-0 px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg text-[10px] font-black uppercase text-white flex items-center gap-1"><Copy className="w-3 h-3" /> {copied ? "Copied" : "Copy"}</button>
                        </div>
                        <div className="flex gap-2">
                            <Link href={`/dock?key=${privateKey}`} className="flex-1 h-9 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white"><Monitor className="w-3 h-3" /> Buka Dock (butuh verifikasi)</Link>
                            <button onClick={async () => { if (confirm("Regenerate private key?")) { const { data } = await (supabase as any).rpc("regenerate_private_key"); if (data) setPrivateKey(data as string); } }} className="px-3 h-9 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-[10px] font-black uppercase text-red-400 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Regenerate</button>
                        </div>
                    </div>

                    <div className="bg-[#161616] border border-white/10 rounded-2xl p-5 space-y-3">
                        <h3 className="text-white font-black text-[11px] uppercase tracking-widest">Akun</h3>
                        <div className="space-y-2 text-[11px]">
                            <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-white font-bold truncate ml-2">{user?.email}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">User ID</span><span className="text-gray-400 font-mono-custom text-[9px] truncate ml-2">{user?.id?.slice(0, 8) ?? '-'}…</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Username</span><span className="text-white font-bold">{(user?.user_metadata as any)?.username || "-"}</span></div>
                        </div>
                        <div className="pt-3 border-t border-white/5 flex gap-2">
                            <Link href="/login" className="flex-1 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase text-gray-300">Ganti Akun</Link>
                            <Link href="/register" className="flex-1 h-8 flex items-center justify-center rounded-lg bg-white text-black border border-white text-[10px] font-black uppercase">Daftar Baru</Link>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/dock" className="bg-[#161616] border border-white/10 rounded-2xl p-5 hover:border-white/15 hover:bg-white/[0.03] transition-colors group">
                        <Monitor className="w-6 h-6 text-white" />
                        <h4 className="text-white font-black uppercase text-[11px] mt-3">Dock Control</h4>
                        <p className="text-gray-500 text-[11px] mt-1">OBS Studio Mode & Stream Tools isolasi private key.</p>
                        <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-black uppercase text-white group-hover:gap-2 transition-all">Buka <ExternalLink className="w-3 h-3" /></span>
                    </Link>
                    <Link href="/widgets" className="bg-[#161616] border border-white/10 rounded-2xl p-5 hover:border-white/15 hover:bg-white/[0.03] transition-colors group">
                        <Layers className="w-6 h-6 text-white" />
                        <h4 className="text-white font-black uppercase text-[11px] mt-3">Widgets</h4>
                        <p className="text-gray-500 text-[11px] mt-1">Media Player & Lyrics - 11 themes, SMTC Bridge, LRCLIB.</p>
                        <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-black uppercase text-white group-hover:gap-2 transition-all">Buka <ExternalLink className="w-3 h-3" /></span>
                    </Link>
                    <Link href="/overlay" className="bg-[#161616] border border-white/10 rounded-2xl p-5 hover:border-white/15 hover:bg-white/[0.03] transition-colors group">
                        <Palette className="w-6 h-6 text-white" />
                        <h4 className="text-white font-black uppercase text-[11px] mt-3">Overlays</h4>
                        <p className="text-gray-500 text-[11px] mt-1">Full / Chat / Gift / Like - editor tema & Browser Source.</p>
                        <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-black uppercase text-white group-hover:gap-2 transition-all">Buka <ExternalLink className="w-3 h-3" /></span>
                    </Link>
                </div>

                <div className="bg-[#161616] border border-white/10 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-[10px] text-gray-600 font-bold uppercase">© 2026 OBS Overlays</span>
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase">
                        <Link href="/dock" className="text-white hover:text-zinc-300 flex items-center gap-1"><Settings className="w-3 h-3" /> Dock</Link>
                    </div>
                </div>
                {showPrivateConfirm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={() => setShowPrivateConfirm(false)}>
                        <div onClick={e => e.stopPropagation()} className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-[360px] space-y-4 text-center">
                            <h2 className="text-white font-black">Tampilkan Private Key?</h2>
                            <p className="text-[11px] text-gray-400 leading-relaxed">Private key bersifat <span className="text-white font-bold">rahasia</span>. Jangan bagikan ke orang lain.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowPrivateConfirm(false)} className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300">Batal</button>
                                <button onClick={() => { setShowPrivate(true); setShowPrivateConfirm(false); }} className="flex-1 h-9 bg-white text-black border border-white rounded-xl text-sm font-black">Tampilkan</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            </div>
        </div>
    );
}
