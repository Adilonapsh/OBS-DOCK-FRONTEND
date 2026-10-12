'use client';
import { useEffect, useRef, useState } from 'react';
import { UserPlus, Gift, Heart } from 'lucide-react';
import type { EventItem, EventThemeProps } from './types';

const TOPO_WHITE = `url("data:image/svg+xml;utf8,<svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'><path d='M0 50 Q 20 40, 40 60 T 80 50 T 120 60' fill='none' stroke='rgba(0,0,0,0.05)' stroke-width='2'/><path d='M0 20 Q 30 10, 50 30 T 90 20 T 150 40' fill='none' stroke='rgba(0,0,0,0.05)' stroke-width='2'/></svg>")`;
const TOPO_BLACK = `url("data:image/svg+xml;utf8,<svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'><path d='M0 50 Q 20 40, 40 60 T 80 50 T 120 60' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='2'/><path d='M0 20 Q 30 10, 50 30 T 90 20 T 150 40' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='2'/></svg>")`;
const VID_FADE_SECONDS = 0.9; // video di-fade ke hitam di ujung loop biar tidak patah

function headingFor(e: EventItem): string {
  if (e.type === 'gift') {
    const g = (e.giftName || 'gift').toUpperCase();
    return (e.repeatCount || 0) > 1 ? `${g} ×${e.repeatCount}` : g;
  }
  if (e.type === 'like') return `LIKE${(e.likeCount || 0) > 1 ? ` ×${e.likeCount}` : ''}`;
  return (e.label || 'welcome').toUpperCase();
}

function subFor(e: EventItem): string {
  if (e.type === 'gift') {
    const parts = [(e.giftName || 'Gift') + ((e.repeatCount || 0) > 1 ? ` ×${e.repeatCount}` : '')];
    if (e.message) parts.push(e.message.slice(0, 40));
    return parts.join(' • ');
  }
  if (e.type === 'like') return `+${e.likeCount || 1} likes`;
  return e.label || '';
}

