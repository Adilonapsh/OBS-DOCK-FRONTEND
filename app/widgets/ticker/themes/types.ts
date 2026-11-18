import type { BrutalistSettings } from '../../_shared/constants/brutalist';

export type TickerThemeProps = {
  items: string[];
  font: string;
  fontSize: number;
  accent: string;
  bg: string;
  textColor?: string;
  separator: string;
  speed: number; // detik sekali jalan
  repeatDelay: number; // jeda sebelum mengulang dari kanan
  direction: 'left' | 'right';
  showBadge: boolean;
  badgeText: string;
} & Partial<BrutalistSettings>;
