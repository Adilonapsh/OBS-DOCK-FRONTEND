import { defineTheme } from "../types";
import { defaultTheme } from "../default";

export default defineTheme({
  name: "Neon Gaming",
  icon: "🎮",
  category: "gaming",
  description: "Purple/cyan neon for gaming streams",
  theme: {
    ...defaultTheme,
    fontFamily: "Space Grotesk",
    accent: "#a855f7",
    accent2: "#22d3ee",
    chatBg: "rgba(15,10,30,0.92)",
    chatBorder: "rgba(168,85,247,0.25)",
    pinnedBorder: "rgba(34,211,238,0.6)",
    giftBg: "rgba(30,10,40,0.96)",
    giftBorder: "rgba(168,85,247,0.4)",
  },
});
