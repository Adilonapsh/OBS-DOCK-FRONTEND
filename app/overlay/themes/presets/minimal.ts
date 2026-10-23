import { defineTheme } from "../types";
import { defaultTheme } from "../default";

export default defineTheme({
  name: "Minimal Mono",
  icon: "◻️",
  category: "minimal",
  description: "Monochrome minimal, no blur/shadow",
  theme: {
    ...defaultTheme,
    fontFamily: "JetBrains Mono",
    accent: "#ffffff",
    accent2: "#9ca3af",
    chatBg: "rgba(0,0,0,0.75)",
    chatBorder: "rgba(255,255,255,0.06)",
    pinnedBg: "rgba(0,0,0,0.8)",
    pinnedBorder: "rgba(255,255,255,0.15)",
    giftBg: "rgba(0,0,0,0.9)",
    giftBorder: "rgba(255,255,255,0.12)",
    chatRadius: 12,
    chatBlur: 0,
    shadow: false,
    chatPadding: 10,
    chatGap: 6,
    overlayPadding: 12,
    overlayGap: 8,
  },
});
