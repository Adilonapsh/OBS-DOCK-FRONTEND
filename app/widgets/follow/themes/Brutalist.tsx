import type { FollowThemeProps } from './types';
import './Brutalist.css';
import { Heart, UserPlus } from 'lucide-react';

export const themeMeta = { value: 'brutalist', label: 'Brutalist - Neo Brutalist' } as const;

export default function BrutalistTheme({
  follows,
  font,
  accent,
  bg: _bg,
  showAvatar,
  anim,
  hideAnim,
  fontSize,
  bgOpacity: _bgOpacity,
  horizontal,
  inline,
  exitingIds,
  maxFollows,
  brutalistBg,
  brutalistTextColor,
  brutalistBadgeBg,
  brutalistBorderColor,
  brutalistShadow,
  brutalistHalftone,
  brutalistTail,
  brutalistItalic,
  brutalistUppercase,
}: FollowThemeProps) {
  const bubbleBg = brutalistBg || '#FFFFFF';
  const textColor = brutalistTextColor || '#000000';
  const badgeBg = brutalistBadgeBg || '#FFFFFF';
  const borderColor = brutalistBorderColor || '#000000';
  const shadowOffset = brutalistShadow ?? 6;
  const hasHalftone = brutalistHalftone ?? true;
  const hasTail = brutalistTail ?? true;
  const isItalic = brutalistItalic ?? true;
  const isUppercase = brutalistUppercase ?? true;
  const getBorder = () => `4px solid ${borderColor}`;
  const getShadow = () => `${shadowOffset}px ${shadowOffset}px 0px 0px ${borderColor}`;
  const getAvatarShadow = () => `3px 3px 0px 0px ${borderColor}`;

  const visible = follows.slice(-(maxFollows || 6));

  const getAnim = (id: string) => {
    const isExiting = exitingIds?.has(id);
    const raw = isExiting ? (hideAnim || 'brutalistOut') : (horizontal ? (anim || 'brutalistIn') : anim) || 'brutalistIn';
    if (raw === 'brutalistIn' || raw === 'brutalistOut') return `${raw} 0.4s cubic-bezier(0.16,1,0.3,1) both`;
    const isEleg = ['elegantIn', 'softPopIn', 'blurIn', 'luxeIn', 'elegantOut', 'softPopOut', 'blurOut', 'luxeOut'].includes(raw);
    const d = isEleg ? '0.62s' : '0.4s';
    return `${raw} ${d} cubic-bezier(0.16,1,0.3,1) both`;
  };

  const isRow = Boolean(horizontal || inline);
  const containerClass = isRow
    ? 'w-full max-w-none flex flex-row flex-wrap gap-4 items-end'
    : 'w-full max-w-[420px] flex flex-col gap-6';

  // empty state — overlay transparan, jangan tampilkan menunggu follow
  if (visible.length === 0) return null;

  if (isRow) {
    return (
      <div className={containerClass} style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
        {visible.map((f) => {
          const isExiting = exitingIds?.has(f.id);
          return (
            <div
              key={f.id}
              className="brutalist-item shrink-0 max-w-[340px]"
              style={{ opacity: isExiting ? 0 : 1, transition: 'opacity 0.3s ease', animation: getAnim(f.id) }}
            >
              <div className="flex flex-row gap-3 items-start w-fit max-w-full relative">
                {showAvatar && (
                  <div
                    className="block shrink-0 mt-1 overflow-hidden"
                    style={{ border: getBorder(), backgroundColor: '#FFFFFF', boxShadow: getAvatarShadow(), width: 44, height: 44 }}
                  >
                    <img
                      src={
                        f.profilePictureUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(f.nickname)}&background=222&color=fff`
                      }
                      alt={f.nickname}
                      className="w-10 h-10 object-cover rotate-[-2deg] scale-110"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(f.nickname)}&background=222&color=fff`;
                      }}
                    />
                  </div>
                )}
                <div className="flex flex-col gap-0 max-w-full items-start">
                  <div
                    className="flex flex-row flex-wrap items-center gap-2 px-3 py-1 mb-[-4px] z-20 rotate-[-1deg]"
                    style={{
                      border: getBorder(),
                      backgroundColor: badgeBg,
                      color: textColor,
                      fontSize: 12,
                      fontWeight: 800,
                      fontFamily: `'Outfit', sans-serif`,
                      boxShadow: `4px 4px 0px 0px ${borderColor}`,
                      fontStyle: isItalic ? 'italic' : 'normal',
                      textTransform: isUppercase ? 'uppercase' : 'none',
                    }}
                  >
                    <span className="truncate max-w-[120px]">{f.nickname}</span>
                    <span
                      className="w-5 h-5 flex items-center justify-center shrink-0 rotate-[-1deg]"
                      style={{ backgroundColor: accent, border: `2px solid ${borderColor}` }}
                    >
                      <Heart className="w-3 h-3 text-white fill-white" />
                    </span>
                  </div>
                  <div
                    className="brutalist-bubble relative px-4 py-3 flex items-center gap-2.5"
                    style={{
                      border: getBorder(),
                      backgroundColor: bubbleBg,
                      color: textColor,
                      boxShadow: getShadow(),
                      fontFamily: `'${font}', sans-serif`,
                      fontStyle: isItalic ? 'italic' : 'normal',
                      textTransform: isUppercase ? 'uppercase' : 'none',
                    }}
                  >
                    {hasHalftone && <div className="absolute inset-0 pointer-events-none brutal-halftone" style={{ opacity: 0.05 }} />}
                    {hasTail && (
                      <>
                        <div className="absolute w-6 h-6 left-8 -bottom-6 brut-bubble-tail" style={{ backgroundColor: borderColor }} />
                        <div
                          className="absolute w-6 h-6 left-8 -bottom-6 brut-bubble-tail translate-y-[-3px]"
                          style={{ backgroundColor: bubbleBg }}
                        />
                      </>
                    )}
                    <div className="relative z-10 flex items-center gap-2 min-w-0">
                      <span className="font-black text-[11px] uppercase tracking-wide truncate" style={{ color: textColor }}>
                        {f.nickname}
                      </span>
                      <span className="font-bold text-[11px] shrink-0" style={{ color: isUppercase ? textColor : 'rgba(0,0,0,0.55)', opacity: isUppercase ? 0.7 : 1 }}>
                        {f.label ? `• ${f.label}` : '• followed'}
                      </span>
                      <span className="text-[11px] shrink-0">🎉</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={containerClass} style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
      {visible.map((f) => {
        const isExiting = exitingIds?.has(f.id);
        return (
          <div
            key={f.id}
            className="brutalist-item w-full flex flex-col items-start"
            style={{ opacity: isExiting ? 0 : 1, transition: 'opacity 0.3s ease', animation: getAnim(f.id) }}
          >
            <div className="flex flex-row gap-4 items-start w-fit max-w-full relative">
              {showAvatar && (
                <div
                  className="block shrink-0 mt-1.5 overflow-hidden"
                  style={{ border: getBorder(), backgroundColor: '#FFFFFF', boxShadow: getAvatarShadow(), width: 44, height: 44 }}
                >
                  <img
                    src={
                      f.profilePictureUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(f.nickname)}&background=222&color=fff`
                    }
                    alt={f.nickname}
                    className="w-10 h-10 object-cover rotate-[-2deg] scale-110"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(f.nickname)}&background=222&color=fff`;
                    }}
                  />
                </div>
              )}
              <div className="flex flex-col gap-0 max-w-full items-start">
                <div
                  className="flex flex-row flex-wrap items-center gap-2 px-3 py-1 mb-[-4px] z-20 rotate-[-1deg]"
                  style={{
                    border: getBorder(),
                    backgroundColor: badgeBg,
                    color: textColor,
                    fontSize: 11,
                    fontWeight: 800,
                    fontFamily: `'Outfit', sans-serif`,
                    boxShadow: `4px 4px 0px 0px ${borderColor}`,
                    fontStyle: isItalic ? 'italic' : 'normal',
                    textTransform: isUppercase ? 'uppercase' : 'none',
                  }}
                >
                  <span className="truncate max-w-[140px]">{f.nickname}</span>
                  {f.platform && (
                    <span className="text-[10px] font-black uppercase px-1.5 py-px" style={{ backgroundColor: accent, color: '#fff', border: `2px solid ${borderColor}` }}>
                      {f.platform}
                    </span>
                  )}
                  <span
                    className="w-6 h-6 flex items-center justify-center shrink-0"
                    style={{ backgroundColor: accent, border: `2px solid ${borderColor}`, boxShadow: `2px 2px 0px 0px ${borderColor}` }}
                  >
                    <UserPlus className="w-3 h-3 text-white" />
                  </span>
                </div>
                <div
                  className="brutalist-bubble relative px-5 py-4 w-full"
                  style={{
                    border: getBorder(),
                    backgroundColor: bubbleBg,
                    color: textColor,
                    boxShadow: getShadow(),
                    fontFamily: `'${font}', sans-serif`,
                    fontStyle: isItalic ? 'italic' : 'normal',
                    textTransform: isUppercase ? 'uppercase' : 'none',
                  }}
                >
                  {hasHalftone && <div className="absolute inset-0 pointer-events-none brutal-halftone" style={{ opacity: 0.05 }} />}
                  {hasTail && (
                    <>
                      <div className="absolute w-8 h-8 left-10 -bottom-8 brut-bubble-tail" style={{ backgroundColor: borderColor }} />
                      <div className="absolute w-8 h-8 left-10 -bottom-8 brut-bubble-tail translate-y-[-4px]" style={{ backgroundColor: bubbleBg }} />
                    </>
                  )}
                  <div className="relative z-10 flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 flex items-center justify-center shrink-0 rotate-[-1deg]"
                      style={{ backgroundColor: accent, border: `2px solid ${borderColor}`, boxShadow: `2px 2px 0px 0px ${borderColor}` }}
                    >
                      <Heart className="w-4 h-4 text-white fill-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-[11px] leading-none truncate" style={{ color: textColor }}>
                        {f.nickname}
                      </div>
                      <div className="font-bold text-[11px] truncate" style={{ color: textColor, opacity: 0.6 }}>
                        {f.label ? `${f.label} • welcome! 🎉` : 'followed you • welcome! 🎉'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
