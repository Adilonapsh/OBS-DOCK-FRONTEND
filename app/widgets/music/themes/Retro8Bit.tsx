import { useEffect } from 'react';
import type { MediaThemeProps } from '../../media-player/themes/types';
import { loadGoogleFont } from '../../_shared/utils/font';
import { isLightBg, shadeHex } from '../../_shared/utils/color';

/**
 * Tema "Retro 8-Bit" - replika 1:1 dari mock HTML:
 * - 3 lapisan: shadow biru (offset 16px), border tebal, body dalam
 * - Sudut bertangga via clip-path (outer 16px, inner 8px, small 2px)
 * - Album art 136px berbingkai tebal
 * - Judul marquee 16px, peminta 10px, timer 10px
 * - Not balok melayang di atas kotak
 *
 * Warna mengikuti thumbnail bila Auto Color aktif:
 * - border & progress -> accent (palette thumbnail)
 * - body -> bgColor (DarkMuted thumbnail)
 * - shadow -> bgColor yang di-darken
 * Palet asli (#ff0d00 / #3b2d29 / #1e1642) dipakai sebagai fallback.
 */

const DEFAULT_ACCENT = '#ff0d00';
const DEFAULT_BG = '#3b2d29';
const TEXT_GRAY = '#a09696';
const PROGRESS_GRAY = '#887b7b';

/* Polygon sudut 8-bit - identik dengan CSS mock */
const OUTER_CLIP =
  'polygon(16px 0, calc(100% - 16px) 0, calc(100% - 16px) 8px, calc(100% - 8px) 8px, calc(100% - 8px) 16px, 100% 16px, 100% calc(100% - 16px), calc(100% - 8px) calc(100% - 16px), calc(100% - 8px) calc(100% - 8px), calc(100% - 16px) calc(100% - 8px), calc(100% - 16px) 100%, 16px 100%, 16px calc(100% - 8px), 8px calc(100% - 8px), 8px calc(100% - 16px), 0 calc(100% - 16px), 0 16px, 8px 16px, 8px 8px, 16px 8px)';
const INNER_CLIP =
  'polygon(8px 0, calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 8px calc(100% - 8px), 0 calc(100% - 8px), 0 8px, 8px 8px)';
const SMALL_CLIP =
  'polygon(2px 0, calc(100% - 2px) 0, 100% 2px, 100% calc(100% - 2px), calc(100% - 2px) 100%, 2px 100%, 0 calc(100% - 2px), 0 2px)';

