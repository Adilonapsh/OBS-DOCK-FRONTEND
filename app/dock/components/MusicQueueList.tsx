'use client';
import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Music } from 'lucide-react';
import { getSocketUrl } from '../../widgets/_shared/utils/socket';
import type { SongState } from './MusicControl';

// List queue music read-only untuk tab Statistik di dock.
// Socket sendiri (seperti MusicControl) + filter room, tanpa kontrol (play/delete tetap di tab music).
export default function MusicQueueList({
  getRoom,
}: {
  getRoom: () => string;
}) {
  const [song, setSong] = useState<SongState | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const room = getRoom();
  useEffect(() => {
    const s = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    socketRef.current = s;
    const onUpdate = (st: SongState & { room?: string }) => {
      if (st && st.room && st.room !== room) return;
      setSong(st);
    };
    s.on('song-update', onUpdate);
    s.on('connect', () => {
      s.emit('join-room', room);
      s.emit('song-get', { privateKey: room });
    });
    if (s.connected) {
      s.emit('join-room', room);
      s.emit('song-get', { privateKey: room });
    }
    return () => {
      s.off('song-update', onUpdate);
      s.disconnect();
      socketRef.current = null;
    };
  }, [room]);

  const queue = song?.queue || [];
  const current = queue.length > 0 ? queue[Math.min(song?.currentIndex || 0, queue.length - 1)] : null;

  return (
    <div className="bg-[#161616] border border-white/5 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-400 text-[9px] font-black uppercase flex items-center gap-1.5">
          <Music className="w-3 h-3 text-green-400" /> Music Queue
        </h3>
        <span className="bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded text-[8px] font-bold">
          {queue.length} lagu{song?.isPlaying ? ' • Play' : ''}
        </span>
      </div>
      {current && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-2.5 py-2 mb-2">
          <div className="text-[7px] font-black uppercase text-green-400 mb-0.5">Now Playing</div>
          <div className="text-white text-[11px] font-black truncate">{current.title}</div>
          <div className="text-gray-500 text-[8px] truncate">req by {current.requestedBy} • {current.platform}</div>
        </div>
      )}
      <div className="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar">
        {queue.length === 0 ? (
          <div className="text-[10px] text-gray-600 italic">Queue kosong. Ketik !song + URL di chat.</div>
        ) : (
          queue.map((q, i) => {
            const isCurrent = current !== null && q.id === current.id;
            return (
              <div
                key={q.id}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border ${
                  isCurrent ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/5'
                }`}
              >
                <span className={`text-[9px] font-mono w-4 shrink-0 ${isCurrent ? 'text-green-400' : 'text-gray-600'}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-white truncate">{q.title}</div>
                  <div className="text-[8px] text-gray-500 truncate">{q.requestedBy}</div>
                </div>
                {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
