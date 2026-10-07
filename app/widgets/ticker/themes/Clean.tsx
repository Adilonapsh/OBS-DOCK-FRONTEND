import type { TickerThemeProps } from './types';
import { TickerTrack } from './TickerTrack';

export const themeMeta = { value: 'clean', label: 'Clean - Teks Polos' } as const;

export default function CleanTheme({ items, font, fontSize, accent, textColor, separator, speed, direction }: TickerThemeProps) {
  const text = textColor || '#ffffff';
  return (
    <div className="w-full py-1" style={{ fontFamily: `'${font}', sans-serif`, fontSize, color: text }}>
      <TickerTrack
        items={items}
        separator={separator}
        speed={speed}
        direction={direction}
        renderItem={(t) => <span className="font-medium whitespace-nowrap">{t}</span>}
      />
      <style>{`.ticker-sep{color:${accent};}`}</style>
    </div>
  );
}
