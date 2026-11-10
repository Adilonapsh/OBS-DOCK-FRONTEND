export const PINNED_CHAT_CSS = `
  /* Pinned & Speak: shadow tema non-brutalist dihilangkan; brutalist tetap memakai drop shadow. */
  .pin-no-shadow, .pin-no-shadow * { box-shadow: none !important; }
  .pin-pc-meta { display: flex; align-items: center; gap: 8px; padding-left: 2px; animation: pinPcMetaIn 0.3s ease both; }
  @keyframes pinPcMetaIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  .pin-pc-username { background: rgba(40,38,64,0.92); color: #fff; font-size: 14px; font-weight: 800; padding: 5px 14px; border-radius: 16px; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
  .pin-pc-avatar { width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0; object-fit: cover; background: #0d0c18; border: 2.5px solid transparent; animation: pinPcAvatarPop 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both; }
  @keyframes pinPcAvatarPop { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }
  .pin-pc-bubble { position: relative; color: #fff; font-weight: 800; line-height: 1.45; padding: 13px 20px; border-radius: 20px; max-width: 370px; box-shadow: 0 4px 18px rgba(0,0,0,0.25); overflow-wrap: break-word; transform-origin: bottom left; animation: pinPcBubbleIn 0.4s cubic-bezier(0.16,1,0.3,1) both; }
  .pin-pc-bubble::after { content: ''; position: absolute; bottom: -9px; left: 18px; width: 18px; height: 14px; background: inherit; clip-path: path("M 0,0 C 2,5 0,10 -6,12 C 2,10 10,6 16,0 Z"); }
  @keyframes pinPcBubbleIn { 0% { opacity: 0; transform: scale(0.85) translateY(12px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
  .pin-pc-char { display: inline-block; opacity: 0; animation-name: pinPcCharIn; animation-timing-function: ease-out; animation-fill-mode: forwards; white-space: pre; }
  @keyframes pinPcCharIn { 0% { opacity: 0; transform: translateY(2px); } 100% { opacity: 1; transform: translateY(0); } }
  @keyframes pinOut { from { opacity: 1; } to { opacity: 0; } }
  .pin-island { background: #000; border-radius: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.55); overflow: hidden; animation: pinIslandIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }
  @keyframes pinIslandIn { 0% { opacity: 0; transform: scaleX(0.35) scaleY(0.7); } 60% { opacity: 1; transform: scaleX(1.04) scaleY(1.02); } 100% { opacity: 1; transform: scaleX(1) scaleY(1); } }
  .pin-island-dot { width: 8px; height: 8px; border-radius: 50%; animation: pinIslandPulse 1.6s ease-in-out infinite; }
  @keyframes pinIslandPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.45; transform: scale(0.8); } }
  .pin-mk-char { color: var(--pin-mk-dim, rgba(255,255,255,0.25)); transition: color 0.08s ease; white-space: pre; }
  .pin-mk-char.done { color: var(--pin-mk-text, #fff); }
  .pin-mk-caret { display: inline-block; width: 3px; height: 1.1em; background: var(--pin-accent, #e2b714); vertical-align: -0.15em; margin-left: 1px; border-radius: 1px; animation: pinMkCaret 1s steps(1) infinite; }
  @keyframes pinMkCaret { 0%, 55% { opacity: 1; } 56%, 100% { opacity: 0; } }
  .pin-type-cursor { display: inline-block; width: 2px; height: 1em; background: currentColor; vertical-align: -0.12em; margin-left: 2px; animation: pinCursorBlink 0.9s steps(1) infinite; }
  @keyframes pinCursorBlink { 0%, 55% { opacity: 1; } 56%, 100% { opacity: 0; } }
  .pin-card-dots { display: inline-flex; align-items: center; gap: 6px; }
  .pin-card-dots span { width: 8px; height: 8px; border-radius: 50%; background: var(--pin-accent, #8b5cf6); animation: pinCardDot 1.2s infinite ease-in-out; }
  .pin-card-dots span:nth-child(2) { animation-delay: 0.18s; }
  .pin-card-dots span:nth-child(3) { animation-delay: 0.36s; }
  @keyframes pinCardDot { 0%, 100% { transform: scale(0.55); opacity: 0.35; } 50% { transform: scale(1); opacity: 1; } }
  .pin-card-error { display: inline-block; color: #ef4444; font-weight: 800; }
  .pin-kb { --kb-plate: #101014; --kb-key: #232329; --kb-text: rgba(255,255,255,0.75); --kb-shadow: #0a0a0d; display: flex; flex-direction: column; gap: 4px; align-items: stretch; background: var(--kb-plate); border: 1px solid rgba(255,255,255,0.09); border-radius: 10px; padding: 8px 6px; }
  .pin-kb.glow { box-shadow: 0 8px 20px rgba(0,0,0,0.5), 0 0 18px -4px var(--pin-accent, #8b5cf6); }
  .pin-kb.kb-light { --kb-plate: #e2e4e8; --kb-key: #f4f5f7; --kb-text: #1f2937; --kb-shadow: #9ca3af; }
  .pin-kb.kb-cyber { --kb-plate: #150826; --kb-key: #3b0764; --kb-text: #f0abfc; --kb-shadow: #2e1065; }
  .pin-kb.kb-cap-ewhite { --kb-key: #f4f5f7; --kb-text: #1f2937; --kb-shadow: #9ca3af; }
  .pin-kb.kb-cap-samurai { --kb-key: #450a0a; --kb-text: #fef2f2; --kb-shadow: #290606; }
  .pin-kb.kb-cap-botanical { --kb-key: #f8fafc; --kb-text: #14532d; --kb-shadow: #94a3b8; }
  .pin-kb.kb-cap-cyber { --kb-key: #3b0764; --kb-text: #f0abfc; --kb-shadow: #2e1065; }
  .pin-kb.kb-cap-mono { --kb-key: #18181b; --kb-text: #f4f4f5; --kb-shadow: #09090b; }
  .pin-kb-row { display: flex; gap: 4px; }
  .pin-kb-key { flex: 1 1 0; height: 24px; padding: 0 2px; border-radius: 5px; background: var(--kb-key); border: 1px solid var(--kb-shadow); color: var(--kb-text); font-size: 8px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; position: relative; box-shadow: 0 3px 0 0 var(--kb-shadow), 0 4px 6px 0 rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.14); transition: transform 0.05s ease, box-shadow 0.05s ease, background-color 0.12s ease; user-select: none; overflow: hidden; }
  .pin-kb-key.dark { background: #141417; color: rgba(255,255,255,0.85); }
  .pin-kb-key .sub { position: absolute; bottom: 1px; right: 3px; font-size: 6px; font-weight: 700; opacity: 0.5; }
  .pin-kb-key.on { background: var(--pin-accent, #8b5cf6); border-color: var(--pin-accent, #8b5cf6); color: #000; transform: translateY(2.5px); box-shadow: 0 0.5px 0 0 var(--pin-accent, #8b5cf6), 0 1px 2px 0 rgba(0,0,0,0.3), 0 0 12px var(--pin-accent, #8b5cf6); }
  .pin-kb-key.on .sub { opacity: 0.8; }
  .pin-fx-glow { animation: pinFxGlow 2.4s ease-in-out infinite; }
  @keyframes pinFxGlow { 0%, 100% { filter: drop-shadow(0 0 2px var(--pin-accent, #8b5cf6)); } 50% { filter: drop-shadow(0 0 12px var(--pin-accent, #8b5cf6)); } }
  .pin-fx-spin { position: relative; }
  .pin-fx-spin::before { content: ''; position: absolute; inset: -28%; z-index: 0; background: conic-gradient(from 0deg, transparent 0%, var(--pin-accent, #8b5cf6) 14%, transparent 30%, transparent 55%, var(--pin-accent, #8b5cf6) 70%, transparent 86%); animation: pinFxSpin 3.2s linear infinite; filter: blur(16px); opacity: 0.8; pointer-events: none; }
  .pin-fx-spin > .pin-fx-inner { position: relative; z-index: 1; overflow: hidden; }
  .pin-fx-inner-solid { background: rgba(0,0,0,0.35); }
  @keyframes pinFxSpin { to { transform: rotate(360deg); } }
`;
