import type { ChatThemeProps } from './types';
import { platformLogo } from './platformLogo';
import { chatRoles, chatRoleLabel, chatRolePill, chatNameColor } from './roleUtils';
import { EmoteText } from './EmoteText';
import { formatChatTime, isGroupedWithPrev, isMentionMessage, bubbleBg } from './chatFilters';
import { MessageExtras } from './MessageExtras';
import './Standard.css';

export const themeMeta = { value: 'standard', label: 'Standard - Dark Glass' } as const;

export default function StandardTheme({ chats, font, accent, bg, showAvatar, showPlatform, showTimestamp, showBadges, bttv, bttvMap, anim, horizontalAnim, hideAnim, fontSize, bgOpacity, horizontal, inline, textColor, exitingIds, showUsername = true, showMessage = true, timeFormat = '24-hour', lineSpacing = 1.4, useChatBubbles = false, bubbleColor = '#1d1d1d', bubbleOpacity = 0.9, groupConsecutiveMessages = false, highlightMentions = false, imageEmbedPermissionLevel = '69420', showYouTubeLinkPreviews = false }: ChatThemeProps) {
  const fallbackBg = bg === 'transparent' ? 'rgba(18,18,18,0.88)' : bg;
  const bgColor = useChatBubbles ? bubbleBg(bubbleColor, bubbleOpacity, fallbackBg) : fallbackBg;
  const bgOp = useChatBubbles ? 1 : bgOpacity / 100;
  const text = textColor || '#fff';
  const effectiveAnim = horizontal ? (horizontalAnim || anim) : anim;
  const hide = hideAnim || 'fadeOut';
  const getAnim = (id: string) => {
    const isExiting = exitingIds?.has(id);
    const name = isExiting ? hide : effectiveAnim;
    const isEleg = ['elegantIn','softPopIn','blurIn','luxeIn','elegantOut','softPopOut','blurOut','luxeOut'].includes(name);
    const d = isEleg ? '0.62s' : '0.45s';
    return `${name} ${d} cubic-bezier(0.16,1,0.3,1) both`;
  };
  const hl = (comment: string) => highlightMentions && isMentionMessage(comment);
  if (horizontal) {
    return (
      <div className="chat-standard-theme w-full max-w-none flex flex-row flex-wrap gap-2 items-end content-end" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
        {chats.length === 0 ? null : chats.map((c, i) => {
          const grouped = groupConsecutiveMessages && isGroupedWithPrev(chats, i);
          const showName = showUsername && !grouped;
          return (
          <div
            key={c.id}
            className="chat-bubble flex items-center gap-2 backdrop-blur-2xl border shadow-[0_8px_32px_rgba(0,0,0,0.4)] px-3 py-2 will-change-transform shrink-0 max-w-[360px]"
            style={{
              background: bgColor,
              borderColor: hl(c.comment) ? accent : 'rgba(255,255,255,0.10)',
              borderRadius: '999px',
              opacity: bgOp,
              animation: getAnim(c.id),
              borderLeft: `3px solid ${accent}`,
              boxShadow: hl(c.comment) ? `0 0 0 1px ${accent}, 0 8px 32px rgba(0,0,0,0.4)` : undefined,
            }}
          >
            {showAvatar && (
              <img
                src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`}
                alt={c.nickname}
                className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`; }}
              />
            )}
            {showName && (
              <>
                <span className="font-black text-[11px] flex items-center gap-1 shrink-0" style={{ color: chatNameColor(c, text) }}>
                  {showPlatform && <img src={platformLogo(c.platform)} alt={c.platform} className="w-3 h-3 rounded-full bg-white p-0.5 object-contain" />}
                  {showBadges && chatRoles(c).map((r) => (<span key={r} className={`px-1 py-px rounded text-[8px] font-black uppercase ${chatRolePill(c.platform, r)}`}>{chatRoleLabel(r)}</span>))}
                  {c.nickname}
                </span>
                {showMessage && <span className="text-white/40 text-[11px]">:</span>}
              </>
            )}
            {showMessage && (
              <span className="text-[12px] truncate" style={{ color: text, lineHeight: lineSpacing }}><EmoteText text={c.comment} emotes={c.emotes} bttvMap={bttvMap} bttvEnabled={bttv} /><MessageExtras chat={c} permissionLevel={imageEmbedPermissionLevel} showYouTubePreview={showYouTubeLinkPreviews} /></span>
            )}
            {showTimestamp && c.timestamp ? <span className="text-white/30 text-[9px] font-mono shrink-0">{formatChatTime(c.timestamp, timeFormat)}</span> : null}
          </div>
          );
        })}
      </div>
    );
  }
  if (inline) {
    return (
      <div className="chat-standard-theme w-full max-w-[420px] flex flex-col gap-2" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
        {chats.length === 0 ? null : chats.map((c, i) => {
          const grouped = groupConsecutiveMessages && isGroupedWithPrev(chats, i);
          const showName = showUsername && !grouped;
          return (
          <div
            key={c.id}
            className="chat-bubble flex items-center gap-2 backdrop-blur-2xl border shadow-[0_8px_32px_rgba(0,0,0,0.4)] px-3 py-2 will-change-transform"
            style={{
              background: bgColor,
              borderColor: hl(c.comment) ? accent : 'rgba(255,255,255,0.10)',
              borderRadius: '999px',
              opacity: bgOp,
              animation: getAnim(c.id),
              borderLeft: `3px solid ${accent}`,
            }}
          >
            {showAvatar && (
              <img
                src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`}
                alt={c.nickname}
                className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`; }}
              />
            )}
            {showName && (
              <>
                <span className="font-black text-[11px] shrink-0 flex items-center gap-1" style={{ color: chatNameColor(c, text) }}>
                  {showPlatform && <img src={platformLogo(c.platform)} alt={c.platform} className="w-3 h-3 rounded-full bg-white p-0.5 object-contain" />}
                  {showBadges && chatRoles(c).map((r) => (<span key={r} className={`px-1 py-px rounded text-[8px] font-black uppercase ${chatRolePill(c.platform, r)}`}>{chatRoleLabel(r)}</span>))}
                  {c.nickname}
                </span>
                {showMessage && <span className="text-white/40 text-[11px]">:</span>}
              </>
            )}
            {showMessage && (
              <span className="text-[12px] truncate flex-1" style={{ color: text, lineHeight: lineSpacing }}><EmoteText text={c.comment} emotes={c.emotes} bttvMap={bttvMap} bttvEnabled={bttv} /><MessageExtras chat={c} permissionLevel={imageEmbedPermissionLevel} showYouTubePreview={showYouTubeLinkPreviews} /></span>
            )}
            {showTimestamp && c.timestamp ? <span className="text-white/30 text-[9px] font-mono shrink-0">{formatChatTime(c.timestamp, timeFormat)}</span> : null}
          </div>
          );
        })}
      </div>
    );
  }
  return (
    <div className="chat-standard-theme w-full max-w-[420px] flex flex-col gap-2" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
      {chats.length === 0 ? null : chats.map((c, i) => {
        const grouped = groupConsecutiveMessages && isGroupedWithPrev(chats, i);
        const showName = showUsername && !grouped;
        return (
        <div
          key={c.id}
          className="chat-bubble flex gap-2.5 backdrop-blur-2xl border shadow-[0_8px_32px_rgba(0,0,0,0.4)] px-3 py-2.5 will-change-transform"
          style={{
            background: bgColor,
            borderColor: hl(c.comment) ? accent : 'rgba(255,255,255,0.10)',
            borderRadius: '16px',
            opacity: bgOp,
            animation: getAnim(c.id),
            borderLeft: `3px solid ${accent}`,
          }}
        >
          {showAvatar && (
            <img
              src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`}
              alt={c.nickname}
              className="w-8 h-8 rounded-xl object-cover border border-white/10 shrink-0"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`; }}
            />
          )}
          <div className="flex-1 min-w-0">
            {showName && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-[12px] leading-none tracking-tight flex items-center gap-1" style={{ color: chatNameColor(c, text) }}>
                  {showPlatform && <img src={platformLogo(c.platform)} alt={c.platform} className="w-3.5 h-3.5 rounded-full bg-white p-0.5 object-contain" />}
                  {showBadges && chatRoles(c).map((r) => (<span key={r} className={`px-1 py-px rounded text-[8px] font-black uppercase ${chatRolePill(c.platform, r)}`}>{chatRoleLabel(r)}</span>))}
                  {c.nickname}
                </span>
                {showTimestamp && c.timestamp ? <span className="text-white/40 text-[10px] font-mono">{formatChatTime(c.timestamp, timeFormat)}</span> : null}
              </div>
            )}
            {showMessage && (
              <p className="text-[13px] break-words mt-0.5 line-clamp-3" style={{ color: text, lineHeight: lineSpacing }}><EmoteText text={c.comment} emotes={c.emotes} bttvMap={bttvMap} bttvEnabled={bttv} /><MessageExtras chat={c} permissionLevel={imageEmbedPermissionLevel} showYouTubePreview={showYouTubeLinkPreviews} /></p>
            )}
          </div>
        </div>
        );
      })}
    </div>
  );
}
