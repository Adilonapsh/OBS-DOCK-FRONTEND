import type { ChatItem } from './themes/types';
import { WIDGET_FONTS } from '../_shared/constants/fonts';

// AUTO-REGISTER: daftar theme dibaca dari themes/registry.tsx (generated).
// Tambah theme baru cukup buat file themes/NamaTema.tsx + themeMeta -
// otomatis muncul di dropdown settings, preview, dan display (?theme=...).
export { CHAT_THEME_OPTIONS as CHAT_THEMES } from './themes/registry';

export const CHAT_FONTS = WIDGET_FONTS;

export const CHAT_ANIMS = [
  { value: 'elegant', label: 'Elegant (Recommended)' },
  { value: 'softPop', label: 'Soft Pop - Halus' },
  { value: 'blur', label: 'Blur In - Minimal' },
  { value: 'luxe', label: 'Luxe - Editorial' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'slideLeft', label: 'Slide Left' },
  { value: 'slideRight', label: 'Slide Right' },
  { value: 'pop', label: 'Pop' },
  { value: 'fade', label: 'Fade' },
  { value: 'flip', label: 'Flip' },
] as const;

export const CHAT_HORIZONTAL_ANIMS = [
  { value: 'elegant', label: 'Elegant' },
  { value: 'slideLeft', label: 'Slide Left' },
  { value: 'slideRight', label: 'Slide Right' },
  { value: 'softPop', label: 'Soft Pop' },
  { value: 'blur', label: 'Blur In' },
  { value: 'luxe', label: 'Luxe' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'pop', label: 'Pop' },
  { value: 'fade', label: 'Fade' },
  { value: 'flip', label: 'Flip' },
] as const;

export const CHAT_HIDE_ANIMS = [
  { value: 'fade', label: 'Fade - Halus (default)' },
  { value: 'elegant', label: 'Elegant Out' },
  { value: 'blur', label: 'Blur Out' },
  { value: 'softPop', label: 'Soft Pop Out' },
  { value: 'luxe', label: 'Luxe Out' },
  { value: 'slideUp', label: 'Slide Up Out' },
  { value: 'slideLeft', label: 'Slide Left Out' },
  { value: 'slideRight', label: 'Slide Right Out' },
  { value: 'pop', label: 'Pop Out' },
  { value: 'flip', label: 'Flip Out' },
] as const;

