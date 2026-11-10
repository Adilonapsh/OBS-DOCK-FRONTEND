import { StreamBarBase } from './StreamBarBase';
import type { StreamBarPalette, StreamBarThemeProps } from './types';

export const themeMeta = { value: 'neon', label: 'Neon - Cyber Violet' } as const;

const PALETTE: StreamBarPalette = {
  barFrom: '#1a0b2e',
  barTo: '#0b0620',
  barEdge: '#4c1d95',
  teal: '#22d3ee',
  blue: '#a78bfa',
  text: '#ecfeff',
  muted: '#c4b5fd',
  panelFrom: '#2a1052',
  panelTo: '#150a33',
  panelBorder: '#7c3aed',
  cardBg: '#120726',
  iconBg: '#1e0b3a',
  iconBorder: '#8b5cf6',
  chipBg: 'rgba(11, 6, 32, 0.85)',
  chipText: '#e9d5ff',
  marqueeSep: 'rgba(196, 181, 253, 0.4)',
  radius: 24,
  shadow: '0 10px 34px rgba(124, 58, 237, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
};

export default function NeonTheme(props: StreamBarThemeProps) {
  return <StreamBarBase {...props} palette={PALETTE} />;
}
