import type { EventThemeProps } from './types';
import { Gift, Heart, UserPlus, Zap } from 'lucide-react';
import './Brutalist.css';

export default function BrutalistTheme({
  events,
  font,
  accent,
  showAvatar,
  anim,
  horizontalAnim,
  hideAnim,
  fontSize,
  bgOpacity,
  horizontal,
  inline,
  exitingIds,
  brutalistBg,
  brutalistTextColor,
  brutalistBadgeBg,
  brutalistBorderColor,
  brutalistShadow,
  brutalistHalftone,
  brutalistTail,
  brutalistItalic,
  brutalistUppercase,
}: EventThemeProps) {
  const bubbleBg = brutalistBg || '#FFFFFF';
  const textColor = brutalistTextColor || '#000000';
  const badgeBg = brutalistBadgeBg || '#FFFFFF';
  const borderColor = brutalistBorderColor || '#000000';
  const shadowOffset = brutalistShadow ?? 6;
  const hasHalftone = brutalistHalftone ?? true;
  const hasTail = brutalistTail ?? true;
  const isItalic = brutalistItalic ?? true;
  const isUppercase = brutalistUppercase ?? true;

  const getBorder = (w = 4) => `${w}px solid ${borderColor}`;
  const getShadow = () => `${shadowOffset}px ${shadowOffset}px 0px 0px ${borderColor}`;
  const getSmallShadow = () => `3px 3px 0px 0px ${borderColor}`;

  const hide = hideAnim || 'fadeOut';
  const getAnim = (id: string) => {
    const isExiting = exitingIds?.has(id);
    const name = isExiting ? hide : horizontal ? (horizontalAnim || anim) : anim;
    const isEleg = ['elegantIn', 'softPopIn', 'blurIn', 'luxeIn', 'elegantOut', 'softPopOut', 'blurOut', 'luxeOut'].includes(name);
    const d = isEleg ? '0.62s' : '0.45s';
    return `${name} ${d} cubic-bezier(0.16,1,0.3,1) both`;
  };

  const typeMeta = (type: string) => {
    if (type === 'gift') return { label: 'GIFT', color: '#FE2C55', icon: Gift };
    if (type === 'like') return { label: 'LIKE', color: '#ec4899', icon: Heart };
    return { label: 'JOIN', color: accent || '#FFE600', icon: UserPlus };
  };

  if (horizontal || inline) {
    return (
      <div
        className="event-brutalist-theme w-full max-w-none flex flex-row flex-wrap gap-3 items-center"
        style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}
      >
        {events.length === 0 ? null : (
          events.map((e) => {
            const meta = typeMeta(e.type);
            const Icon = meta.icon;
            return (
              <div
                key={e.id}
                className="brutalist-bubble relative flex items-center gap-2.5 px-3 py-2 shrink-0 max-w-[300px] overflow-hidden brutalist-item"
                style={{ animation: getAnim(e.id), opacity: bgOpacity / 100, backgroundColor: bubbleBg, border: getBorder(3), boxShadow: getShadow() }}
              >
                {hasHalftone && <div className="absolute inset-0 pointer-events-none brutal-halftone opacity-[0.05]" />}
                <span className="absolute top-0 left-0 right-0 h-[4px]" style={{ background: meta.color, borderBottom: getBorder(3) }} />
                {showAvatar && (
                  <img
                    src={e.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.nickname)}&background=000&color=fff`}
                    alt={e.nickname}
                    className="w-7 h-7 object-cover shrink-0 mt-1"
                    style={{ border: getBorder(2) }}
                  />
                )}
                <span className="w-7 h-7 flex items-center justify-center shrink-0 mt-1" style={{ background: meta.color, border: getBorder(2) }}>
                  <Icon className="w-3.5 h-3.5 text-white" fill={e.type === 'like' ? 'white' : 'none'} />
                </span>
                <span className="font-black text-[11px] tracking-tight truncate" style={{ color: textColor, fontStyle: isItalic ? 'italic' : 'normal', textTransform: isUppercase ? 'uppercase' : 'none' }}>{e.nickname}</span>
                <span className="w-[3px] h-[3px] rotate-45 shrink-0" style={{ backgroundColor: borderColor }} />
                <span className="font-bold text-[11px] truncate" style={{ color: textColor, fontStyle: isItalic ? 'italic' : 'normal', textTransform: isUppercase ? 'uppercase' : 'none' }}>
                  {e.type === 'gift'
                    ? `${e.giftName} ×${e.repeatCount}`
                    : e.type === 'like'
                      ? `+${e.likeCount} LIKES`
                      : (e.label || 'JOINED').toUpperCase()}
                </span>
                <span className="ml-1 px-1.5 py-0.5 font-black text-[8px] tracking-widest shrink-0" style={{ backgroundColor: badgeBg, color: textColor, border: getBorder(1), fontStyle: isItalic ? 'italic' : 'normal', textTransform: isUppercase ? 'uppercase' : 'none' }}>
                  {meta.label}
                </span>
                {hasTail && (
                  <>
                    <div className="absolute w-6 h-6 left-8 -bottom-6 brut-bubble-tail" style={{ backgroundColor: borderColor }} />
                    <div className="absolute w-6 h-6 left-8 -bottom-6 brut-bubble-tail translate-y-[-3px]" style={{ backgroundColor: bubbleBg }} />
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div
      className="event-brutalist-theme w-full max-w-[440px] flex flex-col gap-3.5"
      style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}
    >
      {events.length === 0 ? null : (
        events.map((e) => {
          const meta = typeMeta(e.type);
          const Icon = meta.icon;
          const accentTop = meta.color;
          return (
            <div
              key={e.id}
              className="brutalist-bubble relative overflow-hidden will-change-transform brutalist-item"
              style={{ animation: getAnim(e.id), opacity: bgOpacity / 100, backgroundColor: bubbleBg, border: getBorder(4), boxShadow: getShadow() }}
            >
              {hasHalftone && <div className="absolute inset-0 pointer-events-none brutal-halftone opacity-[0.06]" />}
              {/* top thick stripe */}
              <div className="relative h-[10px] flex" style={{ background: accentTop, borderBottom: getBorder(4) }}>
                <div className="flex-1 flex items-center px-2 gap-1">
                  <span className="w-1.5 h-1.5" style={{ backgroundColor: bubbleBg, border: `1px solid ${borderColor}` }} />
                  <span className="w-1.5 h-1.5" style={{ backgroundColor: bubbleBg, border: `1px solid ${borderColor}` }} />
                  <span className="w-1.5 h-1.5" style={{ backgroundColor: bubbleBg, border: `1px solid ${borderColor}` }} />
                </div>
                <span className="font-black text-[8px] uppercase tracking-[0.14em] px-2 flex items-center" style={{ backgroundColor: borderColor, color: bubbleBg, borderLeft: getBorder(3) }}>
                  {meta.label} {e.type === 'gift' ? '• LIVE' : e.type === 'like' ? '• +LIKE' : '• JOIN'}
                </span>
              </div>

              <div className="relative flex items-center gap-3 p-3">
                {showAvatar && (
                  <img
                    src={e.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.nickname)}&background=000&color=fff`}
                    alt={e.nickname}
                    className="w-11 h-11 object-cover shrink-0"
                    style={{ border: getBorder(3), boxShadow: getSmallShadow(), backgroundColor: bubbleBg }}
                  />
                )}
                <div className="w-11 h-11 flex items-center justify-center shrink-0" style={{ background: accentTop, border: getBorder(3), boxShadow: getSmallShadow() }}>
                  <Icon className="w-5 h-5 text-white" fill={e.type === 'like' ? 'white' : 'none'} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black tracking-tight text-[13px] leading-none truncate" style={{ color: textColor, fontStyle: isItalic ? 'italic' : 'normal', textTransform: isUppercase ? 'uppercase' : 'none' }}>{e.nickname}</span>
                    <span className="px-1.5 py-0.5 font-black text-[8px] tracking-widest leading-none" style={{ backgroundColor: badgeBg, color: textColor, border: getBorder(1), fontStyle: isItalic ? 'italic' : 'normal', textTransform: isUppercase ? 'uppercase' : 'none' }}>
                      {e.type}
                    </span>
                    {e.platform && <span className="text-[9px] font-bold tracking-widest px-1" style={{ color: textColor, border: `1px solid ${borderColor}`, backgroundColor: badgeBg, fontStyle: isItalic ? 'italic' : 'normal', textTransform: isUppercase ? 'uppercase' : 'none' }}>{e.platform}</span>}
                  </div>
                  <div className="mt-1 font-bold tracking-wide text-[12px] leading-tight truncate flex items-center gap-1.5" style={{ color: textColor, fontStyle: isItalic ? 'italic' : 'normal', textTransform: isUppercase ? 'uppercase' : 'none' }}>
                    <Zap className="w-3 h-3 shrink-0" style={{ color: textColor }} />
                    <span className="truncate">
                      {e.type === 'gift' ? (
                        <>
                          {e.giftName} ×{e.repeatCount}
                          {e.diamondCount ? <span className="ml-1 px-1 text-[10px]" style={{ backgroundColor: borderColor, color: bubbleBg }}>♦{e.diamondCount}</span> : null}
                        </>
                      ) : e.type === 'like' ? (
                        <>+{e.likeCount} LIKES 🔥</>
                      ) : (
                        <>{(e.label || 'JOINED THE LIVE').toUpperCase()}</>
                      )}
                    </span>
                  </div>
                </div>

                {e.giftPictureUrl && e.type === 'gift' && (
                  <img
                    src={e.giftPictureUrl}
                    alt={e.giftName}
                    className="w-12 h-12 object-contain p-0.5 shrink-0"
                    style={{ backgroundColor: bubbleBg, border: getBorder(3), boxShadow: getSmallShadow() }}
                  />
                )}
              </div>

              {/* bottom ticker line */}
              <div className="relative flex items-center justify-between px-2 py-1" style={{ borderTop: getBorder(3), backgroundColor: borderColor, color: bubbleBg }}>
                <span className="font-mono font-black text-[9px] tracking-widest" style={{ textTransform: isUppercase ? 'uppercase' : 'none', fontStyle: isItalic ? 'italic' : 'normal' }}>
                  {new Date(e.timestamp).toLocaleTimeString()} • ID:{e.id.slice(0, 6).toUpperCase()}
                </span>
                <span className="font-black text-[8px] tracking-[0.14em] px-1.5 py-0.5 flex items-center gap-1" style={{ backgroundColor: bubbleBg, color: textColor, border: `1px solid ${bubbleBg}`, textTransform: isUppercase ? 'uppercase' : 'none', fontStyle: isItalic ? 'italic' : 'normal' }}>
                  <span className="w-1.5 h-1.5" style={{ backgroundColor: borderColor }} /> BRUTALIST
                </span>
              </div>
              {hasTail && (
                <>
                  <div className="absolute w-8 h-8 left-10 -bottom-8 brut-bubble-tail" style={{ backgroundColor: borderColor }} />
                  <div className="absolute w-8 h-8 left-10 -bottom-8 brut-bubble-tail translate-y-[-4px]" style={{ backgroundColor: bubbleBg }} />
                </>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