export const CHAT_DEFAULTS = {
  pos: 'center' as string,
  theme: 'standard' as string,
  font: 'Outfit',
  fontSize: 14,
  accent: '#8b5cf6',
  bg: 'transparent',
  bgOpacity: 100,
  textColor: '', // '' = otomatis (bawaan tiap tema)
  maxMessages: 6,
  hideAfter: 0,
  showAvatar: true,
  showPlatform: true,
  showTimestamp: false,
  showBadges: true,
  bttv: true,
  anim: 'elegant',
  hideAnim: 'fade',
  horizontal: false,
  horizontalAnim: 'elegant',
  inline: false,
  cuteBubbleBg: '#1e1d2b',
  cuteResubFrom: '#c4a2f8',
  cuteResubTo: '#fca4d4',
  cuteBadgeBg: '#2e2c45',
  cuteBadgeText: '#a8a3ce',
  cuteNameMod: '#f5a8d0',
  cuteNameUser: '#d8cded',
  charDelayMs: 25,
  charDurationS: 0.35,
  // ---- Appearance (nutty.gg multichat-overlay) ----
  // TikTok chat tetap sama seperti sekarang (sumber tiktok-chat), ini murni setting tampilan.
  showUsername: true,
  showMessage: true,
  showPronouns: false, // belum ada data pronouns - disimpan untuk kompatibilitas URL nutty
  timeFormat: '24-hour' as string, // '12-hour' | '24-hour'
  lineSpacing: 1.4,
  useChatBubbles: false, // false = tema pakai bg bawaan (perilaku sekarang); true = override bubbleColor
  bubbleColor: '#1d1d1d',
  bubbleOpacity: 0.9,
  // ---- General ----
  excludeCommands: false, // sembunyikan pesan diawali "!"
  ignoreChatters: '', // koma-separated, cth: "StreamElements,Streamlabs"
  scrollDirection: '1' as string, // '1' = Normal, '2' = Reversed
  groupConsecutiveMessages: false,
  highlightMentions: false,
  imageEmbedPermissionLevel: '69420' as string, // 40/30/20/15/10/69420 (Nobody = perilaku sekarang)
  showYouTubeLinkPreviews: false,
  // ---- Plain theme border ----
  plainTextBorder: false as boolean,
  plainBorderColor: '#000000' as string,
  plainBorderWidth: 1 as number,
  // ---- Brutalist theme (Neo-Brutalist Studio) ----
  brutalistBg: '#FFFFFF' as string,
  brutalistTextColor: '#000000' as string,
  brutalistBadgeBg: '#FFFFFF' as string,
  brutalistBorderColor: '#000000' as string,
  brutalistShadow: 6 as number,
  brutalistHalftone: true as boolean,
  brutalistTail: true as boolean,
  brutalistItalic: true as boolean,
  brutalistUppercase: true as boolean,
  // ---- Filter platform: Twitch ----
  showTwitchMessages: true,
  showTwitchCheers: false,
  showTwitchAnnouncements: true,
  showTwitchFollows: false,
  showTwitchSubs: true,
  showTwitchChannelPointRedemptions: true,
  showTwitchPowerUpRedemptions: true,
  showTwitchRaids: true,
  showTwitchWatchStreaks: true,
  showTwitchSharedChat: '2' as string, // '2' highlight, '1' show, '0' hide
  showTwitchGIFs: true,
  // ---- Filter platform: YouTube ----
  showYouTubeMessages: true,
  showYouTubeSuperChats: true,
  showYouTubeSuperStickers: true,
  showYouTubeJewelsGifted: true,
  showYouTubeSubscribers: false,
  showYouTubeMemberships: true,
  // ---- Filter platform: Kick ----
  showKickMessages: true,
  showKickFollows: false,
  showKickSubs: true,
  showKickChannelPointRedemptions: true,
  showKickHosts: true,
  showKickGifts: true,
  // ---- Filter platform: TikTok (chat tetap tiktok-chat seperti sekarang) ----
  enableTikTokSupport: true,
  showTikTokMessages: true,
  showTikTokFollows: true,
  showTikTokLikes: true,
  showTikTokGifts: true,
  showTikTokSubs: true,
  // ---- Donasi / alerts ----
  showStreamlabsDonations: true,
  showStreamElementsTips: true,
  showPatreonMemberships: true,
  showKofiDonations: true,
  showTipeeeStreamDonations: true,
  showFourthwallAlerts: true,
  skipFourthwallFreeOrders: true,
} as const;

export type ChatSettings = typeof CHAT_DEFAULTS;

export const DEMO_CHATS: ChatItem[] = [
  { id: 'd1', nickname: 'Rizky_JR', comment: 'Gass keun bang, semangat live-nya! 🔥', profilePictureUrl: 'https://ui-avatars.com/api/?name=Rizky&background=8b5cf6&color=fff', platform: 'tiktok', timestamp: Date.now() - 8000 },
  { id: 'd2', nickname: 'SitiPlay', comment: 'Lagi main apa nih? seru banget anjir', profilePictureUrl: 'https://ui-avatars.com/api/?name=Siti&background=FE2C55&color=fff', platform: 'youtube', timestamp: Date.now() - 5000, badges: ['member'], color: '#34d399' },
  { id: 'd3', nickname: 'ViewerTwitch', comment: 'Hello dari Twitch! Keren overlay-nya 👍 KEKW', profilePictureUrl: 'https://ui-avatars.com/api/?name=Twitch&background=9146ff&color=fff', platform: 'twitch', timestamp: Date.now() - 3000, badges: ['mod'], color: '#00ad03' },
  { id: 'd4', nickname: 'SubTwitch', comment: 'Sudah sub 3 bulan nih!', profilePictureUrl: 'https://ui-avatars.com/api/?name=Sub&background=9146ff&color=fff', platform: 'twitch', timestamp: Date.now() - 2000, badges: ['sub'], color: '#a970ff' },
  { id: 'd5', nickname: 'BudiSantuy', comment: 'Tiktok live dari HP? kok jernih bener', profilePictureUrl: 'https://ui-avatars.com/api/?name=Budi&background=06b6d4&color=fff', platform: 'tiktok', timestamp: Date.now() - 1500 },
];

