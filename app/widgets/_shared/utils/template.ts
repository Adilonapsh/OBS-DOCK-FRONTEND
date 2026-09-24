// Simple mustache-like template - {{username}} {{message}} {{date}} {{timer}} {{clock}} {{polls}} etc.
// WordPress-like: user tinggal drag {{variable}} ke editor, preview langsung render.
// Semua query params widgets bisa dipakai sebagai {{variable}} di template HTML custom overlay.

export type TemplateData = Record<string, string | number | boolean | null | undefined>;

const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;

export type TemplateVar = {
  key: string;
  label: string;
  example: string;
  desc: string;
  group: string;
};

// Known variables - dipakai untuk drag-drop palette & docs
// Mencakup SEMUA params widgets: chat, event, timer, task, follow, poll,
// clock, media-player, lyrics, music, info-slides, social-rotator,
// pinned, view-counter, qr + style global + live data.
export const TEMPLATE_VARS: TemplateVar[] = [
  // ---- Live / umum ----
  { key: 'username', label: 'Username', example: 'Rizky_JR', desc: 'Sync chat: user terakhir', group: 'Live' },
  { key: 'message', label: 'Message', example: 'Halo bang!', desc: 'Sync chat: pesan terakhir', group: 'Live' },
  { key: 'handle', label: 'Handle', example: '@adilonapsh', desc: 'Handle sosial', group: 'Live' },
  { key: 'platform', label: 'Platform', example: 'tiktok', desc: 'Platform sosial / chat', group: 'Live' },
  { key: 'label', label: 'Label', example: 'TikTok', desc: 'Label platform', group: 'Live' },
  { key: 'date', label: 'Date', example: new Date().toLocaleDateString('id-ID'), desc: 'Tanggal hari ini', group: 'Live' },
  { key: 'time', label: 'Time', example: new Date().toLocaleTimeString('id-ID'), desc: 'Jam sekarang', group: 'Live' },
  { key: 'clock', label: 'Clock', example: '06:40:06 PM', desc: 'Jam format hh:mm:ss', group: 'Live' },
  { key: 'timer', label: 'Timer', example: '13:20', desc: 'Sync timer: sisa real', group: 'Live' },
  { key: 'polls', label: 'Polls', example: 'Mana turnamen? 42% ML', desc: 'Sync poll: ringkasan real', group: 'Live' },
  { key: 'question', label: 'Question', example: 'Mana turnamen selanjutnya?', desc: 'Pertanyaan poll (alias q)', group: 'Poll' },
  { key: 'q', label: 'Q', example: 'Mana turnamen selanjutnya?', desc: 'Alias question', group: 'Poll' },
  { key: 'opts', label: 'Opts', example: 'ML BB, Valorant', desc: 'Opsi poll comma-separated (alias options)', group: 'Poll' },
  { key: 'options', label: 'Options', example: 'ML BB, Valorant', desc: 'Alias opts', group: 'Poll' },
  { key: 'title', label: 'Title', example: 'Demo Song — Never Gonna Give You Up', desc: 'Sync music: judul lagu aktif', group: 'Live' },
  { key: 'artist', label: 'Artist', example: 'Penonton_A', desc: 'Sync music/SMTC: artis / requester', group: 'Media' },
  { key: 'album', label: 'Album', example: 'Zanmu', desc: 'Sync SMTC: album asli', group: 'Media' },
  { key: 'cover', label: 'Cover', example: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', desc: 'Sync music: thumbnail YT asli / SMTC art', group: 'Media' },
  { key: 'progress', label: 'Progress', example: '1:24', desc: 'Sync music: posisi real', group: 'Media' },
  { key: 'duration', label: 'Duration', example: '6', desc: 'Durasi detik (slide/rotator/lagu)', group: 'Live' },
  { key: 'status', label: 'Status', example: 'playing', desc: 'Status player: playing/paused', group: 'Media' },
  { key: 'viewers', label: 'Viewers', example: '2.1K', desc: 'Total penonton gabungan', group: 'Counter' },
  { key: 'totalViewers', label: 'TotalViewers', example: '2100', desc: 'Total penonton angka', group: 'Counter' },
  { key: 'tiktokViewers', label: 'TiktokViewers', example: '1300', desc: 'Penonton TikTok', group: 'Counter' },
  { key: 'twitchViewers', label: 'TwitchViewers', example: '342', desc: 'Penonton Twitch', group: 'Counter' },
  { key: 'youtubeViewers', label: 'YoutubeViewers', example: '410', desc: 'Penonton YouTube', group: 'Counter' },
  { key: 'kickViewers', label: 'KickViewers', example: '48', desc: 'Penonton Kick', group: 'Counter' },
  { key: 'badge', label: 'Badge', example: 'SPONSOR', desc: 'Badge info slide', group: 'Info' },
  { key: 'desc', label: 'Desc', example: 'Ultra Low Latency', desc: 'Deskripsi slide', group: 'Info' },

  // ---- Style global (semua widgets) ----
  { key: 'theme', label: 'Theme', example: 'standard', desc: 'Nama tema widget', group: 'Style' },
  { key: 'font', label: 'Font', example: 'Outfit', desc: 'Font family', group: 'Style' },
  { key: 'fontFamily', label: 'FontFamily', example: 'Outfit', desc: 'Alias font (clock)', group: 'Style' },
  { key: 'fontSize', label: 'FontSize', example: '14', desc: 'Ukuran font px', group: 'Style' },
  { key: 'accent', label: 'Accent', example: '#8b5cf6', desc: 'Warna accent', group: 'Style' },
  { key: 'bg', label: 'Bg', example: 'transparent', desc: 'Background / transparent', group: 'Style' },
  { key: 'background', label: 'Background', example: 'transparent', desc: 'Alias bg (clock)', group: 'Style' },
  { key: 'bgOpacity', label: 'BgOpacity', example: '100', desc: 'Opacity bg 10-100', group: 'Style' },
  { key: 'textColor', label: 'TextColor', example: '#ffffff', desc: 'Warna teks', group: 'Style' },
  { key: 'pos', label: 'Pos', example: 'center', desc: 'Posisi: tl,t,tr,l,center,r,bl,b,br', group: 'Style' },
  { key: 'anim', label: 'Anim', example: 'elegant', desc: 'Animasi masuk', group: 'Style' },
  { key: 'hideAnim', label: 'HideAnim', example: 'fade', desc: 'Animasi keluar', group: 'Style' },
  { key: 'horizontal', label: 'Horizontal', example: '0', desc: 'Layout horizontal 1/0', group: 'Style' },
  { key: 'horizontalAnim', label: 'HorizontalAnim', example: 'elegant', desc: 'Animasi mode horizontal', group: 'Style' },
  { key: 'inline', label: 'Inline', example: '0', desc: 'Mode inline 1/0', group: 'Style' },
  { key: 'maxWidth', label: 'MaxWidth', example: '500', desc: 'Lebar maks px (media/music)', group: 'Style' },
  { key: 'verticalAlignment', label: 'VerticalAlign', example: 'align-to-center', desc: 'align-to-top/center/bottom', group: 'Style' },
  { key: 'textAlignment', label: 'TextAlign', example: 'left', desc: 'left/center/right', group: 'Style' },
  { key: 'useCustomColors', label: 'UseCustomColors', example: '0', desc: 'Pakai color1/color2 1/0', group: 'Style' },
  { key: 'color1', label: 'Color1', example: '#ffffff', desc: 'Warna primer custom', group: 'Style' },
  { key: 'color2', label: 'Color2', example: '#1d1d1d', desc: 'Warna bg custom', group: 'Style' },
  { key: 'autoHide', label: 'AutoHide', example: '0', desc: 'Auto hide 1/0', group: 'Style' },
  { key: 'displayDuration', label: 'DisplayDuration', example: '5', desc: 'Lama tampil detik', group: 'Style' },
  { key: 'showWhilePaused', label: 'ShowWhilePaused', example: '1', desc: 'Tampil saat paused 1/0', group: 'Media' },
  { key: 'showAnimation', label: 'ShowAnimation', example: 'slide-in-from-bottom', desc: 'Animasi tampil media', group: 'Style' },
  { key: 'hideAnimation', label: 'HideAnimation', example: 'slide-out-bottom', desc: 'Animasi sembunyi media', group: 'Style' },

  // ---- Chat / Event ----
  { key: 'maxMessages', label: 'MaxMessages', example: '6', desc: 'Maks chat tampil', group: 'Chat' },
  { key: 'maxEvents', label: 'MaxEvents', example: '6', desc: 'Maks event tampil', group: 'Event' },
  { key: 'hideAfter', label: 'HideAfter', example: '0', desc: 'Auto-hide detik (0=tetap)', group: 'Chat' },
  { key: 'showAvatar', label: 'ShowAvatar', example: '1', desc: 'Tampilkan avatar 1/0', group: 'Chat' },
  { key: 'showPlatform', label: 'ShowPlatform', example: '1', desc: 'Tampilkan logo platform 1/0', group: 'Chat' },
  { key: 'showTimestamp', label: 'ShowTimestamp', example: '0', desc: 'Tampilkan timestamp 1/0', group: 'Chat' },
  { key: 'showJoin', label: 'ShowJoin', example: '1', desc: 'Filter join 1/0', group: 'Event' },
  { key: 'showGift', label: 'ShowGift', example: '1', desc: 'Filter gift 1/0', group: 'Event' },
  { key: 'showLike', label: 'ShowLike', example: '1', desc: 'Filter like 1/0', group: 'Event' },
  { key: 'charDelayMs', label: 'CharDelayMs', example: '25', desc: 'Delay per-huruf (perchar)', group: 'Chat' },
  { key: 'charDurationS', label: 'CharDurationS', example: '0.35', desc: 'Durasi per-huruf detik', group: 'Chat' },
  { key: 'cuteBubbleBg', label: 'CuteBubbleBg', example: '#1e1d2b', desc: 'BG bubble tema cute', group: 'Chat' },
  { key: 'cuteResubFrom', label: 'CuteResubFrom', example: '#c4a2f8', desc: 'Gradient from cute', group: 'Chat' },
  { key: 'cuteResubTo', label: 'CuteResubTo', example: '#fca4d4', desc: 'Gradient to cute', group: 'Chat' },
  { key: 'cuteBadgeBg', label: 'CuteBadgeBg', example: '#2e2c45', desc: 'BG badge cute', group: 'Chat' },
  { key: 'cuteBadgeText', label: 'CuteBadgeText', example: '#a8a3ce', desc: 'Teks badge cute', group: 'Chat' },
  { key: 'cuteNameMod', label: 'CuteNameMod', example: '#f5a8d0', desc: 'Warna nama mod', group: 'Chat' },
  { key: 'cuteNameUser', label: 'CuteNameUser', example: '#d8cded', desc: 'Warna nama user', group: 'Chat' },
  { key: 'joinSoundEnabled', label: 'JoinSoundEnabled', example: '1', desc: 'Suara join 1/0', group: 'Event' },
  { key: 'joinSoundUrl', label: 'JoinSoundUrl', example: 'https://cdn.../join.mp3', desc: 'URL suara join', group: 'Event' },
  { key: 'joinSoundVolume', label: 'JoinSoundVolume', example: '80', desc: 'Volume join 0-100', group: 'Event' },
  { key: 'giftSoundEnabled', label: 'GiftSoundEnabled', example: '1', desc: 'Suara gift 1/0', group: 'Event' },
  { key: 'giftSoundUrl', label: 'GiftSoundUrl', example: 'https://cdn.../gift.mp3', desc: 'URL suara gift', group: 'Event' },
  { key: 'giftSoundVolume', label: 'GiftSoundVolume', example: '80', desc: 'Volume gift 0-100', group: 'Event' },
  { key: 'likeSoundEnabled', label: 'LikeSoundEnabled', example: '1', desc: 'Suara like 1/0', group: 'Event' },
  { key: 'likeSoundUrl', label: 'LikeSoundUrl', example: 'https://cdn.../like.mp3', desc: 'URL suara like', group: 'Event' },
  { key: 'likeSoundVolume', label: 'LikeSoundVolume', example: '80', desc: 'Volume like 0-100', group: 'Event' },

  // ---- Timer / Task ----
  { key: 'focusMinutes', label: 'FocusMinutes', example: '50', desc: 'Menit fokus timer', group: 'Timer' },
  { key: 'totalSessions', label: 'TotalSessions', example: '3', desc: 'Total sesi timer', group: 'Timer' },
  { key: 'subathonMode', label: 'SubathonMode', example: 'powerup', desc: 'powerup/sleep/locked/paused', group: 'Timer' },
  { key: 'autoCollapse', label: 'AutoCollapse', example: '0', desc: 'Collapse task done 1/0', group: 'Task' },
  { key: 'collapseAfter', label: 'CollapseAfter', example: '3', desc: 'Collapse setelah detik', group: 'Task' },
  { key: 'tasks', label: 'Tasks', example: 'Belajar, Live, Edit', desc: 'JSON/daftar tasks', group: 'Task' },

  // ---- Follow ----
  { key: 'maxFollows', label: 'MaxFollows', example: '6', desc: 'Maks follow tampil', group: 'Follow' },
  { key: 'soundEnabled', label: 'SoundEnabled', example: '1', desc: 'Suara follow 1/0', group: 'Follow' },
  { key: 'soundUrl', label: 'SoundUrl', example: 'https://cdn.../follow.mp3', desc: 'URL suara follow', group: 'Follow' },
  { key: 'soundVolume', label: 'SoundVolume', example: '80', desc: 'Volume follow 0-100', group: 'Follow' },

  // ---- Poll ----
  { key: 'showPercent', label: 'ShowPercent', example: '1', desc: 'Tampilkan % 1/0', group: 'Poll' },
  { key: 'showCount', label: 'ShowCount', example: '1', desc: 'Tampilkan voter 1/0', group: 'Poll' },
  { key: 'showTotal', label: 'ShowTotal', example: '1', desc: 'Tampilkan total 1/0', group: 'Poll' },
  { key: 'showTimer', label: 'ShowTimer', example: '1', desc: 'Tampilkan timer poll 1/0', group: 'Poll' },

  // ---- Clock ----
  { key: 'tz', label: 'Tz', example: 'Asia/Jakarta', desc: 'Timezone IANA (alias timezone)', group: 'Clock' },
  { key: 'timezone', label: 'Timezone', example: 'Asia/Jakarta', desc: 'Alias tz', group: 'Clock' },
  { key: 'gap', label: 'Gap', example: '2', desc: 'Gap antar baris px', group: 'Clock' },
  { key: 'l1', label: 'L1', example: 'hh:mm:ss A', desc: 'Format baris 1', group: 'Clock' },
  { key: 'l2', label: 'L2', example: 'ddd D MMM YY', desc: 'Format baris 2', group: 'Clock' },
  { key: 'l3', label: 'L3', example: '[Live] • dddd', desc: 'Format baris 3', group: 'Clock' },
  { key: 's1', label: 'S1', example: '50', desc: 'Size baris 1', group: 'Clock' },
  { key: 's2', label: 'S2', example: '40', desc: 'Size baris 2', group: 'Clock' },
  { key: 's3', label: 'S3', example: '30', desc: 'Size baris 3', group: 'Clock' },
  { key: 'w1', label: 'W1', example: '800', desc: 'Weight baris 1', group: 'Clock' },
  { key: 'w2', label: 'W2', example: '400', desc: 'Weight baris 2', group: 'Clock' },
  { key: 'w3', label: 'W3', example: '600', desc: 'Weight baris 3', group: 'Clock' },
  { key: 'c1', label: 'C1', example: '#ffffff', desc: 'Color baris 1', group: 'Clock' },
  { key: 'c2', label: 'C2', example: '#ffffff', desc: 'Color baris 2', group: 'Clock' },
  { key: 'c3', label: 'C3', example: '#ffffff', desc: 'Color baris 3', group: 'Clock' },
  { key: 'o1', label: 'O1', example: '1', desc: 'Opacity baris 1', group: 'Clock' },
  { key: 'o2', label: 'O2', example: '0.9', desc: 'Opacity baris 2', group: 'Clock' },
  { key: 'o3', label: 'O3', example: '1', desc: 'Opacity baris 3', group: 'Clock' },
  { key: 't1', label: 'T1', example: 'uppercase', desc: 'Transform baris 1', group: 'Clock' },
  { key: 't2', label: 'T2', example: 'uppercase', desc: 'Transform baris 2', group: 'Clock' },
  { key: 't3', label: 'T3', example: 'none', desc: 'Transform baris 3', group: 'Clock' },
  { key: 'a1', label: 'A1', example: 'center', desc: 'Align baris 1', group: 'Clock' },
  { key: 'a2', label: 'A2', example: 'center', desc: 'Align baris 2', group: 'Clock' },
  { key: 'a3', label: 'A3', example: 'center', desc: 'Align baris 3', group: 'Clock' },
  { key: 'v1', label: 'V1', example: '1', desc: 'Visible baris 1', group: 'Clock' },
  { key: 'v2', label: 'V2', example: '1', desc: 'Visible baris 2', group: 'Clock' },
  { key: 'v3', label: 'V3', example: '0', desc: 'Visible baris 3', group: 'Clock' },

  // ---- Media / Lyrics ----
  { key: 'includedApplications', label: 'IncludedApps', example: 'Spotify.exe,vlc.exe', desc: 'App prioritas SMTC', group: 'Media' },
  { key: 'excludedApplications', label: 'ExcludedApps', example: 'Chrome', desc: 'App dikecualikan', group: 'Media' },
  { key: 'showAlbumArt', label: 'ShowAlbumArt', example: '1', desc: 'Tampilkan cover 1/0', group: 'Media' },
  { key: 'showProgressBar', label: 'ShowProgressBar', example: '1', desc: 'Tampilkan progress 1/0', group: 'Media' },
  { key: 'swapArtistTrack', label: 'SwapArtistTrack', example: '0', desc: 'Tukar artis/judul 1/0', group: 'Media' },
  { key: 'showPrimary', label: 'ShowPrimary', example: '1', desc: 'Tampilkan baris primer 1/0', group: 'Media' },
  { key: 'showSecondary', label: 'ShowSecondary', example: '1', desc: 'Tampilkan baris sekunder 1/0', group: 'Media' },
  { key: 'smtcBridgeAddress', label: 'SmtcAddress', example: '127.0.0.1', desc: 'Alamat SMTC bridge', group: 'Media' },
  { key: 'smtcBridgePort', label: 'SmtcPort', example: '5000', desc: 'Port SMTC bridge', group: 'Media' },
  { key: 'showLyrics', label: 'ShowLyrics', example: '1', desc: 'Tampilkan lirik 1/0', group: 'Lyrics' },
  { key: 'lyricsAlign', label: 'LyricsAlign', example: 'center', desc: 'Align lirik', group: 'Lyrics' },
  { key: 'lyricsFontSize', label: 'LyricsFontSize', example: '20', desc: 'Size lirik', group: 'Lyrics' },
  { key: 'maxLyricsLines', label: 'MaxLyricsLines', example: '3', desc: 'Maks baris lirik', group: 'Lyrics' },
  { key: 'lrclibEnabled', label: 'LrclibEnabled', example: '1', desc: 'Fetch LRCLIB 1/0', group: 'Lyrics' },

  // ---- Music ----
  { key: 'showQueue', label: 'ShowQueue', example: '1', desc: 'Tampilkan queue 1/0', group: 'Music' },
  { key: 'maxQueue', label: 'MaxQueue', example: '5', desc: 'Maks queue 1-10', group: 'Music' },
  { key: 'showProgress', label: 'ShowProgress', example: '1', desc: 'Tampilkan progress 1/0', group: 'Music' },
  { key: 'queuePos', label: 'QueuePos', example: 'bottom', desc: 'Posisi queue', group: 'Music' },
  { key: 'muted', label: 'Muted', example: '0', desc: 'Tab bisu 1/0 (alias mute)', group: 'Music' },
  { key: 'mute', label: 'Mute', example: '0', desc: 'Alias muted', group: 'Music' },
  { key: 'command', label: 'Command', example: '!song', desc: 'Perintah request (settings)', group: 'Music' },
  { key: 'nsfwFilter', label: 'NsfwFilter', example: '1', desc: 'Filter NSFW 1/0', group: 'Music' },
  { key: 'songBlacklist', label: 'SongBlacklist', example: '', desc: 'Blacklist lagu', group: 'Music' },

  // ---- Info slides ----
  { key: 'autoRotate', label: 'AutoRotate', example: '1', desc: 'Auto rotate 1/0', group: 'Info' },
  { key: 'showBadge', label: 'ShowBadge', example: '1', desc: 'Tampilkan badge 1/0', group: 'Info' },
  { key: 'showArrows', label: 'ShowArrows', example: '0', desc: 'Tampilkan panah 1/0', group: 'Info' },
  { key: 'slides', label: 'Slides', example: '3 slides', desc: 'JSON slides', group: 'Info' },

  // ---- Social rotator ----
  { key: 'showIcon', label: 'ShowIcon', example: '1', desc: 'Tampilkan ikon 1/0', group: 'Social' },
  { key: 'showHandle', label: 'ShowHandle', example: '1', desc: 'Tampilkan handle 1/0', group: 'Social' },
  { key: 'socials', label: 'Socials', example: 'tiktok, ig, yt', desc: 'JSON socials', group: 'Social' },

  // ---- Pinned ----
  { key: 'typingMs', label: 'TypingMs', example: '60', desc: 'Kecepatan ketik monkey', group: 'Pinned' },
  { key: 'borderFx', label: 'BorderFx', example: 'none', desc: 'none/glow/spin', group: 'Pinned' },
  { key: 'borderFxColor', label: 'BorderFxColor', example: '#e2b714', desc: 'Warna border fx', group: 'Pinned' },
  { key: 'kbTheme', label: 'KbTheme', example: 'dark', desc: 'Tema keyboard monkey', group: 'Pinned' },
  { key: 'kbGlow', label: 'KbGlow', example: '1', desc: 'Glow keyboard 1/0', group: 'Pinned' },
  { key: 'kbCaps', label: 'KbCaps', example: 'dark', desc: 'Tema caps monkey', group: 'Pinned' },
  { key: 'mkText', label: 'MkText', example: '#ffffff', desc: 'Warna teks diketik', group: 'Pinned' },
  { key: 'mkDim', label: 'MkDim', example: '#ffffff40', desc: 'Warna teks belum diketik', group: 'Pinned' },

  // ---- Counter ----
  { key: 'showLabel', label: 'ShowLabel', example: '1', desc: 'Tampilkan label 1/0', group: 'Counter' },
  { key: 'showBreakdown', label: 'ShowBreakdown', example: '1', desc: 'Tampilkan rincian 1/0', group: 'Counter' },
  { key: 'idleFx', label: 'IdleFx', example: 'none', desc: 'none/gradient', group: 'Counter' },

  // ---- QR ----
  { key: 'value', label: 'Value', example: 'https://saweria.co/user', desc: 'Isi QR (alias text/url)', group: 'QR' },
  { key: 'text', label: 'Text', example: 'https://saweria.co/user', desc: 'Alias value', group: 'QR' },
  { key: 'url', label: 'Url', example: 'https://saweria.co/user', desc: 'Alias value', group: 'QR' },
  { key: 'size', label: 'Size', example: '200', desc: 'Ukuran QR 64-512', group: 'QR' },
  { key: 'fg', label: 'Fg', example: '#000000', desc: 'Warna modul QR', group: 'QR' },
  { key: 'qrBg', label: 'QrBg', example: '#ffffff', desc: 'Background QR', group: 'QR' },
  { key: 'level', label: 'Level', example: 'M', desc: 'Error correction L/M/Q/H', group: 'QR' },
  { key: 'logo', label: 'Logo', example: 'https://.../logo.png', desc: 'Logo tengah QR', group: 'QR' },
  { key: 'showLogo', label: 'ShowLogo', example: '0', desc: 'Tampilkan logo 1/0', group: 'QR' },
];

export function renderTemplate(template: string, data: TemplateData): string {
  if (!template) return '';
  return template.replace(PLACEHOLDER_RE, (_, key: string) => {
    const v = data[key] ?? data[key.toLowerCase()] ?? '';
    if (v === null || v === undefined) return '';
    return String(v);
  });
}

export function extractVariables(template: string): string[] {
  const vars = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(PLACEHOLDER_RE.source, 'g');
  while ((m = re.exec(template)) !== null) vars.add(m[1]);
  return Array.from(vars);
}

// Demo data default untuk SEMUA {{variable}} - dipakai preview editor + display fallback.
export function getTemplateDemoData(): TemplateData {
  const demo: TemplateData = {};
  for (const v of TEMPLATE_VARS) demo[v.key] = v.example;
  // Live clock/date selalu fresh
  demo.date = new Date().toLocaleDateString('id-ID');
  demo.time = new Date().toLocaleTimeString('id-ID');
  demo.clock = new Date().toLocaleTimeString('id-ID');
  return demo;
}

// Gabung demo + URL params (?theme=xxx&accent=...) jadi data template.
// Semua params widgets otomatis jadi {{param}} di template HTML.
export function buildTemplateData(
  params?: URLSearchParams | Record<string, string | string[] | undefined> | null,
): TemplateData {
  const data = getTemplateDemoData();
  if (!params) return data;
  const entries: Array<[string, string]> =
    params instanceof URLSearchParams
      ? Array.from(params.entries())
      : Object.entries(params).flatMap(([k, v]) =>
          Array.isArray(v) ? v.map((x): [string, string] => [k, x]) : v !== undefined ? [[k, v] as [string, string]] : [],
        );
  for (const [k, v] of entries) {
    if (k === 'layers' || k === 'key' || k === 'obs' || k === 'simulate') continue;
    if (v !== undefined && v !== '') data[k] = v;
  }
  return data;
}

// Sanitize html - allow basic tags, strip script
export function sanitizeHtml(html: string): string {
  // very light: remove <script>, on* attributes
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\s+on\w+\s*=\s*(["']).*?\1/gi, '')
    .replace(/javascript:/gi, '');
}
