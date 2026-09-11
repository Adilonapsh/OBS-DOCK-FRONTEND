# PRD — OBS Overlays (TikTok + Streamer.bot → OBS Browser Source)

> **Product Requirements Document untuk Agent AI — sumber kebenaran tunggal.**
> Versi: `1.4` | Tanggal: `2026-09-08` | Stack: `Next.js 16 + Socket.IO + TikTok Live Connector + Streamer.bot WS + Supabase`
> Owner: `obs-overlays` | File: `docs/PRD.md` (agent wajib baca sebelum coding)

---

## 1. Ringkasan Eksekutif

**OBS Overlays** adalah platform overlay modular untuk OBS Studio yang menggabungkan **TikTok Live (WebcastPushConnection)** dan **Streamer.bot (Twitch/YouTube/Kick)** menjadi **satu event stream `tiktok-chat`** yang diisolasi per-`privateKey` (room). Setiap widget adalah **Browser Source transparan** (`?obs=1`) dengan tema yang bisa dikustom dan di-preview sebelum masuk OBS.

**Tujuan bisnis:**
- 1 URL = 1 widget = 1 Browser Source (modular, bukan canvas full 1920×1080)
- Latency < 1.5s dari chat TikTok → OBS
- Dukungan multi-platform tanpa perlu viewer ganti chat overlay
- Monetisasi-ready: white-label per `privateKey` (Supabase `profiles.private_key` / `user_private_keys`)

---

## 2. Target User & Persona

| Persona | Kebutuhan | Pain |
|---------|-----------|------|
| **Streamer TikTok** | Chat overlay vertikal/horizontal elegan, transparan | Chat TikTok tidak ada OBS native |
| **Streamer multi-platform** (Twitch/YT/Kick via Streamer.bot) | Satu overlay untuk semua platform | Harus pakai 3 overlay berbeda |
| **Event organizer** | Poll 2–6 opsi vote via chat `1-6`, hasil real-time | Poll manual tidak interaktif |
| **Music streamer** | Now Playing SMTC (Spotify/VLC) + lirik synced LRCLIB | Tampilkan lagu tanpa ganggu layout |

**Non-goal:** bukan pengganti OBS, bukan chat bot, bukan dashboard analytics.

---

## 3. Ruang Lingkup

### In Scope (v1.4 shipped)
- **Core:** Auth Supabase + `privateKey` isolation (`room = privateKey || username || global`), `server.ts:18,189,322`
- **Socket:** `io:3000`, events `join-room`, `tiktok-chat`, `tiktok-gift/like/member/roomUser`, `poll-update/clear`, `pinned-chat/unpin-chat`, `sb-connected`, `timer-get/update/control`, `task-update`
- **TikTok:** `WebcastPushConnection` (`processInitialData:false`, `enableWebsocketUpgrade:true`) per `privateKey:username` `server.ts:335`
- **Streamer.bot:** WS `ws://192.168.18.11:8080/streamerbot` → `GetActions` + `Subscribe Twitch:ChatMessage, YouTube:Message` → broadcast `tiktok-chat` `server.ts:60,77,142`
- **HTTP API:** `POST /api/chat` `server.ts:560` untuk test/SBOT
- **Widgets:**
  - `chat` — 5 tema (Standard/Bubble/Clean/Boxed/Cute Lavender Pastel), `horizontal/inline`, 6 animasi elegant, `maxMessages 1-30`, `hideAfter`, `showAvatar/Platform/Timestamp`, cute warna kustom 7 picker (tanpa `bg` container) `app/widgets/chat/*`
  - `poll` — 6 tema (Bar/Card/Donut/Minimal/Anime/Flower), vote `1-6`, `total/percent/count/timer`, auto-end `duration 10-600s`, pause/resume/visibility `server.ts:205, poll/*`
  - `clock` — 3 baris, `dayjs` format, `Asia/Jakarta`, opacity/size/color per baris `app/widgets/clock/*`
  - `media-player` — 11 tema (Standard/Matte/MatteDark/Compact/.../Vinyl/ColorPalette), SMTC `127.0.0.1:5000/now-playing`, `node-vibrant` palette, `autoHide` `app/widgets/media-player/*`
  - `lyrics` — 11 tema sama, hanya lirik synced LRCLIB `app/widgets/lyrics/*`
  - `timer` — 4 tema (Focus/Minimal/Glass/Subathon), `focusMinutes 1-120` + `totalSessions`, `subathonMode powerup/sleep/locked/paused`, semua tema respect `accent/bg/bgOpacity/textColor/fontSize` via `resolveBg`/`resolveTextColor`, registry `getTimerTheme` untuk tambah tema 3 langkah `app/widgets/timer/*`
  - `task` — 2 tema (Focus/Minimal), shared timer core `app/widgets/task/*`
  - `display` — legacy full-combined (chat+gift+pinned/like/counter/goal/ticker) `app/widgets/display/page.tsx:699`
  - `editor` — theme editor + `CssEditor` + Monaco `app/widgets/editor/page.tsx:1157`
