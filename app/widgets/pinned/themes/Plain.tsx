'use client';

import type { PinnedChatCardProps } from './types';
import { pinnedTypingState, StatusBody } from './shared';

export const themeMeta = { value: 'plain', label: 'Plain' } as const;

export default function PlainTheme({
  item,
  fontSize,
  accent,
  showTimestamp,
  timeStr,
  typedCount,
  status,
  typing = false,
  messageOnly = false,
  fluid = false,
  noShadow = false,
}: PinnedChatCardProps) {
  const { visible, showCursor } = pinnedTypingState(item, typing, typedCount, status);

  return (
    <div className={`pinned-font ${fluid ? 'w-full max-w-full' : 'max-w-[560px]'}${noShadow ? ' pin-no-shadow' : ''}`} style={{ animation: 'fadeIn 0.4s ease both' }}>
      {!messageOnly && <div className="font-black leading-none" style={{ fontSize, color: accent }}>{item.nickname}</div>}
      <div className={`text-white font-bold break-words leading-relaxed ${messageOnly ? '' : 'mt-1'}`} style={{ fontSize: fontSize + 1 }}>
        {status ? <StatusBody status={status} text={item.comment} /> : <>{visible}{showCursor && <span className="pin-type-cursor" />}</>}
      </div>
      {!messageOnly && showTimestamp && <div className="text-white/40 text-[10px] font-mono mt-1">{timeStr}</div>}
    </div>
  );
}
