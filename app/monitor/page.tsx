'use client';
import { useState, useEffect, useRef, memo, useMemo } from "react";
import { Activity, AlertTriangle, CheckCircle, RefreshCcw, Video, Eye, Menu, Maximize2 } from "lucide-react";
import { cn } from "../lib/utils";
import StreamDetailModal from "./StreamDetailModal";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";
import { createClient } from "@/utils/supabase/client";
import { decrypt } from "../utils/encryption";

interface StreamItem {
  _id: string;
  name: string;
  ready: boolean;
  readyTime: string;
  serverId: string;
  serverName: string;
  confName?: string;
  source?: { type: string; id: string };
  tracks?: string[];
  readers?: any[];
  bytesReceived?: number;
  bytesSent?: number;
  hlsUrlBase?: string;
  serverUrl?: string;
}

const getStreamUrlFromItem = (s: StreamItem) => {
  if (!s) return "";
  let base = s.hlsUrlBase;
  if (!base && s.serverUrl) {
    try {
      const urlObj = new URL(s.serverUrl);
      urlObj.port = "8888";
      urlObj.pathname = "";
      urlObj.search = "";
      base = urlObj.toString().replace(/\/$/, "");
    } catch (e) {
      base = "";
    }
  }
  if (!base) return "";
  return `${base}/${s.name}/`;
};

function UptimeTick({ ready, readyTime }: { ready: boolean; readyTime: string }) {
  const [uptimeStr, setUptimeStr] = useState("00:00:00");
  useEffect(() => {
    if (!ready || !readyTime) {
      setUptimeStr("00:00:00");
      return;
    }
    const readyDate = new Date(readyTime).getTime();
    const updateUptime = () => {
      const diffMs = Math.max(0, Date.now() - readyDate);
      const totalSecs = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      const pad = (n: number) => n.toString().padStart(2, "0");
      setUptimeStr(`${pad(hours)}:${pad(mins)}:${pad(secs)}`);
    };
    updateUptime();
    const int = setInterval(updateUptime, 1000);
    return () => clearInterval(int);
  }, [ready, readyTime]);
  return <>{uptimeStr}</>;
}

const getPrivateKey = () => {
  if (typeof window === "undefined") return "";
  return (
    new URLSearchParams(window.location.search).get("key") ||
    sessionStorage.getItem("bypass_private_key") ||
    sessionStorage.getItem("dock_private_verified") ||
    ""
  );
};

