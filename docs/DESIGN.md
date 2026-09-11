# DESIGN SYSTEM - OBS Overlays

> **Design spec untuk Agent AI - jaga konsistensi visual & kode.**
> File: `docs/DESIGN.md` | Pair: `docs/PRD.md` | Update: `2026-09-04`
> Prinsip: *Editorial dark, glassmorphism, elegant blur, modular widget*

---

## 1. Prinsip Desain

- **Transparent-first:** Semua widget `?obs=1` → `html,body{background:transparent}` tanpa flash, padding 0, overflow hidden `app/widgets/chat/display/page.tsx:141`.
- **Glassmorphism:** `backdrop-blur-2xl`, `border-white/10`, `shadow-[0_8px_32px_rgba(0,0,0,0.4)]`, `bg #1e1d2b/ #121212 / rgba(18,18,18,0.88)`.
- **Elegant motion:** `cubic-bezier(0.16,1,0.3,1)` + `filter: blur(6-12px)` → `blur(0)` di semua keyframes `app/widgets/_shared/constants/animations.ts:15`.
- **Modular:** 1 widget = 1 Browser Source, ukuran badge card `420×520` (chat), `640×320` (poll), `500×140` (media).

---

## 2. Palet Warna

| Token | Nilai | Pakai |
|-------|-------|-------|
| `bg` | `#0a0a0a` (page), `#121212` (header/sidebar), `#161616` (card), `#1e1d2b` (cute bubble) | Layout |
| `accent` | `#8b5cf6` (violet) default, customizable | `borderLeft 3px solid accent`, `Standard` theme |
| `tiktok` | `#FE2C55` | Dot live, gift button |
| `resub grad` | `#c4a2f8 → #fca4d4` (cute) customizable `cuteResubFrom/To` | `CuteTheme:resubGrad` |
| `badge` | `bg #2e2c45 text #a8a3ce` (mod/sub/vip), `bg #3b3058 text #a3b2f8` (resub) customizable `cuteBadgeBg/Text` | `Cute.css: role-badge` |
| `name mod` | `#f5a8d0`, `name user` `#d8cded` customizable `cuteNameMod/User` | `Cute.tsx` |
| `gradient cute` | `135deg #6c62a8→#8979c4` - **tidak dipakai** (cute container sekarang `transparent` per request) | - |

Semua warna cute bisa dikustom via 7 picker `ChatSettingsForm` ketika `theme==='cute'`.

---

## 3. Tipografi

- **Primary:** `Outfit` (default), `Nunito` (cute header), fallback `Quicksand, Geist, Manrope...` `app/widgets/_shared/constants/fonts.ts:3` `WIDGET_FONTS` 19 fonts.
- **Scale:** `fontSize 10-26` (chat), `fontFamily` via `loadGoogleFont(font, weights, dataAttr)` `app/widgets/_shared/utils/font.ts`.
- **Weight:** `900 black` untuk nickname/badge/header, `700 bold` untuk message, `400` untuk caption.
- **Letter:** `tracking-widest uppercase 10-11px` untuk label, `leading-snug` untuk bubble.

---

## 4. Layout & Spacing

- **Sidebar:** `240px` (`lg:pl-[240px]`), `Sidebar active="widgets"` `app/widgets/_shared/components/WidgetShell.tsx:18`.
- **Header:** `h-14 bg-[#121212] border-b border-white/5`, icon `8×8 rounded-lg violet gradient`, title `12px 900 uppercase` + `Live` pill.
- **URL Bar:** `bg-black/40 border-white/10 rounded-xl` + masked `key=••••` + `Eye/EyeOff` + `Copy/Check` + `OBS/Drag` `UrlBar.tsx`.
- **2-col:** `settingsPanel w-[420px] shrink-0 bg-[#121212] border-r border-white/5` (scrollable `max-h-[52vh] lg:h-[calc(100vh-112px)]`) + `previewPanel flex-1 bg-[#0a0a0a] p-4 md:p-6`.
- **Preview:** `bg-black border-white/10 rounded-2xl shadow-2xl min-h-[360px] p-4 flex items-end justify-start|center` (center jika `horizontal`).
- **Spacing:** `gap 2-3`, `p-3`, `rounded-2xl` (card), `rounded-full` (pill horizontal), `rounded-[12px]` (cute bubble).

