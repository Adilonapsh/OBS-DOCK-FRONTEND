'use client';
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import {
    Radio, ToolCase, Video, UserCog, Monitor, MoveRight, PenLine, BarChart2,
    RefreshCcw, ChevronDown, ChevronUp, Edit3, X, ChartBar, Zap, MessageSquare, Pin,
    ThumbsUp, Eye, Music, Users, Terminal, Sparkles, Plus,
    Share2, ListPlus, ListChecks, Check, Clock, Search, Pause, Play, Square, Trash2, EyeOff, Minimize2, Maximize2
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { updateTitle, createPoll } from "../actions/streamerBotActions";
import { obsStatusColors } from "../enums/enumColors";
import { Label } from "@heroui/react/label";
import { TextArea } from "@heroui/react/textarea";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Polling, { PollingRef } from "../components/Polling";
import { useTtSbMap } from "../hooks/useTtSbMap";
import { ChatMessage, DockStatus } from "../types/dockTypes";
import { decrypt, isEncrypted } from "../utils/encryption";
import { gooeyToast } from "goey-toast";

function TwitchIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9V7m5 4V7" />
        </svg>
    );
}

function YoutubeIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
            <path d="m10 15 5-3-5-3z" />
        </svg>
    );
}

export default function Home() {

    const [status, setStatus] = useState<DockStatus>({
        simulated: true,
        obsStudioMode: false,
        streamTime: "00:00:00",
        recordTime: "00:00:00",
        obsStatus: "SIMULATED",
        sbotStatus: "SIMULATED",
        cpuUsage: "13.2%",
        obsFps: "60",
        obsMem: "724MB",
        bitrate: "0 kbps",
        diskSpace: "200 GB",
        recordStatus: "STOPPED",
        streamStatus: "STOPPED",
        virtualCamStatus: "STOPPED",
        replayBufferStatus: "STOPPED",
    });

    const streamBitrateValue = Number.parseFloat((status.bitrate ?? "0 kbps").replace(/[^\d.]/g, "")) || 0;
    const diskSpaceValue = Number.parseFloat((status.diskSpace ?? "200 GB").replace(/[^\d.]/g, "")) || 0;
    const [streamChartData, setStreamChartData] = useState<Array<{ value: number }>>([
        { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 },
        { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 },
    ]);
    const recordingChartData = [
        { value: Math.max(0, diskSpaceValue * 0.9) },
        { value: Math.max(0, diskSpaceValue * 0.88) },
        { value: Math.max(0, diskSpaceValue * 0.92) },
        { value: Math.max(0, diskSpaceValue * 0.86) },
        { value: Math.max(0, diskSpaceValue * 0.89) },
        { value: Math.max(0, diskSpaceValue * 0.84) },
        { value: Math.max(0, diskSpaceValue * 0.9) },
        { value: diskSpaceValue },
    ];
    const [youtubeViewerCountSB, setYoutubeViewerCountSB] = useState<number | null>(null);
    const [youtubeChartData, setYoutubeChartData] = useState<Array<{ value: number }>>([
        { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 },
        { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 },
    ]);
    const [youtubeLive, setYoutubeLive] = useState(false);
    const [twitchLive, setTwitchLive] = useState(false);
    const [twitchViewerCountSB, setTwitchViewerCountSB] = useState<number | null>(null);
    const [twitchChartData, setTwitchChartData] = useState<Array<{ value: number }>>([
        { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 },
        { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 },
    ]);
    const [tiktokChartData, setTiktokChartData] = useState<Array<{ value: number }>>([
        { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 },
        { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 },
    ]);

    const [dropdownOpen, setDropdownOpen] = useState({
        streamTools: false,
    });

    const [layout, setLayout] = useState({
        current: "DOCK",
        updateTitle: false,
        createPoll: false,
        createTask: false,
    });

    const [activeTab, setActiveTab] = useState<"stats" | "briefing" | "system">("stats");
    const defaultSectionVisible = {
        streaming: true,
        activity: true,
        gift: true,
        chat: true,
        cardYt: true,
        cardTw: false,
        cardTt: true,
    };
    const [sectionVisible, setSectionVisible] = useState(defaultSectionVisible);

    const [titleValue, setTitleValue] = useState("");
    const [gameValue, setGameValue] = useState("");
    const [pollDuration, setPollDuration] = useState(60);
    const [chatMessages, setChatMessages] = useState<Array<ChatMessage>>([]);
    const [pinnedChat, setPinnedChat] = useState<{ user: string; text: string; platform: string; avatar?: string } | null>(null);
    const [pinnedExiting, setPinnedExiting] = useState(false);
    const pinnedExitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [viewerData, setViewerData] = useState<Record<string, { platform: string; avatar?: string; initials: string }>>({});
    const [chatSearch, setChatSearch] = useState("");
    const [activityLogs, setActivityLogs] = useState<Array<{ id: number; text: string; platform?: string; time?: string }>>([]);
    const [giftLogs, setGiftLogs] = useState<Array<{ id: number; user: string; text: string; platform: string; amount?: string; giftName?: string; count?: number; avatar?: string; time?: string }>>([]);
    const [tiktokRoomViewerCount, setTiktokRoomViewerCount] = useState<number | null>(null); // viewerCount -> Realtime Penonton
    const [tiktokTotalUser, setTiktokTotalUser] = useState<number | null>(null); // totalUser -> Total User
    const pollingRef = useRef<PollingRef>(null);
    const [activePoll,setActivePoll]=useState<any>(null);
    const [pollTick,setPollTick]=useState(0);
    const [showPoll,setShowPoll]=useState(() => {
        if (typeof window === 'undefined') return true;
        try { const v = localStorage.getItem('dock-showPoll'); return v === null ? true : v === 'true'; } catch { return true; }
    });
    const [pollMinimized,setPollMinimized]=useState(() => {
        if (typeof window === 'undefined') return true;
        try { const v=localStorage.getItem('dock-pollMinimized'); return v===null ? true : v==='true'; } catch { return true; }
    });
    const [activeTasks,setActiveTasks]=useState<any>(null);
    const [taskMinimized,setTaskMinimized]=useState(() => {
        if (typeof window === 'undefined') return true;
        try { const v=localStorage.getItem('dock-taskMinimized'); return v===null ? true : v==='true'; } catch { return true; }
    });
    const [newTaskText,setNewTaskText]=useState("");
    const [activeTimer,setActiveTimer]=useState<any>(null);
    const [timerTick,setTimerTick]=useState(0);
    const [timerCustomMin,setTimerCustomMin]=useState<string>("5");
    const [timerCustomSec,setTimerCustomSec]=useState<string>("0");
    const [timerAddMin,setTimerAddMin]=useState<string>("5");
    const [timerAddSec,setTimerAddSec]=useState<string>("0");
    const [timerSubMin,setTimerSubMin]=useState<string>("5");
    const [timerSubSec,setTimerSubSec]=useState<string>("0");
    const [timerMinimized,setTimerMinimized]=useState(() => {
        if (typeof window === 'undefined') return true;
        try { const v=localStorage.getItem('dock-timerMinimized'); return v===null ? true : v==='true'; } catch { return true; }
    });
    const [dockSwiperIndex,setDockSwiperIndex]=useState(0);
    const [dockTouchStart,setDockTouchStart]=useState<number|null>(null);
    const [dockSwiperMinimized,setDockSwiperMinimized]=useState(() => {
        if (typeof window === 'undefined') return true;
        try { const v=localStorage.getItem('dock-swiperMinimized'); return v===null ? true : v==='true'; } catch { return true; }
    });
    const [autoMinimizeEnabled,setAutoMinimizeEnabled]=useState(() => {
        if (typeof window === 'undefined') return false;
        try { return localStorage.getItem('dock-autoMinimizeEnabled')==='true'; } catch { return false; }
    });
    const [autoMinimizeDelay,setAutoMinimizeDelay]=useState(() => {
        if (typeof window === 'undefined') return 5;
        try { const v=parseInt(localStorage.getItem('dock-autoMinimizeDelay')||'5',10); return isNaN(v)?5:Math.max(2,Math.min(60,v)); } catch { return 5; }
    });
    const [lastActivity,setLastActivity]=useState(()=>Date.now());
    const bumpActivity = () => setLastActivity(Date.now());
    useEffect(()=>{ try{ localStorage.setItem('dock-autoMinimizeEnabled', String(autoMinimizeEnabled)); }catch{} },[autoMinimizeEnabled]);
    useEffect(()=>{ try{ localStorage.setItem('dock-autoMinimizeDelay', String(autoMinimizeDelay)); }catch{} },[autoMinimizeDelay]);
    useEffect(()=>{ try{ localStorage.setItem('dock-showPoll', String(showPoll)); }catch{} },[showPoll]);
    useEffect(()=>{ try{ localStorage.setItem('dock-pollMinimized', String(pollMinimized)); }catch{} },[pollMinimized]);
    useEffect(()=>{ try{ localStorage.setItem('dock-taskMinimized', String(taskMinimized)); }catch{} },[taskMinimized]);
    useEffect(()=>{ try{ localStorage.setItem('dock-timerMinimized', String(timerMinimized)); }catch{} },[timerMinimized]);
    useEffect(()=>{ try{ localStorage.setItem('dock-swiperMinimized', String(dockSwiperMinimized)); }catch{} },[dockSwiperMinimized]);
    useEffect(()=>{ if(!activePoll || activePoll.ended) return; const t=setInterval(()=>setPollTick(v=>v+1),1000); return ()=>clearInterval(t); },[activePoll]);
    useEffect(()=>{ if(!activeTimer?.isRunning) return; const t=setInterval(()=>setTimerTick(v=>v+1),1000); return ()=>clearInterval(t); },[activeTimer]);
    // auto minimize - reset timer kalau ada aktivitas di dock, kalau sudah tidak ada aktivitas baru minimize
    useEffect(()=>{
        if(!autoMinimizeEnabled) return;
        const onActivity = () => setLastActivity(Date.now());
        window.addEventListener('mousemove', onActivity);
        window.addEventListener('click', onActivity);
        window.addEventListener('keydown', onActivity);
        return ()=>{ window.removeEventListener('mousemove', onActivity); window.removeEventListener('click', onActivity); window.removeEventListener('keydown', onActivity); };
    },[autoMinimizeEnabled]);
    useEffect(()=>{
        if(!autoMinimizeEnabled) return;
        const id = setInterval(()=>{
            if(Date.now() - lastActivity >= autoMinimizeDelay*1000){
                if(!pollMinimized) setPollMinimized(true);
                if(!taskMinimized) setTaskMinimized(true);
                if(!timerMinimized) setTimerMinimized(true);
                if(!dockSwiperMinimized) setDockSwiperMinimized(true);
            }
        }, 1000);
        return ()=>clearInterval(id);
    },[autoMinimizeEnabled, autoMinimizeDelay, lastActivity, pollMinimized, taskMinimized, timerMinimized, dockSwiperMinimized]);
    // aktivitas baru (poll/task/timer) -> expand dulu + reset timer
    useEffect(()=>{ if(!autoMinimizeEnabled || !activePoll || activePoll.ended) return; setPollMinimized(false); setLastActivity(Date.now()); },[activePoll?.id, activePoll?.ended]);
    useEffect(()=>{ if(!autoMinimizeEnabled || !activeTasks) return; setTaskMinimized(false); setLastActivity(Date.now()); },[activeTasks?.items?.length]);
    useEffect(()=>{ if(!autoMinimizeEnabled || !activeTimer) return; setTimerMinimized(false); setLastActivity(Date.now()); },[activeTimer?.totalSeconds]);
    // sync custom input dengan timer yang ada (biar 50:00 → 50m 0s), hanya saat tidak running biar tidak ganggu ketikan
    useEffect(()=>{
        if(activeTimer?.totalSeconds == null || activeTimer?.isRunning) return;
        const sec = activeTimer.totalSeconds;
        setTimerCustomMin(String(Math.floor(sec/60)));
        setTimerCustomSec(String(sec%60));
    },[activeTimer?.totalSeconds, activeTimer?.isRunning]);

    // grafik TikTok realtime dari viewerCount (roomUser)
    useEffect(() => {
        if (tiktokRoomViewerCount === null) return;
        setTiktokChartData(prev => {
            const next = [...prev, { value: tiktokRoomViewerCount }];
            if (next.length > 8) return next.slice(-8);
            return next;
        });
    }, [tiktokRoomViewerCount]);

    useEffect(() => {
        const initPrivateKey = async () => {
            const keyFromUrl = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("key")?.trim() : null;
            if (keyFromUrl) {
                const isHex = /^[a-f0-9]{32,64}$/i.test(keyFromUrl) || keyFromUrl.startsWith("guest_") || keyFromUrl.length >= 16;
                if (!isHex) {
                    setPrivateKeyError("Private key di URL tidak valid (format hex).");
                } else {
                    setPrivateKey(keyFromUrl);
                    setPrivateKeyInput(keyFromUrl);
                    setPrivateKeyVerified(true);
                    if (typeof window !== "undefined") {
                        sessionStorage.setItem("bypass_private_key", keyFromUrl);
                        sessionStorage.setItem("dock_private_verified", keyFromUrl);
                    }
                    setPrivateKeyLoading(false);
                    (async () => {
                        try {
                            const { data: all } = await (supabase as any).rpc("get_all_by_private_key", { p_key: keyFromUrl });
                            if (all && !all.error) {
                                if (all.obs_config) {
                                    const raw = all.obs_config.password || "";
                                    let dec = "";
                                    if (raw) dec = isEncrypted(raw) ? await decrypt(raw, keyFromUrl).catch(() => "") : raw;
                                    setObsConfig((prev: any) => {
                                        if (obsConfigDirtyRef.current && isEncrypted(raw) && !dec) return prev;
                                        const finalPass = dec || (!isEncrypted(raw) ? raw : prev.password || "");
                                        return { ...prev, address: all.obs_config.address, port: all.obs_config.port, password: finalPass, auto_connect: all.obs_config.auto_connect };
                                    });
                                }
                                if (all.tiktok_config) setTiktokConfig((prev: any) => ({ ...prev, ...all.tiktok_config }));
                                if (all.streamerbot_config) {
                                    const rawSb = all.streamerbot_config.password || "";
                                    let decSb = "";
                                    if (rawSb) decSb = isEncrypted(rawSb) ? await decrypt(rawSb, keyFromUrl).catch(() => "") : rawSb;
                                    setSbConfig((prev: any) => {
                                        if (sbConfigDirtyRef.current && isEncrypted(rawSb) && !decSb) return prev;
                                        const finalPass = decSb || (!isEncrypted(rawSb) ? rawSb : prev.password || "");
                                        return { ...prev, address: all.streamerbot_config.address, port: all.streamerbot_config.port, endpoint: all.streamerbot_config.endpoint, password: finalPass, auto_connect: all.streamerbot_config.auto_connect };
                                    });
                                }
                                if (all.dashboard_layout) setSectionVisible((prev: any) => ({ ...prev, ...all.dashboard_layout }));
                                if (all.briefing) setBriefing((prev: any) => ({ ...prev, ...all.briefing }));
                            }
                        } catch {}
                    })();
                    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("key")) router.replace("/dock");
                    return;
                }
            }

            const { data: { session } } = await supabase.auth.getSession();
            const bypassKey = typeof window !== "undefined" ? sessionStorage.getItem("bypass_private_key") : null;
            if (bypassKey) {
                try {
                    const { data: isValid } = await (supabase as any).rpc("verify_private_key", { p_key: bypassKey });
                    if (isValid) {
                        setPrivateKey(bypassKey);
                        setPrivateKeyVerified(true);
                        try {
                            const { data: all } = await (supabase as any).rpc("get_all_by_private_key", { p_key: bypassKey });
                            if (all && !all.error) {
                                if (all.obs_config) {
                                    const raw = all.obs_config.password || "";
                                    let dec = "";
                                    if (raw) dec = isEncrypted(raw) ? await decrypt(raw, bypassKey).catch(() => "") : raw;
                                    setObsConfig((prev: any) => {
                                        if (obsConfigDirtyRef.current && isEncrypted(raw) && !dec) return prev;
                                        const finalPass = dec || (!isEncrypted(raw) ? raw : prev.password || "");
                                        return { ...prev, address: all.obs_config.address, port: all.obs_config.port, password: finalPass, auto_connect: all.obs_config.auto_connect };
                                    });
                                }
                                if (all.tiktok_config) setTiktokConfig((prev: any) => ({ ...prev, ...all.tiktok_config }));
                                if (all.streamerbot_config) {
                                    const rawSb = all.streamerbot_config.password || "";
                                    let decSb = "";
                                    if (rawSb) decSb = isEncrypted(rawSb) ? await decrypt(rawSb, bypassKey).catch(() => "") : rawSb;
                                    setSbConfig((prev: any) => {
                                        if (sbConfigDirtyRef.current && isEncrypted(rawSb) && !decSb) return prev;
                                        const finalPass = decSb || (!isEncrypted(rawSb) ? rawSb : prev.password || "");
                                        return { ...prev, address: all.streamerbot_config.address, port: all.streamerbot_config.port, endpoint: all.streamerbot_config.endpoint, password: finalPass, auto_connect: all.streamerbot_config.auto_connect };
                                    });
                                }
                                if (all.dashboard_layout) setSectionVisible((prev: any) => ({ ...prev, ...all.dashboard_layout }));
                                if (all.briefing) setBriefing((prev: any) => ({ ...prev, ...all.briefing }));
                            }
                        } catch {}
                        setPrivateKeyLoading(false);
                        return;
                    }
                } catch {}
            }
            if (!session) {
                const guestKey = typeof window !== "undefined" ? sessionStorage.getItem("guest_private_key") : null;
                const guestVerified = typeof window !== "undefined" ? sessionStorage.getItem("dock_private_verified") : null;
                if (guestKey && guestVerified === guestKey) {
                    setPrivateKey(guestKey);
                    setPrivateKeyVerified(true);
                    setPrivateKeyLoading(false);
                    return;
                }
                setPrivateKeyLoading(false);
                return;
            }
            let key: string | null = null;
            try {
                const { data: profile } = await supabase.from("profiles").select("private_key").eq("id", session.user.id).single();
                key = (profile as any)?.private_key || null;
            } catch {}
            if (!key) {
                try {
                    const { data: sec } = await supabase.from("user_private_keys").select("private_key").eq("user_id", session.user.id).single();
                    key = (sec as any)?.private_key || null;
                } catch {}
            }
            // Private key HANYA dibaca di sini - dibuat saat register (DB trigger)
            // atau via tombol Regenerate. Jangan generate otomatis saat login.
            if (key) {
                setPrivateKey(key);
                setPrivateKeyInput(key);
                const verified = typeof window !== "undefined" ? sessionStorage.getItem("dock_private_verified") : null;
                if (verified === key || !verified) {
                    setPrivateKeyVerified(true);
                    if (typeof window !== "undefined") sessionStorage.setItem("dock_private_verified", key);
                }
                // background fetch config (decrypt biar sama kayak Config) + simpan ke localStorage biar sinkron
                (async () => {
                    try {
                        const { data: all } = await (supabase as any).rpc("get_all_by_private_key", { p_key: key });
                        if (all && !all.error) {
                            if (all.obs_config) {
                                const raw = all.obs_config.password || "";
                                let dec = "";
                                if (raw) dec = isEncrypted(raw) ? await decrypt(raw, key).catch(() => "") : raw;
                                if (obsConfigDirtyRef.current && isEncrypted(raw) && !dec) {
                                    // jangan overwrite password yang lagi diketik user kalau decrypt gagal
                                } else {
                                    const finalPass = dec || (!isEncrypted(raw) ? raw : "");
                                    const obsFromDb = { address: all.obs_config.address, port: all.obs_config.port, password: finalPass, autoConnect: all.obs_config.auto_connect };
                                    // jangan overwrite localStorage dengan string kosong kalau decrypt gagal
                                    if (finalPass !== "" || !isEncrypted(raw)) {
                                        setObsConfig(obsFromDb as any);
                                        localStorage.setItem("obs-config", JSON.stringify(obsFromDb));
                                    } else {
                                        setObsConfig((prev:any)=> ({...prev, address: all.obs_config.address, port: all.obs_config.port, autoConnect: all.obs_config.auto_connect}));
                                    }
                                }
                            }
                            if (all.tiktok_config) {
                                const t = { username: all.tiktok_config.username || "", autoConnect: all.tiktok_config.auto_connect };
                                setTiktokConfig(t as any);
                                localStorage.setItem("tiktok-config", JSON.stringify(t));
                            }
                            if (all.streamerbot_config) {
                                const rawSb = all.streamerbot_config.password || "";
                                let decSb = "";
                                if (rawSb) decSb = isEncrypted(rawSb) ? await decrypt(rawSb, key).catch(() => "") : rawSb;
                                if (sbConfigDirtyRef.current && isEncrypted(rawSb) && !decSb) {
                                    // skip
                                } else {
                                    const finalPassSb = decSb || (!isEncrypted(rawSb) ? rawSb : "");
                                    const sbFromDb = { address: all.streamerbot_config.address, port: all.streamerbot_config.port, endpoint: all.streamerbot_config.endpoint, password: finalPassSb, autoConnect: all.streamerbot_config.auto_connect };
                                    if (finalPassSb !== "" || !isEncrypted(rawSb)) {
                                        setSbConfig(sbFromDb as any);
                                        localStorage.setItem("sb-config", JSON.stringify(sbFromDb));
                                    } else {
                                        setSbConfig((prev:any)=> ({...prev, address: all.streamerbot_config.address, port: all.streamerbot_config.port, endpoint: all.streamerbot_config.endpoint, autoConnect: all.streamerbot_config.auto_connect}));
                                    }
                                }
                            }
                        }
                    } catch {}
                })();
            } else {
                setPrivateKeyError("Gagal membuat private key. Jalankan supabase/fix_register.sql di SQL Editor.");
            }
            setPrivateKeyLoading(false);
        };
        initPrivateKey();
    }, []);

    const handleVerifyPrivateKey = async () => {
        const input = privateKeyInput.trim();
        if (!input) {
            setPrivateKeyError("Masukkan private key.");
            return;
        }
        // jika sudah ada privateKey dari login, cek langsung
        if (privateKey && input === privateKey) {
            setPrivateKeyVerified(true);
            if (typeof window !== "undefined") sessionStorage.setItem("dock_private_verified", privateKey);
            setPrivateKeyError("");
            return;
        }
        // bypass tanpa login: coba verifikasi via Supabase RPC, fallback terima hex apa saja jika RPC belum ada
        let verified = false;
        try {
            const { data: isValid, error } = await (supabase as any).rpc("verify_private_key", { p_key: input });
            if (error && error.message?.includes("not exist")) verified = /^[a-f0-9]{32,64}$/i.test(input) || input.startsWith("guest_") || input.length >= 16;
            else verified = !!isValid;
        } catch {
            verified = /^[a-f0-9]{32,64}$/i.test(input) || input.startsWith("guest_") || input.length >= 16;
        }
        if (verified) {
            setPrivateKey(input);
            setPrivateKeyVerified(true);
            if (typeof window !== "undefined") {
                sessionStorage.setItem("bypass_private_key", input);
                sessionStorage.setItem("dock_private_verified", input);
            }
            // fetch semua config tanpa login (opsional, jangan block jika gagal)
            try {
                const { data: all } = await (supabase as any).rpc("get_all_by_private_key", { p_key: input });
                if (all && !all.error) {
                    if (all.obs_config) {
                        const raw = (all.obs_config as any).password || "";
                        let dec = raw && isEncrypted(raw) ? await decrypt(raw, input).catch(()=> "") : raw;
                        setObsConfig((prev: any) => {
                            if (isEncrypted(raw) && !dec) return { ...prev, address: (all.obs_config as any).address, port: (all.obs_config as any).port, auto_connect: (all.obs_config as any).auto_connect };
                            const finalPass = dec || (!isEncrypted(raw) ? raw : prev.password || "");
                            return { ...prev, address: (all.obs_config as any).address, port: (all.obs_config as any).port, password: finalPass, auto_connect: (all.obs_config as any).auto_connect };
                        });
                    }
                    if (all.tiktok_config) setTiktokConfig((prev: any) => ({ ...prev, ...all.tiktok_config }));
                    if (all.streamerbot_config) {
                        const rawSb = (all.streamerbot_config as any).password || "";
                        let decSb = rawSb && isEncrypted(rawSb) ? await decrypt(rawSb, input).catch(()=> "") : rawSb;
                        setSbConfig((prev: any) => {
                            if (isEncrypted(rawSb) && !decSb) return { ...prev, address: (all.streamerbot_config as any).address, port: (all.streamerbot_config as any).port, endpoint: (all.streamerbot_config as any).endpoint, auto_connect: (all.streamerbot_config as any).auto_connect };
                            const finalPassSb = decSb || (!isEncrypted(rawSb) ? rawSb : prev.password || "");
                            return { ...prev, address: (all.streamerbot_config as any).address, port: (all.streamerbot_config as any).port, endpoint: (all.streamerbot_config as any).endpoint, password: finalPassSb, auto_connect: (all.streamerbot_config as any).auto_connect };
                        });
                    }
                    if (all.dashboard_layout) setSectionVisible((prev: any) => ({ ...prev, ...all.dashboard_layout }));
                    if (all.briefing) setBriefing((prev: any) => ({ ...prev, ...all.briefing }));
                }
                } catch {}
                setPrivateKeyError("");
                return;
            }
        setPrivateKeyError("Private key tidak valid. Cek di Dashboard → Private Key atau Supabase profiles.private_key.");
    };

    const handleCopyPrivateKey = async () => {
        if (privateKey && typeof navigator !== "undefined") {
            await navigator.clipboard.writeText(privateKey);
        }
    };

    const handleRegeneratePrivateKey = async () => {
        if (!confirm("Regenerate private key? Koneksi TikTok lama yang pakai key lama akan terputus.")) return;
        const { data, error } = await (supabase as any).rpc("regenerate_private_key");
        if (!error && data) {
            setPrivateKey(data as string);
            setPrivateKeyVerified(false);
            setPrivateKeyInput("");
            if (typeof window !== "undefined") sessionStorage.removeItem("dock_private_verified");
        }
    };

    const twitchViewerCount = Object.values(viewerData).filter(item => item.platform === "twitch").length;
    const youtubeChatViewerCount = Object.values(viewerData).filter(item => item.platform === "youtube").length;
    const tiktokViewerCount = Object.values(viewerData).filter(item => item.platform === "tiktok").length;
    const filteredChatMessages = chatSearch.trim()
        ? chatMessages.filter(m => `${m.user} ${m.text} ${m.platform}`.toLowerCase().includes(chatSearch.toLowerCase()))
        : chatMessages;

    const readStoredConfig = <T,>(key: string, fallback: T): T => {
        if (typeof window === "undefined") return fallback;

        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;

            return { ...fallback, ...JSON.parse(raw) } as T;
        } catch (error) {
            console.error(`Config restore failed for ${key}`, error);
            return fallback;
        }
    };

    const [obsConfig, setObsConfig] = useState(() =>
        readStoredConfig("obs-config", {
            address: "127.0.0.1",
            port: "4455",
            password: "",
            autoConnect: true,
        })
    );

    const [sbConfig, setSbConfig] = useState(() =>
        readStoredConfig("sb-config", {
            address: "127.0.0.1",
            password: "password",
            port: "8080",
            endpoint: "streamerbot",
            autoConnect: true,
        })
    );

    const [tiktokConfig, setTiktokConfig] = useState(() =>
        readStoredConfig("tiktok-config", {
            username: "",
            autoConnect: false,
        })
    );

    // Pemetaan event TikTok → action Streamer.bot. Dikelola di halaman
    // /integrations, dieksekusi di sini. Hook sinkron via localStorage.
    const { map: ttSbMap } = useTtSbMap();
    // mirror ref agar listener socket (didaftarkan sekali) selalu baca mapping terbaru
    const ttSbMapRef = useRef(ttSbMap);
    ttSbMapRef.current = ttSbMap;

    // Kirim DoAction ke Streamer.bot. Diam jika action kosong / SB tidak konek.
    const fireSbAction = (actionName: string, args: Record<string, unknown>) => {
        const name = actionName.trim();
        if (!name) return false;
        if (!sbSocketRef.current || sbSocketRef.current.readyState !== WebSocket.OPEN) return false;
        sbSocketRef.current.send(JSON.stringify({
            request: "DoAction",
            action: { name },
            args,
            id: `ttp_${Date.now()}`,
        }));
        return true;
    };

    const [briefing, setBriefing] = useState(() =>
        readStoredConfig("streamBriefing", {
            title: "",
            goal: "",
            notes: "",
            outline: [] as Array<{ text: string; checked: boolean }>,
        })
    );

    const [isNotesPreview, setIsNotesPreview] = useState(false);

    const sbSocketRef = useRef<WebSocket | null>(null);
    const sbManualDisconnectRef = useRef(false);
    const sbConfigDirtyRef = useRef(false);
    const sbReconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasInitialSbConnectRef = useRef(false);

    const obsSocketRef = useRef<WebSocket | null>(null);
    const obsManualDisconnectRef = useRef(false);
    const obsConfigDirtyRef = useRef(false);
    const obsReconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const obsPollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const prevStreamBytesRef = useRef<number | null>(null);
    const prevStreamBytesTimeRef = useRef<number>(0);
    const hasInitialObsConnectRef = useRef(false);

    const tkSocketRef = useRef<Socket | null>(null);
    const hasInitialTkConnectRef = useRef(false);
    const tkManualDisconnectRef = useRef(false);
    const tkRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollSocketRef = useRef<Socket | null>(null);
    const getSocketUrl = () => {
        const fromEnv = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
        if (fromEnv) return fromEnv.replace(/\/$/, '');
        if (typeof window === 'undefined') return 'http://localhost:3000';
        const h = window.location.hostname;
        if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:3000';
        return window.location.origin;
    };

    const [tiktokStatus, setTiktokStatus] = useState<"DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR">("DISCONNECTED");
    const [tiktokError, setTiktokError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();
    const [privateKey, setPrivateKey] = useState<string | null>(null);
    const [privateKeyVerified, setPrivateKeyVerified] = useState(false);
    const [privateKeyInput, setPrivateKeyInput] = useState("");
    const [privateKeyError, setPrivateKeyError] = useState("");
    const [privateKeyLoading, setPrivateKeyLoading] = useState(false);

    useEffect(() => {
        const s = io(getSocketUrl(), { transports: ['websocket','polling'] as const });
        pollSocketRef.current = s;
        const getRoom = () => privateKey || (typeof window !== 'undefined' ? (sessionStorage.getItem('dock_private_verified') || sessionStorage.getItem('bypass_private_key') || '') : '') || 'global';
        s.on('connect', () => {
            const room = getRoom();
            s.emit('join-room', room);
            s.emit('poll-get', { privateKey: room });
            s.emit('task-get', { privateKey: room });
            s.emit('timer-get', { privateKey: room });
        });
        s.on('poll-update', (p:any)=> { setActivePoll(p); if(typeof p.visible==='boolean') setShowPoll(p.visible); });
        s.on('poll-clear', ()=> setActivePoll(null));
        s.on('task-update', (t:any)=> setActiveTasks(t));
        s.on('task-clear', ()=> setActiveTasks(null));
        s.on('timer-update', (t:any)=> setActiveTimer(t));
        // also join when privateKey changes
        const t = setInterval(()=>{ if(s.connected){ const room=getRoom(); s.emit('poll-get',{privateKey:room}); s.emit('task-get',{privateKey:room}); s.emit('timer-get',{privateKey:room}); } }, 3000);
        return () => { clearInterval(t); s.disconnect(); pollSocketRef.current = null; };
    }, []);
    useEffect(()=>{
        if(pollSocketRef.current?.connected){
            const room = privateKey || (typeof window !== 'undefined' ? (sessionStorage.getItem('dock_private_verified') || sessionStorage.getItem('bypass_private_key') || '') : '') || 'global';
            pollSocketRef.current.emit('join-room', room);
            pollSocketRef.current.emit('poll-get', { privateKey: room });
            pollSocketRef.current.emit('task-get', { privateKey: room });
            pollSocketRef.current.emit('timer-get', { privateKey: room });
        }
    },[privateKey]);

    const headerControlClass = "dock-control-btn flex items-center justify-center gap-2";
    const connectButtonClass = "system-connect-btn flex items-center justify-center rounded-lg text-white shadow-[0_0_10px_rgba(59,130,246,0.2)]";

    const toggleSimulation = () => {
        if (status.obsStatus === "SIMULATED") {
            setStatus({
                ...status,
                obsStatus: "CONNECTED",
                sbotStatus: "CONNECTED",
            });
        } else {
            setStatus({
                ...status,
                obsStatus: "SIMULATED",
                sbotStatus: "SIMULATED",
            });
        }
    }

    const reloadPage = () => {
        window.location.reload();
    }

    const handleUpdateTitle = () => {
        const title = titleValue.trim();
        const game = gameValue.trim();

        if (!title) {
            alert("Judul stream tidak boleh kosong!");
            return;
        }

        if (!sbSocketRef.current || sbSocketRef.current.readyState !== WebSocket.OPEN) {
            alert("Streamer.bot tidak terhubung!");
            return;
        }

        const payload = {
            request: "DoAction",
            action: { name: "UPDATE TITLE" },
            args: {
                streamTitle: title,
                streamGame: game,
            },
            id: `UpdateTitle_${Date.now()}`,
        };

        sbSocketRef.current.send(JSON.stringify(payload));
        updateTitle(title, game);

        setTitleValue("");
        setGameValue("");
        setLayout({ ...layout, updateTitle: false });
    }

    const handleCreatePoll = () => {
        const data = pollingRef.current?.getData();
        const question = data?.question.trim() ?? "";
        const options = data?.options.filter(o => o.trim() !== "") ?? [];
        const duration = pollDuration;

        if (!question || options.length === 0) {
            alert("Pertanyaan dan opsi harus diisi!");
            return;
        }

        if (duration < 15) {
            alert("Durasi minimal 15 detik!");
            return;
        }

        if (!sbSocketRef.current || sbSocketRef.current.readyState !== WebSocket.OPEN) {
            alert("Streamer.bot tidak terhubung!");
            return;
        }

        const payload = {
            request: "DoAction",
            action: { name: "CREATE POLL" },
            args: {
                pollQuestion: question,
                pollOptions: options.join(","),
                pollDuration: duration,
            },
            id: `CreatePoll_${Date.now()}`,
        };

        sbSocketRef.current.send(JSON.stringify(payload));
        createPoll(question, options, duration);
        // also emit to poll widget (real OBS data)
        const room = privateKey || (typeof window !== 'undefined' ? (sessionStorage.getItem('dock_private_verified') || sessionStorage.getItem('bypass_private_key') || '') : '') || 'global';
        if (pollSocketRef.current?.connected) {
            pollSocketRef.current.emit('poll-create', { privateKey: room, question, options, duration, theme: 'bar', visible: showPoll });
        } else {
            const tmp = io(getSocketUrl(), { transports: ['websocket','polling'] as const });
            tmp.on('connect', () => {
                tmp.emit('poll-create', { privateKey: room, question, options, duration, theme: 'bar', visible: showPoll });
                setTimeout(() => tmp.disconnect(), 1500);
            });
        }

        pollingRef.current?.reset();
        setPollDuration(60);
        setLayout({ ...layout, createPoll: false });
    }
    const handlePausePoll = () => {
        const room = activePoll?.room || privateKey || (typeof window !== 'undefined' ? (sessionStorage.getItem('dock_private_verified') || sessionStorage.getItem('bypass_private_key') || '') : '') || 'global';
        if (!pollSocketRef.current) return;
        if (activePoll?.paused) pollSocketRef.current.emit('poll-resume', { privateKey: room });
        else pollSocketRef.current.emit('poll-pause', { privateKey: room });
    };
    const handleStopPoll = () => {
        const room = activePoll?.room || privateKey || (typeof window !== 'undefined' ? (sessionStorage.getItem('dock_private_verified') || sessionStorage.getItem('bypass_private_key') || '') : '') || 'global';
        if (!confirm('Stop polling? Hasil akhir akan tetap tampil di OBS sampai poll baru.')) return;
        pollSocketRef.current?.emit('poll-end', { privateKey: room });
    };
    const handleClearPoll = () => {
        const room = activePoll?.room || privateKey || (typeof window !== 'undefined' ? (sessionStorage.getItem('dock_private_verified') || sessionStorage.getItem('bypass_private_key') || '') : '') || 'global';
        pollSocketRef.current?.emit('poll-clear', { privateKey: room });
        setActivePoll(null);
    };
    const handleToggleShowPoll = () => {
        const next = !showPoll;
        setShowPoll(next);
        const room = activePoll?.room || privateKey || (typeof window !== 'undefined' ? (sessionStorage.getItem('dock_private_verified') || sessionStorage.getItem('bypass_private_key') || '') : '') || 'global';
        pollSocketRef.current?.emit('poll-visibility', { privateKey: room, visible: next });
    };

    const closeUpdateTitle = () => {
        setTitleValue("");
        setGameValue("");
        setLayout({ ...layout, updateTitle: false });
    }

    const closeCreatePoll = () => {
        pollingRef.current?.reset();
        setPollDuration(60);
        setLayout({ ...layout, createPoll: false });
    }
    const closeCreateTask = () => {
        setNewTaskText("");
        setLayout({ ...layout, createTask: false });
    }
    const handleAddTask = () => {
        const text = newTaskText.trim();
        if (!text) { alert('Teks task tidak boleh kosong!'); return; }
        const room = privateKey || (typeof window !== 'undefined' ? (sessionStorage.getItem('dock_private_verified') || sessionStorage.getItem('bypass_private_key') || '') : '') || 'global';
        pollSocketRef.current?.emit('task-add', { privateKey: room, text });
        setNewTaskText("");
    }
    const handleToggleTask = (id: string) => {
        const room = activeTasks?.room || privateKey || (typeof window !== 'undefined' ? (sessionStorage.getItem('dock_private_verified') || sessionStorage.getItem('bypass_private_key') || '') : '') || 'global';
        pollSocketRef.current?.emit('task-toggle', { privateKey: room, id });
    }
    const handleRemoveTask = (id: string) => {
        const room = activeTasks?.room || privateKey || (typeof window !== 'undefined' ? (sessionStorage.getItem('dock_private_verified') || sessionStorage.getItem('bypass_private_key') || '') : '') || 'global';
        pollSocketRef.current?.emit('task-remove', { privateKey: room, id });
    }
    const handleClearTasks = () => {
        if (!confirm('Hapus semua tasks?')) return;
        const room = activeTasks?.room || privateKey || (typeof window !== 'undefined' ? (sessionStorage.getItem('dock_private_verified') || sessionStorage.getItem('bypass_private_key') || '') : '') || 'global';
        pollSocketRef.current?.emit('task-clear', { privateKey: room });
        setActiveTasks(null);
    }
    const getTimerRoom = () => privateKey || (typeof window !== 'undefined' ? (sessionStorage.getItem('dock_private_verified') || sessionStorage.getItem('bypass_private_key') || '') : '') || 'global';
    const handleTimerControl = (action: string, extra: Record<string, unknown> = {}) => {
        const room = getTimerRoom();
        pollSocketRef.current?.emit('timer-control', { privateKey: room, action, ...extra });
    };
    const handleTimerAdd = (sec: number = 300) => handleTimerControl('add', { seconds: sec });
    const handleTimerSub = (sec: number = 300) => handleTimerControl('sub', { seconds: sec });
    const handleTimerSetCustom = () => {
        const m = Math.max(0, Math.min(999, parseInt(timerCustomMin) || 0));
        const s = Math.max(0, Math.min(59, parseInt(timerCustomSec) || 0));
        const total = m * 60 + s;
        if (total === 0) { if(typeof window!=='undefined') gooeyToast.error('Durasi harus > 0'); return; }
        handleTimerControl('set', { totalSeconds: total });
    };

    const toggleStream = () => {
        if (!window.confirm("Apakah Anda yakin ingin memulai/menghentikan Streaming?")) return;

        if (obsSocketRef.current && obsSocketRef.current.readyState === WebSocket.OPEN) {
            obsSocketRef.current.send(JSON.stringify({
                op: 6,
                d: {
                    requestType: "ToggleStream",
                    requestId: "toggle_stream",
                },
            }));
            return;
        }

        alert("OBS tidak terhubung!");
    }

    const toggleRecord = () => {
        if (!window.confirm("Apakah Anda yakin ingin memulai/menghentikan Recording?")) return;

        if (obsSocketRef.current && obsSocketRef.current.readyState === WebSocket.OPEN) {
            obsSocketRef.current.send(JSON.stringify({
                op: 6,
                d: {
                    requestType: "ToggleRecord",
                    requestId: "toggle_record",
                },
            }));
            return;
        }

        alert("OBS tidak terhubung!");
    }

    const toggleStudioMode = () => {
        if (!obsSocketRef.current || obsSocketRef.current.readyState !== WebSocket.OPEN) {
            alert("OBS tidak terhubung!");
            return;
        }

        const nextStudioMode = !status.obsStudioMode;
        obsSocketRef.current.send(JSON.stringify({
            op: 6,
            d: {
                requestType: "SetStudioModeEnabled",
                requestData: { studioModeEnabled: nextStudioMode },
                requestId: "toggle_studio",
            },
        }));
        setStatus(prev => ({ ...prev, obsStudioMode: nextStudioMode }));
    }

    const triggerTransition = () => {
        if (!obsSocketRef.current || obsSocketRef.current.readyState !== WebSocket.OPEN) {
            alert("OBS tidak terhubung!");
            return;
        }

        if (!status.obsStudioMode) return;

        obsSocketRef.current.send(JSON.stringify({
            op: 6,
            d: {
                requestType: "TriggerStudioModeTransition",
                requestId: "trigger_transition",
            },
        }));
    }

    const toggleVirtualCam = () => {
        if (!obsSocketRef.current || obsSocketRef.current.readyState !== WebSocket.OPEN) {
            alert("OBS tidak terhubung!");
            return;
        }
        obsSocketRef.current.send(JSON.stringify({
            op: 6,
            d: {
                requestType: "ToggleVirtualCam",
                requestId: "toggle_virtual_cam",
            },
        }));
    };

    const toggleReplayBuffer = () => {
        if (!obsSocketRef.current || obsSocketRef.current.readyState !== WebSocket.OPEN) {
            alert("OBS tidak terhubung!");
            return;
        }
        obsSocketRef.current.send(JSON.stringify({
            op: 6,
            d: {
                requestType: "ToggleReplayBuffer",
                requestId: "toggle_replay_buffer",
            },
        }));
    };

    const parseEmotes = (text: string, emotes?: Array<{ name: string; imageUrl: string }>) => {
        if (!emotes || emotes.length === 0) return text;

        const sorted = [...emotes].sort((a, b) => b.name.length - a.name.length);
        const pattern = new RegExp(sorted.map(item => item.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "g");

        const result: Array<string | { type: "img"; src: string; alt: string }> = [];
        let lastIndex = 0;

        for (const match of text.matchAll(pattern)) {
            const start = match.index ?? 0;
            if (start > lastIndex) {
                result.push(text.slice(lastIndex, start));
            }

            const name = match[0];
            const emote = sorted.find(item => item.name === name);
            if (emote) {
                result.push({ type: "img", src: emote.imageUrl, alt: name });
            } else {
                result.push(name);
            }

            lastIndex = start + name.length;
        }

        if (lastIndex < text.length) {
            result.push(text.slice(lastIndex));
        }

        return result;
    };

    const handleIncomingMessage = (user: string, text: string, platform: ChatMessage["platform"], avatar?: string, emotes?: Array<{ name: string; imageUrl: string }>) => {
        setChatMessages(prev => [{
            id: Date.now() + Math.random(),
            user,
            text,
            platform,
            avatar,
            emotes,
        }, ...prev].slice(0, 50));

        setViewerData(prev => {
            const next = { ...prev };
            const safeUser = String(user || '??');
            next[safeUser] = { platform, avatar, initials: safeUser.slice(0, 2).toUpperCase() };
            return next;
        });
    }

    const addActivityLog = (text: string, platform: string = "tiktok") => {
        const time = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        setActivityLogs(prev => [{ id: Date.now() + Math.random(), text, platform, time }, ...prev].slice(0, 50));
    }

    const addGiftLog = (user: string, text: string, platform: string, opts?: { amount?: string; giftName?: string; count?: number; avatar?: string }) => {
        const time = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        setGiftLogs(prev => [{ id: Date.now() + Math.random(), user, text, platform, time, ...opts }, ...prev].slice(0, 50));
    }

    const unpinMessage = () => {
        if (!pinnedChat || pinnedExiting) return;
        setPinnedExiting(true);
        if (pinnedExitTimer.current) clearTimeout(pinnedExitTimer.current);
        pinnedExitTimer.current = setTimeout(() => {
            setPinnedChat(null);
            setPinnedExiting(false);
        }, 300);
        if (tkSocketRef.current && tkSocketRef.current.connected) {
            tkSocketRef.current.emit("unpin-chat", privateKey ? { privateKey } : {});
        }
    }

    const pinMessage = (user: string, text: string, platform: string, avatar?: string) => {
        if (pinnedExitTimer.current) clearTimeout(pinnedExitTimer.current);
        setPinnedExiting(false);
        setPinnedChat({ user, text, platform, avatar });

        if (tkSocketRef.current && tkSocketRef.current.connected) {
            tkSocketRef.current.emit("pin-chat", {
                username: tiktokConfig.username || "global",
                privateKey: privateKey || undefined,
                chat: { nickname: user, comment: text, profilePictureUrl: avatar, platform: platform }
            });
        }
    }

    // Ambil payload connect terakhir (tanpa alert) untuk dipakai auto-retry
    const getTikTokRetryPayload = () => {
        const username = tiktokConfig.username.trim() || (typeof window !== "undefined" ? localStorage.getItem("tiktokUsername") || "" : "");
        const key = privateKey || (typeof window !== "undefined" ? (sessionStorage.getItem("bypass_private_key") || sessionStorage.getItem("dock_private_verified") || new URLSearchParams(window.location.search).get("key")) : null);
        if (!username || !key) return null;
        return { username, privateKey: key };
    };

    const clearTikTokRetry = () => {
        if (tkRetryTimerRef.current) {
            clearTimeout(tkRetryTimerRef.current);
            tkRetryTimerRef.current = null;
        }
    };

    // Auto-reconnect ala OBS/SB: putus tak disengaja → coba lagi sekali jalan
    const scheduleTikTokRetry = (why: string, delayMs = 3000) => {
        if (tkManualDisconnectRef.current) return;
        const payload = getTikTokRetryPayload();
        if (!payload) return;
        clearTikTokRetry();
        addSystemLog(`TikTok ${why}. Mencoba reconnect...`, "warn");
        tkRetryTimerRef.current = setTimeout(() => {
            tkRetryTimerRef.current = null;
            if (tkManualDisconnectRef.current) return;
            if (tkSocketRef.current?.connected) {
                tkSocketRef.current.emit("connect-tiktok", payload);
            } else if (tkSocketRef.current) {
                tkSocketRef.current.connect();
                tkSocketRef.current.once("connect", () => {
                    tkSocketRef.current?.emit("connect-tiktok", payload);
                });
            }
        }, delayMs);
    };

    const connectTikTok = () => {
        tkManualDisconnectRef.current = false;
        clearTikTokRetry();
        const username = tiktokConfig.username.trim();
        if (!username) {
            alert("Silakan masukkan username TikTok!");
            return;
        }
        const effectiveKey = privateKey || (typeof window !== "undefined" ? (sessionStorage.getItem("bypass_private_key") || sessionStorage.getItem("dock_private_verified") || new URLSearchParams(window.location.search).get("key")) : null);
        const isVerified = privateKeyVerified || !!effectiveKey;
        if (!effectiveKey || !isVerified) {
            alert("Akses dock butuh private key. Silakan verifikasi private key di atas.");
            setPrivateKeyError("Verifikasi private key diperlukan untuk koneksi TikTok.");
            return;
        }

        // simpan username biar persist (mirip legacy localStorage.setItem('tiktokUsername', ...))
        if (typeof window !== "undefined") {
            localStorage.setItem("tiktokUsername", username);
            localStorage.setItem("tiktok-config", JSON.stringify(tiktokConfig));
        }

        const effectivePrivateKey = privateKey || (typeof window !== "undefined" ? (sessionStorage.getItem("bypass_private_key") || sessionStorage.getItem("dock_private_verified") || new URLSearchParams(window.location.search).get("key")) : null) || privateKey;
        const payload = { username, privateKey: effectivePrivateKey };

        if (!tkSocketRef.current) {
            tkSocketRef.current = io(getSocketUrl());
            tkManualDisconnectRef.current = false;
            clearTikTokRetry();

            tkSocketRef.current.on("connect", () => {
                addSystemLog("Terhubung ke server TikTok lokal.", "info");
                tkSocketRef.current?.emit("connect-tiktok", payload);
            });

            tkSocketRef.current.on("disconnect", () => {
                setTiktokStatus("DISCONNECTED");
                setTiktokError(null);
                setTiktokRoomViewerCount(null);
                setTiktokTotalUser(null);
                scheduleTikTokRetry("koneksi ke server putus");
            });

            tkSocketRef.current.on("tiktok-connecting", () => {
                setTiktokStatus("CONNECTING");
                setTiktokError(null);
                addSystemLog(`Menghubungkan ke TikTok @${username}...`, "info");
            });

            tkSocketRef.current.on("tiktok-connected", () => {
                setTiktokStatus("CONNECTED");
                setTiktokError(null);
                addSystemLog(`Berhasil terhubung ke TikTok Live: @${username}`, "success");
            });

            tkSocketRef.current.on("tiktok-error", (err: string) => {
                setTiktokStatus("ERROR");
                setTiktokError(err);
                clearTikTokRetry();
                addSystemLog(`Gagal terhubung ke TikTok: ${err}`, "error");
            });

            tkSocketRef.current.on("tiktok-disconnected", () => {
                setTiktokStatus("DISCONNECTED");
                setTiktokError(null);
                setTiktokRoomViewerCount(null);
                setTiktokTotalUser(null);
                addSystemLog("TikTok terputus.", "warn");
                scheduleTikTokRetry("terputus dari live");
            });

            tkSocketRef.current.on("tiktok-streamEnd", () => {
                setTiktokStatus("DISCONNECTED");
                setTiktokError(null);
                setTiktokRoomViewerCount(null);
                setTiktokTotalUser(null);
                addSystemLog("Live TikTok berakhir.", "warn");
                scheduleTikTokRetry("live berakhir, cek apakah live lagi", 5000);
            });

            tkSocketRef.current.on("tiktok-chat", (data: { nickname: string; comment: string; profilePictureUrl?: string; platform?: string }) => {
                const pf = (data.platform === "twitch" || data.platform === "youtube" || data.platform === "kick" ? data.platform : "tiktok") as ChatMessage["platform"];
                handleIncomingMessage(data.nickname, data.comment, pf, data.profilePictureUrl, []);
                const m = ttSbMapRef.current.chat;
                if (m.enabled) fireSbAction(m.action, { type: "chat", nickname: data.nickname, comment: data.comment, profilePictureUrl: data.profilePictureUrl });
            });

            tkSocketRef.current.on("tiktok-gift", (data: { nickname: string; giftName: string; repeatCount: number; profilePictureUrl?: string; diamondCount?: number }) => {
                addGiftLog(data.nickname, `mengirim ${data.giftName} x${data.repeatCount}`, "tiktok", { giftName: data.giftName, count: data.repeatCount, avatar: data.profilePictureUrl });
                addSystemLog(`🎁 [TIKTOK GIFT] ${data.nickname} mengirim ${data.giftName} x${data.repeatCount}`, "info");
                const m = ttSbMapRef.current.gift;
                if (m.enabled) fireSbAction(m.action, { type: "gift", nickname: data.nickname, giftName: data.giftName, repeatCount: data.repeatCount, diamondCount: data.diamondCount, profilePictureUrl: data.profilePictureUrl });
            });

            tkSocketRef.current.on("tiktok-like", (data: { nickname: string; likeCount: number; totalLikeCount?: number }) => {
                addActivityLog(`❤️ ${data.nickname} menyukai live! (${data.likeCount} likes)`, "tiktok");
                addSystemLog(`❤️ [TIKTOK LIKE] ${data.nickname} menyukai live! (${data.likeCount} likes)`, "info");
                const m = ttSbMapRef.current.like;
                if (m.enabled) fireSbAction(m.action, { type: "like", nickname: data.nickname, likeCount: data.likeCount, totalLikeCount: data.totalLikeCount });
            });

            tkSocketRef.current.on("tiktok-follow", (data: { nickname?: string; uniqueId?: string; profilePictureUrl?: string }) => {
                const nick = data.nickname || (data as any).uniqueId || "??";
                addActivityLog(`💖 ${nick} mengikuti`, "tiktok");
                const m = ttSbMapRef.current.follow;
                if (m.enabled) fireSbAction(m.action, { type: "follow", nickname: nick, profilePictureUrl: data.profilePictureUrl });
            });

            tkSocketRef.current.on("tiktok-member", (data: { nickname?: string; uniqueId?: string; profilePictureUrl?: string }) => {
                const nick = data.nickname || (data as any).uniqueId || '??';
                addActivityLog(`👋 ${nick} telah bergabung`, "tiktok");
                setViewerData(prev => ({
                    ...prev,
                    [nick]: {
                        platform: "tiktok",
                        avatar: data.profilePictureUrl,
                        initials: String(nick).slice(0, 2).toUpperCase(),
                    },
                }));
                addSystemLog(`👋 [TIKTOK JOIN] ${nick} telah bergabung.`, "info");
                const m = ttSbMapRef.current.member;
                if (m.enabled) fireSbAction(m.action, { type: "member", nickname: nick, profilePictureUrl: data.profilePictureUrl });
            });

            tkSocketRef.current.on("tiktok-roomUser", (data: any) => {
                const viewerCount = data?.viewerCount ?? null;
                const totalUser = data?.totalUser ?? data?.totalUsers ?? null;
                if (typeof viewerCount === "number") setTiktokRoomViewerCount(viewerCount);
                if (typeof totalUser === "number") setTiktokTotalUser(totalUser);
            });
        } else {
            // socket sudah ada - langsung emit (isolasi per privateKey)
            if (tkSocketRef.current.connected) {
                tkSocketRef.current.emit("connect-tiktok", payload);
            } else {
                tkSocketRef.current.connect();
                tkSocketRef.current.once("connect", () => {
                    tkSocketRef.current?.emit("connect-tiktok", payload);
                });
            }
        }
    }

    const disconnectTikTok = () => {
        tkManualDisconnectRef.current = true;
        clearTikTokRetry();
        const username = tiktokConfig.username.trim() || (typeof window !== "undefined" ? localStorage.getItem("tiktokUsername") || "" : "");
        const payload: any = privateKey ? { username, privateKey } : username;
        if (tkSocketRef.current) {
            tkSocketRef.current.emit("disconnect-tiktok", payload);
        }
        setTiktokStatus("DISCONNECTED");
        setTiktokError(null);
        setTiktokRoomViewerCount(null);
        setTiktokTotalUser(null);
        addSystemLog("TikTok disconnected.", "warn");
    }

    const resetTikTokUI = () => {
        setTiktokStatus("DISCONNECTED");
        setTiktokError(null);
        setTiktokRoomViewerCount(null);
        setTiktokTotalUser(null);
    }

    const requestAIBriefing = async () => {
        addSystemLog("Menghubungi AI (Direct)...", "info");

        const url = `https://n8n.truenapsh.my.id/webhook/stream-briefing?currentTitle=${encodeURIComponent(briefing.title)}&currentGoal=${encodeURIComponent(briefing.goal)}`;
        const auth = btoa("adilonapsh:adilonapsh123");

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Basic ${auth}`
                }
            });

            if (!response.ok) throw new Error("Koneksi gagal");

            const data = await response.json();
            const rawOutput = data.output;

            if (rawOutput) {
                const getBetween = (text: string, start: string, end: string) => {
                    const s = text.indexOf(start);
                    if (s === -1) return "";
                    const startPos = s + start.length;
                    const e = text.indexOf(end, startPos);
                    return text.substring(startPos, e === -1 ? text.length : e).trim();
                };

                const aiTitle = getBetween(rawOutput, "**New Title:**", "**");
                const aiGoal = getBetween(rawOutput, "**Strategi Sesi:**", "**");
                const aiOutline = getBetween(rawOutput, "**Stream Outline:**", "**");

                const newOutline = aiOutline
                    ? aiOutline.split(",").map(item => item.trim()).filter(item => item).map(text => ({ text, checked: false }))
                    : briefing.outline;

                const updatedBriefing = {
                    title: aiTitle || briefing.title,
                    goal: aiGoal || briefing.goal,
                    notes: rawOutput,
                    outline: newOutline.length > 0 ? newOutline : briefing.outline,
                };

                setBriefing(updatedBriefing);
                addSystemLog("Briefing diperbarui secara langsung!", "success");

                // Send to Streamer.bot
                if (sbSocketRef.current && sbSocketRef.current.readyState === WebSocket.OPEN) {
                    const payload = {
                        request: "DoAction",
                        action: { name: "GENERATE BRIEFING" },
                        args: {
                            currentTitle: updatedBriefing.title,
                            currentGoal: updatedBriefing.goal
                        },
                        id: `GenerateBriefing_${Date.now()}`
                    };
                    sbSocketRef.current.send(JSON.stringify(payload));
                    console.log("Mengirim request ke Streamer.bot:", payload);
                }
            }
        } catch (error) {
            console.error("Direct AI Error:", error);
            addSystemLog("Gagal memproses AI.", "error");
        }
    };

    const saveBriefing = (updatedBriefing?: typeof briefing) => {
        const toSave = updatedBriefing || briefing;
        if (typeof window !== "undefined") {
            localStorage.setItem("streamBriefing", JSON.stringify(toSave));
        }
    };

    const clearBriefing = () => {
        if (typeof window !== "undefined" && window.confirm("Hapus semua data briefing?")) {
            const defaultBriefing = {
                title: "",
                goal: "",
                notes: "",
                outline: [],
            };
            setBriefing(defaultBriefing);
            localStorage.removeItem("streamBriefing");
        }
    };

    const updateBriefingField = (field: keyof typeof briefing, value: unknown) => {
        const updated = { ...briefing, [field]: value };
        setBriefing(updated);
        saveBriefing(updated);
    };

    const addOutlineItem = (text = "", checked = false) => {
        const updated = {
            ...briefing,
            outline: [...briefing.outline, { text, checked }]
        };
        setBriefing(updated);
        saveBriefing(updated);
    };

    const removeOutlineItem = (index: number) => {
        const updated = {
            ...briefing,
            outline: briefing.outline.filter((_, i) => i !== index)
        };
        setBriefing(updated);
        saveBriefing(updated);
    };

    const updateOutlineItem = (index: number, text: string, checked: boolean) => {
        const updated = {
            ...briefing,
            outline: briefing.outline.map((item, i) => i === index ? { text, checked } : item)
        };
        setBriefing(updated);
        saveBriefing(updated);
    };

    const copyBriefingToChat = () => {
        let msg = `📋 STREAM BRIEFING: ${briefing.title || "No Title"}\n🎯 GOAL: ${briefing.goal || "None"}\n\nOUTLINE:`;
        briefing.outline.forEach(item => {
            if (item.text.trim()) {
                msg += `\n${item.checked ? "[x]" : "[ ]"} ${item.text}`;
            }
        });

        if (typeof window !== "undefined") {
            navigator.clipboard.writeText(msg).then(() => {
                console.log("Briefing copied to clipboard!");
            });
        }
    };

    const toggleNotesMode = () => {
        setIsNotesPreview(!isNotesPreview);
    };

    // Event handler wrappers for input fields
    const handleBriefingTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateBriefingField("title", e.target.value);
    };

    const handleBriefingGoalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateBriefingField("goal", e.target.value);
    };

    const handleBriefingNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateBriefingField("notes", e.target.value);
    };

    const handleAddOutlineItem = () => {
        addOutlineItem("", false);
    };

    const handleRemoveOutlineItem = (index: number) => {
        removeOutlineItem(index);
    };

    const handleUpdateOutlineItem = (index: number, text: string) => {
        updateOutlineItem(index, text, briefing.outline[index].checked);
    };

    const handleToggleOutlineItem = (index: number) => {
        updateOutlineItem(index, briefing.outline[index].text, !briefing.outline[index].checked);
    };

    // Logging helper to match legacy behavior
    const addSystemLog = (msg: string, type: "info" | "success" | "error" | "warn" = "info") => {
        console.log(`[${type.toUpperCase()}] ${msg}`);
    };

    const getTiktokButtonText = () => {
        if (tiktokStatus === "CONNECTED") return "Disconnect";
        if (tiktokStatus === "CONNECTING") return "Connecting...";
        if (tiktokStatus === "ERROR") return "Coba Lagi";
        return "Connect";
    };

    const getTiktokButtonClass = () => {
        switch (tiktokStatus) {
            case "CONNECTED":
                return "px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded text-[9px] font-black uppercase transition-colors shadow-[0_0_10px_rgba(156,163,175,0.4)]";
            case "CONNECTING":
                return "px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-[9px] font-black uppercase transition-colors shadow-[0_0_10px_rgba(202,138,4,0.4)]";
            case "ERROR":
                return "px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-[9px] font-black uppercase transition-colors shadow-[0_0_10px_rgba(220,38,38,0.4)]";
            default:
                return "px-3 py-1.5 bg-[#FE2C55] hover:bg-[#E62254] text-white rounded text-[9px] font-black uppercase transition-colors shadow-[0_0_10px_rgba(254,44,85,0.4)]";
        }
    };

    const getTiktokStatusColor = () => {
        switch (tiktokStatus) {
            case "CONNECTED":
                return "text-green-400";
            case "CONNECTING":
                return "text-yellow-400";
            case "ERROR":
                return "text-red-400";
            default:
                return "text-gray-500";
        }
    };

    useEffect(() => {
        if (typeof window === "undefined") return;

        try {
            const raw = localStorage.getItem("dashboardLayout");
            if (!raw) return;

            const saved = JSON.parse(raw) as Record<string, boolean>;
            setSectionVisible(prev => ({
                ...prev,
                streaming: saved["section-streaming"] ?? prev.streaming,
                activity: saved["section-activity"] ?? prev.activity,
                gift: (saved["section-gift"] as boolean) ?? prev.gift,
                chat: saved["section-chat"] ?? prev.chat,
                cardYt: saved["card-yt"] ?? prev.cardYt,
                cardTw: saved["card-tw"] ?? prev.cardTw,
                cardTt: saved["card-tt"] ?? prev.cardTt,
            }));
        } catch (error) {
            console.error("Layout load failed", error);
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        localStorage.setItem("obs-config", JSON.stringify(obsConfig));
    }, [obsConfig]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        localStorage.setItem("sb-config", JSON.stringify(sbConfig));
    }, [sbConfig]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        localStorage.setItem("tiktok-config", JSON.stringify(tiktokConfig));
        hasInitialTkConnectRef.current = false;
    }, [tiktokConfig]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        localStorage.setItem("streamBriefing", JSON.stringify(briefing));
    }, [briefing]);

    // Initialize default outline on first load
    useEffect(() => {
        if (briefing.outline.length === 0) {
            const defaultOutline = [
                { text: "Intro & Greeting", checked: false },
                { text: "Main Content / Gameplay", checked: false },
                { text: "Q&A / Chill Time", checked: false },
                { text: "Outro & Raid", checked: false },
            ];
            setBriefing(prev => ({
                ...prev,
                outline: defaultOutline
            }));
        }
    }, []);

    const toggleSection = (section: keyof typeof sectionVisible, value: boolean) => {
        setSectionVisible(prev => {
            const next = { ...prev, [section]: value };

            if (typeof window !== "undefined") {
                const layoutState = {
                    "section-streaming": next.streaming,
                    "section-activity": next.activity,
                    "section-gift": next.gift,
                    "section-chat": next.chat,
                    "card-yt": next.cardYt,
                    "card-tw": next.cardTw,
                    "card-tt": next.cardTt,
                };
                localStorage.setItem("dashboardLayout", JSON.stringify(layoutState));
            }

            return next;
        });
    }

    const syncConfigsFromDb = async () => {
        const key = privateKey || (typeof window !== "undefined" ? (sessionStorage.getItem("bypass_private_key") || sessionStorage.getItem("dock_private_verified") || new URLSearchParams(window.location.search).get("key")) : null);
        if (!key) {
            gooeyToast.error("Private key belum ada, verifikasi terlebih dahulu");
            return;
        }
        try {
            const { data: all } = await (supabase as any).rpc("get_all_by_private_key", { p_key: key });
            if (all && !all.error) {
                if (all.obs_config) {
                    const raw = (all.obs_config as any).password || "";
                    let dec = "";
                    if (raw) dec = isEncrypted(raw) ? await decrypt(raw, key).catch(() => "") : raw;
                    if (isEncrypted(raw) && !dec) {
                        // decrypt gagal -> jangan overwrite password local
                        setObsConfig((prev:any)=> ({...prev, address: (all.obs_config as any).address, port: (all.obs_config as any).port, autoConnect: (all.obs_config as any).auto_connect}));
                    } else {
                        const finalPass = dec || (!isEncrypted(raw) ? raw : "");
                        const obsFromDb = { address: (all.obs_config as any).address, port: (all.obs_config as any).port, password: finalPass, autoConnect: (all.obs_config as any).auto_connect };
                        setObsConfig(obsFromDb as any);
                        localStorage.setItem("obs-config", JSON.stringify(obsFromDb));
                    }
                }
                if (all.tiktok_config) {
                    const t = { username: all.tiktok_config.username || "", autoConnect: all.tiktok_config.auto_connect };
                    setTiktokConfig(t as any);
                    localStorage.setItem("tiktok-config", JSON.stringify(t));
                }
                if (all.streamerbot_config) {
                    const rawSb = (all.streamerbot_config as any).password || "";
                    let decSb = "";
                    if (rawSb) decSb = isEncrypted(rawSb) ? await decrypt(rawSb, key).catch(() => "") : rawSb;
                    if (isEncrypted(rawSb) && !decSb) {
                        setSbConfig((prev:any)=> ({...prev, address: (all.streamerbot_config as any).address, port: (all.streamerbot_config as any).port, endpoint: (all.streamerbot_config as any).endpoint, autoConnect: (all.streamerbot_config as any).auto_connect}));
                    } else {
                        const finalPassSb = decSb || (!isEncrypted(rawSb) ? rawSb : "");
                        const sbFromDb = { address: (all.streamerbot_config as any).address, port: (all.streamerbot_config as any).port, endpoint: (all.streamerbot_config as any).endpoint, password: finalPassSb, autoConnect: (all.streamerbot_config as any).auto_connect };
                        setSbConfig(sbFromDb as any);
                        localStorage.setItem("sb-config", JSON.stringify(sbFromDb));
                    }
                }
                gooeyToast.success("Config disinkron dari database");
            } else {
                gooeyToast.error("Gagal sync: private key tidak valid atau belum ada config");
            }
        } catch (e: any) {
            gooeyToast.error("Gagal sync: " + (e.message || String(e)));
        }
    };

    const disconnectOBS = () => {
        obsManualDisconnectRef.current = true;
        obsConfigDirtyRef.current = true;
        if (obsReconnectTimerRef.current) {
            clearTimeout(obsReconnectTimerRef.current);
            obsReconnectTimerRef.current = null;
        }
        if (obsPollIntervalRef.current) {
            clearInterval(obsPollIntervalRef.current);
            obsPollIntervalRef.current = null;
        }
        if (obsSocketRef.current) {
            try {
                obsSocketRef.current.onclose = null;
                obsSocketRef.current.close();
            } catch (error) {
                console.warn("OBS close warning:", error);
            }
        }
        setStatus(prev => ({ ...prev, obsStatus: "DISCONNECTED", recordTime: "00:00:00", streamTime: "00:00:00" }));
    }

    const reconnectOBS = () => {
        obsManualDisconnectRef.current = false;
        obsConfigDirtyRef.current = false;
        if (obsReconnectTimerRef.current) {
            clearTimeout(obsReconnectTimerRef.current);
            obsReconnectTimerRef.current = null;
        }
        if (obsSocketRef.current) {
            try {
                obsSocketRef.current.onclose = null;
                obsSocketRef.current.close();
            } catch (error) {
                console.warn("OBS reconnect close warning:", error);
            }
        }

        const socket = new WebSocket(`ws://${obsConfig.address}:${obsConfig.port}`);
        obsSocketRef.current = socket;

        socket.onopen = () => {
            setStatus(prev => ({ ...prev, obsStatus: "CONNECTED" }));
        };

        socket.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.op === 0) {
                    const { authentication, rpcVersion } = data.d ?? {};
                    const authPayload: Record<string, unknown> = { op: 1, d: { rpcVersion, eventSubscriptions: (1 << 0) | (1 << 2) | (1 << 6) | (1 << 12) } };

                    if (authentication) {
                        const password = obsConfig.password ?? "";
                        const pHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password + authentication.salt));
                        const pHashB64 = btoa(String.fromCharCode(...new Uint8Array(pHash)));
                        const aHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pHashB64 + authentication.challenge));
                        const aHashB64 = btoa(String.fromCharCode(...new Uint8Array(aHash)));
                        (authPayload.d as Record<string, unknown>).authentication = aHashB64;
                    }

                    socket.send(JSON.stringify(authPayload));
                }

                if (data.op === 2) {
                    setStatus(prev => ({ ...prev, obsStatus: "CONNECTED" }));
                    socket.send(JSON.stringify({ op: 6, d: { requestType: "GetVideoSettings", requestId: "get_fps" } }));
                    socket.send(JSON.stringify({ op: 6, d: { requestType: "GetStudioModeEnabled", requestId: "get_studio_mode" } }));
                    socket.send(JSON.stringify({ op: 6, d: { requestType: "GetVirtualCamStatus", requestId: "get_virtual_cam" } }));
                    socket.send(JSON.stringify({ op: 6, d: { requestType: "GetReplayBufferStatus", requestId: "get_replay_buffer" } }));
                    socket.send(JSON.stringify({ op: 6, d: { requestType: "GetStreamStatus", requestId: "get_stream_status" } }));
                    socket.send(JSON.stringify({ op: 6, d: { requestType: "GetRecordStatus", requestId: "get_record_status" } }));
                    if (obsPollIntervalRef.current) clearInterval(obsPollIntervalRef.current);
                    obsPollIntervalRef.current = setInterval(() => {
                        if (socket.readyState === WebSocket.OPEN) {
                            socket.send(JSON.stringify({ op: 6, d: { requestType: "GetStreamStatus", requestId: "get_stream_status" } }));
                            socket.send(JSON.stringify({ op: 6, d: { requestType: "GetRecordStatus", requestId: "get_record_status" } }));
                            socket.send(JSON.stringify({ op: 6, d: { requestType: "GetVirtualCamStatus", requestId: "get_virtual_cam" } }));
                            socket.send(JSON.stringify({ op: 6, d: { requestType: "GetReplayBufferStatus", requestId: "get_replay_buffer" } }));
                            socket.send(JSON.stringify({ op: 6, d: { requestType: "GetStats", requestId: "poll_stats" } }));
                        }
                    }, 1000);
                }

                if (data.op === 5) {
                    const eventType = data.d?.eventType;
                    const eventData = data.d?.eventData ?? {};

                    if (eventType === "StreamStateChanged") {
                        const isLive = !!eventData.outputActive;
                        setStatus(prev => ({
                            ...prev,
                            streamStatus: isLive ? "LIVE" : "STOPPED",
                            streamTime: isLive ? prev.streamTime : "00:00:00",
                            bitrate: isLive ? prev.bitrate : "0 kbps",
                            obsStatus: "CONNECTED",
                        }));
                        if (!isLive) {
                            prevStreamBytesRef.current = null;
                            prevStreamBytesTimeRef.current = 0;
                            setStreamChartData(Array.from({ length: 8 }, () => ({ value: 0 })));
                        }
                    }

                    if (eventType === "RecordStateChanged") {
                        setStatus(prev => ({
                            ...prev,
                            recordStatus: eventData.outputActive ? "RECORDING" : "STOPPED",
                            recordTime: eventData.outputActive ? prev.recordTime : "00:00:00",
                            obsStatus: "CONNECTED",
                        }));
                    }

                    if (eventType === "StudioModeStateChanged") {
                        setStatus(prev => ({ ...prev, obsStudioMode: !!eventData.studioModeEnabled, obsStatus: "CONNECTED" }));
                    }

                    if (eventType === "VirtualCamStateChanged") {
                        setStatus(prev => ({ ...prev, virtualCamStatus: eventData.outputState === "OBS_WEBSOCKET_OUTPUT_STARTED" ? "STARTED" : "STOPPED", obsStatus: "CONNECTED" }));
                    }

                    if (eventType === "ReplayBufferStateChanged") {
                        setStatus(prev => ({ ...prev, replayBufferStatus: eventData.outputActive ? "STARTED" : "STOPPED", obsStatus: "CONNECTED" }));
                    }
                }

                if (data.op === 7) {
                    const requestId = data.d?.requestId;
                    const responseData = data.d?.responseData ?? {};

                    if (requestId === "get_fps" && responseData.fpsNumerator && responseData.fpsDenominator) {
                        const fps = responseData.fpsNumerator / responseData.fpsDenominator;
                        setStatus(prev => ({ ...prev, obsFps: String(Math.round(fps)), obsStatus: "CONNECTED" }));
                    }

                    if (requestId === "poll_stats") {
                        setStatus(prev => ({
                            ...prev,
                            cpuUsage: `${(responseData.cpuUsage ?? 0).toFixed(1)}%`,
                            obsFps: String(Math.round(responseData.activeFps ?? 0)),
                            obsMem: `${Math.round(responseData.memoryUsage ?? 0)}MB`,
                            obsStatus: "CONNECTED",
                        }));
                    }

                    if (requestId === "poll_stream_status" && responseData.outputBytes !== undefined) {
                        const currentBytes = Number(responseData.outputBytes);
                        const now = Date.now();
                        let kbpsNum: number;
                        let kbps: string;
                        if (prevStreamBytesRef.current === null) {
                            kbpsNum = 0;
                            kbps = "0 kbps";
                        } else {
                            let delta = currentBytes - (prevStreamBytesRef.current ?? 0);
                            if (delta < 0) delta = currentBytes;
                            const elapsed = Math.max(0.5, (now - prevStreamBytesTimeRef.current) / 1000);
                            kbpsNum = Math.max(0, Math.round((delta * 8 / elapsed) / 1000));
                            kbps = `${kbpsNum} kbps`;
                        }
                        prevStreamBytesRef.current = currentBytes;
                        prevStreamBytesTimeRef.current = now;
                        setStatus(prev => ({ ...prev, bitrate: kbps, obsStatus: "CONNECTED" }));
                        setStreamChartData(prev => {
                            const next = [...prev, { value: kbpsNum }];
                            return next.length > 8 ? next.slice(-8) : next;
                        });
                    }

                    if (requestId === "poll_record_status") {
                        const statusText = responseData.outputActive ? "RECORDING" : "STOPPED";
                        setStatus(prev => ({ ...prev, recordStatus: statusText, obsStatus: "CONNECTED" }));
                    }

                    if (requestId === "get_stream_status") {
                        const timecode = (responseData.outputTimecode as string | undefined) || "";
                        const active = !!responseData.outputActive;
                        const time = active && timecode ? timecode.slice(0, 8) : "00:00:00";
                        let kbps: string | undefined;
                        let kbpsNum: number | null = null;
                        if (responseData.outputBytes !== undefined) {
                            const currentBytes = Number(responseData.outputBytes);
                            const now = Date.now();
                            if (!active) {
                                kbps = "0 kbps";
                                kbpsNum = 0;
                                prevStreamBytesRef.current = null;
                                prevStreamBytesTimeRef.current = 0;
                            } else if (prevStreamBytesRef.current === null) {
                                // first sample after start -> 0 until next delta
                                kbps = "0 kbps";
                                kbpsNum = 0;
                                prevStreamBytesRef.current = currentBytes;
                                prevStreamBytesTimeRef.current = now;
                            } else {
                                const prevBytes = prevStreamBytesRef.current;
                                const prevTime = prevStreamBytesTimeRef.current;
                                let delta = currentBytes - prevBytes;
                                if (delta < 0) delta = currentBytes; // stream restarted
                                const elapsed = Math.max(0.5, (now - prevTime) / 1000);
                                const bitsPerSec = (delta * 8) / elapsed;
                                const calcKbps = Math.max(0, Math.round(bitsPerSec / 1000));
                                kbps = `${calcKbps} kbps`;
                                kbpsNum = calcKbps;
                                prevStreamBytesRef.current = currentBytes;
                                prevStreamBytesTimeRef.current = now;
                            }
                        } else if (!active) {
                            kbps = "0 kbps";
                            kbpsNum = 0;
                            prevStreamBytesRef.current = null;
                        }
                        setStatus(prev => ({
                            ...prev,
                            streamTime: time,
                            streamStatus: active ? "LIVE" : "STOPPED",
                            ...(kbps !== undefined ? { bitrate: kbps } : {}),
                            obsStatus: "CONNECTED",
                        }));
                        if (kbpsNum !== null) {
                            const chartVal = kbpsNum;
                            setStreamChartData(prev => {
                                const next = [...prev, { value: chartVal }];
                                return next.length > 8 ? next.slice(-8) : next;
                            });
                        } else if (!active) {
                            setStreamChartData(prev => {
                                const next = [...prev, { value: 0 }];
                                return next.length > 8 ? next.slice(-8) : next;
                            });
                        }
                    }

                    if (requestId === "get_record_status") {
                        const timecode = (responseData.outputTimecode as string | undefined) || "";
                        const active = !!responseData.outputActive;
                        const time = active && timecode ? timecode.slice(0, 8) : "00:00:00";
                        setStatus(prev => ({
                            ...prev,
                            recordTime: time,
                            recordStatus: active ? "RECORDING" : "STOPPED",
                            obsStatus: "CONNECTED",
                        }));
                    }

                    if (requestId === "get_studio_mode") {
                        setStatus(prev => ({ ...prev, obsStudioMode: !!responseData.studioModeEnabled, obsStatus: "CONNECTED" }));
                    }

                    if (requestId === "toggle_studio" && responseData.studioModeEnabled !== undefined) {
                        setStatus(prev => ({ ...prev, obsStudioMode: !!responseData.studioModeEnabled }));
                    }

                    if (requestId === "get_virtual_cam") {
                        const active = !!(responseData.outputActive ?? responseData.outputState === "OBS_WEBSOCKET_OUTPUT_STARTED");
                        setStatus(prev => ({ ...prev, virtualCamStatus: active ? "STARTED" : "STOPPED", obsStatus: "CONNECTED" }));
                    }

                    if (requestId === "get_replay_buffer") {
                        setStatus(prev => ({ ...prev, replayBufferStatus: responseData.outputActive ? "STARTED" : "STOPPED", obsStatus: "CONNECTED" }));
                    }

                    if (requestId === "toggle_virtual_cam") {
                        const active = !!(responseData.outputActive ?? responseData.outputState === "OBS_WEBSOCKET_OUTPUT_STARTED");
                        setStatus(prev => ({ ...prev, virtualCamStatus: active ? "STARTED" : "STOPPED" }));
                    }

                    if (requestId === "toggle_replay_buffer") {
                        const active = !!responseData.outputActive;
                        setStatus(prev => ({ ...prev, replayBufferStatus: active ? "STARTED" : "STOPPED" }));
                    }
                    if (data.d?.requestStatus?.code === 100) {
                        const errMsg = data.d?.requestStatus?.comment || "OBS request gagal";
                        // if (requestId.startsWith("toggle_")) gooeyToast.error(errMsg);
                    }
                }
            } catch (error) {
                console.error("OBS socket parse error:", error);
            }
        };

        socket.onerror = () => {
            if (obsPollIntervalRef.current) {
                clearInterval(obsPollIntervalRef.current);
                obsPollIntervalRef.current = null;
            }
            setStatus(prev => ({ ...prev, obsStatus: "ERROR" }));
        };

        socket.onclose = () => {
            if (obsPollIntervalRef.current) {
                clearInterval(obsPollIntervalRef.current);
                obsPollIntervalRef.current = null;
            }
            if (obsManualDisconnectRef.current || obsConfigDirtyRef.current) {
                obsManualDisconnectRef.current = false;
                setStatus(prev => ({ ...prev, obsStatus: "DISCONNECTED" }));
                return;
            }

            setStatus(prev => ({ ...prev, obsStatus: "DISCONNECTED" }));
            obsReconnectTimerRef.current = setTimeout(() => reconnectOBS(), 3000);
        };
    }

    const disconnectSB = () => {
        sbManualDisconnectRef.current = true;
        sbConfigDirtyRef.current = true;
        if (sbReconnectTimerRef.current) {
            clearTimeout(sbReconnectTimerRef.current);
            sbReconnectTimerRef.current = null;
        }
        if (sbSocketRef.current) {
            try {
                sbSocketRef.current.onclose = null;
                sbSocketRef.current.close();
            } catch (error) {
                console.warn("SB close warning:", error);
            }
        }
        setStatus(prev => ({ ...prev, sbotStatus: "DISCONNECTED" }));
    }

    const reconnectSB = () => {
        sbManualDisconnectRef.current = false;
        sbConfigDirtyRef.current = false;
        if (sbReconnectTimerRef.current) {
            clearTimeout(sbReconnectTimerRef.current);
            sbReconnectTimerRef.current = null;
        }
        if (sbSocketRef.current) {
            try {
                sbSocketRef.current.onclose = null;
                sbSocketRef.current.close();
            } catch (error) {
                console.warn("SB reconnect close warning:", error);
            }
        }

        const endpoint = sbConfig.endpoint || "streamerbot";
        const socket = new WebSocket(`ws://${sbConfig.address}:${sbConfig.port}/${endpoint}`);
        sbSocketRef.current = socket;

        socket.onopen = () => {
            setStatus(prev => ({ ...prev, sbotStatus: "CONNECTED" }));
            socket.send(JSON.stringify({
                request: "Subscribe",
                id: "dock",
                events: {
                    Twitch: ["ChatMessage", "Follow", "StreamOnline", "StreamOffline", "Cheer", "Sub", "GiftSub", "RewardRedemption"],
                    YouTube: ["Message", "BroadcastStarted", "BroadcastUpdated", "BroadcastEnded", "StatisticsUpdated", "PresentViewers", "SuperChat", "SuperSticker", "NewSponsor"],
                },
            }));
        };

        socket.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);

                if (payload.id === "dock" && payload.status === "ok") {
                    return;
                }

                if (payload.event) {
                    const platform = payload.event.source?.toLowerCase?.() ?? "";
                    const type = payload.event.type;
                    const data = payload.data ?? {};

                    if (["StreamOnline", "BroadcastStarted", "BroadcastUpdated", "StatisticsUpdated", "PresentViewers"].includes(type)) {
                        setStatus(prev => ({
                            ...prev,
                            sbotStatus: "CONNECTED",
                            streamStatus: "LIVE",
                        }));
                        // platform live flags untuk card YouTube/Twitch
                        if (platform === "youtube" && ["BroadcastStarted","BroadcastUpdated","StatisticsUpdated","PresentViewers"].includes(type)) {
                            setYoutubeLive(true);
                        }
                        if (platform === "twitch" && ["StreamOnline","PresentViewers"].includes(type)) {
                            setTwitchLive(true);
                        }

                        if (platform === "youtube" && data.concurrentViewers !== undefined) {
                            const v = Number(data.concurrentViewers) || 0;
                            setYoutubeViewerCountSB(v);
                            setYoutubeChartData(prev => { const next = [...prev, { value: v }]; return next.length > 8 ? next.slice(-8) : next; });
                            if (tkSocketRef.current?.connected) {
                                const roomSb3 = getTimerRoom();
                                tkSocketRef.current.emit("sb-viewers", { privateKey: roomSb3, platform: "youtube", viewers: v });
                            }
                        }

                        if (type === "PresentViewers") {
                            // Twitch: data.viewers array; YouTube: data.viewers / concurrentViewers
                            const list = Array.isArray((data as any).viewers) ? (data as any).viewers.length : undefined;
                            const count = list ?? Number((data as any).concurrentViewers ?? (data as any).viewerCount ?? NaN);
                            if (!Number.isNaN(count)) {
                                if (platform === "youtube") {
                                    setYoutubeViewerCountSB(count);
                                    setYoutubeChartData(prev => { const next = [...prev, { value: count }]; return next.length > 8 ? next.slice(-8) : next; });
                                    setYoutubeLive(true);
                                } else if (platform === "twitch") {
                                    setTwitchViewerCountSB(count);
                                    setTwitchChartData(prev => { const next = [...prev, { value: count }]; return next.length > 8 ? next.slice(-8) : next; });
                                    setTwitchLive(true);
                                }
                                if (tkSocketRef.current?.connected) {
                                    const roomSb4 = getTimerRoom();
                                    tkSocketRef.current.emit("sb-viewers", { privateKey: roomSb4, platform: platform || "twitch", viewers: count });
                                }
                            }
                        }

                        if (platform === "twitch" && data?.title) {
                            console.log("Twitch stream title:", data.title);
                        }
                    }

                    if (["StreamOffline", "BroadcastEnded"].includes(type)) {
                        setStatus(prev => ({
                            ...prev,
                            sbotStatus: "CONNECTED",
                            streamStatus: "STOPPED",
                        }));
                        if (platform === "youtube" && type === "BroadcastEnded") {
                            setYoutubeLive(false);
                        }
                        if (platform === "twitch" && type === "StreamOffline") {
                            setTwitchLive(false);
                            setTwitchViewerCountSB(0);
                        }
                        if (platform === "youtube" && type === "BroadcastEnded") {
                            setYoutubeViewerCountSB(0);
                        }
                    }

                    if (["ChatMessage", "Message"].includes(type)) {
                        const user = data.message?.username || data.user?.name || "User";
                        const message = data.message?.text || data.message || "";
                        const avatar = data.user?.profileImageUrl || data.user?.avatar || null;
                        const pf = (platform === "youtube" || platform === "kick" ? platform : "twitch") as ChatMessage["platform"];
                        if (!message) return;
                        // tampil lokal + broadcast ke server agar overlay kebagian
                        // (server echo ke semua kecuali pengirim, jadi tidak dobel)
                        handleIncomingMessage(user, message, pf, avatar, []);
                        if (tkSocketRef.current?.connected) {
                            const roomSb = getTimerRoom();
                            tkSocketRef.current.emit("sb-chat", {
                                privateKey: roomSb,
                                uniqueId: String(user).toLowerCase().replace(/\s/g, "_"),
                                nickname: user,
                                comment: message,
                                profilePictureUrl: avatar,
                                platform: pf,
                            });
                        }
                    }

                    if (["Follow", "Sub", "ReSub", "NewSponsor", "MembershipGift"].includes(type)) {
                        const user = data.user?.name || data.userName || data.user?.login || "User";
                        const avatar = data.user?.profileImageUrl || data.user?.avatar || null;
                        const pf = (platform === "youtube" || platform === "kick" ? platform : "twitch") as ChatMessage["platform"];
                        addActivityLog(`➕ ${user} mengikuti (${type})`, pf);
                        addSystemLog(`➕ [SB ${type?.toUpperCase()}] ${user}`, "success");
                        if (tkSocketRef.current?.connected) {
                            const roomSb = getTimerRoom();
                            tkSocketRef.current.emit("sb-event", {
                                privateKey: roomSb,
                                eventType: type,
                                uniqueId: String(user).toLowerCase().replace(/\s/g, "_"),
                                nickname: user,
                                profilePictureUrl: avatar,
                                platform: pf,
                            });
                        }
                    }

                    if (["Cheer", "GiftSub", "GiftBomb", "RewardRedemption", "SuperChat", "SuperSticker"].includes(type)) {
                        const user = data.user?.name || data.userName || data.user?.login || "User";
                        const avatar = data.user?.profileImageUrl || data.user?.avatar || null;
                        const amount = data.bits ?? data.amount ?? data.displayString ?? data.tier ?? "";
                        const text = amount ? `${type}: ${amount}` : type;
                        addGiftLog(user, text, platform || "twitch", { amount: String(amount), giftName: type, avatar: avatar || undefined });
                        addSystemLog(`🎁 [GIFT ${platform}] ${user}: ${text}`, "info");
                        if (tkSocketRef.current?.connected) {
                            const roomSb2 = getTimerRoom();
                            tkSocketRef.current.emit("sb-event", {
                                privateKey: roomSb2,
                                eventType: type,
                                uniqueId: String(user).toLowerCase().replace(/\s/g, "_"),
                                nickname: user,
                                profilePictureUrl: avatar,
                                platform: platform || "twitch",
                                giftName: text,
                                repeatCount: 1,
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("SB socket parse error:", error);
            }
        };

        socket.onerror = () => {
            setStatus(prev => ({ ...prev, sbotStatus: "ERROR" }));
        };

        socket.onclose = () => {
            if (sbManualDisconnectRef.current || sbConfigDirtyRef.current) {
                sbManualDisconnectRef.current = false;
                setStatus(prev => ({ ...prev, sbotStatus: "DISCONNECTED" }));
                return;
            }

            setStatus(prev => ({ ...prev, sbotStatus: "DISCONNECTED" }));
            sbReconnectTimerRef.current = setTimeout(() => reconnectSB(), 3000);
        };
    }

    useEffect(() => {
        if (sbConfig.autoConnect && !hasInitialSbConnectRef.current) {
            hasInitialSbConnectRef.current = true;
            reconnectSB();
        }

        return () => {
            if (sbReconnectTimerRef.current) {
                clearTimeout(sbReconnectTimerRef.current);
            }
            if (sbSocketRef.current) {
                sbSocketRef.current.close();
            }
        };
    }, []);

    useEffect(() => {
        if (obsConfig.autoConnect && !hasInitialObsConnectRef.current) {
            hasInitialObsConnectRef.current = true;
            reconnectOBS();
        }

        return () => {
            if (obsReconnectTimerRef.current) {
                clearTimeout(obsReconnectTimerRef.current);
            }
            if (obsPollIntervalRef.current) {
                clearInterval(obsPollIntervalRef.current);
                obsPollIntervalRef.current = null;
            }
            if (obsSocketRef.current) {
                obsSocketRef.current.close();
            }
        };
    }, []);

    useEffect(() => {
        if (tiktokConfig.username && tiktokConfig.autoConnect && !hasInitialTkConnectRef.current) {
            hasInitialTkConnectRef.current = true;
            setTimeout(() => connectTikTok(), 500);
        }

        return () => {
            if (tkSocketRef.current) {
                tkSocketRef.current.close();
            }
        };
    }, []);


    return (
        <div className="h-screen p-3 max-w-[100vw] overflow-x-hidden flex flex-col">
            {!privateKeyVerified ? (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#161616] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-r from-blue-900/15 via-transparent to-cyan-900/10">
                            <h2 className="text-white font-black uppercase text-[13px] tracking-wide">Akses Dock Butuh Private Key</h2>
                            <p className="text-gray-500 text-[10px] mt-1">Private key sebagai <span className="text-cyan-400 font-bold">bypass tanpa login</span> - bisa fetch semua konfigurasi & data. Isolasi websocket per user.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            {privateKey && (
                                <div className="bg-black/30 border border-white/10 rounded-xl p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[8px] font-black tracking-widest uppercase text-gray-500">Private Key Kamu</span>
                                        <button onClick={handleCopyPrivateKey} className="px-2 py-1 bg-white/10 hover:bg-white/15 border border-white/10 rounded text-[9px] font-black uppercase text-white">Copy</button>
                                    </div>
                                    <code className="block text-[10px] break-all text-cyan-400 font-mono-custom bg-white/5 p-2 rounded border border-white/5">{privateKey}</code>
                                    <button onClick={handleRegeneratePrivateKey} className="text-[10px] font-bold text-red-400 hover:text-red-300">Regenerate private key</button>
                                </div>
                            )}
                            <div>
                                <label className="block text-[8px] font-black tracking-widest uppercase text-gray-400 mb-1.5">Tempel Private Key</label>
                                <input type="text" value={privateKeyInput} onChange={(e) => setPrivateKeyInput(e.target.value)} placeholder="64-char hex..." className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-[11px] font-mono-custom text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50" />
                            </div>
                            {privateKeyError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold px-3 py-2 rounded-lg">{privateKeyError}</div>}
                            <button onClick={handleVerifyPrivateKey} className="w-full h-10 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-[11px] uppercase tracking-widest">Verifikasi & Masuk Dock</button>
                            <button onClick={async () => { await supabase.auth.signOut(); if (typeof window !== "undefined") sessionStorage.removeItem("dock_private_verified"); router.push("/login"); }} className="w-full h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 font-black text-[10px] uppercase tracking-widest">Logout</button>
                        </div>
                    </div>
                </div>
            ) : null}
            <header className="relative z-30 w-full max-w-[100vw] flex-none h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-6 font-bold overflow-visible">
                <div className="flex items-center gap-4">
                    {(() => {
                        const isObsOk = status.obsStatus === "CONNECTED";
                        const isSbotOk = status.sbotStatus === "CONNECTED";
                        const isTiktokOk = tiktokStatus === "CONNECTED";
                        const allConnected = isObsOk && isSbotOk && isTiktokOk;
                        const noneConnected = !isObsOk && !isSbotOk && !isTiktokOk;
                        const dotClass = allConnected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : noneConnected ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]";
                        return (
                            <div className="relative group flex items-center gap-2 border-r border-white/10 pr-4 cursor-pointer">
                                <span className={`w-3 h-3 rounded-full shrink-0 ${dotClass}`}></span>
                                <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">{allConnected ? "Connected" : noneConnected ? "Disconnected" : "Partial"}</span>
                                <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-50 min-w-[200px] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl shadow-black/50 p-2">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5">
                                            <div className="flex items-center gap-2">
                                                <Image src="/assets/logo/obs.png" alt="OBS" width={14} height={14} className="invert" />
                                                <span className="text-[10px] font-bold text-white">OBS</span>
                                            </div>
                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${isObsOk ? "bg-green-500/20 text-green-400" : status.obsStatus === "SIMULATED" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>{status.obsStatus}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5">
                                            <div className="flex items-center gap-2">
                                                <Image src="/assets/logo/sbot.png" alt="SBOT" width={14} height={14} className={`${isSbotOk ? "" : "grayscale opacity-60"}`} />
                                                <span className="text-[10px] font-bold text-white">SBOT</span>
                                            </div>
                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${isSbotOk ? "bg-green-500/20 text-green-400" : status.sbotStatus === "SIMULATED" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>{status.sbotStatus}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5">
                                            <div className="flex items-center gap-2">
                                                <Image src="/assets/logo/tik-tok.png" alt="TIKTOK" width={14} height={14} className="invert" />
                                                <span className="text-[10px] font-bold text-white">TIKTOK</span>
                                            </div>
                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${isTiktokOk ? "bg-green-500/20 text-green-400" : tiktokStatus === "CONNECTING" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>{tiktokStatus}</span>
                                        </div>
                                        <div className="border-t border-white/5 mt-1 pt-1 px-2">
                                            <span className="text-[8px] font-bold text-gray-500 uppercase">{allConnected ? "✓ Semua terhubung" : noneConnected ? "✗ Tidak ada yang terhubung" : "◐ Sebagian terhubung"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    <div className="flex items-center gap-2">
                        {/* <button onClick={toggleSimulation} className={`${headerControlClass}`}>
                            <UserCog className="w-3 h-3" />
                            Simulasi
                        </button> */}
                        <button
                            onClick={toggleStudioMode}
                            aria-pressed={status.obsStudioMode}
                            title={status.obsStudioMode ? "Studio Mode Aktif" : "Studio Mode Nonaktif"}
                            className={`${headerControlClass} ${status.obsStudioMode ? "active" : ""}`}>
                            <Monitor className="w-3 h-3" />
                            Studio Mode
                        </button>
                        <button
                            onClick={triggerTransition}
                            disabled={!status.obsStudioMode}
                            title={!status.obsStudioMode ? "Aktifkan Studio Mode dulu" : "Jalankan Transition"}
                            className={`${headerControlClass} ${status.obsStudioMode ? "" : "opacity-50 cursor-not-allowed"} ${status.obsStudioMode ? "active" : ""}`}>
                            <MoveRight className="w-3 h-3" />
                            Transition
                        </button>
                        <button
                            onClick={toggleVirtualCam}
                            title={status.virtualCamStatus === "STARTED" ? "Virtual Camera Aktif" : "Virtual Camera Off"}
                            className={`${headerControlClass} ${status.virtualCamStatus === "STARTED" ? "active" : ""}`}>
                            <Video className="w-3 h-3" />
                            Virtual Cam
                        </button>
                        <button
                            onClick={toggleReplayBuffer}
                            title={status.replayBufferStatus === "STARTED" ? "Replay Buffer Aktif" : "Replay Buffer Off"}
                            className={`${headerControlClass} ${status.replayBufferStatus === "STARTED" ? "active" : ""}`}>
                            <Radio className="w-3 h-3" />
                            Replay Buffer
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative z-40 inline-block text-left">
                        <button
                            onClick={() => setDropdownOpen({ ...dropdownOpen, streamTools: !dropdownOpen.streamTools })}
                            className={`${headerControlClass}`}>
                            <ToolCase className="w-3 h-3" />
                            Stream Tools
                            <ChevronDown className="w-3 h-3" />
                        </button>

                        <div className={`absolute right-0 top-full mt-2 w-48 origin-top-right rounded-xl bg-[#161616] border border-white/10 shadow-2xl shadow-black/50 ring-1 ring-black ring-opacity-5 focus:outline-none z-[200] transform transition-all duration-200 ${dropdownOpen.streamTools ? "block opacity-100 scale-100" : "hidden opacity-0 scale-95"}`} role="menu" aria-orientation="vertical" aria-labelledby="menu-button" tabIndex={-1}>
                            <div className="py-1">
                                <button onClick={() => {
                                    setLayout({ ...layout, updateTitle: true })
                                    setDropdownOpen({ ...dropdownOpen, streamTools: false })
                                }} className="group flex items-center gap-2 w-full px-4 py-2 text-[10px] font-bold uppercase hover:bg-white/5 transition-colors">
                                    <PenLine className="w-4 h-4" />
                                    Update Title
                                </button>
                                <button onClick={() => {
                                    setLayout({ ...layout, createPoll: true })
                                    setDropdownOpen({ ...dropdownOpen, streamTools: false })
                                }} className="group flex items-center gap-2 w-full px-4 py-2 text-[10px] font-bold uppercase hover:bg-white/5 transition-colors">
                                    <BarChart2 className="w-4 h-4" />
                                    Create Poll
                                </button>
                                <button onClick={() => {
                                    setLayout({ ...layout, createTask: true })
                                    setDropdownOpen({ ...dropdownOpen, streamTools: false })
                                }} className="group flex items-center gap-2 w-full px-4 py-2 text-[10px] font-bold uppercase hover:bg-white/5 transition-colors">
                                    <ListChecks className="w-4 h-4" />
                                    Create Task
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4 text-gray-400 font-mono-custom text-[9px] border-l border-white/10 pl-4">
                        <span>CPU: <span className="text-white">{status.cpuUsage}</span></span>
                        <span>FPS: <span className="text-white">{status.obsFps}</span></span>
                        <span>MEM: <span className="text-white">{status.obsMem}</span></span>
                    </div>
                    <button onClick={reloadPage} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <RefreshCcw className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <main className="flex-1 flex p-4 gap-4 overflow-hidden min-h-0">
                <div className="flex-1 flex flex-col gap-4">
                    {sectionVisible.streaming && (
                        <div className="grid grid-cols-2 gap-3 flex-none">
                            <div className="stat-card border-l-4 border-l-gray-600 cursor-pointer py-2 px-2.5" onClick={toggleStream}>
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <h3 className="text-gray-500 text-[8px] font-black uppercase mb-0.5">Streaming</h3>
                                        <div className={`flex items-center gap-1.5 text-[13px] font-black font-mono-custom ${status.streamStatus === "STOPPED" ? "text-gray-700" : "text-red-700"}`}>
                                            <span>{status.streamStatus === "STOPPED" ? "NOT STREAMING" : "STREAMING"}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <div className="text-right">
                                            <div className="text-[7px] text-gray-500 font-bold uppercase">Time</div>
                                            <span className="font-mono-custom text-[15px] leading-none">{status.streamTime}</span>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="text-right">
                                                <div className="text-[7px] text-gray-500 font-bold uppercase">Dropped</div>
                                                <div className="font-mono-custom text-[9px]">0</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[7px] text-gray-500 font-bold uppercase">Bitrate</div>
                                                <div className="font-mono-custom text-[9px]">{status.bitrate ?? "0 kbps"}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-10 w-full -mt-6 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={streamChartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="stream-fill" x1="0" x2="0" y1="0" y2="1">
                                                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.7} />
                                                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.05} />
                                                </linearGradient>
                                            </defs>
                                            <Area type="monotone" dataKey="value" stroke="#60a5fa" fill="url(#stream-fill)" strokeWidth={2} isAnimationActive={false} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="stat-card border-l-4 border-l-gray-600 cursor-pointer py-2 px-2.5" onClick={toggleRecord}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-gray-500 text-[8px] font-black uppercase mb-0.5">Recording</h3>
                                        <div className={`flex items-center gap-1.5 text-[13px] font-black font-mono-custom ${status.recordStatus === "STOPPED" ? "text-gray-500" : "text-red-500"}`}>
                                            <span>{status.recordStatus === "STOPPED" ? "IDLE" : "RECORDING"}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <div className="text-right">
                                            <div className="text-[7px] text-gray-500 font-bold uppercase">Time</div>
                                            <span className="font-mono-custom text-[15px] leading-none text-white">{status.recordTime}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[7px] text-gray-500 font-bold uppercase">Disk Space</div>
                                            <div className="font-mono-custom text-[9px]">{status.diskSpace ?? "200 GB"}</div>
                                        </div>
                                    </div>
                                </div>
                                {/* <div className="mt-1.5 h-6 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={recordingChartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="record-fill" x1="0" x2="0" y1="0" y2="1">
                                                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.7} />
                                                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.06} />
                                                </linearGradient>
                                            </defs>
                                            <Area type="monotone" dataKey="value" stroke="#a78bfa" fill="url(#record-fill)" strokeWidth={2} isAnimationActive={false} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div> */}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col lg:flex-row gap-4">
                    {sectionVisible.activity && (
                        <div className="bg-[#161616] border border-white/5 rounded-xl p-4 flex flex-col gap-3 flex-1 min-w-0">
                            <h3 className="text-blue-400 text-[9px] font-black uppercase flex items-center gap-2">
                                <Zap className="w-3 h-3" /> Aktivitas Terbaru
                            </h3>
                            <div className="space-y-2 text-[11px] overflow-y-auto custom-scrollbar max-h-37.5 pr-2">
                                {activityLogs.length === 0 ? (
                                    <div className="text-gray-500 italic">Menunggu aktivitas...</div>
                                ) : (
                                    activityLogs.map(log => {
                                        const logoSrc = log.platform === "twitch" ? "/assets/logo/twitch.png" : log.platform === "tiktok" ? "/assets/logo/tik-tok.png" : "/assets/logo/youtube.png";
                                        return (
                                            <div key={log.id} className="flex items-center gap-2 text-gray-300 bg-white/5 px-2 py-1.5 rounded border border-white/5 animate-in fade-in">
                                                <span className="text-gray-500 text-[10px] font-mono-custom">{log.time}</span>
                                                <Image src={logoSrc} alt={log.platform || ""} width={12} height={12} className="w-3 h-3 object-contain invert" />
                                                {/* <span className={`text-[9px] font-black uppercase px-1 py-0.5 rounded ${log.platform === "tiktok" ? "bg-[#FE2C55]/20 text-[#FE2C55]" : log.platform === "youtube" ? "bg-red-500/20 text-red-400" : "bg-purple-500/20 text-purple-400"}`}>{log.platform}</span> */}
                                                <span className="flex-1 truncate">{log.text}</span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                    {sectionVisible.gift && (
                        <div className="bg-[#161616] border border-white/5 rounded-xl p-4 flex flex-col gap-3 flex-1 min-w-0">
                            <h3 className="text-pink-400 text-[9px] font-black uppercase flex items-center gap-2">
                                <Share2 className="w-3 h-3" /> Gift &amp; Superchat
                            </h3>
                            <div className="space-y-2 text-[11px] overflow-y-auto custom-scrollbar max-h-37.5 pr-2">
                                {giftLogs.length === 0 ? (
                                    <div className="text-gray-500 italic">Belum ada gift / superchat...</div>
                                ) : (
                                    giftLogs.map(log => {
                                        const logoSrc = log.platform === "twitch" ? "/assets/logo/twitch.png" : log.platform === "tiktok" ? "/assets/logo/tik-tok.png" : "/assets/logo/youtube.png";
                                        return (
                                            <div key={log.id} className="flex items-center gap-2 text-gray-200 bg-gradient-to-r from-pink-500/10 to-purple-500/10 px-2 py-1.5 rounded border border-pink-500/20 animate-in fade-in">
                                                <span className="text-gray-500 text-[10px] font-mono-custom">{log.time}</span>
                                                <Image src={logoSrc} alt={log.platform} width={14} height={14} className="w-3.5 h-3.5 object-contain invert" />
                                                <span className="font-black text-white text-[10px] truncate">{log.user}</span>
                                                <span className="flex-1 truncate text-gray-300">{log.text}</span>
                                                {log.count ? <span className="text-pink-400 font-black text-[10px]">x{log.count}</span> : null}
                                                {log.amount ? <span className="text-yellow-400 font-bold text-[10px]">{log.amount}</span> : null}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                    </div>

                    {sectionVisible.chat && (
                        <div className="flex-1 bg-black/30 border border-white/5 rounded-xl overflow-hidden flex flex-col">
                            <div className="px-3 py-2.5 border-b border-white/5 bg-white/5 flex items-center gap-3">
                                <div className="flex items-center gap-2 shrink-0">
                                    <MessageSquare className="w-4 h-4 text-green-400" />
                                    <h3 className="text-gray-200 text-[9px] font-black uppercase whitespace-nowrap">Live Stream Chat</h3>
                                </div>
                                <div className="flex-1 flex items-center gap-2 justify-end min-w-0">
                                    <div className="relative flex-1 max-w-[260px]">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                        <input
                                            type="text"
                                            value={chatSearch}
                                            onChange={(e) => setChatSearch(e.target.value)}
                                            placeholder="Cari chat..."
                                            className="w-full h-8 pl-8 pr-7 bg-black/30 border border-white/10 rounded-full text-[11px] text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 focus:bg-black/40"
                                        />
                                        {chatSearch && (
                                            <button onClick={() => setChatSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-[8px] font-mono-custom text-gray-500 shrink-0">{filteredChatMessages.length}/{chatMessages.length}</span>
                                </div>
                            </div>
                            {pinnedChat && (
                                <div
                                    className="px-4 py-3 bg-white/10 border-b border-white/5 relative shadow-lg"
                                    style={{ opacity: pinnedExiting ? 0 : 1, transition: "opacity 0.3s ease" }}
                                >
                                    <div className="flex gap-2 items-start">
                                        <Pin className="w-3 h-3 text-yellow-400 mt-1 flex-none drop-shadow" />
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="font-bold text-[10px] text-white flex items-center gap-1">
                                                <span className="truncate max-w-25">{pinnedChat.user}</span>
                                                <span className="text-[8px] text-gray-400 uppercase flex-none">({pinnedChat.platform})</span>
                                            </div>
                                            <div className="text-[11px] text-gray-300 italic line-clamp-3">{pinnedChat.text}</div>
                                        </div>
                                    </div>
                                    <button onClick={unpinMessage} className="absolute top-2 right-2 text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded transition-colors">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                            <div className="flex-1 overflow-y-auto p-4 text-[12px] space-y-3 custom-scrollbar">
                                {chatMessages.length === 0 ? null : null}
                                {chatMessages.length > 0 && filteredChatMessages.length === 0 && <div className="text-gray-500 italic">Tidak ada hasil untuk &quot;{chatSearch}&quot;</div>}
                                {filteredChatMessages.map(message => {
                                    const getPlatformLogo = (p: string) => p === "twitch" ? "/assets/logo/twitch.png" : p === "tiktok" ? "/assets/logo/tik-tok.png" : "/assets/logo/youtube.png";
                                    const logoSrc = getPlatformLogo(message.platform);
                                    const avatarInitials = message.user.substring(0, 2).toUpperCase();

                                    return (
                                        <div key={message.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 group relative">
                                            <div className={`w-8 h-8 flex-none rounded-full flex items-center justify-center font-bold text-[10px] text-white shadow-lg ${message.platform === "twitch" ? "bg-purple-600" : message.platform === "tiktok" ? "bg-[#FE2C55]" : "bg-red-600"}`}>
                                                {message.avatar ? <img src={message.avatar} alt={message.user} className="w-8 h-8 rounded-full object-cover" /> : avatarInitials}
                                            </div>
                                            <div className="flex-1 min-w-0 pr-6">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <Image src={logoSrc} alt={message.platform} width={10} height={10} className="w-2.5 h-2.5 object-contain invert" />
                                                    <span className="font-black text-white text-[10px] uppercase">{message.user}</span>
                                                </div>
                                                <div className="text-gray-300 leading-relaxed">
                                                    {Array.isArray(parseEmotes(message.text, message.emotes))
                                                        ? (parseEmotes(message.text, message.emotes) as Array<string | { type: "img"; src: string; alt: string }>).map((part, index) => typeof part === "string" ? <span key={`${message.id}-${index}`}>{part}</span> : <img key={`${message.id}-${index}`} src={part.src} alt={part.alt} title={part.alt} className="chat-emote inline-block w-4 h-4 align-text-bottom mx-0.5" />)
                                                        : message.text}
                                                </div>
                                            </div>
                                            <button onClick={() => pinMessage(message.user, message.text, message.platform, message.avatar)} className="opacity-0 group-hover:opacity-100 absolute top-0 right-0 p-1.5 bg-white/10 hover:bg-white/20 rounded text-gray-400 hover:text-white transition-all shadow-md" title="Pin Chat">
                                                <Pin className="w-3 h-3" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                </div>

                <aside className="w-[18rem] max-w-[18rem] flex flex-col gap-4 min-h-0">
                    <div className="flex bg-[#161616] rounded-lg p-1 border border-white/5">
                        <button onClick={() => setActiveTab("stats")} className={`tab-btn flex-1 py-1.5 rounded font-black text-[9px] uppercase tracking-widest transition-all ${activeTab === "stats" ? "active" : ""}`}>Statistik</button>
                        <button onClick={() => setActiveTab("briefing")} className={`tab-btn flex-1 py-1.5 rounded font-black text-[9px] uppercase tracking-widest transition-all ${activeTab === "briefing" ? "active" : ""}`}>Briefing</button>
                        <button onClick={() => setActiveTab("system")} className={`tab-btn flex-1 py-1.5 rounded font-black text-[9px] uppercase tracking-widest transition-all ${activeTab === "system" ? "active" : ""}`}>Sistem</button>
                    </div>

                    <div className="flex-1 flex flex-col gap-4 min-h-0">
                        {activeTab === "stats" && (
                            <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar min-h-0">
                                <div className="space-y-3">
                                    <h4 className="text-gray-500 text-[9px] font-black uppercase px-1">Penonton Real-time</h4>

                                    {sectionVisible.cardYt && (
                                        <div className="stat-card border border-red-500/20 group relative overflow-visible py-2 px-2.5">
                                            <div className="flex justify-between items-start mb-1 relative z-10">
                                                <div className="flex items-center gap-1.5">
                                                    <Image src="/assets/logo/youtube.png" alt="YouTube Logo" width={14} height={14} className="w-3.5 h-3.5 invert" />
                                                    <span className="font-black text-[9px] uppercase">YouTube</span>
                                                </div>
                                                <span className={`text-[7px] font-bold uppercase ${youtubeLive ? "text-green-500 pulse-live" : "text-gray-500"}`}>{youtubeLive ? "LIVE" : "Offline"}</span>
                                            </div>
                                            <div className="flex items-end justify-between relative z-10">
                                                <div>
                                                    <span className="text-xl font-bold font-mono-custom tracking-tighter leading-none">{youtubeViewerCountSB ?? 0}</span>
                                                    <div className="flex gap-2 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                        <div className="flex items-center gap-1 text-[8px] text-gray-400">
                                                            <ThumbsUp className="w-2.5 h-2.5" /> <span>{youtubeViewerCountSB ?? 0}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[8px] text-gray-400">
                                                            <Eye className="w-2.5 h-2.5" /> <span>{youtubeViewerCountSB ?? 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[7px] text-red-500 font-bold uppercase">Current Viewers</div>
                                                    <div className="text-[7px] text-gray-500 font-bold uppercase mt-0.5">Viewers:
                                                        <span className="text-white">{youtubeViewerCountSB ?? 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {(youtubeViewerCountSB != null && youtubeViewerCountSB > 0) && (
                                                <div className="h-10 w-full -mt-6 relative">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={youtubeChartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                                                            <defs>
                                                                <linearGradient id="youtube-fill" x1="0" x2="0" y1="0" y2="1">
                                                                    <stop offset="0%" stopColor="#f87171" stopOpacity={0.7} />
                                                                    <stop offset="100%" stopColor="#f87171" stopOpacity={0.05} />
                                                                </linearGradient>
                                                            </defs>
                                                            <Area type="monotone" dataKey="value" stroke="#f87171" fill="url(#youtube-fill)" strokeWidth={2} isAnimationActive={false} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {sectionVisible.cardTw && (
                                        <div className="stat-card border border-purple-500/30 py-2 px-2.5">
                                            <div className="flex justify-between items-start mb-1 relative z-10">
                                                <div className="flex items-center gap-1.5">
                                                    <Image src="/assets/logo/twitch.png" alt="Twitch Logo" width={14} height={14} className="w-3.5 h-3.5 invert" />
                                                    <span className="font-black text-[9px] uppercase">Twitch</span>
                                                </div>
                                                <span className={`text-[7px] font-bold uppercase ${twitchLive ? "text-green-500 pulse-live" : "text-gray-500"}`}>{twitchLive ? "LIVE" : "Offline"}</span>
                                            </div>
                                            <div className="flex items-end justify-between relative z-10">
                                                <span className="text-xl font-bold font-mono-custom tracking-tighter leading-none">{twitchViewerCountSB ?? twitchViewerCount}</span>
                                                <div className="text-right">
                                                    <div className="text-[7px] text-purple-400 font-bold uppercase">Current Viewers</div>
                                                    <div className="text-[7px] text-gray-500 font-bold uppercase mt-0.5">Chatters: <span className="text-white">{twitchViewerCount}</span></div>
                                                </div>
                                            </div>
                                            {(twitchViewerCountSB != null && twitchViewerCountSB > 0) && (
                                                <div className="h-10 w-full -mt-6 relative">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={twitchChartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                                                            <defs>
                                                                <linearGradient id="twitch-fill" x1="0" x2="0" y1="0" y2="1">
                                                                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.7} />
                                                                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.05} />
                                                                </linearGradient>
                                                            </defs>
                                                            <Area type="monotone" dataKey="value" stroke="#a78bfa" fill="url(#twitch-fill)" strokeWidth={2} isAnimationActive={false} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {sectionVisible.cardTt && (
                                        <div className="stat-card border border-[#FE2C55]/30 py-2 px-2.5 group relative overflow-hidden">
                                            <div className="flex justify-between items-start mb-1 relative z-10">
                                                <div className="flex items-center gap-1.5">
                                                    <Image src="/assets/logo/tik-tok.png" alt="TikTok Logo" width={14} height={14} className="w-3.5 h-3.5 invert" />
                                                    <span className="font-black text-[9px] uppercase text-[#FE2C55]">TikTok</span>
                                                </div>
                                                <span className={`text-[7px] font-bold uppercase ${tiktokStatus === "CONNECTED" ? "text-green-500 pulse-live" : "text-gray-500"}`}>{tiktokStatus === "CONNECTED" ? "LIVE" : "Offline"}</span>
                                            </div>
                                            <div className="flex items-end justify-between relative z-10">
                                                <div>
                                                    <span className="text-xl font-bold font-mono-custom tracking-tighter leading-none">{tiktokRoomViewerCount ?? tiktokViewerCount}</span>
                                                    <div className="flex gap-1.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                        <div className="flex items-center gap-1 text-[8px] text-gray-400">
                                                            <Eye className="w-2.5 h-2.5" /> <span>{tiktokRoomViewerCount ?? tiktokViewerCount}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[8px] text-gray-400">
                                                            <Users className="w-2.5 h-2.5" /> <span>{tiktokTotalUser ?? 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[7px] text-[#25F4EE] font-bold uppercase">Realtime Penonton</div>
                                                    <div className="text-[7px] text-gray-500 font-bold uppercase mt-0.5">Total User: <span className="text-white">{tiktokTotalUser ?? 0}</span></div>
                                                </div>
                                            </div>
                                            {((tiktokRoomViewerCount ?? tiktokViewerCount ?? 0) > 0) && (
                                                <div className="h-10 w-full -mt-6 relative">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={tiktokChartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                                                            <defs>
                                                                <linearGradient id="tiktok-fill" x1="0" x2="0" y1="0" y2="1">
                                                                    <stop offset="0%" stopColor="#FE2C55" stopOpacity={0.45} />
                                                                    <stop offset="100%" stopColor="#25F4EE" stopOpacity={0.05} />
                                                                </linearGradient>
                                                            </defs>
                                                            <Area type="monotone" dataKey="value" stroke="#FE2C55" fill="url(#tiktok-fill)" strokeWidth={2} isAnimationActive={false} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 bg-[#161616] border border-white/5 rounded-xl p-4 flex flex-col overflow-hidden min-h-62.5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-gray-400 text-[9px] font-black uppercase">Siapa yang Datang</h3>
                                        <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-[8px] font-bold"></span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                                        {/* <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5 animate-in slide-in-from-right-2">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-black text-[10px] text-black">RI</div>
                                            <div>
                                                <div className="font-bold text-white text-[10px]">Rizky_JR</div>
                                                <div className="flex items-center gap-1 text-[8px] text-gray-500 uppercase">
                                                    <Image src="/assets/logo/twitch.png" alt="twitch" width={10} height={10} className="w-2.5 h-2.5 object-contain invert" /> twitch
                                                </div>
                                            </div>
                                        </div> */}
                                    </div>
                                                                        <div className="mt-4 bg-blue-600 rounded-xl p-4 flex items-center justify-between shadow-lg shadow-blue-900/20">
                                        <div>
                                            <div className="text-[8px] font-black uppercase opacity-70">Total Penonton Chat</div>
                                            <div className="text-3xl font-black font-mono-custom leading-none mt-1">1</div>
                                        </div>
                                        <Users className="w-8 h-8 opacity-30" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "briefing" && (
                            <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
                                <div className="flex items-center justify-between px-1">
                                    <h4 className="text-gray-500 text-[9px] font-black uppercase">Stream Briefing</h4>
                                    <button onClick={requestAIBriefing} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white text-black text-[8px] font-black uppercase hover:bg-zinc-200 transition-all">
                                        <Sparkles className="w-3 h-3" />
                                        AI Sync
                                    </button>
                                </div>

                                <div className="briefing-card space-y-3">
                                    <div>
                                        <label className="text-[8px] font-black text-blue-400 uppercase block mb-1">Session Title</label>
                                        <input
                                            type="text"
                                            className="briefing-input text-[13px] font-black"
                                            placeholder="Judul Stream Hari Ini..."
                                            value={briefing.title}
                                            onChange={handleBriefingTitleChange}
                                        />
                                    </div>
                                    <div className="border-t border-white/5 pt-2">
                                        <label className="text-[8px] font-black text-purple-400 uppercase block mb-1">Main Objective</label>
                                        <textarea
                                            className="briefing-input text-gray-300 w-full h-16 resize-none leading-relaxed"
                                            placeholder="Apa tujuan utama stream kali ini?"
                                            value={briefing.goal}
                                            onChange={handleBriefingGoalChange}
                                        />
                                    </div>
                                </div>

                                <div className="briefing-card flex-1 flex flex-col min-h-[200px]">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-[8px] font-black text-green-400 uppercase">Stream Outline</label>
                                        <button onClick={handleAddOutlineItem} className="text-gray-500 hover:text-white">
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1">
                                        {briefing.outline.map((item, index) => (
                                            <div key={index} className="outline-item flex items-center gap-2 bg-white/5 p-2 rounded">
                                                <input
                                                    type="checkbox"
                                                    className="outline-checkbox w-4 h-4"
                                                    checked={item.checked}
                                                    onChange={() => handleToggleOutlineItem(index)}
                                                />
                                                <input
                                                    type="text"
                                                    className="briefing-input flex-1 text-[9px]"
                                                    placeholder="New point..."
                                                    value={item.text}
                                                    onChange={(e) => handleUpdateOutlineItem(index, e.target.value)}
                                                />
                                                <button
                                                    onClick={() => handleRemoveOutlineItem(index)}
                                                    className="text-gray-500 hover:text-red-400 p-1"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="briefing-card">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-[8px] font-black text-orange-400 uppercase block">Quick Notes</label>
                                        <button onClick={toggleNotesMode} className="text-gray-500 hover:text-white transition-colors">
                                            {isNotesPreview ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                    <div>
                                        <textarea
                                            className="briefing-input w-full h-32 resize-none text-[10px] leading-relaxed"
                                            placeholder="Catatan tambahan, link, atau info penting..."
                                            value={briefing.notes}
                                            onChange={handleBriefingNotesChange}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={copyBriefingToChat} className="py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[8px] font-black uppercase transition-all flex items-center justify-center gap-2">
                                        <Share2 className="w-3 h-3" /> Share to Chat
                                    </button>
                                    <button onClick={clearBriefing} className="py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-[8px] font-black uppercase text-red-400 transition-all">
                                        Clear All
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === "system" && (
                            <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 min-h-0">
                                <h4 className="text-gray-500 text-[9px] font-black uppercase px-1">Dashboard Layout</h4>
                                <div className="stat-card space-y-3">
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-gray-400 uppercase font-bold text-[8px]">Streaming Cards</span>
                                        <input type="checkbox" checked={sectionVisible.streaming} onChange={(e) => toggleSection("streaming", e.target.checked)} className="w-3 h-3 accent-blue-500 cursor-pointer" />
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-t border-white/5">
                                        <span className="text-gray-400 uppercase font-bold text-[8px]">Activity Log</span>
                                        <input type="checkbox" checked={sectionVisible.activity} onChange={(e) => toggleSection("activity", e.target.checked)} className="w-3 h-3 accent-blue-500 cursor-pointer" />
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-t border-white/5">
                                        <span className="text-gray-400 uppercase font-bold text-[8px]">Gift / Superchat</span>
                                        <input type="checkbox" checked={sectionVisible.gift} onChange={(e) => toggleSection("gift", e.target.checked)} className="w-3 h-3 accent-blue-500 cursor-pointer" />
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-t border-white/5">
                                        <span className="text-gray-400 uppercase font-bold text-[8px]">Live Chat</span>
                                        <input type="checkbox" checked={sectionVisible.chat} onChange={(e) => toggleSection("chat", e.target.checked)} className="w-3 h-3 accent-blue-500 cursor-pointer" />
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-t border-white/5">
                                        <span className="text-gray-400 uppercase font-bold text-[8px]">YouTube Chart</span>
                                        <input type="checkbox" checked={sectionVisible.cardYt} onChange={(e) => toggleSection("cardYt", e.target.checked)} className="w-3 h-3 accent-blue-500 cursor-pointer" />
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-t border-white/5">
                                        <span className="text-gray-400 uppercase font-bold text-[8px]">Twitch Chart</span>
                                        <input type="checkbox" checked={sectionVisible.cardTw} onChange={(e) => toggleSection("cardTw", e.target.checked)} className="w-3 h-3 accent-blue-500 cursor-pointer" />
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-t border-white/5">
                                        <span className="text-gray-400 uppercase font-bold text-[8px]">TikTok Graph</span>
                                        <input type="checkbox" checked={sectionVisible.cardTt} onChange={(e) => toggleSection("cardTt", e.target.checked)} className="w-3 h-3 accent-blue-500 cursor-pointer" />
                                    </div>
                                </div>

                                <h4 className="text-gray-500 text-[9px] font-black uppercase px-1">OBS System Info</h4>
                                <div className="stat-card space-y-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <input
                                            type="text"
                                            value={obsConfig.address}
                                            onChange={(e) => {
                                                obsConfigDirtyRef.current = true;
                                                if (obsReconnectTimerRef.current) {
                                                    clearTimeout(obsReconnectTimerRef.current);
                                                    obsReconnectTimerRef.current = null;
                                                }
                                                setObsConfig({ ...obsConfig, address: e.target.value });
                                            }}
                                            placeholder="Address"
                                            className="h-[36px] flex-1 min-w-0 bg-white/5 border border-white/10 rounded px-2 text-[10px] text-white font-bold focus:outline-none focus:border-blue-500"
                                        />
                                        <input
                                            type="text"
                                            value={obsConfig.port}
                                            onChange={(e) => {
                                                obsConfigDirtyRef.current = true;
                                                if (obsReconnectTimerRef.current) {
                                                    clearTimeout(obsReconnectTimerRef.current);
                                                    obsReconnectTimerRef.current = null;
                                                }
                                                setObsConfig({ ...obsConfig, port: e.target.value });
                                            }}
                                            placeholder="Port"
                                            className="h-[36px] w-14 min-w-0 bg-white/5 border border-white/10 rounded px-2 text-[10px] text-white font-bold focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="password"
                                            value={obsConfig.password}
                                            autoComplete="new-password"
                                            data-lpignore="true"
                                            data-form-type="other"
                                            onChange={(e) => {
                                                obsConfigDirtyRef.current = true;
                                                if (obsReconnectTimerRef.current) {
                                                    clearTimeout(obsReconnectTimerRef.current);
                                                    obsReconnectTimerRef.current = null;
                                                }
                                                setObsConfig({ ...obsConfig, password: e.target.value });
                                            }}
                                            placeholder="Password (opsional)"
                                            className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-[10px] text-white font-bold focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <button
                                        onClick={status.obsStatus === "CONNECTED" ? disconnectOBS : reconnectOBS}
                                        className={`${connectButtonClass} w-full bg-blue-600 hover:bg-blue-500`}
                                    >
                                        {status.obsStatus === "CONNECTED" ? "Disconnect" : "Connect"}
                                    </button>
                                    <div className="flex justify-between items-center py-1 border-t border-white/5">
                                        <span className="text-gray-400 uppercase font-bold text-[8px]">Status</span>
                                        <span className={`${status.obsStatus === "CONNECTED" ? "text-green-400" : "text-gray-500"} font-black uppercase text-[10px]`}>{status.obsStatus}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-t border-white/5">
                                        <span className="text-gray-400 uppercase font-bold text-[8px]">Auto Connect</span>
                                        <input
                                            type="checkbox"
                                            checked={obsConfig.autoConnect}
                                            onChange={(e) => {
                                                obsConfigDirtyRef.current = true;
                                                if (obsReconnectTimerRef.current) {
                                                    clearTimeout(obsReconnectTimerRef.current);
                                                    obsReconnectTimerRef.current = null;
                                                }
                                                setObsConfig({ ...obsConfig, autoConnect: e.target.checked });
                                            }}
                                            className="w-3 h-3 accent-blue-500 cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <h4 className="text-gray-500 text-[9px] font-black uppercase px-1 mt-2">OBS Outputs</h4>
                                <div className="stat-card space-y-3">
                                    <div className="flex items-center justify-between py-1">
                                        <div className="flex items-center gap-2">
                                            <Video className="w-3 h-3 text-blue-400" />
                                            <span className="text-white font-black uppercase text-[10px]">Virtual Camera</span>
                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${status.virtualCamStatus === "STARTED" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>{status.virtualCamStatus || "STOPPED"}</span>
                                        </div>
                                        <button
                                            onClick={toggleVirtualCam}
                                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-colors ${status.virtualCamStatus === "STARTED" ? "bg-red-600 hover:bg-red-500 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
                                        >
                                            {status.virtualCamStatus === "STARTED" ? "Stop" : "Activate"}
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            <Radio className="w-3 h-3 text-cyan-400" />
                                            <span className="text-white font-black uppercase text-[10px]">Replay Buffer</span>
                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${status.replayBufferStatus === "STARTED" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>{status.replayBufferStatus || "STOPPED"}</span>
                                        </div>
                                        <button
                                            onClick={toggleReplayBuffer}
                                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-colors ${status.replayBufferStatus === "STARTED" ? "bg-red-600 hover:bg-red-500 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
                                        >
                                            {status.replayBufferStatus === "STARTED" ? "Stop" : "Activate"}
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-gray-600 leading-relaxed">Virtual Camera & Replay Buffer butuh diaktifkan di OBS Settings → Output. Tombol di header juga bisa.</p>
                                </div>

                                <h4 className="text-gray-500 text-[9px] font-black uppercase px-1 mt-2">Streamer.bot System Info</h4>
                                <div className="stat-card space-y-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <input
                                            type="text"
                                            value={sbConfig.address}
                                            onChange={(e) => {
                                                sbConfigDirtyRef.current = true;
                                                if (sbReconnectTimerRef.current) {
                                                    clearTimeout(sbReconnectTimerRef.current);
                                                    sbReconnectTimerRef.current = null;
                                                }
                                                setSbConfig({ ...sbConfig, address: e.target.value });
                                            }}
                                            placeholder="Address"
                                            className="h-[36px] flex-1 min-w-0 bg-white/5 border border-white/10 rounded px-2 text-[10px] text-white font-bold focus:outline-none focus:border-purple-500"
                                        />
                                        <input
                                            type="text"
                                            value={sbConfig.port}
                                            onChange={(e) => {
                                                sbConfigDirtyRef.current = true;
                                                if (sbReconnectTimerRef.current) {
                                                    clearTimeout(sbReconnectTimerRef.current);
                                                    sbReconnectTimerRef.current = null;
                                                }
                                                setSbConfig({ ...sbConfig, port: e.target.value });
                                            }}
                                            placeholder="Port"
                                            className="h-[36px] w-14 min-w-0 bg-white/5 border border-white/10 rounded px-2 text-[10px] text-white font-bold focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="password"
                                            value={sbConfig.password}
                                            autoComplete="new-password"
                                            data-lpignore="true"
                                            data-form-type="other"
                                            onChange={(e) => {
                                                sbConfigDirtyRef.current = true;
                                                if (sbReconnectTimerRef.current) {
                                                    clearTimeout(sbReconnectTimerRef.current);
                                                    sbReconnectTimerRef.current = null;
                                                }
                                                setSbConfig({ ...sbConfig, password: e.target.value });
                                            }}
                                            placeholder="Password (opsional)"
                                            className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-[10px] text-white font-bold focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={sbConfig.endpoint}
                                            onChange={(e) => {
                                                sbConfigDirtyRef.current = true;
                                                if (sbReconnectTimerRef.current) {
                                                    clearTimeout(sbReconnectTimerRef.current);
                                                    sbReconnectTimerRef.current = null;
                                                }
                                                setSbConfig({ ...sbConfig, endpoint: e.target.value });
                                            }}
                                            placeholder="Endpoint (opsional)"
                                            className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-[10px] text-white font-bold focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <button
                                        onClick={status.sbotStatus === "CONNECTED" ? disconnectSB : reconnectSB}
                                        className={`${connectButtonClass} w-full bg-purple-600 hover:bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]`}
                                    >
                                        {status.sbotStatus === "CONNECTED" ? "Disconnect" : "Connect"}
                                    </button>
                                    <div className="flex justify-between items-center py-1 border-t border-white/5">
                                        <span className="text-gray-400 uppercase font-bold text-[8px]">Status</span>
                                        <span className={`${status.sbotStatus === "CONNECTED" ? "text-green-400" : "text-gray-500"} font-black uppercase text-[10px]`}>{status.sbotStatus}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-t border-white/5">
                                        <span className="text-gray-400 uppercase font-bold text-[8px]">Auto Connect</span>
                                        <input
                                            type="checkbox"
                                            checked={sbConfig.autoConnect}
                                            onChange={(e) => setSbConfig({ ...sbConfig, autoConnect: e.target.checked })}
                                            className="w-3 h-3 cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <h4 className="text-gray-500 text-[9px] font-black uppercase px-1 mt-2">TikTok Connection</h4>
                                <div className="stat-card space-y-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-white text-xs font-bold pl-1">@</span>
                                        <input
                                            id="tiktok-username"
                                            type="text"
                                            value={tiktokConfig.username}
                                            onChange={(e) => setTiktokConfig({ ...tiktokConfig, username: e.target.value })}
                                            placeholder="username"
                                            className="h-[36px] flex-1 min-w-0 bg-white/5 border border-white/10 rounded px-2 text-[10px] text-white font-bold focus:outline-none focus:border-[#FE2C55]"
                                        />
                                    </div>
                                    <button
                                        id="btn-tiktok-connect"
                                        onClick={tiktokStatus === "CONNECTED" ? disconnectTikTok : connectTikTok}
                                        disabled={tiktokStatus === "CONNECTING"}
                                        className={tiktokStatus === "CONNECTED" || tiktokStatus === "CONNECTING" || tiktokStatus === "ERROR" ? `${getTiktokButtonClass()} w-full` : `${connectButtonClass} w-full bg-[#FE2C55] hover:bg-[#E62254] shadow-[0_0_10px_rgba(254,44,85,0.4)]`}>
                                        {getTiktokButtonText()}
                                    </button>
                                    {tiktokStatus === "ERROR" && tiktokError && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                            <span className="text-red-400 text-[10px] font-bold leading-tight break-words">{tiktokError}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center py-1 border-t border-white/5">
                                        <span className="text-gray-400 uppercase font-bold text-[8px]">Status</span>
                                        <span id="tiktok-connection-state" className={`${getTiktokStatusColor()} font-black text-[10px] ${tiktokStatus==="ERROR" ? "normal-case max-w-[180px] text-right leading-tight break-words" : "uppercase"}`}>{tiktokStatus==="ERROR" && tiktokError ? tiktokError : tiktokStatus}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-t border-white/5">
                                        <span className="text-gray-400 uppercase font-bold text-[8px]">Auto Connect</span>
                                        <input
                                            type="checkbox"
                                            checked={tiktokConfig.autoConnect}
                                            onChange={(e) => setTiktokConfig({ ...tiktokConfig, autoConnect: e.target.checked })}
                                            className="w-3 h-3 cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <h4 className="text-gray-500 text-[9px] font-black uppercase px-1 mt-2">TikTok → Streamer.bot</h4>
                                <div className="stat-card space-y-2">
                                    <p className="text-[9px] text-gray-600 leading-relaxed">Pemetaan event dikelola di halaman Integrasi (tersimpan di database).</p>
                                    <Link href="/integrations" className="h-9 flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white">
                                        <Zap className="w-3 h-3" /> Kelola Integrasi
                                    </Link>
                                    <div className="flex justify-between items-center py-1 border-t border-white/5">
                                        <span className="text-gray-400 uppercase font-bold text-[8px]">Event aktif</span>
                                        <span className="text-white font-black uppercase text-[10px]">
                                            {(["chat", "gift", "like", "follow", "member"] as const).filter((k) => ttSbMap[k].enabled).length}/5
                                        </span>
                                    </div>
                                </div>

                                <h4 className="text-gray-500 text-[9px] font-black uppercase px-1 mt-2">Dock Auto Minimize</h4>
                                <div className="stat-card space-y-3">
                                    <label className="flex items-center justify-between p-2.5 bg-white/5 border border-white/10 rounded-xl cursor-pointer">
                                        <div>
                                            <div className="text-white font-black uppercase text-[10px] flex items-center gap-2"><Minimize2 className="w-3 h-3 text-violet-400" /> Auto Minimize</div>
                                            <div className="text-gray-500 text-[9px]">Minimize Poll/Task/Timer/Swiper otomatis setelah delay</div>
                                        </div>
                                        <input type="checkbox" checked={autoMinimizeEnabled} onChange={e=>setAutoMinimizeEnabled(e.target.checked)} className="w-4 h-4 accent-violet-500 cursor-pointer" />
                                    </label>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-gray-400 uppercase font-bold text-[8px]">Delay (detik)</span>
                                        <div className="flex items-center gap-2">
                                            <input type="range" min={2} max={60} step={1} value={autoMinimizeDelay} onChange={e=>setAutoMinimizeDelay(parseInt(e.target.value)||5)} disabled={!autoMinimizeEnabled} className="w-24 accent-violet-500 cursor-pointer disabled:opacity-30" />
                                            <span className="text-white font-black text-[11px] w-8 text-center">{autoMinimizeDelay}s</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-gray-600 leading-relaxed">Default minimize sudah aktif. Jika Auto Minimize ON, panel yang di-expand akan minimize otomatis setelah {autoMinimizeDelay}s. Poll/task/timer baru akan expand dulu lalu minimize lagi.</p>
                                </div>

                                <div className="flex-1 bg-black border border-white/5 rounded-xl p-4 flex flex-col overflow-hidden">
                                    <h3 className="text-blue-400 text-[9px] font-black uppercase flex items-center gap-2 mb-3">
                                        <Terminal className="w-3 h-3" /> Log Sistem
                                    </h3>
                                    <div className="flex-1 font-mono-custom text-[10px] space-y-1 overflow-y-auto custom-scrollbar">
                                        <div><span className="text-gray-600">[05:49:49 PM]</span> <span className="text-green-400">Streamer.bot Terhubung</span></div>
                                        <div><span className="text-gray-600">[05:49:49 PM]</span> <span className="text-green-400">Events Subscribed: Twitch &amp; YouTube</span></div>
                                        <div><span className="text-gray-600">[05:49:49 PM]</span> <span className="text-green-400">OBS Terhubung!</span></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            </main>


            {/* Update Title Modal */}
            <div
                className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${layout.updateTitle ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
            >
                <div
                    className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${layout.updateTitle ? "opacity-100" : "opacity-0"
                        }`}
                    onClick={closeUpdateTitle}
                />
                <div className={`relative title-modal-content bg-[#161616] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col transition-all duration-300 ${layout.updateTitle ? "scale-100 opacity-100" : "scale-95 opacity-0"
                    }`}>
                    <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Edit3 className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-white font-black uppercase text-sm">Update Stream Info</h2>
                                <p className="text-gray-500 text-[10px]">Broadcast to Twitch &amp; YouTube</p>
                            </div>
                        </div>
                        <button onClick={closeUpdateTitle} className="text-gray-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>


                    <div className="p-6 space-y-4">
                        <div>
                            <Label className="block text-gray-400 font-bold uppercase text-[9px] mb-1.5">Stream Title</Label>
                            <TextArea
                                rows={2}
                                className="w-full rounded-lg px-3 py-2 text-sm font-medium resize-none bg-transparent border border-gray-600 text-white"
                                value={titleValue}
                                onChange={(e) => setTitleValue(e.target.value)}
                                placeholder="Masukkan judul stream yang menarik..."
                            />
                        </div>

                        <div>
                            <Label className="block text-gray-400 font-bold uppercase text-[9px] mb-1.5">Category / Game (Opsional)</Label>
                            <TextArea
                                rows={2}
                                className="w-full rounded-lg px-3 py-2 text-sm font-medium resize-none bg-transparent border border-gray-600 text-white"
                                value={gameValue}
                                onChange={(e) => setGameValue(e.target.value)}
                                placeholder="Contoh: Just Chatting, Valorant"
                            />
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-white/10 bg-black/20 flex gap-3 justify-end">
                        <button onClick={closeUpdateTitle} className="px-4 py-2 rounded-lg font-bold text-gray-400 text-[10px] uppercase hover:bg-white/5 transition-colors">
                            Batal
                        </button>
                        <button onClick={handleUpdateTitle} className="px-6 py-2 rounded-lg font-black text-black text-[10px] uppercase bg-white hover:bg-zinc-200 transition-all flex items-center gap-2">
                            Update
                        </button>
                    </div>

                </div>
            </div>

            {/* Dock Control Swiper - Poll / Task / Timer swipeable, tidak menumpuk - card asli tetap */}
            {(() => {
                const hasPoll = !!activePoll;
                const hasTaskItems = (activeTasks as { items?: unknown[] })?.items?.length || 0;
                const hasTimer = true;
                const tabs: Array<{ id: 'poll'|'task'|'timer'; label: string; icon: React.ReactNode; count?: number; show: boolean }> = [
                    { id: 'poll', label: 'POLL', icon: <BarChart2 className="w-3 h-3" />, count: hasPoll ? (activePoll as { total: number }).total : undefined, show: hasPoll },
                    { id: 'task', label: 'TASK', icon: <ListChecks className="w-3 h-3" />, count: hasTaskItems ? hasTaskItems : undefined, show: true },
                    { id: 'timer', label: 'TIMER', icon: <Clock className="w-3 h-3" />, show: hasTimer },
                ];
                const visibleTabs = tabs.filter(t => t.show);
                const safeIndex = Math.min(dockSwiperIndex, Math.max(0, visibleTabs.length - 1));
                if (visibleTabs.length === 0) return null;
                const go = (dir: number) => setDockSwiperIndex((i) => (i + dir + visibleTabs.length) % visibleTabs.length);
                return (
                <div className={dockSwiperMinimized ? 'fixed z-[110] bg-[#0f0f0f]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden will-change-transform transform-gpu transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] bottom-3 left-1/2 -translate-x-1/2 w-[96%] max-w-[420px] rounded-[20px]' : 'fixed z-[110] bg-[#0f0f0f]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden will-change-transform transform-gpu transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] bottom-4 left-1/2 -translate-x-1/2 w-[96%] max-w-[720px] rounded-2xl'}>
                    <div className="flex items-center justify-between px-2 py-1.5 bg-white/[0.03] border-b border-white/5">
                        <div className="flex items-center gap-1">
                            {visibleTabs.map((t, i) => (
                                <button key={t.id} onClick={() => setDockSwiperIndex(i)} className={`h-7 px-3 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 border transition-all ${i===safeIndex ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}>
                                    {t.icon} {t.label} {t.count !== undefined && <span className={`px-1 py-0.5 rounded-full text-[9px] ${i===safeIndex ? 'bg-black text-white' : 'bg-white/10 text-white'}`}>{t.count}</span>}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setDockSwiperMinimized(!dockSwiperMinimized)} className="w-7 h-7 grid place-items-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white" title={dockSwiperMinimized ? 'Expand' : 'Minimize'}>{dockSwiperMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}</button>
                            <button onClick={() => go(-1)} className="w-7 h-7 grid place-items-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400"><ChevronDown className="w-3 h-3 rotate-90" /></button>
                            <button onClick={() => go(1)} className="w-7 h-7 grid place-items-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400"><ChevronDown className="w-3 h-3 -rotate-90" /></button>
                        </div>
                    </div>
                    <div className={dockSwiperMinimized ? 'overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform max-h-0 opacity-0 -translate-y-1 scale-[0.98]' : 'overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform max-h-[500px] opacity-100 translate-y-0 scale-100'}>
                    <div className="overflow-hidden" onTouchStart={(e) => setDockTouchStart(e.touches[0].clientX)} onTouchEnd={(e) => { if (dockTouchStart === null) return; const diff = e.changedTouches[0].clientX - dockTouchStart; if (Math.abs(diff) > 40) go(diff > 0 ? -1 : 1); setDockTouchStart(null); }}>
                        <div className="flex transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform" style={{ transform: `translateX(-${safeIndex * 100}%)` }}>
                            {visibleTabs.map((tab) => (
                                <div key={tab.id} className="w-full shrink-0">
                                    {tab.id === 'poll' && activePoll && (
                                        <div>
                                            <div className="px-4 py-2.5 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border-b border-white/10 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className={`w-2 h-2 rounded-full shrink-0 ${activePoll.ended ? 'bg-gray-500' : activePoll.paused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} />
                                                    <span className="text-white font-black uppercase text-[11px] tracking-widest truncate max-w-[200px]">{activePoll.question}</span>
                                                    <span className="hidden sm:inline text-gray-400 text-[10px] font-bold">{activePoll.total} votes</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <button onClick={handleStopPoll} className="h-6 px-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-full text-red-400 text-[10px] font-black uppercase flex items-center gap-1"><Square className="w-3 h-3" /> Stop</button>
                                                    <button onClick={handleClearPoll} className="w-6 h-6 grid place-items-center rounded-full bg-white/5 text-gray-400"><Trash2 className="w-3 h-3" /></button>
                                                    <button onClick={()=>setActivePoll(null)} className="w-6 h-6 grid place-items-center rounded-full bg-white/5 text-gray-400"><X className="w-3 h-3" /></button>
                                                </div>
                                            </div>
                                            <div className="p-3 space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar">
                                                {activePoll.options.map((opt:string,i:number)=>{ const v=activePoll.votes[i]||0; const pct= activePoll.total? Math.round((v/activePoll.total)*100):0; const colors=['#8b5cf6','#06b6d4','#f59e0b','#ec4899','#10b981','#f43f5e']; return (
                                                        <div key={i} className="relative overflow-hidden rounded-xl border flex items-center gap-2 px-2.5 py-1.5" style={{ borderColor:'rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)' }}>
                                                            <div className="absolute inset-y-0 left-0" style={{ width:`${pct}%`, background: colors[i%colors.length], opacity:0.9 }} />
                                                            <span className="relative w-5 h-5 rounded-full bg-white text-black grid place-items-center font-black text-[10px] shrink-0">{i+1}</span>
                                                            <span className="relative flex-1 text-white font-bold text-[11px] truncate">{opt}</span>
                                                            <span className="relative text-white font-black text-[10px]">{pct}%</span>
                                                        </div>
                                                    ); })}
                                            </div>
                                        </div>
                                    )}
                                    {tab.id === 'task' && (
                                        <div className="p-3 space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar">
                                            {/* header */}
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <ListChecks className="w-4 h-4 text-cyan-400" />
                                                    <span className="text-white font-black text-[11px] tracking-widest uppercase">Task Control</span>
                                                    <span className="px-1.5 py-0.5 bg-white/10 border border-white/10 rounded-full text-[10px] font-black text-white">{(activeTasks as { items?: unknown[] })?.items?.length || 0} tasks</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={handleClearTasks} disabled={!((activeTasks as { items?: unknown[] })?.items?.length)} className="h-6 px-2 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-full text-gray-400 hover:text-red-400 text-[10px] font-black uppercase flex items-center gap-1 disabled:opacity-30"><Trash2 className="w-3 h-3" /> Clear</button>
                                                    <button onClick={() => setLayout({ ...layout, createTask: true })} className="w-6 h-6 grid place-items-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400" title="Buka modal"><Plus className="w-3 h-3" /></button>
                                                </div>
                                            </div>
                                            {/* list */}
                                            {((activeTasks as { items?: any[] })?.items?.length || 0) > 0 ? (
                                                <div className="space-y-1.5">
                                                    {activeTasks.items.map((t:any)=>(
                                                        <div key={t.id} className={`group flex gap-2 items-center px-3 py-2 rounded-xl border text-[11px] font-bold transition-all ${t.completed ? 'bg-white/5 border-white/5 opacity-60 line-through text-gray-400' : 'bg-white/[0.06] border-white/10 text-white hover:border-white/15'}`}>
                                                            <button onClick={()=>handleToggleTask(t.id)} className={`w-5 h-5 rounded-full border-2 grid place-items-center shrink-0 transition-colors ${t.completed ? 'bg-white border-white text-[#1a2233]' : 'border-white/30 hover:border-white/50'}`}>{t.completed && <Check className="w-3 h-3" />}</button>
                                                            <span className="flex-1 truncate">{t.text}</span>
                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase ${t.completed ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{t.completed ? 'done' : 'todo'}</span>
                                                            <button onClick={()=>handleRemoveTask(t.id)} className="opacity-0 group-hover:opacity-100 w-6 h-6 grid place-items-center rounded-full hover:bg-red-500/20 text-red-400 transition-opacity"><X className="w-3 h-3" /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-6 flex flex-col items-center gap-2 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                                                    <ListChecks className="w-6 h-6 text-gray-600" />
                                                    <span className="text-gray-500 text-[11px] font-bold">Belum ada task - tambah di bawah</span>
                                                </div>
                                            )}
                                            <div className="flex gap-2 pt-1">
                                                <input value={newTaskText} onChange={(e)=>setNewTaskText(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter') handleAddTask(); }} placeholder="Tambah task..." className="flex-1 h-8 bg-white/5 border border-white/10 rounded-full px-3 text-[11px] text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50" />
                                                <button onClick={handleAddTask} className="h-8 px-4 bg-cyan-600 hover:bg-cyan-500 rounded-full text-white text-[11px] font-black uppercase flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
                                            </div>
                                            {/* <div className="text-[10px] text-gray-500 leading-relaxed">Sinkron ke OBS via <code className="bg-white/10 px-1 rounded text-white">task widget</code> - toggle/hapus langsung update overlay.</div> */}
                                        </div>
                                    )}
                                    {tab.id === 'timer' && (
                                        <div className="p-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-violet-400" />
                                                    <span className="text-white font-mono font-black text-[14px]">{(() => { const base = activeTimer?.totalSeconds ?? 50*60; void timerTick; const sec = activeTimer?.isRunning && activeTimer?.updatedAt ? Math.max(0, base - Math.floor((Date.now() - activeTimer.updatedAt)/1000)) : base; const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), s=sec%60; return h>0?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; })()}</span>
                                                    <span className={`w-2 h-2 rounded-full ${activeTimer?.isRunning?'bg-green-500 animate-pulse':'bg-yellow-500'}`} />
                                                </div>
                                                <span className="text-gray-400 text-[10px] font-bold">{activeTimer?.currentSession||1}/{activeTimer?.totalSessions||3} {activeTimer?.mode||'powerup'}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <button onClick={()=>handleTimerControl(activeTimer?.isRunning?'stop':'start')} className={`h-7 rounded-full text-[10px] font-black uppercase border flex items-center justify-center gap-1 ${activeTimer?.isRunning?'bg-yellow-500/20 text-yellow-400 border-yellow-500/30':'bg-green-600 text-white border-green-500'}`}>{activeTimer?.isRunning ? <><Pause className="w-3 h-3"/>Stop</> : <><Play className="w-3 h-3"/>Start</>}</button>
                                                <button onClick={()=>handleTimerControl('reset')} className="h-7 bg-white/5 border border-white/10 rounded-full text-white text-[10px] font-bold flex items-center justify-center gap-1"><RefreshCcw className="w-3 h-3" />Reset</button>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-xl p-1.5">
                                                    <span className="text-[9px] font-black uppercase text-gray-500 w-8 shrink-0">Set</span>
                                                    <input type="number" min={0} max={999} value={timerCustomMin} onChange={(e)=>setTimerCustomMin(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter') handleTimerSetCustom(); }} placeholder="0" className="w-[56px] h-7 bg-black/40 border border-white/10 rounded-full px-2 text-center text-[12px] font-mono font-black text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                                    <span className="text-[10px] font-black text-gray-400">m</span>
                                                    <input type="number" min={0} max={59} value={timerCustomSec} onChange={(e)=>setTimerCustomSec(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter') handleTimerSetCustom(); }} placeholder="0" className="w-[56px] h-7 bg-black/40 border border-white/10 rounded-full px-2 text-center text-[12px] font-mono font-black text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                                    <span className="text-[10px] font-black text-gray-400">s</span>
                                                    <button onClick={handleTimerSetCustom} className="ml-auto h-7 px-4 bg-white hover:bg-zinc-100 text-black border border-white rounded-full text-[10px] font-black uppercase flex items-center gap-1 shrink-0"><Clock className="w-3 h-3" />Set</button>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-xl p-1.5">
                                                    <span className="text-[9px] font-black uppercase text-green-400 w-8 shrink-0">Add</span>
                                                    <input type="number" min={0} max={999} value={timerAddMin} onChange={(e)=>setTimerAddMin(e.target.value)} placeholder="0" className="w-[56px] h-7 bg-black/40 border border-white/10 rounded-full px-2 text-center text-[12px] font-mono font-black text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                                    <span className="text-[10px] font-black text-gray-400">m</span>
                                                    <input type="number" min={0} max={59} value={timerAddSec} onChange={(e)=>setTimerAddSec(e.target.value)} placeholder="0" className="w-[56px] h-7 bg-black/40 border border-white/10 rounded-full px-2 text-center text-[12px] font-mono font-black text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                                    <span className="text-[10px] font-black text-gray-400">s</span>
                                                    <button onClick={()=>{ const c=(parseInt(timerAddMin)||0)*60+(parseInt(timerAddSec)||0); if(c>0) handleTimerAdd(c); else { handleTimerAdd(300);} }} className="ml-auto h-7 px-4 bg-white hover:bg-zinc-100 text-black border border-white rounded-full text-[10px] font-black uppercase flex items-center gap-1 shrink-0"><Plus className="w-3 h-3" />+ {timerAddMin||5}:{String(timerAddSec||0).padStart(2,'0')}</button>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-xl p-1.5">
                                                    <span className="text-[9px] font-black uppercase text-red-400 w-8 shrink-0">Sub</span>
                                                    <input type="number" min={0} max={999} value={timerSubMin} onChange={(e)=>setTimerSubMin(e.target.value)} placeholder="0" className="w-[56px] h-7 bg-black/40 border border-white/10 rounded-full px-2 text-center text-[12px] font-mono font-black text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                                    <span className="text-[10px] font-black text-gray-400">m</span>
                                                    <input type="number" min={0} max={59} value={timerSubSec} onChange={(e)=>setTimerSubSec(e.target.value)} placeholder="0" className="w-[56px] h-7 bg-black/40 border border-white/10 rounded-full px-2 text-center text-[12px] font-mono font-black text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                                    <span className="text-[10px] font-black text-gray-400">s</span>
                                                    <button onClick={()=>{ const c=(parseInt(timerSubMin)||0)*60+(parseInt(timerSubSec)||0); if(c>0) handleTimerSub(c); else { handleTimerSub(300);} }} className="ml-auto h-7 px-4 bg-white hover:bg-zinc-100 text-black border border-white rounded-full text-[10px] font-black uppercase flex items-center gap-1 shrink-0"><Square className="w-3 h-3" />- {timerSubMin||5}:{String(timerSubSec||0).padStart(2,'0')}</button>
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5">
                                                {['powerup','sleep','locked','paused'].map((m)=>(
                                                    <button key={m} onClick={()=>handleTimerControl('mode',{mode:m})} className={`flex-1 h-6 rounded-full text-[9px] font-black uppercase border ${activeTimer?.mode===m?'bg-white text-black border-white':'bg-white/5 text-gray-400 border-white/10'}`}>{m}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 py-1.5 bg-black/20 border-t border-white/5">
                        {visibleTabs.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i===safeIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`} />)}
                        <span className="ml-2 text-[10px] text-gray-500 font-bold hidden sm:inline">swipe ↔</span>
                    </div>
                    </div>
                </div>
                );
            })()}

            {/* Create Poll Modal */}
            <div
                className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${layout.createPoll ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
            >
                <div
                    className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${layout.createPoll ? "opacity-100" : "opacity-0"
                        }`}
                    onClick={closeCreatePoll}
                />
                <div className={`relative poll-modal-content bg-[#161616] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col transition-all duration-300 ${layout.createPoll ? "scale-100 opacity-100" : "scale-95 opacity-0"
                    }`}>
                    <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-purple-900/20 to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <ChartBar className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-white font-black uppercase text-sm">Create New Poll</h2>
                                <p className="text-gray-500 text-[10px]">Broadcast to Twitch &amp; YouTube</p>
                            </div>
                        </div>
                        <button onClick={closeCreatePoll} className="text-gray-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        <Polling ref={pollingRef} />
                        <div>
                            <Label className="block text-gray-400 font-bold uppercase text-[9px] mb-1.5">Durasi (Detik)</Label>
                            <input
                                type="number"
                                className="w-full rounded-lg px-3 py-2 text-sm font-medium"
                                value={pollDuration}
                                onChange={(e) => setPollDuration(parseInt(e.target.value) || 0)}
                                min="15"
                                max="3600"
                            />
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-white/10 bg-black/20 flex items-center gap-3 justify-between">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={showPoll} onChange={handleToggleShowPoll} className="w-4 h-4 accent-violet-600" />
                            <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1">{showPoll ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />} Show poll di OBS</span>
                        </label>
                        <div className="flex gap-3">
                        <button onClick={closeCreatePoll} className="px-4 py-2 rounded-lg font-bold text-gray-400 text-[10px] uppercase hover:bg-white/5 transition-colors">
                            Batal
                        </button>
                        <button onClick={handleCreatePoll} className="px-6 py-2 rounded-lg font-black text-black text-[10px] uppercase bg-white hover:bg-zinc-200 transition-all flex items-center gap-2">
                            Start Poll
                        </button>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
}
