import type { ChatThemeProps } from './types';
import { chatRoles, chatRoleLabel, chatRolePill, chatNameColor } from './roleUtils';
import { platformLogo } from './platformLogo';
import { EmoteText } from './EmoteText';
import { formatChatTime, isGroupedWithPrev, isMentionMessage, bubbleBg } from './chatFilters';
import { MessageExtras } from './MessageExtras';
import './PerChar.css';

export type PerCharThemeProps = ChatThemeProps & {
  charDelayMs?: number;
  charDurationS?: number;
};

const PLATFORM_COLORS: Record<string, string> = {
  twitch: '#8b5cf6',
  youtube: '#ff2d2d',
  kick: '#53fc18',
  kofi: '#ff4d4d',
};

function platformColor(platform?: string, fallback = '#8b5cf6') {
  if (!platform) return fallback;
  const v = platform.toLowerCase();
  if (v.includes('twitch')) return PLATFORM_COLORS.twitch;
  if (v.includes('youtube') || v === 'yt') return PLATFORM_COLORS.youtube;
  if (v.includes('kick')) return PLATFORM_COLORS.kick;
  if (v.includes('kofi')) return PLATFORM_COLORS.kofi;
  if (v.includes('tiktok')) return '#FE2C55';
  return fallback;
}

export const themeMeta = { value: 'perchar', label: 'Per-Char - Bubble + Huruf Mengetik' } as const;

export default function PerCharTheme({
  chats,
  font,
  accent,
  showAvatar,
  showPlatform,
  showTimestamp,
  showBadges,
  bttv,
  bttvMap,
  fontSize,
  charDelayMs = 25,
  charDurationS = 0.35,
  exitingIds,
  hideAnim,
  horizontal,
  inline,
  textColor,
  showUsername = true,
  showMessage = true,
  timeFormat = '24-hour',
  lineSpacing = 1.4,
  useChatBubbles = false,
  bubbleColor = '#1d1d1d',
  bubbleOpacity = 0.9,
  groupConsecutiveMessages = false,
  highlightMentions = false,
  imageEmbedPermissionLevel = '69420',
  showYouTubeLinkPreviews = false,
}: PerCharThemeProps) {
  const hide = hideAnim || 'fadeOut';
  // horizontal & inline pakai bubble penuh yang sama — cuma arah alir beda
  const flowCls = horizontal ? 'flex-row flex-wrap items-end' : 'flex-col';
  return (
    <div className={`chat-perchar-theme w-full ${horizontal ? 'max-w-none' : 'max-w-[480px]'} flex ${flowCls}`} style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
      {chats.length === 0 ? null : chats.map((c, i) => {
        const color = platformColor(c.platform, accent);
        const isExiting = exitingIds?.has(c.id);
        const grouped = groupConsecutiveMessages && isGroupedWithPrev(chats, i);
        const showName = showUsername && !grouped;
        const hl = highlightMentions && isMentionMessage(c.comment);
        const gradient = `linear-gradient(135deg, ${accent}, ${accent}cc)`;
        const bubbleBackground = useChatBubbles ? bubbleBg(bubbleColor, bubbleOpacity, gradient) : gradient;
        const showMeta = showName || (showTimestamp && !!c.timestamp);
        return (
          <div key={c.id} className="pc-row" style={isExiting ? { animation: `${hide} 0.4s ease both` } : undefined}>
            {showMeta ? (
              <div className="pc-meta">
                {showName && showPlatform && (
                  <img
                    src={platformLogo(c.platform)}
                    alt={c.platform || ''}
                    className="pc-logo"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                {showName && showBadges && chatRoles(c).map((r) => (
                  <span key={r} className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase ${chatRolePill(c.platform, r)}`}>{chatRoleLabel(r)}</span>
                ))}
                {showName && (
                  <span className="pc-username" style={{ color: chatNameColor(c, textColor || '#fff') }}>{c.nickname}</span>
                )}
                {showTimestamp && c.timestamp ? <span className="pc-time">{formatChatTime(c.timestamp, timeFormat)}</span> : null}
              </div>
            ) : null}
            {showMessage ? (
              <>
                <div className="pc-bubble-line">
                  {showAvatar ? (
                    <img
                      src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`}
                      alt={c.nickname}
                      className="pc-avatar"
                      style={{ borderColor: color }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`; }}
                    />
                  ) : (
                  <img
                    src={platformLogo(c.platform)}
                    alt={c.platform || ''}
                    className="pc-avatar pc-avatar-logo"
                    style={{ borderColor: color }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                  )}
                  <div className="pc-bubble" style={{ background: bubbleBackground, fontSize: `${fontSize}px`, lineHeight: lineSpacing, ...(textColor ? { color: textColor } : null), ...(hl ? { boxShadow: `0 0 0 2px ${accent}, 0 4px 18px rgba(0,0,0,0.25)` } : null) }}>
                    <EmoteText text={c.comment} emotes={c.emotes} bttvMap={bttvMap} bttvEnabled={bttv} perChar={{ delayMs: charDelayMs, durationS: charDurationS }} />
                  </div>
                </div>
                <MessageExtras chat={c} permissionLevel={imageEmbedPermissionLevel} showYouTubePreview={showYouTubeLinkPreviews} dark />
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
