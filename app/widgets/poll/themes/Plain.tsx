import type { PollThemeProps } from './types';
import './Plain.css';

export default function PlainTheme({ poll, font, accent, showPercent, showCount, showTotal, showTimer }: PollThemeProps) {
  const total = poll.total || poll.votes.reduce((a: number, b: number) => a + b, 0);
  const elapsed = poll.paused && poll.pausedAt ? Math.floor((poll.pausedAt - poll.createdAt) / 1000) : Math.floor((Date.now() - poll.createdAt) / 1000);
  const remain = Math.max(0, poll.duration - elapsed);
  const mm = Math.floor(remain / 60);
  const ss = String(remain % 60).padStart(2, '0');
  return (
    <div
      id="poll-plain-wrapper"
      className="poll-plain-theme w-full max-w-[520px]"
      style={{ fontFamily: `'${font}', sans-serif`, background: 'transparent' }}
    >
      <div id="poll-question" className="font-bold text-[16px] leading-snug text-white">{poll.question}</div>
      {(showTotal || showTimer) && (
        <div className="mt-0.5 text-[11px] font-bold" style={{ color: accent }}>
          {showTotal && <span>{total} votes</span>}
          {showTotal && showTimer && !poll.ended && <span> • </span>}
          {showTimer && !poll.ended && <span>{mm}:{ss}</span>}
          {poll.ended && <span> • Selesai</span>}
        </div>
      )}
      <div className="mt-1.5 flex flex-col gap-0.5">
        {poll.options.map((opt: string, i: number) => {
          const v = poll.votes[i] || 0;
          const pct = total ? Math.round((v / total) * 100) : 0;
          return (
            <div key={i} id={`poll-option-${i}`} className="text-[13px] leading-relaxed text-white">
              <span className="font-bold">{i + 1}. {opt}</span>
              {showPercent && <span className="font-bold tabular-nums" style={{ color: accent }}> {pct}%</span>}
              {showCount && <span className="text-white/60 font-mono text-[11px]"> ({v})</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
