'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User, Mail, Lock, Image as ImageIcon, Globe, Key, Copy, RefreshCw, Save, LogOut, LayoutDashboard, Monitor, Eye, EyeOff, Upload, CheckCircle2, Menu } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Sidebar from "../components/Sidebar";

const TIMEZONES = [
    "Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura",
    "Asia/Singapore", "Asia/Kuala_Lumpur", "Asia/Bangkok", "Asia/Tokyo", "Asia/Seoul", "Asia/Shanghai",
    "UTC", "Europe/London", "Europe/Berlin", "America/New_York", "America/Los_Angeles",
];

export default function AccountPage() {
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
    const [showPrivate, setShowPrivate] = useState(false);
    const [showPrivateConfirm, setShowPrivateConfirm] = useState(false);
    const [form, setForm] = useState({ username: "", email: "", avatar_url: "", timezone: "Asia/Jakarta", private_key: "" });
    const [pass, setPass] = useState({ current: "", next: "", confirm: "", show: false });
    const [uploading, setUploading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.replace("/login"); return; }
            setUser(session.user);
            const { data: prof } = await supabase.from("profiles").select("username, email, avatar_url, timezone, private_key").eq("id", session.user.id).single();
            const p = prof as any;
            // fallback ke user_private_keys jika profiles.private_key null
            let pk = p?.private_key;
            if (!pk) {
                const { data: sec } = await supabase.from("user_private_keys").select("private_key").eq("user_id", session.user.id).single();
                pk = (sec as any)?.private_key || null;
            }
            setForm({
                username: p?.username || (session.user.user_metadata as any)?.username || "",
                email: p?.email || session.user.email || "",
                avatar_url: p?.avatar_url || (session.user.user_metadata as any)?.avatar_url || "",
                timezone: p?.timezone || "Asia/Jakarta",
                private_key: pk || "",
            });
            setLoading(false);
        };
        init();
    }, []);

    const handleSaveProfile = async () => {
        setMsg(null);
        if (!user) return;
        setSaving(true);
        const { error } = await supabase.from("profiles").upsert({
            id: user.id,
            username: form.username.trim(),
            email: form.email.trim(),
            avatar_url: form.avatar_url.trim(),
            timezone: form.timezone,
        } as any, { onConflict: "id" });
        if (error) {
            setMsg({ type: "error", text: error.message });
        } else {
            // sinkron ke auth metadata juga
            try { await supabase.auth.updateUser({ data: { username: form.username.trim(), avatar_url: form.avatar_url.trim() } }); } catch { }
            setMsg({ type: "success", text: "Profil disimpan." });
        }
        setSaving(false);
    };

    const handleEmailSave = async () => {
        if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            setMsg({ type: "error", text: "Email tidak valid." }); return;
        }
        setSaving(true);
        const { error } = await supabase.auth.updateUser({ email: form.email.trim() });
        if (error) setMsg({ type: "error", text: error.message });
        else setMsg({ type: "success", text: "Email update dikirim. Cek inbox untuk konfirmasi." });
        setSaving(false);
    };

    const handlePasswordChange = async () => {
        setMsg(null);
        if (!pass.next || !pass.confirm) { setMsg({ type: "error", text: "Password baru & konfirmasi wajib." }); return; }
        if (pass.next.length < 6) { setMsg({ type: "error", text: "Password minimal 6 karakter." }); return; }
        if (pass.next !== pass.confirm) { setMsg({ type: "error", text: "Konfirmasi tidak cocok." }); return; }
        setSaving(true);
        const { error } = await supabase.auth.updateUser({ password: pass.next });
        if (error) setMsg({ type: "error", text: error.message });
        else { setMsg({ type: "success", text: "Password diperbarui." }); setPass({ current: "", next: "", confirm: "", show: false }); }
        setSaving(false);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        if (file.size > 2 * 1024 * 1024) { setMsg({ type: "error", text: "File max 2MB." }); return; }
        setUploading(true);
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
        if (upErr) {
            setMsg({ type: "error", text: "Upload gagal: " + upErr.message + " (buat bucket 'avatars' public di Storage)" });
            setUploading(false); return;
        }
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        const publicUrl = urlData.publicUrl;
        setForm(prev => ({ ...prev, avatar_url: publicUrl }));
        await supabase.from("profiles").update({ avatar_url: publicUrl } as any).eq("id", user.id);
        setMsg({ type: "success", text: "Avatar diupload." });
        setUploading(false);
    };

    const handleCopyPrivate = async () => {
        if (form.private_key) { await navigator.clipboard.writeText(form.private_key); setMsg({ type: "success", text: "Private key dicopy." }); }
    };

    const handleRegenerate = async () => {
        if (!confirm("Regenerate private key? Key lama tidak bisa dipakai untuk bypass/websocket.")) return;
        const { data, error } = await (supabase as any).rpc("regenerate_private_key");
        if (error) { setMsg({ type: "error", text: error.message }); return; }
        const newKey = data as string;
        setForm(prev => ({ ...prev, private_key: newKey }));
        if (typeof window !== "undefined") {
            sessionStorage.setItem("dock_private_verified", newKey);
            sessionStorage.setItem("bypass_private_key", newKey);
        }
        setMsg({ type: "success", text: "Private key baru dibuat." });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        if (typeof window !== "undefined") { localStorage.removeItem("isLoggedIn"); sessionStorage.clear(); }
        router.push("/login");
    };

    // jangan block full page - tampilkan layout, data load background
    const isInitialLoading = loading && !user;

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex">
            <Sidebar active="account" open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

            <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
                <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 bg-white/10 border border-white/10 rounded text-[8px] font-black tracking-widest text-white">ACCOUNT</span>
                        <span className="hidden md:inline text-[10px] text-gray-500 font-bold truncate max-w-[200px]">{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard" className="hidden sm:inline-flex px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black uppercase text-gray-300 items-center gap-1"><LayoutDashboard className="w-3 h-3" /> Dashboard</Link>
                        <Link href="/dock" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-[10px] font-black uppercase text-white flex items-center gap-1"><Monitor className="w-3 h-3" /> Dock</Link>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-6 max-w-[900px] w-full mx-auto space-y-6">
                    {msg && (
                        <div className={`border px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 ${msg.type === "error" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}>
                            {msg.type === "success" && <CheckCircle2 className="w-3.5 h-3.5" />} {msg.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden">
                                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-blue-600/10">
                                    <h3 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><User className="w-3.5 h-3.5 text-blue-400" /> Profil</h3>
                                    <span className="text-[9px] font-bold text-gray-500">Supabase</span>
                                </div>
                                <div className="p-5 space-y-4">

                                <div>
                                    <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1.5">Username</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                        <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="adilonapsh" className="w-full h-10 pl-9 pr-3 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1.5">Email</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full h-10 pl-9 pr-3 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50" />
                                        </div>
                                        <button onClick={handleEmailSave} disabled={saving} className="px-4 h-10 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white">Update Email</button>
                                    </div>
                                    <p className="text-[9px] text-gray-600 mt-1">Ganti email butuh konfirmasi via inbox.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1.5">Avatar URL</label>
                                        <div className="relative">
                                            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                            <input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://..." className="w-full h-10 pl-9 pr-3 bg-white/5 border border-white/10 rounded-xl text-[11px] font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1.5">Upload Avatar (max 2MB)</label>
                                        <label className="flex items-center gap-2 h-10 px-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10">
                                            <Upload className="w-3.5 h-3.5 text-gray-500" />
                                            <span className="text-[11px] font-bold text-gray-400">{uploading ? "Mengupload..." : "Pilih file"}</span>
                                            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                                        </label>
                                    </div>
                                </div>

                                {form.avatar_url && (
                                    <div className="flex items-center gap-3 bg-black/20 border border-white/5 rounded-xl p-3">
                                        <img src={form.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                        <span className="text-[11px] text-gray-400 truncate">{form.avatar_url}</span>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1.5">Timezone</label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                        <select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className="w-full h-10 pl-9 pr-3 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-white focus:outline-none focus:border-blue-500/50">
                                            {TIMEZONES.map(tz => <option key={tz} value={tz} className="bg-[#161616]">{tz}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <button onClick={handleSaveProfile} disabled={saving} className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60">
                                    <Save className="w-3.5 h-3.5" /> {saving ? "Menyimpan..." : "Simpan Profil"}
                                </button>
                                </div>
                            </div>

                            <div className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden">
                                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-blue-600/10">
                                    <h3 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-blue-400" /> Ganti Password</h3>
                                    <span className="text-[9px] font-bold text-gray-500">Supabase Auth</span>
                                </div>
                                <div className="p-5 space-y-4">
                                <div>
                                    <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1.5">Password Baru</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                        <input type={pass.show ? "text" : "password"} value={pass.next} onChange={(e) => setPass({ ...pass, next: e.target.value })} placeholder="••••••••" className="w-full h-10 pl-9 pr-9 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50" />
                                        <button type="button" onClick={() => setPass({ ...pass, show: !pass.show })} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"><Eye className={`w-3.5 h-3.5 ${pass.show ? "hidden" : ""}`} /><EyeOff className={`w-3.5 h-3.5 ${pass.show ? "" : "hidden"}`} /></button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1.5">Konfirmasi Password Baru</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                        <input type={pass.show ? "text" : "password"} value={pass.confirm} onChange={(e) => setPass({ ...pass, confirm: e.target.value })} placeholder="Ulangi password baru" className="w-full h-10 pl-9 pr-9 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50" />
                                    </div>
                                </div>
                                <button onClick={handlePasswordChange} disabled={saving} className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] uppercase tracking-widest">Update Password</button>
                                </div>
                            </div>
                            </div>
                            <div className="space-y-4">
                            <div className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden">
                                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-blue-600/10">
                                    <h3 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Key className="w-3.5 h-3.5 text-blue-400" /> Private Key</h3>
                                    <span className="text-[9px] font-bold text-gray-500">Bypass</span>
                                </div>
                                <div className="p-5 space-y-3">
                                <p className="text-[10px] text-gray-500">Bypass tanpa login + isolasi websocket TikTok per user.</p>
                                <div className="bg-black/30 border border-white/10 rounded-xl p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[8px] font-black tracking-widest uppercase text-gray-500">Private Key</span>
                                        <button onClick={() => { if (!showPrivate) setShowPrivateConfirm(true); else setShowPrivate(false); }} className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1">{showPrivate ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />} {showPrivate ? "Hide" : "Show"}</button>
                                    </div>
                                    <code className={`block text-[10px] font-mono-custom break-all p-2 bg-white/5 rounded border border-white/5 ${showPrivate ? "text-cyan-400" : "text-white blur-[4px] select-none"}`}>{showPrivate ? form.private_key : form.private_key ? "•".repeat(32) : "- belum ada -"}</code>
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={async () => { await navigator.clipboard.writeText(form.private_key); setMsg({ type: "success", text: "Private key dicopy." }); }} className="flex-1 h-8 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg text-[10px] font-black uppercase text-white flex items-center justify-center gap-1"><Copy className="w-3 h-3" /> Copy</button>
                                        <button onClick={async () => { if (!confirm("Regenerate? Key lama tidak bisa dipakai.")) return; const { data } = await (supabase as any).rpc("regenerate_private_key"); if (data) { setForm(prev => ({ ...prev, private_key: data as string })); setMsg({ type: "success", text: "Private key baru dibuat." }); } }} className="flex-1 h-8 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-[10px] font-black uppercase text-red-400 flex items-center justify-center gap-1"><RefreshCw className="w-3 h-3" /> Regenerate</button>
                                    </div>
                                </div>
                                <div className="bg-blue-600/5 border border-blue-600/10 rounded-lg p-2 text-[10px] text-blue-300">Gunakan <code className="bg-white/10 px-1 rounded">?key=PRIVATE_KEY</code> untuk overlay public tanpa login.</div>
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
                            <div className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden">
                                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-blue-600/10">
                                    <h3 className="text-white font-black uppercase text-[11px] tracking-widest">Akun</h3>
                                    <span className="text-[9px] font-bold text-gray-500">Supabase</span>
                                </div>
                                <div className="p-5 space-y-3">
                                <div className="space-y-2 text-[11px]">
                                    <div className="flex justify-between"><span className="text-gray-500">User ID</span><span className="text-gray-400 font-mono-custom text-[9px]">{user?.id?.slice(0, 8) ?? '-'}…</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-white font-bold truncate ml-2">{user?.email}</span></div>
                                </div>
                                <button onClick={handleLogout} className="w-full mt-4 h-9 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 font-black text-[10px] uppercase flex items-center justify-center gap-2"><LogOut className="w-3.5 h-3.5" /> Logout</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
