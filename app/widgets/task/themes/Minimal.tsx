import type { TaskThemeProps } from './types';
import './Minimal.css';

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function MinimalTheme({ tasks, font, onToggleTask, anim, hideAnim, horizontal, inline, exitingIds }: TaskThemeProps) {
  const effectiveAnim = (horizontal ? (anim || 'elegantIn') : anim) || 'elegantIn';
  const hide = hideAnim || 'fadeOut';
  const getAnim = (id: string) => {
    const isExiting = exitingIds?.has(id);
    const name = isExiting ? hide : effectiveAnim;
    const isEleg = ['elegantIn','softPopIn','blurIn','luxeIn','elegantOut','softPopOut','blurOut','luxeOut'].includes(name);
    return `${name} ${isEleg ? '0.62s' : '0.4s'} cubic-bezier(0.16,1,0.3,1) both`;
  };
  const containerClass = horizontal ? 'w-full max-w-none flex flex-row flex-wrap gap-2 items-center' : 'w-full max-w-[360px] flex flex-col gap-1.5';
  if (horizontal || inline) {
    return (
      <div className={`task-minimal-theme ${containerClass} p-2`} style={{ fontFamily: `'${font}', sans-serif` }}>
        {tasks.length === 0 ? (
          <div className="px-3 py-2 rounded-full bg-black text-white/60 text-[11px] border border-white/10">Belum ada task</div>
        ) : tasks.map((t) => (
          <div key={t.id} onClick={() => onToggleTask?.(t.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shrink-0 max-w-[280px] cursor-pointer ${t.completed ? 'opacity-50 line-through' : ''}`} style={{ background: '#232d42', borderColor: 'rgba(255,255,255,0.08)', animation: getAnim(t.id) }}>
            <span className={`w-4 h-4 rounded-full border-2 grid place-items-center shrink-0 ${t.completed ? 'bg-white border-white text-black' : 'border-white/30'}`}>{t.completed && <span className="text-[10px]">✓</span>}</span>
            <span className="text-white text-[11px] font-bold truncate">{t.user ? `${t.user}: ${t.text}` : t.text}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="task-minimal-theme w-full max-w-[360px] bg-[#121212] border border-white/10 rounded-2xl p-5 space-y-3" style={{ fontFamily: `'${font}', sans-serif` }}>
      <div className="flex items-center justify-between">
        <span className="text-white font-black text-[11px] uppercase tracking-widest">Tasks • {tasks.length}</span>
        <span className="text-gray-500 text-[10px] font-bold">{tasks.filter((t) => t.completed).length} done</span>
      </div>
      <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
        {tasks.map((t) => (
          <div key={t.id} onClick={() => onToggleTask?.(t.id)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-[12px] font-bold ${t.completed ? 'bg-white/5 border-white/5 opacity-60 completed text-gray-400' : 'bg-white/10 border-white/10 text-white'}`} style={{ animation: getAnim(t.id) }}>
            <span className={`w-4 h-4 rounded-full border-2 grid place-items-center shrink-0 ${t.completed ? 'bg-white border-white text-black task-check' : 'border-white/30'}`}>{t.completed && <span className="text-[10px]">✓</span>}</span>
            <span className="task-text truncate flex-1">{t.user ? `${t.user}: ${t.text}` : t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
