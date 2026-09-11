'use client';

import Link from 'next/link';
import Sidebar from '../../../components/Sidebar';
import { Menu, ArrowLeft } from 'lucide-react';
import React from 'react';

// Shared layout for all widget settings pages — header + URL bar + 2-col (settings | preview)
// Keeps each widget's page.tsx < 80 lines
export function WidgetShell({
  sidebarOpen,
  setSidebarOpen,
  user,
  headerIcon,
  title,
  subtitle,
  headerActions,
  urlBar,
  settingsPanel,
  previewPanel,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  user: unknown;
  headerIcon: React.ReactNode;
  title: React.ReactNode;
  subtitle?: string;
  headerActions?: React.ReactNode;
  urlBar: React.ReactNode;
  settingsPanel: React.ReactNode;
  previewPanel: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar active="widgets" open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user as never} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
            <Link href="/widgets" className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white"><ArrowLeft className="w-4 h-4" /></Link>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">{headerIcon}</div>
            <div className="min-w-0">
              <div className="text-white font-black text-[12px] uppercase tracking-widest flex items-center gap-2">{title}</div>
              {subtitle && <div className="hidden sm:block text-gray-500 text-[10px]">{subtitle}</div>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">{headerActions}</div>
        </header>

        <div className="bg-[#161616] border-b border-white/5 px-4 md:px-6 py-3 flex flex-col sm:flex-row gap-2 sm:items-center">
          {urlBar}
        </div>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          <div className="w-full lg:w-[420px] shrink-0 bg-[#121212] border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col max-h-[52vh] lg:max-h-none lg:h-[calc(100vh-112px)] overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
              {settingsPanel}
            </div>
          </div>
          <div className="flex-1 bg-[#0a0a0a] p-4 md:p-6 flex flex-col min-h-[420px]">
            {previewPanel}
          </div>
        </div>
      </div>
    </div>
  );
}
