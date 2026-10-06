import type { TaskThemeProps } from './types';

export default function BrutalistTaskTheme({
  tasks,
  font,
  fontSize,
  accent,
  onToggleTask,
  onAddTask,
  anim = 'elegantIn',
  hideAnim,
  horizontal,
  inline,
  exitingIds,
  collapsedIds,
  autoCollapse,
  isExpanded,
}: TaskThemeProps) {
  const effectiveAnim = (horizontal ? anim || 'elegantIn' : anim) || 'elegantIn';
  const hide = hideAnim || 'fadeOut';
  const getAnim = (id: string) => {
    const isExiting = exitingIds?.has(id);
    const name = isExiting ? hide : effectiveAnim;
    const isEleg = ['elegantIn', 'softPopIn', 'blurIn', 'luxeIn', 'elegantOut', 'softPopOut', 'blurOut', 'luxeOut'].includes(name);
    const d = isEleg ? '0.62s' : '0.4s';
    return `${name} ${d} cubic-bezier(0.16,1,0.3,1) both`;
  };
  const safeAccent = accent && accent !== 'transparent' ? accent : '#ff3b30';
  const containerClass = horizontal ? 'w-full max-w-none flex flex-row flex-wrap gap-3 items-start' : 'w-full max-w-[380px] flex flex-col';
  const shouldCollapseView = !!(autoCollapse && !isExpanded);
  const nextTask = tasks.find((t) => !t.completed && !collapsedIds?.has(t.id)) || tasks.find((t) => !t.completed) || null;
  const countDone = tasks.filter((t) => t.completed).length;

  const halftoneStyle: React.CSSProperties = {
    backgroundImage: 'radial-gradient(#000 1.2px, transparent 1.2px)',
    backgroundSize: '10px 10px',
    opacity: 0.06,
  };

  if (horizontal || inline) {
    const pillBase =
      'task-item px-3 py-2 flex items-center gap-2 shrink-0 max-w-[280px] cursor-pointer bg-white border-[3px] border-black';
    return (
      <div className={`${containerClass} gap-3`} style={{ fontFamily: `'${font}', sans-serif` }}>
        {tasks.length === 0 ? (
          <div
            className="task-item px-4 py-2 bg-white border-[4px] border-black text-black text-[12px] font-black uppercase tracking-wide flex items-center gap-2 shrink-0"
            style={{ boxShadow: '4px 4px 0 #000', animation: getAnim('__empty__') }}
          >
            <span className="w-3 h-3 border-[3px] border-black bg-white" /> Belum ada task
          </div>
        ) : shouldCollapseView && !nextTask ? (
          <div
            className="task-item px-4 py-2 bg-white border-[4px] border-black text-black text-[12px] font-black uppercase tracking-wide flex items-center gap-2 shrink-0"
            style={{ boxShadow: '4px 4px 0 #000', animation: getAnim('__empty__') }}
          >
            <span className="w-3 h-3 bg-black border-[3px] border-black" /> Semua task selesai
          </div>
        ) : (
          tasks.map((task) => {
            // saat collapse hanya nextTask yang muncul (task 3 jika 1&2 done) sisanya hilang;
            // tapi saat baru checklist (isExpanded true) semua muncul dicoret
            const isCollapsed = !!collapsedIds?.has(task.id) && !task.completed;
            const isHidden = !!(shouldCollapseView && nextTask && task.id !== nextTask.id);
            const animStyle = isHidden || isCollapsed ? `${hide} 0.4s ease both` : getAnim(task.id);
            return (
              <div
                key={task.id}
                onClick={() => onToggleTask?.(task.id)}
                className={`${pillBase} ${task.completed ? 'opacity-70' : ''} ${isHidden ? 'opacity-0 max-h-0 pointer-events-none scale-95 !py-0 !my-0 overflow-hidden' : isCollapsed ? 'task-collapsed max-w-[160px] opacity-60 scale-[0.96] !py-1.5' : ''} relative overflow-hidden hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform`}
                style={{
                  boxShadow: '4px 4px 0 #000',
                  animation: animStyle,
                  maxHeight: isHidden ? '0px' : isCollapsed ? '32px' : undefined,
                  textDecoration: task.completed ? 'line-through' : undefined,
                }}
              >
                <div aria-hidden className="pointer-events-none absolute inset-0" style={halftoneStyle} />
                {task.completed ? (
                  <div className="w-5 h-5 bg-black border-[2px] border-black flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 stroke-[3] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-5 h-5 bg-white border-[3px] border-black shrink-0" />
                )}
                <span className={`task-text text-black text-[12px] font-black truncate relative ${isCollapsed ? 'opacity-60 text-[11px]' : ''}`}>
                  {task.user ? `${task.user}: ${task.text}` : task.text}
                </span>
                {isCollapsed && !isHidden && (
                  <span className="ml-auto text-[8px] font-black uppercase tracking-widest text-black/40 relative">collapsed</span>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div
      className="task-brutalist w-full max-w-[380px] flex flex-col relative"
      style={{ fontFamily: `'${font}', sans-serif`, animation: `${effectiveAnim} 0.62s cubic-bezier(0.16,1,0.3,1) both` }}
    >
      <div className="bg-white border-[4px] border-black relative overflow-hidden flex flex-col" style={{ boxShadow: '6px 6px 0 #000' }}>
        <div aria-hidden className="pointer-events-none absolute inset-0" style={halftoneStyle} />
        {/* top accent bar */}
        <div className="h-[10px] w-full border-b-[4px] border-black shrink-0" style={{ background: safeAccent }} />

        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-[4px] border-black bg-white relative">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-black text-white text-[10px] font-black tracking-widest uppercase">TASKS</span>
            <span className="text-[11px] font-black tracking-widest uppercase text-black">
              {countDone}/{tasks.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest text-black/50">{autoCollapse && !isExpanded ? 'NEXT ONLY' : `${tasks.length} ITEMS`}</span>
          </div>
        </div>

        {/* dots decoration */}
        <div className="flex gap-1 px-4 py-2 border-b-[3px] border-black bg-white/80 relative">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="w-2 h-2 border-[2px] border-black" style={{ background: i === 1 ? safeAccent : i === 0 ? '#000' : '#fff' }} />
          ))}
        </div>

        {/* list */}
        <div className="p-3 space-y-3 bg-[#f7f7f5] relative">
          {tasks.length === 0 ? (
            <div
              className="px-3 py-4 bg-white border-[3px] border-black text-black text-[12px] font-black uppercase tracking-wide text-center"
              style={{ boxShadow: '4px 4px 0 #000' }}
            >
              Belum ada task — tambah dulu!
            </div>
          ) : shouldCollapseView && !nextTask ? (
            <div
              className="px-3 py-3 bg-white border-[3px] border-black text-black text-[12px] font-black uppercase tracking-wide flex items-center justify-center gap-2"
              style={{ boxShadow: '4px 4px 0 #000' }}
            >
              <span className="w-3 h-3 bg-black border-[2px] border-black" /> Semua task selesai
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                {tasks.map((task) => {
                  // saat collapse hanya nextTask yang muncul; checklist tidak hilang — dicoret, hanya hilang saat collapse
                  const isCollapsed = !!collapsedIds?.has(task.id) && !task.completed;
                  const isHidden = !!(shouldCollapseView && nextTask && task.id !== nextTask.id);
                  const animStyle = isHidden || isCollapsed ? `${hide} 0.4s ease both` : getAnim(task.id);
                  return (
                    <div
                      key={task.id}
                      onClick={() => onToggleTask?.(task.id)}
                      className={`group relative flex items-center gap-3 px-3 py-3 bg-white border-[3px] border-black cursor-pointer will-change-transform hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform ${task.completed ? 'opacity-70' : ''} ${isHidden ? 'opacity-0 max-h-0 !py-0 !my-0 pointer-events-none scale-95 overflow-hidden' : isCollapsed ? 'task-collapsed opacity-60 scale-[0.98] !py-2' : ''}`}
                      style={{
                        boxShadow: '4px 4px 0 #000',
                        animation: animStyle,
                        maxHeight: isHidden ? '0px' : isCollapsed ? '44px' : undefined,
                        overflow: isHidden || isCollapsed ? 'hidden' : undefined,
                      }}
                    >
                      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.04]" style={halftoneStyle} />
                      {task.completed ? (
                        <div className="w-6 h-6 bg-black border-[3px] border-black flex items-center justify-center shrink-0 relative">
                          <svg className="w-3.5 h-3.5 stroke-[3] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-white border-[3px] border-black shrink-0 relative group-hover:bg-black transition-colors" />
                      )}
                      <span
                        className={`flex-1 min-w-0 truncate font-black text-[13px] leading-tight relative ${task.completed ? 'line-through text-black/60' : 'text-black'}`}
                        style={{ fontSize: `${fontSize}px` }}
                      >
                        {task.user ? (
                          <>
                            <span className="font-black text-black">{task.user}:</span> {task.text}
                          </>
                        ) : (
                          task.text
                        )}
                      </span>
                      {isCollapsed && !isHidden && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-black/30 shrink-0 relative">collapsed</span>
                      )}
                      {/* accent left stripe */}
                      <span className="absolute left-0 top-0 bottom-0 w-1.5 border-r-[3px] border-black" style={{ background: task.completed ? '#000' : safeAccent }} />
                    </div>
                  );
                })}
              </div>

            </>
          )}
        </div>

        {/* footer */}
        <div className="h-8 bg-black text-white flex items-center justify-between px-3 text-[9px] font-black tracking-widest uppercase">
          <span>
            {tasks.filter((t) => !t.completed).length} REMAINING
          </span>
        </div>
      </div>
    </div>
  );
}
