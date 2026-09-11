'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io } from 'socket.io-client';
import { getSocketUrl } from '../../_shared/utils/socket';
import { getStringParam, getIntParam, getBoolParam } from '../../_shared/utils/url';
import { loadGoogleFont } from '../../_shared/utils/font';
import { ANIM_MAP, KEYFRAMES_CSS } from '../../_shared/constants/animations';
import { getTimerTheme } from '../themes/registry';
import { getPositionStyle } from '../../_shared/constants/positions';

function TimerInner() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const privateKey = getStringParam(params, 'key', getStringParam(params, 'privateKey', ''));
  const obsMode = searchParams.get('obs') === '1' || searchParams.get('transparent') === '1';
  const simulate = getBoolParam(params, 'simulate', false) || getBoolParam(params, 'preview', false);
  const theme = getStringParam(params, 'theme', 'focus');
  const font = getStringParam(params, 'font', 'Nunito');
  const fontSize = getIntParam(params, 'fontSize', 14);
  const accent = getStringParam(params, 'accent', '#594d4a');
  const bg = getStringParam(params, 'bg', 'transparent');
  const bgOpacity = Math.max(10, Math.min(100, getIntParam(params, 'bgOpacity', 100)));
  const focusMinutesParam = Math.max(1, Math.min(120, getIntParam(params, 'focusMinutes', 50)));
  const totalSessionsParam = Math.max(1, Math.min(10, getIntParam(params, 'totalSessions', 3)));
  const anim = getStringParam(params, 'anim', 'elegant');
  const subathonModeParam = getStringParam(params, 'subathonMode', 'powerup');
  const textColor = getStringParam(params, 'textColor', '#ffffff');
  const pos = getStringParam(params, 'pos', 'center');

  const [focusMinutes, setFocusMinutes] = useState(focusMinutesParam);
  const [totalSessions, setTotalSessions] = useState(totalSessionsParam);
  const [subathonMode, setSubathonMode] = useState(subathonModeParam);
  const [totalSeconds, setTotalSeconds] = useState(focusMinutesParam * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [currentSession, setCurrentSession] = useState(1);
  const [hasSocketTimer, setHasSocketTimer] = useState(false);
  const [addedSeconds, setAddedSeconds] = useState<number | null>(null);
  const addedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTotalRef = useRef(focusMinutesParam * 60);

  // hanya reset totalSeconds saat URL focusMinutes berubah DAN belum ada socket (awal load), bukan saat mode ganti - mode ganti harus lanjut 13:20 → 13:19
  useEffect(() => { if (!hasSocketTimer) { setTotalSeconds(focusMinutesParam * 60); setIsRunning(false); setCurrentSession(1); } }, [focusMinutesParam, hasSocketTimer]);
  // sync from URL when no socket yet - subathonMode ganti tidak reset detik, cuma ganti mode
  useEffect(() => {
    if (!hasSocketTimer) {
      // hanya update mode, jangan reset detik
      setSubathonMode(subathonModeParam);
      // focusMinutes/totalSessions hanya update jika benar-benar berubah via URL dan belum ada socket
      if (focusMinutes !== focusMinutesParam) setFocusMinutes(focusMinutesParam);
      if (totalSessions !== totalSessionsParam) setTotalSessions(totalSessionsParam);
    }
  }, [focusMinutesParam, totalSessionsParam, subathonModeParam, hasSocketTimer]);
  useEffect(() => loadGoogleFont(font, '600;700;800;900', 'timer-font'), [font]);
  useEffect(() => loadGoogleFont('Montserrat', '600;700;800;900', 'timer-font-mont'), []);

  // socket sync - Dock → Timer OBS (mirip poll/task) - pakai updatedAt biar sinkron detik, overlay 100% ikut dock
  const timerUpdateRef = useRef({ totalSeconds: focusMinutesParam * 60, updatedAt: Date.now(), isRunning: false });
  const timerSocketRef = useRef<ReturnType<typeof io> | null>(null);
  const hasSocketTimerRef = useRef(false);
  useEffect(() => { hasSocketTimerRef.current = hasSocketTimer; }, [hasSocketTimer]);
  useEffect(() => {
    if (simulate) return; // live preview simulate - 1 file untuk OBS + preview, tidak perlu socket
    const s = io(getSocketUrl(), { transports: ['websocket', 'polling'] as const });
    timerSocketRef.current = s as any;
    const room = privateKey || 'global';
    s.on('connect', () => { s.emit('join-room', room); s.emit('timer-get', { privateKey: room }); });
    s.on('timer-update', (data: { totalSeconds?: number; isRunning?: boolean; currentSession?: number; focusMinutes?: number; totalSessions?: number; mode?: string; subathonMode?: string; updatedAt?: number; addedSeconds?: number; delta?: number }) => {
      const now = Date.now();
      const updatedAt = typeof data.updatedAt === 'number' ? data.updatedAt : now;
      const base = typeof data.totalSeconds === 'number' ? data.totalSeconds : totalSeconds;
      let sec = base;
      if (data.isRunning) {
        const elapsed = Math.floor((now - updatedAt) / 1000);
        sec = Math.max(0, base - elapsed);
      }
      if (typeof data.totalSeconds === 'number') {
        // deteksi add/minus dari dock: pakai delta eksplisit jika ada, fallback diff besar
        const explicitDelta = typeof (data as any).addedSeconds === 'number' ? (data as any).addedSeconds : typeof (data as any).delta === 'number' ? (data as any).delta : null;
        const prev = prevTotalRef.current;
        const diff = sec - prev;
        const deltaToShow = explicitDelta !== null ? explicitDelta : (Math.abs(diff) >= 5 && hasSocketTimerRef.current ? diff : null);
        if (deltaToShow !== null && deltaToShow !== 0) {
          if (addedTimeoutRef.current) clearTimeout(addedTimeoutRef.current);
          setAddedSeconds(deltaToShow);
          addedTimeoutRef.current = setTimeout(() => setAddedSeconds(null), 2200);
        }
        prevTotalRef.current = sec;
        // simpan base asli, bukan live, biar tick tidak double-subtract
        timerUpdateRef.current.totalSeconds = base;
        timerUpdateRef.current.updatedAt = updatedAt;
        timerUpdateRef.current.isRunning = !!data.isRunning;
        setTotalSeconds(sec);
      }
      if (typeof data.isRunning === 'boolean') setIsRunning(data.isRunning);
      if (typeof data.currentSession === 'number') setCurrentSession(data.currentSession);
      if (typeof data.focusMinutes === 'number') setFocusMinutes(data.focusMinutes);
      if (typeof data.totalSessions === 'number') setTotalSessions(data.totalSessions);
      if (typeof data.mode === 'string') setSubathonMode(data.mode);
      if (typeof (data as unknown as { subathonMode: string }).subathonMode === 'string') setSubathonMode((data as unknown as { subathonMode: string }).subathonMode);
      setHasSocketTimer(true);
      hasSocketTimerRef.current = true;
    });
    return () => { s.disconnect(); timerSocketRef.current = null; if (addedTimeoutRef.current) clearTimeout(addedTimeoutRef.current); };
  }, [privateKey]);

  // local tick - sinkron dengan server via updatedAt, overlay 100% ikut dock jika hasSocketTimer
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      if (hasSocketTimerRef.current) {
        const elapsed = Math.floor((Date.now() - timerUpdateRef.current.updatedAt) / 1000);
        const base = timerUpdateRef.current.totalSeconds;
        const cur = Math.max(0, base - elapsed);
        setTotalSeconds(cur);
        prevTotalRef.current = cur;
        // jangan auto-next session saat sync dock - tunggu server kirim next, biar 100% sync
        return;
      }
      setTotalSeconds((prev) => {
        if (prev <= 1) {
          setCurrentSession((c) => (c < totalSessions ? c + 1 : 1));
          return focusMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, focusMinutes, totalSessions, hasSocketTimer]);

  const animName = ANIM_MAP[anim] || 'elegantIn';
  // Global position - 1 line align + justify, langsung tersimulasi di live preview
  const posStyle = getPositionStyle(pos);
  const handleAddTime = (sec: number) => {
    if (addedTimeoutRef.current) clearTimeout(addedTimeoutRef.current);
    setAddedSeconds(sec);
    addedTimeoutRef.current = setTimeout(() => setAddedSeconds(null), 2200);
    // optimistic update biar UI langsung, lalu sinkron ke server (dock master)
    setTotalSeconds((prev) => {
      const next = Math.max(0, prev + sec);
      prevTotalRef.current = next;
      // jika belum sync, update ref lokal; jika sudah sync base akan di-overwrite oleh timer-update berikutnya
      if (!hasSocketTimerRef.current) {
        timerUpdateRef.current.totalSeconds = next;
        timerUpdateRef.current.updatedAt = Date.now();
      }
      return next;
    });
    if (hasSocketTimerRef.current && timerSocketRef.current) {
      const room = privateKey || 'global';
      (timerSocketRef.current as any).emit('timer-control', { privateKey: room, action: sec >= 0 ? 'add' : 'sub', seconds: Math.abs(sec) });
    }
  };
  const themeProps = { font, fontSize, accent, bg, bgOpacity, textColor, pos, timerSeconds: totalSeconds, isRunning, currentSession, totalSessions, onToggleTimer: () => setIsRunning((v) => !v), onResetTimer: () => { setIsRunning(false); setTotalSeconds(focusMinutes * 60); }, onNextSession: () => { setCurrentSession((c) => (c < totalSessions ? c + 1 : 1)); setTotalSeconds(focusMinutes * 60); setIsRunning(false); }, onAddTime: handleAddTime, anim: animName, subathonMode, addedSeconds } as const;
  const Theme = getTimerTheme(theme);
  // subathonMode sengaja tidak dimasukkan ke displayKey - mode diubah dari dock tidak boleh
  // menyebabkan Theme remount (yang akan memicu ulang animasi entry dan membuat timer tampak reset)
  const displayKey = `${theme}-${accent}-${bg}-${textColor}-${bgOpacity}-${font}-${anim}-${pos}`;

  return (
    <>
      {obsMode && !simulate && <style dangerouslySetInnerHTML={{ __html: `html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100vw!important;height:100vh!important;background:transparent!important} *{box-sizing:border-box}` }} />}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g,'+')}:wght@600;700;800;900&family=Montserrat:wght@600;700;800;900&display=swap'); ${KEYFRAMES_CSS} html,body{ background: ${obsMode && !simulate ? 'transparent !important' : '#e6c8bf'}; }`}</style>
      <div className={`${obsMode && !simulate ? `fixed inset-0 w-screen h-screen bg-transparent overflow-hidden flex p-4` : `w-full min-h-screen flex p-6 relative`}`} style={{ ...posStyle, background: obsMode && !simulate ? 'transparent' : theme === 'subathon' ? '#abb3f8' : theme === 'glass' ? 'linear-gradient(135deg, #a5b4fc 0%, #bac7ff 100%)' : 'linear-gradient(135deg, #eacbc2 0%, #dfb8ad 100%)' } as any}>
        <div className="flex flex-col items-center gap-4">
          <Theme key={displayKey} {...themeProps} />
          {simulate && (
            <div className="flex items-center gap-2">
              <button onClick={() => setIsRunning((v) => !v)} className="h-7 px-3 bg-white text-black rounded-full text-[10px] font-black uppercase shadow">{isRunning ? 'Pause' : 'Play'}</button>
              <button onClick={() => { setIsRunning(false); setTotalSeconds(focusMinutes * 60); setCurrentSession(1); }} className="h-7 px-3 bg-white/10 border border-white/10 rounded-full text-white text-[10px] font-black uppercase">Reset</button>
              <span className="text-[10px] font-mono text-white/60 ml-2">SIMULATE • {String(theme).toUpperCase()} • {focusMinutes}m</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function TimerDisplayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#e6c8bf] grid place-items-center text-white/60 text-sm">Loading timer…</div>}>
      <TimerInner />
    </Suspense>
  );
}
