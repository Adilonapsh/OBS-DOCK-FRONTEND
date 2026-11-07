'use client';

/**
 * Pinned Chat Control - tampilkan chat yang sedang di-pin, pilih dari chat
 * terbaru, atau pin manual. Sinkron ke widget/overlay Pinned Chat.
 */

import { useState } from 'react';
import { MessageSquare, Pin, PinOff, RefreshCw } from 'lucide-react';
import type { DockControlsApi } from './types';

export type PinnedChatControlProps = {
  pinnedChat: DockControlsApi['pinnedChat'];
  chat: DockControlsApi['chat'];
  actions: DockControlsApi['pinActions'];
};

function platformLabel(platform: string): string {
  const p = platform.toLowerCase();
  if (!p) return 'CHAT';
  return p.slice(0, 10).toUpperCase();
}

export default function PinnedChatControl({ pinnedChat, chat, actions }: PinnedChatControlProps) {
  const [manualUser, setManualUser] = useState('');
  const [manualText, setManualText] = useState('');

  const pinManual = () => {
    const text = manualText.trim();
    if (!text) return;
    actions.pin({
      user: manualUser.trim().slice(0, 40) || 'Streamer',
      text: text.slice(0, 240),
      platform: 'manual',
    });
    setManualUser('');
    setManualText('');
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto mdock-scroll p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Pin className="w-4 h-4 text-pink-500" />
          <span className="text-xs font-black uppercase tracking-wider">Pinned Chat</span>
        </div>
        <button
          onClick={actions.refresh}
          className="w-6 h-6 grid place-items-center rounded-full bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-label)] hover:text-[var(--text-main)] cursor-pointer"
          title="Muat ulang pin"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] p-3">
        {pinnedChat ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 min-w-0">
              {pinnedChat.avatar ? (
                <img src={pinnedChat.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 bg-[var(--panel-bg)]" />
              ) : (
                <span className="w-7 h-7 rounded-full bg-[var(--panel-bg)] border border-[var(--border-color)] grid place-items-center text-[10px] font-black shrink-0">
                  {pinnedChat.user.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black truncate">{pinnedChat.user}</p>
                <p className="text-[8px] uppercase tracking-wider text-[var(--text-label)]">{platformLabel(pinnedChat.platform)}</p>
              </div>
              <button
                onClick={actions.unpin}
                className="h-7 px-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer shrink-0"
              >
                <PinOff className="w-3 h-3" /> Unpin
              </button>
            </div>
            <p className="text-[11px] leading-relaxed break-words border-l-2 border-pink-500/50 pl-2">
              {pinnedChat.text}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 py-4 text-center">
            <Pin className="w-5 h-5 text-[var(--text-label)] opacity-50" />
            <p className="text-[10px] text-[var(--text-label)] italic">Belum ada chat yang di-pin.</p>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-label)] flex items-center gap-1">
          <MessageSquare className="w-3 h-3" /> Chat terbaru
        </p>
        <div className="space-y-1 max-h-[180px] overflow-y-auto mdock-scroll">
          {chat.length === 0 ? (
            <p className="text-[10px] text-[var(--text-label)] italic px-1 py-2">
              Belum ada chat masuk. Pastikan koneksi TikTok/Streamer.bot aktif.
            </p>
          ) : (
            chat.slice(0, 30).map((item) => (
              <button
                key={item.id}
                onClick={() => actions.pin({ user: item.user, text: item.text, platform: item.platform, avatar: item.avatar })}
                className="w-full text-left flex items-start gap-2 p-1.5 rounded-lg bg-[var(--panel-bg)] border border-[var(--border-color)] hover:border-pink-500/50 cursor-pointer"
                title="Pin chat ini"
              >
                {item.avatar ? (
                  <img src={item.avatar} alt="" className="w-5 h-5 rounded-full object-cover shrink-0 bg-[var(--bg-color)]" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-[var(--bg-color)] grid place-items-center text-[8px] font-black shrink-0">
                    {item.user.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1">
                    <span className="text-[9px] font-black truncate" style={item.color ? { color: item.color } : undefined}>{item.user}</span>
                    <span className="text-[7px] uppercase text-[var(--text-label)] shrink-0">{platformLabel(item.platform)}</span>
                  </span>
                  <span className="block text-[10px] text-[var(--text-label)] line-clamp-2 break-words">{item.text}</span>
                </span>
                <Pin className="w-3 h-3 shrink-0 text-[var(--text-label)] mt-1" />
              </button>
            ))
          )}
        </div>
      </div>

      <div className="space-y-1.5 border-t border-[var(--border-color)] pt-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-label)]">Pin manual</p>
        <input
          value={manualUser}
          onChange={(e) => setManualUser(e.target.value)}
          placeholder="Nama (opsional)"
          className="w-full text-[11px] px-2.5 py-2 border border-[var(--border-color)] bg-[var(--bg-color)] rounded-md focus:outline-none"
        />
        <textarea
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) pinManual();
          }}
          rows={2}
          placeholder="Isi pesan yang mau di-pin… (Ctrl+Enter)"
          className="w-full text-[11px] px-2.5 py-2 border border-[var(--border-color)] bg-[var(--bg-color)] rounded-md resize-none focus:outline-none"
        />
        <button
          onClick={pinManual}
          disabled={!manualText.trim()}
          className="w-full py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-[10px] font-black uppercase tracking-wider disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1"
        >
          <Pin className="w-3 h-3" /> Pin Pesan
        </button>
      </div>
    </div>
  );
}
