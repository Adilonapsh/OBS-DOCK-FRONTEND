'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { io } from 'socket.io-client';
import { getSocketUrl } from '../utils/socket';

function getWidgetId(pathname: string, widget: string | null, layout: string | null): string | null {
  if (pathname === '/widgets/display') {
    return (widget || layout || 'chat').trim().toLowerCase();
  }
  const match = pathname.match(/^\/widgets\/([a-z0-9_-]+)\/display\/?$/i);
  return match?.[1]?.toLowerCase() || null;
}

export default function WidgetHeartbeat() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const widgetId = getWidgetId(pathname, searchParams.get('widget'), searchParams.get('layout'));
  const privateKey = searchParams.get('key') || searchParams.get('privateKey') || '';

  useEffect(() => {
    if (!widgetId) return;

    const room = privateKey || 'global';
    const socket = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    const heartbeat = () => socket.emit('widget-heartbeat', { privateKey: room, widgetId });

    socket.on('connect', heartbeat);
    const interval = window.setInterval(() => {
      if (socket.connected) heartbeat();
    }, 15_000);

    return () => {
      window.clearInterval(interval);
      socket.disconnect();
    };
  }, [widgetId, privateKey]);

  return null;
}
