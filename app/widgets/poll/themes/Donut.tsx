import type { PollThemeProps } from './types';
import './Donut.css';

export default function DonutTheme({ poll, font, bg, showPercent, showTotal }: PollThemeProps) {
  const total = poll.total || poll.votes.reduce((a: number, b: number) => a + b, 0);
  const colors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#10b981', '#f43f5e'];
  let acc = 0;
  const segments = poll.options.map((_: string, i: number) => {
    const v = poll.votes[i] || 0;
    const pct = total ? v / total : 0;
    const start = acc;
    acc += pct;
    return { pct, start };
  });
  const r = 52;
  const C = 2 * Math.PI * r;
  return (
    <div
      id="poll-donut-wrapper"
      className="poll-donut-theme w-full max-w-[560px] rounded-[20px] border bg-[#111]/90 backdrop-blur p-5 flex flex-col md:flex-row gap-5 items-center"
      style={{ borderColor: 'rgba(255,255,255,0.1)', fontFamily: `'${font}', sans-serif`, background: bg === 'transparent' ? 'rgba(18,18,18,0.92)' : bg }}
    >
      <div className="relative w-[140px] h-[140px] shrink-0">
        <svg width={140} height={140} className="-rotate-90">
          <circle cx={70} cy={70} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={18} fill="none" />
          {segments.map((s: any, i: number) => {
            const len = C * s.pct;
            const offset = C * s.start;
            return <circle key={i} cx={70} cy={70} r={r} stroke={colors[i % colors.length]} strokeWidth={18} fill="none" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} strokeLinecap="round" style={{ transition: 'all 0.7s ease' }} />;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div id="poll-total" className="text-white font-black text-[22px] leading-none">{total}</div>
            <div className="text-gray-400 text-[9px] font-black uppercase tracking-widest">votes</div>
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0 w-full">
        <div className="text-violet-400 font-black uppercase text-[10px] tracking-widest">POLLING {poll.ended ? '• SELESAI' : poll.paused ? '• PAUSED' : '• LIVE'}</div>
        <h2 id="poll-question" className="text-white font-black text-[16px] leading-tight mt-1">{poll.question}</h2>
        <div className="mt-3 space-y-1.5">
          {poll.options.map((opt: string, i: number) => {
            const v = poll.votes[i] || 0;
            const pct = total ? Math.round((v / total) * 100) : 0;
            const isWinning = total>0 && v===Math.max(...poll.votes) && v>0;
            const isWinnerEnded = poll.ended && isWinning;
            return (
              <div
                key={i}
                id={`poll-option-${i}`}
                className={`poll-donut-legend flex items-center gap-2 text-[12px] ${isWinnerEnded ? 'poll-winner' : ''}`}
                style={{ animationDelay: `${i * 80}ms` } as any}
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: colors[i % colors.length] }} />
                <span className="flex-1 text-white font-bold truncate">{i + 1}. {opt} {isWinnerEnded && <span className="ml-1">👑</span>}</span>
                <span className="text-gray-400 font-mono text-[11px]">{v}</span>
                {showPercent && <span className="text-white font-black text-[11px] w-8 text-right">{pct}%</span>}
                {isWinnerEnded && <span className="text-[11px] font-black uppercase bg-white text-black px-1.5 py-0.5 rounded-full animate-[winnerPulse_0.8s_ease]">WIN</span>}
              </div>
            );
          })}
        </div>
        {showTotal && <div className="mt-2 text-[10px] text-gray-500 font-bold uppercase">Ketik 1-{poll.options.length} di chat</div>}
      </div>
    </div>
  );
}
