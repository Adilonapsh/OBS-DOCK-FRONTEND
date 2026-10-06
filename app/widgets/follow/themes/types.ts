export type FollowItem = {
  id: string;
  nickname: string;
  profilePictureUrl?: string;
  platform?: string;
  // Label aksi ("subscribed", "new member", ...). Kosong = "followed".
  label?: string;
  timestamp: number;
};

export type FollowThemeProps = {
  follows: FollowItem[];
  font: string;
  accent: string;
  bg: string;
  maxFollows: number;
  showAvatar: boolean;
  anim: string;
  hideAnim?: string;
  horizontalAnim?: string;
  fontSize: number;
  bgOpacity: number;
  horizontal?: boolean;
  inline?: boolean;
  exitingIds?: Set<string>;
  soundUrl?: string;
  soundVolume?: number;
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
