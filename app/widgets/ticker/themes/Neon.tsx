import type { TickerThemeProps } from './types';
import { TickerTrack } from './TickerTrack';

export const themeMeta = { value: 'neon', label: 'Neon - Glow Accent' } as const;

export default function NeonTheme({ items, font, fontSize, accent, bg, textColor, separator, speed, direction, showBadge, badgeText }: TickerThemeProps) {
  const barBg = bg === 'transparent' ? 'rgba(5,5,15,0.9)' : bg;
  const text = textColor || accent;
  return (
    <div
      className="w-full flex items-center gap-3 rounded-xl px-3 py-2 border overflow-hidden"
      style={{
        background: barBg,
        borderColor: `${accent}55`,
        boxShadow: `0 0 24px ${accent}33, inset 0 0 18px ${accent}11`,
        fontFamily: `'${font}', sans-serif`,
      }}
    >
      {showBadge && (
        <span
          className="shrink-0 px-2 py-0.5 rounded text-[0.7em] font-black tracking-widest uppercase border"
          style={{ color: accent, borderColor: `${accent}88`, fontSize: Math.max(10, fontSize * 0.7) }}
        >
          {badgeText || 'LIVE'}
        </span>
      )}
      <div className="flex-1 min-w-0" style={{ fontSize, color: text, textShadow: `0 0 12px ${accent}` }}>
        <TickerTrack
          items={items}
          separator={separator}
          speed={speed}
          direction={direction}
          renderItem={(t) => <span className="font-black tracking-wide whitespace-nowrap">{t}</span>}
        />
      </div>
      <style>{`.ticker-sep{color:${accent};text-shadow:0 0 12px ${accent};}`}</style>
    </div>
  );
}
