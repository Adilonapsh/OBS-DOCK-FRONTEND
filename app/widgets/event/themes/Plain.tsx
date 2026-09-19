import type { EventThemeProps } from './types';

function actionText(e: EventThemeProps['events'][number]): string {
  if (e.type === 'gift') return `mengirim ${e.giftName || 'Gift'} ×${e.repeatCount ?? 1}`;
  if (e.type === 'like') return `menyukai ×${e.likeCount ?? 1}`;
  return 'bergabung';
}

export default function PlainTheme({ events, font, accent, fontSize, maxEvents, horizontal, inline, exitingIds }: EventThemeProps) {
  const visible = events.slice(-maxEvents);
  const isRow = Boolean(horizontal || inline);
  return (
    <>
      <style>{`@keyframes plainFadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div
        className={isRow ? 'w-full max-w-none flex flex-row flex-wrap gap-x-3 gap-y-1 items-center content-start' : 'w-full max-w-[420px] flex flex-col gap-1'}
        style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px`, background: 'transparent' }}
      >
        {visible.map((e) => {
          const isExiting = exitingIds?.has(e.id);
          return (
            <div
              key={e.id}
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
              <span style={{ color: accent, fontWeight: 700 }}>{e.nickname}</span>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}> • </span>
              <span style={{ color: '#fff' }}>{actionText(e)}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
