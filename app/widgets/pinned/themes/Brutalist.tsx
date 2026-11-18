'use client';

/* eslint-disable @next/next/no-img-element */

import type { PinnedChatCardProps } from './types';
import { platformLogo, pinnedTypingState, StatusBody } from './shared';

export const themeMeta = { value: 'brutalist', label: 'Brutalist' } as const;

export default function BrutalistTheme({
  item,
  fontSize,
  showAvatar,
  showPlatform,
  showTimestamp,
  timeStr,
  brutalistBg,
  brutalistTextColor,
  brutalistBadgeBg,
  brutalistBorderColor,
  brutalistShadow,
  brutalistHalftone,
  brutalistTail,
  brutalistItalic,
  brutalistUppercase,
  typedCount,
  status,
  typing = false,
  messageOnly = false,
  fluid = false,
  noShadow = false,
  avatarRef,
}: PinnedChatCardProps) {
  const { visible, showCursor } = pinnedTypingState(item, typing, typedCount, status);

  return (
    <div
      className={`${fluid ? 'w-full' : 'w-[420px]'} max-w-[90vw] flex flex-row gap-4 items-start${noShadow ? ' pin-no-shadow' : ''}`}
      style={{ paddingBottom: ((brutalistTail && !messageOnly) ? 32 : 0) + (noShadow ? 0 : brutalistShadow + 2), paddingRight: noShadow ? 0 : brutalistShadow + 4 }}
    >
      {!messageOnly && showAvatar && (
        <div ref={avatarRef} className="block shrink-0 mt-1.5 overflow-hidden" style={{ border: `4px solid ${brutalistBorderColor}`, backgroundColor: '#FFFFFF', boxShadow: `3px 3px 0px 0px ${brutalistBorderColor}`, width: 44, height: 44 }}>
          <img src={item.profilePictureUrl} alt="" className="w-10 h-10 object-cover rotate-[-2deg] scale-110" onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.nickname)}&background=222&color=fff`; }} />
        </div>
      )}
      <div className="flex flex-col gap-0 max-w-full items-start flex-1 min-w-0">
        {!messageOnly && (
          <div className="flex flex-row flex-wrap items-center gap-2 px-3 py-1 mb-[-4px] z-20 rotate-[-1deg]" style={{ border: `4px solid ${brutalistBorderColor}`, backgroundColor: brutalistBadgeBg, color: brutalistTextColor, fontSize: 12, fontWeight: 800, fontFamily: `'Outfit', sans-serif`, boxShadow: `4px 4px 0px 0px ${brutalistBorderColor}` }}>
            <span>{item.nickname}</span>
            {showPlatform && item.platform && <img src={platformLogo(item.platform)} alt={item.platform} style={{ width: 14, height: 14, objectFit: 'contain' }} />}
            {showTimestamp && <span className="text-[10px] font-mono" style={{ color: brutalistTextColor, opacity: 0.6 }}>{timeStr}</span>}
          </div>
        )}
        <div className="relative p-4 px-6 w-full" style={{ border: `4px solid ${brutalistBorderColor}`, backgroundColor: brutalistBg, color: brutalistTextColor, boxShadow: `${brutalistShadow}px ${brutalistShadow}px 0px 0px ${brutalistBorderColor}`, fontStyle: brutalistItalic ? 'italic' : 'normal', textTransform: brutalistUppercase ? 'uppercase' : 'none', fontWeight: 700, fontSize }}>
          {brutalistHalftone && <div className="absolute inset-0 z-0 pointer-events-none" style={{ opacity: 0.05, backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '6px 6px' }} />}
          {brutalistTail && !messageOnly && (
            <>
              <div className="absolute w-8 h-8 left-10 -bottom-8" style={{ backgroundColor: brutalistBorderColor, clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
              <div className="absolute w-8 h-8 left-10 -bottom-8 translate-y-[-4px]" style={{ backgroundColor: brutalistBg, clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
            </>
          )}
          <div className="relative z-10" style={{ wordBreak: 'break-word' }}>
            {status ? <StatusBody status={status} text={item.comment} /> : <>{visible}{showCursor && <span className="pin-type-cursor" />}</>}
          </div>
        </div>
      </div>
    </div>
  );
}
