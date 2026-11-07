import type { PollThemeProps } from './types';

export default function BrutalistTheme({ poll, font, accent, showPercent, showCount, showTotal, showTimer }: PollThemeProps) {
  const total = poll.total || poll.votes.reduce((a: number, b: number) => a + b, 0);
  const elapsed =
    poll.paused && poll.pausedAt ? Math.floor((poll.pausedAt - poll.createdAt) / 1000) : Math.floor((Date.now() - poll.createdAt) / 1000);
  const remain = Math.max(0, poll.duration - elapsed);
  const mm = String(Math.floor(remain / 60)).padStart(2, '0');
  const ss = String(remain % 60).padStart(2, '0');
  const maxVote = Math.max(...poll.votes, 0);
  const accentColor = accent || '#FFE600';

  const halftone: React.CSSProperties = {
    backgroundImage: 'radial-gradient(circle, #000 1.2px, transparent 1.45px)',
    backgroundSize: '10px 10px',
  };

  const barHalftone: React.CSSProperties = {
    backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.18) 1.1px, transparent 1.35px)',
    backgroundSize: '8px 8px',
  };

  return (
    <div
      id="poll-brutalist-wrapper"
      className="poll-brutalist-theme w-full max-w-[640px] bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] overflow-hidden relative"
      style={{ fontFamily: `'${font}', sans-serif` }}
    >
      {/* halftone wash on whole card */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={halftone} />

      {/* top strip */}
      <div className="relative h-3 bg-black border-b-[4px] border-black flex items-center gap-1.5 px-2">
        <span className="w-2 h-2 bg-white border border-black" />
        <span className="w-2 h-2 bg-white border border-black" />
        <span className="w-2 h-2 bg-white border border-black" />
        <span className="ml-auto font-mono font-black text-[8px] tracking-[0.18em] text-white uppercase">POLL // BRUTALIST • {poll.ended ? 'ENDED' : poll.paused ? 'PAUSED' : 'LIVE'}</span>
      </div>

      {/* header */}
      <div className="relative px-5 pt-4 pb-3 border-b-[4px] border-black bg-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 bg-black text-white px-2 py-1 border-[2px] border-black shadow-[3px_3px_0_#000]">
              <span className={`w-2 h-2 border border-black ${poll.ended ? 'bg-zinc-400' : poll.paused ? 'bg-yellow-400' : 'bg-red-500 animate-pulse'}`} />
              <span className="font-black uppercase tracking-[0.14em] text-[10px] leading-none">
                POLLING {poll.ended ? '- SELESAI' : poll.paused ? '- PAUSED' : showTimer ? `- ${mm}:${ss}` : '- LIVE'}
              </span>
            </div>
            <h2 id="poll-question" className="mt-3 font-black uppercase tracking-tight text-black text-[20px] md:text-[22px] leading-[0.95]">
              {poll.question}
            </h2>
            <div className="mt-2 inline-flex items-center gap-1.5 bg-white border-[2px] border-black px-2 py-1 text-[10px] font-black uppercase tracking-widest text-black shadow-[2px_2px_0_#000]">
              KETIK 1-{poll.options.length} DI CHAT UNTUK VOTE
            </div>
          </div>
          <div className="hidden sm:flex flex-col gap-2 shrink-0">
            <div className="bg-white border-[3px] border-black shadow-[4px_4px_0_#000] px-3 py-2 min-w-[92px] text-center">
              <div className="font-black text-black text-[18px] leading-none">{total}</div>
              <div className="font-black uppercase tracking-widest text-[8px] text-black/70">TOTAL VOTES</div>
            </div>
            {showTimer && !poll.ended && (
              <div className="bg-black text-white border-[3px] border-black shadow-[4px_4px_0_#000] px-3 py-2 text-center">
                <div className="font-mono font-black text-[18px] leading-none">
                  {mm}:{ss}
                </div>
                <div className="font-black uppercase tracking-widest text-[8px] text-white/80">SISA WAKTU</div>
              </div>
            )}
          </div>
        </div>
        {(showTotal || showTimer) && (
          <div className="mt-3 flex sm:hidden gap-2">
            {showTotal && (
              <div className="flex-1 bg-white border-[2px] border-black px-2 py-1.5 flex items-center justify-between shadow-[2px_2px_0_#000]">
                <span className="font-black uppercase text-[9px] tracking-widest text-black/60">VOTES</span>
                <span className="font-black text-[13px] text-black">{total}</span>
              </div>
            )}
            {showTimer && (
              <div className="flex-1 bg-black text-white border-[2px] border-black px-2 py-1.5 flex items-center justify-between shadow-[2px_2px_0_#000]">
                <span className="font-black uppercase text-[9px] tracking-widest text-white/70">TIME</span>
                <span className="font-mono font-black text-[13px]">{poll.ended ? '00:00' : `${mm}:${ss}`}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* options */}
      <div className="relative px-4 py-4 space-y-3 bg-[#f7f7f7] border-t-0">
        <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={halftone} />
        {poll.options.map((opt: string, i: number) => {
          const v = poll.votes[i] || 0;
          const pct = total ? Math.round((v / total) * 100) : 0;
          const isLeading = total > 0 && v === maxVote && v > 0;
          const isWinner = poll.ended && isLeading;
          return (
            <div
              key={i}
              id={`poll-option-${i}`}
              className="poll-option relative overflow-hidden bg-white border-[3px] border-black shadow-[5px_5px_0px_0px_#000] flex flex-col"
              style={{ transform: isWinner ? 'rotate(-0.4deg)' : undefined }}
            >
              {/* progress fill */}
              <div className="absolute inset-y-0 left-0 flex" style={{ width: `${pct}%` }}>
                <div className="flex-1 relative overflow-hidden" style={{ background: accentColor }}>
                  <div className="absolute inset-0 opacity-20" style={barHalftone} />
                  {/* diagonal hatch overlay for brutalist */}
                  <div
                    className="absolute inset-0 opacity-[0.08]"
                    style={{
                      backgroundImage: `repeating-linear-gradient(45deg, #000 0 2px, transparent 2px 6px)`,
                    }}
                  />
                </div>
                <div className="w-[3px] bg-black shrink-0" />
              </div>

              {/* content */}
              <div className="relative flex items-center gap-3 px-3 py-3">
                <span
                  className={`w-8 h-8 border-[3px] border-black flex items-center justify-center font-black text-[13px] shrink-0 shadow-[2px_2px_0_#000] ${isLeading ? 'bg-black text-white' : 'bg-white text-black'}`}
                >
                  {i + 1}
                </span>
                <span className="flex-1 font-black uppercase tracking-tight text-[13px] leading-tight text-black truncate">{opt}</span>
                {isWinner && (
                  <span className="hidden sm:inline-flex bg-black text-white font-black uppercase text-[9px] tracking-widest px-2 py-1 border-[2px] border-black shadow-[2px_2px_0_#000]">
                    WINNER
                  </span>
                )}
                <div className="flex items-center gap-1.5 shrink-0">
                  {showCount && (
                    <span className="poll-option-count font-mono font-black text-[11px] bg-black text-white border-[2px] border-black px-2 py-1 leading-none">
                      {v}
                    </span>
                  )}
                  {showPercent && (
                    <span className="poll-option-percent font-black text-[14px] bg-white text-black border-[3px] border-black px-2 py-0.5 leading-none shadow-[2px_2px_0_#000] min-w-[52px] text-center">
                      {pct}%
                    </span>
                  )}
                </div>
              </div>

              {/* bottom bar */}
              <div className="relative h-1.5 bg-black/10 border-t-[3px] border-black overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-black transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>

              {isWinner && (
                <div className="absolute top-1 right-1 bg-white border-[2px] border-black text-black font-black text-[10px] px-1.5 py-0.5 shadow-[2px_2px_0_#000] rotate-[2deg]">
                  ★ TERPILIH
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* footer ticker */}
      <div className="relative bg-black text-white border-t-[4px] border-black flex items-center justify-between px-3 py-2">
        <span className="font-mono font-black text-[9px] uppercase tracking-[0.14em] flex items-center gap-2">
          <span className="w-2 h-2 bg-white border border-black" /> {poll.options.length} OPSI • KETIK NOMOR DI CHAT
        </span>
        <span className="font-black uppercase text-[8px] tracking-[0.14em] bg-white text-black px-2 py-1 border border-white">
          {poll.ended ? 'POLL ENDED' : 'BRUTALIST POLL'}
        </span>
      </div>
    </div>
  );
}
