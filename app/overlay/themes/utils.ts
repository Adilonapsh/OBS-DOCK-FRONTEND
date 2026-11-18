import { defaultTheme } from "./default";
import type { OverlayTheme } from "./types";

export function themeToQuery(theme: OverlayTheme): string {
  const p = new URLSearchParams();
  p.set("accent", theme.accent);
  p.set("accent2", theme.accent2);
  p.set("chatBg", theme.chatBg);
  p.set("chatText", theme.chatText);
  p.set("chatBorder", theme.chatBorder);
  p.set("chatRadius", String(theme.chatRadius));
  p.set("chatOpacity", String(theme.chatOpacity));
  p.set("chatBlur", String(theme.chatBlur));
  p.set("pinnedBg", theme.pinnedBg);
  p.set("pinnedBorder", theme.pinnedBorder);
  p.set("pinnedText", theme.pinnedText);
  p.set("giftBg", theme.giftBg);
  p.set("giftBorder", theme.giftBorder);
  p.set("giftText", theme.giftText);
  p.set("fontScale", String(theme.fontScale));
  p.set("font", theme.fontFamily || defaultTheme.fontFamily);
  p.set("showAvatar", theme.showAvatar ? "1" : "0");
  p.set("showPlatform", theme.showPlatform ? "1" : "0");
  p.set("showTimestamp", theme.showTimestamp ? "1" : "0");
  p.set("shadow", theme.shadow ? "1" : "0");
  p.set("inlineChat", theme.inlineChat ? "1" : "0");
  p.set("chatPad", String(theme.chatPadding));
  p.set("chatGap", String(theme.chatGap));
  p.set("chatMargin", String(theme.chatMargin));
  p.set("overPad", String(theme.overlayPadding));
  p.set("overGap", String(theme.overlayGap));
  return p.toString();
}

export function queryToTheme(sp: URLSearchParams): OverlayTheme {
  const get = (k: string, fallback: string) => sp.get(k) || fallback;
  return {
    accent: get("accent", defaultTheme.accent),
    accent2: get("accent2", defaultTheme.accent2),
    chatBg: get("chatBg", defaultTheme.chatBg),
    chatText: get("chatText", defaultTheme.chatText),
    chatBorder: get("chatBorder", defaultTheme.chatBorder),
    chatRadius: parseInt(get("chatRadius", String(defaultTheme.chatRadius)), 10) || defaultTheme.chatRadius,
    chatOpacity: parseInt(get("chatOpacity", String(defaultTheme.chatOpacity)), 10) || defaultTheme.chatOpacity,
    chatBlur: parseInt(get("chatBlur", String(defaultTheme.chatBlur)), 10) || defaultTheme.chatBlur,
    pinnedBg: get("pinnedBg", defaultTheme.pinnedBg),
    pinnedBorder: get("pinnedBorder", defaultTheme.pinnedBorder),
    pinnedText: get("pinnedText", defaultTheme.pinnedText),
    giftBg: get("giftBg", defaultTheme.giftBg),
    giftBorder: get("giftBorder", defaultTheme.giftBorder),
    giftText: get("giftText", defaultTheme.giftText),
    fontScale: parseFloat(get("fontScale", String(defaultTheme.fontScale))) || defaultTheme.fontScale,
    fontFamily: get("font", get("fontFamily", defaultTheme.fontFamily)),
    showAvatar: get("showAvatar", "1") !== "0",
    showPlatform: get("showPlatform", "1") !== "0",
    showTimestamp: get("showTimestamp", "1") !== "0",
    shadow: get("shadow", "1") !== "0",
    inlineChat: get("inlineChat", "0") === "1",
    chatPadding: parseInt(get("chatPad", String(defaultTheme.chatPadding)), 10) || defaultTheme.chatPadding,
    chatGap: parseInt(get("chatGap", String(defaultTheme.chatGap)), 10) || defaultTheme.chatGap,
    chatMargin: parseInt(get("chatMargin", String(defaultTheme.chatMargin)), 10) || defaultTheme.chatMargin,
    overlayPadding: parseInt(get("overPad", String(defaultTheme.overlayPadding)), 10) || defaultTheme.overlayPadding,
    overlayGap: parseInt(get("overGap", String(defaultTheme.overlayGap)), 10) || defaultTheme.overlayGap,
  };
}

export function themeStorageKey(overlayId: string) {
  return `overlay-theme-${overlayId}`;
}

export function cssStorageKey(overlayId: string) {
  return `overlay-css-${overlayId}`;
}

export function encodeCss(css: string): string {
  try {
    return btoa(unescape(encodeURIComponent(css)));
  } catch {
    return btoa(css);
  }
}

export function decodeCss(encoded: string): string {
  try {
    return decodeURIComponent(escape(atob(encoded)));
  } catch {
    try {
      return atob(encoded);
    } catch {
      return encoded;
    }
  }
}
