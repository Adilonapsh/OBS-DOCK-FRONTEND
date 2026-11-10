export type StreamBarRuleIcon = 'none' | 'follow' | 'shield' | 'heart';

export type StreamBarRule = {
  icon: StreamBarRuleIcon;
  html: string;
};

export type StreamBarGoalKind = 'follow' | 'subs' | 'likes' | 'donation' | 'custom';

export type StreamBarGoal = {
  label: string;
  current: number;
  target: number;
  next: number;
  unit: string;
  fmt: 'num' | 'rp';
  /** Dipakai untuk update live dari event socket (follow/sub/like/donation). */
  kind: StreamBarGoalKind;
};

export type StreamBarAlertKind = 'raid' | 'follow' | 'sub' | 'donation' | 'gift' | 'goal';

export type StreamBarAlert = {
  id: string;
  type: StreamBarAlertKind;
  name: string;
  viewers?: number;
  amount?: number;
  months?: number;
  giftName?: string;
  count?: number;
  duration?: number;
};

export type StreamBarAlertState = {
  item: StreamBarAlert;
  closing: boolean;
} | null;

export type StreamBarPalette = {
  barFrom: string;
  barTo: string;
  barEdge: string;
  teal: string;
  blue: string;
  text: string;
  muted: string;
  panelFrom: string;
  panelTo: string;
  panelBorder: string;
  cardBg: string;
  iconBg: string;
  iconBorder: string;
  chipBg: string;
  chipText: string;
  marqueeSep: string;
  radius: number;
  shadow: string;
};

export type StreamBarThemeProps = {
  font: string;
  accent: string;

  // Kiri
  streamStartedAt: number;
  viewers: number;
  activityPreset: string;
  activityTitle: string;
  activitySub: string;
  activityImage: string;
  songActive: boolean;
  songTitle: string;
  songArtist: string;
  /** Album art / thumbnail lagu aktif (kosong = pakai cover ilustrasi). */
  songArt: string;
  songElapsed: number;
  songTotal: number;
  gameActive: boolean;
  gameName: string;
  gameGenre: string;
  gameCover: string;

  // Tengah
  welcomeLabel: string;
  welcomeTitle: string;
  welcomeSub: string;
  rules: StreamBarRule[];

  // Alert
  alert: StreamBarAlertState;
  alertMs: number;

  // Goals
  goals: StreamBarGoal[];
  goalStyle: 'radial' | 'bar';
  goalRotateMs: number;

  // Brutalist (opsional, hanya dipakai tema brutalist)
  brutalistBg?: string;
  brutalistTextColor?: string;
  brutalistBadgeBg?: string;
  brutalistBorderColor?: string;
  brutalistShadow?: number;
  brutalistHalftone?: boolean;
  brutalistTail?: boolean;
  brutalistItalic?: boolean;
  brutalistUppercase?: boolean;
};
