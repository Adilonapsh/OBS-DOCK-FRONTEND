'use client';

import { Settings2, Copy, Check, Eye, EyeOff, Monitor, GripVertical } from 'lucide-react';
import { maskPrivateKey } from '../utils/url';

export function UrlBar({
  obsUrl,
  showKey,
  onToggleKey,
  copied,
  onCopy,
}: {
  obsUrl: string;
  showKey: boolean;
  onToggleKey: () => void;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-black tracking-widest uppercase text-gray-500 mb-1 flex items-center gap-1.5"><Settings2 className="w-3 h-3" /> Widget URL - paste ke OBS Browser Source (transparent)</div>
        <div onClick={onCopy} className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 cursor-pointer hover:border-white/20 group">
          <code className={`flex-1 text-[11px] font-mono truncate ${showKey ? 'text-white' : 'text-white blur-[3px] select-none'}`}>{showKey ? obsUrl : maskPrivateKey(obsUrl)}</code>
          <button type="button" onClick={(e) => { e.stopPropagation(); onToggleKey(); }} className="shrink-0 w-7 h-7 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white">{showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
          <span className={`shrink-0 w-7 h-7 grid place-items-center rounded-lg ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-black group-hover:bg-zinc-100'}`}>{copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}</span>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <a href={obsUrl} target="_blank" className="h-9 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-black text-[11px] uppercase flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5" /> OBS</a>
        <a href={obsUrl} draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', obsUrl); }} className="h-9 px-3 bg-white text-black border border-dashed border-zinc-300 hover:border-white rounded-xl font-black text-[11px] uppercase flex items-center gap-1.5 cursor-grab active:cursor-grabbing"><GripVertical className="w-3.5 h-3.5" /> Drag ke OBS</a>
      </div>
    </>
  );
}