- **Dock:** connect TikTok `connect-tiktok`, mock-events, gift/like/member preview `app/dock/*`
- **Widget System:** `app/widgets/page.tsx:529` listing + `getWidgetUrl(transparent)` + drag-to-OBS
- **Shared Layer:** `BaseThemeProps`, `hexToRgba/resolveBg`, `defineWidgetConfig`, `createUseWidgetSettings`, `WIDGET_POSITIONS` global, `PositionPicker` 3x3, `KEYFRAMES_CSS` — semua widget pakai `_shared` `app/widgets/_shared/*`
- **Preview System:** 1 file untuk OBS + live preview — `display/page.tsx` handle `?obs=1` dan `?simulate=1` (dummy tick tanpa socket), settings page iframe `simulate=1` biar 1 source, langsung sync saat setting berubah

### Out of Scope
- Transcoding, recording, analytics historis, AI moderation, donation gateway.

---

## 4. Persyaratan Fungsional (FR)

### FR-1 Auth & Isolasi
- `FR-1.1` `privateKey` diambil dari `?key=` atau `sessionStorage.dock_private_verified` atau Supabase `profiles.private_key` `app/widgets/page.tsx:184`.
- `FR-1.2` Semua socket di-scope `room = privateKey || username` `server.ts:327`; `tiktok-chat` di-broadcast ke `room` + `all` + `global`.
- `FR-1.3` `maskPrivateKey(url)` untuk copy `key=••••` `app/widgets/_shared/utils/url.ts`.

### FR-2 Chat Overlay
- `FR-2.1` `tiktok-chat` payload: `{ uniqueId, nickname, comment, profilePictureUrl, platform, timestamp, fromStreamerBot? }` `server.ts:133`.
- `FR-2.2` `display/page.tsx` join `privateKey||global` + slice `maxMessages` + optional `hideAfter` timeout.
- `FR-2.3` Tema `chat`: `standard|bubble|clean|boxed|cute` `app/widgets/chat/config.ts:4`, masing-masing ada `themes/[Name].tsx/.css`.
- `FR-2.4` Mode: `horizontal` (row flex-wrap) + `inline` (nickname: pesan sebaris) terpisah `FR-2.4`.
- `FR-2.5` Animasi: `elegant/softPop/blur/luxe/slideUp/slideLeft/slideRight/pop/fade/flip` → map ke `elegantIn/...` `ANIM_MAP` `app/widgets/_shared/constants/animations.ts`, dur `0.62s` untuk elegant, `0.45s` lainnya.
- `FR-2.6` Cute tidak pakai `bg` container (transparent), 7 warna kustom `cuteBubbleBg/cuteResubFrom→To/cuteBadgeBg/Text/cuteNameMod/User` `Cute.tsx:33`.
- `FR-2.7` Font `loadGoogleFont(font, weights, dataAttr)` `app/widgets/_shared/utils/font.ts`.

### FR-3 Poll
- `FR-3.1` `poll-create` validasi `q 120 char, opts 2-6` `server.ts:209`, `duration 10-600s`, auto-end via `setTimeout`, `poll-pause/resume/visibility/clear/get` `server.ts:241`.
- `FR-3.2` Vote `parseVote(comment)` hanya `^[1-6]$` `server.ts:27`, `handlePollVote` dedup per `userId` lower, update `votes/total/voterMap` + broadcast `poll-update` ke `room+global+all`.
- `FR-3.3` `poll/display/page.tsx` join `privateKey` + render `Bar|Card|Donut|...` sesuai `?theme=` + `?font/accent/bg/showPercent...`.

### FR-4 Media/Lyrics
- `FR-4.1` SMTC `fetch 127.0.0.1:5000/now-playing` tiap 1s, filter `included/excluded` apps, `showWhilePaused`, `swapArtistTrack` `app/widgets/media-player/display/page.tsx:168`.
- `FR-4.2` Palette `node-vibrant` dari `Thumbnail` → `AccentPalette` `Vibrant/Muted/DarkVibrant...` `media-player/display/page.tsx:42`.

### FR-5 Overlay & Editor (Legacy)
- `FR-5.1` `display/page.tsx` & `editor/page.tsx` pakai `OverlayTheme` (`queryToTheme/themeToQuery`) dari `app/overlay/components/theme.ts` — jangan hapus folder `app/overlay`.
- `FR-5.2` `editor` pakai `Monaco` + `CssEditor` + `themePresets` `app/overlay/themes/presets`.

