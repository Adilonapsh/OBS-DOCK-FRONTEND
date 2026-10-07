import type { ChatThemeProps } from './types';
import { chatRoles, chatRoleLabel, chatRolePill, chatNameColor } from './roleUtils';
import { platformLogo } from './platformLogo';
import { EmoteText } from './EmoteText';
import { formatChatTime, isGroupedWithPrev, isMentionMessage, bubbleBg } from './chatFilters';
import { MessageExtras } from './MessageExtras';
import './Clean.css';

export const themeMeta = { value: 'clean', label: 'Clean - Baris Minimalis' } as const;

export default function CleanTheme({ chats, font, accent, bg, showAvatar, showPlatform = true, showTimestamp, showBadges, bttv, bttvMap, anim, horizontalAnim, hideAnim, fontSize, bgOpacity, horizontal, inline, textColor, exitingIds, showUsername = true, showMessage = true, timeFormat = '24-hour', lineSpacing = 1.4, useChatBubbles = false, bubbleColor = '#1d1d1d', bubbleOpacity = 0.9, groupConsecutiveMessages = false, highlightMentions = false, imageEmbedPermissionLevel = '69420', showYouTubeLinkPreviews = false }: ChatThemeProps) {
  const fallbackBg = bg === 'transparent' ? 'rgba(255,255,255,0.92)' : bg;
  const bgColor = useChatBubbles ? bubbleBg(bubbleColor, bubbleOpacity, fallbackBg) : fallbackBg;
  const bgOp = useChatBubbles ? 1 : bgOpacity / 100;
  const isLight = bg === 'transparent' || bg.toLowerCase().includes('fff') || bg.toLowerCase().includes('ffffff');
  const nameColor = textColor || (isLight ? '#111' : '#fff');
  const msgColor = textColor || (isLight ? '#222' : 'rgba(255,255,255,0.9)');
  const hide = hideAnim || 'fadeOut';
  const getAnim = (id: string) => { const isExiting = exitingIds?.has(id); const name = isExiting ? hide : (horizontal ? (horizontalAnim || anim) : anim); const isEleg = ['elegantIn','softPopIn','blurIn','luxeIn','elegantOut','softPopOut','blurOut','luxeOut'].includes(name); const d = isEleg ? '0.62s' : '0.4s'; return `${name} ${d} cubic-bezier(0.16,1,0.3,1) both`; };
  const hl = (comment: string) => highlightMentions && isMentionMessage(comment);
  if (horizontal) {
    return (
      <div className="chat-clean-theme w-full max-w-none flex flex-row flex-wrap gap-2 items-end" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
        {chats.length === 0 ? null : chats.map((c, i) => {
          const grouped = groupConsecutiveMessages && isGroupedWithPrev(chats, i);
          const showName = showUsername && !grouped;
          const highlighted = hl(c.comment);
          return (
          <div
            key={c.id}
            className="clean-row flex items-center gap-2 px-3 py-1.5 rounded-full border shrink-0 max-w-[320px]"
            style={{
              background: bgColor,
              borderColor: highlighted ? accent : (isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'),
              opacity: bgOp,
              animation: getAnim(c.id),
              boxShadow: highlighted ? `0 0 0 1px ${accent}` : undefined,
            }}
          >
            {showAvatar && (
              <img
                src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}`}
                alt={c.nickname}
                className="w-5 h-5 rounded-full object-cover shrink-0"
              />
            )}
            {showName && (
              <>
                <span className="font-black text-[11px] shrink-0 flex items-center gap-1" style={{ color: chatNameColor(c, nameColor) }}>{showPlatform && <img src={platformLogo(c.platform)} alt={c.platform || ''} className="w-3 h-3 rounded-full bg-white p-0.5 object-contain shrink-0" />}{showBadges && chatRoles(c).map((r) => (<span key={r} className={`px-1 py-px rounded text-[8px] font-black uppercase shrink-0 ${chatRolePill(c.platform, r)}`}>{chatRoleLabel(r)}</span>))}<span className="truncate">{c.nickname}</span></span>
                {showMessage && <span className="text-[11px] opacity-30">:</span>}
              </>
            )}
            {showMessage && <span className="text-[12px] truncate" style={{ color: msgColor, lineHeight: lineSpacing }}><EmoteText text={c.comment} emotes={c.emotes} bttvMap={bttvMap} bttvEnabled={bttv} /><MessageExtras chat={c} permissionLevel={imageEmbedPermissionLevel} showYouTubePreview={showYouTubeLinkPreviews} dark={!isLight} /></span>}
          </div>
          );
        })}
      </div>
    );
  }
  if (inline) {
    return (
      <div className="chat-clean-theme w-full max-w-[420px] flex flex-col gap-1.5" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
        {chats.length === 0 ? null : chats.map((c, i) => {
          const grouped = groupConsecutiveMessages && isGroupedWithPrev(chats, i);
          const showName = showUsername && !grouped;
          const highlighted = hl(c.comment);
          return (
          <div
            key={c.id}
            className="clean-row flex items-center gap-2 px-3 py-2 rounded-full border"
            style={{
              background: bgColor,
              borderColor: highlighted ? accent : (isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'),
              opacity: bgOp,
              animation: getAnim(c.id),
              boxShadow: highlighted ? `0 0 0 1px ${accent}` : undefined,
            }}
          >
            {showAvatar && <img src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}`} alt={c.nickname} className="w-5 h-5 rounded-full object-cover shrink-0" />}
            {showName && (
              <>
                <span className="font-black text-[11px] shrink-0 flex items-center gap-1" style={{ color: chatNameColor(c, nameColor) }}>{showPlatform && <img src={platformLogo(c.platform)} alt={c.platform || ''} className="w-3 h-3 rounded-full bg-white p-0.5 object-contain shrink-0" />}{showBadges && chatRoles(c).map((r) => (<span key={r} className={`px-1 py-px rounded text-[8px] font-black uppercase shrink-0 ${chatRolePill(c.platform, r)}`}>{chatRoleLabel(r)}</span>))}<span className="truncate">{c.nickname}</span></span>
                {showMessage && <span className="text-[11px] opacity-30">:</span>}
              </>
            )}
            {showMessage && <span className="text-[12px] truncate flex-1" style={{ color: msgColor, lineHeight: lineSpacing }}><EmoteText text={c.comment} emotes={c.emotes} bttvMap={bttvMap} bttvEnabled={bttv} /><MessageExtras chat={c} permissionLevel={imageEmbedPermissionLevel} showYouTubePreview={showYouTubeLinkPreviews} dark={!isLight} /></span>}
          </div>
          );
        })}
      </div>
    );
  }
  return (
    <div className="chat-clean-theme w-full max-w-[420px] flex flex-col gap-1.5" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
      {chats.length === 0 ? null : chats.map((c, i) => {
        const grouped = groupConsecutiveMessages && isGroupedWithPrev(chats, i);
        const showName = showUsername && !grouped;
        const highlighted = hl(c.comment);
        return (
        <div
          key={c.id}
          className="clean-row flex items-center gap-3 px-3 py-2 rounded-xl border"
          style={{
            background: bgColor,
            borderColor: highlighted ? accent : (isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'),
            opacity: bgOp,
            animation: getAnim(c.id),
            borderLeft: `3px solid ${accent}`,
            boxShadow: highlighted ? `0 0 0 1px ${accent}` : undefined,
          }}
        >
          {showAvatar && (
            <img
              src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}`}
              alt={c.nickname}
              className="w-6 h-6 rounded-full object-cover shrink-0"
            />
          )}
          <div className="flex-1 min-w-0 flex items-baseline gap-2 flex-wrap">
            {showName && <span className="font-black text-[12px] flex items-center gap-1" style={{ color: chatNameColor(c, nameColor) }}>{showPlatform && <img src={platformLogo(c.platform)} alt={c.platform || ''} className="w-3.5 h-3.5 rounded-full bg-white p-0.5 object-contain shrink-0" />}{showBadges && chatRoles(c).map((r) => (<span key={r} className={`px-1 py-px rounded text-[8px] font-black uppercase shrink-0 ${chatRolePill(c.platform, r)}`}>{chatRoleLabel(r)}</span>))}<span className="truncate">{c.nickname}</span></span>}
            {showMessage && <span className="text-[13px] leading-none break-words flex-1" style={{ color: msgColor, lineHeight: lineSpacing }}><EmoteText text={c.comment} emotes={c.emotes} bttvMap={bttvMap} bttvEnabled={bttv} /><MessageExtras chat={c} permissionLevel={imageEmbedPermissionLevel} showYouTubePreview={showYouTubeLinkPreviews} dark={!isLight} /></span>}
          </div>
          {showTimestamp && c.timestamp ? <span className="text-[10px] font-mono shrink-0" style={{ color: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.4)' }}>{formatChatTime(c.timestamp, timeFormat)}</span> : null}
        </div>
        );
      })}
    </div>
  );
}
