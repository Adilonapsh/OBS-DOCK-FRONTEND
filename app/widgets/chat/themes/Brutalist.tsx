import type { ChatThemeProps } from './types';
import { platformLogo } from './platformLogo';
import { chatRoles, chatRoleLabel, chatRoleColor, chatNameColor } from './roleUtils';
import { EmoteText } from './EmoteText';
import { formatChatTime, isGroupedWithPrev, isMentionMessage } from './chatFilters';
import { MessageExtras } from './MessageExtras';
import './Brutalist.css';

export const themeMeta = { value: 'brutalist', label: 'Brutalist' } as const;

function escapeHTML(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export default function BrutalistTheme({
  chats,
  font,
  accent,
  bg,
  maxMessages,
  showAvatar,
  showPlatform,
  showTimestamp,
  showBadges,
  bttv,
  bttvMap,
  fontSize,
  bgOpacity: _bgOpacity,
  textColor,
  exitingIds,
  horizontal,
  anim,
  horizontalAnim,
  hideAnim,
  showUsername = true,
  showMessage = true,
  timeFormat = '24-hour',
  lineSpacing = 1.4,
  groupConsecutiveMessages = false,
  highlightMentions = false,
  brutalistBg,
  brutalistTextColor,
  brutalistBadgeBg,
  brutalistBorderColor,
  brutalistShadow,
  brutalistHalftone,
  brutalistTail,
  brutalistItalic,
  brutalistUppercase,
}: ChatThemeProps & {
  // brutalist specific - will come from ChatSettings if added, fallback to defaults matching HTML
  brutalistBg?: string;
  brutalistTextColor?: string;
  brutalistBadgeBg?: string;
  brutalistBorderColor?: string;
  brutalistShadow?: number;
  brutalistHalftone?: boolean;
  brutalistTail?: boolean;
  brutalistItalic?: boolean;
  brutalistUppercase?: boolean;
}) {
  const visible = chats.slice(-maxMessages);
  // Brutalist defaults matching HTML's default preset (Classic White) - prioritize brutalist* props
  const bubbleBg = brutalistBg || (bg && bg !== 'transparent' ? bg : '#FFFFFF');
  const txtColor = brutalistTextColor || textColor || '#000000';
  const badgeBg = brutalistBadgeBg || '#FFFFFF';
  const borderColor = brutalistBorderColor || '#000000';
  const shadowOffset = brutalistShadow ?? 6;
  const hasHalftone = brutalistHalftone ?? true;
  const hasTail = brutalistTail ?? true;
  const isItalic = brutalistItalic ?? true;
  const isUppercase = brutalistUppercase ?? true;

  const getBorderStyle = () => `4px solid ${borderColor}`;
  const getShadow = () => `${shadowOffset}px ${shadowOffset}px 0px 0px ${borderColor}`;
  const getAvatarShadow = () => `3px 3px 0px 0px ${borderColor}`;

  const hide = hideAnim || 'fadeOut';
  const getAnim = (id: string) => {
    const isExiting = exitingIds?.has(id);
    const raw = isExiting ? hide : (horizontal ? (horizontalAnim || anim) : anim) || 'brutalistIn';
    // if user explicitly wants brutalist, keep it, otherwise use selected anim
    if (raw === 'brutalistIn' || raw === 'brutalistOut') return `${raw} 0.4s cubic-bezier(0.16,1,0.3,1) both`;
    const isEleg = ['elegantIn','softPopIn','blurIn','luxeIn','elegantOut','softPopOut','blurOut','luxeOut'].includes(raw);
    const d = isEleg ? '0.62s' : '0.4s';
    return `${raw} ${d} cubic-bezier(0.16,1,0.3,1) both`;
  };

  // Reuse plain text border logic not needed - brutalist already has hard border + shadow

  if (horizontal) {
    return (
      <>
        <div
          className="w-full max-w-none flex flex-row flex-wrap gap-4 items-end"
          style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px`, background: 'transparent' }}
        >
          {visible.map((c) => {
            const isExiting = exitingIds?.has(c.id);
            const hl = highlightMentions && isMentionMessage(c.comment);
            const bubbleBgEffective = hl ? `${accent}33` : bubbleBg;
            return (
              <div
                key={c.id}
                className="brutalist-item shrink-0 max-w-[360px]"
                style={{
                  opacity: isExiting ? 0 : 1,
                  transition: 'opacity 0.3s ease',
                  animation: getAnim(c.id),
                }}
              >
                <div className="flex flex-row gap-3 items-start w-fit max-w-full relative">
                  {showAvatar && (
                    <div
                      className="block shrink-0 mt-1 overflow-hidden"
                      style={{ border: getBorderStyle(), backgroundColor: '#FFFFFF', boxShadow: getAvatarShadow(), width: 44, height: 44 }}
                    >
                      <img
                        src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`}
                        alt={c.nickname}
                        className="w-10 h-10 object-cover rotate-[-2deg] scale-110"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`; }}
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-0 max-w-full items-start">
                    {showUsername && (
                      <div
                        className="flex flex-row flex-wrap items-center gap-2 px-3 py-1 mb-[-4px] z-20 rotate-[-1deg]"
                        style={{ border: getBorderStyle(), backgroundColor: badgeBg, color: txtColor, fontSize: 14, fontWeight: 800, fontFamily: `'Outfit', sans-serif`, boxShadow: `4px 4px 0px 0px ${borderColor}`, marginLeft: showAvatar ? 0 : 0 }}
                      >
                        <span>{escapeHTML(c.nickname)}</span>
                        {showBadges && chatRoles(c).length > 0 && (
                          <span className="flex items-center gap-1">
                            {chatRoles(c).map((r) => (
                              <span key={r} style={{ color: chatRoleColor(r), fontWeight: 800, fontSize: '0.8em' }}>[{chatRoleLabel(r)}]</span>
                            ))}
                          </span>
                        )}
                        {showPlatform && (
                          <img src={platformLogo(c.platform)} alt={c.platform || 'tiktok'} style={{ width: 14, height: 14, objectFit: 'contain' }} />
                        )}
                      </div>
                    )}
                    {showMessage && (
                      <div
                        className="brutalist-bubble relative p-4 px-6"
                        style={{
                          border: getBorderStyle(),
                          backgroundColor: bubbleBgEffective,
                          color: txtColor,
                          boxShadow: getShadow(),
                          fontFamily: `'Outfit', sans-serif`,
                          fontSize: `${fontSize}px`,
                          lineHeight: lineSpacing,
                          fontStyle: isItalic ? 'italic' : 'normal',
                          textTransform: isUppercase ? 'uppercase' : 'none',
                          fontWeight: 700,
                        }}
                      >
                        {hasHalftone && <div className="absolute inset-0 z-0 pointer-events-none brutal-halftone" style={{ opacity: 0.05 }} />}
                        {hasTail && (
                          <>
                            <div className="absolute w-8 h-8 left-10 -bottom-8 brut-bubble-tail" style={{ backgroundColor: borderColor }} />
                            <div className="absolute w-8 h-8 left-10 -bottom-8 brut-bubble-tail translate-y-[-4px]" style={{ backgroundColor: bubbleBgEffective }} />
                          </>
                        )}
                        <div className="relative z-10 font-bold tracking-tight" style={{ wordBreak: 'break-word' }}>
                          <EmoteText text={c.comment} emotes={c.emotes} bttvMap={bttvMap} bttvEnabled={bttv} />
                          <MessageExtras chat={c} permissionLevel={'69420'} showYouTubePreview={false} dark={false} />
                        </div>
                      </div>
                    )}
                    {showTimestamp && c.timestamp ? (
                      <span style={{ color: 'rgba(0,0,0,0.5)', fontSize: '0.75em', marginLeft: 6, fontFamily: 'monospace' }}>
                        {formatChatTime(c.timestamp, timeFormat)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="w-full max-w-[420px] flex flex-col gap-6"
        style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px`, background: 'transparent' }}
      >
        {visible.map((c, i) => {
          const isExiting = exitingIds?.has(c.id);
          const grouped = groupConsecutiveMessages && isGroupedWithPrev(visible, i);
          const showName = showUsername && !grouped;
          const hl = highlightMentions && isMentionMessage(c.comment);
          const bubbleBgEffective = hl ? `${accent}33` : bubbleBg;
          return (
            <div
              key={c.id}
              className="brutalist-item w-full flex flex-col items-start"
              style={{
                opacity: isExiting ? 0 : 1,
                transition: 'opacity 0.3s ease',
                animation: 'brutalistIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
              }}
            >
              <div className="flex flex-row gap-4 items-start w-fit max-w-full relative">
                {showAvatar && !grouped && (
                  <div
                    className="block shrink-0 mt-1.5 overflow-hidden"
                    style={{ border: getBorderStyle(), backgroundColor: '#FFFFFF', boxShadow: getAvatarShadow(), width: 44, height: 44 }}
                  >
                    <img
                      src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`}
                      alt={c.nickname}
                      className="w-10 h-10 object-cover rotate-[-2deg] scale-110"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`; }}
                    />
                  </div>
                )}
                <div className="flex flex-col gap-0 max-w-full items-start">
                  {showName && (
                    <div
                      className="flex flex-row flex-wrap items-center gap-2 px-3 py-1 mb-[-4px] z-20 rotate-[-1deg]"
                      style={{ border: getBorderStyle(), backgroundColor: badgeBg, color: txtColor, fontSize: 12, fontWeight: 800, fontFamily: `'Outfit', sans-serif`, boxShadow: `4px 4px 0px 0px ${borderColor}` }}
                    >
                      <span>{escapeHTML(c.nickname)}</span>
                      {showBadges && chatRoles(c).length > 0 && (
                        <span className="flex items-center gap-1">
                          {chatRoles(c).map((r) => (
                            <span key={r} style={{ color: chatRoleColor(r), fontWeight: 800, fontSize: '0.8em' }}>[{chatRoleLabel(r)}]</span>
                          ))}
                        </span>
                      )}
                      {showPlatform && (
                        <img src={platformLogo(c.platform)} alt={c.platform || 'tiktok'} style={{ width: 14, height: 14, objectFit: 'contain' }} />
                      )}
                    </div>
                  )}
                  {showMessage && (
                    <div
                      className="brutalist-bubble relative p-4 px-6"
                      style={{
                        border: getBorderStyle(),
                        backgroundColor: bubbleBgEffective,
                        color: txtColor,
                        boxShadow: getShadow(),
                        fontFamily: `'Outfit', sans-serif`,
                        fontSize: `${fontSize}px`,
                        lineHeight: lineSpacing,
                        fontStyle: isItalic ? 'italic' : 'normal',
                        textTransform: isUppercase ? 'uppercase' : 'none',
                        fontWeight: 700,
                      }}
                    >
                      {hasHalftone && <div className="absolute inset-0 z-0 pointer-events-none brutal-halftone" style={{ opacity: 0.05 }} />}
                      {hasTail && (
                        <>
                          <div className="absolute w-8 h-8 left-10 -bottom-8 brut-bubble-tail" style={{ backgroundColor: borderColor }} />
                          <div className="absolute w-8 h-8 left-10 -bottom-8 brut-bubble-tail translate-y-[-4px]" style={{ backgroundColor: bubbleBgEffective }} />
                        </>
                      )}
                      <div className="relative z-10 font-bold tracking-tight" style={{ wordBreak: 'break-word' }}>
                        <span style={{ color: txtColor }}>
                          <EmoteText text={c.comment} emotes={c.emotes} bttvMap={bttvMap} bttvEnabled={bttv} />
                          <MessageExtras chat={c} permissionLevel={'69420'} showYouTubePreview={false} dark={false} />
                        </span>
                      </div>
                    </div>
                  )}
                  {showTimestamp && c.timestamp ? (
                    <span style={{ color: 'rgba(0,0,0,0.5)', fontSize: '0.75em', marginLeft: 6, fontFamily: 'monospace' }}>
                      {formatChatTime(c.timestamp, timeFormat)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
