import type { ChatThemeProps } from './types';
import { platformLogo } from './platformLogo';
import { bgBrightness } from './colorUtils';
import { chatRoles, chatRoleLabel, chatRoleColor, chatNameColor } from './roleUtils';
import { EmoteText } from './EmoteText';
import { formatChatTime, isGroupedWithPrev, isMentionMessage, bubbleBg } from './chatFilters';
import { MessageExtras } from './MessageExtras';

export const themeMeta = { value: 'plain', label: 'Plain' } as const;

export default function PlainTheme({ chats, font, accent, bg, maxMessages, showAvatar, showPlatform, showTimestamp, showBadges, bttv, bttvMap, fontSize, bgOpacity, textColor, exitingIds, horizontal, anim, horizontalAnim, hideAnim, showUsername = true, showMessage = true, timeFormat = '24-hour', lineSpacing = 1.4, useChatBubbles = false, bubbleColor = '#1d1d1d', bubbleOpacity = 0.9, groupConsecutiveMessages = false, highlightMentions = false, imageEmbedPermissionLevel = '69420', showYouTubeLinkPreviews = false, plainTextBorder = false, plainBorderColor = '#000000', plainBorderWidth = 1 }: ChatThemeProps & { plainTextBorder?: boolean; plainBorderColor?: string; plainBorderWidth?: number }) {
  const visible = chats.slice(-maxMessages);
  const useBg = bg && bg !== 'transparent';
  // Logo asetnya hitam: background terang -> tampil apa adanya,
  // background gelap/transparan -> invert agar jadi putih dan terbaca.
  const rowBright = useBg ? bgBrightness(bg) : null;
  const isLightRow = rowBright !== null && rowBright > 50;
  const invertLogo = !isLightRow;
  // Teks otomatis ikut brightness (kecuali user mengunci warna custom).
  const text = textColor || (isLightRow ? '#111' : '#fff');
  const subtle = isLightRow ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.5)';
  const subtleTime = isLightRow ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.4)';
  const bubbleFallback = useBg ? bg : 'transparent';
  const plainBorderStyle = plainTextBorder ? ({
    WebkitTextStroke: `${plainBorderWidth}px ${plainBorderColor}`,
    paintOrder: 'stroke fill' as const,
    // fallback shadow for browsers that don't support stroke
    textShadow: `0 1px 0 ${plainBorderColor}, 1px 0 0 ${plainBorderColor}, -1px 0 0 ${plainBorderColor}, 0 -1px 0 ${plainBorderColor}, 0 0 ${plainBorderWidth * 3}px ${plainBorderColor}`,
  } as React.CSSProperties) : {};
  const hide = hideAnim || 'fadeOut';
  const getAnim = (id: string) => {
    const isExiting = exitingIds?.has(id);
    const name = isExiting ? hide : (horizontal ? (horizontalAnim || anim) : anim) || 'elegantIn';
    // fallback plainFadeIn jika anim tidak dikenal (legacy)
    if (name === 'plainFadeIn') return `plainFadeIn 0.3s ease both`;
    const isEleg = ['elegantIn','softPopIn','blurIn','luxeIn','elegantOut','softPopOut','blurOut','luxeOut'].includes(name);
    const d = isEleg ? '0.62s' : '0.4s';
    return `${name} ${d} cubic-bezier(0.16,1,0.3,1) both`;
  };
  if (horizontal) {
    return (
      <>
        <style>{`@keyframes plainFadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        <div
          className="w-full max-w-none flex flex-row flex-wrap gap-x-3 gap-y-1 items-end"
          style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px`, background: 'transparent' }}
        >
          {visible.map((c) => {
            const isExiting = exitingIds?.has(c.id);
            const hl = highlightMentions && isMentionMessage(c.comment);
            const rowBg = useChatBubbles ? bubbleBg(bubbleColor, bubbleOpacity, bubbleFallback) : (useBg ? bg : 'transparent');
            const hasBg = useChatBubbles || !!useBg || hl;
            const background = hl && typeof accent === 'string' && accent.startsWith('#') ? `${accent}2e` : rowBg;
            const rowOpacity = isExiting ? 0 : (useChatBubbles ? 1 : (useBg ? bgOpacity / 100 : 1));
            return (
              <div
                key={c.id}
                className="shrink-0 max-w-[320px] truncate"
                style={{
                  background,
                  border: 'none',
                  boxShadow: 'none',
                  padding: hasBg ? '2px 6px' : 0,
                  margin: 0,
                  borderRadius: hasBg ? 6 : 0,
                  animation: getAnim(c.id),
                  opacity: rowOpacity,
                  transition: 'opacity 0.3s ease',
                  lineHeight: lineSpacing,
                  wordBreak: 'break-word',
                }}
              >
                {showAvatar && (
                  <img
                    src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`}
                    alt={c.nickname}
                    style={{ width: '1.7em', height: '1.7em', borderRadius: '50%', objectFit: 'cover', display: 'inline-block', verticalAlign: '-0.4em', marginRight: 5 }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`; }}
                  />
                )}
                {showUsername && showPlatform && (
                  <img
                    src={platformLogo(c.platform)}
                    alt={c.platform || 'tiktok'}
                    style={{ width: '1.1em', height: '1.1em', objectFit: 'contain', display: 'inline-block', verticalAlign: '-0.15em', marginRight: 4, filter: invertLogo ? 'invert(1)' : 'none' }}
                  />
                )}
                {showUsername && (
                  <span style={{ color: chatNameColor(c, accent), fontWeight: 700, ...(plainTextBorder ? plainBorderStyle : {}) }}>{showBadges && chatRoles(c).map((r) => (<span key={r} style={{ color: chatRoleColor(r), fontWeight: 800, fontSize: '0.8em', ...(plainTextBorder ? plainBorderStyle : {}) }}>[{chatRoleLabel(r)}] </span>))}{c.nickname}</span>
                )}
                {showUsername && showMessage && (
                  <span style={{ color: subtle }}> • </span>
                )}
                {showMessage && (
                  <span style={{ color: text, ...(plainTextBorder ? plainBorderStyle : {}) }}><EmoteText text={c.comment} emotes={c.emotes} bttvMap={bttvMap} bttvEnabled={bttv} /><MessageExtras chat={c} permissionLevel={imageEmbedPermissionLevel} showYouTubePreview={showYouTubeLinkPreviews} dark={!isLightRow} /></span>
                )}
                {showTimestamp && c.timestamp ? (
                  <span style={{ color: subtleTime, fontSize: '0.75em', marginLeft: 6, fontFamily: 'monospace' }}>
                    {formatChatTime(c.timestamp, timeFormat)}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </>
    );
  }
  return (
    <>
      <style>{`@keyframes plainFadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div
        className="w-full max-w-[420px] flex flex-col gap-1"
        style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px`, background: 'transparent' }}
      >
        {visible.map((c, i) => {
          const isExiting = exitingIds?.has(c.id);
          const grouped = groupConsecutiveMessages && isGroupedWithPrev(visible, i);
          const showName = showUsername && !grouped;
          const hl = highlightMentions && isMentionMessage(c.comment);
          const rowBg = useChatBubbles ? bubbleBg(bubbleColor, bubbleOpacity, bubbleFallback) : (useBg ? bg : 'transparent');
          const hasBg = useChatBubbles || !!useBg || hl;
          const background = hl && typeof accent === 'string' && accent.startsWith('#') ? `${accent}2e` : rowBg;
          const rowOpacity = isExiting ? 0 : (useChatBubbles ? 1 : (useBg ? bgOpacity / 100 : 1));
          return (
            <div
              key={c.id}
              style={{
                background,
                border: 'none',
                boxShadow: 'none',
                padding: hasBg ? '2px 6px' : 0,
                margin: 0,
                borderRadius: hasBg ? 6 : 0,
                animation: 'plainFadeIn 0.3s ease both',
                opacity: rowOpacity,
                transition: 'opacity 0.3s ease',
                lineHeight: lineSpacing,
                wordBreak: 'break-word',
              }}
            >
              {showAvatar && !grouped && (
                <img
                  src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`}
                  alt={c.nickname}
                  style={{ width: '1.7em', height: '1.7em', borderRadius: '50%', objectFit: 'cover', display: 'inline-block', verticalAlign: '-0.4em', marginRight: 5 }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`; }}
                />
              )}
              {showName && showPlatform && (
                <img
                  src={platformLogo(c.platform)}
                  alt={c.platform || 'tiktok'}
                  style={{ width: '1.1em', height: '1.1em', objectFit: 'contain', display: 'inline-block', verticalAlign: '-0.15em', marginRight: 4, filter: invertLogo ? 'invert(1)' : 'none' }}
                />
              )}
              {showName && (
                <span style={{ color: chatNameColor(c, accent), fontWeight: 700, ...(plainTextBorder ? plainBorderStyle : {}) }}>{showBadges && chatRoles(c).map((r) => (<span key={r} style={{ color: chatRoleColor(r), fontWeight: 800, fontSize: '0.8em', ...(plainTextBorder ? plainBorderStyle : {}) }}>[{chatRoleLabel(r)}] </span>))}{c.nickname}</span>
              )}
              {showName && showMessage && (
                <span style={{ color: subtle }}> • </span>
              )}
              {showMessage && (
                <span style={{ color: text, ...(plainTextBorder ? plainBorderStyle : {}) }}><EmoteText text={c.comment} emotes={c.emotes} bttvMap={bttvMap} bttvEnabled={bttv} /><MessageExtras chat={c} permissionLevel={imageEmbedPermissionLevel} showYouTubePreview={showYouTubeLinkPreviews} dark={!isLightRow} /></span>
              )}
              {showTimestamp && c.timestamp ? (
                <span style={{ color: subtleTime, fontSize: '0.75em', marginLeft: 6, fontFamily: 'monospace' }}>
                  {formatChatTime(c.timestamp, timeFormat)}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