// Satu kartu alert = satu event, independen (step + timer + video sendiri)
function AlertCard({ item, fontFamily, onDone }: { item: EventItem; fontFamily: string; onDone: (id: string) => void }) {
  const [step, setStep] = useState(0); // 0 idle, 1 kotak, 2 melebar, 3 wipe, 4 teks, 5 exit
  const [noTrans, setNoTrans] = useState(false);
  const timers = useRef<number[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [vidDim, setVidDim] = useState(1);

  useEffect(() => () => { timers.current.forEach((t) => window.clearTimeout(t)); }, []);

  // Video di-fade ke hitam saat mau habis, balik normal saat loop restart
  const onVideoTime = () => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration) || v.duration <= 0) return;
    const remain = v.duration - v.currentTime;
    setVidDim(remain < VID_FADE_SECONDS ? Math.max(0, remain / VID_FADE_SECONDS) : 1);
  };

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => {
    // Parkir video di frame awal (pause) sejak kartu mount — preload jalan,
    // jadi pas giliran nama tinggal play dari detik 0 dengan mulus
    const pv = videoRef.current;
    if (pv) {
      try {
        pv.pause();
        pv.currentTime = 0;
      } catch { /* abaikan */ }
    }
    setVidDim(1);
    later(() => {
      setStep(1);
      later(() => setStep(2), 1000);
      later(() => setStep(3), 2600);
      later(() => {
        setStep(4);
        // Giliran nama: video mulai dari awal (sudah preload + parkir)
        const v = videoRef.current;
        if (v) {
          try {
            v.currentTime = 0;
            void v.play().catch(() => {});
          } catch { /* abaikan */ }
        }
      }, 3100);
      later(() => setStep(5), 6500);
      later(() => {
        // Reset seketika tanpa animasi mundur, lalu lepas kartu
        setNoTrans(true);
        setStep(0);
        later(() => onDone(item.id), 60);
      }, 7500);
    }, 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const heading = headingFor(item);
  const nickname = (item.nickname || '').toUpperCase();
  const sub = subFor(item);
  const Icon = item.type === 'join' ? UserPlus : item.type === 'gift' ? Gift : Heart;

  return (
    <div
      className="event-alert-theme"
      style={{
        position: 'relative',
        width: 800,
        maxWidth: '100%',
        height: 120,
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        fontFamily,
        clipPath: step >= 5 ? 'inset(0 0 0 100%)' : 'inset(0 0 0 0)',
        transition: noTrans ? 'none' : 'clip-path 0.7s cubic-bezier(0.75, 0, 0.25, 1)',
      }}
    >
      {/* Lapisan bawah (putih) */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          height: 100,
          backgroundColor: 'white',
          backgroundImage: TOPO_WHITE,
          backgroundSize: 'cover',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          width: step >= 2 ? 800 : step >= 1 ? 100 : 0,
          opacity: step >= 1 ? 1 : 0,
          transition: noTrans ? 'none' : 'width 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease',
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 0,
            color: 'black',
            opacity: step >= 1 ? 1 : 0,
            transition: noTrans ? 'none' : 'opacity 0.3s ease',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <Icon size={50} strokeWidth={2.5} />
        </div>
        <div
          style={{
            position: 'absolute',
            width: 800,
            left: 0,
            textAlign: 'center',
            fontSize: 42,
            fontWeight: 900,
            color: 'black',
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            opacity: step >= 2 ? 1 : 0,
            transform: step >= 2 ? 'translateX(0)' : 'translateX(-20px)',
            transition: noTrans ? 'none' : 'all 0.5s ease',
            zIndex: 1,
          }}
        >
          {heading}
        </div>
      </div>

      {/* Lapisan atas (hitam - wipe + video) */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          height: 100,
          backgroundColor: '#0d0d0d',
          backgroundImage: TOPO_BLACK,
          backgroundSize: 'cover',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          width: step >= 3 ? 800 : 0,
          zIndex: 10,
          transition: noTrans ? 'none' : 'width 0.7s cubic-bezier(0.75, 0, 0.25, 1)',
        }}
      >
        {/* Video background (sekali putar per alert, tanpa loop) */}
        <video
          ref={videoRef}
          onTimeUpdate={onVideoTime}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.55,
            filter: `brightness(${0.7 * vidDim}) contrast(1.1)`,
            transition: 'filter 0.25s linear',
          }}
          autoPlay
          muted
          playsInline
          preload="auto"
          src="/video/banner.mp4"
        />
        <div style={{ position: 'absolute', left: 80, top: 30, fontSize: 24, color: 'white', fontFamily: 'monospace', opacity: step >= 4 ? 1 : 0, transition: noTrans ? 'none' : 'opacity 0.5s ease' }}>✦</div>
        <div style={{ position: 'absolute', left: 30, bottom: 20, fontSize: 16, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', opacity: step >= 4 ? 1 : 0, transition: noTrans ? 'none' : 'opacity 0.5s ease' }}>+</div>
        <div style={{ position: 'absolute', left: 50, bottom: 20, fontSize: 16, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', opacity: step >= 4 ? 1 : 0, transition: noTrans ? 'none' : 'opacity 0.5s ease' }}>+</div>
        <div style={{ position: 'absolute', right: 20, top: 20, fontSize: 16, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', opacity: step >= 4 ? 1 : 0, transition: noTrans ? 'none' : 'opacity 0.5s ease' }}>+</div>
        <div style={{ position: 'absolute', right: 20, bottom: 20, fontSize: 16, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', opacity: step >= 4 ? 1 : 0, transition: noTrans ? 'none' : 'opacity 0.5s ease' }}>+</div>
        <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', opacity: step >= 4 ? 1 : 0, transition: noTrans ? 'none' : 'opacity 0.5s ease' }}>+</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '92%' }}>
          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: 'white',
              letterSpacing: 4,
              whiteSpace: 'nowrap',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              opacity: step >= 4 ? 1 : 0,
              transform: step >= 4 ? 'translateX(0)' : 'translateX(-36px)',
              transition: noTrans ? 'none' : 'opacity 0.45s ease, transform 0.55s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          >
            {nickname}
          </div>
          {sub ? (
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'white',
                letterSpacing: 2,
                marginTop: -10,
                whiteSpace: 'nowrap',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                opacity: step >= 4 ? 1 : 0,
                transition: noTrans ? 'none' : 'opacity 0.5s ease 0.1s',
              }}
            >
              {sub}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Alert — N alert berbarengan (ikut setting Max Events, maks 5), sisanya antri
export default function AlertTheme({ events, font, maxEvents = 3 }: EventThemeProps) {
  const slots = Math.max(1, Math.min(5, maxEvents || 3));
  const [active, setActive] = useState<EventItem[]>([]);
  const queue = useRef<EventItem[]>([]);
  const seen = useRef<Set<string>>(new Set());
  const activeIds = useRef<Set<string>>(new Set());

  const pump = () => {
    while (activeIds.current.size < slots && queue.current.length > 0) {
      const next = queue.current.shift();
      if (!next || activeIds.current.has(next.id)) continue;
      activeIds.current.add(next.id);
      setActive((prev) => [...prev, next]);
    }
  };

  const handleDone = (id: string) => {
    activeIds.current.delete(id);
    setActive((prev) => prev.filter((a) => a.id !== id));
    pump();
  };

  useEffect(() => {
    for (const e of events) {
      if (!seen.current.has(e.id)) {
        seen.current.add(e.id);
        queue.current.push(e);
      }
    }
    // Batasi antrian biar tidak menumpuk tak terbatas saat live ramai
    while (queue.current.length > slots * 2) queue.current.shift();
    pump();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  const ff = font && font !== 'Outfit' ? `'${font}', 'Orbitron', sans-serif` : `'Orbitron', sans-serif`;

  return (
    <div className="w-full max-w-[800px]">
      <div className="flex flex-col gap-3 items-start">
        {active.map((item) => (
          <AlertCard key={item.id} item={item} fontFamily={ff} onDone={handleDone} />
        ))}
      </div>
    </div>
  );
}
