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

## Cara nambah tema baru (auto-register dari nama file)

1. Buat file `app/overlay/themes/presets/namaTema.ts` (nama file = key, `my-theme.ts` → `myTheme`):

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

2. Restart dev server (`npm run dev` otomatis menjalankan `npm run gen:themes` via `predev`) atau jalankan manual `npm run gen:themes`.

3. Selesai - file `presets/index.ts` ke-generate ulang otomatis dan tema langsung muncul di **Editor → Warna → Preset dropdown** dan di URL `?font=...&accent=...&css=...`. Tidak perlu ubah `editor/page.tsx`, `display/page.tsx`, atau `index.ts` (JANGAN edit manual).

## Best Practice

- **Selalu spread `...defaultTheme`** biar field baru (misal `fontFamily`) auto fallback.
- **Gunakan `defineTheme`** untuk type-safe - TS akan error kalau field typo.
- **Jangan hardcode preset di `theme.ts`** - semua via `presets/` biar git history bersih & tidak conflict.
- **CSS spesifik tema** taruh di `css` field preset, bukan global - akan di-inject via `customCss` + `encodeCss` ke OBS URL.
- **Font** harus ada di `googleFonts` biar picker preview bisa load. Tambah font baru di `fonts.ts` + `googleFontUrl` otomatis handle.
