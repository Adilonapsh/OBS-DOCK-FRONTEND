'use client';
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, Plug, FlaskConical, ArrowLeft } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { createClient } from "@/utils/supabase/client";
import { useTtSbMap, TT_SB_KEYS, type TtSbEventKey } from "../hooks/useTtSbMap";

const TEST_ARGS: Record<TtSbEventKey, Record<string, unknown>> = {
  chat: { type: "chat", nickname: "TestUser", comment: "Halo (tes)", profilePictureUrl: "" },
  gift: { type: "gift", nickname: "TestUser", giftName: "Rose", repeatCount: 1, diamondCount: 1 },
  like: { type: "like", nickname: "TestUser", likeCount: 10 },
  follow: { type: "follow", nickname: "TestUser" },
  member: { type: "member", nickname: "TestUser" },
};

export default function IntegrationsPage() {
  const supabase = createClient();
  const { map, updateEntry } = useTtSbMap();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sbStatus, setSbStatus] = useState<"DISCONNECTED" | "CONNECTED" | "ERROR">("DISCONNECTED");
  const [sbActions, setSbActions] = useState<string[]>([]);
  const sbRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  // Koneksi ringan ke Streamer.bot (hanya untuk status + tombol tes).
  // Eksekusi asli tetap di dock - mapping tersinkron via localStorage.
  useEffect(() => {
    let socket: WebSocket | null = null;
    try {
      const raw = localStorage.getItem("sb-config");
      const cfg = raw ? JSON.parse(raw) : {};
      const address = cfg.address || "127.0.0.1";
      const port = cfg.port || "8080";
      const endpoint = cfg.endpoint || "streamerbot";
      socket = new WebSocket(`ws://${address}:${port}/${endpoint}`);
      sbRef.current = socket;
      socket.onopen = () => {
        setSbStatus("CONNECTED");
        socket?.send(JSON.stringify({ request: "GetActions", id: "integ-get-actions" }));
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
      };
    } catch {
      setSbStatus("ERROR");
    }
    return () => {
      try { socket?.close(); } catch {}
      sbRef.current = null;
    };
  }, []);

  const handleTest = (key: TtSbEventKey) => {
    const action = map[key].action.trim();
    if (!action) {
      alert("Nama action kosong!");
      return;
    }
    if (!sbRef.current || sbRef.current.readyState !== WebSocket.OPEN) {
      alert("Streamer.bot tidak terhubung! Cek address/port di Config atau tab Sistem dock.");
      return;
    }
    sbRef.current.send(JSON.stringify({
      request: "DoAction",
      action: { name: action },
      args: TEST_ARGS[key],
      id: `integ-test-${Date.now()}`,
    }));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar active="integrations" open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/10 border border-white/10 rounded text-[8px] font-black tracking-widest text-white"><Plug className="w-3 h-3" /> INTEGRASI</span>
          </div>
          <Link href="/dock" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">
            <ArrowLeft className="w-3 h-3" /> Dock
          </Link>
        </header>

        <main className="flex-1 p-4 md:p-6 max-w-[900px] w-full mx-auto space-y-6">
          <div className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-white font-black uppercase text-[11px] tracking-widest">TikTok → Streamer.bot</h3>
                <p className="text-gray-500 text-[10px] mt-1">Setiap event TikTok memicu <span className="text-white font-bold">DoAction</span> di Streamer.bot. Eksekusi berjalan di dock - tersinkron otomatis.</p>
              </div>
              <span className={`${sbStatus === "CONNECTED" ? "text-green-400" : "text-gray-500"} font-black uppercase text-[10px] shrink-0 ml-3`}>{sbStatus}</span>
            </div>
            <div className="p-5 space-y-2">
              {TT_SB_KEYS.map((key) => (
                <div key={key} className="bg-black/30 border border-white/10 rounded-xl p-3 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-white font-black uppercase text-[11px]">{key}</span>
                    <input
                      type="checkbox"
                      checked={map[key].enabled}
                      onChange={(e) => updateEntry(key, { enabled: e.target.checked })}
                      className="w-4 h-4 accent-white cursor-pointer"
                    />
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={sbActions.includes(map[key].action) ? map[key].action : ""}
                      onChange={(e) => updateEntry(key, { action: e.target.value })}
                      className="flex-1 min-w-0 h-9 bg-white/5 border border-white/10 rounded-lg px-2 text-[11px] text-white font-mono focus:outline-none focus:border-white/30"
                    >
                      <option value="" className="bg-[#161616]">- Pilih action -</option>
                      {!sbActions.includes(map[key].action) && map[key].action.trim() !== "" && (
                        <option value={map[key].action} className="bg-[#161616]">{map[key].action} (tersimpan)</option>
                      )}
                      {sbActions.map((name) => (
                        <option key={name} value={name} className="bg-[#161616]">{name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleTest(key)}
                      className="shrink-0 h-9 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black uppercase text-gray-300 flex items-center gap-1.5"
                    >
                      <FlaskConical className="w-3 h-3" /> Tes
                    </button>
                  </div>
                </div>
              ))}
              <p className="text-[9px] text-gray-600 leading-relaxed">Args yang dikirim: chat <code className="bg-white/10 px-1 rounded text-gray-400">nickname, comment</code> • gift <code className="bg-white/10 px-1 rounded text-gray-400">giftName, repeatCount</code> • like <code className="bg-white/10 px-1 rounded text-gray-400">likeCount</code> • follow/member <code className="bg-white/10 px-1 rounded text-gray-400">nickname</code>. Di Streamer.bot pakai sebagai argumen action.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
