import type { ChatItem, ChatThemeProps } from './types';
import { chatRoles, chatNameColor } from './roleUtils';
import { platformLogo } from './platformLogo';
import { EmoteText } from './EmoteText';
import { formatChatTime, isGroupedWithPrev, isMentionMessage, bubbleBg } from './chatFilters';
import { MessageExtras } from './MessageExtras';
import './Cute.css';

function getBadges(c: ChatItem): { label: string }[] {
  // Role asli dari Streamer.bot (Twitch: mod/vip/sub/broadcaster, YouTube: mod/member/owner).
  // TikTok tidak punya role -> tanpa badge.
  const roles = chatRoles(c);
  if (roles.length > 0) return roles.map((r) => ({ label: r === 'member' ? 'MEMBER' : r === 'broadcaster' ? 'HOST' : r.toUpperCase() }));
  if (isResub(c.comment)) return [{ label: 'RESUB' }];
  return [];
}

function isResub(comment?: string) {
  return (comment || '').toLowerCase().includes('resub');
}
function isEmoteOnly(comment?: string) {
  const t = (comment || '').trim();
  if (!t) return false;
  if (t.length <= 6 && /[\u{1F300}-\u{1FAFF}]/u.test(t)) return true;
  if (t.includes('✨') && t.length < 10) return true;
  return false;
}

export const themeMeta = { value: 'cute', label: 'Cute - Lavender Pastel' } as const;

