import type { PollThemeProps } from './types';
import './Minimal.css';

export default function MinimalTheme({ poll, font, bg }: PollThemeProps) {
  const total = poll.total || poll.votes.reduce((a: number, b: number) => a + b, 0);
  return (
    <div
      id="poll-minimal-wrapper"
      className="poll-minimal-theme w-full max-w-[520px] rounded-2xl border bg-[#0f0f0f]/90 backdrop-blur p-4"
      style={{ borderColor: 'rgba(255,255,255,0.08)', fontFamily: `'${font}', sans-serif`, background: bg === 'transparent' ? 'rgba(12,12,12,0.92)' : bg }}
    >
      <div id="poll-question" className="text-white font-black text-[14px] leading-tight">{poll.question}</div>
      <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: poll.options.length===2 ? 'repeat(2, minmax(0,1fr))' : poll.options.length<=4 ? 'repeat(2, minmax(0,1fr))' : 'repeat(3, minmax(0,1fr))' }}>
        {poll.options.map((opt: string, i: number) => {
          const v = poll.votes[i] || 0;
          const pct = total ? Math.round((v / total) * 100) : 0;
          const isWinning = total>0 && v===Math.max(...poll.votes) && v>0;
          const isWinnerEnded = poll.ended && isWinning;
          return (
            <div
              key={i}
              id={`poll-option-${i}`}
              className={`poll-minimal-card rounded-xl bg-white/5 border border-white/10 p-3 text-center relative overflow-hidden ${isWinnerEnded ? 'poll-winner' : ''}`}
              style={{ animationDelay: `${i * 80}ms` } as any}
            >
              <div className="poll-minimal-percent text-white font-black text-[20px] leading-none">{pct}%</div>
              <div className="poll-minimal-label text-white font-bold text-[11px] mt-1 truncate">{opt}</div>
              <div className="poll-minimal-count text-gray-500 text-[10px] font-mono">{v} votes {isWinnerEnded && '👑'}</div>
              {isWinnerEnded && <div className="absolute top-1 right-1 text-[12px] animate-[bounce_0.6s_ease]">✨</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
