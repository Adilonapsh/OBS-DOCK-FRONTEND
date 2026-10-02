'use client';

import { useState, useEffect, useMemo } from 'react';
import StandardTheme from '../themes/Standard';
import { chatThemeComponents } from '../themes/registry';
import { getBttvGlobalEmotes, type BttvMap } from '../bttv';
import { ANIM_MAP, ANIM_OUT_MAP, isElegantAnim } from '../../_shared/constants/animations';
import { parseIgnoreList, passPlatformFilter, passCommandFilter, passIgnoreFilter } from '../themes/chatFilters';
import { useDummyChatSimulation } from '../themes/dummySim';
import type { ChatItem } from '../themes/types';
import type { ChatSettings } from '../config';

export function ChatPreview({ state }: { state: ChatSettings }) {
  const [bttvMap, setBttvMap] = useState<BttvMap>({});
  useEffect(() => {
    if (!state.bttv) return;
    let alive = true;
    getBttvGlobalEmotes().then((m) => { if (alive) setBttvMap(m); });
    return () => { alive = false; };
  }, [state.bttv]);

  const s = state as unknown as Record<string, unknown>;
  const ignoreList = useMemo(() => parseIgnoreList(String(s.ignoreChatters || '')), [state.ignoreChatters]);
  const hideName = ANIM_OUT_MAP[state.hideAnim] || 'fadeOut';
  const hideDur = isElegantAnim(hideName) ? 620 : 400;
  const pf = {
    showTwitchMessages: (s.showTwitchMessages as boolean) ?? true,
    showYouTubeMessages: (s.showYouTubeMessages as boolean) ?? true,
    showKickMessages: (s.showKickMessages as boolean) ?? true,
    showTikTokMessages: (s.showTikTokMessages as boolean) ?? true,
    enableTikTokSupport: (s.enableTikTokSupport as boolean) ?? true,
  };
  const excludeCmds = Boolean(s.excludeCommands);
  const reversed = String(s.scrollDirection || '1') === '2';

  // Simulasi live dari dummy: masuk satu per satu + keluar pakai animasi, seperti real
  const sim = useDummyChatSimulation({
    enabled: true,
    maxMessages: state.maxMessages,
    holdMs: state.hideAfter > 0 ? state.hideAfter * 1000 : 8000,
    hideDur,
    filter: (c: ChatItem) =>
      passPlatformFilter(c, pf) && passCommandFilter(c, excludeCmds) && passIgnoreFilter(c, ignoreList),
  });
  const chats = reversed ? [...sim.chats].reverse() : sim.chats;

  const props = {
    chats,
    font: state.font,
    accent: state.accent,
    bg: state.bg,
    maxMessages: state.maxMessages,
    showAvatar: state.showAvatar,
    showPlatform: state.showPlatform,
    showTimestamp: state.showTimestamp,
    showBadges: state.showBadges,
    bttv: state.bttv,
    bttvMap,
    anim: ANIM_MAP[state.anim] || 'elegantIn',
    horizontalAnim: ANIM_MAP[state.horizontalAnim] || 'elegantIn',
    hideAnim: hideName,
    hideAfter: state.hideAfter,
    fontSize: state.fontSize,
    bgOpacity: state.bgOpacity,
    textColor: state.textColor,
    horizontal: state.horizontal,
    inline: state.inline,
    cuteBubbleBg: state.cuteBubbleBg,
    cuteResubFrom: state.cuteResubFrom,
    cuteResubTo: state.cuteResubTo,
    cuteBadgeBg: state.cuteBadgeBg,
    cuteBadgeText: state.cuteBadgeText,
    cuteNameMod: state.cuteNameMod,
    cuteNameUser: state.cuteNameUser,
    charDelayMs: state.charDelayMs,
    charDurationS: state.charDurationS,
    exitingIds: sim.exitingIds,
    showUsername: state.showUsername,
    showMessage: state.showMessage,
    showPronouns: state.showPronouns,
    timeFormat: state.timeFormat,
    lineSpacing: state.lineSpacing,
    useChatBubbles: state.useChatBubbles,
    bubbleColor: state.bubbleColor,
    bubbleOpacity: state.bubbleOpacity,
    groupConsecutiveMessages: state.scrollDirection === '2' ? false : state.groupConsecutiveMessages,
    highlightMentions: state.highlightMentions,
    imageEmbedPermissionLevel: state.imageEmbedPermissionLevel,
    showYouTubeLinkPreviews: state.showYouTubeLinkPreviews,
  } as const;

  // auto-register: theme baru di themes/*.tsx langsung kepakai di preview
  const Theme = chatThemeComponents[state.theme] ?? StandardTheme;
  return <Theme {...props} />;
}
