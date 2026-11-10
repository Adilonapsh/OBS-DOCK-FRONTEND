import { StreamBarBase } from './StreamBarBase';
import type { StreamBarPalette, StreamBarThemeProps } from './types';

export const themeMeta = { value: 'standard', label: 'Standard - Deep Teal' } as const;

const PALETTE: StreamBarPalette = {
  barFrom: '#143753',
  barTo: '#0f2f4a',
  barEdge: '#1d4466',
  teal: '#3fe0c8',
  blue: '#4aa9f2',
  text: '#ffffff',
  muted: '#9fb6c9',
  panelFrom: '#0f3a57',
  panelTo: '#0c3250',
  panelBorder: '#1d5576',
  cardBg: '#0b2a42',
  iconBg: '#0d2f47',
  iconBorder: '#2aa6b8',
  chipBg: 'rgba(7, 28, 46, 0.8)',
  chipText: '#e6f1f8',
  marqueeSep: 'rgba(255, 255, 255, 0.3)',
  radius: 22,
  shadow: '0 10px 30px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
};

export default function StandardTheme(props: StreamBarThemeProps) {
  return <StreamBarBase {...props} palette={PALETTE} />;
}