---

## 5. Komponen Shared

### 5.1 `WidgetShell`
Props `sidebarOpen, setSidebarOpen, user, headerIcon, title, subtitle, headerActions, urlBar, settingsPanel, previewPanel` → konsisten header `Menu/ArrowLeft + gradient icon`.

### 5.2 `UrlBar`
`obsUrl, showKey, onToggleKey, copied, onCopy` → handle `maskPrivateKey` + blur `key`.

### 5.3 `ChatSettingsForm` (contoh)
Section: `Tema & Font` (select theme + datalist fonts + fontSize + anim), `Warna` (conditional `cute? 7 picker : Accent+Background+Opacity`), `Chat` (maxMessages/hideAfter/avatar/platform/timestamp/inline/horizontal+horizontalAnim). Setiap toggle `bg-black/30 rounded-xl border-white/5`.

### 5.4 `ChatPreview`
`DEMO_CHATS` 4 item rotate `tick 2.4s`, `ANIM_MAP` → `elegantIn` etc, render `Standard/Bubble/Clean/Boxed/Cute` sesuai `state.theme`.

---

## 6. Sistem Tema

### Chat (5)
| Tema | Karakter |
|------|----------|
| `standard` | Dark glass `rgba(18,18,18,0.88) borderLeft accent 3px` rounded `16px/999px` inline |
| `bubble` | Putih WA `bg #fff border-black/5` rounded `18px/999px`, avatar 8×8 → 6×6 horizontal |
| `clean` | Baris minimalis `borderLeft accent` vs pill `rounded-full` horizontal |
| `boxed` | Card `rounded-[20px] border-white/10` header ` LIVE CHAT` + `max-h-[520px]` |
| `cute` | Lavender Pastel `Nunito`, `bubbleBg #1e1d2b` (kustom), `resub grad`, `badge #2e2c45`, container `transparent` (tidak pakai `bg`), 3 mode `vertical/inline/horizontal` |

Semua tema di `app/widgets/chat/themes/*.tsx` terima `ChatThemeProps:24` (`chats,font,accent,bg,anim/horizontalAnim,fontSize,bgOpacity,horizontal,inline,cute*`), pilih `effectiveAnim = horizontal ? horizontalAnim : anim`, `isElegant ? 0.62s : 0.45s`.

### Poll (6)
`Bar/Card/Donut/Minimal/Anime/Flower` di `app/widgets/poll/themes/*.tsx` → `PollThemeProps` (`poll,font,accent,bg,showPercent/Count/Total/Timer`).

### Media/Lyrics (11)
`Standard/Matte/MatteDark/Compact/CompactInverted/Simple/Classic/Card/AlbumArt/Vinyl/ColorPalette` duplikat `lyrics↔media-player` (next dedup ke `_shared/media-themes`).

---

## 7. Sistem Animasi

**Keyframes** `app/widgets/_shared/constants/animations.ts:15` + `docs/PRD FR-2.5`:
```css
elegantIn { from {opacity:0; translateY 14px scale 0.97 blur 8px} to {1; 0 1 blur 0} }
softPopIn { from {0; scale 0.94 blur 6} to {1} }
blurIn { from {0; blur 12} to {1} }
luxeIn { from {0; translateY 18 scale 0.96 blur 10 letter-spacing 0.04em} to {1} }
slideUp { from {0; translateY 16 scale 0.96 blur 6} }
slideLeft/Right { translateX 18 blur 4 }
popIn {0% 0 scale 0.85 blur 6; 60% 1.03; 100% 1}
fadeIn {0 blur 6} flipIn {perspective 600 rotateX -20 blur 6}
```
`ANIM_MAP` 10 entri `elegant→elegantIn` etc, `dur 0.62s` jika `ELEGANT_ANIMS`, else `0.45s` (`Clean 0.4s`). Preview & display pakai `KEYFRAMES_CSS` yang sama (fix bug animasi tidak muncul karena preview belum punya keyframes).

---

## 8. Struktur File (Clean Code)

