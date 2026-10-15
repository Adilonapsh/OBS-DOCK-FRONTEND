import type { CSSProperties } from 'react';
import type { TaskThemeProps } from './types';

export type FlatlineTaskExtra = {
  taskFlatPill?: string;
  taskFlatBright?: string;
  taskFlatDim?: string;
  taskFlatLine?: string;
  taskFlatLineDone?: string;
  taskFlatChevron?: boolean;
  taskFlatUppercase?: boolean;
};

// Flatline Pill — 1:1 port dari HTML user (task-pill + wipe bright->dim + strikethrough + chevron >>).
// Klik pill = toggle completed (optimistic + sync socket via onToggleTask dari display).
export default function FlatlineTaskTheme({
  tasks,
  font,
  fontSize,
  onToggleTask,
  anim = 'elegantIn',
  hideAnim,
  horizontal,
  inline,
  exitingIds,
  collapsedIds,
  autoCollapse,
  isExpanded,
  taskFlatPill,
  taskFlatBright,
  taskFlatDim,
  taskFlatLine,
  taskFlatLineDone,
  taskFlatChevron,
  taskFlatUppercase,
}: TaskThemeProps & FlatlineTaskExtra) {
  const eff = anim || 'elegantIn';
  const hide = hideAnim || 'fadeOut';
  const getAnim = (id: string) => {
    const name = exitingIds?.has(id) ? hide : eff;
    const isEleg = ['elegantIn', 'softPopIn', 'blurIn', 'luxeIn', 'elegantOut', 'softPopOut', 'blurOut', 'luxeOut'].includes(name);
    return `${name} ${isEleg ? '0.62s' : '0.4s'} cubic-bezier(0.16,1,0.3,1) both`;
  };

  const pill = taskFlatPill || '#2b2f4a';
  const bright = taskFlatBright || '#ffffff';
  const dim = taskFlatDim || '#4b5171';
  const line = taskFlatLine || '#ffffff';
  const lineDone = taskFlatLineDone || '#8c92b3';
  const showChevron = taskFlatChevron ?? true;
  const uppercase = taskFlatUppercase ?? true;

  const scale = fontSize ? fontSize / 14 : 1;
  const textSize = Math.round(18 * Math.min(1.3, Math.max(0.7, scale)));
  const rowMode = !!(horizontal || inline);

  const shouldCollapseView = !!(autoCollapse && !isExpanded);
  const nextTask = tasks.find((t) => !t.completed && !collapsedIds?.has(t.id)) || tasks.find((t) => !t.completed) || null;
  const countDone = tasks.filter((t) => t.completed).length;

  const renderPill = (task: (typeof tasks)[number]) => {
    const isCollapsed = !!collapsedIds?.has(task.id) && !task.completed;
    const isHidden = !!((shouldCollapseView && nextTask && task.id !== nextTask.id) || exitingIds?.has(task.id));
    const label = task.user ? `${task.user}: ${task.text}` : task.text;
    return (
      <div
        key={task.id}
        onClick={isHidden ? undefined : () => onToggleTask?.(task.id)}
        title={label}
        aria-hidden={isHidden || undefined}
        className={`task-flat-pill ${task.completed ? 'done' : ''} ${isCollapsed && !isHidden ? 'opacity-60' : ''}`}
        style={
          {
            '--tf-pill': pill,
            '--tf-bright': bright,
            '--tf-dim': dim,
            '--tf-line': line,
            '--tf-line-done': lineDone,
            backgroundColor: pill,
            padding: '25px 32px',
            borderRadius: 12,
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            animation: isHidden ? `${hide} 0.4s ease both` : getAnim(task.id),
            maxWidth: '100%',
            overflow: 'hidden',
            // Collapse anim (tanpa unmount): tinggi + padding + margin di-transition biar menciut halus
            maxHeight: isHidden ? 0 : 140,
            paddingTop: isHidden ? 0 : undefined,
            paddingBottom: isHidden ? 0 : undefined,
            marginTop: isHidden && !rowMode ? -12 : undefined,
            opacity: isHidden ? 0 : undefined,
            pointerEvents: isHidden ? 'none' : undefined,
            transition: 'max-height 0.45s ease, padding 0.45s ease, margin 0.45s ease, opacity 0.4s ease, transform 0.2s ease, box-shadow 0.2s ease',
          } as CSSProperties
        }
      >
        <span className="tf-text" style={{ fontSize: textSize, textTransform: uppercase ? 'uppercase' : 'none', marginLeft: -15 }}>
          <span className="tf-dim" >
            {showChevron && (
              <span className="tf-chev" aria-hidden>
                <svg viewBox="0 0 24 24" className="tf-chev-svg"><path d="M9 5l7 7-7 7" /></svg>
                <svg viewBox="0 0 24 24" className="tf-chev-svg tf-chev-delay"><path d="M9 5l7 7-7 7" /></svg>
              </span>
            )}
            {label}
          </span>
          <span className="tf-bright" aria-hidden>
            {showChevron && (
              <span className="tf-chev" aria-hidden>
                <svg viewBox="0 0 24 24" className="tf-chev-svg"><path d="M9 5l7 7-7 7" /></svg>
                <svg viewBox="0 0 24 24" className="tf-chev-svg tf-chev-delay"><path d="M9 5l7 7-7 7" /></svg>
              </span>
            )}
            {label}
          </span>
          <span className="tf-line" aria-hidden />
        </span>
      </div>
    );
  };

  const emptyPill = (text: string) => (
    <div
      className="task-flat-pill"
      style={
        {
          '--tf-pill': pill,
          '--tf-bright': bright,
          '--tf-dim': dim,
          '--tf-line': line,
          '--tf-line-done': lineDone,
          backgroundColor: pill,
            padding: '22px 32px',
          borderRadius: 12,
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          animation: getAnim('__empty__'),
          maxWidth: '100%',
          overflow: 'hidden',
          cursor: 'default',
        } as CSSProperties
      }
    >
      <span className="tf-text" style={{ fontSize: Math.round(textSize * 0.8), textTransform: 'uppercase' }}>
        <span className="tf-bright" style={{ position: 'static', clipPath: 'none' }}>
          {text}
        </span>
      </span>
    </div>
  );

  return (
    <div
      className={rowMode ? 'w-full max-w-none flex flex-row flex-wrap gap-3 items-start' : 'w-full max-w-[380px] flex flex-col gap-3'}
      style={{ fontFamily: `'${font}', 'Montserrat', sans-serif` }}
    >
      <style>{`.task-flat-pill{position:relative;cursor:pointer;user-select:none;transition:transform 0.2s ease,box-shadow 0.2s ease}.task-flat-pill:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.15)}.task-flat-pill:active{transform:translateY(1px)}.tf-text{position:relative;display:inline-block;max-width:100%;font-weight:800;letter-spacing:1px}.tf-dim{color:var(--tf-dim);display:block;white-space:nowrap}.tf-bright{position:absolute;top:0;left:0;color:var(--tf-bright);white-space:nowrap;clip-path:inset(0 0 0 0);transition:clip-path 0.5s cubic-bezier(0.4,0,0.2,1)}.task-flat-pill.done .tf-bright{clip-path:inset(0 0 0 100%)}.tf-line{position:absolute;top:50%;left:0;width:0;height:2px;background:var(--tf-line);transform:translateY(-50%);transition:width 0.5s cubic-bezier(0.4,0,0.2,1);border-radius:2px;pointer-events:none}.task-flat-pill.done .tf-line{width:100%;background:var(--tf-line-done)}.tf-chev{display:inline-flex;align-items:center;vertical-align:middle;gap:0;margin-right:6px;margin-top:-2px}.tf-chev-svg{width:0.85em;height:0.85em;fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;animation:tfPulse 1.2s infinite ease-in-out}.tf-chev-delay{margin-left:-0.38em;animation-delay:0.3s}@keyframes tfPulse{0%,100%{opacity:0.2}50%{opacity:1}}`}</style>
      <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: dim }}>
        TASKS {countDone}/{tasks.length}
      </div>
      {tasks.length === 0 ? (
        emptyPill('Belum ada task')
      ) : shouldCollapseView && !nextTask ? (
        emptyPill('Semua task selesai')
      ) : (
        tasks.map(renderPill)
      )}
    </div>
  );
}
