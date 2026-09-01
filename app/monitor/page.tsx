'use client';
import { useState, useEffect, useRef } from "react";
import { Activity, AlertTriangle, CheckCircle, RefreshCcw, Video, Eye, Menu } from "lucide-react";
import { cn } from "../lib/utils";
import StreamDetailModal from "./StreamDetailModal";
import Sidebar from "../components/Sidebar";
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

function StreamCard({ st, onClick }: { st: StreamItem; onClick: () => void }) {
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
            src={getStreamUrlFromItem(st)}
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
}

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
                  Belum ada server. <a href="/config" className="text-blue-600 underline">Tambah di Config</a>
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
            {(() => {
              if (streams.length === 0 && !loading) {
                return <div className="border border-white/10 rounded-xl p-8 text-center bg-[#161616] text-gray-500 text-sm">0 Data Ditemukan</div>;
              }
              if (groupBy === "server") {
                const grouped = streams.reduce((acc, st) => {
                  const group = st.serverName || "Unassigned Server";
                  if (!acc[group]) acc[group] = [];
                  acc[group].push(st);
                  return acc;
                }, {} as Record<string, StreamItem[]>);
                return (
                  <div className="space-y-8">
                    {Object.entries(grouped).map(([srvName, items]) => (
                      <div key={srvName} className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2 border-b border-white/10 pb-2">
                          <span>Server: {srvName}</span>
                          <span className="text-[10px] bg-white/10 text-gray-400 px-2.5 py-0.5 rounded-full font-mono border border-white/5">
                            {items.filter((i) => i.ready).length}/{items.length} ONLINE
                          </span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {items.map((st) => (
                            <StreamCard key={st._id} st={st} onClick={() => setSelectedStream(st)} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }
              if (groupBy === "group") {
                const grouped = streams.reduce((acc, st) => {
                  const group = st.confName === "all_others" ? "Kategori: Umum (all_others)" : st.confName || "Kategori: Umum";
                  if (!acc[group]) acc[group] = [];
                  acc[group].push(st);
                  return acc;
                }, {} as Record<string, StreamItem[]>);
                return (
                  <div className="space-y-8">
                    {Object.entries(grouped).map(([groupName, items]) => (
                      <div key={groupName} className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2 border-b border-white/10 pb-2">
                          <span>Group: {groupName}</span>
                          <span className="text-[10px] bg-white/10 text-gray-400 px-2.5 py-0.5 rounded-full font-mono border border-white/5">
                            {items.filter((i) => i.ready).length}/{items.length} ONLINE
                          </span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {items.map((st) => (
                            <StreamCard key={st._id} st={st} onClick={() => setSelectedStream(st)} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {streams.map((st) => (
                    <StreamCard key={st._id} st={st} onClick={() => setSelectedStream(st)} />
                  ))}
                </div>
              );
            })()}
          </div>

          <StreamDetailModal stream={selectedStream} onClose={() => setSelectedStream(null)} />
        </div>
      </div>
    </div>
  );
}