```
app/widgets/
  _shared/              # DRY
    utils/socket.ts, url.ts, font.ts, storage.ts
    hooks/useWidgetSocket.ts, useCopy.ts
    constants/fonts.ts, animations.ts
    components/WidgetShell.tsx, UrlBar.tsx
    types/widget.ts
  _shared/README.md
  README.md
  chat/                 # exemplar clean
    config.ts           # CHAT_THEMES/FONTS/ANIMS/DEFAULTS/DEMO_CHATS/buildChatUrl
    hooks/useChatSettings.ts
    components/ChatSettingsForm.tsx, ChatPreview.tsx
    themes/types.ts, Standard/Bubble/Clean/Boxed/Cute.tsx/.css
    display/page.tsx    # 115 baris (was 200)
    page.tsx            # 170 baris (was 420)
    index.ts            # barrel
  poll/, clock/, media-player/, lyrics/ # belum clean - ikuti pola chat
  display/page.tsx      # 699 → TODO pecah
  editor/page.tsx       # 1157 → TODO pecah
  page.tsx              # 529 listing
  overlay/              # JANGAN HAPUS - editor/display butuh app/overlay/components/theme.ts
```

**Aturan:**
- `page.tsx` settings < 90 baris (chat sudah 170 termasuk modals - next target 90)
- `display/page.tsx` < 160 baris (chat 115)
- `config.ts` untuk semua konstanta, bukan inline di `page.tsx`
- `hooks/` untuk `useEffect` + `localStorage` + `socket`, bukan campur JSX
- `themes/` hanya render, tidak ada `io()` atau `buildUrl`
- Import dari `_shared`, jangan duplikasi `getSocketUrl/get*Param/ANIM_MAP/WIDGET_FONTS`

---

## 9. Kode Konvensi untuk Agent AI

**Do:**
- `import { getSocketUrl } from '../_shared/utils/socket'`; `import { ANIM_MAP, KEYFRAMES_CSS } from '../_shared/constants/animations'`
- `type ChatSettings = typeof CHAT_DEFAULTS` (typed), `update: (k: keyof ChatSettings, v: unknown)`
- `resolvePrivateKey(searchParams)` handle `key|privateKey|sessionStorage`
- `maskPrivateKey(url)` untuk URL bar
- `loadGoogleFont(font, weights, dataAttr)` di `useEffect [font]`
- `effectiveAnim = horizontal ? horizontalAnim : anim` + `isElegantAnim` untuk dur

**Don't:**
- Copy-paste `function getSocketUrl(){...}` ke widget baru
- Buat `page.tsx > 120 baris` - pecah ke `components/` + `hooks/`
- Pakai `any` untuk `buildUrl` - pakai `ChatSettings`
- Hapus `app/overlay` - akan `Module not found: Can't resolve '../overlay/components/theme'`
- Pakai `bg` untuk `cute` container (sudah `transparent` + warna kustom 7 picker)
- Lupa `animation: ${effectiveAnim} ${dur} cubic-bezier(0.16,1,0.3,1) both`

**Cek sebelum commit:**
```bash
npx tsc --noEmit --skipLibCheck  # 0 TS2307
npm run build                     # Compiled successfully
```

---

## 10. Referensi Visual

- Chat Cute: screenshot `Lavender Pastel` - `max-w-[380px] flex-col gap-3 p-4`, header `MOD/SUB/VIP badge #2e2c45`, bubble `#1e1d2b`, resub `linear 90deg`, `Nunito 11px 900`.
- Poll Bar: `Bar.tsx` `linear 90deg colors[i]→accent`, `poll-option-index` `7×7 rounded-full bg-white`.
- Media Classic: `bg: linear-gradient(0deg, bgColorEE, bgColorAA), url(bgArt)` + `backdrop-blur-xl`.

---

## 11. Panduan Agent

1. Baca `docs/PRD.md` + `app/widgets/_shared/README.md` dulu sebelum edit widget.
2. Chat adalah **gold standard** - widget baru copy `chat/config.ts + hooks/useChatSettings + components/` lalu ganti `themes/`.
3. Tanya user jika butuh 11 tema baru vs reuse `_shared/media-themes`.
4. Selalu update `docs/PRD` + `docs/DESIGN` jika tambah FR atau tema baru agar AI berikutnya konsisten.