const StreamCard = memo(function StreamCard({ st, onClick }: { st: StreamItem; onClick: () => void }) {
  const openFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const key = getPrivateKey();
    const url = `/monitor/fullscreen?stream=${encodeURIComponent(st.name)}${key ? `&key=${encodeURIComponent(key)}` : ""}`;
    window.open(url, "_blank");
  };
  // src di-memo per stream agar re-render (polling / ganti group) tidak reload iframe.
  // iframe hanya reload bila src berubah atau komponen di-unmount.
  const previewSrc = useMemo(
    () => getStreamUrlFromItem(st),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [st._id, st.name, st.hlsUrlBase, st.serverUrl]
  );
  return (
    <div
      onClick={onClick}
      className={cn(
        "group border rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-all",
        st.ready ? "border-white/10 bg-[#161616] hover:border-white/15 hover:bg-white/[0.03]" : "border-white/5 bg-white/5 opacity-60 hover:opacity-80"
      )}
    >
      <div className="flex justify-between items-start">
        <span className={cn("text-sm font-semibold", st.ready ? "text-white" : "text-gray-500 line-through")}>{st.name}</span>
        <span className={cn("w-2 h-2 rounded-full mt-1", st.ready ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" : "bg-gray-600")}></span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">{st.serverName}</span>
        {st.confName && st.confName !== "all_others" && (
          <span className="text-[9px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-wide border border-white/5">
            {st.confName}
          </span>
        )}
      </div>
      <div className={cn("mt-4 aspect-video rounded-xl flex flex-col items-center justify-center relative overflow-hidden border border-white/5", st.ready ? "bg-black" : "bg-white/5")}>
        {st.ready ? (
          <iframe
            key={st._id}
            src={previewSrc}
            title={`Preview: ${st.name}`}
            className="w-full h-full border-0 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity"
            allow="autoplay; encrypted-media"
            tabIndex={-1}
          />
        ) : (
          <Video className="w-8 h-8 text-white/20" strokeWidth={1.5} />
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          <div className="bg-black/60 backdrop-blur text-white/80 px-1.5 rounded text-[10px] font-medium leading-none py-1 border border-white/10">TLS</div>
          <div className="bg-black/60 backdrop-blur text-white/80 px-1.5 rounded text-[10px] font-medium leading-none py-1 border border-white/10">E2E</div>
        </div>
        <button
          onClick={openFullscreen}
          title="Buka fullscreen / OBS"
          className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur border border-white/10 rounded-lg text-white/70 hover:text-white hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Maximize2 size={13} />
        </button>
      </div>
      <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
        <span className="text-[10px] text-gray-500 font-mono">
          <UptimeTick ready={st.ready} readyTime={st.readyTime} />
        </span>
        <span className={cn("text-[10px] font-black uppercase tracking-wide flex items-center gap-1", st.ready ? "text-green-400" : "text-gray-600")}>
          <Eye size={12} className={st.ready ? "text-green-400" : "opacity-30"} />
          {st.ready ? "ACTIVE" : "OFFLINE"}
        </span>
      </div>
    </div>
  );
});

export default function MonitorPage() {
  const supabase = createClient();
  const [streams, setStreams] = useState<StreamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [notifications, setNotifications] = useState<{ id: number; msg: string }[]>([]);
  const [selectedStream, setSelectedStream] = useState<StreamItem | null>(null);
  const [groupBy, setGroupBy] = useState<"none" | "server" | "group">("none");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mtxServers, setMtxServers] = useState<any[]>([]);
  const previousStreamsRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user);
    });
    const loadMtx = async () => {
      const getEncKey = () => {
        if (typeof window !== "undefined") {
          return sessionStorage.getItem("bypass_private_key") || sessionStorage.getItem("dock_private_verified") || new URLSearchParams(window.location.search).get("key") || "obs-overlays-default-key";
        }
        return "obs-overlays-default-key";
      };
      const encKey = getEncKey();
      const bypassKey = typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("key") || sessionStorage.getItem("bypass_private_key") || sessionStorage.getItem("dock_private_verified")) : null;
      let servers: any[] = [];
      if (bypassKey) {
        try {
          const { data: mtx } = await (supabase as any).rpc("get_mediatx_by_private_key", { p_key: bypassKey });
          if (Array.isArray(mtx)) servers = mtx;
        } catch {}
      }
      if (servers.length === 0) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: mtx } = await supabase.from("mediatx_servers").select("*").eq("user_id", session.user.id).order("created_at");
          if (mtx) servers = mtx as any[];
        }
      }
      if (servers.length === 0) {
        try {
          const raw = localStorage.getItem("mtx-servers");
          if (raw) servers = JSON.parse(raw);
        } catch {}
      }
      // decrypt basic_pass
      const decServers = await Promise.all(
        servers.map(async (r: any) => ({
          id: r.id,
          serverName: r.server_name || r.serverName,
          apiUrl: r.api_url || r.apiUrl,
          playerUrlBase: r.player_url_base || r.playerUrlBase,
          basicUser: r.basic_user || r.basicUser || "",
          basicPass: r.basic_pass ? await decrypt(r.basic_pass, encKey).catch(() => r.basic_pass) : (r.basicPass || ""),
        }))
      );
      setMtxServers(decServers);
    };
    loadMtx();
  }, []);

  const fetchPaths = async () => {
    if (mtxServers.length === 0) {
      setLoading(false);
      return;
    }
    try {
      const allItems: StreamItem[] = [];
      for (const srv of mtxServers) {
        try {
          const headers: Record<string, string> = {};
          if (srv.basicUser || srv.basicPass) {
            headers["Authorization"] = "Basic " + btoa(`${srv.basicUser}:${srv.basicPass}`);
          }
          // try multiple possible API formats
          let apiUrl = srv.apiUrl;
          // if apiUrl is like http://ip:9997/v3/paths/list, use as is, else try to append
          const res = await fetch(apiUrl, { headers });
          if (!res.ok) continue;
          const data = await res.json();
          // MediaMTX v1: { items: [...] } or { paths: [...] } or array
          let items: any[] = [];
          if (Array.isArray(data)) items = data;
          else if (data.items) items = data.items;
          else if (data.paths) items = Object.values(data.paths);
          else if (data.path) items = [data.path];
          else items = [];

          // normalize items to StreamItem
          for (const it of items) {
            const name = it.name || it.path || it.id || "unknown";
            const ready = it.ready ?? it.sourceReady ?? it.readyTime != null ? !!it.ready : true;
            const readyTime = it.readyTime || it.creationTime || new Date().toISOString();
            const id = `${srv.id}_${name}`;
            allItems.push({
              _id: id,
              name,
              ready: !!ready,
              readyTime,
              serverId: srv.id,
              serverName: srv.serverName,
              confName: it.confName || it.configName || "all_others",
              source: it.source,
              tracks: it.tracks || it.tracksCount || [],
              readers: it.readers || [],
              bytesReceived: it.bytesReceived || it.inBytes || 0,
              bytesSent: it.bytesSent || it.outBytes || 0,
              hlsUrlBase: srv.playerUrlBase,
              serverUrl: srv.apiUrl,
            });
          }
        } catch (e) {
          console.error("fetch mtx", srv.serverName, e);
        }
      }

      const currentStreams: { [key: string]: boolean } = {};
      allItems.forEach((st) => {
        currentStreams[st._id] = st.ready;
      });
      const previous = previousStreamsRef.current;
      for (const id of Object.keys(previous)) {
        if (previous[id] && !currentStreams[id]) {
          addNotification(`Stream offline: ${id.split("_").slice(1).join("_")}`);
        }
      }
      previousStreamsRef.current = currentStreams;

      setStreams(allItems);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mtxServers.length === 0) return;
    fetchPaths();
    const int = setInterval(fetchPaths, 5000);
    return () => clearInterval(int);
  }, [mtxServers]);

  const addNotification = (msg: string) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, msg }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const total = streams.length;
  const online = streams.filter((s) => s.ready).length;
  const offline = total - online;

  // ---- Anti-reload iframe saat pindah group ----
  // Prinsip: SATU grid + key stabil (st._id). Pindah group hanya ubah CSS `order`,
  // tidak memindah DOM / unmount. iframe hanya reload bila src berubah / unmount.
  // Header group dirender terpisah (tanpa iframe) sehingga aman di-remount.
  const sortedStreams = useMemo(
    () => [...streams].sort((a, b) => a._id.localeCompare(b._id)),
    [streams]
  );
  const groupKeyOf = (st: StreamItem) =>
    groupBy === "server"
      ? st.serverName || "Unassigned Server"
      : st.confName === "all_others"
        ? "Kategori: Umum (all_others)"
        : st.confName || "Kategori: Umum";
  const groupSummaries = useMemo(() => {
    if (groupBy === "none") return [];
    const m = new Map<string, StreamItem[]>();
    for (const st of streams) {
      const k = groupKeyOf(st);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(st);
    }
    return [...m.entries()]
      .map(([key, items]) => ({
        key,
        label: groupBy === "server" ? `Server: ${key}` : `Group: ${key}`,
        total: items.length,
        onlineCount: items.filter((i) => i.ready).length,
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streams, groupBy]);
  const visualOrder = useMemo(() => {
    const m = new Map<string, number>();
    if (groupBy === "none") {
      sortedStreams.forEach((st, i) => m.set(st._id, i));
      return m;
    }
    const grouped = new Map<string, string[]>();
    for (const st of sortedStreams) {
      const g = groupKeyOf(st);
      if (!grouped.has(g)) grouped.set(g, []);
      grouped.get(g)!.push(st._id);
    }
    let o = 0;
    [...grouped.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([, ids]) => {
        ids.sort().forEach((id) => m.set(id, o++));
      });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedStreams, groupBy]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar active="monitor" open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      {/* Hack: sidebar active dock but we want monitor active, add custom */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white">
              <Menu className="w-5 h-5" />
            </button>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/10 border border-white/10 rounded text-[8px] font-black tracking-widest text-white">MONITOR</span>
            <span className="hidden md:inline text-[11px] text-gray-500 font-bold">{mtxServers.length} MediaMTX • {total} streams</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => {
                setLoading(true);
                fetchPaths();
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-black uppercase bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-gray-300 transition-colors"
            >
              <span className={cn("w-1.5 h-1.5 rounded-full bg-green-500", loading && "animate-pulse")}></span>
              Refresh
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto space-y-6 flex flex-col">
          <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-2">
            {notifications.map((n) => (
              <div key={n.id} className="bg-red-50 border border-red-100 text-red-600 rounded p-4 flex items-center gap-3 shadow-sm">
                <AlertTriangle size={16} />
                <span className="text-xs font-medium">{n.msg}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Stream Status</h2>
              <p className="text-xs font-mono text-zinc-400 mt-1">LAST UPDATE: {lastUpdated.toLocaleTimeString()}</p>
            </div>
            <div className="text-xs text-zinc-500">
              {mtxServers.length === 0 ? (
                <span>
                  Belum ada server. <a href="/connection" className="text-blue-600 underline">Tambah di Connection</a>
                </span>
              ) : (
                <span>{mtxServers.map((s) => s.serverName).join(", ")}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-white/10 rounded-xl bg-[#161616] p-4">
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Total Kamera</p>
              <div className="text-2xl font-black mt-1 text-white">{total}</div>
            </div>
            <div className="border border-white/10 rounded-xl bg-[#161616] p-4">
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Online</p>
              <div className="text-2xl font-black mt-1 text-green-400">{online}</div>
            </div>
            <div className="border border-white/10 rounded-xl bg-[#161616] p-4">
              <p className="text-[10px] text-red-400 uppercase font-black tracking-widest">Offline</p>
              <div className="text-2xl font-black mt-1 text-red-400">{offline}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <p className="text-sm font-black uppercase tracking-widest text-white">Kelompokkan Kamera:</p>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 max-w-max">
              <button
                type="button"
                onClick={() => setGroupBy("none")}
                className={cn("px-3 py-1.5 text-xs font-black uppercase tracking-wide rounded-lg transition-all", groupBy === "none" ? "bg-white text-black shadow" : "text-gray-500 hover:text-white")}
              >
                Semua Stream
              </button>
              <button
                type="button"
                onClick={() => setGroupBy("server")}
                className={cn("px-3 py-1.5 text-xs font-black uppercase tracking-wide rounded-lg transition-all", groupBy === "server" ? "bg-white text-black shadow" : "text-gray-500 hover:text-white")}
              >
                Per Server
              </button>
              <button
                type="button"
                onClick={() => setGroupBy("group")}
                className={cn("px-3 py-1.5 text-xs font-black uppercase tracking-wide rounded-lg transition-all", groupBy === "group" ? "bg-white text-black shadow" : "text-gray-500 hover:text-white")}
              >
                Per Kategori
              </button>
            </div>
          </div>

          <div className="w-full">
            {streams.length === 0 && !loading ? (
              <div className="border border-white/10 rounded-xl p-8 text-center bg-[#161616] text-gray-500 text-sm">0 Data Ditemukan</div>
            ) : (
              <>
                {groupBy !== "none" && (
                  <div className="space-y-2 mb-6">
                    {groupSummaries.map((g) => (
                      <h3 key={g.key} className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2 border-b border-white/10 pb-2">
                        <span>{g.label}</span>
                        <span className="text-[10px] bg-white/10 text-gray-400 px-2.5 py-0.5 rounded-full font-mono border border-white/5">
                          {g.onlineCount}/{g.total} ONLINE
                        </span>
                      </h3>
                    ))}
                  </div>
                )}
                {/* Grid tunggal + key stabil: pindah group hanya ubah `order`, iframe tidak reload */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedStreams.map((st) => (
                    <div key={st._id} style={{ order: visualOrder.get(st._id) ?? 0 }} className="min-w-0">
                      <StreamCard st={st} onClick={() => setSelectedStream(st)} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <StreamDetailModal key={selectedStream?._id ?? "none"} stream={selectedStream ? (streams.find((s) => s._id === selectedStream._id) ?? selectedStream) : null} onClose={() => setSelectedStream(null)} />
        </div>
      </div>
    </div>
  );
}
