import type { PollThemeProps } from './types';
import './Bar.css';

export default function BarTheme({ poll, font, accent, bg, showPercent, showCount, showTotal, showTimer }: PollThemeProps) {
  const total = poll.total || poll.votes.reduce((a: number, b: number) => a + b, 0);
  const elapsed = poll.paused && poll.pausedAt ? Math.floor((poll.pausedAt - poll.createdAt) / 1000) : Math.floor((Date.now() - poll.createdAt) / 1000);
  const remain = Math.max(0, poll.duration - elapsed);
  const colors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#10b981', '#f43f5e'];
  const mono = total > 0;
  return (
    <div
      id="poll-bar-wrapper"
      className="poll-bar-theme w-full max-w-[640px] rounded-[20px] border shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
      style={{ background: bg === 'transparent' ? 'rgba(18,18,18,0.92)' : bg, borderColor: 'rgba(255,255,255,0.1)', fontFamily: `'${font}', sans-serif` }}
    >
      <div className="px-5 pt-5 pb-3">
        <div className="text-[11px] font-black uppercase tracking-widest text-violet-400 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${poll.ended ? 'bg-gray-500' : poll.paused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
          POLLING {poll.ended ? '• SELESAI' : poll.paused ? '• PAUSED' : showTimer ? `• ${Math.floor(remain / 60)}:${String(remain % 60).padStart(2, '0')}` : '• LIVE'}
          {showTotal && <span className="ml-auto text-[10px] font-bold text-gray-400">{total} votes • {poll.options.length} opsi</span>}
        </div>
        <h2 id="poll-question" className="mt-2 text-white font-black text-[18px] md:text-[20px] leading-tight">{poll.question}</h2>
        <div className="mt-1 text-[10px] text-gray-500 font-bold uppercase tracking-wide">Ketik 1-{poll.options.length} di chat untuk vote</div>
      </div>
      <div className="px-4 pb-4 space-y-2.5">
        {poll.options.map((opt: string, i: number) => {
          const v = poll.votes[i] || 0;
          const pct = total ? Math.round((v / total) * 100) : 0;
          const isWinning = mono && v === Math.max(...poll.votes) && v > 0;
          const isWinnerEnded = poll.ended && isWinning;
          return (
            <div
              key={i}
              id={`poll-option-${i}`}
              className={`poll-option relative overflow-hidden rounded-xl border ${isWinnerEnded ? 'poll-winner' : ''}`}
              style={{ borderColor: isWinning ? accent : 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', animationDelay: `${i * 70}ms` } as any}
            >
              <div className="poll-bar-fill absolute inset-y-0 left-0 transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${colors[i % colors.length]}, ${accent})`, opacity: 0.95 }} />
              <div className="relative flex items-center gap-3 px-3 py-3">
                <span className="poll-option-index w-7 h-7 rounded-full bg-white text-black flex items-center justify-center font-black text-[12px] shrink-0">{i + 1}</span>
                <span className="poll-option-label flex-1 text-white font-bold text-[13px] leading-tight truncate">{opt}</span>
                {isWinnerEnded && <span className="text-[11px] font-black uppercase tracking-widest bg-white text-black px-2 py-0.5 rounded-full animate-[winnerPulse_0.8s_ease]">TERPILIH</span>}
                {showCount && <span className="poll-option-count text-white font-mono font-black text-[11px] bg-black/30 border border-white/10 rounded-full px-2 py-0.5">{v}</span>}
                {showPercent && <span className="poll-option-percent text-white font-black text-[12px] tabular-nums">{pct}%</span>}
                {isWinnerEnded && <span className="text-[14px] animate-[bounce_0.6s_ease_0.4s]">👑</span>}
              </div>
              {isWinnerEnded && <div className="absolute inset-0 pointer-events-none overflow-hidden"><span className="absolute -top-1 -right-2 text-[18px] animate-[confetti_1.2s_ease_0.6s_both]">🎉</span><span className="absolute -bottom-1 -left-2 text-[14px] animate-[confetti_1.2s_ease_0.8s_both]">✨</span></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
