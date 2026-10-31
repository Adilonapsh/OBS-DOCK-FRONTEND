import type { GoalThemeProps } from './types';

export default function Passion({ title, current, target, percent, goalType, font, fontSize, accent, bg, showLabel, showCounts, showBar }: GoalThemeProps) {
  // Like Goal Studio style: Passion One, stroke text, track + bar
  const bgColor = bg && bg !== 'transparent' ? bg : '#ffffff';
  const primary = accent || '#ee4266';
  // track is lighter gray, text is muted
  const trackBg = '#e5e7eb';
  const textMuted = '#6b7280';
  const visualPct = Math.min(Math.max(percent, 0), 100);

  const labelMap: Record<string, string> = { follow: 'Followers', subs: 'Subscribers', like: 'Likes' };
  const unit = labelMap[goalType] || 'Likes';
  return (
    <div className="w-full max-w-[640px] p-2" style={{ fontFamily: `'Passion One', '${font}', sans-serif` }}>
      <div className="rounded-lg p-4 w-full" style={{ backgroundColor: bgColor, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
        {showLabel && (
          <div className="flex justify-between items-end mb-1">
            <div style={{ color: primary, fontSize: Math.max(22, fontSize + 10), lineHeight: 1, fontFamily: `'Passion One', sans-serif` }}>
              {title}
            </div>
            {showCounts && (
              <div className="font-normal text-right" style={{ color: textMuted, fontSize: Math.max(22, fontSize + 10), lineHeight: 1, fontFamily: `'Passion One', sans-serif` }}>
                {current.toLocaleString()} / {target.toLocaleString()} {unit}
              </div>
            )}
          </div>
        )}
        {showBar && (
          <div className="relative w-full h-10 rounded-full overflow-hidden" style={{ backgroundColor: trackBg }}>
            <div
              className="flex items-center h-full rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${visualPct}%`, backgroundColor: primary }}
            >
              <span
                className="absolute right-0 mr-3 text-white"
                style={{
                  fontSize: 24,
                  fontFamily: `'Passion One', sans-serif`,
                  WebkitTextStroke: '1px rgba(0,0,0,0.4)',
                  textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                  lineHeight: 1,
                }}
              >
                {percent}%
              </span>
            </div>
          </div>
        )}
        {!showLabel && showCounts && (
          <div className="text-center mt-1 font-bold" style={{ color: textMuted, fontSize: 12 }}>
            {current.toLocaleString()} / {target.toLocaleString()} {unit} ({percent}%)
          </div>
        )}
      </div>
    </div>
  );
}
