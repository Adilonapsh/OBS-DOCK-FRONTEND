// Logo platform shared untuk semua tema chat.
// File: /public/assets/logo/{tik-tok,youtube,twitch,sbot}.png

export function platformLogo(p?: string): string {
  const v = (p || 'tiktok').toLowerCase();
  if (v.includes('tiktok')) return '/assets/logo/tik-tok.png';
  if (v.includes('youtube') || v === 'yt') return '/assets/logo/youtube.png';
  if (v.includes('twitch')) return '/assets/logo/twitch.png';
  if (v.includes('kick')) return '/assets/logo/sbot.png';
  return '/assets/logo/tik-tok.png';
}
