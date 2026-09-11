# Widgets - Clean Code Guide

Folder `app/widgets/*` mengikuti best-practice clean code setelah refactor.

## Struktur Folder
```
app/widgets/
  _shared/              # DRY layer - jangan duplikasi
    utils/socket.ts, url.ts, font.ts, storage.ts
    hooks/useWidgetSocket.ts, useCopy.ts
    constants/fonts.ts, animations.ts
    components/WidgetShell.tsx, UrlBar.tsx
    types/widget.ts
  _shared/README.md     # panduan DRY/SRP
  page.tsx              # listing (529 → akan dipecah next, pakai _shared/types)
  display/page.tsx      # legacy combined overlay (699 → direkomendasikan pecah per-widget)
  editor/page.tsx       # 1157 → monolith, next refactor pakai _shared + hooks
  chat/                 # ✅ clean exemplar
    config.ts           # DEFAULTS + THEMES + ANIMS + buildChatUrl
    hooks/useChatSettings.ts
    components/ChatSettingsForm.tsx
    components/ChatPreview.tsx
    themes/types.ts, Standard/Bubble/Clean/Boxed/Cute
    display/page.tsx    # thin (pakai _shared/utils)
    page.tsx            # thin (WidgetShell)
  poll/                 # butuh refactor sama seperti chat
  clock/                # 2 files → pecah config + hooks
  media-player/         # 26 files, 11 themes duplikat lyrics → gabung ke _shared/media-themes
  lyrics/               # sama
```

## Aturan Clean Code
- **DRY**: `getSocketUrl`, `get*Param`, `loadGoogleFont`, `ANIM_MAP` hanya di `_shared`. Jangan copy-paste ke widget.
- **SRP**: `config.ts` (data), `hooks/` (state+side effect), `components/` (UI), `themes/` (render), `page.tsx` (compose).
- **KISS**: `page.tsx` settings < 90 baris, `display/page.tsx` < 160 baris (chat sudah).
- **Uniform naming**: `privateKey`, `obsMode`, `font`, `bg`, `accent`, `horizontal/inline`, `anim/horizontalAnim`. Helper `resolvePrivateKey` handle `?key=` vs `?privateKey=`.
- **Barrel & typed**: `ChatThemeProps`, `ChatSettings`, `WidgetItem` ter-typed ketat, tidak `any`.

## Checklist Widget Baru
1. Copy `chat/` → `my-widget/`
2. Ganti `config.ts` (DEFAULTS, THEMES, buildUrl)
3. Ganti `themes/` (1-5 tema, pakai `types.ts` + `effectiveAnim` pattern)
4. Pakai `_shared` untuk socket/url/font/animations di `display/page.tsx`

## Next Refactor (TODO)
- [ ] `editor/page.tsx` 1157 → pecah `hooks/useEditorTheme`, `components/ThemePanel/CssPanel/Preview`
- [ ] `display/page.tsx` 699 → pecah per-mode (chat/gift/pinned/like/counter) jadi komponen
- [ ] `lyrics` ↔ `media-player` themes dedup → ` _shared/media-themes/`
- [ ] `widgets/page.tsx` extract `WidgetCard`, `FilterBar`, `PrivateKeyField`
