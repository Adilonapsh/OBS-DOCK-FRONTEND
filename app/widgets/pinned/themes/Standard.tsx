'use client';

/* eslint-disable @next/next/no-img-element */

import type { PinnedChatCardProps } from './types';
import { platformLogo, pinnedTypingState, SpinWrap, StatusBody } from './shared';

export const themeMeta = { value: 'standard', label: 'Standard - Dark Glass' } as const;

export default function StandardTheme({
  item,
  fontSize,
  accent,
  showAvatar,
  showPlatform,
  showTimestamp,
  timeStr,
  cardBg,
  fxColor,
  spinActive,
  typedCount,
  badge = 'Pin',
  status,
  typing = false,
  messageOnly = false,
  fluid = false,
  noShadow = false,
  avatarRef,
}: PinnedChatCardProps) {
  const { visible, showCursor } = pinnedTypingState(item, typing, typedCount, status);

  return (
    <div className={`pinned-font ${fluid ? 'w-full' : 'w-[380px]'} max-w-[90vw] rounded-2xl overflow-hidden border border-white/10 backdrop-blur-md shadow-2xl${noShadow ? ' pin-no-shadow' : ''}`} style={{ ...(cardBg ? { background: cardBg } : { background: 'rgba(0,0,0,0.7)' }) }}>
      {!messageOnly && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10" style={{ background: `${accent}22` }}>
          {showAvatar && (
            <img ref={avatarRef} src={item.profilePictureUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/20" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-black truncate" style={{ fontSize }}>{item.nickname}</span>
              {showPlatform && item.platform && (
                <img src={platformLogo(item.platform)} alt={item.platform} className="w-4 h-4 rounded-full object-contain bg-white p-0.5 shrink-0" />
              )}
              {showTimestamp && <span className="text-white/40 text-[9px] font-mono shrink-0">{timeStr}</span>}
            </div>
          </div>
          {badge && <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full text-black shrink-0" style={{ background: accent }}>{badge}</span>}
        </div>
      )}
      <SpinWrap active={spinActive} accent={fxColor} radius="12px" solid>
        <div className={`${messageOnly ? 'px-5 py-4' : 'px-3 py-2.5'} text-white font-bold break-words leading-relaxed`} style={{ fontSize: fontSize + 1 }}>
          {status ? <StatusBody status={status} text={item.comment} /> : <>{visible}{showCursor && <span className="pin-type-cursor" />}</>}
        </div>
      </SpinWrap>
    </div>
  );
}
