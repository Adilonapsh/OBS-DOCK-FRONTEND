'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useCopy } from './useCopy';

// Boilerplate yang sebelumnya diduplikasi di 11 halaman settings widget
// (user, sidebar, copy URL, show/hide private key, popup load/defaults).
export function useWidgetPageShell(loadFromUrl: (url: string) => void) {
  const supabase = createClient();
  const { copied, copy } = useCopy();
  const [user, setUser] = useState<unknown>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLoadPopup, setShowLoadPopup] = useState(false);
  const [loadUrl, setLoadUrl] = useState('');
  const [showDefaultsConfirm, setShowDefaultsConfirm] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showKeyConfirm, setShowKeyConfirm] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  const handleLoad = () => {
    try {
      loadFromUrl(loadUrl);
      setShowLoadPopup(false);
    } catch {
      alert('URL tidak valid');
    }
  };

  return {
    user,
    sidebarOpen,
    setSidebarOpen,
    copied,
    copy,
    showKey,
    setShowKey,
    showKeyConfirm,
    setShowKeyConfirm,
    showLoadPopup,
    setShowLoadPopup,
    loadUrl,
    setLoadUrl,
    showDefaultsConfirm,
    setShowDefaultsConfirm,
    handleLoad,
  };
}

export type WidgetPageShell = ReturnType<typeof useWidgetPageShell>;
