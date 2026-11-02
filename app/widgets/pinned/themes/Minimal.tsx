'use client';

/* eslint-disable @next/next/no-img-element */

import type { PinnedChatCardProps } from './types';
import { platformLogo, pinnedTypingState, SpinWrap, StatusBody } from './shared';

export const themeMeta = { value: 'minimal', label: 'Minimal - Baris Bersih' } as const;

export default function MinimalTheme({
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
    <SpinWrap active={spinActive} accent={fxColor} radius="12px">
      <div className={`pinned-font flex items-center gap-2 px-3 ${messageOnly ? 'py-4' : 'py-2'} bg-black/60 border-l-4 rounded-r-xl ${fluid ? 'w-full max-w-full' : 'max-w-[560px]'}${noShadow ? ' pin-no-shadow' : ''}`} style={{ borderColor: accent, ...(cardBg ? { background: cardBg } : {}) }}>
        {!messageOnly && showAvatar && (
          <img ref={avatarRef} src={item.profilePictureUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          {!messageOnly && (
            <div className="flex items-center gap-1.5">
              <span className="text-white font-black truncate" style={{ fontSize: fontSize - 2 }}>{item.nickname}</span>
              {showPlatform && item.platform && (
                <img src={platformLogo(item.platform)} alt={item.platform} className="w-3.5 h-3.5 rounded-full object-contain bg-white p-0.5 shrink-0" />
              )}
              {showTimestamp && <span className="text-white/40 text-[9px] font-mono shrink-0">{timeStr}</span>}
              {badge && <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: `${accent}33`, color: accent }}>{badge}</span>}
            </div>
          )}
          <div className="text-white/90 font-bold break-words" style={{ fontSize }}>
            {status ? <StatusBody status={status} text={item.comment} /> : <>{visible}{showCursor && <span className="pin-type-cursor" />}</>}
          </div>
        </div>
      </div>
    </SpinWrap>
  );
}
