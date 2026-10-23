import { defineTheme } from "../types";
import { defaultTheme } from "../default";

export default defineTheme({
  name: "Light Clean",
  icon: "☀️",
  category: "core",
  description: "Bright clean theme for light backgrounds",
  theme: {
    ...defaultTheme,
    fontFamily: "Plus Jakarta Sans",
    chatBg: "rgba(255,255,255,0.95)",
    chatText: "#111111",
    chatBorder: "rgba(0,0,0,0.08)",
    pinnedBg: "rgba(255,255,255,0.92)",
    pinnedBorder: "rgba(6,182,212,0.4)",
    pinnedText: "#111111",
    giftBg: "rgba(255,240,243,0.98)",
    giftBorder: "rgba(254,44,85,0.25)",
    giftText: "#111111",
  },
});
