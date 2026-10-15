'use client';
import { FLATLINE_PRESETS } from '../constants/flatline';

type Props = {
  state: Record<string, unknown>;
  update: (k: string, v: unknown) => void;
};

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
  return (
    <label className="block min-w-0">
      <span className="text-[11px] font-bold text-gray-300 block truncate" title={label}>
        {label}
      </span>
      <div className="mt-1 flex items-center gap-1.5 min-w-0">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10 shrink-0 cursor-pointer"
        />
        <input
          type="text"
          size={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-white/30"
        />
      </div>
    </label>
  );
}

export function FlatlineSettingsSection({ state, update }: Props) {
  const card = (state.flatlineCard as string) || '#24283b';
  const hours = (state.flatlineHours as string) || '#ffb5f0';
  const minutes = (state.flatlineMinutes as string) || '#baa9ff';
  const days = (state.flatlineDays as string) || '#ffd166';
  const seconds = (state.flatlineSeconds as string) || '#a7f3d0';
  const bubble = (state.flatlineBubble as string) || '#f4d3a1';
  const badge = (state.flatlineBadge as string) || '#1a1d2d';
  const backText = (state.flatlineBackText as string) || '#dda5d0';
  const pageBg = (state.flatlinePageBg as string) || '#8c90d5';
  const showBubbles = (state.flatlineShowBubbles as boolean) ?? true;
  const showBack = (state.flatlineShowBack as boolean) ?? true;
  const tilt = (state.flatlineTilt as number) ?? 8;
  const layout = (state.flatlineLayout as string) || 'vertical';

  return (
    <div className="space-y-3">
      <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2">Flatline — Sticker Cards</h2>
      <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
        <div>
          <span className="text-[11px] font-bold text-gray-300">Preset Cepat</span>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {FLATLINE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  update('flatlineCard', preset.card);
                  update('flatlineHours', preset.hours);
                  update('flatlineMinutes', preset.minutes);
                  update('flatlineDays', preset.days);
                  update('flatlineSeconds', preset.seconds);
                  update('flatlineBubble', preset.bubble);
                  update('flatlineBadge', preset.badge);
                  update('flatlineBackText', preset.backText);
                  update('flatlinePageBg', preset.page);
                }}
                className="p-2 text-[10px] font-black rounded-xl border border-white/10 hover:opacity-90"
                style={{ background: preset.card, color: preset.hours }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold text-gray-300">Text Color — Hari, Jam, Menit & Detik (angka besar)</span>
          <div className="mt-1 grid grid-cols-2 gap-2.5 sm:gap-3">
            <ColorField label="Days (kuning)" value={days} onChange={(val) => update('flatlineDays', val)} />
            <ColorField label="Hours (pink)" value={hours} onChange={(val) => update('flatlineHours', val)} />
            <ColorField label="Minutes (ungu)" value={minutes} onChange={(val) => update('flatlineMinutes', val)} />
            <ColorField label="Seconds (mint)" value={seconds} onChange={(val) => update('flatlineSeconds', val)} />
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold text-gray-300">Background Color — Kartu & Page</span>
          <div className="mt-1 grid grid-cols-2 gap-2.5 sm:gap-3">
            <ColorField label="Card (navy)" value={card} onChange={(val) => update('flatlineCard', val)} />
            <ColorField label="Page BG (preview)" value={pageBg} onChange={(val) => update('flatlinePageBg', val)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <ColorField label="Bubble (cream)" value={bubble} onChange={(val) => update('flatlineBubble', val)} />
          <ColorField label="Badge (HRS/MIN)" value={badge} onChange={(val) => update('flatlineBadge', val)} />
        </div>
        <div className="grid grid-cols-1 gap-2.5">
          <ColorField label="Back Text (FLATLINE…)" value={backText} onChange={(val) => update('flatlineBackText', val)} />
        </div>

        <label className="block">
          <span className="text-[11px] font-bold text-gray-300">Kemiringan Kartu Belakang — {tilt}°</span>
          <input type="range" min={0} max={16} value={tilt} onChange={(e) => update('flatlineTilt', parseInt(e.target.value) || 0)} className="mt-1 w-full accent-white cursor-pointer" />
        </label>

        <div>
          <span className="text-[11px] font-bold text-gray-300">Layout — Arah Tampilan</span>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {(['vertical', 'horizontal'] as const).map((l) => {
              const active = layout === l;
              return (
                <button
                  key={l}
                  onClick={() => update('flatlineLayout', l)}
                  className={`h-9 rounded-xl text-[10px] font-black uppercase border ${active ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}
                >
                  {l === 'vertical' ? 'Vertical' : 'Horizontal'}
                  <span className={`block text-[8px] font-bold normal-case tracking-normal ${active ? 'text-black/60' : 'text-gray-500'}`}>
                    {l === 'vertical' ? 'atas – bawah' : 'samping (HH : MM)'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
            <span className="text-[11px] font-bold text-white">Bubbles 2X/+10s</span>
            <input type="checkbox" checked={showBubbles} onChange={(e) => update('flatlineShowBubbles', e.target.checked)} className="w-4 h-4 accent-white" />
          </label>
          <label className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
            <span className="text-[11px] font-bold text-white">Back Card</span>
            <input type="checkbox" checked={showBack} onChange={(e) => update('flatlineShowBack', e.target.checked)} className="w-4 h-4 accent-white" />
          </label>
        </div>
        <p className="text-[10px] text-gray-500">DD = hari (muncul otomatis kalau timer ≥ 24 jam). Vertikal: detik di pill bawah. Horizontal: full inline HH : MM : SS. Bubble delta cuma muncul pas ada tambah/kurang waktu. Page BG cuma buat preview — di OBS tetap transparan.</p>
      </div>
    </div>
  );
}
