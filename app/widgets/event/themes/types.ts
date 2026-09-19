export type EventType = 'join' | 'gift' | 'like';

export type EventItem = {
  id: string;
  type: EventType;
  nickname: string;
  profilePictureUrl?: string;
  giftName?: string;
  giftPictureUrl?: string;
  repeatCount?: number;
  diamondCount?: number;
  likeCount?: number;
  timestamp: number;
};

export type EventThemeProps = {
  events: EventItem[];
  font: string;
  accent: string;
  bg: string;
  maxEvents: number;
  showAvatar: boolean;
  anim: string;
  horizontalAnim?: string;
  hideAnim?: string;
  fontSize: number;
  bgOpacity: number;
  horizontal?: boolean;
  inline?: boolean;
  cuteBubbleBg?: string;
  cuteResubFrom?: string;
  cuteResubTo?: string;
  cuteBadgeBg?: string;
  cuteBadgeText?: string;
  cuteNameMod?: string;
  cuteNameUser?: string;
  exitingIds?: Set<string>;
  charDelayMs?: number;
  charDurationS?: number;
};
