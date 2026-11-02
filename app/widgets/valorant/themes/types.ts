import type { BrutalistSettings } from '../../_shared/constants/brutalist';

export type PromoState = { direction: 'up' | 'down'; tierName: string; iconUrl: string } | null;

export type ValorantCardProps = {
  view: string;
  font: string;
  riotId: string;
  seasonText: string;
  rankName: string;
  rr: number;
  ghostRr: number;
  iconUrl: string;
  themeColor: string;
  wins: number;
  losses: number;
  winrate: number;
  shield: number;
  showStreak: boolean;
  showWinrate: boolean;
  showSeason: boolean;
  updatedAt: string;
  promo: PromoState;
  themeMode: string;
  brutalist?: BrutalistSettings | null;
  pastelMode: string;
  pastelBg: string;
  trackerTextMode: string;
  trackerTextColor: string;
};

export type ValorantSkinProps = ValorantCardProps & {
  r: number;
  g: number;
  b: number;
  progress: number;
  family: string;
};
