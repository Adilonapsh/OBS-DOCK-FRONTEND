export type AccentPalette = {
  Vibrant: string; Muted: string; DarkVibrant: string; DarkMuted: string; LightVibrant: string; LightMuted: string;
};

export type Timeline = {
  Position: number;
  EndTime: number;
  LastUpdatedTime: string;
} | null;

export type LyricLine = { timeMs: number; text: string };

export type LyricsThemeProps = {
  track: string;
  artist: string;
  art: string;
  bgArt: string;
  palette: AccentPalette;
  accent: string;
  bgColor: string;
  textColor: string;
  progressPercent: number;
  currentPos: number;
  timeline: Timeline;
  showAlbumArt: boolean;
  showProgressBar: boolean;
  showPrimary: boolean;
  showSecondary: boolean;
  isPausedOverlay: boolean;
  playbackStatus: number;
  textAlignCls: string;
  msToTime: (ms: number) => string;
  error: string | null;
  smtcBridgeAddress: string;
  smtcBridgePort: string;
  obsMode: boolean;
  // lyrics
  lyrics: LyricLine[];
  activeIndex: number;
  plainLyrics: string;
  lyricsAlign: string;
  lyricsFontSize: number;
  showLyrics: boolean;
  maxLyricsLines: number;
};
