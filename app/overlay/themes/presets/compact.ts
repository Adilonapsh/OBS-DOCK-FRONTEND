import { defineTheme } from "../types";
import { defaultTheme } from "../default";

export default defineTheme({
  name: "Compact",
  icon: "🗜️",
  category: "minimal",
  description: "Small radius, low blur, compact for dense layouts",
  theme: {
    ...defaultTheme,
    fontFamily: "Inter",
    chatBg: "rgba(16,16,16,0.92)",
    chatBorder: "rgba(255,255,255,0.06)",
    pinnedBg: "rgba(16,16,16,0.92)",
    pinnedBorder: "rgba(255,255,255,0.14)",
    giftBg: "rgba(20,12,16,0.93)",
    giftBorder: "rgba(254,44,85,0.22)",
    chatRadius: 10,
    chatOpacity: 92,
    chatBlur: 4,
    fontScale: 0.88,
    shadow: false,
    showPlatform: false,
    showTimestamp: false,
    chatPadding: 8,
    chatGap: 6,
    overlayPadding: 10,
    overlayGap: 8,
    inlineChat: true,
  },
});
