'use client';
import { useEffect, useRef, useState } from 'react';
import type { PollThemeProps } from './types';

const GOLD_LIGHT = '#d8c690';
const GOLD_MAIN = '#b49f63';
const GOLD_DARK = '#6e6038';

// Esports — audience poll ala referensi: panel emas slide-in, expand,
// garis divider, data opsi, title slide-up. Data mock (tim/region/logo)
// diganti data poll real (opsi/vote), tanpa video background agar
// transparan OBS tetap aman.
export default function EsportsTheme({ poll, font, showPercent, showCount, showTotal, showTimer, logo }: PollThemeProps) {
  const [phase, setPhase] = useState(0); // 1 bg-title, 2 logo, 3 expand, 4 lines, 5 data, 6 title
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const seq: Array<[number, number]> = [[1, 0], [2, 500], [3, 1200], [4, 1700], [5, 1900], [6, 2200]];
    for (const [p, ms] of seq) timers.current.push(window.setTimeout(() => setPhase(p), ms));
    return () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; };
  }, []);

  const total = poll.total || poll.votes.reduce((a: number, b: number) => a + b, 0);
  const opts = poll.options.map((text, i) => ({ text, votes: poll.votes[i] || 0 }));
  const n = Math.max(1, opts.length);
  const cols = n === 1 ? 1 : n <= 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const width = cols === 1 ? 640 : cols === 3 ? 1220 : 960;
  const height = 140 + (rows - 1) * 130;

  const elapsed = poll.paused && (poll as unknown as { pausedAt?: number }).pausedAt
    ? Math.floor((((poll as unknown as { pausedAt?: number }).pausedAt || 0) - poll.createdAt) / 1000)
    : Math.floor((Date.now() - poll.createdAt) / 1000);
  const remain = Math.max(0, poll.duration - elapsed);
  const timerText = `${Math.floor(remain / 60)}:${String(remain % 60).padStart(2, '0')}`;
  const statusText = poll.ended ? 'SELESAI' : poll.paused ? 'PAUSED' : showTimer ? timerText : 'LIVE';
  const maxVotes = Math.max(0, ...poll.votes);

  const ff = `'${font}', 'Inter', sans-serif`;
  const teko = `'Teko', '${font}', sans-serif`;

  return (
    <div className="poll-esports-theme" style={{ fontFamily: ff, color: 'white', paddingTop: 34 }}>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Title tab (slide up dari balik panel) */}
        <div style={{ width: '100%', height: 30, overflow: 'hidden', position: 'absolute', top: -30, display: 'flex', justifyContent: 'center', zIndex: 1 }}>
          <div
            style={{
              width: '100%',
              background: 'rgba(18,18,18,0.95)',
              color: GOLD_LIGHT,
              fontWeight: 900,
              fontSize: 16,
              letterSpacing: 2,
              padding: '4px 12px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              boxSizing: 'border-box',
              borderTopLeftRadius: 4,
              borderTopRightRadius: 4,
              transform: phase >= 6 ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          >
            {poll.question || 'AUDIENCE POLL'}
          </div>
        </div>

        {/* Panel utama */}
        <div
          style={{
            display: 'flex',
            height: 140,
            backgroundColor: '#121212',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 2,
            width: phase >= 3 ? width : phase >= 1 ? 220 : 0,
            opacity: phase >= 1 ? 1 : 0,
            transition: 'width 0.8s cubic-bezier(0.25, 1, 0.2, 1), height 0.8s cubic-bezier(0.25, 1, 0.2, 1), opacity 0.3s ease',
            ...(phase >= 3 ? { height } : {}),
          }}
        >
          {/* Panel kiri (emas): total vote + status + jumlah opsi */}
          <div
            style={{
              width: 220,
              height: '100%',
              flexShrink: 0,
              background: 'linear-gradient(135deg, #7c724f 0%, #b8a678 40%, #d8c690 60%, #4a4328 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              borderRight: '2px solid rgba(0,0,0,0.5)',
              zIndex: 5,
              color: '#111',
            }}
          >
            {logo ? (
              <img
                src={logo}
                alt="logo"
                style={{
                  maxHeight: 56,
                  maxWidth: 160,
                  objectFit: 'contain',
                  marginBottom: 4,
                  opacity: phase >= 2 ? 1 : 0,
                  transform: phase >= 2 ? 'translateY(0)' : 'translateY(30px)',
                  transition: 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.05s',
                }}
              />
            ) : null}
            <div style={{ fontSize: 10, letterSpacing: 4, fontWeight: 700, marginBottom: 2, opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.1s' }}>
              {showTotal ? `${total} VOTES` : 'POLL'}
            </div>
            <div style={{ fontFamily: teko, fontSize: poll.question && poll.question.length > 24 ? 26 : 34, fontWeight: 500, lineHeight: 1.05, textAlign: 'center', marginBottom: 4, padding: '0 10px', opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.2s' }}>
              {statusText}
            </div>
            <div style={{ background: 'white', color: GOLD_DARK, fontSize: 10, fontWeight: 900, padding: '2px 6px', borderRadius: 2, letterSpacing: 1, opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.3s' }}>
              {n} OPSI
            </div>
          </div>

          {/* Panel kanan (grid opsi) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              ...(rows > 1 ? { gridTemplateRows: `repeat(${rows}, 1fr)` } : {}),
              flexGrow: 1,
              minWidth: phase >= 3 ? (cols === 1 ? 420 : cols === 3 ? 980 : 720) : 0,
              padding: 10,
              gap: 10,
              backgroundColor: '#121212',
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            {opts.map((o, i) => {
              const pct = total ? Math.round((o.votes / total) * 100) : 0;
              const isWinner = poll.ended && o.votes === maxVotes && o.votes > 0;
              const right = cols === 2 && i % 2 === 1;
              return (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#1a1a1a',
                    border: `1px solid ${isWinner ? GOLD_MAIN : 'rgba(255,255,255,0.05)'}`,
                    boxShadow: isWinner ? `0 0 18px rgba(180,159,99,0.45)` : undefined,
                    borderRadius: 4,
                    display: 'flex',
                    flexDirection: right ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    padding: '10px 20px',
                    position: 'relative',
                    overflow: 'hidden',
                    gap: 15,
                  }}
                >
                  <div
                    style={{
                      width: 70,
                      height: 50,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontFamily: teko,
                      fontSize: 40,
                      fontWeight: 700,
                      color: isWinner ? GOLD_LIGHT : 'rgba(255,255,255,0.85)',
                      opacity: phase >= 5 ? 1 : 0,
                      transform: phase >= 5 ? 'translate(0,0)' : 'translateX(-10px)',
                      transition: 'all 0.5s ease',
                    }}
                  >
                    {i + 1}
                  </div>
                  <div
                    style={{
                      flexGrow: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      textAlign: right ? 'right' : 'left',
                      alignItems: right ? 'flex-end' : 'flex-start',
                      opacity: phase >= 5 ? 1 : 0,
                      transform: phase >= 5 ? 'translate(0,0)' : 'translateY(10px)',
                      transition: 'all 0.5s ease',
                      minWidth: 0,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '100%' }}>
                      {showCount && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1, lineHeight: 1.2 }}>
                          {o.votes} VOTES
                        </span>
                      )}
                      <span style={{ fontSize: o.text.length > 24 ? 17 : 20, fontWeight: 900, color: GOLD_LIGHT, lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word', maxWidth: '100%' }}>
                        {o.text}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 2,
                        backgroundColor: GOLD_MAIN,
                        width: '100%',
                        margin: '4px 0',
                        transformOrigin: right ? 'right' : 'left',
                        transform: phase >= 4 ? 'scaleX(1)' : 'scaleX(0)',
                        transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
                      }}
                    />
                    {showPercent && (
                      <span style={{ fontSize: 42, fontWeight: 900, color: 'white', lineHeight: 1, fontFamily: teko }}>
                        {pct}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Cara vote */}
        <div
          style={{
            marginTop: 10,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 3,
            color: GOLD_LIGHT,
            opacity: phase >= 6 ? 0.9 : 0,
            transition: 'opacity 0.6s ease 0.2s',
          }}
        >
          KETIK 1–{n} DI CHAT UNTUK VOTE
        </div>
      </div>
    </div>
  );
}
