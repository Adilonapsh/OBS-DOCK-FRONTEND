import { defineTheme } from "../types";
import { defaultTheme } from "../default";

export default defineTheme({
  name: "Cyber Neon",
  icon: "👾",
  category: "gaming",
  description: "Hacker terminal - JetBrains Mono, neon panel 3px + glow",
  theme: {
    ...defaultTheme,
    fontFamily: "JetBrains Mono",
    accent: "#970020",
    accent2: "#050505",
    chatBg: "rgba(5,5,5,1)",
    chatText: "#e2e2e2",
    chatBorder: "#970020",
    chatRadius: 16,
    chatOpacity: 100,
    chatBlur: 0,
    pinnedBg: "rgba(5,5,5,1)",
    pinnedBorder: "#970020",
    pinnedText: "#e2e2e2",
    giftBg: "rgba(5,5,5,1)",
    giftBorder: "#970020",
    giftText: "#e2e2e2",
    shadow: true,
    chatPadding: 16,
    chatGap: 12,
    overlayPadding: 20,
    overlayGap: 16,
  },
  css: `:root{--main-color:var(--accent, #970020);--main-glow:rgba(151,0,32,0.4);--bg-black:#050505;--text-color:#e2e2e2}
[data-theme="blue"]{--main-color:#0084ff;--main-glow:rgba(0,132,255,0.4)}
[data-theme="green"]{--main-color:#00ff41;--main-glow:rgba(0,255,65,0.4)}
[data-theme="purple"]{--main-color:#bc13fe;--main-glow:rgba(188,19,254,0.4)}
.overlay-chat-bubble,.overlay-pinned,.overlay-gift,.neon-panel{background:var(--bg-black) !important;border:3px solid var(--main-color) !important;box-shadow:0 0 15px var(--main-glow), inset 0 0 5px var(--main-glow) !important;border-radius:16px !important;color:var(--text-color) !important}
.overlay-chat-bubble{padding:16px !important}
.typing-cursor::after{content:"_";animation:blink 0.8s infinite;color:var(--main-color)}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
#avatarContainer,.overlay-chat-avatar,.overlay-pinned-avatar,.overlay-gift-avatar{transition:transform 0.08s ease-out;will-change:transform;border:3px solid var(--main-color) !important}
.dot-pulse span{display:inline-block;width:8px;height:8px;border-radius:50%;background-color:var(--main-color);animation:pulse 1.5s infinite ease-in-out}
@keyframes pulse{0%,100%{transform:scale(0.5);opacity:0.3}50%{transform:scale(1.2);opacity:1}}
.accent-bar{background-color:var(--main-color) !important}
.user-tag,.overlay-chat-nickname{background-color:var(--main-color) !important;color:#fff !important;padding:2px 10px !important;font-size:0.75rem !important;font-weight:800 !important;text-transform:uppercase !important;border-radius:4px !important;box-shadow:0 0 10px var(--main-glow) !important;margin-bottom:8px !important;display:inline-block !important}
.fade-exit{opacity:0;transform:scale(0.95);filter:blur(10px);transition:all 1.2s cubic-bezier(0.4,0,0.2,1);pointer-events:none}
.overlay-chat-text{color:var(--text-color) !important}`,
});
