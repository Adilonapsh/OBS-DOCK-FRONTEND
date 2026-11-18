# Widgets - Shared Layer

Best-practice clean code untuk `app/widgets/*`.

## Prinsip
- **DRY**: `getSocketUrl`, `get*Param`, `loadGoogleFont`, `ANIM_MAP/KEYFRAMES_CSS`, `WIDGET_FONTS` hanya di sini.
- **SRP**: `page.tsx` hanya orchestrator (hooks + layout), logic di `hooks/`, UI di `components/`, konstanta di `constants/`, tipe di `types/`.
- **Uniform naming**: `privateKey` (bukan `key`/`privateKey` campur), `obsMode`, `font`, `bg`, `accent`. Semua widget pakai helper `resolvePrivateKey/getStringParam`.

## Struktur
```
_shared/
  utils/
    socket.ts       → getSocketUrl()
    url.ts          → getStringParam/getIntParam/getBoolParam/maskPrivateKey/buildWidgetUrl
    font.ts         → loadGoogleFont/googleFontUrl
    storage.ts      → loadSettings/saveSettings/resolvePrivateKey
    color.ts        → hexToRgba/resolveBg/resolveTextColor/accentSoft (fix tema tidak bisa ganti warna)
    widgetConfig.ts → defineWidgetConfig() - factory generalisasi buildUrl & DEFAULTS
  hooks/
    useWidgetSocket.ts   → io(getSocketUrl)+join-room+connected
    useWidgetSettings.ts → createUseWidgetSettings(storageKey, defaults) - factory untuk semua widget
    useCopy.ts
  constants/
    fonts.ts        → WIDGET_FONTS (unified)
    animations.ts   → ANIM_MAP, ELEGANT_ANIMS, KEYFRAMES_CSS, isElegantAnim/dur
  components/
    WidgetShell.tsx → header + URL bar + 2-col (settings|preview) layout
    UrlBar.tsx      → masked URL + Copy/Eye + OBS/Drag
  types/
    widget.ts       → WidgetItem, WidgetCategory
    baseTheme.ts    → BaseThemeProps, TimerBaseProps, ThemeRegistry, defineThemeRegistry
    timer.ts        → TimerCoreConfig/TimerRuntimeState/timerUrlKeys (shared untuk timer)
```

## Cara pakai di widget baru

```ts
// config.ts - pakai factory (generalisasi semua widget)
import { defineWidgetConfig } from '../_shared/utils/widgetConfig';
export const cfg = defineWidgetConfig({
  themes: MY_THEMES,
  defaults: MY_DEFAULTS,
  stringKeys: ['theme','font','accent','textColor'],
  intKeys: ['fontSize','bgOpacity'],
  transparentKeys: ['bg'],
});
export const buildUrl = cfg.buildUrl;

// hooks/useXSettings.ts - 1 baris generalisasi
import { createUseWidgetSettings } from '../_shared/hooks/useWidgetSettings';
import { MY_DEFAULTS } from '../config';
export const useMySettings = createUseWidgetSettings('my-settings', MY_DEFAULTS);

// page.tsx (settings) - < 90 baris
import { WidgetShell } from '../_shared/components/WidgetShell';
import { UrlBar } from '../_shared/components/UrlBar';
import { KEYFRAMES_CSS } from '../_shared/constants/animations';

// display/page.tsx - < 140 baris
import { getSocketUrl } from '../_shared/utils/socket';
import { getStringParam } from '../_shared/utils/url';
import { loadGoogleFont } from '../_shared/utils/font';
import { ANIM_MAP, KEYFRAMES_CSS } from '../_shared/constants/animations';

// themes/registry.ts - tambah tema tanpa ubah display/page.tsx
import { defineThemeRegistry } from '../_shared/types/baseTheme';
export const REGISTRY = defineThemeRegistry<MyProps>({ standard: Standard, cute: Cute });
export const getTheme = (v:string) => REGISTRY[v] || Standard;
```

### Generalisasi Timer - field timer yang shared

```ts
// types/timer.ts
import type { TimerCoreConfig } from '../_shared/types/timer';
// TimerCoreConfig = { focusMinutes, totalSessions, subathonMode }
// TimerBaseProps = BaseThemeProps + { timerSeconds, isRunning, currentSession, totalSessions, ... }
```

### Fix warna tema

Semua tema WAJIB pakai helper `_shared/utils/color.ts`:
```ts
import { resolveBg, resolveTextColor } from '../../_shared/utils/color';
const bgColor = resolveBg(bg, accent, '#121212', bgOpacity); // bukan opacity di container
const color = resolveTextColor(textColor, '#ffffff');
```

## Widget ideal structure (contoh `chat/`)
```
chat/
  config.ts          → DEFAULTS, THEMES, FONTS, ANIMS, DEMO_CHATS, buildChatUrl
  hooks/
    useChatSettings.ts
  components/
    ChatSettingsForm.tsx
    ChatPreview.tsx
  themes/
    Standard.tsx/.css  + types.ts
    Bubble.tsx/.css
    ...
    Cute.tsx/.css
  display/
    page.tsx  (thin, hanya socket + renderTheme)
  page.tsx    (thin, hanya WidgetShell + UrlBar + ChatSettingsForm + ChatPreview)
```
Setiap `themes/*.tsx` menerima `ChatThemeProps` ter-typed, `effectiveAnim` dipilih `horizontal ? horizontalAnim : anim`, durasi via `isElegantAnim`.

## Aturan
- Jangan duplikasi `getSocketUrl/buildUrl/font loader/animMap` - import dari `_shared`.
- `page.tsx` (settings) tidak boleh > 120 baris; `display/page.tsx` tidak boleh > 160 baris.
- Semua `localStorage` key via `storage.ts`, semua mask URL via `maskPrivateKey`.
- Semua warna via `color.ts` (jangan hardcode hex di CSS/TSX, jangan pakai `opacity` di container).
- Tambah widget baru: duplikasi struktur `chat/` atau `timer/` (sudah pakai registry), ganti `config.ts` & `themes/`.
- Tambah tema baru: cukup buat `themes/MyTheme.tsx` + daftarkan di `themes/registry.ts` + tambah entry di `THEMES` config - display otomatis pakai registry.

## Menambah Tema Timer (contoh)
Lihat `app/widgets/timer/themes/registry.ts` → `TIMER_THEME_DOCS`. Template siap copy-paste.

