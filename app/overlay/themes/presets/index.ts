// Best Practice: Registry - single place to register themes
// To add a new theme: 1) create `myTheme.ts` via `defineTheme`, 2) import + add to `themePresets` below
// No need to touch theme.ts or editor - auto appears in dropdown

import type { ThemePresetMap } from "../types";
import dark from "./dark";
import light from "./light";
import neon from "./neon";
import tiktok from "./tiktok";
import minimal from "./minimal";
import compact from "./compact";
import cyber from "./cyber";
import pokemon from "./pokemon";
import vtuber from "./vtuber";
import cute from "./cute";

export const themePresets: ThemePresetMap = {
  dark,
  light,
  neon,
  tiktok,
  minimal,
  compact,
  cyber,
  pokemon,
  vtuber,
  cute,
};

// Optional: export by category for filtered UI
export const themeCategories = {
  core: ["dark", "light", "minimal", "compact"],
  gaming: ["neon", "cyber"],
  anime: ["tiktok", "pokemon", "vtuber"],
  cute: ["cute"],
} as const;
