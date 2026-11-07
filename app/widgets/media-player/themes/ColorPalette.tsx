import type { MediaThemeProps } from './types';
import { shadeHex } from '../../_shared/utils/color';
import './ColorPalette.css';

// Urutan balok = urutan swatch node-vibrant. Nama dipakai untuk label opsional
// (showPaletteLabels) agar warna yang diekstrak dari thumbnail mudah dibaca.
const SWATCHES = [
  { name: 'Vibrant', key: 'Vibrant' },
  { name: 'Muted', key: 'Muted' },
  { name: 'Dark Vibrant', key: 'DarkVibrant' },
  { name: 'Dark Muted', key: 'DarkMuted' },
  { name: 'Light Vibrant', key: 'LightVibrant' },
] as const;

export default function ColorPaletteTheme(props: MediaThemeProps) {
  const { palette, progressPercent, showProgressBar, showPaletteLabels } = props;
  const colors = SWATCHES.map((s) => ({ name: s.name, color: palette[s.key] }));
  return (
    <div className="color-palette-theme rounded-2xl overflow-hidden shadow-xl flex flex-col p-2" style={{ background: '#0f0f0f' }}>
      {/* 5 palette bars stacked top->bottom, width = progress, hanya progress (tanpa cover art & time) */}
      <div className="flex flex-col gap-2">
        {colors.map(({ name, color }, i) => (
          <div key={`${color}-${i}`} className="h-[100px] overflow-hidden relative">
            <div
              className="h-full transition-all duration-200 ease-linear"
              style={{ width: showProgressBar ? `${progressPercent}%` : '100%', background: color }}
            />
            {showPaletteLabels && (
              <div className="absolute inset-0 flex items-center px-3">
                {/* Semua label di kiri; warna teks = swatch tapi digelapkan agar tidak menyilaukan. */}
                <span className="inline-flex items-baseline gap-2 px-2.5 py-1 rounded-md bg-white/85 shadow-sm backdrop-blur-sm" style={{ color: shadeHex(color, 0.55) }}>
                  <span className="text-[10px] font-black uppercase tracking-widest">{name}</span>
                  <span className="text-[10px] font-mono font-bold tabular-nums">{String(color || '').toUpperCase()}</span>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
