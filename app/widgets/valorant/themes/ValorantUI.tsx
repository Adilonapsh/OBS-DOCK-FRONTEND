'use client';

import type { ValorantSkinProps } from './types';

export const themeMeta = { value: 'valorantui', label: 'Valorant UI' } as const;

// Compact SVG-based card (302x86), inspired by tracker.gg / OBS overlay style.
// Accent color follows themeColor (auto = tier color, custom = accent, etc).
export default function ValorantUITheme(p: ValorantSkinProps) {
  const accent = p.themeColor;
  // Text color: auto = ikut themeColor (warna tier/rank), custom = trackerTextColor
  const textColor = p.trackerTextMode === 'custom' ? p.trackerTextColor : p.themeColor;
  const winrate = p.winrate;
  const wins = p.wins;
  const losses = p.losses;
  const kd = (wins + losses > 0) ? (wins / Math.max(1, losses)).toFixed(2) : '—';

  const svgContent = (gradId: string) => (
    <svg
      width="100%"
      viewBox="0 0 302 86"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0.5" y1="0.178" x2="0.5" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor={accent} stopOpacity="0" />
          <stop offset="1" stopColor={accent} stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Background gradient */}
      <path
        d="M0.285,0L0,56H257.459a20,20,0,0,0,17.1-9.62L301.654,0Z"
        fill={`url(#${gradId})`}
      />

      {/* Top horizontal line */}
      <rect x="0" y="0" width="281" height="1" fill="#FFFFFF" opacity="0.5" />

      {/* Corner ticks */}
      <line x1="1" y1="0" x2="1" y2="4" stroke="#FFFFFF" strokeWidth="2" />
      <line x1="1" y1="56" x2="1" y2="52" stroke="#FFFFFF" strokeWidth="2" />

      {/* Bottom short line */}
      <line x1="12" y1="55" x2="44" y2="55" stroke="#FFFFFF" strokeWidth="2" />

      {/* Top-right angled tick */}
      <line
        x1="0" y1="0" x2="2" y2="5"
        transform="matrix(0.996, 0.087, -0.087, 0.996, 243, 9)"
        stroke="#FFFFFF"
        strokeWidth="2"
      />

      {/* Border overlay edge */}
      <path
        d="M0.285,55H257.459a19.106,19.106,0,0,0,16.24-9.14l26.276-45.86H298.95L273.7,44.86A19.106,19.106,0,0,1,257.459,54H0.285Z"
        fill="#FFFFFF"
        opacity="0.12"
      />

      {/* Rank icon background square */}
      <rect x="0" y="0" width="56" height="56" fill={accent} opacity="0.22" />

      {/* Rank icon */}
      {p.iconUrl ? (
        <image href={p.iconUrl} x="8" y="8" width="40" height="40" />
      ) : null}

      {/* ── RATING column ── */}
      <text x="64" y="17" fill={textColor} fontSize="9" fontFamily="Arial, sans-serif" fontWeight="600" opacity="0.7">
        RATING
      </text>
      <text x="64" y="34" fill={textColor} fontSize="15" fontFamily="Arial, sans-serif" fontWeight="700">
        {p.rankName}
      </text>
      <text x="64" y="49" fill={accent} fontSize="9" fontFamily="Arial, sans-serif" fontWeight="700">
        {p.rr} RR
      </text>

      {/* ── WIN % column ── */}
      <text x="178" y="17" fill={textColor} fontSize="9" fontFamily="Arial, sans-serif" fontWeight="600" opacity="0.7">
        WIN %
      </text>
      <text x="178" y="34" fill={textColor} fontSize="15" fontFamily="Arial, sans-serif" fontWeight="700">
        {winrate}%
      </text>

      {/* ── K/D column ── */}
      <text x="233" y="17" fill={textColor} fontSize="9" fontFamily="Arial, sans-serif" fontWeight="600" opacity="0.7">
        K/D
      </text>
      <text x="233" y="34" fill={textColor} fontSize="15" fontFamily="Arial, sans-serif" fontWeight="700">
        {kd}
      </text>

      {/* Username below rank name */}
      {p.riotId ? (
        <text x="200" y="50" fill={textColor} fontSize="7.5" fontFamily="Arial, sans-serif" fontWeight="400" opacity="0.45">
          {p.riotId}
        </text>
      ) : null}

      {/* Promo overlay */}
      {p.promo ? (
        <g>
          <rect x="0" y="0" width="302" height="86" fill="#000000" opacity="0.75" />
          {p.promo.iconUrl ? (
            <image href={p.promo.iconUrl} x="13" y="8" width="40" height="40" />
          ) : null}
          <text x="62" y="20" fill={accent} fontSize="10" fontFamily="Arial, sans-serif" fontWeight="800">
            {p.promo.direction === 'up' ? 'RANK UP ▲' : 'RANK DOWN ▼'}
          </text>
          <text x="62" y="38" fill="#FFFFFF" fontSize="14" fontFamily="Arial, sans-serif" fontWeight="900">
            {p.promo.tierName.toUpperCase()}
          </text>
        </g>
      ) : null}
    </svg>
  );

  if (p.view === 'mini') {
    return (
      <div style={{ fontFamily: p.family, width: '100%', maxWidth: 302 }}>
        {svgContent('tgrd_mini')}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: p.family, width: '100%', maxWidth: 420 }}>
      {svgContent('tgrd_reg')}
    </div>
  );
}
