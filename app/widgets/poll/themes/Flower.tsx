import type { PollThemeProps } from './types';
import './Flower.css';

export default function FlowerTheme({ poll, font, bg, showTotal }: PollThemeProps) {
  const total = poll.total || poll.votes.reduce((a: number, b: number) => a + b, 0);
  const elapsed = poll.paused && poll.pausedAt ? Math.floor((poll.pausedAt - poll.createdAt) / 1000) : Math.floor((Date.now() - poll.createdAt) / 1000);
  const remain = Math.max(0, poll.duration - elapsed);
  const h = Math.floor(remain / 3600);
  const m = Math.floor((remain % 3600) / 60);
  const s = remain % 60;
  // palette per option - adapt 2-6
  const barColors = ['#5c85ff', '#2b3859', '#FF6B9D', '#7ED957', '#C084FC', '#FF8FAB'];
  const badgeBaseBg = ['#5952c6', '#f7ee55', '#FF6B9D', '#7ED957', '#8b5cf6', '#ff8fab'];
  const badgeBaseText = ['#ffffff', '#1e293b', '#ffffff', '#ffffff', '#ffffff', '#1e293b'];
  const badgeOverlayBg = ['#ffffff', '#f7ee55', '#ffffff', '#ffffff', '#ffffff', '#ffffff'];
  const badgeOverlayText = ['#5952c6', '#1e293b', '#FF6B9D', '#7ED957', '#8b5cf6', '#ff8fab'];
  const labelOverlayText = ['#ffffff', '#bae6fd', '#ffffff', '#ffffff', '#ffffff', '#1e293b'];

  return (
    <div
      id="poll-flower-wrapper"
      className="poll-flower-theme w-full max-w-[420px] mx-auto flex flex-col items-center space-y-4"
      style={{ fontFamily: `'Fredoka', '${font}', 'Nunito', sans-serif`, background: bg === 'transparent' ? 'transparent' : bg }}
    >
      {/* Timer */}
      <div className="flex items-center justify-center space-x-2 text-3xl md:text-4xl font-extrabold tracking-wider">
        <svg className="w-7 h-7 md:w-8 md:h-8 text-white stroke-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="13" r="8" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4l2 2M12 2v2M9 2h6" />
        </svg>
        <div className="flex items-center space-x-1 font-bold">
          <span className="text-white">{String(h).padStart(2, '0')}</span>
          <span className="text-white">:</span>
          <span className="text-white">{String(m).padStart(2, '0')}</span>
          <span className="text-white">:</span>
          <span className="text-[#8ebcfb]">{String(s).padStart(2, '0')}</span>
        </div>
        {poll.paused && <span className="ml-2 text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black px-2 py-0.5 rounded-full">PAUSED</span>}
        {poll.ended && <span className="ml-2 text-[10px] font-black uppercase tracking-widest bg-gray-600 text-white px-2 py-0.5 rounded-full">SELESAI</span>}
      </div>

      {/* Judul */}
      <div className="text-center w-full px-2">
        <div className="inline-block bg-slate-800/60 px-3 py-1 rounded-full text-xs text-slate-300 font-semibold mb-1">
          Vote • {total} suara • {poll.options.length} opsi
        </div>
        <h2 id="poll-question" className="text-xl md:text-2xl font-extrabold tracking-wide text-white">
          Vote for : <span className="font-normal text-slate-100">{poll.question}</span>
        </h2>
      </div>

      {/* Container utama - #abcfff */}
      <div className="flower-container w-full bg-[#abcfff] rounded-[38px] p-4 md:p-5 shadow-2xl space-y-3 border-2 border-[#cbe2ff]">
        {poll.options.map((opt: string, i: number) => {
          const v = poll.votes[i] || 0;
          const pct = total ? (v / total) * 100 : 0;
          const bar = barColors[i % barColors.length];
          const bBaseBg = badgeBaseBg[i % badgeBaseBg.length];
          const bBaseText = badgeBaseText[i % badgeBaseText.length];
          const bOverBg = badgeOverlayBg[i % badgeOverlayBg.length];
          const bOverText = badgeOverlayText[i % badgeOverlayText.length];
          const lOverText = labelOverlayText[i % labelOverlayText.length];
          const isWinning = total > 0 && v === Math.max(...poll.votes) && v > 0;
          const isWinnerEnded = poll.ended && isWinning;
          return (
            <div
              key={i}
              id={`poll-option-${i}`}
              className={`vote-option-card cursor-default bg-[#e0eeff] rounded-full p-1.5 shadow-md relative overflow-hidden ${isWinning ? 'ring-2 ring-white/60' : ''} ${isWinnerEnded ? 'poll-winner' : ''}`}
              style={{ border: isWinnerEnded ? `2px solid ${bar}` : isWinning ? `2px solid ${bar}` : 'none', animationDelay: `${i * 70}ms` } as any}
            >
              <div className="w-full h-11 md:h-12 bg-[#e0eeff] rounded-full relative overflow-hidden flex items-center">
                {/* BASE layer */}
                <div className="absolute inset-y-0 left-0 w-full z-0 flex items-center pl-2 space-x-2">
                  <div className="flower-badge shrink-0 w-9 h-9 md:w-10 md:h-10 text-sm md:text-base flex items-center justify-center" style={{ background: bBaseBg, color: bBaseText }}>
                    {v}
                  </div>
                  <span className="font-extrabold text-slate-900 text-base md:text-lg whitespace-nowrap truncate pr-2">{opt}</span>
                </div>
                {/* OVERLAY clip */}
                <div className="progress-bar-fill h-full rounded-full absolute left-0 top-0 overflow-hidden z-10" style={{ width: `${pct}%`, background: bar }}>
                  <div className="absolute inset-y-0 left-0 w-[420px] flex items-center pl-2 space-x-2 pointer-events-none">
                    <div className="flower-badge shrink-0 w-9 h-9 md:w-10 md:h-10 text-sm md:text-base flex items-center justify-center shadow-md" style={{ background: bOverBg, color: bOverText }}>
                      {v}
                    </div>
                    <span className="font-extrabold text-base md:text-lg whitespace-nowrap drop-shadow truncate pr-2" style={{ color: lOverText }}>{opt}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {showTotal && <div className="text-center text-[10px] font-black tracking-widest text-slate-600/70 uppercase pt-1">Ketik 1-{poll.options.length} di chat untuk vote</div>}
      </div>
    </div>
  );
}
