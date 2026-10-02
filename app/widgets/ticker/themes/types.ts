export type TickerThemeProps = {
  items: string[];
  font: string;
  fontSize: number;
  accent: string;
  bg: string;
  textColor?: string;
  separator: string;
  speed: number; // detik per loop
  direction: 'left' | 'right';
  showBadge: boolean;
  badgeText: string;
};
