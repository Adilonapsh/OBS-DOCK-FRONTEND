import type { ChatThemeProps } from './types';
import { platformLogo } from './platformLogo';
import { bgBrightness } from './colorUtils';

function timeLabel(ts?: number) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function PlainTheme({ chats, font, accent, bg, maxMessages, showAvatar, showPlatform, showTimestamp, fontSize, bgOpacity, textColor, exitingIds }: ChatThemeProps) {
  const visible = chats.slice(-maxMessages);
  const useBg = bg && bg !== 'transparent';
  // Logo asetnya hitam: background terang -> tampil apa adanya,
  // background gelap/transparan -> invert agar jadi putih dan terbaca.
  const rowBright = useBg ? bgBrightness(bg) : null;
  const isLightRow = rowBright !== null && rowBright > 50;
  const invertLogo = !isLightRow;
  // Teks otomatis ikut brightness (kecuali user mengunci warna custom).
  const text = textColor || (isLightRow ? '#111' : '#fff');
  const subtle = isLightRow ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.5)';
  const subtleTime = isLightRow ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.4)';
  return (
    <>
      <style>{`@keyframes plainFadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div
        className="w-full max-w-[420px] flex flex-col gap-1"
        style={{ fontFamily: `'${font}', sans-serif`, fontSize: `${fontSize}px`, background: 'transparent' }}
      >
        {visible.map((c) => {
          const isExiting = exitingIds?.has(c.id);
          const rowOpacity = isExiting ? 0 : (useBg ? bgOpacity / 100 : 1);
          return (
            <div
              key={c.id}
              style={{
                background: useBg ? bg : 'transparent',
                border: 'none',
                boxShadow: 'none',
                padding: useBg ? '2px 6px' : 0,
                margin: 0,
                borderRadius: useBg ? 6 : 0,
                animation: 'plainFadeIn 0.3s ease both',
                opacity: rowOpacity,
                transition: 'opacity 0.3s ease',
                lineHeight: 1.4,
                wordBreak: 'break-word',
              }}
            >
              {showAvatar && (
                <img
                  src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`}
                  alt={c.nickname}
                  style={{ width: '1.7em', height: '1.7em', borderRadius: '50%', objectFit: 'cover', display: 'inline-block', verticalAlign: '-0.4em', marginRight: 5 }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nickname)}&background=222&color=fff`; }}
                />
              )}
              {showPlatform && (
                <img
                  src={platformLogo(c.platform)}
                  alt={c.platform || 'tiktok'}
                  style={{ width: '1.1em', height: '1.1em', objectFit: 'contain', display: 'inline-block', verticalAlign: '-0.15em', marginRight: 4, filter: invertLogo ? 'invert(1)' : 'none' }}
                />
              )}
              <span style={{ color: accent, fontWeight: 700 }}>{c.nickname}</span>
              <span style={{ color: subtle }}> • </span>
              <span style={{ color: text }}>{c.comment}</span>
              {showTimestamp && c.timestamp ? (
                <span style={{ color: subtleTime, fontSize: '0.75em', marginLeft: 6, fontFamily: 'monospace' }}>
                  {timeLabel(c.timestamp)}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
