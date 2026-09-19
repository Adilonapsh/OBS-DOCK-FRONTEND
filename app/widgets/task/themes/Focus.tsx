import type { TaskThemeProps } from './types';
import './Focus.css';

export default function FocusTheme({ tasks, font, onToggleTask, onAddTask, anim = 'elegantIn', hideAnim, horizontal, inline, exitingIds, collapsedIds, autoCollapse, isExpanded }: TaskThemeProps) {
  const effectiveAnim = (horizontal ? (anim || 'elegantIn') : anim) || 'elegantIn';
  const hide = hideAnim || 'fadeOut';
  const getAnim = (id: string) => {
    const isExiting = exitingIds?.has(id);
    const name = isExiting ? hide : effectiveAnim;
    const isEleg = ['elegantIn','softPopIn','blurIn','luxeIn','elegantOut','softPopOut','blurOut','luxeOut'].includes(name);
    const d = isEleg ? '0.62s' : '0.4s';
    return `${name} ${d} cubic-bezier(0.16,1,0.3,1) both`;
  };
  const containerClass = horizontal ? 'w-full max-w-none flex flex-row flex-wrap gap-2 items-center' : 'w-full max-w-[330px] flex flex-col';
  const shouldCollapseView = !!(autoCollapse && !isExpanded);
  const nextTask = tasks.find(t => !t.completed && !collapsedIds?.has(t.id)) || tasks.find(t => !t.completed) || null;
  const displayTasks = tasks; // always render all for fade, hide others via opacity when collapsed

  if (horizontal || inline) {
    const pillClass = 'task-item px-3 py-2 flex items-center gap-2 rounded-full shrink-0 max-w-[280px] cursor-pointer';
    return (
      <div className={`${containerClass} gap-2`} style={{ fontFamily: `'Nunito','${font}', sans-serif` }}>
        {tasks.length === 0 ? (
          <div className="task-item px-3 py-2 rounded-full text-white/60 text-[12px] flex items-center gap-2 shrink-0" style={{ background: '#232d42', animation: getAnim('__empty__') }}>
            <span className="w-2 h-2 rounded-full bg-white/20 animate-pulse" /> Belum ada task
          </div>
        ) : shouldCollapseView && !nextTask ? (
          <div className="task-item px-3 py-2 rounded-full text-white/60 text-[12px] flex items-center gap-2 shrink-0" style={{ background: '#232d42', animation: getAnim('__empty__') }}>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Semua task selesai
          </div>
        ) : tasks.map((task) => {
          const isCollapsed = !!collapsedIds?.has(task.id);
          const isHidden = !!(shouldCollapseView && nextTask && task.id !== nextTask.id);
          const animName = isHidden || isCollapsed ? hide : getAnim(task.id).split(' ')[0];
          const animStyle = isHidden ? `${hide} 0.4s ease both` : isCollapsed ? `${hide} 0.4s ease both` : getAnim(task.id);
          return (
          <div key={task.id} onClick={() => onToggleTask?.(task.id)} className={`${pillClass} ${task.completed ? 'completed' : ''} ${isHidden ? 'opacity-0 max-h-0 pointer-events-none scale-95' : isCollapsed ? 'task-collapsed max-w-[160px] opacity-50 scale-[0.96]' : 'opacity-60'} transition-all duration-400`} style={{ background: '#232d42', animation: animStyle, maxHeight: isHidden ? '0px' : isCollapsed ? '32px' : undefined, overflow: isHidden || isCollapsed ? 'hidden' : undefined, marginBottom: isHidden ? '0' : undefined, paddingTop: isHidden ? '0' : undefined, paddingBottom: isHidden ? '0' : undefined }}>
            {task.completed ? (
              <div className="task-check w-4 h-4 rounded-full bg-white text-[#1a2233] flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
              </div>
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-white/60 shrink-0" />
            )}
            <span className={`task-text text-white text-[12px] font-bold truncate ${isCollapsed ? 'opacity-70' : ''}`}>{task.user ? `${task.user}: ${task.text}` : task.text}</span>
            {isCollapsed && !isHidden && <span className="ml-auto text-[9px] font-black uppercase text-white/40">collapsed</span>}
          </div>
        )})}
      </div>
    );
  }

  return (
    <div className="task-card w-full max-w-[330px] p-5 flex flex-col space-y-3 relative" style={{ fontFamily: `'Nunito','${font}', sans-serif`, animation: `${effectiveAnim} 0.62s cubic-bezier(0.16,1,0.3,1) both` }}>
      <div className="flex items-center justify-between text-white/80 px-1">
        <div className="w-4" />
        <div className="flex flex-col items-center space-y-1">
          <span className="text-[11px] font-black tracking-widest text-white uppercase">TASKS</span>
          <div className="flex space-x-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === 1 ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
        </div>
        <button onClick={() => { const t = prompt('Masukkan Tugas Baru:'); if (t && t.trim()) onAddTask?.(t.trim()); }} className="text-white/60 hover:text-white transition">
          <svg className="w-4 h-4 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        </button>
      </div>

      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
        {tasks.length === 0 ? (
          <div className="text-white/40 text-[11px] text-center py-4">Belum ada task</div>
        ) : shouldCollapseView && !nextTask ? (
          <div className="text-white/60 text-[11px] text-center py-2 flex items-center justify-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Semua task selesai</div>
        ) : tasks.map((task) => {
          const isCollapsed = !!collapsedIds?.has(task.id);
          const isHidden = !!(shouldCollapseView && nextTask && task.id !== nextTask.id);
          const animStyle = isHidden || isCollapsed ? `${hide} 0.4s ease both` : getAnim(task.id);
          return (
          <div
            key={task.id}
            onClick={() => onToggleTask?.(task.id)}
            className={`task-item px-3 py-2.5 flex items-center space-x-2.5 cursor-pointer text-xs font-bold will-change-transform hover:scale-[1.01] transition-all ${task.completed ? 'completed' : ''} ${isHidden ? 'opacity-0 max-h-0 !py-0 !my-0 pointer-events-none scale-95' : isCollapsed ? 'task-collapsed opacity-60 scale-[0.98] !py-1.5' : ''}`}
            style={{ animation: animStyle, maxHeight: isHidden ? '0px' : isCollapsed ? '36px' : undefined, overflow: isHidden || isCollapsed ? 'hidden' : undefined, marginBottom: isHidden ? '0' : undefined }}
          >
            {task.completed ? (
              <div className="task-check w-4 h-4 rounded-full bg-white text-[#1a2233] flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
              </div>
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-white/60 shrink-0" />
            )}
            {task.user ? (
              <span className={`task-text text-white truncate ${isCollapsed ? 'opacity-60 text-[11px]' : ''}`}><strong className="font-extrabold text-white/90">{task.user}:</strong> {task.text}</span>
            ) : (
              <span className={`task-text text-white/90 truncate ${isCollapsed ? 'opacity-60 text-[11px]' : ''}`}>{task.text}</span>
            )}
            {isCollapsed && !isHidden && <span className="ml-auto text-[8px] font-black uppercase tracking-widest text-white/30 shrink-0">collapsed</span>}
          </div>
        )})}
        {shouldCollapseView && nextTask && <div className="text-[9px] text-white/30 text-center uppercase tracking-widest">hanya task selanjutnya yang muncul • fade</div>}
      </div>
    </div>
  );
}
