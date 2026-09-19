import type { MediaThemeProps } from './types';
import './ColorPalette.css';

export default function ColorPaletteTheme(props: MediaThemeProps) {
  const { palette, progressPercent, showProgressBar } = props;
  const colors = Object.values(palette).slice(0, 5);
  return (
    <div className="color-palette-theme rounded-2xl overflow-hidden shadow-xl flex flex-col p-2" style={{ background: '#0f0f0f' }}>
      {/* 5 palette bars stacked top->bottom, width = progress, hanya progress (tanpa cover art & time) */}
      <div className="flex flex-col gap-2">
        {colors.map((c, i) => (
          <div key={`${c}-${i}`} className="h-[100px] overflow-hidden relative">
            <div
              className="h-full transition-all duration-200 ease-linear"
              style={{ width: showProgressBar ? `${progressPercent}%` : '100%', background: c }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
