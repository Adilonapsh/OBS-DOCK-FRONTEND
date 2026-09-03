'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import StandardTheme from '../themes/Standard';
import MatteTheme from '../themes/Matte';
import MatteDarkTheme from '../themes/MatteDark';
import CompactTheme from '../themes/Compact';
import CompactInvertedTheme from '../themes/CompactInverted';
import SimpleTheme from '../themes/Simple';
import ClassicTheme from '../themes/Classic';
import CardTheme from '../themes/Card';
import AlbumArtTheme from '../themes/AlbumArt';
import VinylTheme from '../themes/Vinyl';
import ColorPaletteTheme from '../themes/ColorPalette';
import type { AccentPalette, LyricLine } from '../themes/types';

const PlaybackStatus = {
  CLOSED: 0, OPENED: 1, CHANGING: 2, STOPPED: 3, PLAYING: 4, PAUSED: 5
} as const;

const vibrantDefaults: AccentPalette = {
  Vibrant: '#FE2C55', Muted: '#6b7280', DarkVibrant: '#1d1d1d', DarkMuted: '#111827', LightVibrant: '#FE2C55', LightMuted: '#e5e7eb'
};

function getIntParam(params: URLSearchParams, key: string, fallback: number): number {
  const v = params.get(key); if (v === null || v === '') return fallback; const n = parseInt(v, 10); return isNaN(n) ? fallback : n;
}
function getBoolParam(params: URLSearchParams, key: string, fallback: boolean): boolean {
  const v = params.get(key); if (v === null) return fallback; return v === 'true' || v === '1';
}
function msToTime(ms: number): string {
  if (!ms || ms < 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60); const s = totalSec % 60;
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}:${String(m % 60).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

async function getVibrantPalette(src: string): Promise<AccentPalette> {
  if (!src || src.includes('placeholder.com') || src === './images/placeholder.png') return vibrantDefaults;
  try {
    const mod: any = await import('node-vibrant/browser');
    const Vibrant = mod.Vibrant || mod.default;
    const builder = Vibrant.from(src);
    if (builder.maxDimension) builder.maxDimension(200);
    const palette = await builder.getPalette();
    const pick = (k: string, fallback: string) => palette[k]?.hex || fallback;
    return {
      Vibrant: pick('Vibrant', vibrantDefaults.Vibrant),
      Muted: pick('Muted', vibrantDefaults.Muted),
      DarkVibrant: pick('DarkVibrant', vibrantDefaults.DarkVibrant),
      DarkMuted: pick('DarkMuted', vibrantDefaults.DarkMuted),
      LightVibrant: pick('LightVibrant', vibrantDefaults.LightVibrant),
      LightMuted: pick('LightMuted', vibrantDefaults.LightMuted),
    };
  } catch { return vibrantDefaults; }
}

function parseLRC(lrc: string): LyricLine[] {
  if (!lrc) return [];
  const lines = lrc.split('\n');
  const result: LyricLine[] = [];
  const timeRe = /\[(\d+):(\d+)(?:\.(\d+))?\]/g;
  for (const line of lines) {
    const times: number[] = [];
    let m: RegExpExecArray | null;
    // reset regex
    timeRe.lastIndex = 0;
    while ((m = timeRe.exec(line)) !== null) {
      const min = parseInt(m[1], 10);
      const sec = parseInt(m[2], 10);
      const msPart = m[3] ? m[3].padEnd(3, '0').slice(0, 3) : '0';
      const ms = parseInt(msPart, 10);
      times.push(min * 60 * 1000 + sec * 1000 + ms);
    }
    const text = line.replace(/\[.*?\]/g, '').trim();
    if (times.length === 0) continue;
    for (const t of times) result.push({ timeMs: t, text });
  }
  result.sort((a, b) => a.timeMs - b.timeMs);
  return result;
}

async function fetchLyrics(artist: string, track: string): Promise<{ synced: LyricLine[]; plain: string }> {
  if (!artist && !track) return { synced: [], plain: '' };
  // try lrclib get
  try {
    const qs = new URLSearchParams({ artist_name: artist || '', track_name: track || '' });
    // lrclib has CORS enabled
    const res = await fetch(`https://lrclib.net/api/get?${qs.toString()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && (data.syncedLyrics || data.plainLyrics)) {
        const synced = parseLRC(data.syncedLyrics || '');
        return { synced, plain: data.plainLyrics || '' };
      }
    }
  } catch {}
  // fallback search
  try {
    const qs2 = new URLSearchParams({ track_name: track || '', artist_name: artist || '' });
    const res2 = await fetch(`https://lrclib.net/api/search?${qs2.toString()}`, { cache: 'no-store' });
    if (res2.ok) {
      const arr = await res2.json();
      if (Array.isArray(arr) && arr.length > 0) {
        const best = arr[0];
        const synced = parseLRC(best.syncedLyrics || '');
        return { synced, plain: best.plainLyrics || '' };
      }
    }
  } catch {}
  return { synced: [], plain: '' };
}

function LyricsDisplayInner() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());

  const theme = params.get('theme') || 'standard';
  const font = params.get('font') || 'Outfit';
  const fontSize = getIntParam(params, 'fontSize', 20);
  const maxWidth = getIntParam(params, 'maxWidth', 560);
  const verticalAlignment = params.get('verticalAlignment') || 'align-to-center';
  const textAlignment = params.get('textAlignment') || 'left';
  const useCustomColors = getBoolParam(params, 'useCustomColors', false);
  const color1 = params.get('color1') || '#ffffff';
  const color2 = params.get('color2') || '#1d1d1d';
  const autoHide = getBoolParam(params, 'autoHide', false);
  const showWhilePaused = getBoolParam(params, 'showWhilePaused', true);
  const includedApplications = params.get('includedApplications') || '';
  const excludedApplications = params.get('excludedApplications') || '';
  const showAlbumArt = getBoolParam(params, 'showAlbumArt', true);
  const showProgressBar = getBoolParam(params, 'showProgressBar', true);
  const swapArtistTrack = getBoolParam(params, 'swapArtistTrack', false);
  const showPrimary = getBoolParam(params, 'showPrimary', true);
  const showSecondary = getBoolParam(params, 'showSecondary', true);
  const displayDuration = getIntParam(params, 'displayDuration', 5);
  const showAnimation = params.get('showAnimation') || 'slide-in-from-bottom';
  const hideAnimation = params.get('hideAnimation') || 'slide-out-bottom';
  const smtcBridgeAddress = params.get('smtcBridgeAddress') || '127.0.0.1';
  const smtcBridgePort = params.get('smtcBridgePort') || '5000';
  const obsMode = params.get('obs') === '1';
  // lyrics specific
  const showLyrics = getBoolParam(params, 'showLyrics', true);
  const lyricsAlign = params.get('lyricsAlign') || textAlignment;
  const lyricsFontSize = getIntParam(params, 'lyricsFontSize', 16);
  const maxLyricsLines = getIntParam(params, 'maxLyricsLines', 3);
  const lrclibEnabled = getBoolParam(params, 'lrclibEnabled', true);

  const PLACEHOLDER = 'https://via.placeholder.com/300/1d1d1d/ffffff?text=%E2%99%AA';
  const [track, setTrack] = useState('');
  const [artist, setArtist] = useState('');
  const [art, setArt] = useState<string>(PLACEHOLDER);
  const [bgArt, setBgArt] = useState<string>(PLACEHOLDER);
  const [palette, setPalette] = useState<AccentPalette>(vibrantDefaults);
  const [visible, setVisible] = useState(true);
  const [animClass, setAnimClass] = useState<string>(showAnimation);
  const [playbackStatus, setPlaybackStatus] = useState<number>(PlaybackStatus.PLAYING);
  const [timeline, setTimeline] = useState<{ Position: number; EndTime: number; LastUpdatedTime: string } | null>(null);
  const [currentPos, setCurrentPos] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isPausedOverlay, setIsPausedOverlay] = useState(false);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [plainLyrics, setPlainLyrics] = useState<string>('');
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [lyricsStatus, setLyricsStatus] = useState<string>('');

  const currentSongKeyRef = useRef<string>('');
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setVisibility = (v: boolean) => {
    if (hideTimeoutRef.current) { clearTimeout(hideTimeoutRef.current); hideTimeoutRef.current = null; }
    if (v) {
      setAnimClass(showAnimation);
      setVisible(true);
      if (autoHide) {
        hideTimeoutRef.current = setTimeout(() => setVisibility(false), displayDuration * 1000);
      }
    } else {
      setAnimClass(hideAnimation);
      setTimeout(() => setVisible(false), 500);
    }
  };

  // tick progress
  useEffect(() => {
    if (!timeline) return;
    const interval = setInterval(() => {
      if (playbackStatus !== PlaybackStatus.PLAYING) return;
      const anchor = Date.parse(timeline.LastUpdatedTime.replace(' ', 'T'));
      const drift = Date.now() - anchor;
      const pos = timeline.EndTime > 0 ? timeline.Position + drift : timeline.Position;
      setCurrentPos(Math.min(pos, timeline.EndTime));
    }, 200);
    return () => clearInterval(interval);
  }, [timeline, playbackStatus]);

  // update active lyric index based on currentPos
  useEffect(() => {
    if (!lyrics.length) { setActiveIndex(-1); return; }
    let idx = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].timeMs <= currentPos) idx = i;
      else break;
    }
    setActiveIndex(idx);
  }, [currentPos, lyrics]);

  // fetch loop
  useEffect(() => {
    let cancelled = false;
    const fetchOnce = async () => {
      try {
        const res = await fetch(`http://${smtcBridgeAddress}:${smtcBridgePort}/now-playing`, { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;
        if (data.error) { setError(data.error); return; }
        setError(null);

        const incList = includedApplications ? includedApplications.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [];
        const excList = excludedApplications ? excludedApplications.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [];
        const validSessions: any[] = (data.sessions || []).filter((s: any) => {
          const appId = (s.source_app_id || '').toLowerCase();
          return !excList.some(ex => appId.includes(ex));
        });
        let target: any = null;
        if (incList.length > 0) {
          for (const targetApp of incList) {
            target = validSessions.find(s => {
              const matches = (s.source_app_id || '').toLowerCase().includes(targetApp);
              const isPlaying = s.playback_info && (s.playback_info.PlaybackStatus === PlaybackStatus.PLAYING || (showWhilePaused && s.playback_info.PlaybackStatus === PlaybackStatus.PAUSED));
              return matches && isPlaying;
            });
            if (target) break;
          }
          if (!target) {
            for (const app of incList) {
              target = validSessions.find(s => (s.source_app_id || '').toLowerCase().includes(app));
              if (target) break;
            }
          }
        } else {
          if (data.current_session_id) target = validSessions.find(s => s.source_app_id === data.current_session_id);
          if (!target || target.playback_info?.PlaybackStatus !== PlaybackStatus.PLAYING) {
            const playing = validSessions.find(s => s.playback_info && (s.playback_info.PlaybackStatus === PlaybackStatus.PLAYING || (showWhilePaused && s.playback_info.PlaybackStatus === PlaybackStatus.PAUSED)));
            if (playing) target = playing;
          }
          if (!target && validSessions.length > 0) target = validSessions[0];
        }

        if (target) {
          const pInfo = target.playback_info; const mProps = target.media_properties; const tProps = target.timeline_properties;
          if (pInfo.PlaybackStatus !== playbackStatus) {
            if (pInfo.PlaybackStatus === PlaybackStatus.PLAYING || (showWhilePaused && pInfo.PlaybackStatus === PlaybackStatus.PAUSED)) setVisibility(true);
            else setVisibility(false);
            setPlaybackStatus(pInfo.PlaybackStatus);
            setIsPausedOverlay(pInfo.PlaybackStatus === PlaybackStatus.PAUSED);
          }
          if (pInfo.PlaybackStatus === PlaybackStatus.PLAYING || (showWhilePaused && pInfo.PlaybackStatus === PlaybackStatus.PAUSED)) {
            const newKey = `${mProps.Title}-${mProps.Artist}-${mProps.Thumbnail}`;
            if (newKey !== currentSongKeyRef.current) {
              const newArt = mProps.Thumbnail || PLACEHOLDER;
              const pal = await getVibrantPalette(newArt);
              if (cancelled) return;
              setPalette(pal);
              setTrack(swapArtistTrack ? (mProps.Artist || '') : (mProps.Title || ''));
              setArtist(swapArtistTrack ? (mProps.Title || '') : (mProps.Artist || ''));
              setArt(newArt);
              setBgArt(newArt);
              currentSongKeyRef.current = newKey;
              setVisibility(true);
              // fetch lyrics for new track
              if (lrclibEnabled && mProps.Title && mProps.Artist) {
                setLyricsStatus('loading lyrics…');
                const artName = swapArtistTrack ? (mProps.Title || '') : (mProps.Artist || '');
                const trName = swapArtistTrack ? (mProps.Artist || '') : (mProps.Title || '');
                const resLyrics = await fetchLyrics(artName, trName);
                if (cancelled) return;
                setLyrics(resLyrics.synced);
                setPlainLyrics(resLyrics.plain);
                setActiveIndex(-1);
                setLyricsStatus(resLyrics.synced.length ? `${resLyrics.synced.length} lines` : resLyrics.plain ? 'plain only' : 'no lyrics');
              } else {
                setLyrics([]); setPlainLyrics(''); setLyricsStatus('');
              }
            }
          }
          if (tProps) {
            setTimeline(tProps);
            const anchor = Date.parse(tProps.LastUpdatedTime.replace(' ', 'T'));
            const drift = Date.now() - anchor;
            const isPlaying = pInfo.PlaybackStatus === PlaybackStatus.PLAYING;
            const pos = isPlaying && tProps.EndTime > 0 ? tProps.Position + drift : tProps.Position;
            setCurrentPos(pos);
          }
        } else {
          setVisibility(false);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to connect to SMTC Bridge');
      }
    };
    fetchOnce();
    const id = setInterval(fetchOnce, 1000);
    return () => { cancelled = true; clearInterval(id); if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [smtcBridgeAddress, smtcBridgePort, includedApplications, excludedApplications, showWhilePaused, swapArtistTrack, autoHide, displayDuration, lrclibEnabled]);

  // Force html/body transparent when obs=1 - fix OBS black bg (globals.css body { background: var(--background:#0a0a0a) })
  useEffect(() => {
    if (!obsMode) return;
    const style = document.createElement('style');
    style.setAttribute('data-obs-transparent','true');
    style.textContent = `html,body{background:transparent !important;--background:transparent !important} body{background:transparent !important} #lyrics-root{background:transparent !important}`;
    document.head.appendChild(style);
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
    return () => { style.remove(); document.documentElement.style.background=''; document.body.style.background=''; };
  }, [obsMode]);

  // demo fallback when no SMTC (for preview) - use dummy lyrics
  useEffect(() => {
    if (track || artist || lyrics.length || plainLyrics || error) return;
    // show demo after 2s if still empty
    const t = setTimeout(() => {
      if (currentSongKeyRef.current) return;
      setTrack('Demo Track - Lyrics Preview');
      setArtist('Preview Artist');
      setArt(PLACEHOLDER);
      setBgArt(PLACEHOLDER);
      const demoLrc = `[00:00.00] ♪ intro ♪\n[00:03.00] Baris pertama lirik demo\n[00:06.50] Baris kedua - highlight akan pindah\n[00:10.00] Baris ketiga synced\n[00:14.00] Baris keempat karaoke style\n[00:18.00] Akhir lirik demo ♪`;
      const parsed = parseLRC(demoLrc);
      setLyrics(parsed);
      setPlainLyrics('');
      setLyricsStatus('demo');
      // simulate timeline progression for demo
      setTimeline({ Position: 0, EndTime: 20000, LastUpdatedTime: new Date().toISOString().replace('T',' ').slice(0,19) } as any);
      let pos = 0;
      const demoInterval = setInterval(() => { pos += 200; setCurrentPos(pos % 20000); }, 200);
      // don't clean demo interval if real data arrives? keep simple
      return () => clearInterval(demoInterval);
    }, 2000);
    return () => clearTimeout(t);
  }, [track, artist, lyrics, plainLyrics, error]);

  const progressPercent = (() => {
    if (!timeline || !timeline.EndTime) return 0;
    return Math.min(100, Math.max(0, (currentPos / timeline.EndTime) * 100));
  })();

  const primaryText = track;
  const secondaryText = artist;

  const containerStyle: React.CSSProperties = {
    fontFamily: font ? `'${font}', Inter, sans-serif` : undefined,
    fontSize: `${fontSize}px`,
    maxWidth: maxWidth > 0 ? `${maxWidth}px` : '100%',
    textAlign: textAlignment as any,
    // @ts-ignore
    '--show-album-art': showAlbumArt ? '' : 'none',
  } as any;

  const alignmentCls = verticalAlignment === 'align-to-top' ? 'items-start' : verticalAlignment === 'align-to-bottom' ? 'items-end' : 'items-center';
  const textAlignCls = textAlignment === 'center' ? 'text-center' : textAlignment === 'right' ? 'text-right' : 'text-left';

  const bgColor = useCustomColors ? color2 : palette.DarkMuted;
  const accent = useCustomColors ? color1 : palette.LightVibrant;
  const textColor = useCustomColors ? color1 : '#ffffff';

  const wrapperVisible = visible || !autoHide || showWhilePaused;
  const themeWrapper = `theme-${theme}`;

  return (
    <>
      {obsMode && <style>{`html,body{background:transparent !important;--background:transparent !important}`}</style>}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;800&display=swap');
        html,body{${obsMode ? 'background:transparent !important;' : ''}}
        #lyrics-root { --accent: ${accent}; --bg: ${bgColor}; --text: ${textColor}; }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
        @keyframes fade-out { from{opacity:1} to{opacity:0} }
        @keyframes slide-in-from-top { from{transform:translateY(-20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes slide-in-from-bottom { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes slide-in-from-left { from{transform:translateX(-20px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes slide-in-from-right { from{transform:translateX(20px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes slide-out-top { to{transform:translateY(-20px);opacity:0} }
        @keyframes slide-out-bottom { to{transform:translateY(20px);opacity:0} }
        @keyframes slide-out-left { to{transform:translateX(-20px);opacity:0} }
        @keyframes slide-out-right { to{transform:translateX(20px);opacity:0} }
        .anim-fade-in { animation: fade-in 0.5s ease forwards }
        .anim-fade-out { animation: fade-out 0.5s ease forwards }
        .anim-slide-in-from-top { animation: slide-in-from-top 0.5s ease forwards }
        .anim-slide-in-from-bottom { animation: slide-in-from-bottom 0.5s ease forwards }
        .anim-slide-in-from-left { animation: slide-in-from-left 0.5s ease forwards }
        .anim-slide-in-from-right { animation: slide-in-from-right 0.5s ease forwards }
        .anim-slide-out-top { animation: slide-out-top 0.5s ease forwards }
        .anim-slide-out-bottom { animation: slide-out-bottom 0.5s ease forwards }
        .anim-slide-out-left { animation: slide-out-left 0.5s ease forwards }
        .anim-slide-out-right { animation: slide-out-right 0.5s ease forwards }
      `}</style>
      <div id="lyrics-root" className={`min-h-screen w-screen flex ${alignmentCls} justify-center p-4 ${obsMode ? 'bg-transparent !bg-transparent' : 'bg-[#0a0a0a]'}`} style={{ fontFamily: font ? `'${font}'` : undefined, background: obsMode ? 'transparent' : undefined }}>
        <div id="main-container" className={`flex w-full ${alignmentCls} ${themeWrapper}`} style={{ maxWidth: maxWidth > 0 ? `${maxWidth}px` : '100%' }}>
          <div id="main-wrapper" className={`relative w-full overflow-hidden ${wrapperVisible ? '' : 'opacity-0 pointer-events-none'} ${'anim-' + animClass}`} style={containerStyle}>
            {(() => {
              const themeProps = {
                track: primaryText, artist: secondaryText, art, bgArt, palette, accent, bgColor, textColor,
                progressPercent, currentPos, timeline, showAlbumArt, showProgressBar, showPrimary, showSecondary,
                isPausedOverlay, playbackStatus, textAlignCls, msToTime, error, smtcBridgeAddress, smtcBridgePort, obsMode,
                lyrics, activeIndex, plainLyrics, lyricsAlign, lyricsFontSize, showLyrics, maxLyricsLines,
              };
              switch (theme) {
                case 'matte': return <MatteTheme {...themeProps} />;
                case 'matte-dark': return <MatteDarkTheme {...themeProps} />;
                case 'compact': return <CompactTheme {...themeProps} />;
                case 'compact-inverted': return <CompactInvertedTheme {...themeProps} />;
                case 'simple': return <SimpleTheme {...themeProps} />;
                case 'classic': return <ClassicTheme {...themeProps} />;
                case 'card': return <CardTheme {...themeProps} />;
                case 'album-art': return <AlbumArtTheme {...themeProps} />;
                case 'vinyl': return <VinylTheme {...themeProps} />;
                case 'color-palette': return <ColorPaletteTheme {...themeProps} />;
                case 'standard':
                default: return <StandardTheme {...themeProps} />;
              }
            })()}
            {!obsMode && error && (
              <div className="mt-2 text-xs bg-red-900/50 border border-red-500/30 text-red-200 rounded-xl p-3">
                <div className="font-bold">SMTC Bridge Error</div>
                <div className="opacity-80">{error}</div>
                <div className="mt-1 text-[10px] opacity-60">Pastikan SMTC Bridge running di {smtcBridgeAddress}:{smtcBridgePort} • <a href={`http://${smtcBridgeAddress}:${smtcBridgePort}/now-playing`} target="_blank" className="underline">Test /now-playing</a> • <a href="https://github.com/nuttylmao/smtc-bridge/releases" target="_blank" className="underline">Download</a></div>
              </div>
            )}
            {!obsMode && !error && lrclibEnabled && lyricsStatus && (
              <></>
              // <div className="mt-1 text-[10px] font-mono text-white/30 text-center">LRCLIB: {lyricsStatus} • {lyrics.length ? `${activeIndex+1}/${lyrics.length}` : ''}</div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } } .spinning{ animation: spin 8s linear infinite }`}</style>
    </>
  );
}

export default function LyricsDisplayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-transparent grid place-items-center text-white">Loading...</div>}>
      <LyricsDisplayInner />
    </Suspense>
  );
}
