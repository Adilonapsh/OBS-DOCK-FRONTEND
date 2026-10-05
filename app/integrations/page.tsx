'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Menu, Plug, FlaskConical, ArrowLeft, Search, Zap, MessageSquare, Gift, Heart,
  UserPlus, Users, BarChart3, ListChecks, Timer, Music, Pin, ChevronDown,
  RefreshCw, Copy, Check, Eye, EyeOff, Play, X,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";
import { createClient } from "@/utils/supabase/client";
import { useTtSbMap, TT_SB_KEYS, TT_SB_PARAMS, type TtSbEventKey } from "../hooks/useTtSbMap";
import { useWidgetSbMap, WIDGET_SB_GROUPS, WIDGET_SB_TEST_ARGS, WIDGET_SB_PARAMS, type WidgetSbEventKey } from "../hooks/useWidgetSbMap";
import { resolveSbArgs } from "../hooks/sbArgs";

const TEST_ARGS: Record<TtSbEventKey, Record<string, unknown>> = {
  chat: { type: "chat", nickname: "TestUser", comment: "Halo (tes)", profilePictureUrl: "", platform: "tiktok" },
  gift: { type: "gift", nickname: "TestUser", giftName: "Rose", repeatCount: 1, diamondCount: 1, profilePictureUrl: "", platform: "tiktok" },
  like: { type: "like", nickname: "TestUser", likeCount: 10, totalLikeCount: 0, platform: "tiktok" },
  follow: { type: "follow", nickname: "TestUser", profilePictureUrl: "", platform: "tiktok" },
  member: { type: "member", nickname: "TestUser", profilePictureUrl: "", platform: "tiktok" },
};

const TT_META: Record<TtSbEventKey, { label: string; desc: string; Icon: typeof MessageSquare }> = {
  chat: { label: "Chat", desc: "Pesan chat masuk", Icon: MessageSquare },
  gift: { label: "Gift", desc: "Gift / cheer / superchat", Icon: Gift },
  like: { label: "Like", desc: "Like livestream", Icon: Heart },
  follow: { label: "Follow", desc: "Follower baru", Icon: UserPlus },
  member: { label: "Member / Join", desc: "Member join / subscribe", Icon: Users },
};

const WIDGET_ICONS: Record<string, typeof MessageSquare> = {
  poll: BarChart3,
  task: ListChecks,
  timer: Timer,
  music: Music,
  pinned: Pin,
};

type Toast = { id: number; msg: string; kind: "success" | "error" | "info" } | null;

function useToast() {
  const [toast, setToast] = useState<Toast>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((msg: string, kind: Toast extends null ? never : NonNullable<Toast>["kind"] = "info") => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), msg, kind });
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);
  return { toast, show };
}

// ---------- Toggle switch ----------
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative w-10 h-[22px] rounded-full transition-colors shrink-0 ${on ? "bg-emerald-500" : "bg-white/10 hover:bg-white/15"}`}
      title={on ? "Nonaktifkan event" : "Aktifkan event"}
    >
      <span
        className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-[3px]"}`}
      />
    </button>
  );
}

