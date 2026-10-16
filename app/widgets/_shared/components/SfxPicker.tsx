'use client';

import { useEffect, useRef, useState } from 'react';
import { Link2, Upload, Cloud, Play, Square, Check, Loader2, Search, Trash2 } from 'lucide-react';
import { getSocketUrl } from '../utils/socket';

export type SfxCloudItem = { slug: string; title: string; url: string };

type SfxPickerProps = {
  /** URL suara saat ini (link http(s), data:audio, atau {backend}/sfx/clip/...) */
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  /** Default: getSocketUrl() (env NEXT_PUBLIC_BACKEND_URL → localhost:3000) */
  backendUrl?: string;
  /** Batas file upload lokal (default 700 KB- tersimpan inline base64 di settings + URL OBS) */
  maxUploadBytes?: number;
};

type Tab = 'link' | 'upload' | 'cloud';

function detectTab(v: string): Tab {
  if (v.startsWith('data:audio')) return 'upload';
  if (v.includes('/sfx/clip/')) return 'cloud';
  return 'link';
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.floor((b64.length * 3) / 4);
}

/**
 * SfxPicker- pemilih sumber suara reusable untuk semua widget.
 * 3 sumber: Link URL langsung | Upload file lokal (inline base64) | Cloud
 * (katalog myinstants via backend /sfx/browse, di-cache lazy di disk streamer
 * dan diserve dari backend lokal supaya trigger tanpa latency).
 */
