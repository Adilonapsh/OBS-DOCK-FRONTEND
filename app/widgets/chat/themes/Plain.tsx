import type { ChatThemeProps } from './types';

function timeLabel(ts?: number) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function PlainTheme({ chats, font, accent, fontSize, maxMessages, showTimestamp, exitingIds }: ChatThemeProps) {
  const visible = chats.slice(-maxMessages);
  return (
    <>
      <style>{`@keyframes plainFadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div
        className="w-full max-w-[420px] flex flex-col gap-1"
        style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px`, background: 'transparent' }}
      >
        {visible.map((c) => {
          const isExiting = exitingIds?.has(c.id);
          return (
            <div
              key={c.id}
              style={{
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                padding: 0,
                margin: 0,
                animation: 'plainFadeIn 0.3s ease both',
                opacity: isExiting ? 0 : 1,
                transition: 'opacity 0.3s ease',
                lineHeight: 1.4,
                wordBreak: 'break-word',
              }}
            >
              <span style={{ color: accent, fontWeight: 700 }}>{c.nickname}</span>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}> • </span>
              <span style={{ color: '#fff' }}>{c.comment}</span>
              {showTimestamp && c.timestamp ? (
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75em', marginLeft: 6, fontFamily: 'monospace' }}>
                  {timeLabel(c.timestamp)}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
