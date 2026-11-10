import { StreamBarBase } from './StreamBarBase';
import type { StreamBarPalette, StreamBarThemeProps } from './types';
import './Brutalist.css';

export const themeMeta = { value: 'brutalist', label: 'Brutalist - Yellow Poster' } as const;

function withAlpha(hex: string, alpha: number): string {
  const raw = hex.trim().replace('#', '');
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  if (!/^[0-9a-f]{6}$/i.test(full)) return hex;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export default function BrutalistTheme({
  brutalistBg,
  brutalistTextColor,
  brutalistBadgeBg,
  brutalistBorderColor,
  brutalistShadow,
  brutalistHalftone,
  brutalistTail,
  brutalistItalic,
  brutalistUppercase,
  ...props
}: StreamBarThemeProps) {
  const barBg = brutalistBg || '#ffd93d';
  const textColor = brutalistTextColor || '#111111';
  const badgeBg = brutalistBadgeBg || '#ffffff';
  const borderColor = brutalistBorderColor || '#111111';
  const shadow = Math.max(0, Math.min(20, brutalistShadow ?? 12));
  const halftone = brutalistHalftone ?? true;
  const tail = brutalistTail ?? true;
  const italic = brutalistItalic ?? true;
  const uppercase = brutalistUppercase ?? true;

  const PALETTE: StreamBarPalette = {
    barFrom: barBg,
    barTo: barBg,
    barEdge: borderColor,
    teal: textColor,
    blue: textColor,
    text: textColor,
    muted: withAlpha(textColor, 0.64),
    panelFrom: badgeBg,
    panelTo: badgeBg,
    panelBorder: borderColor,
    cardBg: badgeBg,
    iconBg: barBg,
    iconBorder: borderColor,
    chipBg: badgeBg,
    chipText: textColor,
    marqueeSep: withAlpha(textColor, 0.55),
    radius: 0,
    shadow: `${shadow}px ${shadow}px 0 0 ${borderColor}`,
  };

  const className = [
    'sb-brutalist',
    halftone ? 'sb-brut-halftone' : 'sb-brut-solid',
    tail ? 'sb-brut-tail' : '',
    italic ? 'sb-brut-italic' : '',
    uppercase ? 'sb-brut-upper' : '',
  ].filter(Boolean).join(' ');

  return (
    <StreamBarBase
      {...props}
      accent={textColor}
      palette={PALETTE}
      className={className}
    />
  );
}