// ---------- Editor parameter ----------
function ParamsEditor({ vars, params, onChange, preview }: {
  vars: string[];
  params: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  preview: Record<string, unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");
  const [copied, setCopied] = useState(false);
  const entries = Object.entries(params || {});

  const addParam = () => {
    const k = newKey.trim();
    if (!k) return;
    if (!/^\w{1,40}$/.test(k)) return;
    onChange({ ...(params || {}), [k]: newVal.slice(0, 300) });
    setNewKey("");
    setNewVal("");
  };

  const copyPreview = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(preview, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <div className="flex items-center gap-1 p-1 bg-white/[0.02]">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex-1 h-8 px-3 flex items-center justify-between rounded-lg hover:bg-white/5 text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
        >
          <span>Parameter {entries.length > 0 && <span className="ml-1 px-1.5 py-px bg-emerald-500/20 text-emerald-300 rounded-full">{entries.length}</span>}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className={`h-8 px-3 flex items-center gap-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${showPreview ? "bg-white text-black" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          title="Lihat args final yang dikirim ke Streamer.bot"
        >
          {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} Preview
        </button>
      </div>

      {showPreview && (
        <div className="border-t border-white/10 bg-black/40 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Args Streamer.bot</span>
            <button type="button" onClick={copyPreview} className="flex items-center gap-1 text-[9px] font-bold text-gray-400 hover:text-white">
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} {copied ? "Disalin!" : "Salin"}
            </button>
          </div>
          <pre className="max-h-40 overflow-auto text-[10px] leading-relaxed  font-sans text-emerald-200/90 whitespace-pre-wrap break-all">
            {JSON.stringify(preview, null, 2)}
          </pre>
        </div>
      )}

      {open && (
        <div className="border-t border-white/10 p-3 space-y-2.5 bg-black/20">
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Args bawaan selalu dikirim. Tambahkan parameter custom — nilai boleh pakai template <code className="bg-white/10 px-1 rounded text-gray-300 font-sans">{"{variabel}"}</code> yang diisi otomatis saat event terjadi.
          </p>
          {vars.length > 0 && (
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1.5">Klik untuk sisip variabel:</div>
              <div className="flex flex-wrap gap-1.5">
                {vars.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setNewVal((prev) => `${prev}{${v}}`)}
                    className="px-2 py-1 bg-violet-500/10 hover:bg-violet-500/25 border border-violet-500/20 hover:border-violet-500/40 rounded-lg text-[10px]  font-sans text-violet-200 transition-colors"
                  >
                    {`{${v}}`}
                  </button>
                ))}
              </div>
            </div>
          )}
          {entries.map(([k, v]) => (
            <div key={k} className="flex gap-1.5 items-center">
              <span className="shrink-0 h-9 px-2.5 flex items-center bg-violet-500/10 border border-violet-500/20 rounded-lg text-[10px]  font-sans font-bold text-violet-200 max-w-[38%] truncate">{k}</span>
              <input
                value={v}
                onChange={(e) => onChange({ ...(params || {}), [k]: e.target.value.slice(0, 300) })}
                placeholder="nilai / template {variabel}"
                className="flex-1 min-w-0 h-9 bg-white/5 border border-white/10 rounded-lg px-2.5 text-[11px]  font-sans text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
              />
              <button
                type="button"
                onClick={() => {
                  const next = { ...(params || {}) };
                  delete next[k];
                  onChange(next);
                }}
                className="shrink-0 h-9 w-9 grid place-items-center bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                title="Hapus parameter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <div className="flex gap-1.5">
            <input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value.replace(/[^\w]/g, "").slice(0, 40))}
              onKeyDown={(e) => { if (e.key === "Enter") addParam(); }}
              placeholder="nama_param"
              className="w-[34%] min-w-0 h-9 bg-white/5 border border-dashed border-white/15 rounded-lg px-2.5 text-[11px]  font-sans text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50"
            />
            <input
              value={newVal}
              onChange={(e) => setNewVal(e.target.value.slice(0, 300))}
              onKeyDown={(e) => { if (e.key === "Enter") addParam(); }}
              placeholder="nilai, mis. Halo {nickname}!"
              className="flex-1 min-w-0 h-9 bg-white/5 border border-dashed border-white/15 rounded-lg px-2.5 text-[11px]  font-sans text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50"
            />
            <button
              type="button"
              onClick={addParam}
              disabled={!newKey.trim()}
              className="shrink-0 h-9 px-4 bg-white text-black rounded-lg text-[10px] font-black uppercase tracking-wider disabled:opacity-30 hover:bg-violet-200 transition-colors"
            >
              + Tambah
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Kartu satu event ----------
function EventCard({ icon: Icon, title, desc, vars, enabled, action, params, previewArgs, sbActions, connected, testing, onToggle, onAction, onParams, onTest }: {
  icon: typeof MessageSquare;
  title: string;
  desc: string;
  vars: string[];
  enabled: boolean;
  action: string;
  params: Record<string, string>;
  previewArgs: Record<string, unknown>;
  sbActions: string[];
  connected: boolean;
  testing: boolean;
  onToggle: (v: boolean) => void;
  onAction: (v: string) => void;
  onParams: (v: Record<string, string>) => void;
  onTest: () => void;
}) {
  const mapped = action.trim() !== "";
  const ready = enabled && mapped;
  const options = mapped && !sbActions.includes(action) ? [action, ...sbActions] : sbActions;
  return (
    <div className={`group rounded-2xl border p-3.5 space-y-3 transition-all ${ready ? "bg-white/[0.04] border-emerald-500/25 hover:border-emerald-500/45" : enabled ? "bg-white/[0.03] border-amber-500/30 hover:border-amber-500/50" : "bg-black/30 border-white/10 hover:border-white/20"}`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 transition-colors ${ready ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-gray-400"}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-black text-[12px] tracking-wide truncate">{title}</span>
            {ready
              ? <span className="shrink-0 px-1.5 py-px bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-full text-[8px] font-black uppercase tracking-widest">Aktif</span>
              : enabled
                ? <span className="shrink-0 px-1.5 py-px bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-full text-[8px] font-black uppercase tracking-widest">Belum ada action</span>
                : <span className="shrink-0 px-1.5 py-px bg-white/5 border border-white/10 text-gray-500 rounded-full text-[8px] font-black uppercase tracking-widest">Mati</span>}
          </div>
          <div className="text-gray-500 text-[10px] truncate mt-0.5">{desc}</div>
        </div>
        <Toggle on={enabled} onChange={onToggle} />
      </div>

      <div className="flex gap-2">
        <div className="flex-1 min-w-0 relative">
          <select
            value={action}
            onChange={(e) => onAction(e.target.value)}
            className={`w-full h-10 appearance-none bg-black/40 border border-white/10 rounded-xl pl-3 pr-8 text-[12px] font-sans focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 cursor-pointer ${mapped ? "text-white" : "text-gray-500"}`}
            title={connected ? "Pilih action Streamer.bot" : "Streamer.bot tidak terhubung — daftar mungkin tidak terbaru"}
          >
            <option value="" className="bg-[#161616] text-gray-400">
              {sbActions.length === 0 ? (connected ? "Memuat actions…" : "Pilih action Streamer.bot…") : `Pilih action… (${sbActions.length})`}
            </option>
            {options.map((name) => (
              <option key={name} value={name} className="bg-[#161616] text-white">
                {name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
        <button
          onClick={onTest}
          disabled={!connected || !mapped || testing}
          className="shrink-0 h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white text-black hover:bg-emerald-200"
          title={!connected ? "Streamer.bot tidak terhubung" : !mapped ? "Pilih action dulu" : "Kirim DoAction percobaan"}
        >
          <FlaskConical className={`w-3.5 h-3.5 ${testing ? "animate-pulse" : ""}`} /> {testing ? "…" : "Tes"}
        </button>
      </div>

      <ParamsEditor vars={vars} params={params} onChange={onParams} preview={previewArgs} />
    </div>
  );
}

type FilterTab = "all" | "active" | "unmapped" | "tiktok" | "widget";

export default function IntegrationsPage() {
  const supabase = createClient();
  const { map, updateEntry } = useTtSbMap();
  const { map: widgetMap, updateEntry: updateWidgetEntry } = useWidgetSbMap();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sbStatus, setSbStatus] = useState<"DISCONNECTED" | "CONNECTED" | "ERROR">("DISCONNECTED");
  const [sbActions, setSbActions] = useState<string[]>([]);
  const [sbEndpoint, setSbEndpoint] = useState("127.0.0.1:8080");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ tiktok: true });
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const sbRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast, show } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  // Koneksi ringan ke Streamer.bot (status + tes + daftar action).
  // Eksekusi asli tetap di dock - mapping tersinkron via localStorage.
  const connectSb = useCallback(() => {
    try {
      if (sbRef.current && sbRef.current.readyState !== WebSocket.CLOSED) {
        try { sbRef.current.close(); } catch {}
      }
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      const raw = localStorage.getItem("sb-config");
      const cfg = raw ? JSON.parse(raw) : {};
      const address = cfg.address || "127.0.0.1";
      const port = cfg.port || "8080";
      const endpoint = cfg.endpoint || "streamerbot";
      setSbEndpoint(`${address}:${port}`);
      const socket = new WebSocket(`ws://${address}:${port}/${endpoint}`);
      sbRef.current = socket;
      socket.onopen = () => {
        setSbStatus("CONNECTED");
        socket.send(JSON.stringify({ request: "GetActions", id: "integ-get-actions" }));
      };
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const actions = payload?.actions;
          if (payload?.id === "integ-get-actions" && Array.isArray(actions)) {
            setSbActions(
              actions
                .filter((a: any) => a?.enabled !== false && typeof a?.name === "string")
                .map((a: any) => a.name as string),
            );
          }
        } catch {}
      };
      socket.onerror = () => setSbStatus("ERROR");
      socket.onclose = () => {
        sbRef.current = null;
        setSbStatus((prev) => (prev === "CONNECTED" ? "DISCONNECTED" : prev));
        reconnectTimer.current = setTimeout(() => connectSb(), 5000);
      };
    } catch {
      setSbStatus("ERROR");
    }
  }, []);

  useEffect(() => {
    connectSb();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      try { sbRef.current?.close(); } catch {}
      sbRef.current = null;
    };
  }, [connectSb]);

  const connected = sbStatus === "CONNECTED";

  const sendTest = useCallback((label: string, action: string, baseArgs: Record<string, unknown>, params: Record<string, string>) => {
    if (!action.trim()) {
      show("Pilih action Streamer.bot dulu.", "error");
      return;
    }
    if (!sbRef.current || sbRef.current.readyState !== WebSocket.OPEN) {
      show("Streamer.bot tidak terhubung. Cek Config / dock.", "error");
      return;
    }
    setTestingKey(label);
    sbRef.current.send(JSON.stringify({
      request: "DoAction",
      action: { name: action.trim() },
      args: resolveSbArgs(baseArgs, params),
      id: `integ-test-${Date.now()}`,
    }));
    show(`Tes terkirim : ${action.trim()}`, "success");
    setTimeout(() => setTestingKey((k) => (k === label ? null : k)), 1200);
  }, [show]);

  // ---- daftar flat semua event untuk statistik + filter ----
  const allItems = useMemo(() => {
    const tt = TT_SB_KEYS.map((key) => ({
      group: "tiktok" as const,
      groupTitle: "TikTok Live",
      key: `tt:${key}`,
      title: TT_META[key].label,
      desc: TT_META[key].desc,
      vars: TT_SB_PARAMS[key],
      enabled: map[key].enabled,
      action: map[key].action,
      params: map[key].params || {},
      base: TEST_ARGS[key],
    }));
    const wg = WIDGET_SB_GROUPS.flatMap((g) => g.events.map((ev) => ({
      group: g.widget as string,
      groupTitle: g.title,
      key: `wg:${ev.key}`,
      title: ev.label,
      desc: ev.hint,
      vars: WIDGET_SB_PARAMS[ev.key] || [],
      enabled: widgetMap[ev.key].enabled,
      action: widgetMap[ev.key].action,
      params: widgetMap[ev.key].params || {},
      base: WIDGET_SB_TEST_ARGS[ev.key],
    })));
    return [...tt, ...wg];
  }, [map, widgetMap]);

  const totalActive = allItems.filter((i) => i.enabled && i.action.trim()).length;
  const totalEnabled = allItems.filter((i) => i.enabled).length;

  const filteredKeys = useMemo(() => {
    const q = search.trim().toLowerCase();
    return new Set(
      allItems
        .filter((i) => {
          if (tab === "active" && !(i.enabled && i.action.trim())) return false;
          if (tab === "unmapped" && (i.action.trim() || !i.enabled)) return false;
          if (tab === "tiktok" && i.group !== "tiktok") return false;
          if (tab === "widget" && i.group === "tiktok") return false;
          if (q && !`${i.title} ${i.desc} ${i.action} ${i.groupTitle}`.toLowerCase().includes(q)) return false;
          return true;
        })
        .map((i) => i.key),
    );
  }, [allItems, search, tab]);

  const isSearching = search.trim() !== "" || tab !== "all";
  const visibleGroup = (_groupKey: string, itemKeys: string[]) => {
    if (isSearching) return itemKeys.some((k) => filteredKeys.has(k));
    return true;
  };
  const toggleGroup = (g: string) => setOpenGroups((p) => ({ ...p, [g]: p[g] === false ? true : false }));

  const setGroupEnabled = (groupKey: string, keys: Array<TtSbEventKey | WidgetSbEventKey>, v: boolean) => {
    if (groupKey === "tiktok") (keys as TtSbEventKey[]).forEach((k) => updateEntry(k, { enabled: v }));
    else (keys as WidgetSbEventKey[]).forEach((k) => updateWidgetEntry(k, { enabled: v }));
    show(v ? "Semua event grup diaktifkan." : "Semua event grup dimatikan.", "info");
  };

  const testGroup = (items: typeof allItems) => {
    const actives = items.filter((i) => i.enabled && i.action.trim());
    if (actives.length === 0) {
      show("Tidak ada event aktif di grup ini.", "error");
      return;
    }
    if (!connected) {
      show("Streamer.bot tidak terhubung.", "error");
      return;
    }
    actives.forEach((i, idx) => {
      setTimeout(() => {
        sbRef.current?.send(JSON.stringify({
          request: "DoAction",
          action: { name: i.action.trim() },
          args: resolveSbArgs(i.base, i.params),
          id: `integ-group-test-${Date.now()}-${idx}`,
        }));
      }, idx * 400);
    });
    show(`${actives.length} tes dikirim berurutan.`, "success");
  };

  const tiktokItems = allItems.filter((i) => i.group === "tiktok");
  const statusColor = connected ? "text-emerald-300" : sbStatus === "ERROR" ? "text-red-400" : "text-gray-500";
  const dotColor = connected ? "bg-emerald-400 animate-pulse" : sbStatus === "ERROR" ? "bg-red-500" : "bg-gray-600";

  const TABS: Array<{ id: FilterTab; label: string }> = [
    { id: "all", label: "Semua" },
    { id: "active", label: "Aktif" },
    { id: "unmapped", label: "Butuh action" },
    { id: "tiktok", label: "TikTok" },
    { id: "widget", label: "Widget" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex font-sans">
      <Sidebar active="integrations" open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        <header className="h-14 bg-[#121212]/90 backdrop-blur border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/10 border border-white/10 rounded text-[8px] font-black tracking-widest text-white"><Plug className="w-3 h-3" /> INTEGRASI</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-[9px] font-black uppercase tracking-widest ${statusColor}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} /> {sbStatus}
            </span>
            <Link href="/dock" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Dock
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 max-w-[1000px] w-full mx-auto space-y-5 pb-20">
          {/* Hero + status */}
          <div className="bg-gradient-to-br from-[#1a1a2e] via-[#161616] to-[#161616] border border-white/10 rounded-2xl p-5 md:p-6 overflow-hidden relative">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center gap-4 relative">
              <div className="flex-1">
                <h1 className="text-white font-black text-lg md:text-xl tracking-tight flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-300" /> Event Streamer.bot
                </h1>
                <p className="text-gray-400 text-[11px] md:text-xs mt-1.5 leading-relaxed max-w-[560px]">
                  Setiap event TikTok & widget memicu <span className="text-white font-bold">DoAction</span> di Streamer.bot.
                  Nyalakan event, pilih action, atur parameter, lalu tekan <span className="text-white font-bold">Tes</span>.
                  Eksekusi live berjalan di <span className="text-white font-bold">dock</span> — tersinkron otomatis.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 rounded-full text-[10px] font-black">{totalActive}/{allItems.length} aktif siap</span>
                  {totalEnabled > totalActive && (
                    <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/25 text-amber-300 rounded-full text-[10px] font-black">{totalEnabled - totalActive} nyala tapi belum ada action</span>
                  )}
                  <span className="px-2.5 py-1 bg-white/5 border border-white/10 text-gray-400 rounded-full text-[10px]  font-sans">{sbEndpoint}</span>
                </div>
              </div>
              <button
                onClick={() => { connectSb(); show("Menghubungkan ulang ke Streamer.bot…", "info"); }}
                className="shrink-0 h-10 px-4 bg-white text-black hover:bg-gray-200 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Hubungkan
              </button>
            </div>
            {!connected && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-[11px] text-amber-200 leading-relaxed relative">
                ⚠️ Streamer.bot belum terhubung — mapping tetap bisa diatur (tersimpan), tapi tombol <b>Tes</b> butuh koneksi. Cek address/port di Config atau buka dock dengan Streamer.bot menyala.
              </div>
            )}
          </div>

          {/* Toolbar: search + filter */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center sticky top-14 z-10 bg-[#0a0a0a]/95 backdrop-blur py-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari event / action… (mis. gift, poll, song)"
                className="w-full h-10 pl-9 pr-9 bg-[#161616] border border-white/10 rounded-xl text-[12px] font-sans text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center rounded-lg text-gray-500 hover:text-white hover:bg-white/10">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 h-10 px-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${tab === t.id ? "bg-white text-black border-white" : "bg-[#161616] text-gray-400 border-white/10 hover:text-white hover:border-white/25"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grup TikTok */}
          {visibleGroup("tiktok", tiktokItems.map((i) => i.key)) && (
            <section className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden">
              <button onClick={() => toggleGroup("tiktok")} className="w-full px-5 py-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors text-left">
                <div className="w-10 h-10 rounded-xl bg-pink-500/15 text-pink-300 grid place-items-center shrink-0 font-black">TT</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-black uppercase text-[12px] tracking-widest">TikTok Live Streamer.bot</h3>
                  <div className="mt-1 h-1.5 bg-white/5 rounded-full overflow-hidden max-w-[280px]">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-violet-500 rounded-full transition-all"
                      style={{ width: `${(tiktokItems.filter((i) => i.enabled && i.action.trim()).length / Math.max(1, tiktokItems.length)) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-gray-500 text-[10px] font-black shrink-0">{tiktokItems.filter((i) => i.enabled).length}/{tiktokItems.length}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform shrink-0 ${openGroups["tiktok"] === false && !isSearching ? "" : "rotate-180"}`} />
              </button>
              {(openGroups["tiktok"] !== false || isSearching) && (
                <div className="px-4 md:px-5 pb-5 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setGroupEnabled("tiktok", TT_SB_KEYS, true)} className="h-8 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-wider text-gray-300 transition-colors">Nyalakan semua</button>
                    <button onClick={() => setGroupEnabled("tiktok", TT_SB_KEYS, false)} className="h-8 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-wider text-gray-300 transition-colors">Matikan semua</button>
                    <button onClick={() => testGroup(tiktokItems)} className="h-8 px-3 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 rounded-lg text-[9px] font-black uppercase tracking-wider text-gray-300 hover:text-emerald-200 flex items-center gap-1.5 transition-colors">
                      <Play className="w-3 h-3" /> Tes semua yg aktif
                    </button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {tiktokItems.filter((i) => filteredKeys.has(i.key)).map((i) => {
                      const key = i.key.replace("tt:", "") as TtSbEventKey;
                      const meta = TT_META[key];
                      return (
                        <EventCard
                          key={i.key}
                          icon={meta.Icon}
                          title={meta.label}
                          desc={`${meta.desc} • ${TT_SB_PARAMS[key].join(", ")}`}
                          vars={TT_SB_PARAMS[key]}
                          enabled={map[key].enabled}
                          action={map[key].action}
                          params={map[key].params || {}}
                          previewArgs={resolveSbArgs(TEST_ARGS[key], map[key].params || {})}
                          sbActions={sbActions}
                          connected={connected}
                          testing={testingKey === `tt:${key}`}
                          onToggle={(v) => updateEntry(key, { enabled: v })}
                          onAction={(v) => updateEntry(key, { action: v })}
                          onParams={(v) => updateEntry(key, { params: v })}
                          onTest={() => sendTest(`tt:${key}`, map[key].action, TEST_ARGS[key], map[key].params || {})}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Grup Widget */}
          {WIDGET_SB_GROUPS.map((group) => {
            const items = allItems.filter((i) => i.group === group.widget);
            if (!visibleGroup(group.widget, items.map((i) => i.key))) return null;
            const open = openGroups[group.widget] !== false || isSearching;
            const activeCount = items.filter((i) => i.enabled && i.action.trim()).length;
            const Icon = WIDGET_ICONS[group.widget] || Zap;
            return (
              <section key={group.widget} className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden">
                <button onClick={() => toggleGroup(group.widget)} className="w-full px-5 py-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors text-left">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-200 grid place-items-center shrink-0">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-black uppercase text-[12px] tracking-widest">{group.title} <span className="text-gray-600 normal-case font-bold">— {group.desc}</span></h3>
                    <div className="mt-1 h-1.5 bg-white/5 rounded-full overflow-hidden max-w-[280px]">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-emerald-400 rounded-full transition-all"
                        style={{ width: `${(activeCount / Math.max(1, items.length)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-gray-500 text-[10px] font-black shrink-0">{activeCount}/{items.length} aktif</span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <div className="px-4 md:px-5 pb-5 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setGroupEnabled(group.widget, group.events.map((e) => e.key), true)} className="h-8 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-wider text-gray-300 transition-colors">Nyalakan semua</button>
                      <button onClick={() => setGroupEnabled(group.widget, group.events.map((e) => e.key), false)} className="h-8 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-wider text-gray-300 transition-colors">Matikan semua</button>
                      <button onClick={() => testGroup(items)} className="h-8 px-3 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 rounded-lg text-[9px] font-black uppercase tracking-wider text-gray-300 hover:text-emerald-200 flex items-center gap-1.5 transition-colors">
                        <Play className="w-3 h-3" /> Tes semua yg aktif
                      </button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {items.filter((i) => filteredKeys.has(i.key)).map((i) => {
                        const key = i.key.replace("wg:", "") as WidgetSbEventKey;
                        return (
                          <EventCard
                            key={i.key}
                            icon={Icon}
                            title={i.title}
                            desc={i.desc}
                            vars={WIDGET_SB_PARAMS[key] || []}
                            enabled={widgetMap[key].enabled}
                            action={widgetMap[key].action}
                            params={widgetMap[key].params || {}}
                            previewArgs={resolveSbArgs(WIDGET_SB_TEST_ARGS[key], widgetMap[key].params || {})}
                            sbActions={sbActions}
                            connected={connected}
                            testing={testingKey === `wg:${key}`}
                            onToggle={(v) => updateWidgetEntry(key, { enabled: v })}
                            onAction={(v) => updateWidgetEntry(key, { action: v })}
                            onParams={(v) => updateWidgetEntry(key, { params: v })}
                            onTest={() => sendTest(`wg:${key}`, widgetMap[key].action, WIDGET_SB_TEST_ARGS[key], widgetMap[key].params || {})}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            );
          })}

          {isSearching && filteredKeys.size === 0 && (
            <div className="bg-[#161616] border border-dashed border-white/15 rounded-2xl p-10 text-center">
              <Search className="w-8 h-8 text-gray-600 mx-auto" />
              <div className="text-white font-black uppercase text-[12px] mt-3">Tidak ketemu</div>
              <div className="text-gray-500 text-[11px] mt-1">Coba kata kunci lain atau reset filter.</div>
              <button onClick={() => { setSearch(""); setTab("all"); }} className="mt-4 h-9 px-4 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-wider">Reset pencarian</button>
            </div>
          )}

          <p className="text-[10px] text-gray-600 leading-relaxed text-center max-w-[640px] mx-auto">
            Widget tanpa event server tidak perlu mapping: chat/event/follow/view-counter sudah dicover TikTok StreamerBot, sisanya (clock, QR, media-player, dsb.) client-only.
            Di Streamer.bot, argumen action dibaca dari nama key args di atas.
          </p>
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div key={toast.id} className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[11px] font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-2 ${toast.kind === "success" ? "bg-emerald-950/95 border-emerald-500/40 text-emerald-200" : toast.kind === "error" ? "bg-red-950/95 border-red-500/40 text-red-200" : "bg-[#1a1a1a]/95 border-white/15 text-gray-200"}`}>
          {toast.kind === "success" ? <Check className="w-3.5 h-3.5" /> : toast.kind === "error" ? <X className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
