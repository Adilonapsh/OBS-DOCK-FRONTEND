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

      {/* Plain Border Opsi */}
      {state.theme === 'plain' && (
        <div className="space-y-3">
          <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-white" /> Border Teks — Plain</h2>
          <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
            <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
              <span className="text-[11px] font-bold text-white flex items-center gap-2">
                Aktifkan Border Teks
                <span className="text-[9px] font-normal text-gray-400 block sm:inline ml-1">Kontras untuk OBS</span>
              </span>
              <input
                type="checkbox"
                checked={!!(state as unknown as { plainTextBorder?: boolean }).plainTextBorder}
                onChange={(e) => update('plainTextBorder' as unknown as keyof ChatSettings, e.target.checked)}
                className="w-4 h-4 accent-white shrink-0"
              />
            </label>
            {(state as unknown as { plainTextBorder?: boolean }).plainTextBorder && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[11px] font-bold text-gray-300">Warna Border</span>
                    <span className="mt-1 flex gap-2">
                      <input
                        type="color"
                        value={(state as unknown as { plainBorderColor?: string }).plainBorderColor || '#000000'}
                        onChange={(e) => update('plainBorderColor' as unknown as keyof ChatSettings, e.target.value)}
                        className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10 shrink-0"
                      />
                      <input
                        type="text"
                        value={(state as unknown as { plainBorderColor?: string }).plainBorderColor || '#000000'}
                        onChange={(e) => update('plainBorderColor' as unknown as keyof ChatSettings, e.target.value)}
                        className="flex-1 h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono"
                      />
                    </span>
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-bold text-gray-300">Ketebalan — {(state as unknown as { plainBorderWidth?: number }).plainBorderWidth ?? 1}px</span>
                    <input
                      type="range"
                      min={0}
                      max={3}
                      step={0.5}
                      value={(state as unknown as { plainBorderWidth?: number }).plainBorderWidth ?? 1}
                      onChange={(e) => update('plainBorderWidth' as unknown as keyof ChatSettings, parseFloat(e.target.value))}
                      className="mt-1 w-full accent-white cursor-pointer"
                    />
                  </label>
                </div>
                <p className="text-[10px] text-gray-500">Border pakai <code className="bg-white/10 px-1 rounded text-white">WebkitTextStroke</code> + shadow, biar teks plain tetap kebaca di video terang/gelap tanpa bubble.</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Brutalist - Neo Brutalist */}
      {state.theme === 'brutalist' && (
        <div className="space-y-3">
          <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-yellow-400" /> Brutalist — Neo Brutalist</h2>
          <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
            <div>
              <span className="text-[11px] font-bold text-gray-300">Preset Cepat</span>
              <div className="mt-1 grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    update('brutalistBg' as any, '#FFFFFF');
                    update('brutalistTextColor' as any, '#000000');
                    update('brutalistBadgeBg' as any, '#FFFFFF');
                    update('brutalistBorderColor' as any, '#000000');
                  }}
                  className="p-2 bg-white text-black text-[10px] font-black border-2 border-black hover:bg-zinc-100"
                >
                  Classic White
                </button>
                <button
                  onClick={() => {
                    update('brutalistBg' as any, '#FFE600');
                    update('brutalistTextColor' as any, '#000000');
                    update('brutalistBadgeBg' as any, '#00E5FF');
                    update('brutalistBorderColor' as any, '#000000');
                  }}
                  className="p-2 bg-[#FFE600] text-black text-[10px] font-black border-2 border-black"
                >
                  Cyber Yellow
                </button>
                <button
                  onClick={() => {
                    update('brutalistBg' as any, '#FF6B8B');
                    update('brutalistTextColor' as any, '#FFFFFF');
                    update('brutalistBadgeBg' as any, '#000000');
                    update('brutalistBorderColor' as any, '#000000');
                  }}
                  className="p-2 bg-[#FF6B8B] text-black text-[10px] font-black border-2 border-black"
                >
                  Pop Pink
                </button>
                <button
                  onClick={() => {
                    update('brutalistBg' as any, '#18181B');
                    update('brutalistTextColor' as any, '#FFFFFF');
                    update('brutalistBadgeBg' as any, '#FFE600');
                    update('brutalistBorderColor' as any, '#000000');
                  }}
                  className="p-2 bg-black text-white text-[10px] font-black border-2 border-white"
                >
                  Manga Dark
                </button>
                <button
                  onClick={() => {
                    update('brutalistBg' as any, '#00F5D4');
                    update('brutalistTextColor' as any, '#000000');
                    update('brutalistBadgeBg' as any, '#FFFFFF');
                    update('brutalistBorderColor' as any, '#000000');
                  }}
                  className="p-2 bg-[#00F5D4] text-black text-[10px] font-black border-2 border-black"
                >
                  Vibrant Mint
                </button>
                <button
                  onClick={() => {
                    update('brutalistBg' as any, '#9D4EDD');
                    update('brutalistTextColor' as any, '#FFFFFF');
                    update('brutalistBadgeBg' as any, '#00E5FF');
                    update('brutalistBorderColor' as any, '#000000');
                  }}
                  className="p-2 bg-[#9D4EDD] text-white text-[10px] font-black border-2 border-black"
                >
                  Neo Violet
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[11px] font-bold text-gray-300">Bubble Background</span>
                <span className="mt-1 flex gap-2">
                  <input type="color" value={(state as any).brutalistBg || '#FFFFFF'} onChange={(e) => update('brutalistBg' as any, e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10 shrink-0" />
                  <input type="text" value={(state as any).brutalistBg || '#FFFFFF'} onChange={(e) => update('brutalistBg' as any, e.target.value)} className="flex-1 h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
                </span>
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-gray-300">Text Color</span>
                <span className="mt-1 flex gap-2">
                  <input type="color" value={(state as any).brutalistTextColor || '#000000'} onChange={(e) => update('brutalistTextColor' as any, e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10 shrink-0" />
                  <input type="text" value={(state as any).brutalistTextColor || '#000000'} onChange={(e) => update('brutalistTextColor' as any, e.target.value)} className="flex-1 h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
                </span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[11px] font-bold text-gray-300">Badge BG</span>
                <span className="mt-1 flex gap-2">
                  <input type="color" value={(state as any).brutalistBadgeBg || '#FFFFFF'} onChange={(e) => update('brutalistBadgeBg' as any, e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10 shrink-0" />
                  <input type="text" value={(state as any).brutalistBadgeBg || '#FFFFFF'} onChange={(e) => update('brutalistBadgeBg' as any, e.target.value)} className="flex-1 h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
                </span>
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-gray-300">Border Color</span>
                <span className="mt-1 flex gap-2">
                  <input type="color" value={(state as any).brutalistBorderColor || '#000000'} onChange={(e) => update('brutalistBorderColor' as any, e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10 shrink-0" />
                  <input type="text" value={(state as any).brutalistBorderColor || '#000000'} onChange={(e) => update('brutalistBorderColor' as any, e.target.value)} className="flex-1 h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono" />
                </span>
              </label>
            </div>
            <label className="block">
              <span className="text-[11px] font-bold text-gray-300">Shadow Offset — {(state as any).brutalistShadow ?? 6}px</span>
              <input type="range" min={0} max={14} value={(state as any).brutalistShadow ?? 6} onChange={(e) => update('brutalistShadow' as any, parseInt(e.target.value) || 6)} className="mt-1 w-full accent-white cursor-pointer" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
                <span className="text-[11px] font-bold text-white">Halftone Dots</span>
                <input type="checkbox" checked={(state as any).brutalistHalftone ?? true} onChange={(e) => update('brutalistHalftone' as any, e.target.checked)} className="w-4 h-4 accent-white" />
              </label>
              <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
                <span className="text-[11px] font-bold text-white">Bubble Tail</span>
                <input type="checkbox" checked={(state as any).brutalistTail ?? true} onChange={(e) => update('brutalistTail' as any, e.target.checked)} className="w-4 h-4 accent-white" />
              </label>
              <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
                <span className="text-[11px] font-bold text-white">Italic</span>
                <input type="checkbox" checked={(state as any).brutalistItalic ?? true} onChange={(e) => update('brutalistItalic' as any, e.target.checked)} className="w-4 h-4 accent-white" />
              </label>
              <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
                <span className="text-[11px] font-bold text-white">UPPERCASE</span>
                <input type="checkbox" checked={(state as any).brutalistUppercase ?? true} onChange={(e) => update('brutalistUppercase' as any, e.target.checked)} className="w-4 h-4 accent-white" />
              </label>
            </div>
          </div>
        </div>
      )}

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
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Teks Chat</span><div className="mt-1 flex gap-1"><input type="color" value={state.textColor || '#ffffff'} onChange={(e) => update('textColor', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10" /><button onClick={() => update('textColor', '')} className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase border ${!state.textColor ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>Auto</button></div></label>
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
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Teks Chat</span><div className="mt-1 flex gap-1"><input type="color" value={state.textColor || '#ffffff'} onChange={(e) => update('textColor', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10" /><button onClick={() => update('textColor', '')} className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase border ${!state.textColor ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>Auto</button></div><span className="text-[10px] text-gray-500">Auto = bawaan tiap tema</span></label>
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
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Badge Role <span className="text-[9px] font-normal text-gray-400 block">Mod / Sub / VIP / Member (Twitch & YouTube)</span></span><input type="checkbox" checked={state.showBadges} onChange={(e) => update('showBadges', e.target.checked)} className="w-4 h-4 accent-white shrink-0" /></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Emote BetterTTV <span className="text-[9px] font-normal text-gray-400 block">Global BTTV + emote channel dari Streamer.bot</span></span><input type="checkbox" checked={state.bttv} onChange={(e) => update('bttv', e.target.checked)} className="w-4 h-4 accent-white shrink-0" /></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Inline chat <span className="text-[9px] font-normal text-gray-400 block">nickname: pesan sebaris</span></span><input type="checkbox" checked={state.inline} onChange={(e) => update('inline', e.target.checked)} className="w-4 h-4 accent-white shrink-0" /></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer bg-cyan-500/5"><span className="text-[11px] font-bold text-white">Horizontal layout <span className="text-[9px] font-normal text-gray-400 block">Pills sebaris (inline) untuk bottom bar — set Posisi ke Bottom</span></span><input type="checkbox" checked={state.horizontal} onChange={(e) => update('horizontal', e.target.checked)} className="w-4 h-4 accent-white shrink-0" /></label>
          {state.horizontal && (
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Animasi Horizontal</span><select value={state.horizontalAnim} onChange={(e) => update('horizontalAnim', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white">{CHAT_HORIZONTAL_ANIMS.map((a) => <option key={a.value} value={a.value} className="bg-zinc-900">{a.label}</option>)}</select></label>
          )}
        </div>
      </div>

      {/* Appearance tambahan (nutty-compatible) */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-amber-300" /> Tampilan Chat</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Username</span><input type="checkbox" checked={state.showUsername} onChange={(e) => update('showUsername', e.target.checked)} className="w-4 h-4 accent-white" /></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Pesan <span className="text-[9px] font-normal text-gray-400 block">Matikan = hanya nama yang tampil</span></span><input type="checkbox" checked={state.showMessage} onChange={(e) => update('showMessage', e.target.checked)} className="w-4 h-4 accent-white shrink-0" /></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Pronouns <span className="text-[9px] font-normal text-gray-400 block">Kompatibilitas URL nutty (belum ada data)</span></span><input type="checkbox" checked={state.showPronouns} onChange={(e) => update('showPronouns', e.target.checked)} className="w-4 h-4 accent-white shrink-0" /></label>
          {state.showTimestamp && (
            <label className="block"><span className="text-[11px] font-bold text-gray-300">Format Jam</span><select value={state.timeFormat} onChange={(e) => update('timeFormat', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white"><option value="24-hour" className="bg-zinc-900">24 Jam (14:30)</option><option value="12-hour" className="bg-zinc-900">12 Jam (2:30 PM)</option></select></label>
          )}
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Jarak Baris Pesan - {Number(state.lineSpacing).toFixed(1)}</span><input type="range" min={0.8} max={3} step={0.1} value={Number(state.lineSpacing)} onChange={(e) => update('lineSpacing', parseFloat(e.target.value))} className="mt-1 w-full accent-white" /></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Chat Bubbles (override) <span className="text-[9px] font-normal text-gray-400 block">Timpa background tema dengan warna custom</span></span><input type="checkbox" checked={state.useChatBubbles} onChange={(e) => update('useChatBubbles', e.target.checked)} className="w-4 h-4 accent-white shrink-0" /></label>
          {state.useChatBubbles && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="text-[11px] font-bold text-gray-300">Bubble Color</span><input type="color" value={state.bubbleColor} onChange={(e) => update('bubbleColor', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" /></label>
              <label className="block"><span className="text-[11px] font-bold text-gray-300">Bubble Opacity - {state.bubbleOpacity}</span><input type="number" min={0} max={1} step={0.05} value={Number(state.bubbleOpacity)} onChange={(e) => update('bubbleOpacity', parseFloat(e.target.value))} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
            </div>
          )}
        </div>
      </div>

      {/* General */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><MessageSquare className="w-4 h-4 text-lime-300" /> General</h2>
        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Exclude Commands <span className="text-[9px] font-normal text-gray-400 block">Sembunyikan pesan diawali &quot;!&quot;</span></span><input type="checkbox" checked={state.excludeCommands} onChange={(e) => update('excludeCommands', e.target.checked)} className="w-4 h-4 accent-white shrink-0" /></label>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Ignore Chatters <span className="text-[9px] font-normal text-gray-400"> — pisahkan koma (cth: StreamElements,Streamlabs)</span></span><input type="text" value={state.ignoreChatters} onChange={(e) => update('ignoreChatters', e.target.value)} placeholder="StreamElements,Streamlabs" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" /></label>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Scroll Direction</span><select value={state.scrollDirection} onChange={(e) => update('scrollDirection', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white"><option value="1" className="bg-zinc-900">Normal (baru di bawah)</option><option value="2" className="bg-zinc-900">Reversed (baru di atas)</option></select></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Group Consecutive <span className="text-[9px] font-normal text-gray-400 block">Sembunyikan username bila user sama beruntun (diabaikan saat Reversed)</span></span><input type="checkbox" checked={state.groupConsecutiveMessages} onChange={(e) => update('groupConsecutiveMessages', e.target.checked)} className="w-4 h-4 accent-white shrink-0" /></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">Highlight Mentions <span className="text-[9px] font-normal text-gray-400 block">Tandai pesan berisi @mention</span></span><input type="checkbox" checked={state.highlightMentions} onChange={(e) => update('highlightMentions', e.target.checked)} className="w-4 h-4 accent-white shrink-0" /></label>
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Embed Images (izin)</span><select value={state.imageEmbedPermissionLevel} onChange={(e) => update('imageEmbedPermissionLevel', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white"><option value="40" className="bg-zinc-900">Broadcaster</option><option value="30" className="bg-zinc-900">Mods &amp; Broadcaster</option><option value="20" className="bg-zinc-900">VIPs, Mods &amp; Broadcaster</option><option value="15" className="bg-zinc-900">Subs, VIPs, Mods &amp; Broadcaster</option><option value="10" className="bg-zinc-900">Everyone</option><option value="69420" className="bg-zinc-900">Nobody (mati)</option></select></label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer"><span className="text-[11px] font-bold text-white">YouTube Link Previews</span><input type="checkbox" checked={state.showYouTubeLinkPreviews} onChange={(e) => update('showYouTubeLinkPreviews', e.target.checked)} className="w-4 h-4 accent-white" /></label>
        </div>
      </div>

      {/* Filter Twitch */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-violet-400" /> Twitch</h2>
        <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-3">
          <ToggleRow label="Chat Messages" checked={state.showTwitchMessages} onChange={(v) => update('showTwitchMessages', v)} />
          <ToggleRow label="Cheers" checked={state.showTwitchCheers} onChange={(v) => update('showTwitchCheers', v)} />
          <ToggleRow label="Announcements" checked={state.showTwitchAnnouncements} onChange={(v) => update('showTwitchAnnouncements', v)} />
          <ToggleRow label="New Followers" checked={state.showTwitchFollows} onChange={(v) => update('showTwitchFollows', v)} />
          <ToggleRow label="New Subscribers" checked={state.showTwitchSubs} onChange={(v) => update('showTwitchSubs', v)} />
          <ToggleRow label="Channel Point Redemptions" checked={state.showTwitchChannelPointRedemptions} onChange={(v) => update('showTwitchChannelPointRedemptions', v)} />
          <ToggleRow label="Power-Up Redemptions" checked={state.showTwitchPowerUpRedemptions} onChange={(v) => update('showTwitchPowerUpRedemptions', v)} />
          <ToggleRow label="Raids" checked={state.showTwitchRaids} onChange={(v) => update('showTwitchRaids', v)} />
          <ToggleRow label="Watch Streaks" checked={state.showTwitchWatchStreaks} onChange={(v) => update('showTwitchWatchStreaks', v)} />
          <ToggleRow label="GIFs (Tier 2/3)" checked={state.showTwitchGIFs} onChange={(v) => update('showTwitchGIFs', v)} />
          <label className="block"><span className="text-[11px] font-bold text-gray-300">Shared Chat</span><select value={state.showTwitchSharedChat} onChange={(e) => update('showTwitchSharedChat', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white"><option value="2" className="bg-zinc-900">Show &amp; Highlight</option><option value="1" className="bg-zinc-900">Show but do not highlight</option><option value="0" className="bg-zinc-900">Do not show</option></select></label>
          <p className="text-[10px] text-gray-500">Catatan: widget chat hanya menerima <code className="bg-white/10 px-1 rounded text-white">tiktok-chat</code> (pesan chat). Event cheer/sub/raid masuk ke widget gift/event bila ada.</p>
        </div>
      </div>

      {/* Filter YouTube */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-red-400" /> YouTube</h2>
        <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-3">
          <ToggleRow label="Chat Messages" checked={state.showYouTubeMessages} onChange={(v) => update('showYouTubeMessages', v)} />
          <ToggleRow label="Super Chats" checked={state.showYouTubeSuperChats} onChange={(v) => update('showYouTubeSuperChats', v)} />
          <ToggleRow label="Super Stickers" checked={state.showYouTubeSuperStickers} onChange={(v) => update('showYouTubeSuperStickers', v)} />
          <ToggleRow label="Jewels Gifted" checked={state.showYouTubeJewelsGifted} onChange={(v) => update('showYouTubeJewelsGifted', v)} />
          <ToggleRow label="New Subscribers" checked={state.showYouTubeSubscribers} onChange={(v) => update('showYouTubeSubscribers', v)} />
          <ToggleRow label="Memberships" checked={state.showYouTubeMemberships} onChange={(v) => update('showYouTubeMemberships', v)} />
        </div>
      </div>

      {/* Filter Kick */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-green-400" /> Kick</h2>
        <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-3">
          <ToggleRow label="Chat Messages" checked={state.showKickMessages} onChange={(v) => update('showKickMessages', v)} />
          <ToggleRow label="New Followers" checked={state.showKickFollows} onChange={(v) => update('showKickFollows', v)} />
          <ToggleRow label="New Subscribers" checked={state.showKickSubs} onChange={(v) => update('showKickSubs', v)} />
          <ToggleRow label="Channel Point Redemptions" checked={state.showKickChannelPointRedemptions} onChange={(v) => update('showKickChannelPointRedemptions', v)} />
          <ToggleRow label="Hosts" checked={state.showKickHosts} onChange={(v) => update('showKickHosts', v)} />
          <ToggleRow label="Gifts" checked={state.showKickGifts} onChange={(v) => update('showKickGifts', v)} />
        </div>
      </div>

      {/* Filter TikTok — sumber tetap sama */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-pink-400" /> TikTok</h2>
        <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-3">
          <ToggleRow label="Enable TikTok Support" checked={state.enableTikTokSupport} onChange={(v) => update('enableTikTokSupport', v)} />
          <ToggleRow label="Chat Messages" checked={state.showTikTokMessages} onChange={(v) => update('showTikTokMessages', v)} />
          <ToggleRow label="New Followers" checked={state.showTikTokFollows} onChange={(v) => update('showTikTokFollows', v)} />
          <ToggleRow label="Likes" checked={state.showTikTokLikes} onChange={(v) => update('showTikTokLikes', v)} />
          <ToggleRow label="Gifts" checked={state.showTikTokGifts} onChange={(v) => update('showTikTokGifts', v)} />
          <ToggleRow label="New Subscribers" checked={state.showTikTokSubs} onChange={(v) => update('showTikTokSubs', v)} />
        </div>
      </div>

      {/* Donasi + Fun */}
      <div className="space-y-3">
        <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Copy className="w-4 h-4 text-yellow-300" /> Donasi & Lainnya</h2>
        <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-3">
          <ToggleRow label="Streamlabs Tips" checked={state.showStreamlabsDonations} onChange={(v) => update('showStreamlabsDonations', v)} />
          <ToggleRow label="StreamElements Tips" checked={state.showStreamElementsTips} onChange={(v) => update('showStreamElementsTips', v)} />
          <ToggleRow label="Patreon Memberships" checked={state.showPatreonMemberships} onChange={(v) => update('showPatreonMemberships', v)} />
          <ToggleRow label="Ko-fi Donations" checked={state.showKofiDonations} onChange={(v) => update('showKofiDonations', v)} />
          <ToggleRow label="TipeeeStream Donations" checked={state.showTipeeeStreamDonations} onChange={(v) => update('showTipeeeStreamDonations', v)} />
          <ToggleRow label="Fourthwall Alerts" checked={state.showFourthwallAlerts} onChange={(v) => update('showFourthwallAlerts', v)} />
          <ToggleRow label="Skip Fourthwall Free Orders" checked={state.skipFourthwallFreeOrders} onChange={(v) => update('skipFourthwallFreeOrders', v)} />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={reset} className="flex-1 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-black uppercase text-gray-300">Reset</button>
        <button onClick={onCopy} className="flex-1 h-9 bg-white hover:bg-zinc-100 rounded-xl text-black font-black text-[11px] uppercase flex items-center justify-center gap-1.5 border border-white"><Copy className="w-3.5 h-3.5" /> Copy URL</button>
      </div>
    </>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
      <span className="text-[11px] font-bold text-white">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-white shrink-0" />
    </label>
  );
}
