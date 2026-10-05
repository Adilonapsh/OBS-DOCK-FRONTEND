'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../../_shared/utils/socket';
import { getStringParam, getIntParam, getBoolParam } from '../../_shared/utils/url';
import { loadGoogleFont } from '../../_shared/utils/font';
import { ANIM_MAP, ANIM_OUT_MAP, KEYFRAMES_CSS, isElegantAnim } from '../../_shared/constants/animations';
import { getPositionStyle } from '../../_shared/constants/positions';
import { AutoScale } from '../../_shared/components/AutoScale';
import { chatThemeComponents } from '../themes/registry';
import StandardTheme from '../themes/Standard';
import { getBttvGlobalEmotes, type BttvMap } from '../bttv';
import type { ChatItem } from '../themes/types';
import {
  parseIgnoreList,
  passPlatformFilter,
  passCommandFilter,
  passSongCommandFilter,
  passIgnoreFilter,
} from '../themes/chatFilters';
import { useDummyChatSimulation } from '../themes/dummySim';

function getFloatParam(params: URLSearchParams, key: string, fallback: number): number {
  const v = params.get(key);
  if (v === null || v === '') return fallback;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

// Alias nutty.gg: showTimestamps/background/opacity/inlineChat/scrollDirection angka.
function getBoolAlias(params: URLSearchParams, keys: string[], fallback: boolean): boolean {
  for (const k of keys) {
    const v = params.get(k);
    if (v !== null) return v === 'true' || v === '1';
  }
  return fallback;
}

function ChatInner() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const privateKey = getStringParam(params, 'key', getStringParam(params, 'privateKey', ''));
  const obsMode = getBoolParam(params, 'obs', false) || getBoolParam(params, 'transparent', false);
  const simulate = getBoolParam(params, 'simulate', false) || getBoolParam(params, 'preview', false);

  const theme = getStringParam(params, 'theme', 'standard');
  const font = getStringParam(params, 'font', 'Outfit');
  const accent = getStringParam(params, 'accent', '#8b5cf6');
  // alias nutty: background/opacity
  const bgRaw = params.get('bg') ?? params.get('background') ?? 'transparent';
  const bg = bgRaw === '' ? 'transparent' : bgRaw;
  const maxMessages = Math.max(1, Math.min(30, getIntParam(params, 'maxMessages', 6)));
  const hideAfter = getIntParam(params, 'hideAfter', 0);
  const showAvatar = getBoolParam(params, 'showAvatar', true);
  const showPlatform = getBoolParam(params, 'showPlatform', true);
  // alias nutty: showTimestamps (plural)
  const showTimestamp = getBoolAlias(params, ['showTimestamp', 'showTimestamps'], false);
  const showBadges = getBoolParam(params, 'showBadges', true);
  const bttv = getBoolParam(params, 'bttv', true);
  const anim = getStringParam(params, 'anim', 'elegant');
  const hideAnim = getStringParam(params, 'hideAnim', 'fade');
  const horizontalAnim = getStringParam(params, 'horizontalAnim', 'elegant');
  const fontSize = getIntParam(params, 'fontSize', 14);
  const bgOpacityRaw = params.get('bgOpacity') ?? params.get('opacity') ?? '100';
  const bgOpacity = Math.max(0, Math.min(100, Math.round(parseFloat(bgOpacityRaw) <= 1 && bgOpacityRaw.includes('.') ? parseFloat(bgOpacityRaw) * 100 : parseFloat(bgOpacityRaw) || 100)));
  const textColor = getStringParam(params, 'textColor', '');
  const horizontal = getBoolParam(params, 'horizontal', false);
  // alias nutty: inlineChat
  const inline = getBoolAlias(params, ['inline', 'inlineChat'], false);
  const pos = getStringParam(params, 'pos', 'center');
  const posStyle = getPositionStyle(pos);
  // Appearance tambahan (nutty)
  const showUsername = getBoolParam(params, 'showUsername', true);
  const showMessage = getBoolParam(params, 'showMessage', true);
  const showPronouns = getBoolParam(params, 'showPronouns', false);
  const timeFormat = getStringParam(params, 'timeFormat', '24-hour');
  const lineSpacing = Math.max(0.8, Math.min(3, getFloatParam(params, 'lineSpacing', 1.4)));
  const useChatBubbles = getBoolParam(params, 'useChatBubbles', false);
  const bubbleColor = getStringParam(params, 'bubbleColor', '#1d1d1d');
  const bubbleOpacity = Math.max(0, Math.min(1, getFloatParam(params, 'bubbleOpacity', 0.9)));
  // General
  const excludeCommands = getBoolParam(params, 'excludeCommands', false);
  // Custom command music (disamakan dengan setting music widget) — default !song.
  // !skip selalu disembunyikan juga.
  const songCommand = getStringParam(params, 'songCommand', getStringParam(params, 'command', '!song')) || '!song';
  const ignoreChatters = getStringParam(params, 'ignoreChatters', '');
  const ignoreList = parseIgnoreList(ignoreChatters);
  const scrollRaw = getStringParam(params, 'scrollDirection', '1');
  const reversed = scrollRaw === '2' || scrollRaw.toLowerCase() === 'reversed';
  // nutty: groupConsecutive diabaikan saat reversed
  const groupConsecutiveMessages = getBoolParam(params, 'groupConsecutiveMessages', false) && !reversed;
  const highlightMentions = getBoolParam(params, 'highlightMentions', false);
  const imageEmbedPermissionLevel = getStringParam(params, 'imageEmbedPermissionLevel', '69420');
  const showYouTubeLinkPreviews = getBoolParam(params, 'showYouTubeLinkPreviews', false);
  const plainTextBorder = getBoolParam(params, 'plainTextBorder', false);
  const plainBorderColor = getStringParam(params, 'plainBorderColor', '#000000');
  const plainBorderWidth = Math.max(0, Math.min(3, getFloatParam(params, 'plainBorderWidth', 1)));
  const brutalistBg = getStringParam(params, 'brutalistBg', '#FFFFFF');
  const brutalistTextColor = getStringParam(params, 'brutalistTextColor', '#000000');
  const brutalistBadgeBg = getStringParam(params, 'brutalistBadgeBg', '#FFFFFF');
  const brutalistBorderColor = getStringParam(params, 'brutalistBorderColor', '#000000');
  const brutalistShadow = Math.max(0, Math.min(14, getIntParam(params, 'brutalistShadow', 6)));
  const brutalistHalftone = getBoolParam(params, 'brutalistHalftone', true);
  const brutalistTail = getBoolParam(params, 'brutalistTail', true);
  const brutalistItalic = getBoolParam(params, 'brutalistItalic', true);
  const brutalistUppercase = getBoolParam(params, 'brutalistUppercase', true);
  // Filter platform (chat tetap dari tiktok-chat; filter hanya menyembunyikan per platform)
  const showTwitchMessages = getBoolParam(params, 'showTwitchMessages', true);
  const showYouTubeMessages = getBoolParam(params, 'showYouTubeMessages', true);
  const showKickMessages = getBoolParam(params, 'showKickMessages', true);
  const showTikTokMessages = getBoolParam(params, 'showTikTokMessages', true);
  const enableTikTokSupport = getBoolParam(params, 'enableTikTokSupport', true);
  const cuteBubbleBg = getStringParam(params, 'cuteBubbleBg', '#1e1d2b');
  const cuteResubFrom = getStringParam(params, 'cuteResubFrom', '#c4a2f8');
  const cuteResubTo = getStringParam(params, 'cuteResubTo', '#fca4d4');
  const cuteBadgeBg = getStringParam(params, 'cuteBadgeBg', '#2e2c45');
  const cuteBadgeText = getStringParam(params, 'cuteBadgeText', '#a8a3ce');
  const cuteNameMod = getStringParam(params, 'cuteNameMod', '#f5a8d0');
  const cuteNameUser = getStringParam(params, 'cuteNameUser', '#d8cded');
  const charDelayMs = Math.max(0, Math.min(500, getIntParam(params, 'charDelayMs', 25)));
  const charDurationS = Math.max(0.05, Math.min(3, parseFloat(params.get('charDurationS') || '') || 0.35));

  const [chats, setChats] = useState<ChatItem[]>([]);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const [connected, setConnected] = useState(simulate);
  const [bttvMap, setBttvMap] = useState<BttvMap>({});
  const hideAnimName = ANIM_OUT_MAP[hideAnim] || 'fadeOut';
  const hideDur = isElegantAnim(hideAnimName) ? 620 : 400;

  // Mode simulate: dummy mengalir seperti real (masuk satu per satu + keluar pakai animasi)
  const simFilter = (c: ChatItem) =>
    passPlatformFilter(c, { showTwitchMessages, showYouTubeMessages, showKickMessages, showTikTokMessages, enableTikTokSupport }) &&
    passCommandFilter(c, excludeCommands) &&
    passSongCommandFilter(c, songCommand) &&
    passIgnoreFilter(c, ignoreList);
  const sim = useDummyChatSimulation({
    enabled: simulate,
    maxMessages,
    holdMs: hideAfter > 0 ? hideAfter * 1000 : 8000,
    hideDur,
    filter: simFilter,
  });
  const liveChats = simulate ? sim.chats : chats;
  const liveExiting = simulate ? sim.exitingIds : exitingIds;

  useEffect(() => loadGoogleFont(font, '400;700;900', 'chat-font'), [font]);

  // Emote global BetterTTV (sekali per sesi, cache modul). Gagal = chat tetap teks polos.
  useEffect(() => {
    if (!bttv) return;
    let alive = true;
    getBttvGlobalEmotes().then((m) => { if (alive) setBttvMap(m); });
    return () => { alive = false; };
  }, [bttv]);

  useEffect(() => {
    if (simulate) return; // mode simulate — demo data lokal, tidak perlu socket
    const socket: Socket = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    const room = privateKey || 'global';
    socket.on('connect', () => { setConnected(true); socket.emit('join-room', room); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('tiktok-chat', (data: Record<string, unknown>) => {
      const comment = String((data as { comment?: string; message?: string }).comment || (data as { message?: string }).message || '');
      if (!comment) return;
      const d = data as { nickname?: string; uniqueId?: string; profilePictureUrl?: string; platform?: string; fromStreamerBot?: boolean; badges?: unknown; color?: unknown; emotes?: unknown };
      const nick = d.nickname || d.uniqueId || 'User';
      const pf = d.platform || (d.fromStreamerBot ? 'twitch' : 'tiktok');
      const item: ChatItem = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        nickname: d.nickname || d.uniqueId || 'User',
        comment,
        profilePictureUrl: d.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.nickname || 'U')}&background=222&color=fff`,
        platform: d.platform || (d.fromStreamerBot ? 'twitch' : 'tiktok'),
        timestamp: Date.now(),
        ...(Array.isArray(d.badges) ? { badges: d.badges.map((b) => String(b)) } : {}),
        ...(typeof d.color === 'string' && d.color ? { color: d.color } : {}),
        ...(Array.isArray(d.emotes)
          ? {
              emotes: (d.emotes as unknown[])
                .map((e) => ({
                  name: String((e as { name?: unknown })?.name || ''),
                  imageUrl: String((e as { imageUrl?: unknown })?.imageUrl || ''),
                }))
                .filter((e) => e.name && e.imageUrl),
            }
          : {}),
      };
      // Filter ala nutty (TikTok chat sumber tetap sama, hanya disaring di sini)
      if (!passPlatformFilter(item, { showTwitchMessages, showYouTubeMessages, showKickMessages, showTikTokMessages, enableTikTokSupport })) return;
      if (!passCommandFilter(item, excludeCommands)) return;
      // Command music (!song/!skip/custom) jangan tampil di widget chat
      if (!passSongCommandFilter(item, songCommand)) return;
      if (!passIgnoreFilter(item, ignoreList)) return;
      // Dedup berbasis state (tahan 2 socket / StrictMode): pesan sama persis
      // (nick+comment+platform) yang sudah ada dalam 3 detik terakhir → skip.
      let dup = false;
      setChats((prev) => {
        const nowTs = Date.now();
        for (let i = prev.length - 1; i >= 0 && i >= prev.length - 5; i--) {
          const p = prev[i];
          if (
            p.nickname === nick &&
            p.comment === comment &&
            p.platform === pf &&
            nowTs - (p.timestamp || nowTs) < 3000
          ) { dup = true; return prev; }
        }
        return [...prev, item].slice(-maxMessages);
      });
      if (dup) return;
      if (hideAfter > 0) {
        setTimeout(() => {
          setExitingIds((prev) => new Set(prev).add(item.id));
          setTimeout(() => {
            setChats((prev) => prev.filter((c) => c.id !== item.id));
            setExitingIds((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
          }, hideDur);
        }, hideAfter * 1000);
      }
    });
    return () => { socket.disconnect(); };
  }, [privateKey, maxMessages, hideAfter, hideDur, simulate, showTwitchMessages, showYouTubeMessages, showKickMessages, showTikTokMessages, enableTikTokSupport, excludeCommands, songCommand, ignoreChatters]);

  // Terapkan filter yang sama untuk mode real agar konsisten dengan simulasi
  const filteredChats = liveChats.filter((c) => {
    if (!passPlatformFilter(c, { showTwitchMessages, showYouTubeMessages, showKickMessages, showTikTokMessages, enableTikTokSupport })) return false;
    if (!passCommandFilter(c, excludeCommands)) return false;
    if (!passSongCommandFilter(c, songCommand)) return false;
    if (!passIgnoreFilter(c, ignoreList)) return false;
    return true;
  }).slice(-maxMessages);
  const visibleChats = reversed ? [...filteredChats].reverse() : filteredChats;

  const themeProps = {
    chats: visibleChats,
    font,
    accent,
    bg,
    maxMessages,
    showAvatar,
    showPlatform,
    showTimestamp,
    showBadges,
    bttv,
    bttvMap,
    anim: ANIM_MAP[anim] || 'elegantIn',
    horizontalAnim: ANIM_MAP[horizontalAnim] || 'elegantIn',
    hideAnim: ANIM_OUT_MAP[hideAnim] || 'fadeOut',
    hideAfter,
    fontSize,
    bgOpacity,
    textColor,
    horizontal,
    inline,
    cuteBubbleBg,
    cuteResubFrom,
    cuteResubTo,
    cuteBadgeBg,
    cuteBadgeText,
    cuteNameMod,
    cuteNameUser,
    charDelayMs,
    charDurationS,
    exitingIds: liveExiting,
    showUsername,
    showMessage,
    showPronouns,
    timeFormat,
    lineSpacing,
    useChatBubbles,
    bubbleColor,
    bubbleOpacity,
    groupConsecutiveMessages,
    highlightMentions,
    imageEmbedPermissionLevel,
    showYouTubeLinkPreviews,
    plainTextBorder,
    plainBorderColor,
    plainBorderWidth,
    brutalistBg,
    brutalistTextColor,
    brutalistBadgeBg,
    brutalistBorderColor,
    brutalistShadow,
    brutalistHalftone,
    brutalistTail,
    brutalistItalic,
    brutalistUppercase,
  };

  const renderTheme = () => {
    // auto-register: theme baru di themes/*.tsx langsung kepakai tanpa tambah case
    const Theme = chatThemeComponents[theme] ?? StandardTheme;
    return <Theme {...themeProps} />;
  };

  return (
    <>
      {obsMode && <style dangerouslySetInnerHTML={{ __html: `html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100vw!important;height:100vh!important;background:transparent!important} *{box-sizing:border-box}` }} />}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g,'+')}:wght@400;700;900&display=swap'); ${KEYFRAMES_CSS} html,body{ background: ${obsMode ? 'transparent !important' : '#0a0a0a'}; }`}</style>
      <div
        id="chat-display-root"
        className={`${obsMode ? `fixed inset-0 w-screen h-screen bg-transparent overflow-hidden flex p-2` : `w-full min-h-screen bg-[#0a0a0a] flex p-4`}`}
        style={{ ...posStyle, background: obsMode ? 'transparent' : '#0a0a0a', fontFamily: `'${font}', sans-serif` } as any}
      >
        {!obsMode && !connected && liveChats.length === 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-[10px] font-black uppercase tracking-widest">Menghubungkan… privateKey={privateKey ? `${privateKey.slice(0, 6)}…` : 'global'} • server http://localhost:3000</div>
        )}
        {!obsMode && <div className="absolute top-4 right-4 px-2 py-1 bg-black/40 backdrop-blur border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400">CHAT • {theme} • {simulate ? 'simulate' : connected ? 'connected' : 'offline'} • {filteredChats.length}/{maxMessages}</div>}
        <AutoScale defaultBase={horizontal ? 960 : 420} baseWidth={horizontal ? 960 : theme === 'perchar' ? 480 : theme === 'boxed' ? 440 : 420}>
          {renderTheme()}
        </AutoScale>
      </div>
    </>
  );
}

export default function ChatDisplayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black grid place-items-center text-white/60 text-sm">Loading chat…</div>}>
      <ChatInner />
    </Suspense>
  );
}
