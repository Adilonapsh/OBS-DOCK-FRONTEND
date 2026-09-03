# Overlay Themes - Best Practice

Setiap overlay (`full`, `chat`, `gift`, `pinned`, `view-counter`, `cyber-terminal`, dll) punya **tema terpisah** (`localStorage: overlay-theme-${overlayId}` + URL `?font=&accent=...`). Semua tema terdaftar di registry modular biar gampang nambah tanpa ubah core.

## Struktur

```
app/overlay/themes/
├── types.ts          # OverlayTheme, ThemePreset, defineTheme()
├── default.ts        # defaultTheme (fallback)
├── fonts.ts          # googleFonts + googleFontUrl()
├── utils.ts          # themeToQuery / queryToTheme / storage keys / encodeCss
├── snippets.ts       # cssSnippets untuk tab CSS
├── presets/
│   ├── dark.ts
│   ├── light.ts
│   ├── neon.ts
│   ├── tiktok.ts
│   ├── minimal.ts
│   ├── compact.ts
│   ├── cyber.ts      # + css neon-panel
│   ├── pokemon.ts    # ⚡ Fredoka
│   ├── vtuber.ts     # 🎀 Outfit
│   ├── cute.ts       # 🌸 Comfortaa
│   └── index.ts      # ← REGISTRY: import & export semua preset
└── index.ts          # barrel re-export
```

`app/overlay/components/theme.ts` sekarang cuma **wrapper** `export * from "../themes"` untuk backward compatibility. Import baru disarankan dari `@/app/overlay/themes`.

## Cara nambah tema baru (30 detik)

1. Buat file `app/overlay/themes/presets/namaTema.ts`:

```ts
import { defineTheme } from "../types";
import { defaultTheme } from "../default";

export default defineTheme({
  name: "Nama Tema",
  icon: "🎨",
  category: "cute", // core | gaming | anime | cute | minimal
  description: "Deskripsi singkat",
  theme: {
    ...defaultTheme,
    fontFamily: "Poppins", // harus ada di googleFonts
    accent: "#FF6B9D",
    accent2: "#00E5FF",
    chatBg: "rgba(255,255,255,0.92)",
    // ... override seperlunya
  },
  // optional custom CSS (akan auto-apply saat preset dipilih)
  css: `.overlay-chat-bubble{border:2px solid #FF6B9D !important}`,
});
```

2. Daftarkan di `app/overlay/themes/presets/index.ts`:

```ts
import namaTema from "./namaTema";
export const themePresets = {
  dark, light, neon, tiktok, minimal, compact, cyber,
  pokemon, vtuber, cute,
  namaTema, // <- tambah di sini
};
```

3. Selesai - otomatis muncul di **Editor → Warna → Preset dropdown** dan di URL `?font=...&accent=...&css=...`. Tidak perlu ubah `editor/page.tsx` atau `display/page.tsx`.

## Best Practice

- **Selalu spread `...defaultTheme`** biar field baru (misal `fontFamily`) auto fallback.
- **Gunakan `defineTheme`** untuk type-safe - TS akan error kalau field typo.
- **Jangan hardcode preset di `theme.ts`** - semua via `presets/` biar git history bersih & tidak conflict.
- **CSS spesifik tema** taruh di `css` field preset, bukan global - akan di-inject via `customCss` + `encodeCss` ke OBS URL.
- **Font** harus ada di `googleFonts` biar picker preview bisa load. Tambah font baru di `fonts.ts` + `googleFontUrl` otomatis handle.