export default function Retro8BitMusicTheme(props: MediaThemeProps) {
  const {
    track,
    artist,
    art,
    accent,
    bgColor,
    progressPercent,
    currentPos,
    timeline,
    showAlbumArt,
    showProgressBar,
    showPrimary,
    showSecondary,
    textAlignCls,
    msToTime,
  } = props;

  const borderColor = accent && accent !== 'transparent' ? accent : DEFAULT_ACCENT;
  const bg = bgColor && bgColor !== 'transparent' ? bgColor : DEFAULT_BG;
  const shadowColor = shadeHex(bg, shadeRatio(bg));
  const pct = Math.max(0, Math.min(100, progressPercent || 0));
  const hasArt = !!art && art !== '' && !art.includes('placeholder.com');
  const duration = timeline ? timeline.EndTime : 0;
  const secondaryColor = isLightBg(bg) ? 'rgba(20,20,28,0.72)' : TEXT_GRAY;
  const notesColor = isLightBg(bg) ? '#14141c' : '#ffffff';

  useEffect(() => {
    loadGoogleFont('Press Start 2P', '400', 'widget-font');
  }, []);

  const titleText = track && track !== '-' ? track : '-';
  const seg = `${titleText}\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0`;

  const pixelFont = "'Press Start 2P', monospace";

  return (
    <div
      className={`r8bit-music relative ${textAlignCls}`}
      style={{
        // 550x170 kotak + 32px ruang not di atas + 16px shadow kanan/bawah
        width: 566,
        height: 218,
        fontFamily: pixelFont,
      }}
    >
      <style>{`
        @keyframes r8-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes r8-bounce { 0%, 100% { transform: translateY(0) rotate(10deg); } 50% { transform: translateY(-10px) rotate(-5deg); } }
      `}</style>

      {/* Not balok melayang (posisi asli top:-25px, digeser ke dalam wrapper agar tidak terpotong) */}
      <div
        aria-hidden
        className="absolute flex z-10"
        style={{ top: 4, right: 20, gap: 12, color: notesColor, textShadow: '2px 2px 0 rgba(0,0,0,0.2)' }}
      >
        <span style={{ fontSize: 26, animation: 'r8-bounce 2.5s infinite ease-in-out' }}>&#9834;</span>
        <span style={{ fontSize: 36, animation: 'r8-bounce 2.5s infinite ease-in-out 0.6s' }}>&#9835;</span>
      </div>

      {/* Widget 550x170 (posisi asli) */}
      <div className="absolute" style={{ top: 32, left: 0, width: 550, height: 170 }}>
        {/* Layer shadow biru - offset 16px */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            width: '100%',
            height: '100%',
            background: shadowColor,
            clipPath: OUTER_CLIP,
            zIndex: 1,
          }}
        />

        {/* Layer border tebal (aksen/merah) */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: borderColor,
            clipPath: OUTER_CLIP,
            zIndex: 2,
          }}
        />

        {/* Body cokelat di dalam border */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            right: 8,
            bottom: 8,
            background: bg,
            clipPath: INNER_CLIP,
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            padding: '20px 24px',
            boxSizing: 'border-box',
            zIndex: 3,
          }}
        >
          {/* Panel kiri */}
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
            {showPrimary && (
              <div
                style={{
                  width: '100%',
                  overflow: 'hidden',
                  marginBottom: 8,
                  WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
                  maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    whiteSpace: 'nowrap',
                    color: '#ffffff',
                    fontSize: 16,
                    textShadow: '2px 2px 0 rgba(0,0,0,0.3)',
                    animation: 'r8-scroll 9s linear infinite',
                  }}
                >
                  {seg}
                  {seg}
                </div>
              </div>
            )}

            {showSecondary && (
              <div
                style={{
                  color: secondaryColor,
                  fontSize: 10,
                  marginBottom: 16,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {artist && artist !== '-' ? artist : '\u00A0'}
              </div>
            )}

            {/* Timer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffffff', fontSize: 10, marginBottom: 8 }}>
              <span>{msToTime(currentPos)}</span>
              <span>{duration > 0 ? msToTime(duration) : '--:--'}</span>
            </div>

            {/* Progress bar */}
            {showProgressBar && (
              <div style={{ position: 'relative', width: '100%', height: 16, display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: 12,
                    boxShadow: `inset 0 0 0 2px ${PROGRESS_GRAY}`,
                    clipPath: SMALL_CLIP,
                    background: 'transparent',
                  }}
                >
                  <div style={{ height: '100%', width: `${pct}%`, background: borderColor, transition: 'width 0.25s linear' }} />
                </div>
                <div
                  style={{
                    position: 'absolute',
                    left: `${pct}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 16,
                    height: 16,
                    background: borderColor,
                    boxShadow: `inset 0 0 0 2px ${shadowColor}`,
                    clipPath: SMALL_CLIP,
                    zIndex: 3,
                    transition: 'left 0.25s linear',
                  }}
                />
              </div>
            )}
          </div>

          {/* Panel kanan: album art */}
          {showAlbumArt && (
            <div
              style={{
                flexShrink: 0,
                width: 136,
                height: 136,
                background: borderColor,
                clipPath: OUTER_CLIP,
                position: 'relative',
              }}
            >
              <div style={{ position: 'absolute', top: 8, left: 8, right: 8, bottom: 8, background: '#000', clipPath: INNER_CLIP }}>
                {hasArt ? (
                  <img
                    src={art!}
                    alt={track || 'album art'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 32 }}>&#9835;</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Shadow lebih gelap dari body; kalau body sudah gelap, gelapkan lagi sedikit. */
function shadeRatio(bg: string): number {
  return isLightBg(bg) ? 0.34 : 0.55;
}
