'use client';

/**
 * Chat Feed Control - daftar chat live (TikTok / Streamer.bot) dengan tombol
 * pin langsung. Bisa dipasang sebagai panel dock mana pun.
 */

import { MessageSquare, Pin, Volume2 } from 'lucide-react';
import type { DockControlsApi } from './types';

export type ChatFeedControlProps = {
  chat: DockControlsApi['chat'];
  actions: DockControlsApi['pinActions'];
  speakActions: DockControlsApi['speakActions'];
  connected?: boolean;
};

function platformColor(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'tiktok': return 'bg-black text-white';
    case 'twitch': return 'bg-purple-600 text-white';
    case 'youtube': return 'bg-red-600 text-white';
    case 'kick': return 'bg-green-600 text-white';
    default: return 'bg-[var(--bg-color)] text-[var(--text-label)] border border-[var(--border-color)]';
  }
}

export default function ChatFeedControl({ chat, actions, speakActions, connected }: ChatFeedControlProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="px-3 py-2 border-b border-[var(--border-color)] bg-[var(--bg-color)] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <MessageSquare className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-wider truncate">Chat Feed</span>
          <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--panel-bg)] border border-[var(--border-color)]">
            {chat.length}
          </span>
        </div>
        <span className={`shrink-0 w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} title={connected ? 'Terhubung' : 'Terputus'} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto mdock-scroll p-1.5 space-y-1">
        {chat.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center p-4">
            <MessageSquare className="w-7 h-7 text-[var(--text-label)] opacity-40" />
            <p className="text-[10px] text-[var(--text-label)] italic">Belum ada chat masuk.</p>
            <p className="text-[9px] text-[var(--text-label)] opacity-75">Koneksikan TikTok / Streamer.bot untuk melihat chat di sini.</p>
          </div>
        ) : (
          chat.map((item) => (
            <div
              key={item.id}
              className="group flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-[var(--panel-bg)] border border-transparent hover:border-[var(--border-color)]"
            >
              {item.avatar ? (
                <img src={item.avatar} alt="" className="w-5 h-5 rounded-full object-cover shrink-0 bg-[var(--bg-color)] mt-0.5" loading="lazy" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-[var(--bg-color)] grid place-items-center text-[8px] font-black shrink-0 mt-0.5">
                  {item.user.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span
                    className="text-[9px] font-black truncate"
                    style={item.color ? { color: item.color } : undefined}
                  >
                    {item.user}
                  </span>
                  <span className={`shrink-0 px-1 rounded text-[7px] font-black uppercase ${platformColor(item.platform)}`}>
                    {item.platform.slice(0, 8)}
                  </span>
                </div>
                <p className="text-[10px] leading-snug break-words text-[var(--text-main)]">{item.text}</p>
              </div>
              <button
                onClick={() => speakActions.speak({ user: item.user, text: item.text, platform: item.platform, avatar: item.avatar })}
                className="shrink-0 p-1 rounded text-[var(--text-label)] hover:text-emerald-500 opacity-40 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                title="Speak chat ini (TTS)"
              >
                <Volume2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => actions.pin({ user: item.user, text: item.text, platform: item.platform, avatar: item.avatar })}
                className="shrink-0 p-1 rounded text-[var(--text-label)] hover:text-pink-500 opacity-40 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                title="Pin chat ini"
              >
                <Pin className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
