import { defineTheme } from "../types";
import { defaultTheme } from "../default";

export default defineTheme({
  name: "TikTok Pink",
  icon: "🎵",
  category: "anime",
  description: "TikTok brand pink/cyan",
  theme: {
    ...defaultTheme,
    fontFamily: "Poppins",
    accent: "#FE2C55",
    accent2: "#25F4EE",
    chatBg: "rgba(18,18,18,0.92)",
    chatBorder: "rgba(254,44,85,0.2)",
    pinnedBorder: "rgba(37,244,238,0.5)",
  },
});
