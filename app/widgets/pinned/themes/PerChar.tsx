'use client';

/* eslint-disable @next/next/no-img-element */

import type { PinnedChatCardProps } from './types';
import { platformLogo, pinnedTypingState, SpinWrap, StatusBody } from './shared';

export const themeMeta = { value: 'perchar', label: 'Per-Char - Bubble + Huruf Mengetik' } as const;

export default function PerCharTheme({
  item,
  fontSize,
  accent,
  showAvatar,
  showPlatform,
  showTimestamp,
  timeStr,
  fxColor,
  spinActive,
  typedCount,
  status,
  typing = false,
  charDelayMs,
  charDurationS,
  messageOnly = false,
  fluid = false,
  noShadow = false,
  avatarRef,
}: PinnedChatCardProps) {
  const { visible, showCursor } = pinnedTypingState(item, typing, typedCount, status);

  return (
    <div className={`pinned-font flex flex-col gap-1.5 ${fluid ? 'w-full' : 'max-w-[420px]'}${noShadow ? ' pin-no-shadow' : ''}`}>
      {!messageOnly && (
        <div className="pin-pc-meta">
          {showPlatform && item.platform && (
            <img src={platformLogo(item.platform)} alt={item.platform} className="w-[22px] h-[22px] rounded-md object-contain bg-white p-0.5 shrink-0" />
          )}
          <span className="pin-pc-username">{item.nickname}</span>
          {showTimestamp && <span className="text-white/40 text-[10px] font-mono shrink-0">{timeStr}</span>}
        </div>
      )}
      <div className="flex items-end gap-2.5">
        {!messageOnly && showAvatar && (
          <img ref={avatarRef} src={item.profilePictureUrl} alt="" className="pin-pc-avatar" style={avatarRef ? { animation: 'none' } : undefined} />
        )}
        <SpinWrap active={spinActive} accent={fxColor} radius="20px">
          <div className="pin-pc-bubble" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, fontSize }}>
            {status ? (
              <StatusBody status={status} text={item.comment} />
            ) : typing ? (
              <>{visible}{showCursor && <span className="pin-type-cursor" />}</>
            ) : (
              [...item.comment].map((ch, i) => (
                <span key={i} className="pin-pc-char" style={{ animationDelay: `${(i * charDelayMs) / 1000}s`, animationDuration: `${charDurationS}s` }}>{ch}</span>
              ))
            )}
          </div>
        </SpinWrap>
      </div>
    </div>
  );
}
