'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Monitor, LayoutDashboard, LogOut, Key, Copy, RefreshCw, Users, MessageSquare, Gift, Zap, BarChart3, Settings, ExternalLink, Menu } from "lucide-react";
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

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.replace("/login"); return; }
            setUser(session.user);
            let key: string | null = null;
            try {
                const { data: p } = await supabase.from("profiles").select("private_key, username").eq("id", session.user.id).single();
                key = (p as any)?.private_key || null;
            } catch {}
            if (!key) {
                try {
                    const { data: s } = await supabase.from("user_private_keys").select("private_key").eq("user_id", session.user.id).single();
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
                    await supabase.from("profiles").upsert({ id: session.user.id, email: session.user.email, username: (session.user.user_metadata as any)?.username, private_key: newKey } as any, { onConflict: "id" });
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

    // jangan block full page saat pindah — tampilkan dashboard langsung, private key load di background
    const isInitialLoading = loading && !user && !privateKey;

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex">
            <Sidebar active="dashboard" open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

            <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
            <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 bg-blue-600/20 border border-blue-500/30 rounded text-[8px] font-black tracking-widest text-blue-400"><LayoutDashboard className="w-3 h-3" /> DASHBOARD</span>
                    <span className="hidden md:inline text-[10px] text-gray-500 font-bold">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/dock" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg text-[10px] font-black uppercase text-white"><Monitor className="w-3 h-3" /> Dock</Link>
                    <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black uppercase text-gray-300">
                        <LogOut className="w-3 h-3" /> Keluar
                    </button>
                </div>
            </header>

            <main className="flex-1 p-4 md:p-6 max-w-[1100px] w-full mx-auto space-y-6">
                <div className="bg-gradient-to-r from-blue-900/20 via-[#161616] to-cyan-900/10 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-white font-black text-[18px] tracking-tight">Halo, {(user?.user_metadata as any)?.username || user?.email?.split("@")[0] || "Streamer"} 👋</h1>
                        <p className="text-gray-500 text-[11px] mt-1">Kelola dock, private key, dan akses websocket isolasi per user.</p>
                    </div>
                    <Link href={`/dock?key=${privateKey}`} className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl text-white font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                        <Monitor className="w-4 h-4" /> Buka Dock
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-[#161616] border border-white/10 rounded-2xl p-5 space-y-3">
                        <h3 className="text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-2"><Key className="w-3.5 h-3.5 text-cyan-400" /> Private Key</h3>
                        <p className="text-gray-500 text-[11px]">Dipakai sebagai <span className="text-white font-bold">room</span> Jaga kerahasiaannya.</p>
                        <div className="bg-black/30 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                            <code className="flex-1 text-[11px] font-mono-custom break-all text-cyan-400">{privateKey || "— belum ada —"}</code>
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
                            <div className="flex justify-between"><span className="text-gray-500">User ID</span><span className="text-gray-400 font-mono-custom text-[9px] truncate ml-2">{user?.id.slice(0, 8)}…</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Username</span><span className="text-white font-bold">{(user?.user_metadata as any)?.username || "-"}</span></div>
                        </div>
                        <div className="pt-3 border-t border-white/5 flex gap-2">
                            <Link href="/login" className="flex-1 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase text-gray-300">Ganti Akun</Link>
                            <Link href="/register" className="flex-1 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase">Daftar Baru</Link>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/dock" className="bg-[#161616] border border-white/10 rounded-2xl p-5 hover:border-white/15 hover:bg-white/[0.03] transition-colors group">
                        <Monitor className="w-6 h-6 text-blue-400" />
                        <h4 className="text-white font-black uppercase text-[11px] mt-3">Dock Control</h4>
                        <p className="text-gray-500 text-[11px] mt-1">OBS Studio Mode, Stream Tools, TikTok connect isolasi private key.</p>
                        <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-black uppercase text-blue-400 group-hover:gap-2 transition-all">Buka <ExternalLink className="w-3 h-3" /></span>
                    </Link>
                    <div className="bg-[#161616] border border-white/10 rounded-2xl p-5">
                        <div className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-green-400" /><span className="text-white font-black uppercase text-[11px]">Live Chat</span></div>
                        <p className="text-gray-500 text-[11px] mt-2">Search, pin, platform logo dari <code className="bg-white/10 px-1 rounded">/public/assets/logo</code>.</p>
                        <div className="flex items-center gap-3 mt-3 text-[10px] font-mono-custom"><span className="flex items-center gap-1"><Users className="w-3 h-3" /> Realtime</span><span className="flex items-center gap-1"><Gift className="w-3 h-3" /> Gift</span><span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Aktivitas</span></div>
                    </div>
                    <div className="bg-[#161616] border border-white/10 rounded-2xl p-5">
                        <BarChart3 className="w-5 h-5 text-[#FE2C55]" />
                        <h4 className="text-white font-black uppercase text-[11px] mt-3">Grafik Realtime</h4>
                        <p className="text-gray-500 text-[11px] mt-1">Bitrate dari `outputBytes` delta & TikTok `viewerCount` → `tiktokChartData` penuhin card.</p>
                        <span className="text-[10px] text-gray-600">Stream time & Record time live dari OBS.</span>
                    </div>
                </div>

                <div className="bg-[#161616] border border-white/10 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-[10px] text-gray-600 font-bold uppercase">© 2026 OBS Overlays • Supabase Auth</span>
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase">
                        <Link href="/dock" className="text-blue-400 hover:text-blue-300 flex items-center gap-1"><Settings className="w-3 h-3" /> Dock</Link>
                        <a href="https://supabase.com/dashboard/project/tdsbidgbhltmjjdrdkla" target="_blank" className="text-gray-500 hover:text-white">Supabase →</a>
                    </div>
                </div>
            </main>
            </div>
        </div>
    );
}
