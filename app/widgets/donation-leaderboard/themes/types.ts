import type { BrutalistSettings } from '../../_shared/constants/brutalist';

export type DonationEntry = {
  donorName: string;
  total: number;
  count: number;
  amountFormatted: string;
  platform: string;
  lastMessage: string;
  lastTimestamp: number;
};

export type DonationLeaderboardThemeProps = {
  entries: DonationEntry[];
  font: string;
  fontSize: number;
  accent: string;
  bg: string;
  textColor?: string;
  title: string;
  showAmount: boolean;
  showPlatform: boolean;
  showAvatar: boolean;
} & Partial<BrutalistSettings>;
