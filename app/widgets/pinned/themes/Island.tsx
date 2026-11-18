'use client';

/* eslint-disable @next/next/no-img-element */

import type { PinnedChatCardProps } from './types';
import { platformLogo, pinnedTypingState, StatusBody } from './shared';

export const themeMeta = { value: 'island', label: 'Island - Dynamic Island' } as const;

export default function IslandTheme({
  item,
  fontSize,
  accent,
  showAvatar,
  showPlatform,
  showTimestamp,
  timeStr,
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
    <div className={`pinned-font ${fluid ? 'w-full' : 'w-[360px]'} max-w-[90vw]${noShadow ? ' pin-no-shadow' : ''}`}>
      <div className="pin-island px-4 py-3 flex items-center gap-3">
        {messageOnly ? (
          <span className="pin-island-dot shrink-0" style={{ background: accent }} />
        ) : showAvatar ? (
          <img ref={avatarRef} src={item.profilePictureUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
        ) : (
          <span className="pin-island-dot shrink-0" style={{ background: accent }} />
        )}
        <div className="flex-1 min-w-0">
          {!messageOnly && (
            <div className="flex items-center gap-1.5">
              <span className="text-white font-black truncate" style={{ fontSize }}>{item.nickname}</span>
              {showPlatform && item.platform && (
                <img src={platformLogo(item.platform)} alt={item.platform} className="w-3.5 h-3.5 rounded-full object-contain bg-white p-0.5 shrink-0" />
              )}
              {showTimestamp && <span className="text-white/40 text-[9px] font-mono shrink-0">{timeStr}</span>}
            </div>
          )}
          <div className={`text-white/85 font-bold ${messageOnly ? 'break-words' : 'truncate'}`} style={{ fontSize: Math.max(11, fontSize - 2) }}>
            {status ? <StatusBody status={status} text={item.comment} /> : <>{visible}{showCursor && <span className="pin-type-cursor" />}</>}
          </div>
        </div>
        {!messageOnly && <span className="pin-island-dot shrink-0" style={{ background: accent }} />}
      </div>
    </div>
  );
}