export default function CuteTheme({ chats, font, accent, showAvatar, showPlatform = true, showTimestamp, showBadges, bttv, bttvMap, anim, horizontalAnim, hideAnim, fontSize, bgOpacity, horizontal, inline, textColor, exitingIds, cuteBubbleBg, cuteResubFrom, cuteResubTo, cuteBadgeBg, cuteBadgeText, cuteNameMod, cuteNameUser, showUsername = true, showMessage = true, timeFormat = '24-hour', lineSpacing = 1.4, useChatBubbles = false, bubbleColor = '#1d1d1d', bubbleOpacity = 0.9, groupConsecutiveMessages = false, highlightMentions = false, imageEmbedPermissionLevel = '69420', showYouTubeLinkPreviews = false }: ChatThemeProps) {
  const hide = hideAnim || 'fadeOut';
  const getAnim = (id: string) => { const isExiting = exitingIds?.has(id); const name = isExiting ? hide : (horizontal ? (horizontalAnim || anim) : anim); const isEleg = ['elegantIn','softPopIn','blurIn','luxeIn','elegantOut','softPopOut','blurOut','luxeOut'].includes(name); const d = isEleg ? '0.62s' : '0.35s'; return `${name} ${d} cubic-bezier(0.16,1,0.3,1) both`; };
  const defaultBubble = cuteBubbleBg || '#1e1d2b';
  const resubFrom = cuteResubFrom || '#c4a2f8';
  const resubTo = cuteResubTo || '#fca4d4';
  const badgeBg = cuteBadgeBg || '#2e2c45';
  const badgeText = cuteBadgeText || '#a8a3ce';
  const nameMod = cuteNameMod || '#f5a8d0';
  const nameUser = cuteNameUser || '#d8cded';
  const text = textColor || '#fff';
  const resubGrad = `linear-gradient(90deg, ${resubFrom} 0%, ${resubTo} 100%)`;
  const bubble = useChatBubbles ? bubbleBg(bubbleColor, bubbleOpacity, defaultBubble) : defaultBubble;
  const bubbleOp = useChatBubbles ? 1 : bgOpacity / 100;
  const hl = (comment: string) => highlightMentions && isMentionMessage(comment);

  // horizontal - row pills, container transparent (tidak pakai bg)
  if (horizontal) {
    return (
      <div
        className="cute-theme w-full max-w-none flex flex-row flex-wrap gap-2 items-end content-end p-1"
        style={{ fontFamily: `'Nunito','Quicksand','${font}', sans-serif`, fontSize: `${fontSize}px`, background: 'transparent' }}
      >
        {chats.length === 0 ? null : chats.map((c, i) => {
          const badges = getBadges(c);
          const resub = isResub(c.comment);
          if (resub) {
            if (!showMessage) return null;
            const before = c.comment.split(/resubscribed/i)[0]?.trim() || c.nickname;
            const resubText = c.comment.match(/resubscribed.*$/i)?.[0] || 'resubscribed';
            return (
              <div key={c.id} className="px-3 py-2 flex items-center gap-2 shrink-0 max-w-[320px] rounded-[12px]" style={{ background: resubGrad, animation: getAnim(c.id) }}>
                <span className="role-badge" style={{ background: badgeBg, color: '#a3b2f8' }}>RESUB</span>
                <span className="font-extrabold text-[12px] text-white tracking-wide truncate">{before} {resubText}</span>
              </div>
            );
          }
          const grouped = groupConsecutiveMessages && isGroupedWithPrev(chats, i);
          const showName = showUsername && !grouped;
          return (
            <div key={c.id} className="px-3 py-2 flex items-center gap-2 shrink-0 max-w-[300px] rounded-[12px]" style={{ background: bubble, animation: getAnim(c.id), opacity: bubbleOp, borderColor: hl(c.comment) ? accent : undefined, borderWidth: hl(c.comment) ? 1 : undefined, borderStyle: hl(c.comment) ? 'solid' : undefined, boxShadow: hl(c.comment) ? `0 0 0 1px ${accent}` : undefined }}>
              {showAvatar && <img src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=2e2c45&color=a8a3ce`} alt={c.nickname} className="w-5 h-5 rounded-full object-cover shrink-0 border border-white/10" />}
              {showName && showBadges && badges.map((b) => (<span key={b.label} className="role-badge" style={{ background: badgeBg, color: badgeText }}>{b.label}</span>))}
              {showName && (
                <span className="font-black text-[11px] tracking-wider uppercase shrink-0" style={{ color: chatNameColor(c, showBadges && badges.length > 0 ? nameMod : nameUser) }}>{showPlatform && <img src={platformLogo(c.platform)} alt={c.platform || ''} className="w-3.5 h-3.5 rounded-full bg-white p-0.5 object-contain inline-block align-[-2px] mr-1" />}{c.nickname}</span>
              )}
              {showName && showMessage && <span className="text-white/40 text-[11px]">:</span>}
              {showMessage && (
                <span className="text-[12px] font-bold truncate" style={{ color: text, lineHeight: lineSpacing }}><EmoteText text={c.comment} emotes={c.emotes} bttvMap={bttvMap} bttvEnabled={bttv} /><MessageExtras chat={c} permissionLevel={imageEmbedPermissionLevel} showYouTubePreview={showYouTubeLinkPreviews} dark /></span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (inline) {
    return (
      <div className="cute-theme w-full max-w-[420px] flex flex-col gap-3 p-1" style={{ fontFamily: `'Nunito','Quicksand','${font}', sans-serif`, fontSize: `${fontSize}px`, background: 'transparent' }}>
        {chats.length === 0 ? null : chats.map((c, i) => {
          const badges = getBadges(c);
          const resub = isResub(c.comment);
          if (resub) {
            if (!showMessage) return null;
            return (
              <div key={c.id} className="px-3.5 py-3 flex items-center gap-2.5 rounded-[12px]" style={{ background: resubGrad, animation: getAnim(c.id) }}>
                <span className="role-badge" style={{ background: badgeBg, color: '#a3b2f8' }}>RESUB</span>
                <span className="font-extrabold text-[13px] text-white tracking-wide truncate">{c.nickname} {c.comment.match(/resubscribed.*$/i)?.[0] || c.comment}</span>
              </div>
            );
          }
          const grouped = groupConsecutiveMessages && isGroupedWithPrev(chats, i);
          const showName = showUsername && !grouped;
          return (
            <div key={c.id} className="px-3.5 py-2.5 flex items-center gap-2 rounded-[12px]" style={{ background: bubble, animation: getAnim(c.id), opacity: bubbleOp, borderColor: hl(c.comment) ? accent : undefined, borderWidth: hl(c.comment) ? 1 : undefined, borderStyle: hl(c.comment) ? 'solid' : undefined, boxShadow: hl(c.comment) ? `0 0 0 1px ${accent}` : undefined }}>
              {showAvatar && <img src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=2e2c45&color=a8a3ce`} alt={c.nickname} className="w-6 h-6 rounded-full object-cover shrink-0 border border-white/10" />}
              {showName && showBadges && badges.map((b) => (<span key={b.label} className="role-badge" style={{ background: badgeBg, color: badgeText }}>{b.label}</span>))}
              {showName && (
                <span className="font-black text-[11px] tracking-wider uppercase shrink-0" style={{ color: chatNameColor(c, showBadges && badges.length > 0 ? nameMod : nameUser) }}>{showPlatform && <img src={platformLogo(c.platform)} alt={c.platform || ''} className="w-3.5 h-3.5 rounded-full bg-white p-0.5 object-contain inline-block align-[-2px] mr-1" />}{c.nickname}</span>
              )}
              {showName && showMessage && <span className="text-white/40">:</span>}
              {showMessage && (
                <span className="text-[13px] font-bold truncate flex-1" style={{ color: text, lineHeight: lineSpacing }}><EmoteText text={c.comment} emotes={c.emotes} bttvMap={bttvMap} bttvEnabled={bttv} /><MessageExtras chat={c} permissionLevel={imageEmbedPermissionLevel} showYouTubePreview={showYouTubeLinkPreviews} dark /></span>
              )}
              {showTimestamp && c.timestamp ? <span className="text-white/30 text-[9px] font-mono shrink-0">{formatChatTime(c.timestamp, timeFormat)}</span> : null}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="cute-theme w-full max-w-[380px] flex flex-col gap-3 p-1" style={{ fontFamily: `'Nunito','Quicksand','${font}', sans-serif`, fontSize: `${fontSize}px`, background: 'transparent' }}>
      {chats.length === 0 ? null : chats.map((c, i) => {
        const badges = getBadges(c);
        const resub = isResub(c.comment);
        const emoteOnly = isEmoteOnly(c.comment);
        if (resub) {
          if (!showMessage) return null;
          const resubText = c.comment.match(/resubscribed.*$/i)?.[0] || c.comment;
          return (
            <div key={c.id} className="flex flex-col items-start gap-1" style={{ animation: getAnim(c.id) }}>
              <div className="w-full px-3.5 py-3 flex items-center gap-2.5 rounded-[12px]" style={{ background: resubGrad }}>
                <span className="role-badge shadow-sm" style={{ background: badgeBg, color: '#a3b2f8' }}>RESUB</span>
                <span className="font-extrabold text-[13px] sm:text-[14px] text-white tracking-wide truncate">{c.nickname} {resubText}</span>
              </div>
            </div>
          );
        }
        const grouped = groupConsecutiveMessages && isGroupedWithPrev(chats, i);
        const showName = showUsername && !grouped;
        if (emoteOnly) {
          return (
            <div key={c.id} className="flex flex-col items-start gap-1" style={{ animation: getAnim(c.id) }}>
              {showName && (
                <div className="flex items-center gap-2 px-1">
                  {showBadges && badges.map((b) => (<span key={b.label} className="role-badge" style={{ background: badgeBg, color: badgeText }}>{b.label}</span>))}
                  <span className="font-black text-[11px] tracking-wider uppercase" style={{ color: chatNameColor(c, showBadges && badges.length > 0 ? nameMod : nameUser) }}>{showPlatform && <img src={platformLogo(c.platform)} alt={c.platform || ''} className="w-3.5 h-3.5 rounded-full bg-white p-0.5 object-contain inline-block align-[-2px] mr-1" />}{c.nickname}</span>
                  {showTimestamp && c.timestamp ? <span className="text-white/30 text-[9px] font-mono">{formatChatTime(c.timestamp, timeFormat)}</span> : null}
                </div>
              )}
              {showMessage && (
                <div className="px-3 py-2 flex items-center gap-2 rounded-[12px]" style={{ background: bubble, lineHeight: lineSpacing, borderColor: hl(c.comment) ? accent : undefined, borderWidth: hl(c.comment) ? 1 : undefined, borderStyle: hl(c.comment) ? 'solid' : undefined, boxShadow: hl(c.comment) ? `0 0 0 1px ${accent}` : undefined }}>
                  <span className="text-[18px] leading-none">{c.comment}</span>
                  <MessageExtras chat={c} permissionLevel={imageEmbedPermissionLevel} showYouTubePreview={showYouTubeLinkPreviews} dark />
                </div>
              )}
            </div>
          );
        }
        return (
          <div key={c.id} className="flex flex-col items-start gap-1" style={{ animation: getAnim(c.id) }}>
            <div className="flex items-center gap-2 px-1">
              {showAvatar && <img src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=2e2c45&color=a8a3ce`} alt={c.nickname} className="w-5 h-5 rounded-full object-cover border border-white/10 shrink-0" />}
              {showName && showBadges && badges.map((b) => (<span key={b.label} className="role-badge" style={{ background: badgeBg, color: badgeText }}>{b.label}</span>))}
              {showName && (
                <span className="font-black text-[11px] tracking-wider uppercase" style={{ color: chatNameColor(c, showBadges && badges.length > 0 ? nameMod : nameUser) }}>{showPlatform && <img src={platformLogo(c.platform)} alt={c.platform || ''} className="w-3.5 h-3.5 rounded-full bg-white p-0.5 object-contain inline-block align-[-2px] mr-1" />}{c.nickname}</span>
              )}
              {showName && showTimestamp && c.timestamp ? <span className="text-white/30 text-[9px] font-mono">{formatChatTime(c.timestamp, timeFormat)}</span> : null}
            </div>
            {showMessage && (
              <div className="px-3.5 py-2.5 text-[13px] sm:text-[14px] font-bold leading-snug tracking-wide max-w-[95%] break-words rounded-[12px]" style={{ background: bubble, opacity: bubbleOp, color: text, lineHeight: lineSpacing, borderColor: hl(c.comment) ? accent : undefined, borderWidth: hl(c.comment) ? 1 : undefined, borderStyle: hl(c.comment) ? 'solid' : undefined, boxShadow: hl(c.comment) ? `0 0 0 1px ${accent}` : undefined }}>
                <EmoteText text={c.comment} emotes={c.emotes} bttvMap={bttvMap} bttvEnabled={bttv} />
                <MessageExtras chat={c} permissionLevel={imageEmbedPermissionLevel} showYouTubePreview={showYouTubeLinkPreviews} dark />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
