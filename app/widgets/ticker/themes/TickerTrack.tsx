// Helper presentational - track marquee seamless (konten diduplikasi 2x, geser -50%).
// BUKAN theme (tanpa themeMeta) jadi di-skip codegen registry.
import type { ReactNode } from 'react';

type Props = {
  items: string[];
  separator: string;
  speed: number; // detik per loop
  direction: 'left' | 'right';
  renderItem: (text: string, key: string) => ReactNode;
  className?: string;
};

export function TickerTrack({ items, separator, speed, direction, renderItem, className }: Props) {
  const list = items.length > 0 ? items : ['Ticker'];
  const row = (prefix: string) =>
    list.map((t, i) => (
      <span key={`${prefix}-${i}`} className="flex items-center shrink-0">
        {renderItem(t, `${prefix}-${i}`)}
        <span className="ticker-sep mx-4 shrink-0" aria-hidden>{separator || '•'}</span>
      </span>
    ));
  return (
    <div className={`overflow-hidden w-full ${className || ''}`}>
      <div
        className="ticker-marquee flex w-max items-center"
        style={{
          animationDuration: `${Math.max(3, Math.min(120, speed || 20))}s`,
          animationDirection: direction === 'right' ? 'reverse' : 'normal',
        }}
      >
        {row('a')}
        {row('b')}
      </div>
    </div>
  );
}
