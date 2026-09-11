'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import { Monitor, Radio, Settings, Save, TestTube, Eye, EyeOff, Menu, LayoutDashboard, Server, Plus, Trash2, Video, ExternalLink } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Sidebar from "../components/Sidebar";
import { gooeyToast } from "goey-toast";
import Image from "next/image";
import { encrypt, decrypt } from "../utils/encryption";

export default function ConfigPage() {
    const supabase = createClient();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [showObsPass, setShowObsPass] = useState(false);
    const [showSbPass, setShowSbPass] = useState(false);
    const [saving, setSaving] = useState<string | null>(null);
    const [testing, setTesting] = useState<string | null>(null);

    const [obsConfig, setObsConfig] = useState({ address: "127.0.0.1", port: "4455", password: "", autoConnect: true });
    const [sbConfig, setSbConfig] = useState({ address: "127.0.0.1", port: "8080", endpoint: "streamerbot", password: "", autoConnect: true });
    const [tiktokConfig, setTiktokConfig] = useState({ username: "", autoConnect: false });
    const [mtxServers, setMtxServers] = useState<Array<{ id: string; serverName: string; apiUrl: string; playerUrlBase: string; basicUser: string; basicPass: string; showPass?: boolean }>>([]);
    const [mtxShowPass, setMtxShowPass] = useState<Record<string, boolean>>({});
    const [editingMtxId, setEditingMtxId] = useState<string | null>(null);

    const getEncKey = () => {
        if (typeof window !== "undefined") {
            return sessionStorage.getItem("bypass_private_key") || sessionStorage.getItem("dock_private_verified") || new URLSearchParams(window.location.search).get("key") || "obs-overlays-default-key";
        }
        return "obs-overlays-default-key";
    };

    useEffect(() => {
        const load = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) setUser(session.user);
            const encKey = getEncKey();

            // coba ambil via private_key bypass dulu (prioritas jika ?key= ada)
            const bypassKey = typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("key") || sessionStorage.getItem("bypass_private_key") || sessionStorage.getItem("dock_private_verified")) : null;
            if (bypassKey) {
                try {
                    const { data: all } = await (supabase as any).rpc("get_all_by_private_key", { p_key: bypassKey });
                    if (all && !all.error) {
                        if (all.obs_config) {
                            const decPass = all.obs_config.password ? await decrypt(all.obs_config.password, encKey).catch(() => all.obs_config.password) : "";
                            // jika decrypt gagal (plain lama), pakai plain
                            const pwd = decPass || all.obs_config.password || "";
                            setObsConfig({ address: all.obs_config.address, port: all.obs_config.port, password: pwd, autoConnect: all.obs_config.auto_connect });
                        }
                        if (all.streamerbot_config) {
                            const decPass = all.streamerbot_config.password ? await decrypt(all.streamerbot_config.password, encKey).catch(() => all.streamerbot_config.password) : "";
                            setSbConfig({ address: all.streamerbot_config.address, port: all.streamerbot_config.port, endpoint: all.streamerbot_config.endpoint, password: decPass || all.streamerbot_config.password || "", autoConnect: all.streamerbot_config.auto_connect });
                        }
                        if (all.tiktok_config) setTiktokConfig({ username: all.tiktok_config.username || "", autoConnect: all.tiktok_config.auto_connect });
                        return;
                    }
                } catch {}
            }

            // fallback: ambil dari database via session (auth)
            if (session) {
                const { data: obs } = await supabase.from("obs_configs").select("*").eq("user_id", session.user.id).single();
                if (obs) {
                    const dec = (obs as any).password ? await decrypt((obs as any).password, encKey).catch(() => (obs as any).password) : "";
                    setObsConfig({ address: (obs as any).address, port: (obs as any).port, password: dec || (obs as any).password || "", autoConnect: (obs as any).auto_connect });
                }
                const { data: sb } = await supabase.from("streamerbot_configs").select("*").eq("user_id", session.user.id).single();
                if (sb) {
                    const dec = (sb as any).password ? await decrypt((sb as any).password, encKey).catch(() => (sb as any).password) : "";
                    setSbConfig({ address: (sb as any).address, port: (sb as any).port, endpoint: (sb as any).endpoint, password: dec || (sb as any).password || "", autoConnect: (sb as any).auto_connect });
                }
                const { data: tt } = await supabase.from("tiktok_configs").select("*").eq("user_id", session.user.id).single();
                if (tt) setTiktokConfig({ username: (tt as any).username || "", autoConnect: (tt as any).auto_connect });
            } else if (!bypassKey) {
                gooeyToast.error("Butuh login atau private_key");
            }
        };
        load();
    }, []);

    useEffect(() => {
        const loadMtx = async () => {
            const encKey = getEncKey();
            const bypassKey = typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("key") || sessionStorage.getItem("bypass_private_key") || sessionStorage.getItem("dock_private_verified")) : null;
            if (bypassKey) {
                try {
                    const { data: mtx } = await (supabase as any).rpc("get_mediatx_by_private_key", { p_key: bypassKey });
                    if (Array.isArray(mtx) && mtx.length > 0) {
                        const decMtx = await Promise.all(mtx.map(async (r: any) => ({
                            id: r.id,
                            serverName: r.server_name,
                            apiUrl: r.api_url,
                            playerUrlBase: r.player_url_base,
                            basicUser: r.basic_user || "",
                            basicPass: r.basic_pass ? await decrypt(r.basic_pass, encKey).catch(() => r.basic_pass) : "",
                        })));
                        setMtxServers(decMtx);
                        return;
                    }
                } catch {}
            }
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: mtx } = await supabase.from("mediatx_servers").select("*").eq("user_id", session.user.id).order("created_at");
                if (mtx && (mtx as any[]).length > 0) {
                    const decMtx = await Promise.all((mtx as any[]).map(async r => ({
                        id: r.id,
                        serverName: r.server_name,
                        apiUrl: r.api_url,
                        playerUrlBase: r.player_url_base,
                        basicUser: r.basic_user || "",
                        basicPass: r.basic_pass ? await decrypt(r.basic_pass, encKey).catch(() => r.basic_pass) : "",
                    })));
                    setMtxServers(decMtx);
                    return;
                }
            }
            // fallback localStorage untuk guest / private key belum ada di DB
            try {
                const raw = localStorage.getItem("mtx-servers");
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0) setMtxServers(parsed);
                }
            } catch {}
        };
        loadMtx();
    }, []);

    const saveObs = async () => {
        setSaving("obs");
        const encKey = getEncKey();
        const encPass = obsConfig.password ? await encrypt(obsConfig.password, encKey) : "";
        const { data: { session } } = await supabase.auth.getSession();
        let error: any = null;
        if (session) {
            const res = await supabase.from("obs_configs").upsert({ user_id: session.user.id, address: obsConfig.address, port: obsConfig.port, password: encPass, auto_connect: obsConfig.autoConnect } as any, { onConflict: "user_id" });
            error = res.error;
        } else {
            const bypassKey = typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("key") || sessionStorage.getItem("bypass_private_key") || sessionStorage.getItem("dock_private_verified")) : null;
            if (bypassKey) {
                const res: any = await (supabase as any).rpc("upsert_obs_config_by_private_key", { p_key: bypassKey, p_address: obsConfig.address, p_port: obsConfig.port, p_password: encPass, p_auto: obsConfig.autoConnect });
                error = res.error;
            } else {
                gooeyToast.error("Butuh login atau private_key");
                setSaving(null); return;
            }
        }
        if (error) gooeyToast.error(error.message); else { localStorage.setItem("obs-config", JSON.stringify(obsConfig)); gooeyToast.success("OBS config disimpan"); }
        setSaving(null);
    };

    const saveSb = async () => {
        setSaving("sb");
        const encKey = getEncKey();
        const encPass = sbConfig.password ? await encrypt(sbConfig.password, encKey) : "";
        const { data: { session } } = await supabase.auth.getSession();
        let error: any = null;
        if (session) {
            const res = await supabase.from("streamerbot_configs").upsert({ user_id: session.user.id, address: sbConfig.address, port: sbConfig.port, endpoint: sbConfig.endpoint, password: encPass, auto_connect: sbConfig.autoConnect } as any, { onConflict: "user_id" });
            error = res.error;
        } else {
            const bypassKey = typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("key") || sessionStorage.getItem("bypass_private_key") || sessionStorage.getItem("dock_private_verified")) : null;
            if (bypassKey) {
                const res: any = await (supabase as any).rpc("upsert_streamerbot_config_by_private_key", { p_key: bypassKey, p_address: sbConfig.address, p_port: sbConfig.port, p_endpoint: sbConfig.endpoint, p_password: encPass, p_auto: sbConfig.autoConnect });
                error = res.error;
            } else {
                gooeyToast.error("Butuh login atau private_key untuk simpan ke database");
                setSaving(null); return;
            }
        }
        if (error) gooeyToast.error(error.message); else { localStorage.setItem("sb-config", JSON.stringify(sbConfig)); gooeyToast.success("Streamer.bot config disimpan"); }
        setSaving(null);
    };

    const saveTiktok = async () => {
        setSaving("tt");
        const { data: { session } } = await supabase.auth.getSession();
        let error: any = null;
        if (session) {
            const res = await supabase.from("tiktok_configs").upsert({ user_id: session.user.id, username: tiktokConfig.username, auto_connect: tiktokConfig.autoConnect } as any, { onConflict: "user_id" });
            error = res.error;
        } else {
            const bypassKey = typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("key") || sessionStorage.getItem("bypass_private_key") || sessionStorage.getItem("dock_private_verified")) : null;
            if (bypassKey) {
                const res: any = await (supabase as any).rpc("upsert_tiktok_config_by_private_key", { p_key: bypassKey, p_username: tiktokConfig.username, p_auto: tiktokConfig.autoConnect });
                error = res.error;
            } else {
                gooeyToast.error("Butuh login atau private_key");
                setSaving(null); return;
            }
        }
        if (error) gooeyToast.error(error.message); else { localStorage.setItem("tiktok-config", JSON.stringify(tiktokConfig)); gooeyToast.success("TikTok config disimpan ke database"); }
        setSaving(null);
    };

    const addMtxServer = () => {
        const id = typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `tmp_${Date.now()}`;
        setMtxServers(prev => [...prev, { id, serverName: "", apiUrl: "", playerUrlBase: "", basicUser: "", basicPass: "" }]);
        setEditingMtxId(id);
    };
    const updateMtx = (id: string, field: string, value: string) => {
        setMtxServers(prev => prev.map(s => s.id === id ? { ...s, [field]: value } as any : s));
    };
    const removeMtx = async (id: string) => {
        if (!confirm("Hapus server MediaMTX ini?")) return;
        const bypassKey = typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("key") || sessionStorage.getItem("bypass_private_key") || sessionStorage.getItem("dock_private_verified")) : null;
        const { data: { session } } = await supabase.auth.getSession();
        if (bypassKey) {
            await (supabase as any).rpc("delete_mediatx_by_private_key", { p_key: bypassKey, p_id: id });
        } else if (session) {
            await supabase.from("mediatx_servers").delete().eq("id", id).eq("user_id", session.user.id);
        }
        setMtxServers(prev => prev.filter(s => s.id !== id));
        gooeyToast.success("Server dihapus");
    };
    const saveMtx = async (srv: typeof mtxServers[number]) => {
        if (!srv.serverName.trim() || !srv.apiUrl.trim()) {
            gooeyToast.error("Server Name dan Path API URL wajib diisi");
            return;
        }
        setSaving(`mtx-${srv.id}`);
        const encKey = getEncKey();
        const encPass = srv.basicPass ? await encrypt(srv.basicPass, encKey) : "";
        const { data: { session } } = await supabase.auth.getSession();
        let error: any = null;
        const isTemp = srv.id.startsWith("tmp_");
        const idToSend = isTemp ? null : srv.id;

        // prioritas: session (login) dulu, baru bypass private_key
        if (session) {
            const payload: any = { user_id: session.user.id, server_name: srv.serverName, api_url: srv.apiUrl, player_url_base: srv.playerUrlBase, basic_user: srv.basicUser, basic_pass: encPass };
            if (!isTemp) payload.id = srv.id;
            const res = await supabase.from("mediatx_servers").upsert(payload, { onConflict: "id" }).select().single();
            error = res.error;
            if (!error && res.data && isTemp) {
                setMtxServers(prev => prev.map(s => s.id === srv.id ? { ...s, id: (res.data as any).id } : s));
            }
        } else {
            const bypassKey = typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("key") || sessionStorage.getItem("bypass_private_key") || sessionStorage.getItem("dock_private_verified")) : null;
            if (bypassKey) {
                const res: any = await (supabase as any).rpc("upsert_mediatx_by_private_key", { p_key: bypassKey, p_id: idToSend, p_name: srv.serverName, p_api: srv.apiUrl, p_player: srv.playerUrlBase, p_user: srv.basicUser, p_pass: encPass });
                error = res.error;
                // jika private key tidak ada di DB (misal guest), fallback ke localStorage
                if (error && String(error.message).includes("Private key tidak valid")) {
                    try { localStorage.setItem("mtx-servers", JSON.stringify(mtxServers)); } catch {}
                    gooeyToast.success(`Server "${srv.serverName}" disimpan lokal (guest key belum ada di DB)`);
                    setSaving(null);
                    return;
                }
                if (!error && res.data) {
                    setMtxServers(prev => prev.map(s => s.id === srv.id ? { ...s, id: res.data } as any : s));
                }
            } else {
                // tidak ada session & tidak ada private_key → simpan lokal saja (guest)
                try { localStorage.setItem("mtx-servers", JSON.stringify(mtxServers)); } catch {}
                gooeyToast.success(`Server "${srv.serverName}" disimpan lokal (tanpa DB)`);
                setSaving(null);
                return;
            }
        }
        if (error) {
            if (String(error.message).includes("Private key tidak valid")) {
                gooeyToast.error("Private key tidak valid. Cek di Dashboard → Private Key atau gunakan login.");
            } else {
                gooeyToast.error(error.message);
            }
        } else {
            gooeyToast.success(`Server "${srv.serverName}" disimpan ke database (pass terenkripsi)`);
            setEditingMtxId(null);
        }
        setSaving(null);
    };
    const testMtx = async (srv: typeof mtxServers[number]) => {
        if (!srv.apiUrl) { gooeyToast.error("Isi Path API URL dulu"); return; }
        setTesting(`mtx-${srv.id}`);
        try {
            const headers: Record<string, string> = {};
            if (srv.basicUser || srv.basicPass) {
                headers["Authorization"] = "Basic " + btoa(`${srv.basicUser}:${srv.basicPass}`);
            }
            const res = await fetch(srv.apiUrl, { headers, method: "GET" });
            if (res.ok) {
                const data = await res.json().catch(() => null);
                gooeyToast.success(`MediaMTX "${srv.serverName}" OK${data ? ` - ${Array.isArray(data) ? data.length : Object.keys(data).length} paths` : ""}`);
            } else {
                gooeyToast.error(`MediaMTX gagal: ${res.status} ${res.statusText}`);
            }
        } catch (e: any) {
            gooeyToast.error(`Gagal fetch API: ${e.message} (cek CORS / Basic Auth)`);
        }
        setTesting(null);
    };

    const testObs = async () => {
        setTesting("obs");
        const wsUrl = `ws://${obsConfig.address}:${obsConfig.port}`;
        try {
            const ws = new WebSocket(wsUrl);
            const timeout = setTimeout(() => { ws.close(); gooeyToast.error("OBS timeout"); setTesting(null); }, 4000);
            ws.onopen = () => { clearTimeout(timeout); ws.close(); gooeyToast.success("OBS terhubung!"); setTesting(null); };
            ws.onerror = () => { clearTimeout(timeout); gooeyToast.error("OBS gagal terhubung"); setTesting(null); };
        } catch (e: any) { gooeyToast.error(e.message); setTesting(null); }
    };

    const testSb = async () => {
        setTesting("sb");
        const wsUrl = `ws://${sbConfig.address}:${sbConfig.port}/${sbConfig.endpoint || "streamerbot"}`;
        try {
            const ws = new WebSocket(wsUrl);
            const timeout = setTimeout(() => { ws.close(); gooeyToast.error("Streamer.bot timeout"); setTesting(null); }, 4000);
            ws.onopen = () => { clearTimeout(timeout); ws.close(); gooeyToast.success("Streamer.bot terhubung!"); setTesting(null); };
            ws.onerror = () => { clearTimeout(timeout); gooeyToast.error("Streamer.bot gagal"); setTesting(null); };
        } catch (e: any) { gooeyToast.error(e.message); setTesting(null); }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex">
            <Sidebar active="config" open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
            <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
                <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/10 border border-white/10 rounded text-[8px] font-black tracking-widest text-white">CONFIG</span>
                        <span className="hidden md:inline text-[11px] text-gray-500 font-bold">OBS • Streamer.bot • TikTok</span>
                    </div>
                    <Link href="/dock" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-[10px] font-black uppercase text-white flex items-center gap-1"><Monitor className="w-3 h-3" /> Dock</Link>
                </header>

                <main className="flex-1 p-4 md:p-6 max-w-[900px] w-full mx-auto space-y-6">
                    <div>
                        <h1 className="text-white font-black text-[16px] uppercase tracking-wide">Konfigurasi</h1>
                        <p className="text-gray-500 text-[11px] mt-1">Mengambil dan menyimpan seluruh konfigurasi dari <span className="text-white font-bold">database</span>. Mendukung parameter <code className="bg-white/10 px-1 rounded">?key=private_key</code> untuk akses tanpa autentikasi.</p>
                    </div>

                    {/* OBS */}
                    <div className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-blue-600/10">
                            <h3 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2">
                                <Image src="/assets/logo/obs.png" alt="OBS Studio" width={16} height={16} className="invert" />
                                OBS Studio
                            </h3>
                            <span className="text-[9px] font-bold text-gray-500"></span>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="md:col-span-2">
                                    <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1.5">Address</label>
                                    <input value={obsConfig.address} onChange={e => setObsConfig({ ...obsConfig, address: e.target.value })} placeholder="127.0.0.1" className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50" />
                                </div>
                                <div>
                                    <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1.5">Port</label>
                                    <input value={obsConfig.port} onChange={e => setObsConfig({ ...obsConfig, port: e.target.value })} placeholder="4455" className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-white focus:outline-none focus:border-blue-500/50" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1.5">Password (opsional)</label>
                                <div className="relative">
                                    <input type={showObsPass ? "text" : "password"} value={obsConfig.password} onChange={e => setObsConfig({ ...obsConfig, password: e.target.value })} placeholder="••••••••" className="w-full h-10 pl-3 pr-9 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50" />
                                    <button type="button" onClick={() => setShowObsPass(!showObsPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">{showObsPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={obsConfig.autoConnect} onChange={e => setObsConfig({ ...obsConfig, autoConnect: e.target.checked })} className="w-3 h-3 accent-blue-600" />
                                <span className="text-[11px] font-bold text-gray-400">Auto Connect saat Dock dibuka</span>
                            </label>
                            <div className="flex gap-2">
                                <button onClick={saveObs} disabled={saving === "obs"} className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"><Save className="w-3.5 h-3.5" /> {saving === "obs" ? "Menyimpan..." : "Simpan OBS"}</button>
                                <button onClick={testObs} disabled={testing === "obs"} className="px-4 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-[10px] uppercase flex items-center gap-1"><TestTube className="w-3.5 h-3.5" /> {testing === "obs" ? "..." : "Test"}</button>
                            </div>
                        </div>
                    </div>

                    {/* Streamer.bot */}
                    <div className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-blue-600/10">
                            <h3 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2">
                                <Image src="/assets/logo/sbot.png" alt="Streamer.bot" width={16} height={16} className="" />
                                Streamer.bot</h3>
                            <span className="text-[9px] font-bold text-gray-500"></span>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="md:col-span-2">
                                    <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1.5">Address</label>
                                    <input value={sbConfig.address} onChange={e => setSbConfig({ ...sbConfig, address: e.target.value })} className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-white focus:outline-none focus:border-blue-500/50" />
                                </div>
                                <div>
                                    <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1.5">Port</label>
                                    <input value={sbConfig.port} onChange={e => setSbConfig({ ...sbConfig, port: e.target.value })} className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-white focus:outline-none focus:border-blue-500/50" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1.5">Endpoint</label>
                                    <input value={sbConfig.endpoint} onChange={e => setSbConfig({ ...sbConfig, endpoint: e.target.value })} placeholder="streamerbot" className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-white focus:outline-none focus:border-blue-500/50" />
                                </div>
                                <div>
                                    <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1.5">Password</label>
                                    <div className="relative">
                                        <input type={showSbPass ? "text" : "password"} value={sbConfig.password} onChange={e => setSbConfig({ ...sbConfig, password: e.target.value })} placeholder="opsional" className="w-full h-10 pl-3 pr-9 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50" />
                                        <button type="button" onClick={() => setShowSbPass(!showSbPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">{showSbPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                                    </div>
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={sbConfig.autoConnect} onChange={e => setSbConfig({ ...sbConfig, autoConnect: e.target.checked })} className="w-3 h-3 accent-blue-600" />
                                <span className="text-[11px] font-bold text-gray-400">Auto Connect</span>
                            </label>
                            <div className="flex gap-2">
                                <button onClick={saveSb} disabled={saving === "sb"} className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"><Save className="w-3.5 h-3.5" /> {saving === "sb" ? "Menyimpan..." : "Simpan Streamer.bot"}</button>
                                <button onClick={testSb} disabled={testing === "sb"} className="px-4 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-[10px] uppercase flex items-center gap-1"><TestTube className="w-3.5 h-3.5" /> {testing === "sb" ? "..." : "Test"}</button>
                            </div>
                        </div>
                    </div>

                    {/* TikTok */}
                    <div className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-blue-600/10">
                            <h3 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2">
                                <Image src="/assets/logo/tik-tok.png" alt="TikTok" width={16} height={16} className="invert" /> TikTok</h3>
                            <span className="text-[9px] font-bold text-gray-500"></span>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1.5">Username (tanpa @)</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-black">@</span>
                                    <input value={tiktokConfig.username} onChange={e => setTiktokConfig({ ...tiktokConfig, username: e.target.value })} placeholder="username" className="flex-1 h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50" />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={tiktokConfig.autoConnect} onChange={e => setTiktokConfig({ ...tiktokConfig, autoConnect: e.target.checked })} className="w-3 h-3 accent-blue-600" />
                                <span className="text-[11px] font-bold text-gray-400">Auto Connect</span>
                            </label>
                            <button onClick={saveTiktok} disabled={saving === "tt"} className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"><Save className="w-3.5 h-3.5" /> {saving === "tt" ? "Menyimpan..." : "Simpan TikTok"}</button>
                        </div>
                    </div>

                    {/* MediaMTX - bisa beberapa server */}
                    <div className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-blue-600/10">
                            <h3 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2">
                                <Image src="/assets/logo/mediamtx.svg" width={100} height={16} alt="MediaMTX" className="w-4 h-4" /> MediaMTX
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-gray-500">{mtxServers.length} server</span>
                                <button onClick={addMtxServer} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-[10px] font-black uppercase text-white flex items-center gap-1"><Plus className="w-3 h-3" /> Tambah Server</button>
                            </div>
                        </div>
                        <div className="p-5 space-y-4">
                            {mtxServers.length === 0 ? (
                                <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
                                    <Server className="w-6 h-6 text-gray-600 mx-auto" />
                                    <p className="text-[11px] text-gray-500 mt-2">Belum ada server MediaMTX</p>
                                    <p className="text-[10px] text-gray-600">Tambah server untuk akses beberapa MediaMTX - field: Server Name, Path API URL, Player URL Base, Basic Auth</p>
                                </div>
                            ) : (
                                mtxServers.map(srv => {
                                    const isEditing = editingMtxId === srv.id;
                                    if (!isEditing) {
                                        return (
                                            <div key={srv.id} className="bg-black/20 border border-white/10 rounded-xl p-3 flex items-center gap-3 hover:border-white/15 transition-colors">
                                                <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-600/20 flex items-center justify-center shrink-0">
                                                    <Server className="w-4 h-4 text-blue-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-white font-black text-[11px] truncate">{srv.serverName || "Tanpa Nama"}</div>
                                                    <div className="text-[10px] font-mono-custom text-gray-500 truncate">{srv.apiUrl || "- belum ada API URL -"}</div>
                                                    {srv.playerUrlBase ? <div className="text-[9px] text-gray-600 truncate">▶ {srv.playerUrlBase}</div> : null}
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button onClick={() => setEditingMtxId(srv.id)} className="px-3 h-8 rounded-lg bg-white text-black font-black text-[10px] uppercase hover:bg-gray-200">Edit</button>
                                                    <button onClick={() => testMtx(srv)} disabled={testing === `mtx-${srv.id}`} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white"><TestTube className="w-3.5 h-3.5" /></button>
                                                    <a href={srv.playerUrlBase || "#"} target="_blank" className={`p-2 rounded-lg border ${srv.playerUrlBase ? "bg-white/5 hover:bg-white/10 border-white/10 text-white" : "bg-black/20 border-white/5 text-gray-600 pointer-events-none"}`}><ExternalLink className="w-3.5 h-3.5" /></a>
                                                    <button onClick={() => removeMtx(srv.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return (
                                    <div key={srv.id} className="bg-black/20 border border-white/10 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase text-white tracking-wide">{srv.serverName || "Server Baru"}</span>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => setEditingMtxId(null)} className="px-2 py-1 text-[10px] font-bold text-gray-400 hover:text-white">Batal</button>
                                                <button onClick={() => removeMtx(srv.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1">Server Name</label>
                                            <input value={srv.serverName} onChange={e => updateMtx(srv.id, "serverName", e.target.value)} placeholder="My MediaMTX - Jakarta" className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-[12px] font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50" />
                                        </div>
                                        <div>
                                            <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1">Path API URL</label>
                                            <input value={srv.apiUrl} onChange={e => updateMtx(srv.id, "apiUrl", e.target.value)} placeholder="http://192.168.1.10:9997/v3/paths/list" className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-[11px] font-mono-custom text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50" />
                                            <p className="text-[9px] text-gray-600 mt-1">Endpoint MediaMTX untuk list path, ex: /v3/paths/list atau /api/paths</p>
                                        </div>
                                        <div>
                                            <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1">Streaming Player URL Base <span className="text-gray-600 normal-case font-normal">(opsional)</span></label>
                                            <input value={srv.playerUrlBase} onChange={e => updateMtx(srv.id, "playerUrlBase", e.target.value)} placeholder="http://192.168.1.10:8889" className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-[11px] font-mono-custom text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50" />
                                            <p className="text-[9px] text-gray-600 mt-1">Base URL untuk player HLS/WebRTC, ex: http://ip:8889/streamName</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1">Basic Auth User <span className="text-gray-600 normal-case font-normal">(opsional)</span></label>
                                                <input value={srv.basicUser} onChange={e => updateMtx(srv.id, "basicUser", e.target.value)} placeholder="admin" className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-[12px] font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50" />
                                            </div>
                                            <div>
                                                <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1">Basic Auth Password <span className="text-gray-600 normal-case font-normal">(opsional)</span></label>
                                                <div className="relative">
                                                    <input type={mtxShowPass[srv.id] ? "text" : "password"} value={srv.basicPass} onChange={e => updateMtx(srv.id, "basicPass", e.target.value)} placeholder="••••••••" className="w-full h-9 pl-3 pr-9 bg-white/5 border border-white/10 rounded-lg text-[12px] font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50" />
                                                    <button type="button" onClick={() => setMtxShowPass(prev => ({ ...prev, [srv.id]: !prev[srv.id] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">{mtxShowPass[srv.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}</button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => saveMtx(srv)} disabled={saving === `mtx-${srv.id}`} className="flex-1 h-9 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-60"><Save className="w-3 h-3" /> {saving === `mtx-${srv.id}` ? "Menyimpan..." : "Simpan Server"}</button>
                                            <button onClick={() => testMtx(srv)} disabled={testing === `mtx-${srv.id}`} className="px-3 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-[10px] uppercase flex items-center gap-1"><TestTube className="w-3 h-3" /> {testing === `mtx-${srv.id}` ? "..." : "Test API"}</button>
                                            <a href={srv.playerUrlBase || "#"} target="_blank" className={`px-3 h-9 rounded-lg border text-[10px] font-black uppercase flex items-center gap-1 ${srv.playerUrlBase ? "bg-white/5 hover:bg-white/10 border-white/10 text-white" : "bg-black/20 border-white/5 text-gray-600 cursor-not-allowed pointer-events-none"}`}><ExternalLink className="w-3 h-3" /> Player</a>
                                        </div>
                                        {srv.apiUrl && srv.playerUrlBase && (
                                            <div className="bg-blue-600/5 border border-blue-600/10 rounded-lg p-2">
                                                <p className="text-[9px] font-mono-custom text-blue-300 break-all">Player: {srv.playerUrlBase.replace(/\/$/, "")}/{"{stream}"} - API: {srv.apiUrl}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                                })
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
