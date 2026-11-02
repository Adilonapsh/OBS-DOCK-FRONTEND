export type PinnedCardItem = {
  nickname: string;
  comment: string;
  profilePictureUrl?: string;
  platform?: string;
};

export type PinnedCardStatus = 'loading' | 'error';

export type PinnedChatCardProps = {
  item: PinnedCardItem;
  theme: string;
  fontSize: number;
  accent: string;
  showAvatar: boolean;
  showPlatform: boolean;
  showTimestamp: boolean;
  timeStr: string;
  cardBg?: string;
  fxColor: string;
  spinActive: boolean;
  kbTheme: string;
  kbGlow: boolean;
  kbCaps: string;
  mkText: string;
  mkDim: string;
  brutalistBg: string;
  brutalistTextColor: string;
  brutalistBadgeBg: string;
  brutalistBorderColor: string;
  brutalistShadow: number;
  brutalistHalftone: boolean;
  brutalistTail: boolean;
  brutalistItalic: boolean;
  brutalistUppercase: boolean;
  charDelayMs: number;
  charDurationS: number;
  typedCount?: number;
  badge?: string;
  status?: PinnedCardStatus;
  typing?: boolean;
  showKeyboard?: boolean;
  // Hanya tampilkan isi pesan (tanpa username/avatar/badge) - dipakai panel balasan AI.
  messageOnly?: boolean;
  // Lebar mengikuti container (dipakai Speak supaya user card & AI row selebar yang sama).
  fluid?: boolean;
  // Hilangkan shadow tema non-brutalist (brutalist tetap memakai drop shadow).
  noShadow?: boolean;
  avatarRef?: (el: HTMLElement | null) => void;
};
