'use client';

import type { CSSProperties } from 'react';
import type { PinnedChatCardProps } from './types';
import { KB60, pinnedTypingState, StatusBody } from './shared';

export const themeMeta = { value: 'monkey', label: 'Monkey - Teks + Keyboard Mengetik' } as const;

export default function MonkeyTheme({
  item,
  fontSize,
  showTimestamp,
  timeStr,
  fxColor,
  kbTheme,
  kbGlow,
  kbCaps,
  mkText,
  mkDim,
  typedCount,
  status,
  showKeyboard = true,
  messageOnly = false,
  fluid = false,
  noShadow = false,
}: PinnedChatCardProps) {
  const { count } = pinnedTypingState(item, false, typedCount, status);

  return (
    <div className={`pinned-font flex flex-col gap-2 ${fluid ? 'w-full' : 'w-[420px]'} max-w-[90vw]${noShadow ? ' pin-no-shadow' : ''}`}>
      {!messageOnly && (
        <div className="flex items-center gap-2">
          <span className="pin-pc-username">{item.nickname}</span>
          {showTimestamp && <span className="text-white/40 text-[10px] font-mono shrink-0">{timeStr}</span>}
        </div>
      )}
      <div className="font-bold break-words leading-relaxed" style={{ fontSize: fontSize + 4, fontFamily: `'JetBrains Mono', ui-monospace, monospace`, '--pin-mk-text': mkText, '--pin-mk-dim': mkDim } as CSSProperties}>
        {status ? (
          <StatusBody status={status} text={item.comment} />
        ) : (
          <>
            {[...item.comment].map((ch, i) => (
              <span key={i} className={`pin-mk-char${i < count ? ' done' : ''}`}>{ch}</span>
            ))}
            {count < item.comment.length && <span className="pin-mk-caret" style={{ '--pin-accent': fxColor } as CSSProperties} />}
          </>
        )}
      </div>
      {showKeyboard && (
        <div className="w-full" style={{ '--pin-accent': fxColor } as CSSProperties}>
          <div className={`pin-kb${kbTheme === 'light' ? ' kb-light' : kbTheme === 'cyber' ? ' kb-cyber' : ''}${kbGlow ? ' glow' : ''} kb-cap-${kbCaps}`}>
            {KB60.map((row, ri) => {
              const done = status || count >= item.comment.length;
              const cur = done ? '' : (item.comment[count - 1] || '').toUpperCase();
              return (
                <div key={ri} className="pin-kb-row">
                  {row.map((k, ki) => (
                    <span
                      key={ki}
                      className={`pin-kb-key${k.dark ? ' dark' : ''}${k.m !== undefined && cur === k.m ? ' on' : ''}`}
                      style={k.w ? { flexGrow: k.w } : undefined}
                    >
                      {k.d === 'space' ? 'space' : k.d}
                      {k.sub && <span className="sub">{k.sub}</span>}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
