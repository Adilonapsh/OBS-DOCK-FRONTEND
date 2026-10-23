'use client';
import { useEffect, useRef, useState } from 'react';
import { UserPlus } from 'lucide-react';
import type { FollowItem, FollowThemeProps } from './types';

const TOPO_WHITE = `url("data:image/svg+xml;utf8,<svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'><path d='M0 50 Q 20 40, 40 60 T 80 50 T 120 60' fill='none' stroke='rgba(0,0,0,0.05)' stroke-width='2'/><path d='M0 20 Q 30 10, 50 30 T 90 20 T 150 40' fill='none' stroke='rgba(0,0,0,0.05)' stroke-width='2'/></svg>")`;
const TOPO_BLACK = `url("data:image/svg+xml;utf8,<svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'><path d='M0 50 Q 20 40, 40 60 T 80 50 T 120 60' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='2'/><path d='M0 20 Q 30 10, 50 30 T 90 20 T 150 40' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='2'/></svg>")`;
const VID_FADE_SECONDS = 0.9; // video di-fade ke hitam di ujung loop biar tidak patah

// Alert- notifikasi gaya Twitch ala referensi: kotak putih mengembang,
// wipe hitam menyapu, nama follower muncul, lalu exit. Satu alert per satu
// follow, sisanya antri. Teks heading ikut label event (subscribed/new member/…).
export default function AlertTheme({ follows, font, maxFollows = 6 }: FollowThemeProps) {
  const [current, setCurrent] = useState<FollowItem | null>(null);
  const [step, setStep] = useState(0); // 0 idle, 1 kotak, 2 melebar, 3 wipe, 4 teks, 5 exit
  const [noTrans, setNoTrans] = useState(false);
  const queue = useRef<FollowItem[]>([]);
  const seen = useRef<Set<string>>(new Set());
  const timers = useRef<number[]>([]);
  const busy = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [vidDim, setVidDim] = useState(1);

  // Video di-fade ke hitam saat mau habis, balik normal saat loop restart
  const onVideoTime = () => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration) || v.duration <= 0) return;
    const remain = v.duration - v.currentTime;
    setVidDim(remain < VID_FADE_SECONDS ? Math.max(0, remain / VID_FADE_SECONDS) : 1);
  };

  useEffect(() => () => { timers.current.forEach((t) => window.clearTimeout(t)); }, []);

  // Parkir video sejak mount (jangan autoplay tak terlihat)
  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      try { v.pause(); v.currentTime = 0; } catch { /* abaikan */ }
    }
  }, []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const pump = () => {
    if (busy.current) return;
    const next = queue.current.shift();
    if (!next) return;
    busy.current = true;
    setCurrent(next);
    setNoTrans(false);
    setStep(0);
    // Parkir video di frame awal (pause) sejak alert dimulai,
    // supaya pas giliran nama tinggal play dari detik 0 tanpa balapan seek
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
        // Giliran nama: video mulai dari awal
        const v = videoRef.current;
        if (v) {
          try {
            v.currentTime = 0;
            void v.play().catch(() => { });
          } catch { /* abaikan */ }
        }
      }, 3100);
      later(() => setStep(5), 6500);
      later(() => {
        // Reset seketika tanpa animasi mundur
        setNoTrans(true);
        setStep(0);
        later(() => {
          setNoTrans(false);
          busy.current = false;
          // Video tetap mounted (tidak reload): parkir pause + detik 0 untuk giliran berikut
          const rv = videoRef.current;
          if (rv) {
            try { rv.pause(); rv.currentTime = 0; } catch { /* abaikan */ }
          }
          setVidDim(1);
          pump();
        }, 60);
      }, 7500);
    }, 60);
  };

  useEffect(() => {
    for (const f of follows) {
      if (!seen.current.has(f.id)) {
        seen.current.add(f.id);
        queue.current.push(f);
      }
    }
    // Batasi antrian (ikut Max Follows) biar tidak menumpuk tak terbatas
    while (queue.current.length > Math.max(2, maxFollows) * 2) queue.current.shift();
    pump();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [follows]);

  const ff = font && font !== 'Outfit' ? `'${font}', 'Orbitron', sans-serif` : `'Orbitron', sans-serif`;
  const heading = ((current?.label || 'new follower')).toUpperCase();
  const nickname = (current?.nickname || '').toUpperCase();

  const cls = ['follow-alert-theme'];
  if (step >= 1) cls.push('step-1');
  if (step >= 2) cls.push('step-2');
  if (step >= 3) cls.push('step-3');
  if (step >= 4) cls.push('step-4');
  if (step >= 5) cls.push('exit');
  if (noTrans) cls.push('disable-transitions');

  // Video + container selalu mounted (tidak reload per alert); konten
  // disembunyikan via step saat idle
  return (
    <div className="w-full max-w-[800px]">
      <div
        className={cls.join(' ')}
        style={{
          position: 'relative',
          width: 800,
          maxWidth: '100%',
          height: 120,
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          fontFamily: ff,
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
            <UserPlus size={50} strokeWidth={2.5} />
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

        {/* Lapisan atas (hitam - wipe) */}
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
          {/* Video background (sama seperti NeonBar goals) */}
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
          {/* Video sekali putar per alert (tanpa loop): selesai = tahan frame + fade hitam */}
          <div style={{ position: 'absolute', left: 80, top: 30, fontSize: 24, color: 'white', fontFamily: 'monospace', opacity: step >= 4 ? 1 : 0, transition: noTrans ? 'none' : 'opacity 0.5s ease' }}>✦</div>
          <div style={{ position: 'absolute', left: 30, bottom: 20, fontSize: 16, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', opacity: step >= 4 ? 1 : 0, transition: noTrans ? 'none' : 'opacity 0.5s ease' }}>+</div>
          <div style={{ position: 'absolute', left: 50, bottom: 20, fontSize: 16, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', opacity: step >= 4 ? 1 : 0, transition: noTrans ? 'none' : 'opacity 0.5s ease' }}>+</div>
          <div style={{ position: 'absolute', right: 20, top: 20, fontSize: 16, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', opacity: step >= 4 ? 1 : 0, transition: noTrans ? 'none' : 'opacity 0.5s ease' }}>+</div>
          <div style={{ position: 'absolute', right: 20, bottom: 20, fontSize: 16, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', opacity: step >= 4 ? 1 : 0, transition: noTrans ? 'none' : 'opacity 0.5s ease' }}>+</div>
          <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', opacity: step >= 4 ? 1 : 0, transition: noTrans ? 'none' : 'opacity 0.5s ease' }}>+</div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: 'white',
              letterSpacing: 4,
              whiteSpace: 'nowrap',
              maxWidth: '92%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              opacity: step >= 4 ? 1 : 0,
              transform: step >= 4 ? 'translateX(0)' : 'translateX(-36px)',
              transition: noTrans ? 'none' : 'opacity 0.45s ease, transform 0.55s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          >
            {nickname}
          </div>
        </div>
      </div>
    </div>
  );
}
