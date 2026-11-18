import type { PollThemeProps } from './types';
import './Anime.css';

export default function AnimeTheme({ poll, font, accent, bg, showPercent, showCount, showTotal, showTimer }: PollThemeProps) {
  const total = poll.total || poll.votes.reduce((a: number, b: number) => a + b, 0);
  const elapsed = poll.paused && poll.pausedAt ? Math.floor((poll.pausedAt - poll.createdAt) / 1000) : Math.floor((Date.now() - poll.createdAt) / 1000);
  const remain = Math.max(0, poll.duration - elapsed);
  // kawaii pastel palette per option - adapts 2-6
  const pastel = ['#FF6B9D', '#00E5FF', '#FFC857', '#C084FC', '#7ED957', '#FF8FAB'];
  const n = poll.options.length;
  const gridCls = n === 2 ? 'grid-cols-2' : n <= 4 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3';

  return (
    <div
      id="poll-anime-wrapper"
      className="poll-anime-theme w-full max-w-[680px] rounded-[28px] border-2 overflow-hidden relative"
      style={{
        background: bg === 'transparent' ? '#FFF8FA' : bg,
        borderColor: 'rgba(255,107,157,0.35)',
        fontFamily: `'${font}', 'Outfit', sans-serif`,
        boxShadow: '0 12px 40px rgba(255,107,157,0.15), 0 0 0 1px rgba(255,255,255,0.8) inset',
      }}
    >

      {/* header */}
      <div className="relative px-6 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-white border border-[#FF6B9D]/30 text-[#FF6B9D] font-black text-[10px] tracking-widest flex items-center gap-1.5 shadow-sm">
            <span className={`w-2 h-2 rounded-full ${poll.ended ? 'bg-gray-400' : poll.paused ? 'bg-yellow-400' : 'bg-[#FF6B9D] animate-pulse'}`} />
            {poll.ended ? 'SELESAI' : poll.paused ? 'PAUSED' : 'VOTING!'}
          </span>
          {showTimer && !poll.ended && !poll.paused && (
            <span className="ml-1 px-2 py-1 rounded-full bg-[#2d1b2e] text-white font-mono font-black text-[11px]">{String(Math.floor(remain / 60)).padStart(2, '0')}:{String(remain % 60).padStart(2, '0')}</span>
          )}
          {showTotal && <span className="ml-auto text-[#2d1b2e]/60 font-black text-[10px]">{total} votes • {n} opsi</span>}
        </div>
        <h2 id="poll-question" className="mt-3 text-[#2d1b2e] font-black text-[19px] md:text-[22px] leading-tight tracking-tight">
          <span className="inline-flex items-center gap-1.5">🎀 {poll.question}</span>
        </h2>
        <div className="mt-1 text-[#FF6B9D] font-bold text-[10px] tracking-widest uppercase">Ketik 1-{n} di chat ✦ Twitch • YouTube • TikTok • Kick</div>
      </div>

      {/* options grid - adapts 2-6 */}
      <div className={`px-4 pb-5 grid gap-3 ${gridCls}`}>
        {poll.options.map((opt: string, i: number) => {
          const v = poll.votes[i] || 0;
          const pct = total ? Math.round((v / total) * 100) : 0;
          const isWinning = total > 0 && v === Math.max(...poll.votes) && v > 0;
          const isWinnerEnded = poll.ended && isWinning;
          const col = pastel[i % pastel.length];
          return (
            <div
              key={i}
              id={`poll-option-${i}`}
              className={`poll-anime-card relative rounded-[20px] border-2 bg-white/90 backdrop-blur overflow-hidden flex flex-col ${isWinning ? 'scale-[1.02] z-10' : ''} ${isWinnerEnded ? 'poll-winner' : ''}`}
              style={{
                borderColor: isWinnerEnded ? col : isWinning ? col : 'rgba(255,107,157,0.18)',
                boxShadow: isWinnerEnded ? `0 12px 32px ${col}40, 0 0 0 3px white inset` : isWinning ? `0 8px 24px ${col}30, 0 0 0 2px white inset` : '0 4px 16px rgba(0,0,0,0.06)',
                animationDelay: `${i * 70}ms`,
                transition: 'all 0.5s ease',
              } as any}
            >
              {/* top accent line - solid */}
              <div className="h-1.5 w-full" style={{ background: col }} />
              <div className="p-3 flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center font-black text-[13px] text-white shadow-md shrink-0"
                    style={{ background: col }}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 text-[#2d1b2e] font-bold text-[13px] leading-tight line-clamp-2">{opt}</span>
                </div>
                {/* progress - solid */}
                <div className="mt-1 h-2.5 bg-[#FFF0F3] rounded-full overflow-hidden border border-[#FF6B9D]/15 p-0.5">
                  <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: col }} />
                </div>
                <div className="flex items-center justify-between">
                  {showPercent ? <span className="poll-anime-percent font-black text-[18px] leading-none" style={{ color: col }}>{pct}%</span> : <span />}
                  <div className="flex items-center gap-1.5">
                    {isWinnerEnded && <span className="text-[10px] font-black uppercase bg-white border border-[#FF6B9D] text-[#FF6B9D] px-2 py-0.5 rounded-full animate-[winnerPulse_0.6s_ease]">TERPILIH</span>}
                    {showCount && <span className="text-[#2d1b2e] font-mono font-black text-[11px] bg-[#FFF0F3] border border-[#FF6B9D]/15 rounded-full px-2 py-0.5">{v} vote</span>}
                    {isWinning && <span className={`text-[10px] ${isWinnerEnded ? 'animate-[bounce_0.6s_ease]' : ''}`}>👑</span>}
                  </div>
                </div>
              </div>
              {/* winner sparkle */}
              {isWinnerEnded && <div className="pointer-events-none absolute inset-0 overflow-hidden"><span className="absolute top-2 right-2 text-[14px] animate-[confetti_1.2s_ease_0.5s_both]">🎉</span><span className="absolute bottom-2 left-2 text-[12px] animate-[confetti_1.2s_ease_0.7s_both]">✨</span></div>}
              {isWinning && !isWinnerEnded && <div className="pointer-events-none absolute top-2 right-2 text-[12px] opacity-60">✨</div>}
            </div>
          );
        })}
      </div>

      {/* footer */}
      <div className="px-5 pb-3 flex items-center justify-center gap-1.5 text-[9px] font-black tracking-widest text-[#2d1b2e]/40 uppercase">
        <span>◡̈</span> polling by dock <span>•</span> {poll.ended ? 'hasil akhir' : 'vote sekarang!'} <span>◡̈</span>
      </div>
    </div>
  );
}
