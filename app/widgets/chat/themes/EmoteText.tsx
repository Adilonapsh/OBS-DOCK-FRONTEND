'use client';
import { Fragment } from 'react';
import type { ChatEmote } from './types';

// Render komentar chat dengan emote jadi gambar.
// Sumber emote: emote per-pesan dari Streamer.bot (Twitch/BTTV/FFZ/7TV,
// diteruskan dock → backend) diprioritaskan, lalu BTTV global.
export function EmoteText({
  text,
  emotes,
  bttvMap,
  bttvEnabled = true,
  perChar,
  imgClassName,
}: {
  text: string;
  emotes?: ChatEmote[];
  bttvMap?: Record<string, string>;
  bttvEnabled?: boolean;
  /** Kalau diisi, teks biasa dianimasikan per-huruf (tema PerChar). */
  perChar?: { delayMs: number; durationS: number };
  imgClassName?: string;
}) {
  const lookup = new Map<string, string>();
  for (const e of emotes || []) {
    if (e?.name && e?.imageUrl && !lookup.has(e.name)) lookup.set(e.name, e.imageUrl);
  }
  if (bttvEnabled && bttvMap) {
    for (const [code, url] of Object.entries(bttvMap)) {
      if (!lookup.has(code)) lookup.set(code, url);
    }
  }
  const src = String(text ?? '');
  const imgCls = imgClassName || 'chat-emote inline-block w-5 h-5 align-text-bottom mx-0.5';

  const renderChars = (s: string, startIdx: number, keyPrefix: string) =>
    [...s].map((ch, j) => (
      <span
        key={`${keyPrefix}_${j}`}
        className="pc-char"
        style={{ animationDelay: `${((startIdx + j) * (perChar?.delayMs ?? 0)) / 1000}s`, animationDuration: `${perChar?.durationS ?? 0.35}s` }}
      >
        {ch}
      </span>
    ));

  if (lookup.size === 0) {
    if (!perChar) return <>{src}</>;
    return <>{renderChars(src, 0, 't')}</>;
  }

  const parts = src.split(/(\s+)/);
  let charIdx = 0;
  return (
    <>
      {parts.map((part, i) => {
        if (part === '' || /^\s+$/.test(part)) {
          if (!perChar) return <Fragment key={i}>{part}</Fragment>;
          const nodes = renderChars(part, charIdx, `s${i}`);
          charIdx += part.length;
          return <Fragment key={i}>{nodes}</Fragment>;
        }
        const url = lookup.get(part);
        if (url) return <img key={i} src={url} alt={part} title={part} className={imgCls} loading="lazy" />;
        if (!perChar) return <Fragment key={i}>{part}</Fragment>;
        const nodes = renderChars(part, charIdx, `w${i}`);
        charIdx += part.length;
        return <Fragment key={i}>{nodes}</Fragment>;
      })}
    </>
  );
}
