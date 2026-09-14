import type { ChatThemeProps } from './types';
import './PerChar.css';

export type PerCharThemeProps = ChatThemeProps & {
  charDelayMs?: number;
  charDurationS?: number;
};

const PLATFORM_COLORS: Record<string, string> = {
  twitch: '#8b5cf6',
  youtube: '#ff2d2d',
  kick: '#53fc18',
  kofi: '#ff4d4d',
};

function platformColor(platform?: string, fallback = '#8b5cf6') {
  if (!platform) return fallback;
  const v = platform.toLowerCase();
  if (v.includes('twitch')) return PLATFORM_COLORS.twitch;
  if (v.includes('youtube') || v === 'yt') return PLATFORM_COLORS.youtube;
  if (v.includes('kick')) return PLATFORM_COLORS.kick;
  if (v.includes('kofi')) return PLATFORM_COLORS.kofi;
  if (v.includes('tiktok')) return '#FE2C55';
  return fallback;
}

function platformGlyph(platform?: string) {
  const v = (platform || '').toLowerCase();
  if (v.includes('youtube') || v === 'yt') return 'YT';
  if (v.includes('twitch')) return 'TW';
  if (v.includes('kick')) return 'K';
  if (v.includes('tiktok')) return 'TT';
  return '•';
}

function timeLabel(ts?: number) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function PerCharText({ text, delayMs, durationS }: { text: string; delayMs: number; durationS: number }) {
  return (
    <>
      {[...text].map((ch, i) => (
        <span
          key={i}
          className="pc-char"
          style={{ animationDelay: `${(i * delayMs) / 1000}s`, animationDuration: `${durationS}s` }}
        >
          {ch}
        </span>
      ))}
    </>
  );
}

export default function PerCharTheme({
  chats,
  font,
  accent,
  showAvatar,
  showPlatform,
  showTimestamp,
  fontSize,
  charDelayMs = 25,
  charDurationS = 0.35,
  exitingIds,
  hideAnim,
  horizontal,
  inline,
}: PerCharThemeProps) {
  const hide = hideAnim || 'fadeOut';
  // horizontal & inline pakai bubble penuh yang sama — cuma arah alir beda
  const flowCls = horizontal ? 'flex-row flex-wrap items-start' : 'flex-col';
  return (
    <div className={`chat-perchar-theme w-full ${horizontal ? 'max-w-none' : 'max-w-[480px]'} flex ${flowCls}`} style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px` }}>
      {chats.length === 0 ? null : chats.map((c) => {
        const color = platformColor(c.platform, accent);
        const isExiting = exitingIds?.has(c.id);
        return (
          <div key={c.id} className="pc-row" style={isExiting ? { animation: `${hide} 0.4s ease both` } : undefined}>
            <div className="pc-meta">
              {showPlatform && (
                <span className="pc-badge" style={{ background: color }}>
                  {platformGlyph(c.platform)}
                </span>
              )}
              <span className="pc-username">{c.nickname}</span>
              {showTimestamp && c.timestamp ? <span className="pc-time">{timeLabel(c.timestamp)}</span> : null}
            </div>
            <div className="pc-bubble-line">
              {showAvatar ? (
                <img
                  src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`}
                  alt={c.nickname}
                  className="pc-avatar"
                  style={{ borderColor: color }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`; }}
                />
              ) : (
                <span className="pc-avatar-fallback" style={{ borderColor: color, color }}>{platformGlyph(c.platform)}</span>
              )}
              <div className="pc-bubble" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, fontSize: `${fontSize}px` }}>
                <PerCharText text={c.comment} delayMs={charDelayMs} durationS={charDurationS} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
