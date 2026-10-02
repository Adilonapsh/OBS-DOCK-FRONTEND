import type { TickerThemeProps } from './types';
import { TickerTrack } from './TickerTrack';

export const themeMeta = { value: 'standard', label: 'Standard - Bar + Badge' } as const;

export default function StandardTheme({ items, font, fontSize, accent, bg, textColor, separator, speed, direction, showBadge, badgeText }: TickerThemeProps) {
  const barBg = bg === 'transparent' ? 'rgba(10,10,10,0.85)' : bg;
  const text = textColor || '#ffffff';
  return (
    <div
      className="w-full flex items-stretch gap-0 rounded-xl overflow-hidden border border-white/10"
      style={{ background: barBg, borderLeft: `4px solid ${accent}`, fontFamily: `'${font}', sans-serif` }}
    >
      {showBadge && (
        <div
          className="shrink-0 self-center ml-2 px-2.5 py-1 rounded-full text-[0.7em] font-black tracking-widest uppercase"
          style={{ background: accent, color: '#000', fontSize }}
        >
          {badgeText || 'INFO'}
        </div>
      )}
      <div className="flex-1 min-w-0 flex items-center py-2" style={{ fontSize, color: text }}>
        <TickerTrack
          items={items}
          separator={separator}
          speed={speed}
          direction={direction}
          renderItem={(t) => <span className="font-bold whitespace-nowrap">{t}</span>}
        />
      </div>
      <style>{`.ticker-sep{color:${accent};}`}</style>
    </div>
  );
}
