export const PLATFORM_META: Record<string, { label: string; color: string; logo: string }> = {
  tiktok: { label: 'TikTok', color: '#FE2C55', logo: '/assets/logo/tik-tok.png' },
  twitch: { label: 'Twitch', color: '#8b5cf6', logo: '/assets/logo/twitch.png' },
  youtube: { label: 'YouTube', color: '#ff2d2d', logo: '/assets/logo/youtube.png' },
  kick: { label: 'Kick', color: '#53fc18', logo: '/assets/logo/sbot.png' },
};

export function fmtCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
}