### FR-6 Dock & Mock
- `FR-6.1` `mock-events` interval 1.5s generate `tiktok-chat/like/gift/member` `server.ts:460`.
- `FR-6.2` `tiktok-connected/connecting/error/disconnected`, `sb-connected` status.

### FR-7 Timer (Generalisasi)
- `FR-7.1` Timer core `TimerCoreConfig { focusMinutes 1-120, totalSessions 1-10, subathonMode }` + runtime `timerSeconds/isRunning/currentSession` — shared via `app/widgets/_shared/types/timer.ts` dan `baseTheme.ts: TimerBaseProps`, dipakai `timer` dan `task` agar field konsisten.
- `FR-7.2` Tema timer via registry `app/widgets/timer/themes/registry.ts: getTimerTheme(theme)` + `TIMER_THEMES` config — tambah tema baru 3 langkah (buat `MyTheme.tsx` + daftar di registry + entry di `TIMER_THEMES`) tanpa ubah `display`/`page.tsx`.
- `FR-7.3` Semua tema timer WAJIB pakai `resolveBg(bg,accent,fallback,bgOpacity)` dan `resolveTextColor(textColor)` dari `app/widgets/_shared/utils/color.ts` — tidak boleh hardcode hex di CSS/TSX, tidak boleh pakai `opacity` di container (harus `rgba`). Fix: `Focus`/`Minimal`/`Glass`/`Subathon` sudah respect `accent/bg/bgOpacity/textColor/fontSize`.
- `FR-7.4` URL timer `buildTimerUrl` pakai `buildWidgetUrl` dengan grouping `stringKeys [theme,font,accent,textColor,pos,anim,subathonMode]`, `intKeys [fontSize,bgOpacity,focusMinutes,totalSessions]`, `transparentKeys [bg]` — pola generalisasi untuk widget baru via `defineWidgetConfig`.

### FR-8 Global Position & Live Preview
- `FR-8.1` Posisi global `WIDGET_POSITIONS = tl,t,tr,l,center,r,bl,b,br` + aliases `top→t, bottom→b, left→l, right→r, top-left→tl, bottom-right→br, etc.` via `app/widgets/_shared/constants/positions.ts: normalizePosition()`. Helper `getPositionClasses(pos)` return `items-* justify-*` untuk container `fixed inset-0 flex`.
- `FR-8.2` Komponen `PositionPicker` 3x3 grid `app/widgets/_shared/components/PositionPicker.tsx` — dipakai semua widget (timer sudah pakai, chat/poll/media bisa reuse). Value `pos` disimpan di `?pos=` dan `localStorage`, termasuk `t,l,b,r` single-axis.
- `FR-8.3` Live preview & OBS pakai **1 file** — `app/widgets/timer/display/page.tsx` handle `?obs=1` (transparent) dan `?simulate=1` (preview dummy tick tanpa socket). Settings page `app/widgets/timer/page.tsx` embed iframe `.../display?theme=...&pos=...&simulate=1` dengan `key={simulateUrl}` biar reload saat setting berubah — langsung mensimulasikan `t,l,b,r,center,tl/tr/bl/br` tanpa duplikasi logic `TimerPreview`.
- `FR-8.4` Preview container menampilkan faint 9-grid overlay dan badge `SIMULATE • theme • pos` biar align terlihat sebelum masuk OBS.

---

## 5. Persyaratan Non-Fungsional (NFR)

| NFR | Target |
|-----|--------|
| Latency chat | < 1.5s (TikTok WS → Socket.IO → OBS) |
| Transparansi OBS | `?obs=1` → `html,body{background:transparent !important}` tanpa flash hitam `display/page.tsx:295` |
| Isolasi | 1 privateKey tidak bocor ke room lain (test: 2 browser beda key tidak saling lihat `tiktok-chat`) |
| Performa | `maxMessages 30` max, slice, `hideAfter` cleanup, no memory leak `mockIntervals/connections` Map |
| A11y | Keyboard nav, `aria`, contrast `bg #0a0a0a/#121212` + `text white 900` |
| Build | `next build` (Turbopack) `Compiled successfully in ~25s`, `tsc --noEmit` no `TS2307` |

---

## 6. User Stories & Kriteria Penerimaan

**US-1 Streamer pasang chat vertikal elegant**
- Given buka `/widgets/chat?key=abc`, pilih `Cute`, `anim elegant`, `maxMessages 6`
- When copy `.../chat/display?theme=cute&...&key=abc&obs=1` → paste OBS Browser Source `420×520`
- Then chat TikTok + Twitch muncul stacked, badge MOD/SUB/VIP, resub gradient pink, anim blur halus

