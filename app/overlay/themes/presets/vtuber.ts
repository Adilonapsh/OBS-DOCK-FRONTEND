import { defineTheme } from "../types";
import { defaultTheme } from "../default";

export default defineTheme({
  name: "Vtuber",
  icon: "🎀",
  category: "anime",
  description: "Hololive pastel pink/cyan - soft neon",
  theme: {
    ...defaultTheme,
    fontFamily: "Outfit",
    accent: "#FF6B9D",
    accent2: "#00E5FF",
    chatBg: "rgba(255,255,255,0.92)",
    chatText: "#2d1b2e",
    chatBorder: "rgba(255,107,157,0.25)",
    chatRadius: 20,
    chatOpacity: 94,
    chatBlur: 10,
    pinnedBg: "rgba(255,107,157,0.14)",
    pinnedBorder: "#FF6B9D",
    pinnedText: "#2d1b2e",
    giftBg: "rgba(0,229,255,0.12)",
    giftBorder: "rgba(0,229,255,0.4)",
    giftText: "#2d1b2e",
    shadow: true,
    chatPadding: 14,
    chatGap: 10,
    overlayPadding: 16,
    overlayGap: 12,
  },
  css: `.overlay-chat-bubble{backdrop-filter: blur(12px) !important; border: 1.5px solid rgba(255,107,157,0.3) !important}\n.overlay-chat-bubble::before{content:""; position:absolute; left:-1px; top:8px; bottom:8px; width:3px; background: linear-gradient(to bottom, #FF6B9D, #00E5FF); border-radius: 0 4px 4px 0}\n.user-tag{background: linear-gradient(135deg, #FF6B9D, #C084FC) !important}\n.overlay-gift{background: linear-gradient(135deg, rgba(255,107,157,0.15), rgba(0,229,255,0.15)) !important}`,
});
