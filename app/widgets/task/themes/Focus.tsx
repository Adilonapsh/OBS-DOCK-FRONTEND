import type { TaskThemeProps } from './types';
import './Focus.css';

export default function FocusTheme({ tasks, font, onToggleTask, onAddTask, anim = 'elegantIn', hideAnim, horizontal, inline, exitingIds }: TaskThemeProps) {
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

  if (horizontal || inline) {
    const pillClass = 'task-item px-3 py-2 flex items-center gap-2 rounded-full shrink-0 max-w-[280px] cursor-pointer';
    return (
      <div className={`${containerClass} gap-2`} style={{ fontFamily: `'Nunito','${font}', sans-serif` }}>
        {tasks.length === 0 ? (
          <div className="task-item px-3 py-2 rounded-full text-white/60 text-[12px] flex items-center gap-2 shrink-0" style={{ background: '#232d42', animation: getAnim('__empty__') }}>
            <span className="w-2 h-2 rounded-full bg-white/20 animate-pulse" /> Belum ada task
          </div>
        ) : tasks.map((task) => (
          <div key={task.id} onClick={() => onToggleTask?.(task.id)} className={`${pillClass} ${task.completed ? 'completed opacity-60' : ''}`} style={{ background: '#232d42', animation: getAnim(task.id) }}>
            {task.completed ? (
              <div className="task-check w-4 h-4 rounded-full bg-white text-[#1a2233] flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
              </div>
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-white/60 shrink-0" />
            )}
            <span className="task-text text-white text-[12px] font-bold truncate">{task.user ? `${task.user}: ${task.text}` : task.text}</span>
          </div>
        ))}
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
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onToggleTask?.(task.id)}
            className={`task-item px-3 py-2.5 flex items-center space-x-2.5 cursor-pointer text-xs font-bold will-change-transform hover:scale-[1.01] transition-all ${task.completed ? 'completed' : ''}`}
            style={{ animation: getAnim(task.id) }}
          >
            {task.completed ? (
              <div className="task-check w-4 h-4 rounded-full bg-white text-[#1a2233] flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
              </div>
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-white/60 shrink-0" />
            )}
            {task.user ? (
              <span className="task-text text-white truncate"><strong className="font-extrabold text-white/90">{task.user}:</strong> {task.text}</span>
            ) : (
              <span className="task-text text-white/90 truncate">{task.text}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