export function buildChatUrl(base: string, s: ChatSettings): string {
  const p = new URLSearchParams();
  p.set('theme', s.theme);
  p.set('font', s.font);
  p.set('fontSize', String(s.fontSize));
  p.set('accent', s.accent);
  if (s.bg && s.bg !== 'transparent') p.set('bg', s.bg);
  p.set('bgOpacity', String(s.bgOpacity));
  if (s.textColor) p.set('textColor', s.textColor);
  p.set('maxMessages', String(s.maxMessages));
  p.set('hideAfter', String(s.hideAfter));
  p.set('showAvatar', s.showAvatar ? '1' : '0');
  p.set('showPlatform', s.showPlatform ? '1' : '0');
  p.set('showTimestamp', s.showTimestamp ? '1' : '0');
  p.set('showBadges', s.showBadges ? '1' : '0');
  p.set('bttv', s.bttv ? '1' : '0');
  p.set('anim', s.anim);
  p.set('hideAnim', (s as unknown as { hideAnim: string }).hideAnim || 'fade');
  p.set('pos', (s as unknown as { pos: string }).pos || 'center');
  p.set('horizontal', s.horizontal ? '1' : '0');
  p.set('horizontalAnim', s.horizontalAnim || 'slideLeft');
  p.set('inline', s.inline ? '1' : '0');
  if (s.cuteBubbleBg) p.set('cuteBubbleBg', s.cuteBubbleBg);
  if (s.cuteResubFrom) p.set('cuteResubFrom', s.cuteResubFrom);
  if (s.cuteResubTo) p.set('cuteResubTo', s.cuteResubTo);
  if (s.cuteBadgeBg) p.set('cuteBadgeBg', s.cuteBadgeBg);
  if (s.cuteBadgeText) p.set('cuteBadgeText', s.cuteBadgeText);
  if (s.cuteNameMod) p.set('cuteNameMod', s.cuteNameMod);
  if (s.cuteNameUser) p.set('cuteNameUser', s.cuteNameUser);
  p.set('charDelayMs', String(s.charDelayMs));
  p.set('charDurationS', String(s.charDurationS));
  // Appearance (nutty-compatible)
  p.set('showUsername', s.showUsername ? '1' : '0');
  p.set('showMessage', s.showMessage ? '1' : '0');
  p.set('showPronouns', s.showPronouns ? '1' : '0');
  p.set('timeFormat', s.timeFormat || '24-hour');
  p.set('lineSpacing', String(s.lineSpacing));
  p.set('useChatBubbles', s.useChatBubbles ? '1' : '0');
  if ((s as { useChatBubbles?: boolean }).useChatBubbles) {
    p.set('bubbleColor', s.bubbleColor);
    p.set('bubbleOpacity', String(s.bubbleOpacity));
  }
  // General
  p.set('excludeCommands', s.excludeCommands ? '1' : '0');
  if (s.ignoreChatters) p.set('ignoreChatters', s.ignoreChatters);
  p.set('scrollDirection', s.scrollDirection || '1');
  p.set('groupConsecutiveMessages', s.groupConsecutiveMessages ? '1' : '0');
  p.set('highlightMentions', s.highlightMentions ? '1' : '0');
  p.set('imageEmbedPermissionLevel', String(s.imageEmbedPermissionLevel));
  p.set('showYouTubeLinkPreviews', s.showYouTubeLinkPreviews ? '1' : '0');
  p.set('plainTextBorder', (s as unknown as { plainTextBorder?: boolean }).plainTextBorder ? '1' : '0');
  if ((s as unknown as { plainTextBorder?: boolean }).plainTextBorder) {
    p.set('plainBorderColor', (s as unknown as { plainBorderColor?: string }).plainBorderColor || '#000000');
    p.set('plainBorderWidth', String((s as unknown as { plainBorderWidth?: number }).plainBorderWidth ?? 1));
  }
  // Brutalist
  p.set('brutalistBg', (s as unknown as { brutalistBg?: string }).brutalistBg || '#FFFFFF');
  p.set('brutalistTextColor', (s as unknown as { brutalistTextColor?: string }).brutalistTextColor || '#000000');
  p.set('brutalistBadgeBg', (s as unknown as { brutalistBadgeBg?: string }).brutalistBadgeBg || '#FFFFFF');
  p.set('brutalistBorderColor', (s as unknown as { brutalistBorderColor?: string }).brutalistBorderColor || '#000000');
  p.set('brutalistShadow', String((s as unknown as { brutalistShadow?: number }).brutalistShadow ?? 6));
  p.set('brutalistHalftone', (s as unknown as { brutalistHalftone?: boolean }).brutalistHalftone ? '1' : '0');
  p.set('brutalistTail', (s as unknown as { brutalistTail?: boolean }).brutalistTail ? '1' : '0');
  p.set('brutalistItalic', (s as unknown as { brutalistItalic?: boolean }).brutalistItalic ? '1' : '0');
  p.set('brutalistUppercase', (s as unknown as { brutalistUppercase?: boolean }).brutalistUppercase ? '1' : '0');
  // Twitch
  p.set('showTwitchMessages', s.showTwitchMessages ? '1' : '0');
  p.set('showTwitchCheers', s.showTwitchCheers ? '1' : '0');
  p.set('showTwitchAnnouncements', s.showTwitchAnnouncements ? '1' : '0');
  p.set('showTwitchFollows', s.showTwitchFollows ? '1' : '0');
  p.set('showTwitchSubs', s.showTwitchSubs ? '1' : '0');
  p.set('showTwitchChannelPointRedemptions', s.showTwitchChannelPointRedemptions ? '1' : '0');
  p.set('showTwitchPowerUpRedemptions', s.showTwitchPowerUpRedemptions ? '1' : '0');
  p.set('showTwitchRaids', s.showTwitchRaids ? '1' : '0');
  p.set('showTwitchWatchStreaks', s.showTwitchWatchStreaks ? '1' : '0');
  p.set('showTwitchSharedChat', String(s.showTwitchSharedChat));
  p.set('showTwitchGIFs', s.showTwitchGIFs ? '1' : '0');
  // YouTube
  p.set('showYouTubeMessages', s.showYouTubeMessages ? '1' : '0');
  p.set('showYouTubeSuperChats', s.showYouTubeSuperChats ? '1' : '0');
  p.set('showYouTubeSuperStickers', s.showYouTubeSuperStickers ? '1' : '0');
  p.set('showYouTubeJewelsGifted', s.showYouTubeJewelsGifted ? '1' : '0');
  p.set('showYouTubeSubscribers', s.showYouTubeSubscribers ? '1' : '0');
  p.set('showYouTubeMemberships', s.showYouTubeMemberships ? '1' : '0');
  // Kick
  p.set('showKickMessages', s.showKickMessages ? '1' : '0');
  p.set('showKickFollows', s.showKickFollows ? '1' : '0');
  p.set('showKickSubs', s.showKickSubs ? '1' : '0');
  p.set('showKickChannelPointRedemptions', s.showKickChannelPointRedemptions ? '1' : '0');
  p.set('showKickHosts', s.showKickHosts ? '1' : '0');
  p.set('showKickGifts', s.showKickGifts ? '1' : '0');
  // TikTok
  p.set('enableTikTokSupport', s.enableTikTokSupport ? '1' : '0');
  p.set('showTikTokMessages', s.showTikTokMessages ? '1' : '0');
  p.set('showTikTokFollows', s.showTikTokFollows ? '1' : '0');
  p.set('showTikTokLikes', s.showTikTokLikes ? '1' : '0');
  p.set('showTikTokGifts', s.showTikTokGifts ? '1' : '0');
  p.set('showTikTokSubs', s.showTikTokSubs ? '1' : '0');
  // Donasi
  p.set('showStreamlabsDonations', s.showStreamlabsDonations ? '1' : '0');
  p.set('showStreamElementsTips', s.showStreamElementsTips ? '1' : '0');
  p.set('showPatreonMemberships', s.showPatreonMemberships ? '1' : '0');
  p.set('showKofiDonations', s.showKofiDonations ? '1' : '0');
  p.set('showTipeeeStreamDonations', s.showTipeeeStreamDonations ? '1' : '0');
  p.set('showFourthwallAlerts', s.showFourthwallAlerts ? '1' : '0');
  p.set('skipFourthwallFreeOrders', s.skipFourthwallFreeOrders ? '1' : '0');
  return `${base}?${p.toString()}`;
}