**US-2 Horizontal ticker**
- Given centang `Horizontal layout` + `Animasi Horizontal: slideLeft`
- When `?horizontal=1&horizontalAnim=slideLeft&inline=1`
- Then di OBS bottom bar chat muncul row pills `nickname: pesan` anim `slideLeft`

**US-3 Poll vote via chat**
- Given Dock → Poll → Start `q: Mana turnamen? opts: ML, Valorant, PUBG` `duration 60`
- When viewer ketik `1` di TikTok
- Then `poll/display?theme=bar&...` bar bertambah, `total` naik, voter tidak double

**US-4 Kustom warna cute tanpa bg**
- Given tema `Cute`, ubah `Bubble #1e1d2b → #111`, `Resub From #c4a2f8 → #ff6b9d`
- Then preview & OBS update realtime, container tetap transparan (tidak ada `bg` panel)

---

## 7. Arsitektur & Alur Data

```
[TikTok Live] --WebcastPushConnection--> server.ts:369 on("chat") --+
[Streamer.bot WS] --ChatMessage--> server.ts:122 ──────────────────┼─▶ io.to(room).emit('tiktok-chat') + io.to('all') + handlePollVote
                                                                    |
Browser: /widgets/chat/display?key=room&... --io(join-room)--> io --+
                                                                    |
OBS Browser Source (?obs=1, transparent) ←—— Socket.IO (poll-update, tiktok-gift/like/member, pinned-chat)
Supabase: profiles.private_key / user_private_keys → resolvePrivateKey → room isolation
SMTC Bridge 127.0.0.1:5000 → /now-playing → media-player/lyrics polling
```

**Port:** Next `3001` (`npm run dev`), Socket `3000` (`server.ts:12`), Supabase env `.env.local`.

---

## 8. Stack Teknologi

- `Next.js 16.3.3` (App Router, Turbopack), `React 19`, `TypeScript 5`
- `Socket.IO 4.8.3`, `tiktok-live-connector`, `ws`
- `Supabase ssr/js 2.112`, `Tailwind 4`, `lucide-react`, `recharts`, `node-vibrant`, `monaco-editor`
- `Express` custom server `server.ts` (Vite middleware dev, static dist prod)

---

## 9. Aturan URL & Storage

- Query: `?theme=&font=&fontSize=&accent=&bg=&bgOpacity=&pos=&focusMinutes=&totalSessions=&subathonMode=&textColor=&anim=&maxMessages=&hideAfter=&showAvatar=&showPlatform=&showTimestamp=&horizontal=&horizontalAnim=&inline=&cuteBubbleBg...&key=&obs=1&simulate=1`
- Storage: `localStorage: 'chat-settings' | 'poll-settings' | 'clock-settings' | 'media-player-settings' | 'timer-settings' | 'task-settings'` + `sessionStorage: dock_private_verified`
- Mask: `maskPrivateKey(url)` → `key=••••` untuk copy.
- Position: `?pos=tl|t|tr|l|center|r|bl|b|br` alias `top/bottom/left/right/top-left/...` via `normalizePosition()` — global, dipakai semua widget, 1 param untuk OBS align.

---

## 10. Kriteria Selesai (Definition of Done)

- `npx tsc --noEmit --skipLibCheck` 0 error `TS2307`
- `npm run build` `Compiled successfully`
- `app/overlay` tidak terhapus (editor/display butuh `theme.ts`)
- Setiap widget baru: `config.ts + hooks/ + components/ + themes/ + display/page.tsx + page.tsx` < 90/160 baris, pakai `_shared`

---

## 11. Risiko & Mitigasi

- **TikTok WS 200 / user_not_found** → tampil `tiktok-error` `server.ts:361`, jangan crash.
- **Streamer.bot offline** → `sb-connected false`, reconnect 5s `server.ts:163`.
- **Memory leak `connections` Map** → `disconnect-tiktok` + `streamEnd` cleanup `server.ts:442`.

---

## 12. Panduan Agent AI

- **Baca dulu:** `docs/DESIGN.md` (visual + file structure) + `app/widgets/_shared/README.md` + `server.ts` sebelum coding.
- **Jangan:** hapus `app/overlay`, duplikasi `getSocketUrl/buildUrl/animMap`, buat `page.tsx > 120 baris`, pakai `any` untuk `ChatSettings`.
- **Do:** import dari `_shared/utils|constants|hooks|components`, typed `ChatThemeProps`, barrel `app/widgets/chat/index.ts`.
- **Chat widget adalah exemplar clean** — duplikasi strukturnya untuk widget baru.

