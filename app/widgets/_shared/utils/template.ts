// Simple mustache-like template - {{username}} {{message}} {{date}} {{timer}} {{clock}} {{polls}} etc.
// WordPress-like: user tinggal drag {{variable}} ke editor, preview langsung render.

export type TemplateData = Record<string, string | number | boolean | null | undefined>;

const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;

// Known variables - dipakai untuk drag-drop palette & docs
export const TEMPLATE_VARS = [
  { key: 'username', label: 'Username', example: 'Rizky_JR', desc: 'Nama user chat' },
  { key: 'message', label: 'Message', example: 'Halo bang!', desc: 'Isi chat' },
  { key: 'handle', label: 'Handle', example: '@adilonapsh', desc: 'Handle sosial' },
  { key: 'platform', label: 'Platform', example: 'tiktok', desc: 'Platform sosial / chat' },
  { key: 'label', label: 'Label', example: 'TikTok', desc: 'Label platform' },
  { key: 'date', label: 'Date', example: new Date().toLocaleDateString('id-ID'), desc: 'Tanggal hari ini' },
  { key: 'time', label: 'Time', example: new Date().toLocaleTimeString('id-ID'), desc: 'Jam sekarang' },
  { key: 'clock', label: 'Clock', example: '06:40:06 PM', desc: 'Jam format hh:mm:ss' },
  { key: 'timer', label: 'Timer', example: '13:20', desc: 'Sisa timer mm:ss' },
  { key: 'polls', label: 'Polls', example: 'Mana turnamen? 42% ML', desc: 'Ringkasan poll' },
  { key: 'accent', label: 'Accent', example: '#8b5cf6', desc: 'Warna accent' },
] as const;

export function renderTemplate(template: string, data: TemplateData): string {
  if (!template) return '';
  return template.replace(PLACEHOLDER_RE, (_, key: string) => {
    const v = data[key] ?? data[key.toLowerCase()] ?? '';
    if (v === null || v === undefined) return '';
    return String(v);
  });
}

export function extractVariables(template: string): string[] {
  const vars = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(PLACEHOLDER_RE.source, 'g');
  while ((m = re.exec(template)) !== null) vars.add(m[1]);
  return Array.from(vars);
}

// Sanitize html - allow basic tags, strip script
export function sanitizeHtml(html: string): string {
  // very light: remove <script>, on* attributes
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\s+on\w+\s*=\s*(["']).*?\1/gi, '')
    .replace(/javascript:/gi, '');
}
