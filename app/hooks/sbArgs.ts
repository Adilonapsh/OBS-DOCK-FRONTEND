'use client';

// Resolve template params ke args final untuk DoAction Streamer.bot.
// params: key -> template string. Placeholder {namaField} diganti dari base.
// Contoh: params { text: "@{nickname}: {comment}" } + base { nickname:"A", comment:"halo" }
//   => args { nickname:"A", comment:"halo", text:"@A: halo" }
// Key yang tidak ada di template tetap dikirim dari base. Template menimpa/menambah key.
export function resolveSbArgs(
  base: Record<string, unknown>,
  params?: Record<string, string>,
): Record<string, unknown> {
  if (!params || typeof params !== 'object') return { ...base };
  const out: Record<string, unknown> = { ...base };
  for (const [k, raw] of Object.entries(params)) {
    const key = String(k || '').trim();
    if (!key) continue;
    const tpl = String(raw ?? '');
    if (!tpl) continue;
    out[key] = tpl.replace(/\{(\w+)\}/g, (_m, field: string) => {
      const v = base[field];
      if (v === undefined || v === null) return '';
      return String(v);
    });
  }
  return out;
}

// Bersihkan params mentah (dari DB/localStorage) jadi Record<string,string>.
export function sanitizeParams(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      const key = String(k || '').trim();
      if (!key || key.length > 40) continue;
      if (typeof v !== 'string') continue;
      if (!v) continue;
      out[key] = v.slice(0, 300);
    }
  }
  return out;
}
