'use client';
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import {
    Radio, ToolCase, Video, UserCog, Monitor, MoveRight, PenLine, BarChart2,
    RefreshCcw, ChevronDown, Edit3, X, ChartBar, Zap, MessageSquare, Pin,
    ThumbsUp, Eye, Music, Users, Terminal, Sparkles, Plus,
    Share2, ListPlus, Search
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { updateTitle, createPoll } from "../actions/streamerBotActions";
import { obsStatusColors } from "../enums/enumColors";
import { Label } from "@heroui/react/label";
import { TextArea } from "@heroui/react/textarea";
import Polling, { PollingRef } from "../components/Polling";
import { ChatMessage, DockStatus } from "../types/dockTypes";

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
    const youtubeChartData = [
        { value: 0 },
        { value: 1 },
        { value: 0 },
        { value: 2 },
        { value: 1 },
        { value: 3 },
        { value: 2 },
        { value: 0 },
    ];
    const twitchChartData = [
        { value: 1 },
        { value: 2 },
        { value: 1 },
        { value: 3 },
        { value: 2 },
        { value: 4 },
        { value: 3 },
        { value: 1 },
    ];
    const [tiktokChartData, setTiktokChartData] = useState<Array<{ value: number }>>([
        { value: 0 },
        { value: 0 },
        { value: 1 },
        { value: 0 },
        { value: 2 },
        { value: 1 },
        { value: 0 },
        { value: 0 },
    ]);

    const [dropdownOpen, setDropdownOpen] = useState({
        streamTools: false,
    });

    const [layout, setLayout] = useState({
        current: "DOCK",
        updateTitle: false,
        createPoll: false,
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
    const [chatMessages, setChatMessages] = useState<Array<ChatMessage>>([
        {
            id: 1,
            user: "Rizky_JR",
            text: "Lagi main apa nih?",
            platform: "twitch",
        },
    ]);
    const [pinnedChat, setPinnedChat] = useState<{ user: string; text: string; platform: string; avatar?: string } | null>(null);
    const [viewerData, setViewerData] = useState<Record<string, { platform: string; avatar?: string; initials: string }>>({});
    const [chatSearch, setChatSearch] = useState("");
    const [activityLogs, setActivityLogs] = useState<Array<{ id: number; text: string; platform?: string; time?: string }>>([]);
    const [giftLogs, setGiftLogs] = useState<Array<{ id: number; user: string; text: string; platform: string; amount?: string; giftName?: string; count?: number; avatar?: string; time?: string }>>([]);
    const [tiktokRoomViewerCount, setTiktokRoomViewerCount] = useState<number | null>(null); // viewerCount -> Realtime Penonton
    const [tiktokTotalUser, setTiktokTotalUser] = useState<number | null>(null); // totalUser -> Total User
    const pollingRef = useRef<PollingRef>(null);

    // grafik TikTok realtime dari viewerCount (roomUser)
    useEffect(() => {
        if (tiktokRoomViewerCount === null) return;
        setTiktokChartData(prev => {
            const next = [...prev, { value: tiktokRoomViewerCount }];
            if (next.length > 8) return next.slice(-8);
            return next;
        });
    }, [tiktokRoomViewerCount]);

    const twitchViewerCount = Object.values(viewerData).filter(item => item.platform === "twitch").length;
    const youtubeViewerCount = Object.values(viewerData).filter(item => item.platform === "youtube").length;
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

    const [tiktokStatus, setTiktokStatus] = useState<"DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR">("DISCONNECTED");

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

        pollingRef.current?.reset();
        setPollDuration(60);
        setLayout({ ...layout, createPoll: false });
    }

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
            next[user] = { platform, avatar, initials: user.slice(0, 2).toUpperCase() };
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
        setPinnedChat(null);
        if (tkSocketRef.current && tkSocketRef.current.connected) {
            tkSocketRef.current.emit("unpin-chat");
        }
    }

    const pinMessage = (user: string, text: string, platform: string, avatar?: string) => {
        setPinnedChat({ user, text, platform, avatar });

        if (tkSocketRef.current && tkSocketRef.current.connected) {
            tkSocketRef.current.emit("pin-chat", {
                username: tiktokConfig.username || "global",
                chat: { nickname: user, comment: text, profilePictureUrl: avatar, platform: platform }
            });
        }
    }

    const connectTikTok = () => {
        const username = tiktokConfig.username.trim();
        if (!username) {
            alert("Silakan masukkan username TikTok!");
            return;
        }

        // simpan username biar persist (mirip legacy localStorage.setItem('tiktokUsername', ...))
        if (typeof window !== "undefined") {
            localStorage.setItem("tiktokUsername", username);
            localStorage.setItem("tiktok-config", JSON.stringify(tiktokConfig));
        }

        if (!tkSocketRef.current) {
            tkSocketRef.current = io("http://localhost:3000");

            tkSocketRef.current.on("connect", () => {
                addSystemLog("Terhubung ke server TikTok lokal.", "info");
                tkSocketRef.current?.emit("connect-tiktok", username);
            });

            tkSocketRef.current.on("tiktok-connecting", () => {
                setTiktokStatus("CONNECTING");
                addSystemLog(`Menghubungkan ke TikTok @${username}...`, "info");
            });

            tkSocketRef.current.on("tiktok-connected", () => {
                setTiktokStatus("CONNECTED");
                addSystemLog(`Berhasil terhubung ke TikTok Live: @${username}`, "success");
            });

            tkSocketRef.current.on("tiktok-error", (err: string) => {
                setTiktokStatus("ERROR");
                addSystemLog(`Gagal terhubung ke TikTok: ${err}`, "error");
            });

            tkSocketRef.current.on("tiktok-disconnected", () => {
                setTiktokStatus("DISCONNECTED");
                setTiktokRoomViewerCount(null);
                setTiktokTotalUser(null);
                addSystemLog("TikTok terputus.", "warn");
            });

            tkSocketRef.current.on("tiktok-chat", (data: { nickname: string; comment: string; profilePictureUrl?: string }) => {
                handleIncomingMessage(data.nickname, data.comment, "tiktok", data.profilePictureUrl, []);
            });

            tkSocketRef.current.on("tiktok-gift", (data: { nickname: string; giftName: string; repeatCount: number; profilePictureUrl?: string }) => {
                addGiftLog(data.nickname, `mengirim ${data.giftName} x${data.repeatCount}`, "tiktok", { giftName: data.giftName, count: data.repeatCount, avatar: data.profilePictureUrl });
                addSystemLog(`🎁 [TIKTOK GIFT] ${data.nickname} mengirim ${data.giftName} x${data.repeatCount}`, "info");
            });

            tkSocketRef.current.on("tiktok-like", (data: { nickname: string; likeCount: number }) => {
                addActivityLog(`❤️ ${data.nickname} menyukai live! (${data.likeCount} likes)`, "tiktok");
                addSystemLog(`❤️ [TIKTOK LIKE] ${data.nickname} menyukai live! (${data.likeCount} likes)`, "info");
            });

            tkSocketRef.current.on("tiktok-member", (data: { nickname: string; profilePictureUrl?: string }) => {
                addActivityLog(`👋 ${data.nickname} telah bergabung`, "tiktok");
                setViewerData(prev => ({
                    ...prev,
                    [data.nickname]: {
                        platform: "tiktok",
                        avatar: data.profilePictureUrl,
                        initials: data.nickname.slice(0, 2).toUpperCase(),
                    },
                }));
                addSystemLog(`👋 [TIKTOK JOIN] ${data.nickname} telah bergabung.`, "info");
            });

            tkSocketRef.current.on("tiktok-roomUser", (data: any) => {
                const viewerCount = data?.viewerCount ?? null;
                const totalUser = data?.totalUser ?? data?.totalUsers ?? null;
                if (typeof viewerCount === "number") setTiktokRoomViewerCount(viewerCount);
                if (typeof totalUser === "number") setTiktokTotalUser(totalUser);
            });
        } else {
            // socket sudah ada — langsung emit (mirip legacy else branch)
            if (tkSocketRef.current.connected) {
                tkSocketRef.current.emit("connect-tiktok", username);
            } else {
                tkSocketRef.current.connect();
                tkSocketRef.current.once("connect", () => {
                    tkSocketRef.current?.emit("connect-tiktok", username);
                });
            }
        }
    }

    const disconnectTikTok = () => {
        const username = tiktokConfig.username.trim() || (typeof window !== "undefined" ? localStorage.getItem("tiktokUsername") || "" : "");
        if (tkSocketRef.current) {
            tkSocketRef.current.emit("disconnect-tiktok", username);
        }
        setTiktokStatus("DISCONNECTED");
        setTiktokRoomViewerCount(null);
        setTiktokTotalUser(null);
        addSystemLog("TikTok disconnected.", "warn");
    }

    const resetTikTokUI = () => {
        setTiktokStatus("DISCONNECTED");
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
        if (tiktokStatus === "ERROR") return "Error";
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
                    socket.send(JSON.stringify({ op: 6, d: { requestType: "GetStreamStatus", requestId: "get_stream_status" } }));
                    socket.send(JSON.stringify({ op: 6, d: { requestType: "GetRecordStatus", requestId: "get_record_status" } }));
                    if (obsPollIntervalRef.current) clearInterval(obsPollIntervalRef.current);
                    obsPollIntervalRef.current = setInterval(() => {
                        if (socket.readyState === WebSocket.OPEN) {
                            socket.send(JSON.stringify({ op: 6, d: { requestType: "GetStreamStatus", requestId: "get_stream_status" } }));
                            socket.send(JSON.stringify({ op: 6, d: { requestType: "GetRecordStatus", requestId: "get_record_status" } }));
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
                    Twitch: ["ChatMessage", "StreamOnline", "StreamOffline", "Cheer", "Sub", "GiftSub", "RewardRedemption"],
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

                        if (platform === "youtube" && data.concurrentViewers !== undefined) {
                            console.log("YouTube viewers:", data.concurrentViewers);
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
                    }

                    if (["ChatMessage", "Message"].includes(type)) {
                        const user = data.message?.username || data.user?.name || "User";
                        const message = data.message?.text || data.message || "";
                        console.log(`[${platform}] ${user}: ${message}`);
                    }

                    if (["Cheer", "Sub", "GiftSub", "RewardRedemption", "SuperChat", "SuperSticker", "NewSponsor"].includes(type)) {
                        const user = data.user?.name || data.userName || data.user?.login || "User";
                        const amount = data.bits ?? data.amount ?? data.displayString ?? data.tier ?? "";
                        const text = amount ? `${type}: ${amount}` : type;
                        addGiftLog(user, text, platform || "twitch", { amount: String(amount), giftName: type });
                        addSystemLog(`🎁 [GIFT ${platform}] ${user}: ${text}`, "info");
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
            <header className="relative z-30 w-full max-w-[100vw] flex-none h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-6 font-bold overflow-visible">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 border-r border-white/10 pr-4">
                        <div className="flex items-center gap-2">
                            <Image src="/assets/logo/obs.png" alt="Logo" width={15} height={15} className={`filter invert ${status.obsStatus === "CONNECTED" ? "opacity-100" : "opacity-50"}`} />
                            <span className="font-black uppercase tracking-tighter text-gray-500 text-[8px]">OBS: <span className="text-white">{status.obsStatus}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Image src="/assets/logo/sbot.png" alt="Logo" width={15} height={15} className={`filter  ${status.sbotStatus === "CONNECTED" ? "opacity-100" : "opacity-50 grayscale"}`} />
                            <span className="font-black uppercase tracking-tighter text-gray-500 text-[8px]">SBOT: <span className="text-white">{status.sbotStatus}</span></span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={toggleSimulation} className={`${headerControlClass}`}>
                            <UserCog className="w-3 h-3" />
                            Simulasi
                        </button>
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
                        <div className="grid grid-cols-2 gap-4 flex-none">
                            <div className="stat-card border-l-4 border-l-gray-600 cursor-pointer py-2.5" onClick={toggleStream}>
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <h3 className="text-gray-500 text-[9px] font-black uppercase mb-1">Streaming</h3>
                                        <div className={`flex items-center gap-2 text-lg font-black font-mono-custom ${status.streamStatus === "STOPPED" ? "text-gray-700" : "text-red-700"}`}>
                                            <span>{status.streamStatus === "STOPPED" ? "NOT STREAMING" : "STREAMING"}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="text-right">
                                            <div className="text-[8px] text-gray-500 font-bold uppercase">Time</div>
                                            <span className="font-mono-custom text-[20px]">{status.streamTime}</span>
                                        </div>
                                        <div className="flex gap-5">
                                            <div className="text-right">
                                                <div className="text-[8px] text-gray-500 font-bold uppercase">Dropped</div>
                                                <div className="font-mono-custom text-[10px]">0</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[8px] text-gray-500 font-bold uppercase">Bitrate</div>
                                                <div className="font-mono-custom text-[10px]">{status.bitrate ?? "0 kbps"}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-14 w-full -mt-10 relative">
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
                            <div className="stat-card border-l-4 border-l-gray-600 cursor-pointer py-2.5" onClick={toggleRecord}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-gray-500 text-[9px] font-black uppercase mb-1">Recording</h3>
                                        <div className={`flex items-center gap-2 text-lg font-black font-mono-custom ${status.recordStatus === "STOPPED" ? "text-gray-500" : "text-red-500"}`}>
                                            <span>{status.recordStatus === "STOPPED" ? "IDLE" : "RECORDING"}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="text-right">
                                            <div className="text-[8px] text-gray-500 font-bold uppercase">Time</div>
                                            <span className="font-mono-custom text-[20px] text-white">{status.recordTime}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[8px] text-gray-500 font-bold uppercase">Disk Space</div>
                                            <div className="font-mono-custom text-[10px]">{status.diskSpace ?? "200 GB"}</div>
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
                                <div className="px-4 py-3 bg-white/10 border-b border-white/5 relative shadow-lg">
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
                                {chatMessages.length === 0 && <div className="text-gray-500 italic">Menunggu chat masuk...</div>}
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
                                        <div className="stat-card border border-red-500/20 group relative overflow-visible py-2.5">
                                            <div className="flex justify-between items-start mb-1.5 relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <Image src="/assets/logo/youtube.png" alt="YouTube Logo" width={16} height={16} className="w-4 h-4 invert" />
                                                    <span className="font-black text-[10px] uppercase">YouTube</span>
                                                </div>
                                                <span className="text-[8px] font-bold text-green-500 pulse-live uppercase">LIVE</span>
                                            </div>
                                            <div className="flex items-end justify-between relative z-10">
                                                <div>
                                                    <span className="text-2xl font-bold font-mono-custom tracking-tighter">0</span>
                                                    <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                        <div className="flex items-center gap-1 text-[9px] text-gray-400">
                                                            <ThumbsUp className="w-3 h-3" /> <span>0</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[9px] text-gray-400">
                                                            <Eye className="w-3 h-3" /> <span>0</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[8px] text-red-500 font-bold uppercase">Current Chatters</div>
                                                    <div className="text-[8px] text-gray-500 font-bold uppercase mt-1">Chatters:
                                                        <span className="text-white">0</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="h-14 w-full -mt-10 relative">
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
                                        </div>
                                    )}

                                    {sectionVisible.cardTw && (
                                        <div className="stat-card border border-purple-500/30 py-2.5">
                                            <div className="flex justify-between items-start mb-1.5 relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <Image src="/assets/logo/twitch.png" alt="Twitch Logo" width={16} height={16} className="w-4 h-4 invert" />
                                                    <span className="font-black text-[10px] uppercase">Twitch</span>
                                                </div>
                                                <span className="text-[8px] font-bold text-green-500 pulse-live uppercase">LIVE</span>
                                            </div>
                                            <div className="flex items-end justify-between relative z-10">
                                                <span className="text-2xl font-bold font-mono-custom tracking-tighter">{twitchViewerCount}</span>
                                                <div className="text-right">
                                                    <div className="text-[8px] text-purple-400 font-bold uppercase">Current Viewers</div>
                                                </div>
                                            </div>
                                            <div className="h-14 w-full -mt-10 relative">
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
                                        </div>
                                    )}

                                    {sectionVisible.cardTt && (
                                        <div className="stat-card border border-[#FE2C55]/30 py-2.5 group relative overflow-hidden">
                                            <div className="flex justify-between items-start mb-1.5 relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <Image src="/assets/logo/tik-tok.png" alt="TikTok Logo" width={16} height={16} className="w-4 h-4 invert" />
                                                    <span className="font-black text-[10px] uppercase text-[#FE2C55]">TikTok</span>
                                                </div>
                                                <span className={`text-[8px] font-bold uppercase ${tiktokStatus === "CONNECTED" ? "text-green-500 pulse-live" : "text-gray-500"}`}>{tiktokStatus === "CONNECTED" ? "LIVE" : "Offline"}</span>
                                            </div>
                                            <div className="flex items-end justify-between relative z-10">
                                                <div>
                                                    <span className="text-2xl font-bold font-mono-custom tracking-tighter">{tiktokRoomViewerCount ?? tiktokViewerCount}</span>
                                                    <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                        <div className="flex items-center gap-1 text-[9px] text-gray-400">
                                                            <Eye className="w-3 h-3" /> <span>{tiktokRoomViewerCount ?? tiktokViewerCount}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[9px] text-gray-400">
                                                            <Users className="w-3 h-3" /> <span>{tiktokTotalUser ?? 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[8px] text-[#25F4EE] font-bold uppercase">Realtime Penonton</div>
                                                    <div className="text-[8px] text-gray-500 font-bold uppercase mt-1">Total User: <span className="text-white">{tiktokTotalUser ?? 0}</span></div>
                                                </div>
                                            </div>
                                            <div className="h-14 w-full -mt-10 relative">
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
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 bg-[#161616] border border-white/5 rounded-xl p-4 flex flex-col overflow-hidden min-h-62.5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-gray-400 text-[9px] font-black uppercase">Siapa yang Datang</h3>
                                        <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-[8px] font-bold">1</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                                        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5 animate-in slide-in-from-right-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center font-black text-[10px] text-white">RI</div>
                                            <div>
                                                <div className="font-bold text-white text-[10px]">Rizky_JR</div>
                                                <div className="flex items-center gap-1 text-[8px] text-gray-500 uppercase">
                                                    <Image src="/assets/logo/twitch.png" alt="twitch" width={10} height={10} className="w-2.5 h-2.5 object-contain invert" /> twitch
                                                </div>
                                            </div>
                                        </div>
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
                                    <button onClick={requestAIBriefing} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 text-[8px] font-black uppercase hover:from-blue-500 hover:to-purple-500 transition-all shadow-[0_0_10px_rgba(59,130,246,0.3)]">
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
                                            type="password"
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
                                    <div className="flex justify-between items-center py-1 border-t border-white/5">
                                        <span className="text-gray-400 uppercase font-bold text-[8px]">Status</span>
                                        <span id="tiktok-connection-state" className={`${getTiktokStatusColor()} font-black uppercase text-[10px]`}>{tiktokStatus}</span>
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
                        <button onClick={handleUpdateTitle} className="px-6 py-2 rounded-lg font-black text-white text-[10px] uppercase bg-gradient-to-r from-green-600 to-green-600 hover:from-green-500 hover:to-green-500 transition-all flex items-center gap-2">
                            Update
                        </button>
                    </div>

                </div>
            </div>

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

                    <div className="px-6 py-4 border-t border-white/10 bg-black/20 flex gap-3 justify-end">
                        <button onClick={closeCreatePoll} className="px-4 py-2 rounded-lg font-bold text-gray-400 text-[10px] uppercase hover:bg-white/5 transition-colors">
                            Batal
                        </button>
                        <button onClick={handleCreatePoll} className="px-6 py-2 rounded-lg font-black text-white text-[10px] uppercase bg-gradient-to-r from-green-600 to-green-600 transition-all flex items-center gap-2">
                            Start Poll
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
}
