import type { MediaThemeProps } from './types';
import './LargeAlbumArt.css';
import { Pause, Play } from 'lucide-react';

export default function LargeAlbumArtTheme(props: MediaThemeProps) {
    const {
        track,
        artist,
        art,
        palette,
        accent,
        bgColor,
        textColor,
        progressPercent,
        timeline,
        showAlbumArt,
        showProgressBar,
        showPrimary,
        showSecondary,
        isPausedOverlay,
        playbackStatus,
        textAlignCls,
        msToTime,
        error,
    } = props;

    const themeBgColor = bgColor || palette?.DarkMuted || '#21202b';
    const themeTextColor = textColor || '#ffffff';
    const accentColor = accent || palette?.Vibrant || '#e05561';

    const currentFormatted = timeline && msToTime ? msToTime(timeline.Position) : '0:00';
    const durationFormatted = timeline && msToTime ? msToTime(timeline.EndTime) : '0:00';

    const isPlaying = playbackStatus === 4;

    if (error) {
        return (
            <div className="w-full sm:max-w-sm p-4 rounded-2xl bg-red-900/40 text-red-200 text-xs text-center border border-red-500/20">
                {error}
            </div>
        );
    }

    return (
        <div
            className="relative w-full sm:max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col font-sans transition-colors duration-300 select-none"
            style={{ backgroundColor: themeBgColor, color: themeTextColor }}
        >
            {showAlbumArt && (
                <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                    style={{ backgroundImage: `url('${art}')` }}
                />
            )}


            {!showAlbumArt && (
                <div className="absolute inset-0" style={{ backgroundColor: themeBgColor }} />
            )}

            {isPausedOverlay && !isPlaying && (
                <>
                    <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] transition-opacity" />
                    <div className="absolute inset-0 z-10 flex items-center justify-center mb-28">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-lg">
                            <Pause className="h-5 w-5 fill-current text-white" />
                        </div>
                    </div>
                </>
            )}

            <div className="relative min-h-[12.5rem] w-full" />

            <div
                className="relative w-full p-6 pt-5 flex flex-col items-center border-white/10"
                style={{
                    opacity: 1,
                    background: `radial-gradient(circle at 50% 100%, ${palette?.DarkVibrant || accentColor} 0%, ${palette?.DarkVibrant || accentColor}88 28%, rgba(17,17,24,0.75) 120%)`,
                    backdropFilter: 'blur(18px) saturate(140%)',
                    WebkitBackdropFilter: 'blur(18px) saturate(140%)',
                }}
            >
                <div className={`w-full flex flex-col items-center mb-5 ${textAlignCls} z-10`}>
                    {showPrimary && (
                        <h3
                            className="font-bold text-lg leading-snug tracking-wide truncate max-w-full"
                            style={{ color: accentColor }}
                        >
                            {track || 'Unknown Track'}
                        </h3>
                    )}
                    {showSecondary && (
                        <p
                            className="text-xs font-medium truncate max-w-full mt-1"
                            style={{ color: `${accentColor}ff` }}
                        >
                            {artist || 'Unknown Artist'}
                        </p>
                    )}
                </div>

                {showProgressBar && (
                    <div className="w-full flex items-center gap-3 text-[0.65rem] font-semibold tracking-wider px-4">
                        <span className="shrink-0 transition-colors" style={{ color: accentColor }}>
                            {currentFormatted}
                        </span>

                        <div className="relative flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-200 ease-out"
                                style={{
                                    width: `${Math.min(100, Math.max(0, progressPercent))}%`,
                                    backgroundColor: accentColor,
                                }}
                            />
                        </div>
                        <span className="shrink-0 transition-colors" style={{ color: accentColor }}>
                            {durationFormatted}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}