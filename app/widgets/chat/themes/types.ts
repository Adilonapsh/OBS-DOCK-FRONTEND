export type ChatRole = 'broadcaster' | 'mod' | 'vip' | 'sub' | 'owner' | 'member' | 'verified';

export type ChatEmote = { name: string; imageUrl: string };

export type ChatItem = {
  id: string;
  nickname: string;
  comment: string;
  profilePictureUrl?: string;
  platform?: string;
  timestamp?: number;
  /** Role asli dari Streamer.bot (diteruskan dock → backend bridge). Kosong = viewer biasa. */
  badges?: string[];
  /** Warna nama akun (Twitch color asli / fallback stabil per akun). */
  color?: string;
  /** Emote yang terdeteksi di pesan (dari Streamer.bot: Twitch/BTTV/FFZ/7TV). */
  emotes?: ChatEmote[];
};

export type ChatThemeProps = {
  chats: ChatItem[];
  font: string;
  accent: string;
  bg: string;
  accent2?: string;
  maxMessages: number;
  showAvatar: boolean;
  showPlatform: boolean;
  showTimestamp: boolean;
  showBadges: boolean;
  /** Emote BetterTTV global aktif? */
  bttv: boolean;
  /** Map kode emote BTTV global → URL gambar (diambil display dari api.betterttv.net). */
  bttvMap: Record<string, string>;
  anim: string;
  horizontalAnim?: string;
  hideAnim?: string;
  hideAfter: number;
  fontSize: number;
  bgOpacity: number;
  textColor?: string;
  compact?: boolean;
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
  // ---- Setting tambahan (nutty-compatible) ----
  showUsername?: boolean;
  showMessage?: boolean;
  showPronouns?: boolean;
  timeFormat?: string;
  lineSpacing?: number;
  useChatBubbles?: boolean;
  bubbleColor?: string;
  bubbleOpacity?: number;
  groupConsecutiveMessages?: boolean;
  highlightMentions?: boolean;
  imageEmbedPermissionLevel?: string;
  showYouTubeLinkPreviews?: boolean;
};
