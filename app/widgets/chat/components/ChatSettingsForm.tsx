'use client';

import Link from 'next/link';
import { Palette, MessageSquare, Image as ImageIcon, Clock, Monitor, Copy } from 'lucide-react';
import { CHAT_THEMES, CHAT_FONTS, CHAT_ANIMS, CHAT_HORIZONTAL_ANIMS, CHAT_HIDE_ANIMS, type ChatSettings } from '../config';
import { PositionPicker } from '../../_shared/components/PositionPicker';

export function ChatSettingsForm({
  state,
  update,
  reset,
  privateKey,
  onCopy,
}: {
  state: ChatSettings;
  update: (k: keyof ChatSettings, v: unknown) => void;
  reset: () => void;
  privateKey: string;
  onCopy: () => void;
}) {
  return (
    <>
      {/* Tema & Font */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-white" /> Tema & Font</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Tema</span>
            <select value={state.theme} onChange={(e) => update('theme', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
              {CHAT_THEMES.map((t) => <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-gray-300">Font Family</span>
            <input list="fonts" value={state.font} onChange={(e) => update('font', e.target.value)} placeholder="Type to search..." className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
            <datalist id="fonts">{CHAT_FONTS.map((f) => <option key={f} value={f} />)}</datalist>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Font Size</span><input type="number" min={10} max={26} value={state.fontSize} onChange={(e) => update('fontSize', parseInt(e.target.value) || 14)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Animasi Masuk</span><select value={state.anim} onChange={(e) => update('anim', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">{CHAT_ANIMS.map((a) => <option key={a.value} value={a.value} className="bg-zinc-900">{a.label}</option>)}</select></label>
          </div>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Animasi Keluar (hide)</span><select value={(state as unknown as { hideAnim: string }).hideAnim} onChange={(e) => update('hideAnim' as keyof ChatSettings, e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">{CHAT_HIDE_ANIMS.map((a) => <option key={a.value} value={a.value} className="bg-zinc-900">{a.label}</option>)}</select><span className="text-[10px] text-gray-500">Dipakai saat hideAfter - default fade halus</span></label>
          {state.theme === 'perchar' && (
            <>
              <div className="grid grid-cols-2 gap-3 items-center">
                <span className="text-[11px] font-bold text-gray-300">Letter Fade Delay <span className="font-mono text-white">{state.charDelayMs}ms</span></span>
                <input type="range" min={0} max={200} step={5} value={state.charDelayMs} onChange={(e) => update('charDelayMs', parseInt(e.target.value) || 0)} className="w-full accent-white cursor-pointer" />
              </div>
              <div className="grid grid-cols-2 gap-3 items-center">
                <span className="text-[11px] font-bold text-gray-300">Fade Duration <span className="font-mono text-white">{Number(state.charDurationS).toFixed(2)}s</span></span>
                <input type="range" min={0.05} max={1.5} step={0.05} value={Number(state.charDurationS)} onChange={(e) => update('charDurationS', parseFloat(e.target.value) || 0.35)} className="w-full accent-white cursor-pointer" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Warna */}
      {state.theme === 'cute' ? (
        <div className="space-y-3">
          <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-pink-400" /> Warna - Cute (kustom)</h2>
          <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
            <div className="text-[10px] text-gray-500 bg-pink-500/10 border border-pink-500/20 rounded-xl p-2">Tema Cute tidak pakai Background container - hanya warna bubble & badge yang bisa dikustom.</div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="text-[11px] font-bold text-gray-300">Bubble</span><input type="color" value={state.cuteBubbleBg} onChange={(e) => update('cuteBubbleBg', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
              <label className="block"><span className="text-[11px] font-bold text-gray-300">Badge BG</span><input type="color" value={state.cuteBadgeBg} onChange={(e) => update('cuteBadgeBg', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="text-[11px] font-bold text-gray-300">Badge Text</span><input type="color" value={state.cuteBadgeText} onChange={(e) => update('cuteBadgeText', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
              <label className="block"><span className="text-[11px] font-bold text-gray-300">Resub From</span><input type="color" value={state.cuteResubFrom} onChange={(e) => update('cuteResubFrom', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="text-[11px] font-bold text-gray-300">Resub To</span><input type="color" value={state.cuteResubTo} onChange={(e) => update('cuteResubTo', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
              <label className="block"><span className="text-[11px] font-bold text-gray-300">Name VIP/Mod</span><input type="color" value={state.cuteNameMod} onChange={(e) => update('cuteNameMod', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
            </div>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Name User</span><input type="color" value={state.cuteNameUser} onChange={(e) => update('cuteNameUser', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-violet-400" /> Warna</h2>
          <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="text-[11px] font-bold text-gray-300">Accent</span><input type="color" value={state.accent} onChange={(e) => update('accent', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
              <label className="block"><span className="text-[11px] font-bold text-gray-300">Background</span><div className="mt-1 flex gap-1"><input type="color" value={state.bg === 'transparent' ? '#000000' : state.bg} onChange={(e) => update('bg', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10" /><button onClick={() => update('bg', 'transparent')} className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase border ${state.bg === 'transparent' ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>Transparent</button></div></label>
            </div>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Opacity Background - {state.bgOpacity}%</span><input type="range" min={10} max={100} value={state.bgOpacity} onChange={(e) => update('bgOpacity', parseInt(e.target.value))} className="mt-1 w-full accent-white" /></label>
          </div>
        </div>
      )}

      {/* Posisi - Global */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-emerald-400" /> Posisi - Global</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <PositionPicker value={(state as unknown as { pos: string }).pos || 'center'} onChange={(v) => update('pos' as keyof ChatSettings, v)} />
        </div>
      </div>

      {/* Chat behavior */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><MessageSquare className="w-4 h-4 text-cyan-400" /> Chat</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Max Messages</span><input type="number" min={1} max={30} value={state.maxMessages} onChange={(e) => update('maxMessages', parseInt(e.target.value) || 6)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Hide After (detik)</span><input type="number" min={0} max={60} value={state.hideAfter} onChange={(e) => update('hideAfter', parseInt(e.target.value) || 0)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /><span className="text-[10px] text-gray-500">0 = tidak auto-hide</span></label>
          </div>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white flex items-center gap-1.5"><ImageIcon className="w-3 h-3" /> Avatar</span><input type="checkbox" checked={state.showAvatar} onChange={(e) => update('showAvatar', e.target.checked)} className="w-4 h-4 accent-white" /></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Platform Logo</span><input type="checkbox" checked={state.showPlatform} onChange={(e) => update('showPlatform', e.target.checked)} className="w-4 h-4 accent-white" /></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white flex items-center gap-1.5"><Clock className="w-3 h-3" /> Timestamp</span><input type="checkbox" checked={state.showTimestamp} onChange={(e) => update('showTimestamp', e.target.checked)} className="w-4 h-4 accent-white" /></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Inline chat <span className="text-[9px] font-normal text-gray-400 block">nickname: pesan sebaris</span></span><input type="checkbox" checked={state.inline} onChange={(e) => update('inline', e.target.checked)} className="w-4 h-4 accent-white shrink-0" /></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer bg-cyan-500/5"><span className="text-[11px] font-bold text-white">Horizontal layout <span className="text-[9px] font-normal text-gray-400 block">Sampingan (row), cocok untuk bottom bar</span></span><input type="checkbox" checked={state.horizontal} onChange={(e) => update('horizontal', e.target.checked)} className="w-4 h-4 accent-white shrink-0" /></label>
          {state.horizontal && (
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Animasi Horizontal</span><select value={state.horizontalAnim} onChange={(e) => update('horizontalAnim', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">{CHAT_HORIZONTAL_ANIMS.map((a) => <option key={a.value} value={a.value} className="bg-zinc-900">{a.label}</option>)}</select></label>
          )}
        </div>
      </div>

      <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-3">
        <div className="text-violet-300 font-black uppercase text-[10px]">Sumber Chat</div>
        <div className="text-gray-400 text-[11px] leading-relaxed mt-1">Semua chat masuk lewat event <code className="bg-white/10 px-1 rounded text-white">tiktok-chat</code> di <code className="bg-white/10 px-1 rounded text-white">server.ts</code> - TikTok Live Connector + Streamer.bot → broadcast ke room <code className="bg-white/10 px-1 rounded text-white">key</code> &amp; <code className="bg-white/10 px-1 rounded text-white">global</code>.</div>
        <Link href={privateKey ? `/dock?key=${privateKey}` : '/dock'} className="mt-2 h-8 flex items-center justify-center gap-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase"><Monitor className="w-3 h-3" /> Buka Dock - Connect TikTok</Link>
      </div>

      <div className="flex gap-2">
        <button onClick={reset} className="flex-1 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-black uppercase text-gray-300">Reset</button>
        <button onClick={onCopy} className="flex-1 h-9 bg-white hover:bg-zinc-100 rounded-xl text-black font-black text-[11px] uppercase flex items-center justify-center gap-1.5 border border-white"><Copy className="w-3.5 h-3.5" /> Copy URL</button>
      </div>
    </>
  );
}
