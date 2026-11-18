import { defineTheme } from "../types";
import { defaultTheme } from "../default";

export default defineTheme({
  name: "Pokemon",
  icon: "⚡",
  category: "anime",
  description: "Pikachu yellow + Pokeball red/blue - playful Fredoka",
  theme: {
    ...defaultTheme,
    fontFamily: "Fredoka",
    accent: "#EE1515",
    accent2: "#FFCB05",
    chatBg: "rgba(255,255,255,0.96)",
    chatText: "#1a1a1a",
    chatBorder: "#3B4CCA",
    chatRadius: 18,
    chatOpacity: 96,
    chatBlur: 6,
    pinnedBg: "#FFCB05",
    pinnedBorder: "#3B4CCA",
    pinnedText: "#1a1a1a",
    giftBg: "#3B4CCA",
    giftBorder: "#FFCB05",
    giftText: "#ffffff",
    shadow: true,
    chatPadding: 14,
    chatGap: 10,
    overlayPadding: 18,
    overlayGap: 14,
  },
  css: `.overlay-chat-bubble{border:2px solid #3B4CCA !important; box-shadow: 0 4px 12px rgba(59,76,202,0.15) !important}\n.overlay-chat-bubble:nth-child(odd){border-color:#EE1515 !important}\n.user-tag,.overlay-chat-nickname{background:#EE1515 !important; color:#FFCB05 !important; border: 1.5px solid #3B4CCA !important}\n.overlay-pinned{border: 3px solid #3B4CCA !important; background: #FFCB05 !important}\n.overlay-gift{border: 3px solid #FFCB05 !important; background: #3B4CCA !important}`,
});
