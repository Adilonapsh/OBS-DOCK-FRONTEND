'use client';

type Props = {
  state: Record<string, unknown>;
  update: (k: string, v: unknown) => void;
};

// Section settings khusus tema Vinyl Disc (media-player & music request),
// pola sama seperti BrutalistSettingsSection: toggle + slider.
export function VinylDiscSettingsSection({ state, update }: Props) {
  const showTonearm = (state.showTonearm as boolean) !== false;
  const showTextRing = (state.showTextRing as boolean) !== false;
  const spin = (state.vinylDiscSpin as number) ?? 35;

  return (
    <div className="space-y-3">
      <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"> Vinyl Disc</h2>
      <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
            <span className="text-[11px] font-bold text-white">Tonearm <span className="text-[9px] font-normal text-gray-400 block">Jarum piringan</span></span>
            <input type="checkbox" checked={showTonearm} onChange={(e) => update('showTonearm', e.target.checked)} className="w-4 h-4 accent-white shrink-0" />
          </label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
            <span className="text-[11px] font-bold text-white">Text Ring <span className="text-[9px] font-normal text-gray-400 block">Teks melingkar</span></span>
            <input type="checkbox" checked={showTextRing} onChange={(e) => update('showTextRing', e.target.checked)} className="w-4 h-4 accent-white shrink-0" />
          </label>
        </div>
        <label className="block">
          <span className="text-[11px] font-bold text-gray-300">Kecepatan Putaran — {spin}s/putaran</span>
          <input type="range" min={5} max={120} step={1} value={spin} onChange={(e) => update('vinylDiscSpin', parseInt(e.target.value) || 35)} className="mt-1 w-full accent-white cursor-pointer" />
        </label>
      </div>
    </div>
  );
}
