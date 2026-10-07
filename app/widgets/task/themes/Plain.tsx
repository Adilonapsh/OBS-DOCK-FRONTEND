import type { TaskThemeProps } from './types';
import './Plain.css';

export default function PlainTheme({ tasks, font, fontSize, accent, textColor, onToggleTask }: TaskThemeProps) {
  const color = textColor || '#ffffff';
  const size = fontSize || 14;
  if (tasks.length === 0) {
    return (
      <div className="task-plain-theme w-full max-w-[360px]" style={{ fontFamily: `'${font}', sans-serif`, background: 'transparent' }}>
        <div style={{ color, fontSize: `${size}px` }}>Belum ada task</div>
      </div>
    );
  }
  return (
    <div className="task-plain-theme w-full max-w-[360px] flex flex-col gap-0.5" style={{ fontFamily: `'${font}', sans-serif`, background: 'transparent' }}>
      {tasks.map((t) => (
        <div
          key={t.id}
          onClick={() => onToggleTask?.(t.id)}
          className="leading-relaxed cursor-pointer"
          style={{ color, fontSize: `${size}px`, textDecoration: t.completed ? 'line-through' : 'none', opacity: t.completed ? 0.6 : 1 }}
        >
          <span className="font-bold tabular-nums" style={{ color: accent }}>{t.completed ? '[x]' : '[ ]'}</span>{' '}
          <span>{t.user ? `${t.user}: ${t.text}` : t.text}</span>
        </div>
      ))}
    </div>
  );
}
