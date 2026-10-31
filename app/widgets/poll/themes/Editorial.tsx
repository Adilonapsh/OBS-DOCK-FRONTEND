import React from 'react';
import type { PollThemeProps } from './types';

export default function EditorialTheme({
  poll,
  font,
  accent = '#E64A19',
  bg = '#F8F9F5',
  showPercent,
  showCount,
  showTotal,
  showTimer
}: PollThemeProps) {
  // Respect global pos via outer display flex - editorial card tetap max-w 680
  const cardBg = bg === 'transparent' ? '#F7F7F5' : bg;
  // 1. Kalkulasi Total & Timer
  const total = poll.total || poll.votes.reduce((a: number, b: number) => a + b, 0);
  const elapsed = poll.paused && poll.pausedAt
    ? Math.floor((poll.pausedAt - poll.createdAt) / 1000)
    : Math.floor((Date.now() - poll.createdAt) / 1000);
  const remain = Math.max(0, poll.duration - elapsed);

  // 2. Kalkulasi Max Vote untuk Leading Option
  const maxVote = Math.max(...poll.votes, 0);
  const leadingIndex = total > 0 ? poll.votes.indexOf(maxVote) : -1;
  const leadingPct = total > 0 && leadingIndex !== -1 
    ? Math.round((poll.votes[leadingIndex] / total) * 100) 
    : 0;

  // Pemetaan huruf untuk perintah vote (!VOTE A, !VOTE B, dst)
  const letters = ['1', '2', '3', '4', '5', '6', '7', '8'];

  return (
    <div
      id="poll-tech-wrapper"
      className="relative w-full max-w-[680px] p-6 rounded-sm text-slate-800 shadow-2xl border border-slate-300/80 select-none"
      style={{
        backgroundColor: cardBg,
        fontFamily: font ? `'${font}', sans-serif` : "'Space Mono', 'Courier New', monospace",
        backdropFilter: bg === 'transparent' ? 'blur(2px)' : undefined,
      }}
    >
      {/* Frame Hiasan Atas (Cyber Corner Bracket) */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-slate-800" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-slate-800" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-slate-800" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-slate-800" />

      {/* HEADER SECTION */}
      <div className="flex items-start justify-between border-b border-slate-300 pb-3 mb-4">
        <div>
          {/* Status Live Indicator */}
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
            <span className={`w-1.5 h-1.5 ${poll.ended ? 'bg-slate-500' : poll.paused ? 'bg-amber-500' : 'bg-red-500 animate-pulse'}`} />
            {poll.ended ? 'FINISHED' : poll.paused ? 'PAUSED' : 'LIVE VOTE'}
          </div>
          {/* Judul Utama */}
          <h1 className="text-2xl font-black tracking-wider uppercase text-slate-900 mt-0.5 flex items-center gap-1">
            {poll.question || 'PICK WHAT WE PLAY TONIGHT'}
          </h1>
        </div>

        {/* TIMER DISPLAY */}
        {showTimer && (
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">TIME</span>
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 px-3 py-1 rounded-sm">
              <span className="font-mono text-xl font-bold text-slate-700 tracking-wider">
                {String(Math.floor(remain / 60)).padStart(2, '0')}:{String(remain % 60).padStart(2, '0')}
              </span>
              <span className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-slate-800 ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* METRICS / STATS CARDS - respect showTotal */}
      <div className={`grid gap-2 mb-5 ${showTotal ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {showTotal && (
        <div className="bg-slate-50/80 border border-slate-200/80 p-2.5 flex items-center gap-3">
          <div className="w-7 h-7 bg-white border border-slate-300 flex items-center justify-center text-slate-600 text-xs shadow-sm">📄</div>
          <div>
            <div className="text-sm font-black text-slate-800 leading-tight">{total}</div>
            <div className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">TOTAL VOTES</div>
          </div>
        </div>
        )}
        <div className="bg-slate-50/80 border border-slate-200/80 p-2.5 flex items-center gap-3">
          <div className="w-7 h-7 bg-white border border-slate-300 flex items-center justify-center text-slate-600 text-xs shadow-sm">⚡</div>
          <div>
            <div className="text-sm font-black text-slate-800 leading-tight">25.6/s</div>
            <div className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">PEAK RATE</div>
          </div>
        </div>
        <div className="bg-slate-50/80 border border-slate-200/80 p-2.5 flex items-center gap-3">
          <div className="w-7 h-7 bg-white border border-slate-300 flex items-center justify-center text-slate-600 text-xs shadow-sm">👑</div>
          <div>
            <div className="text-sm font-black text-slate-800 leading-tight">{leadingPct}%</div>
            <div className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">LEADING</div>
          </div>
        </div>
      </div>

      {/* QUESTION SUBHEADER */}
      <div className="flex items-center justify-between mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {/* <div className="flex items-center gap-2 text-slate-600">
          <span className="text-xs">📍</span>
          <span>{poll.question || 'PICK WHAT WE PLAY TONIGHT'}</span>
        </div> */}
        <div className="tracking-widest font-black text-slate-400">
          CHOOSE 1 OF {poll.options.length}
        </div>
      </div>

      {/* OPTIONS LIST */}
      <div className="space-y-2.5">
        {poll.options.map((opt: string, i: number) => {
          const v = poll.votes[i] || 0;
          const pct = total > 0 ? Math.round((v / total) * 100) : 0;
          const isLeading = total > 0 && v === maxVote && v > 0;

          return (
            <div
              key={i}
              className={`relative bg-slate-50/50 border transition-all duration-200 p-3 ${
                isLeading
                  ? 'border-slate-800 bg-white shadow-sm'
                  : 'border-slate-200/90'
              }`}
            >
              {/* Indicator Garis Orange Kiri (Hanya untuk yang memimpin) */}
              {isLeading && (
                <div
                  className="absolute top-0 left-0 bottom-0 w-[3px]"
                  style={{ backgroundColor: accent }}
                />
              )}

              {/* Top Row Option Info */}
              <div className="flex items-center justify-between relative z-10 mb-2">
                <div className="flex items-center gap-3">
                  {/* Nomor Indeks */}
                  <div className="border border-slate-300 bg-white text-slate-700 font-mono font-bold text-xs px-2 py-0.5 shadow-2xs">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  {/* Nama Opsi */}
                  <div className="font-extrabold text-slate-900 text-sm tracking-wide">
                    {opt}
                  </div>
                </div>

                {/* Vote Count & Percentage */}
                <div className="flex items-baseline gap-2">
                  {showCount && (
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">
                      {v} VOTES
                    </span>
                  )}
                  {showPercent && (
                    <span className="text-lg font-black text-slate-900 tracking-tight">
                      {pct}%
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="relative w-full h-1.5 bg-slate-200/60 rounded-none overflow-hidden mb-2">
                <div
                  className="h-full transition-all duration-500 ease-out"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: accent,
                  }}
                />
              </div>

              {/* Bottom Row: Command Hint & Leading Tag */}
              <div className="flex items-center justify-between text-[10px] font-extrabold tracking-widest uppercase relative z-10">
                {/* <div className="flex items-center gap-1.5" style={{ color: accent }}>
                  <span className="text-[8px]">■</span>
                  <span>{letters[i] || i + 1}</span>
                </div> */}

                {isLeading && (
                  <div className="flex items-center gap-1" style={{ color: accent }}>
                    <span className="text-[8px]">▲</span>
                    <span>LEADING</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}