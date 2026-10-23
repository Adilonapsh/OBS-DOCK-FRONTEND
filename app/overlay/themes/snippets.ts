export const cssSnippets: Record<string, { name: string; desc: string; css: string }> = {
  glow: {
    name: "Glow Border",
    desc: "Chat glow accent",
    css: `/* Glow chat bubble */\n.overlay-chat-bubble {\n  box-shadow: 0 0 20px var(--accent, #FE2C55), 0 0 40px var(--accent, #FE2C55) !important;\n  border: 2px solid var(--accent, #FE2C55) !important;\n}`,
  },
  transparent: {
    name: "Transparent Chat",
    desc: "Bg lebih transparan",
    css: `/* Transparent chat */\n.overlay-chat-bubble {\n  background: rgba(0,0,0,0.35) !important;\n  backdrop-filter: blur(16px) !important;\n}`,
  },
  hideAvatar: {
    name: "Hide Avatar",
    desc: "Sembunyikan avatar",
    css: `/* Hide avatar */\n.overlay-chat-avatar,\n.overlay-pinned-avatar,\n.overlay-gift-avatar {\n  display: none !important;\n}`,
  },
  neonText: {
    name: "Neon Text",
    desc: "Text neon glow",
    css: `/* Neon text */\n.overlay-chat-text {\n  text-shadow: 0 0 8px var(--accent, #FE2C55), 0 0 16px var(--accent, #FE2C55) !important;\n  font-weight: 800 !important;\n}`,
  },
  rounded: {
    name: "Extra Rounded",
    desc: "Bubble super rounded",
    css: `/* Extra rounded */\n.overlay-chat-bubble {\n  border-radius: 24px !important;\n}\n.overlay-pinned {\n  border-radius: 28px !important;\n}`,
  },
  gradientPinned: {
    name: "Gradient Pinned",
    desc: "Pinned gradient bg",
    css: `/* Gradient pinned */\n.overlay-pinned {\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;\n  border: none !important;\n}`,
  },
  cyberNeon: {
    name: "Cyber Neon",
    desc: "Neon panel + JetBrains Mono",
    css: `:root{--main-color:var(--accent, #970020);--main-glow:rgba(151,0,32,0.4);--bg-black:#050505;--text-color:#e2e2e2}\n[data-theme="blue"]{--main-color:#0084ff;--main-glow:rgba(0,132,255,0.4)}\n[data-theme="green"]{--main-color:#00ff41;--main-glow:rgba(0,255,65,0.4)}\n[data-theme="purple"]{--main-color:#bc13fe;--main-glow:rgba(188,19,254,0.4)}\n.overlay-chat-bubble,.overlay-pinned,.overlay-gift,.neon-panel{background:var(--bg-black) !important;border:3px solid var(--main-color) !important;box-shadow:0 0 15px var(--main-glow), inset 0 0 5px var(--main-glow) !important;border-radius:16px !important;color:var(--text-color) !important}\n.typing-cursor::after{content:"_";animation:blink 0.8s infinite;color:var(--main-color)}\n@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}\n#avatarContainer,.overlay-chat-avatar{transition:transform 0.08s ease-out;will-change:transform;border:3px solid var(--main-color) !important}\n.dot-pulse span{display:inline-block;width:8px;height:8px;border-radius:50%;background-color:var(--main-color);animation:pulse 1.5s infinite ease-in-out}\n@keyframes pulse{0%,100%{transform:scale(0.5);opacity:0.3}50%{transform:scale(1.2);opacity:1}}\n.user-tag{background-color:var(--main-color) !important;color:#fff !important;padding:2px 10px !important;font-size:0.75rem !important;font-weight:800 !important;text-transform:uppercase !important;border-radius:4px !important;box-shadow:0 0 10px var(--main-glow) !important}`,
  },
};
