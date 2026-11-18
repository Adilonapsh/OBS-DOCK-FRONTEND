'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../utils/socket';

// Generic socket hook - replaces duplicated io() + join-room + connected state in 4 widgets
export function useWidgetSocket(privateKey: string): { socket: Socket | null; connected: boolean } {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    const room = privateKey || 'global';
    s.on('connect', () => {
      setConnected(true);
      s.emit('join-room', room);
    });
    s.on('disconnect', () => setConnected(false));
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [privateKey]);

  return { socket, connected };
}
