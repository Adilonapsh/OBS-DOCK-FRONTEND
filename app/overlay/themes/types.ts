// Best Practice: Central type definitions for overlay theming
// - Single source of truth for theme shape
// - Strict typing prevents drift when adding new themes

export type OverlayTheme = {
  accent: string; // gift, like - primary accent
  accent2: string; // pinned border, secondary
  chatBg: string;
  chatText: string;
  chatBorder: string;
  chatRadius: number;
  chatOpacity: number; // 0-100
  chatBlur: number; // 0-20
  pinnedBg: string;
  pinnedBorder: string;
  pinnedText: string;
  giftBg: string;
  giftBorder: string;
  giftText: string;
  fontScale: number; // 0.85-1.3
  fontFamily: string; // Google Fonts family
  showAvatar: boolean;
  showPlatform: boolean;
  showTimestamp: boolean;
  shadow: boolean;
  // Spacing - bisa diubah per overlay via Editor → Layout → Spacing
  chatPadding: number; // px - padding bubble chat
  chatGap: number; // px - jarak antar bubble
  chatMargin: number; // px - margin container
  overlayPadding: number; // px - padding canvas overlay
  overlayGap: number; // px - gap antar elemen (gift/pinned)
  // Layout - compact inline
  inlineChat: boolean; // true = username & pesan sejajar (horizontal), false = stacked
};

export type ThemePreset = {
  name: string;
  icon: string;
  theme: OverlayTheme;
  /** Optional custom CSS injected with the theme (e.g. neon-panel) */
  css?: string;
  /** Optional category for grouping in UI */
  category?: "core" | "gaming" | "cute" | "anime" | "minimal";
  /** Optional description for docs */
  description?: string;
};

export type ThemePresetMap = Record<string, ThemePreset>;

/**
 * Best Practice helper - type-safe theme definition
 * Validates theme shape at compile time and enforces required fields
 * Usage:
 *   export default defineTheme({ name: "My Theme", icon: "🎨", theme: { ...defaultTheme, accent: "#ff0" } })
 */
export function defineTheme(preset: ThemePreset): ThemePreset {
  return preset;
}