export function SfxPicker({ value, onChange, placeholder, backendUrl, maxUploadBytes = 700 * 1024 }: SfxPickerProps) {
  const backend = (backendUrl || getSocketUrl()).replace(/\/$/, '');
  const [tab, setTab] = useState<Tab>(() => detectTab(value || ''));
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<SfxCloudItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cloudError, setCloudError] = useState('');
  const [cloudReady, setCloudReady] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => () => { audioRef.current?.pause(); audioRef.current = null; }, []);

  const stopAudio = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(null);
  };

  const previewUrl = (url: string) => {
    if (!url) return;
    if (playing === url) {
      stopAudio();
      return;
    }
    stopAudio();
    const a = new Audio(url);
    audioRef.current = a;
    setPlaying(url);
    a.onended = () => setPlaying(null);
    a.play().catch(() => setPlaying(null));
  };

  const fetchBrowse = async (query: string, pg: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else {
      setLoading(true);
      setCloudError('');
    }
    try {
      const res = await fetch(`${backend}/sfx/browse?q=${encodeURIComponent(query)}&page=${pg}&region=id`);
      const data = (await res.json()) as { ok?: boolean; items?: SfxCloudItem[]; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setItems((prev) => (append ? [...prev, ...(data.items || [])] : data.items || []));
      setPage(pg);
      setCloudReady(true);
    } catch (e) {
      if (!append) setCloudError(e instanceof Error ? e.message : 'gagal memuat katalog');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Muat trending saat tab cloud pertama dibuka (jadi user langsung bisa pilih)
  useEffect(() => {
    if (tab === 'cloud' && !cloudReady && !loading && !cloudError) fetchBrowse('', 1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const onPickFile = (f: File | undefined) => {
    setUploadError('');
    if (!f) return;
    if (!f.type.startsWith('audio/')) {
      setUploadError('File harus audio (mp3/wav/ogg).');
      return;
    }
    if (f.size > maxUploadBytes) {
      setUploadError(`File ${formatBytes(f.size)} melebihi batas ${formatBytes(maxUploadBytes)}- pakai Cloud / Link untuk file besar.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl.startsWith('data:audio')) {
        setUploadError('Gagal membaca file audio.');
        return;
      }
      onChange(dataUrl);
    };
    reader.onerror = () => setUploadError('Gagal membaca file.');
    reader.readAsDataURL(f);
  };

  const isDataUrl = value.startsWith('data:audio');
  const tabBtn = (t: Tab, icon: React.ReactNode, label: string) => (
    <button
      key={t}
      onClick={() => setTab(t)}
      className={`flex-1 h-7 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-colors ${tab === t ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="space-y-2">
      <div className="flex gap-1 p-1 bg-black/30 border border-white/10 rounded-xl">
        {tabBtn('link', <Link2 className="w-3 h-3" />, 'Link')}
        {tabBtn('upload', <Upload className="w-3 h-3" />, 'Upload')}
        {tabBtn('cloud', <Cloud className="w-3 h-3" />, 'Cloud')}
      </div>

      {tab === 'link' && (
        <div className="flex gap-1.5">
          <input
            value={isDataUrl ? '' : value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || 'https://.../sound.mp3'}
            className="flex-1 min-w-0 h-8 bg-black/40 border border-white/10 rounded-xl px-2 text-[11px] font-mono text-white placeholder:text-gray-500"
          />
          {!!value && !isDataUrl && (
            <button
              onClick={() => previewUrl(value)}
              aria-label="Preview suara"
              className="w-8 h-8 shrink-0 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white flex items-center justify-center"
            >
              {playing === value ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
          )}
        </div>
      )}

      {tab === 'upload' && (
        <div className="space-y-1.5">
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              onPickFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          {isDataUrl ? (
            <div className="flex items-center gap-1.5 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="flex-1 min-w-0 text-[10px] font-bold text-emerald-200 truncate">
                File lokal terpasang • {formatBytes(dataUrlBytes(value))} inline
              </span>
              <button
                onClick={() => previewUrl(value)}
                aria-label="Preview suara"
                className="w-7 h-7 shrink-0 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white flex items-center justify-center"
              >
                {playing === value ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
              <button
                onClick={() => {
                  stopAudio();
                  onChange('');
                }}
                aria-label="Hapus file lokal"
                className="w-7 h-7 shrink-0 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-lg text-gray-400 hover:text-red-300 flex items-center justify-center"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-9 border border-dashed border-white/15 hover:border-white/30 hover:bg-white/5 rounded-xl text-[11px] font-bold text-gray-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" /> Pilih file mp3 / wav / ogg
            </button>
          )}
          {isDataUrl && (
            <button onClick={() => fileRef.current?.click()} className="text-[10px] font-bold text-gray-500 hover:text-gray-300">
              Ganti file…
            </button>
          )}
          {uploadError && <div className="text-[10px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1.5">{uploadError}</div>}
          <div className="text-[10px] text-gray-500">Maks {formatBytes(maxUploadBytes)}- file disimpan inline di settings & URL OBS.</div>
        </div>
      )}

      {tab === 'cloud' && (
        <div className="space-y-1.5">
          <div className="flex gap-1.5">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') fetchBrowse(q.trim(), 1, false);
              }}
              placeholder="Cari suara… (kosong = trending 🇮🇩)"
              className="flex-1 min-w-0 h-8 bg-black/40 border border-white/10 rounded-xl px-2 text-[11px] text-white placeholder:text-gray-500"
            />
            <button
              onClick={() => fetchBrowse(q.trim(), 1, false)}
              aria-label="Cari"
              className="w-8 h-8 shrink-0 bg-white text-black hover:bg-zinc-200 rounded-xl flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            </button>
          </div>
          {cloudError && (
            <div className="text-[10px] leading-relaxed text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1.5">
              Backend SFX tidak terjangkau ({cloudError}). Pastikan backend jalan
              (<span className="font-mono">{backend}</span>) lalu{' '}
              <button onClick={() => fetchBrowse(q.trim(), 1, false)} className="font-black underline">
                coba lagi
              </button>
              .
            </div>
          )}
          {loading && items.length === 0 && (
            <div className="flex items-center justify-center gap-1.5 py-3 text-[11px] text-gray-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memuat katalog…
            </div>
          )}
          {items.length > 0 && (
            <div className="max-h-44 overflow-y-auto custom-scrollbar space-y-1 pr-0.5">
              {items.map((it) => {
                const clipUrl = `${backend}${it.url}`;
                const selected = value === clipUrl;
                const isPlaying = playing === clipUrl;
                return (
                  <div
                    key={it.slug}
                    className={`flex items-center gap-1.5 p-1.5 rounded-xl border transition-colors ${selected ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-black/30 border-white/5 hover:border-white/15'
                      }`}
                  >
                    <button
                      onClick={() => previewUrl(clipUrl)}
                      aria-label={isPlaying ? 'Stop preview' : `Preview ${it.title}`}
                      className="w-7 h-7 shrink-0 bg-white/5 hover:bg-white/15 border border-white/10 rounded-lg text-white flex items-center justify-center"
                    >
                      {isPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </button>
                    <span className="flex-1 min-w-0 text-[11px] font-bold text-white truncate" title={it.title}>
                      {it.title}
                    </span>
                    <button
                      onClick={() => {
                        stopAudio();
                        onChange(clipUrl);
                      }}
                      className={`h-7 px-2.5 shrink-0 rounded-lg text-[10px] font-black uppercase ${selected ? 'bg-emerald-500 text-black' : 'bg-white text-black hover:bg-zinc-200'
                        }`}
                    >
                      {selected ? 'Dipakai' : 'Pilih'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {!loading && cloudReady && items.length === 0 && !cloudError && (
            <div className="text-[11px] text-gray-500 text-center py-2">Tidak ketemu- coba kata kunci lain.</div>
          )}
          {items.length > 0 && (
            <button
              onClick={() => fetchBrowse(q.trim(), page + 1, true)}
              disabled={loadingMore}
              className="w-full h-7 text-[10px] font-black uppercase text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loadingMore && <Loader2 className="w-3 h-3 animate-spin" />} Muat lagi
            </button>
          )}
          <div className="text-[10px] text-gray-500">Klip terpilih di-cache di PC streamer & diserve lokal- tanpa delay saat live.</div>
        </div>
      )}
    </div>
  );
}
