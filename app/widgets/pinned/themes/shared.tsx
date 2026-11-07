'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { PinnedCardItem, PinnedCardStatus } from './types';

type KbKey = { d: string; m?: string; sub?: string; w?: number; dark?: boolean };

export const KB60: KbKey[][] = [
  [{ d: 'Esc', dark: true }, ...'1234567890'.split('').map((c, i) => ({ d: c, m: c, sub: '!@#$%^&*()'[i] })), { d: '⌫', dark: true, w: 1.6 }],
  [{ d: 'Tab', w: 1.6 }, ...'QWERTYUIOP'.split('').map((c) => ({ d: c, m: c })), { d: 'Del', w: 1.4 }],
  [{ d: 'Caps', w: 1.8 }, ...'ASDFGHJKL'.split('').map((c) => ({ d: c, m: c })), { d: '⏎', dark: true, w: 1.8 }],
  [{ d: '⇧', w: 2 }, ...'ZXCVBNM'.split('').map((c) => ({ d: c, m: c })), { d: '⇧', w: 2 }],
  [{ d: 'Ctrl', w: 1.4 }, { d: 'Alt', dark: true, w: 1.4 }, { d: 'space', m: ' ', w: 6 }, { d: 'Alt', dark: true, w: 1.4 }, { d: 'Ctrl', w: 1.4 }],
];

export function platformLogo(p?: string): string {
  const v = (p || 'tiktok').toLowerCase();
  if (v.includes('tiktok')) return '/assets/logo/tik-tok.png';
  if (v.includes('youtube') || v === 'yt') return '/assets/logo/youtube.png';
  if (v.includes('twitch')) return '/assets/logo/twitch.png';
  if (v.includes('kick')) return '/assets/logo/sbot.png';
  return '/assets/logo/tik-tok.png';
}

export function pinnedBaseWidth(theme: string): number {
  if (theme === 'island') return 360;
  if (theme === 'minimal' || theme === 'plain') return 560;
  if (theme === 'card') return 380;
  return 420;
}

// Bungkus bubble saja dengan outline berputar (bukan seluruh card)
export function SpinWrap({ active, accent, radius, solid, children }: {
  active: boolean;
  accent: string;
  radius: string;
  solid?: boolean;
  children: ReactNode;
}) {
  if (!active) return <>{children}</>;
  return (
    <div className="pin-fx-spin" style={{ '--pin-accent': accent, borderRadius: radius } as CSSProperties}>
      <div className={`pin-fx-inner${solid ? ' pin-fx-inner-solid' : ''}`} style={{ borderRadius: `calc(${radius} - 2px)` }}>
        {children}
      </div>
    </div>
  );
}

export function StatusBody({ status, text }: { status?: PinnedCardStatus; text: string }) {
  if (status === 'loading') {
    return <span className="pin-card-dots"><span /><span /><span /></span>;
  }
  if (status === 'error') {
    return <span className="pin-card-error">{text}</span>;
  }
  return null;
}

export function pinnedTypingState(
  item: PinnedCardItem,
  typing: boolean,
  typedCount: number | undefined,
  status: PinnedCardStatus | undefined,
) {
  const count = typedCount ?? item.comment.length;
  const visible = typing ? item.comment.slice(0, count) : item.comment;
  const showCursor = typing && !status && count < item.comment.length;
  return { count, visible, showCursor };
}
