import type { TaskThemeProps } from './types';
import { hexToRgba, resolveTextColor } from '../../_shared/utils/color';
import './Glass.css';

export default function GlassTheme({ tasks, font, fontSize, accent, bg, bgOpacity, textColor, onToggleTask, onAddTask, anim = 'elegantIn', hideAnim, horizontal, inline, exitingIds, collapsedIds, autoCollapse, isExpanded }: TaskThemeProps) {
  const effectiveAnim = (horizontal ? (anim || 'elegantIn') : anim) || 'elegantIn';
  const hide = hideAnim || 'fadeOut';
  const getAnim = (id: string) => {
    const isExiting = exitingIds?.has(id);
    const name = isExiting ? hide : effectiveAnim;
    const isEleg = ['elegantIn','softPopIn','blurIn','luxeIn','elegantOut','softPopOut','blurOut','luxeOut'].includes(name);
    const d = isEleg ? '0.62s' : '0.4s';
    return `${name} ${d} cubic-bezier(0.16,1,0.3,1) both`;
  };
  const color = resolveTextColor(textColor, '#ffffff');
  const glassBg = bg && bg !== 'transparent' ? hexToRgba(bg, bgOpacity) : accent && accent !== 'transparent' ? hexToRgba(accent, Math.round(bgOpacity * 0.45)) : hexToRgba('#939eff', Math.round(bgOpacity * 0.45));
  const glassBorder = `${color}66`;
  const countTotal = tasks.length;
  const countDone = tasks.filter(t=>t.completed).length;

  const containerClass = horizontal ? 'w-full max-w-none flex flex-row flex-wrap gap-2 items-center' : 'w-full max-w-[380px] flex flex-col';
  const shouldCollapseView = !!(autoCollapse && !isExpanded);
  const nextTask = tasks.find(t => !t.completed && !collapsedIds?.has(t.id)) || tasks.find(t => !t.completed) || null;

  // Glass card wrapper - mirip timer Glass: blur + border 2px + radius 36px
  return (
    <div className="task-glass-theme w-full max-w-[420px] flex flex-col items-center gap-3 select-none" style={{ fontFamily: `'Nunito','${font}', sans-serif` }}>
      <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black tracking-widest uppercase will-change-transform" style={{ background: 'rgba(255,255,255,0.85)', color: '#2b2b42', backdropFilter: 'blur(6px)' }}>
        <span className="w-2 h-2 rounded-full" style={{ background: accent || '#939eff' }} />
        TASKS • {countDone}/{countTotal} {autoCollapse ? '• next only' : ''}
      </div>

      <div className="task-glass-card w-full p-4 sm:p-5 flex flex-col gap-3" style={{ background: glassBg, borderColor: glassBorder }}>
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black tracking-widest uppercase" style={{ color: `${color}CC` }}>MY TASKS</span>
          <button onClick={() => { const t = prompt('Masukkan Tugas Baru:'); if (t && t.trim()) onAddTask?.(t.trim()); }} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 grid place-items-center text-white transition">
            <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m-8-6h16" /></svg>
          </button>
        </div>

        <div className={`${containerClass} gap-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar`} style={{ fontSize: `${fontSize}px` }}>
          {tasks.length === 0 ? (
            <div className="task-glass-item px-3 py-2.5 rounded-2xl text-white/60 text-[12px] flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.12)', border: `1px solid ${color}1A`, animation: getAnim('__empty__') }}>
              <span className="w-2 h-2 rounded-full bg-white/20 animate-pulse" /> Belum ada task
            </div>
          ) : shouldCollapseView && !nextTask ? (
            <div className="task-glass-item px-3 py-2.5 rounded-2xl text-white/60 text-[12px] flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.12)', border: `1px solid ${color}1A`, animation: getAnim('__empty__') }}>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Semua task selesai
            </div>
          ) : tasks.map((task) => {
            const isCollapsed = !!collapsedIds?.has(task.id);
            const isHidden = !!(shouldCollapseView && nextTask && task.id !== nextTask.id);
            const animStyle = isHidden || isCollapsed ? `${hide} 0.4s ease both` : getAnim(task.id);
            return (
            <div
              key={task.id}
              onClick={() => onToggleTask?.(task.id)}
              className={`task-glass-item px-3 py-2.5 flex items-center gap-2.5 cursor-pointer will-change-transform hover:scale-[1.01] transition-all ${task.completed ? 'opacity-60' : ''} ${isHidden ? 'opacity-0 max-h-0 !py-0 !my-0 pointer-events-none scale-95' : isCollapsed ? 'task-collapsed opacity-50 scale-[0.98] !py-1.5' : ''}`}
              style={{ background: isHidden ? 'transparent' : isCollapsed ? 'rgba(255,255,255,0.06)' : task.completed ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.16)', border: `1px solid ${color}1A`, borderRadius: '16px', animation: animStyle, maxHeight: isHidden ? '0px' : isCollapsed ? '36px' : undefined, overflow: isHidden || isCollapsed ? 'hidden' : undefined }}
            >
              {task.completed ? (
                <div className="w-5 h-5 rounded-full bg-white text-[#2b2b42] flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 shrink-0" style={{ borderColor: `${color}99`, background: 'rgba(255,255,255,0.08)' }} />
              )}
              <span className={`flex-1 min-w-0 truncate font-bold ${isCollapsed ? 'opacity-60 text-[11px]' : ''}`} style={{ color, fontSize: `${fontSize}px`, textDecoration: task.completed ? 'line-through' : undefined, opacity: isHidden ? 0 : isCollapsed ? 0.6 : task.completed ? 0.7 : 1 }}>
                {task.user ? <><span className="font-extrabold" style={{ color }}>{task.user}:</span> {task.text}</> : task.text}
              </span>
              {isCollapsed && !isHidden && <span className="text-[8px] font-black uppercase tracking-widest text-white/40 shrink-0">collapsed</span>}
            </div>
          )})}
          {shouldCollapseView && nextTask && <div className="text-[9px] text-white/40 text-center uppercase tracking-widest">hanya task selanjutnya yang muncul • fade</div>}
        </div>
      </div>
    </div>
  );
}
