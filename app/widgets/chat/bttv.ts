// Emote global BetterTTV (tidak butuh channel ID).
// Emote channel-spesifik (BTTV/FFZ/7TV) sudah ikut dari Streamer.bot
// lewat bridge sb-chat → ChatItem.emotes.
export type BttvMap = Record<string, string>;

let cache: Promise<BttvMap> | null = null;

export function getBttvGlobalEmotes(): Promise<BttvMap> {
  if (!cache) {
    cache = fetch('https://api.betterttv.net/3/cached/emotes/global')
      .then(async (r) => {
        if (!r.ok) throw new Error('bttv fetch failed');
        const arr: unknown = await r.json();
        const map: BttvMap = {};
        if (Array.isArray(arr)) {
          for (const e of arr) {
            const code = String((e as { code?: unknown })?.code || '');
            const id = String((e as { id?: unknown })?.id || '');
            if (code && id && !map[code]) map[code] = `https://cdn.betterttv.net/emote/${id}/1x`;
          }
        }
        return map;
      })
      .catch(() => ({} as BttvMap));
  }
  return cache;
}
