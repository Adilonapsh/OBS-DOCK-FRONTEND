import type { ChatThemeProps } from './types';
import { chatRoles, chatRoleLabel, chatRolePill, chatNameColor } from './roleUtils';
import { platformLogo } from './platformLogo';
import { EmoteText } from './EmoteText';
import { formatChatTime, isGroupedWithPrev, isMentionMessage, bubbleBg } from './chatFilters';
import { MessageExtras } from './MessageExtras';
import './Boxed.css';

export const themeMeta = { value: 'boxed', label: 'Boxed - Card dengan Header' } as const;

export default function BoxedTheme({ chats, font, accent, bg, showAvatar, showPlatform = true, showTimestamp, showBadges, bttv, bttvMap, anim, horizontalAnim, hideAnim, fontSize, bgOpacity, horizontal, inline, textColor, exitingIds, showUsername = true, showMessage = true, timeFormat = '24-hour', lineSpacing = 1.4, useChatBubbles = false, bubbleColor = '#1d1d1d', bubbleOpacity = 0.9, groupConsecutiveMessages = false, highlightMentions = false, imageEmbedPermissionLevel = '69420', showYouTubeLinkPreviews = false }: ChatThemeProps) {
  const fallbackBg = bg === 'transparent' ? 'rgba(12,12,12,0.9)' : bg;
  const bgColor = useChatBubbles ? bubbleBg(bubbleColor, bubbleOpacity, fallbackBg) : fallbackBg;
  const bgOp = useChatBubbles ? 1 : bgOpacity / 100;
  const text = textColor || '#fff';
  const sub = textColor || 'rgba(255,255,255,0.85)';
  const hide = hideAnim || 'fadeOut';
  const getAnim = (id: string) => { const isExiting = exitingIds?.has(id); const name = isExiting ? hide : (horizontal ? (horizontalAnim || anim) : anim); const isEleg = ['elegantIn','softPopIn','blurIn','luxeIn','elegantOut','softPopOut','blurOut','luxeOut'].includes(name); const d = isEleg ? '0.62s' : '0.45s'; return `${name} ${d} cubic-bezier(0.16,1,0.3,1) both`; };
  const hl = (comment: string) => highlightMentions && isMentionMessage(comment);
  if (horizontal) {
    return (
      <div className="chat-boxed-theme w-full max-w-none flex flex-row flex-wrap gap-2 items-end" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
        {chats.length === 0 ? null : chats.map((c, i) => {
          const grouped = groupConsecutiveMessages && isGroupedWithPrev(chats, i);
          const showName = showUsername && !grouped;
          return (
          <div
            key={c.id}
            className="boxed-row flex items-center gap-2 px-3 py-2 rounded-full bg-white/[0.06] border border-white/10 shrink-0 max-w-[340px]"
            style={{ animation: getAnim(c.id), background: bgColor, opacity: bgOp, borderColor: hl(c.comment) ? accent : undefined, boxShadow: hl(c.comment) ? `0 0 0 1px ${accent}` : undefined }}
          >
            {showAvatar && (
              <img
                src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`}
                alt={c.nickname}
                className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0"
              />
            )}
            {showName && (
              <span className="font-black text-[11px] shrink-0 flex items-center gap-1" style={{ color: chatNameColor(c, text) }}>{showPlatform && <img src={platformLogo(c.platform)} alt={c.platform || ''} className="w-3 h-3 rounded-full bg-white p-0.5 object-contain shrink-0" />}{showBadges && chatRoles(c).map((r) => (<span key={r} className={`px-1 py-px rounded text-[8px] font-black uppercase ${chatRolePill(c.platform, r)}`}>{chatRoleLabel(r)}</span>))}{c.nickname}</span>
            )}
            {showName && showMessage && <span className="text-white/30 text-[11px]">:</span>}
            {showMessage && (
              <span className="text-[12px] truncate" style={{ color: sub, lineHeight: lineSpacing }}><EmoteText text={c.comment} emotes={c.emotes} bttvMap={bttvMap} bttvEnabled={bttv} /><MessageExtras chat={c} permissionLevel={imageEmbedPermissionLevel} showYouTubePreview={showYouTubeLinkPreviews} dark /></span>
            )}
          </div>
          );
        })}
      </div>
    );
  }
  if (inline) {
    return (
      <div className="chat-boxed-theme w-full max-w-[440px] rounded-[16px] border border-white/10 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px`, background: bgColor, opacity: bgOp }}>
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between" style={{ background: `linear-gradient(90deg, ${accent}22, transparent)` }}>
          <span className="font-black text-[11px] uppercase tracking-widest text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: accent }} />
            LIVE CHAT
          </span>
          <span className="text-white/50 text-[10px] font-mono">{chats.length} messages</span>
        </div>
        <div className="p-3 flex flex-col gap-2 max-h-[520px] overflow-hidden">
          {chats.length === 0 ? null : chats.map((c, i) => {
            const grouped = groupConsecutiveMessages && isGroupedWithPrev(chats, i);
            const showName = showUsername && !grouped;
            return (
            <div key={c.id} className="boxed-row flex items-center gap-2 px-3 py-2 rounded-full bg-white/[0.04] border border-white/5" style={{ animation: getAnim(c.id), borderColor: hl(c.comment) ? accent : undefined, boxShadow: hl(c.comment) ? `0 0 0 1px ${accent}` : undefined }}>
              {showAvatar && <img src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`} alt={c.nickname} className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0" />}
              {showName && (
                <span className="font-black text-[11px] shrink-0 flex items-center gap-1" style={{ color: chatNameColor(c, text) }}>{showPlatform && <img src={platformLogo(c.platform)} alt={c.platform || ''} className="w-3 h-3 rounded-full bg-white p-0.5 object-contain shrink-0" />}{showBadges && chatRoles(c).map((r) => (<span key={r} className={`px-1 py-px rounded text-[8px] font-black uppercase ${chatRolePill(c.platform, r)}`}>{chatRoleLabel(r)}</span>))}{c.nickname}</span>
              )}
              {showName && showMessage && <span className="text-white/30 text-[11px]">:</span>}
              {showMessage && (
                <span className="text-[12px] truncate flex-1" style={{ color: sub, lineHeight: lineSpacing }}><EmoteText text={c.comment} emotes={c.emotes} bttvMap={bttvMap} bttvEnabled={bttv} /><MessageExtras chat={c} permissionLevel={imageEmbedPermissionLevel} showYouTubePreview={showYouTubeLinkPreviews} dark /></span>
              )}
            </div>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <div className="chat-boxed-theme w-full max-w-[440px] rounded-[20px] border border-white/10 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]" style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px`, background: bgColor, opacity: bgOp }}>
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between" style={{ background: `linear-gradient(90deg, ${accent}22, transparent)` }}>
        <span className="font-black text-[11px] uppercase tracking-widest text-white flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: accent }} />
          LIVE CHAT
        </span>
        <span className="text-white/50 text-[10px] font-mono">{chats.length} messages</span>
      </div>
      <div className="p-3 flex flex-col gap-2 max-h-[520px] overflow-hidden">
        {chats.length === 0 ? null : chats.map((c, i) => {
          const grouped = groupConsecutiveMessages && isGroupedWithPrev(chats, i);
          const showName = showUsername && !grouped;
          return (
          <div
            key={c.id}
            className="boxed-row flex gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/5"
            style={{ animation: getAnim(c.id), borderColor: hl(c.comment) ? accent : undefined, boxShadow: hl(c.comment) ? `0 0 0 1px ${accent}` : undefined }}
          >
            {showAvatar && (
              <img
                src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`}
                alt={c.nickname}
                className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              {showName && (
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-[12px] flex items-center gap-1" style={{ color: chatNameColor(c, text) }}>{showPlatform && <img src={platformLogo(c.platform)} alt={c.platform || ''} className="w-3.5 h-3.5 rounded-full bg-white p-0.5 object-contain shrink-0" />}{showBadges && chatRoles(c).map((r) => (<span key={r} className={`px-1 py-px rounded text-[8px] font-black uppercase ${chatRolePill(c.platform, r)}`}>{chatRoleLabel(r)}</span>))}{c.nickname}</span>
                  {showTimestamp && c.timestamp ? <span className="text-white/30 text-[10px] font-mono">{formatChatTime(c.timestamp, timeFormat)}</span> : null}
                  <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
                </div>
              )}
              {showMessage && (
                <p className="text-[13px] leading-snug break-words mt-0.5" style={{ color: sub, lineHeight: lineSpacing }}><EmoteText text={c.comment} emotes={c.emotes} bttvMap={bttvMap} bttvEnabled={bttv} /><MessageExtras chat={c} permissionLevel={imageEmbedPermissionLevel} showYouTubePreview={showYouTubeLinkPreviews} dark /></p>
              )}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
