import { StreamBarBase } from './StreamBarBase';
import type { StreamBarPalette, StreamBarThemeProps } from './types';

export const themeMeta = { value: 'minimal', label: 'Minimal - Slate' } as const;

const PALETTE: StreamBarPalette = {
  barFrom: '#1e293b',
  barTo: '#0f172a',
  barEdge: '#334155',
  teal: '#67e8f9',
  blue: '#60a5fa',
  text: '#f8fafc',
  muted: '#94a3b8',
  panelFrom: '#1e293b',
  panelTo: '#0f172a',
  panelBorder: '#334155',
  cardBg: '#0f172a',
  iconBg: '#1e293b',
  iconBorder: '#475569',
  chipBg: 'rgba(15, 23, 42, 0.9)',
  chipText: '#e2e8f0',
  marqueeSep: 'rgba(255, 255, 255, 0.25)',
  radius: 18,
  shadow: '0 10px 30px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
};

export default function MinimalTheme(props: StreamBarThemeProps) {
  return <StreamBarBase {...props} palette={PALETTE} />;
}
