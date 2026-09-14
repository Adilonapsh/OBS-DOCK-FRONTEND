'use client';

import Link from 'next/link';
import { Palette, Gift, Heart, UserPlus, Monitor, Copy, Volume2 } from 'lucide-react';
import { EVENT_THEMES, EVENT_FONTS, EVENT_ANIMS, EVENT_HORIZONTAL_ANIMS, EVENT_HIDE_ANIMS, type EventSettings } from '../config';
import { WIDGET_FONTS } from '../../_shared/constants/fonts';
import { PositionPicker } from '../../_shared/components/PositionPicker';

export function EventSettingsForm({
  state,
  update,
  reset,
  privateKey,
  onCopy,
}: {
  state: EventSettings;
  update: (k: keyof EventSettings, v: unknown) => void;
  reset: () => void;
  privateKey: string;
  onCopy: () => void;
}) {
  const playJoinSound = () => {
    const url = (state as unknown as { joinSoundUrl: string }).joinSoundUrl;
    const vol = (state as unknown as { joinSoundVolume: number }).joinSoundVolume ?? 80;
    if (!url) return;
    const a = new Audio(url);
    a.volume = vol / 100;
    a.play().catch(() => {});
  };
  return (
    <>
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-white" /> Tema & Font</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Tema</span>
            <select value={state.theme} onChange={(e) => update('theme', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">
              {EVENT_THEMES.map((t) => <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>)}
            </select>
          </label>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Font Family</span>
            <input list="fonts-event" value={state.font} onChange={(e) => update('font', e.target.value)} placeholder="Type to search..." className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
            <datalist id="fonts-event">{WIDGET_FONTS.map((f) => <option key={f} value={f} />)}</datalist>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Font Size</span><input type="number" min={10} max={26} value={state.fontSize} onChange={(e) => update('fontSize', parseInt(e.target.value) || 14)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Animasi Masuk</span><select value={state.anim} onChange={(e) => update('anim', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">{EVENT_ANIMS.map((a) => <option key={a.value} value={a.value} className="bg-zinc-900">{a.label}</option>)}</select></label>
          </div>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Animasi Keluar (hide)</span><select value={(state as unknown as { hideAnim: string }).hideAnim} onChange={(e) => update('hideAnim' as keyof EventSettings, e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">{EVENT_HIDE_ANIMS.map((a) => <option key={a.value} value={a.value} className="bg-zinc-900">{a.label}</option>)}</select><span className="text-[10px] text-gray-500">Dipakai saat hideAfter - default fade halus</span></label>
          {state.theme === 'perchar' && (
            <>
              <div className="grid grid-cols-2 gap-3 items-center">
                <span className="text-[11px] font-bold text-gray-300">Letter Fade Delay <span className="font-mono text-white">{(state as unknown as { charDelayMs: number }).charDelayMs}ms</span></span>
                <input type="range" min={0} max={200} step={5} value={(state as unknown as { charDelayMs: number }).charDelayMs} onChange={(e) => update('charDelayMs' as keyof EventSettings, parseInt(e.target.value) || 0)} className="w-full accent-white cursor-pointer" />
              </div>
              <div className="grid grid-cols-2 gap-3 items-center">
                <span className="text-[11px] font-bold text-gray-300">Fade Duration <span className="font-mono text-white">{Number((state as unknown as { charDurationS: number }).charDurationS).toFixed(2)}s</span></span>
                <input type="range" min={0.05} max={1.5} step={0.05} value={Number((state as unknown as { charDurationS: number }).charDurationS)} onChange={(e) => update('charDurationS' as keyof EventSettings, parseFloat(e.target.value) || 0.35)} className="w-full accent-white cursor-pointer" />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-violet-400" /> Warna</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          {state.theme === 'cute' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-[11px] font-bold text-gray-300">Bubble</span><input type="color" value={(state as unknown as { cuteBubbleBg: string }).cuteBubbleBg} onChange={(e) => update('cuteBubbleBg' as keyof EventSettings, e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
                <label className="block"><span className="text-[11px] font-bold text-gray-300">Badge BG</span><input type="color" value={(state as unknown as { cuteBadgeBg: string }).cuteBadgeBg} onChange={(e) => update('cuteBadgeBg' as keyof EventSettings, e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-[11px] font-bold text-gray-300">Badge Text</span><input type="color" value={(state as unknown as { cuteBadgeText: string }).cuteBadgeText} onChange={(e) => update('cuteBadgeText' as keyof EventSettings, e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
                <label className="block"><span className="text-[11px] font-bold text-gray-300">Gift From</span><input type="color" value={(state as unknown as { cuteResubFrom: string }).cuteResubFrom} onChange={(e) => update('cuteResubFrom' as keyof EventSettings, e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-[11px] font-bold text-gray-300">Gift To</span><input type="color" value={(state as unknown as { cuteResubTo: string }).cuteResubTo} onChange={(e) => update('cuteResubTo' as keyof EventSettings, e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
                <label className="block"><span className="text-[11px] font-bold text-gray-300">Name Mod</span><input type="color" value={(state as unknown as { cuteNameMod: string }).cuteNameMod} onChange={(e) => update('cuteNameMod' as keyof EventSettings, e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
              </div>
              <label className="block"><span className="text-[11px] font-bold text-gray-300">Name User</span><input type="color" value={(state as unknown as { cuteNameUser: string }).cuteNameUser} onChange={(e) => update('cuteNameUser' as keyof EventSettings, e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-[11px] font-bold text-gray-300">Accent</span><input type="color" value={state.accent} onChange={(e) => update('accent', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
                <label className="block"><span className="text-[11px] font-bold text-gray-300">Background</span><div className="mt-1 flex gap-1"><input type="color" value={state.bg === 'transparent' ? '#000000' : state.bg} onChange={(e) => update('bg', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10" /><button onClick={() => update('bg', 'transparent')} className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase border ${state.bg === 'transparent' ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>Transparent</button></div></label>
              </div>
              <label className="block"><span className="text-[11px] font-bold text-gray-300">Opacity Background - {state.bgOpacity}%</span><input type="range" min={10} max={100} value={state.bgOpacity} onChange={(e) => update('bgOpacity', parseInt(e.target.value))} className="mt-1 w-full accent-white" /></label>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-emerald-400" /> Posisi - Global</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <PositionPicker value={(state as unknown as { pos: string }).pos || 'bl'} onChange={(v) => update('pos' as keyof EventSettings, v)} />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Gift className="w-4 h-4 text-cyan-400" /> Event</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Max Events</span><input type="number" min={1} max={20} value={state.maxEvents} onChange={(e) => update('maxEvents', parseInt(e.target.value) || 6)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Hide After (detik)</span><input type="number" min={0} max={60} value={state.hideAfter} onChange={(e) => update('hideAfter', parseInt(e.target.value) || 0)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /><span className="text-[10px] text-gray-500">0 = tidak auto-hide</span></label>
          </div>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white flex items-center gap-1.5"><UserPlus className="w-3 h-3" /> Join</span><input type="checkbox" checked={state.showJoin} onChange={(e) => update('showJoin', e.target.checked)} className="w-4 h-4 accent-white" /></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white flex items-center gap-1.5"><Gift className="w-3 h-3" /> Gift</span><input type="checkbox" checked={state.showGift} onChange={(e) => update('showGift', e.target.checked)} className="w-4 h-4 accent-white" /></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white flex items-center gap-1.5"><Heart className="w-3 h-3" /> Like</span><input type="checkbox" checked={state.showLike} onChange={(e) => update('showLike', e.target.checked)} className="w-4 h-4 accent-white" /></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Avatar</span><input type="checkbox" checked={state.showAvatar} onChange={(e) => update('showAvatar', e.target.checked)} className="w-4 h-4 accent-white" /></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Inline <span className="text-[9px] font-normal text-gray-400 block">nickname: info sebaris</span></span><input type="checkbox" checked={(state as unknown as { inline: boolean }).inline} onChange={(e) => update('inline' as keyof EventSettings, e.target.checked)} className="w-4 h-4 accent-white shrink-0" /></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer bg-cyan-500/5"><span className="text-[11px] font-bold text-white">Horizontal layout <span className="text-[9px] font-normal text-gray-400 block">Sampingan (row)</span></span><input type="checkbox" checked={state.horizontal} onChange={(e) => update('horizontal', e.target.checked)} className="w-4 h-4 accent-white shrink-0" /></label>
          {state.horizontal && (
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Animasi Horizontal</span><select value={(state as unknown as { horizontalAnim: string }).horizontalAnim} onChange={(e) => update('horizontalAnim' as keyof EventSettings, e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">{EVENT_HORIZONTAL_ANIMS.map((a) => <option key={a.value} value={a.value} className="bg-zinc-900">{a.label}</option>)}</select></label>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Volume2 className="w-4 h-4 text-cyan-400" /> Suara - Beda per Event</h2>
        <div className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-3">
          {/* Join */}
          <div className="space-y-2 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2 text-white font-black text-[11px]"><UserPlus className="w-3 h-3 text-green-400" /> Join</div>
            <label className="flex items-center justify-between p-2 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Pakai Suara</span><input type="checkbox" checked={(state as unknown as { joinSoundEnabled: boolean }).joinSoundEnabled} onChange={(e) => update('joinSoundEnabled' as keyof EventSettings, e.target.checked)} className="w-4 h-4 accent-white" /></label>
            <label className="block"><span className="text-[10px] font-bold text-gray-300">URL</span><input value={(state as unknown as { joinSoundUrl: string }).joinSoundUrl} onChange={(e) => update('joinSoundUrl' as keyof EventSettings, e.target.value)} placeholder="https://.../join.mp3" className="mt-1 w-full h-8 bg-black/40 border border-white/10 rounded-xl px-2 text-[11px] font-mono text-white placeholder:text-gray-500" /></label>
            <label className="block"><span className="text-[10px] font-bold text-gray-300">Volume - {(state as unknown as { joinSoundVolume: number }).joinSoundVolume}%</span><input type="range" min={0} max={100} value={(state as unknown as { joinSoundVolume: number }).joinSoundVolume} onChange={(e) => update('joinSoundVolume' as keyof EventSettings, parseInt(e.target.value) || 80)} className="mt-1 w-full accent-white" /></label>
            <button onClick={() => { const a=new Audio((state as unknown as { joinSoundUrl: string }).joinSoundUrl); a.volume=(state as unknown as { joinSoundVolume: number }).joinSoundVolume/100; a.play().catch(()=>{}); }} className="w-full h-7 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white flex items-center justify-center gap-1.5"><Volume2 className="w-3 h-3" /> Test Join</button>
          </div>
          {/* Gift */}
          <div className="space-y-2 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2 text-white font-black text-[11px]"><Gift className="w-3 h-3 text-pink-400" /> Gift</div>
            <label className="flex items-center justify-between p-2 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Pakai Suara</span><input type="checkbox" checked={(state as unknown as { giftSoundEnabled: boolean }).giftSoundEnabled} onChange={(e) => update('giftSoundEnabled' as keyof EventSettings, e.target.checked)} className="w-4 h-4 accent-white" /></label>
            <label className="block"><span className="text-[10px] font-bold text-gray-300">URL</span><input value={(state as unknown as { giftSoundUrl: string }).giftSoundUrl} onChange={(e) => update('giftSoundUrl' as keyof EventSettings, e.target.value)} placeholder="https://.../gift.mp3" className="mt-1 w-full h-8 bg-black/40 border border-white/10 rounded-xl px-2 text-[11px] font-mono text-white placeholder:text-gray-500" /></label>
            <label className="block"><span className="text-[10px] font-bold text-gray-300">Volume - {(state as unknown as { giftSoundVolume: number }).giftSoundVolume}%</span><input type="range" min={0} max={100} value={(state as unknown as { giftSoundVolume: number }).giftSoundVolume} onChange={(e) => update('giftSoundVolume' as keyof EventSettings, parseInt(e.target.value) || 80)} className="mt-1 w-full accent-white" /></label>
            <button onClick={() => { const a=new Audio((state as unknown as { giftSoundUrl: string }).giftSoundUrl); a.volume=(state as unknown as { giftSoundVolume: number }).giftSoundVolume/100; a.play().catch(()=>{}); }} className="w-full h-7 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white flex items-center justify-center gap-1.5"><Volume2 className="w-3 h-3" /> Test Gift</button>
          </div>
          {/* Like */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-black text-[11px]"><Heart className="w-3 h-3 text-pink-400 fill-pink-400" /> Like</div>
            <label className="flex items-center justify-between p-2 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Pakai Suara</span><input type="checkbox" checked={(state as unknown as { likeSoundEnabled: boolean }).likeSoundEnabled} onChange={(e) => update('likeSoundEnabled' as keyof EventSettings, e.target.checked)} className="w-4 h-4 accent-white" /></label>
            <label className="block"><span className="text-[10px] font-bold text-gray-300">URL</span><input value={(state as unknown as { likeSoundUrl: string }).likeSoundUrl} onChange={(e) => update('likeSoundUrl' as keyof EventSettings, e.target.value)} placeholder="https://.../like.mp3" className="mt-1 w-full h-8 bg-black/40 border border-white/10 rounded-xl px-2 text-[11px] font-mono text-white placeholder:text-gray-500" /></label>
            <label className="block"><span className="text-[10px] font-bold text-gray-300">Volume - {(state as unknown as { likeSoundVolume: number }).likeSoundVolume}%</span><input type="range" min={0} max={100} value={(state as unknown as { likeSoundVolume: number }).likeSoundVolume} onChange={(e) => update('likeSoundVolume' as keyof EventSettings, parseInt(e.target.value) || 80)} className="mt-1 w-full accent-white" /></label>
            <button onClick={() => { const a=new Audio((state as unknown as { likeSoundUrl: string }).likeSoundUrl); a.volume=(state as unknown as { likeSoundVolume: number }).likeSoundVolume/100; a.play().catch(()=>{}); }} className="w-full h-7 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white flex items-center justify-center gap-1.5"><Volume2 className="w-3 h-3" /> Test Like</button>
          </div>
          <div className="text-[10px] text-gray-500 bg-black/30 rounded-xl p-2 border border-white/5">Masing-masing event punya suara terpisah • OBS Browser Source perlu centang <b className="text-white">Control audio via OBS</b></div>
        </div>
      </div>

      <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-3">
        <div className="text-violet-300 font-black uppercase text-[10px]">Sumber Event</div>
        <div className="text-gray-400 text-[11px] leading-relaxed mt-1">Join <code className="bg-white/10 px-1 rounded text-white">tiktok-member</code> • Gift <code className="bg-white/10 px-1 rounded text-white">tiktok-gift</code> • Like <code className="bg-white/10 px-1 rounded text-white">tiktok-like</code> dari <code className="bg-white/10 px-1 rounded text-white">server.ts</code> via TikTok Live + Streamer.bot. Suara Join diputar di OBS (allow audio).</div>
        <Link href={privateKey ? `/dock?key=${privateKey}` : '/dock'} className="mt-2 h-8 flex items-center justify-center gap-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase"><Monitor className="w-3 h-3" /> Buka Dock - Connect TikTok</Link>
      </div>

      <div className="flex gap-2">
        <button onClick={reset} className="flex-1 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-black uppercase text-gray-300">Reset</button>
        <button onClick={onCopy} className="flex-1 h-9 bg-white hover:bg-zinc-100 rounded-xl text-black font-black text-[11px] uppercase flex items-center justify-center gap-1.5 border border-white"><Copy className="w-3.5 h-3.5" /> Copy URL</button>
      </div>
    </>
  );
}
