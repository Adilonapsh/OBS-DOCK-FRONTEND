export type FollowItem = {
  id: string;
  nickname: string;
  profilePictureUrl?: string;
  platform?: string;
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
};
