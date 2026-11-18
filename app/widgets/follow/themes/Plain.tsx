import type { FollowThemeProps } from './types';

export default function PlainTheme({ follows, font, accent, fontSize, maxFollows, horizontal, inline, exitingIds }: FollowThemeProps) {
  const visible = follows.slice(-maxFollows);
  const isRow = Boolean(horizontal || inline);
  return (
    <>
      <style>{`@keyframes plainFadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div
        className={isRow ? 'w-full max-w-none flex flex-row flex-wrap gap-x-3 gap-y-1 items-center content-start' : 'w-full max-w-[420px] flex flex-col gap-1'}
        style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px`, background: 'transparent' }}
      >
        {visible.map((f) => {
          const isExiting = exitingIds?.has(f.id);
          return (
            <div
              key={f.id}
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
              <span style={{ color: accent, fontWeight: 700 }}>{f.nickname}</span>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}> • </span>
              <span style={{ color: '#fff' }}>{f.label || 'mengikuti'}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
