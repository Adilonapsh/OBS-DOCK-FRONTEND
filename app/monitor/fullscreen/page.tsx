'use client';
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RefreshCcw, Radio, Volume2, VolumeX } from "lucide-react";
import Hls from "hls.js";
import { createClient } from "@/utils/supabase/client";
import { decrypt } from "../../utils/encryption";
import Logo from "@/components/Logo";

interface StreamItem {
  _id: string;
  name: string;
  ready: boolean;
  readyTime: string;
  serverId: string;
  serverName: string;
  confName?: string;
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
    } catch {
      base = "";
    }
  }
  if (!base) return "";
  return `${base}/${s.name}/`;
};

const OFFLINE_FRAME = "w-28 h-28 md:w-36 md:h-36 object-contain rounded-3xl shadow-[0_0_60px_rgba(255,255,255,0.08)] border border-white/10 bg-white/5 p-2";

function FullscreenContent() {
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const streamParam = searchParams.get("stream") || "";
  const serverParam = searchParams.get("server") || "";
  const privateKey = searchParams.get("key") || searchParams.get("privateKey") || "";
  const logoParam = searchParams.get("logo") || "";
  const showBadge = searchParams.get("badge") !== "0";
  // default: langsung bersuara. Paksa bisu hanya kalau ?muted=1 / ?mute=1
  const forceMuted =
    searchParams.get("muted") === "1" || searchParams.get("mute") === "1";

  const [streams, setStreams] = useState<StreamItem[]>([]);
  const [mtxServers, setMtxServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(streamParam);
  const [logoError, setLogoError] = useState(false);
  const MAX_AUTO_RETRIES = 3;
  const RETRY_DELAY_MS = 3000;

  const [muted, setMuted] = useState(forceMuted);
  const [useIframe, setUseIframe] = useState(searchParams.get("player") === "iframe");
  const [reconnectTick, setReconnectTick] = useState(0);
  const [reconnecting, setReconnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0); // percobaan auto-reconnect ke-N
  const [givenUp, setGivenUp] = useState(false); // sudah 3x gagal -> putus ke layar offline
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const userMutedRef = useRef(false); // true kalau user sengaja klik mute
  const retriesRef = useRef(0); // hitungan percobaan (anti-stale closure)
  const deadRef = useRef(false); // true = sudah menyerah, tampil offline
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRetryTimer = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  // bersihkan timer saat unmount
  useEffect(() => () => clearRetryTimer(), []);

  // keep selected in sync when ?stream= changes
  useEffect(() => {
    setSelected(streamParam);
  }, [streamParam]);

  // ---- load MediaMTX servers (same logic as /monitor, support private key tanpa login) ----
  useEffect(() => {
    const loadMtx = async () => {
      const encKey =
        privateKey ||
        (typeof window !== "undefined"
          ? sessionStorage.getItem("bypass_private_key") ||
            sessionStorage.getItem("dock_private_verified") ||
            "obs-overlays-default-key"
          : "obs-overlays-default-key");
      const keyFromUrl =
        privateKey ||
        (typeof window !== "undefined"
          ? sessionStorage.getItem("bypass_private_key") ||
            sessionStorage.getItem("dock_private_verified")
          : null);

      let servers: any[] = [];
      if (keyFromUrl) {
        try {
          const { data: mtx } = await (supabase as any).rpc("get_mediatx_by_private_key", { p_key: keyFromUrl });
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
      const decServers = await Promise.all(
        servers.map(async (r: any) => ({
          id: r.id,
          serverName: r.server_name || r.serverName,
          apiUrl: r.api_url || r.apiUrl,
          playerUrlBase: r.player_url_base || r.playerUrlBase,
          basicUser: r.basic_user || r.basicUser || "",
          basicPass: r.basic_pass ? await decrypt(r.basic_pass, encKey).catch(() => r.basic_pass) : r.basicPass || "",
        }))
      );
      setMtxServers(decServers);
    };
    loadMtx();
  }, [supabase, privateKey]);

  // ---- poll paths ----
  useEffect(() => {
    if (mtxServers.length === 0) {
      // beri kesempatan load dulu, tapi jangan loading selamanya
      const t = setTimeout(() => setLoading(false), 2500);
      return () => clearTimeout(t);
    }
    let cancelled = false;
    const fetchPaths = async () => {
      try {
        const allItems: StreamItem[] = [];
        for (const srv of mtxServers) {
          try {
            const headers: Record<string, string> = {};
            if (srv.basicUser || srv.basicPass) {
              headers["Authorization"] = "Basic " + btoa(`${srv.basicUser}:${srv.basicPass}`);
            }
            const res = await fetch(srv.apiUrl, { headers });
            if (!res.ok) continue;
            const data = await res.json();
            let items: any[] = [];
            if (Array.isArray(data)) items = data;
            else if (data.items) items = data.items;
            else if (data.paths) items = Object.values(data.paths);
            else if (data.path) items = [data.path];
            for (const it of items) {
              const name = it.name || it.path || it.id || "unknown";
              const ready = it.ready ?? it.sourceReady ?? true;
              allItems.push({
                _id: `${srv.id}_${name}`,
                name,
                ready: !!ready,
                readyTime: it.readyTime || it.creationTime || new Date().toISOString(),
                serverId: srv.id,
                serverName: srv.serverName,
                confName: it.confName || it.configName,
                hlsUrlBase: srv.playerUrlBase,
                serverUrl: srv.apiUrl,
              });
            }
          } catch {}
        }
        if (!cancelled) {
          setStreams(allItems);
          // kalau belum ada pilihan, auto-pilih stream pertama yang ready (atau pertama)
          setSelected((prev) => {
            if (prev) return prev;
            const firstReady = allItems.find((s) => s.ready);
            return (firstReady || allItems[0])?.name || "";
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPaths();
    const int = setInterval(fetchPaths, 5000);
    return () => {
      cancelled = true;
      clearInterval(int);
    };
  }, [mtxServers]);

  const current: StreamItem | undefined = useMemo(() => {
    let pool = streams;
    if (serverParam) {
      pool = pool.filter((s) => s.serverId === serverParam || s.serverName === serverParam);
    }
    // kalau ?stream= diisi, strict: hanya tampilkan stream itu.
    // kalau tidak ketemu -> offline (jangan fallback ke stream lain).
    if (selected) {
      const exact = pool.find((s) => s.name === selected);
      if (exact) return exact;
      const ci = pool.find((s) => s.name.toLowerCase() === selected.toLowerCase());
      return ci; // undefined kalau tidak ada -> tampil OFFLINE + nama yang diminta
    }
    // kalau ?stream= kosong, baru auto-pilih yang ready
    if (pool.length === 0) return undefined;
    return pool.find((s) => s.ready) || pool[0];
  }, [streams, selected, serverParam]);

  const streamUrl = current ? getStreamUrlFromItem(current) : "";
  const hlsUrl = streamUrl ? `${streamUrl}index.m3u8` : "";
  const isLive = !!current?.ready && !!streamUrl;
  // sudah menyerah setelah 3x retry -> putus, tampil layar offline
  const isDead = givenUp;

  // reset hitungan retry saat ganti stream / sesi publish baru -> coba lagi dari awal
  useEffect(() => {
    retriesRef.current = 0;
    deadRef.current = false;
    setRetryCount(0);
    setGivenUp(false);
    setReconnecting(false);
    clearRetryTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hlsUrl, current?.readyTime]);

  // pasang ulang player dari nol (dipakai auto-retry & tombol manual)
  const reattachPlayer = () => {
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch {}
      hlsRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      try { video.pause(); } catch {}
      video.removeAttribute("src");
      video.load();
    }
    setUseIframe(searchParams.get("player") === "iframe");
    setReconnectTick((t) => t + 1);
  };

  // dipanggil tiap player gagal total: auto-reconnect maks 3x, selebihnya putus
  const handlePlayerFailure = () => {
    if (deadRef.current) return;
    if (retriesRef.current >= MAX_AUTO_RETRIES) {
      deadRef.current = true;
      setGivenUp(true);
      setReconnecting(false);
      clearRetryTimer();
      return;
    }
    retriesRef.current += 1;
    setRetryCount(retriesRef.current);
    setReconnecting(true);
    clearRetryTimer();
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      if (!deadRef.current) reattachPlayer();
    }, RETRY_DELAY_MS);
  };

  // ---- HLS player (native <video>, auto-unmute + auto-reconnect 3x) ----
  // Coba play dengan suara; kalau browser menolak (autoplay policy),
  // fallback ke muted agar gambar tetap jalan, lalu coba unmute lagi
  // saat video sudah bisa diputar (di OBS/CEF biasanya langsung bersuara).
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl || useIframe) return;

    video.muted = muted;

    const tryUnmuted = () => {
      if (userMutedRef.current) return;
      video.muted = false;
      video.play().then(() => setMuted(false)).catch(() => {});
    };

    // sukses jalan -> hitungan retry di-nol-kan lagi
    const onPlaying = () => {
      retriesRef.current = 0;
      setRetryCount(0);
      setReconnecting(false);
      clearRetryTimer();
    };

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari: native HLS
      video.src = hlsUrl;
      if (!muted) {
        video.play().catch(() => {
          video.muted = true;
          setMuted(true);
          video.play().catch(() => {});
        });
      } else {
        video.play().catch(() => {});
      }
      const onCanPlay = () => tryUnmuted();
      video.addEventListener("canplay", onCanPlay);
      video.addEventListener("playing", onPlaying);
      return () => {
        video.removeEventListener("canplay", onCanPlay);
        video.removeEventListener("playing", onPlaying);
      };
    }
    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!muted) {
          video.play().catch(() => {
            video.muted = true;
            setMuted(true);
            video.play().catch(() => {});
          });
        } else {
          video.play().catch(() => {});
        }
      });
      const onCanPlay = () => tryUnmuted();
      video.addEventListener("canplay", onCanPlay);
      video.addEventListener("playing", onPlaying);
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (data.fatal) handlePlayerFailure();
      });
      return () => {
        video.removeEventListener("canplay", onCanPlay);
        video.removeEventListener("playing", onPlaying);
        hls.destroy();
        hlsRef.current = null;
      };
    }
    // tidak support HLS -> fallback iframe
    setUseIframe(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hlsUrl, useIframe, reconnectTick]);

  // sinkron muted ke elemen video
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = muted;
      if (!muted) video.play().catch(() => {});
    }
  }, [muted]);

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      userMutedRef.current = next; // ingat pilihan manual user agar auto-unmute tidak melawannya
      const video = videoRef.current;
      if (video) {
        video.muted = next;
        video.play().catch(() => {});
      }
      return next;
    });
  };

  // putus total sesi player lalu sambung ulang (tanpa reload page).
  // Dipakai tombol manual (reset hitungan) & auto-retry sudah lewat fungsi ini.
  const handleReconnect = () => {
    deadRef.current = false;
    setGivenUp(false);
    retriesRef.current = 0;
    setRetryCount(0);
    clearRetryTimer();
    reattachPlayer();
    setReconnecting(true);
    setTimeout(() => setReconnecting(false), 3000);
  };

  return (
    <div className="h-screen max-h-screen w-screen max-w-[100vw] overflow-hidden bg-black text-white">
      {loading ? (
        <div className="h-screen max-h-screen w-full flex flex-col items-center justify-center gap-3 text-gray-500 bg-black">
          <RefreshCcw size={28} className="animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest">Menghubungkan…</p>
        </div>
      ) : isLive && current && !isDead ? (
        <div className="relative h-screen max-h-screen w-screen overflow-hidden bg-black">
          {useIframe ? (
            <iframe
              key={`${streamUrl}#${reconnectTick}`}
              src={streamUrl}
              title={`Live: ${current.name}`}
              className="absolute inset-0 h-full w-full border-0"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
          ) : (
            <video
              ref={videoRef}
              key={`${hlsUrl}#${reconnectTick}`}
              className="absolute inset-0 h-full w-full bg-black object-contain"
              autoPlay
              muted={muted}
              playsInline
              onError={() => handlePlayerFailure()}
            />
          )}
          {showBadge && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-red-600 rounded-md shadow-lg pointer-events-none">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-[11px] font-black tracking-widest">LIVE</span>
            </div>
          )}
          {/* tombol reconnect - putus & sambung ulang stream tanpa reload page */}
          <button
            onClick={handleReconnect}
            title="Reconnect stream"
            className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur border border-white/15 rounded-xl text-white hover:bg-black/80 transition-colors"
          >
            <RefreshCcw size={16} className={reconnecting ? "animate-spin" : ""} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {reconnecting ? (retryCount > 0 ? `Retry ${retryCount}/${MAX_AUTO_RETRIES}…` : "Connecting…") : "Reconnect"}
            </span>
          </button>
        </div>
      ) : (
        /* ---- OFFLINE SCREEN + LOGO - full screen, tanpa header/navbar ---- */
        <div className="relative h-screen max-h-screen w-screen flex flex-col items-center justify-center text-center bg-[#050505] overflow-hidden px-6">
          {/* subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          {/* vignette */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)" }} />

          <div className="relative flex flex-col items-center max-w-md">
            {logoParam ? (
              !logoError ? (
                <img
                  src={logoParam}
                  alt="Channel logo"
                  onError={() => setLogoError(true)}
                  className={OFFLINE_FRAME}
                />
              ) : (
                <div className={`${OFFLINE_FRAME} flex items-center justify-center`}>
                  <Radio size={44} className="text-white/20" />
                </div>
              )
            ) : (
              <div className={`${OFFLINE_FRAME} flex items-center justify-center`}>
                <Logo size={96} />
              </div>
            )}

            <h1 className="mt-4 text-3xl md:text-5xl font-black tracking-tight leading-none">
              STREAM<br />OFFLINE
            </h1>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FullscreenMonitorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-500 text-sm">Memuat fullscreen monitor…</div>
      </div>
    }>
      <FullscreenContent />
    </Suspense>
  );
}
