import { defineTheme } from "../types";
import { defaultTheme } from "../default";

export default defineTheme({
  name: "Cute Pastel",
  icon: "🌸",
  category: "cute",
  description: "Soft pink peach - Comfortaa rounded",
  theme: {
    ...defaultTheme,
    fontFamily: "Comfortaa",
    accent: "#FF8FAB",
    accent2: "#FFC8A2",
    chatBg: "rgba(255,240,243,0.96)",
    chatText: "#4a2c2a",
    chatBorder: "rgba(255,143,171,0.35)",
    chatRadius: 20,
    chatOpacity: 96,
    chatBlur: 8,
    pinnedBg: "rgba(255,200,162,0.22)",
    pinnedBorder: "#FF8FAB",
    pinnedText: "#4a2c2a",
    giftBg: "rgba(255,143,171,0.14)",
    giftBorder: "rgba(255,143,171,0.4)",
    giftText: "#4a2c2a",
    shadow: false,
    chatPadding: 14,
    chatGap: 8,
    overlayPadding: 14,
    overlayGap: 10,
  },
  css: `.overlay-chat-bubble{border: 2px solid rgba(255,143,171,0.4) !important; box-shadow: 0 2px 12px rgba(255,143,171,0.15) !important}\n.overlay-chat-avatar{border: 2px solid #FFC8A2 !important}\n.user-tag{background: #FF8FAB !important; border-radius: 12px !important; padding: 3px 12px !important}\n.overlay-pinned{border: 2px dashed #FF8FAB !important; background: rgba(255,240,243,0.9) !important}`,
});
