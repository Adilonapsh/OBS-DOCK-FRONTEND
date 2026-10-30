'use client';
import { useEffect, useMemo, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Editor from '@monaco-editor/react';
import { ArrowLeft, Copy, Check, Eye, ExternalLink, Layers, Monitor, Save, Trash2, Plus, GripVertical, EyeOff, Settings2, Menu, Type, Clock, MessageSquare, Timer, BarChart3, Share2, Pencil, X, Code2, FileCode2, Gamepad2, Trophy, Target, Disc3, Music, ScrollText, Images, Megaphone, Pin, Mic, Gift, UserPlus, QrCode, HeartPulse, Crosshair, ListChecks, RefreshCw } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { WIDGET_CATEGORY_LABELS } from '@/lib/auth/widgets';
import Sidebar from '../../components/Sidebar';
import { renderTemplate, TEMPLATE_VARS, getTemplateDemoData, buildTemplateData } from '../_shared/utils/template';
import { useLiveTemplateData, getLiveDemoData } from '../_shared/hooks/useLiveTemplateData';
import { encodeLayersParam } from '../_shared/utils/layersCodec';
import {
  getWidgetLayerPreset,
  getWidgetsByCategory,
  buildWidgetLayerSrc,
  compactWidgetParams,
  WIDGET_LAYER_PRESETS,
  getWidgetSettingsKey,
  layerSettingsKey,
  seedWidgetLayerSettings,
  settingsToParams,
  readWidgetSettingsParams,
  type WidgetLayerPreset,
} from '../_shared/constants/widgetLayerPresets';

type TemplateLayerType = 'chat' | 'timer' | 'clock' | 'poll' | 'social' | 'custom';
type LayerType = TemplateLayerType | 'widget';
type Layer = {
  id: string;
  type: LayerType;
  x: number; y: number; w: number; h: number; // 0-100 %
  template: string; // HTML + {{variable}}
  css: string;
  js: string; // JS animation - el.animate(...) - pakai JS biar bisa custom easing/timeline
  anim: string; // CSS anim name (elegantIn etc) - kalau js kosong pakai ini
  opacity: number; // 0-100
  rotate: number; // deg
  scale: number; // 0.5-2
  zIndex: number;
  radius: number; // px
  shadow: boolean;
  bg: string;
  visible: boolean;
  locked: boolean;
  props?: Record<string, any>;
  // Widget layer (iframe ke display widget asli)
  widget?: string;
  params?: Record<string, string>;
  /** Namespace setting per layer (biar 2 widget sama bisa beda tema). */
  settingsId?: string;
};

const DEFAULT_TEMPLATES: Record<TemplateLayerType, string> = {
  chat: `<div class="chat-bubble">
  <span class="user">{{username}}</span>
  <span class="sep">:</span>
  <span class="msg">{{message}}</span>
  <small class="date">{{date}}</small>
</div>`,
  timer: `<div class="timer">
  <span class="timer-value">{{timer}}</span>
</div>`,
  clock: `<div class="clock">
  <span class="clock-value">{{clock}}</span>
</div>`,
  poll: `<div class="poll">
  <div class="poll-question">{{question}}</div>
  <div class="poll-result">{{polls}}</div>
</div>`,
  social: `<div class="social">
  <span class="platform">{{platform}}</span>
  <span class="handle">{{handle}}</span>
</div>`,
  custom: `<div class="custom">
  <span class="user">{{username}}</span>
  <span class="msg">{{message}}</span>
  <span class="timer">{{timer}}</span>
  <span class="clock">{{clock}}</span>
</div>`,
};

const DEFAULT_CSS: Record<TemplateLayerType, string> = {
  chat: '.chat-bubble{background:rgba(22,22,22,0.9);border:1px solid #333;border-radius:12px;padding:8px 12px;color:#fff;font-family:Outfit}\n.user{font-weight:800;color:#a78bfa}',
  timer: '.timer{font-size:32px;font-weight:900;color:#fff;background:#594d4a;border-radius:16px;padding:8px 16px;text-align:center}',
  clock: '.clock{font-size:28px;font-weight:800;color:#fff;text-align:center}',
  poll: '.poll{font-size:14px;font-weight:700;color:#fff;background:rgba(255,255,255,0.06);border-radius:12px;padding:8px 12px}',
  social: '.social{font-size:14px;font-weight:700;color:#fff;background:rgba(255,255,255,0.08);border-radius:999px;padding:8px 16px}',
  custom: '.custom{font-size:14px;color:#fff;background:rgba(255,255,255,0.06);border-radius:12px;padding:8px 12px}',
};

const JS_PRESETS = [
  { label: 'JS Fade', code: "el.animate([{opacity:0},{opacity:1}],{duration:500,easing:'ease'})" },
  { label: 'JS SlideUp', code: "el.animate([{opacity:0,transform:'translateY(20px) scale(0.97)',filter:'blur(8px)'},{opacity:1,transform:'translateY(0) scale(1)',filter:'blur(0)'}],{duration:620,easing:'cubic-bezier(0.16,1,0.3,1)'})" },
  { label: 'JS Bounce', code: "el.animate([{transform:'scale(0.8)',opacity:0},{transform:'scale(1.05)',opacity:1,offset:0.6},{transform:'scale(1)',opacity:1}],{duration:600,easing:'cubic-bezier(0.34,1.56,0.64,1)'})" },
];

const LAYER_ICON: Record<TemplateLayerType, any> = {
  chat: MessageSquare, timer: Timer, clock: Clock, poll: BarChart3, social: Share2, custom: Type,
};

// Ikon per widget untuk panel "Add Widget Layer".
const WIDGET_ICON: Record<string, any> = {
  chat: MessageSquare, pinned: Pin, speak: Mic, event: Gift, follow: UserPlus,
  timer: Timer, task: ListChecks, poll: BarChart3, games: Gamepad2, goals: Target,
  'donation-leaderboard': Trophy, clock: Clock, 'media-player': Disc3, lyrics: ScrollText,
  'info-slides': Images, ticker: Megaphone, 'social-rotator': Share2, 'view-counter': Eye,
  music: Music, qr: QrCode, heartrate: HeartPulse, valorant: Crosshair,
};

type ModalTab = 'template' | 'css' | 'js';

function genId() { return Math.random().toString(36).slice(2, 6); }

function makeDraft(type: TemplateLayerType, zIndex: number): Layer {
  return {
    id: genId(), type, x: 20 + Math.random() * 20, y: 20 + Math.random() * 30, w: 30, h: 15,
    template: DEFAULT_TEMPLATES[type], css: DEFAULT_CSS[type], js: '', anim: 'elegantIn',
    opacity: 100, rotate: 0, scale: 1, zIndex, radius: 12, shadow: false,
    bg: 'transparent', visible: true, locked: false,
  };
}

function makeWidgetLayer(preset: WidgetLayerPreset, existing: Layer[]): Layer {
  const zIndex = Math.max(0, ...existing.map((l) => l.zIndex || 0)) + 1;
  const widgetCount = existing.filter((l) => l.type === 'widget').length;
  // Cascade ringan supaya layer baru tidak menumpuk persis di tempat yang sama.
  const offset = (widgetCount % 5) * 4;
  const id = genId();
  // Tiap layer punya namespace setting sendiri. Awalnya disalin dari setting
  // widget global, lalu user bebas bikin tema berbeda per layer.
  seedWidgetLayerSettings(preset.key, id);
  return {
    id,
    type: 'widget',
    widget: preset.key,
    settingsId: id,
    params: readWidgetSettingsParams(preset.key, id) || {},
    x: Math.min(70, 4 + offset),
    y: Math.min(70, 4 + offset),
    w: preset.size.w,
    h: preset.size.h,
    template: '', css: '', js: '', anim: '',
    opacity: 100, rotate: 0, scale: 1, zIndex, radius: 0, shadow: false,
    bg: 'transparent', visible: true, locked: false,
  };
}

function WidgetLayerSettings({
  preset,
  layerId,
  privateKey,
}: {
  preset: WidgetLayerPreset;
  layerId: string;
  privateKey: string;
}) {
  const [reloadKey, setReloadKey] = useState(0);
  const Icon = WIDGET_ICON[preset.key] || Layers;
  // Halaman setting asli widget, di-namespace per layer (settingsId).
  const qs = new URLSearchParams();
  if (privateKey) qs.set('key', privateKey);
  qs.set('settingsId', layerId);
  const settingsHref = `${preset.path.replace(/\/display$/, '')}?${qs.toString()}`;

  return (
    <div className="space-y-2 p-2.5 bg-violet-500/10 border border-violet-500/25 rounded-xl">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-violet-300 shrink-0" />
        <div className="text-white font-black uppercase text-[10px] tracking-widest flex-1 truncate">Setting {preset.title}</div>
        <button onClick={() => setReloadKey(v => v + 1)} title="Reload setting" className="shrink-0 w-6 h-6 grid place-items-center rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300"><RefreshCw className="w-3 h-3" /></button>
        <Link href={settingsHref} target="_blank" className="shrink-0 inline-flex items-center gap-1 text-[9px] font-black uppercase text-violet-200 hover:text-white">
          <ExternalLink className="w-3 h-3" /> Buka
        </Link>
      </div>
      <div className="rounded-lg overflow-hidden border border-white/10 bg-black" style={{ height: '58vh', minHeight: 420 }}>
        <iframe
          key={reloadKey}
          src={settingsHref}
          title={`Setting ${preset.title}`}
          className="w-full h-full border-0 bg-white"
        />
      </div>
      <p className="text-[9px] text-gray-400 leading-relaxed">
        Halaman setting asli <span className="text-white font-bold">{preset.title}</span> — sama persis dengan widget standalone. Setting ini hanya untuk layer ini; layer lain (walau widgetnya sama) punya setting sendiri.
      </p>
    </div>
  );
}
function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const [privateKey, setPrivateKey] = useState(searchParams.get('key') || '');
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [layers, setLayers] = useState<Layer[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('custom-overlay-layers');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      { id: 'l1', type: 'chat', x: 2, y: 70, w: 30, h: 25, template: DEFAULT_TEMPLATES.chat, css: '.chat-bubble{background:rgba(22,22,22,0.9);border:1px solid #333;border-radius:12px;padding:8px 12px;color:#fff;font-family:Outfit}', js: '', anim: 'elegantIn', opacity: 100, rotate: 0, scale: 1, zIndex: 1, radius: 12, shadow: true, bg: 'transparent', visible: true, locked: false },
      { id: 'l2', type: 'timer', x: 70, y: 5, w: 28, h: 12, template: DEFAULT_TEMPLATES.timer, css: '.timer{font-size:32px;font-weight:900;color:#fff;background:#594d4a;border-radius:16px;padding:8px 16px;text-align:center}', js: '', anim: 'elegantIn', opacity: 100, rotate: 0, scale: 1, zIndex: 2, radius: 16, shadow: true, bg: 'transparent', visible: true, locked: false },
    ];
  });
  const [selected, setSelected] = useState<string>(layers[0]?.id || '');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  // Preview canvas: off = data demo (enak buat atur layout), on = data live socket.
  const [previewLive, setPreviewLive] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  // Canvas selalu 1920x1080 (ukuran OBS), cuma di-scale visual ke layar editor.
  // Jadi AutoScale/layout widget di preview = sama persis dengan hasil di OBS.
  const [canvasScale, setCanvasScale] = useState(0.4);

  // ---- Modal state: tambah & edit template/html/css/js hanya di modal ----
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [modalTab, setModalTab] = useState<ModalTab>('template');
  const [draft, setDraft] = useState<Layer | null>(null);
  const [varSearch, setVarSearch] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 1000); return () => clearInterval(t); }, []);

  const selLayer = layers.find(l => l.id === selected) || null;

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUser(data.user)); }, [supabase]);
  // Auto-load key seperti /widgets: URL ?key= → profiles.private_key → user_private_keys → sessionStorage.
  // Tanpa key, display jatuh ke room=global: chat masih masuk, tapi song/poll/timer per-room tidak → terlihat "belum live".
  useEffect(() => {
    if (privateKey) return;
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          try {
            const { data: p } = await supabase.from('profiles').select('private_key').eq('id', session.user.id).single();
            const k = (p as any)?.private_key;
            if (k) { setPrivateKey(k); return; }
          } catch {}
          try {
            const { data: s } = await supabase.from('user_private_keys').select('private_key').eq('user_id', session.user.id).single();
            const k = (s as any)?.private_key;
            if (k) { setPrivateKey(k); return; }
          } catch {}
        }
      } catch {}
      try {
        const stored = sessionStorage.getItem('dock_private_verified') || sessionStorage.getItem('bypass_private_key') || '';
        if (stored) setPrivateKey(stored);
      } catch {}
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { localStorage.setItem('custom-overlay-layers', JSON.stringify(layers)); }, [layers]);

  // Samakan tiap layer widget dengan namespace setting-nya sendiri.
  // Layer lama dapat settingsId = id layer, lalu di-seed dari setting global widget.
  useEffect(() => {
    setLayers(v => v.map(l => {
      if (l.type !== 'widget') return l;
      const settingsId = l.settingsId || l.id;
      seedWidgetLayerSettings(l.widget, settingsId);
      const saved = readWidgetSettingsParams(l.widget, settingsId);
      return {
        ...l,
        settingsId,
        params: saved ?? compactWidgetParams(l.widget || '', l.params),
      };
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Setting per layer disimpan halaman setting (iframe kanan) di key
  // `<widget>-settings::<layerId>`. storage event → update layer itu saja.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.newValue === null) return;
      const ns = /^(.*)::(.+)$/.exec(e.key);
      if (!ns) return;
      const [, baseKey, layerId] = ns;
      const preset = WIDGET_LAYER_PRESETS.find(p => getWidgetSettingsKey(p.key) === baseKey);
      if (!preset) return;
      let parsed: unknown;
      try { parsed = JSON.parse(e.newValue); } catch { return; }
      const params = settingsToParams(parsed);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setLayers(v => v.map(l => l.type === 'widget' && l.id === layerId && l.widget === preset.key ? { ...l, params } : l));
      }, 200);
    };
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener('storage', onStorage); if (timer) clearTimeout(timer); };
  }, []);

  // Hitung skala canvas dari ruang yang tersedia (fit contain 16:9).
  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      setCanvasScale(Math.max(0.1, Math.min(r.width / 1920, r.height / 1080)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, []);

  // demo data: SEMUA params widgets jadi {{variable}} di template HTML.
  // Prioritas: live socket (fungsi widget asli) > demo realistis > ?params URL.
  // Jadi {{cover}} = thumbnail YT asli, {{timer}} = sisa real, dst.
  const { data: liveData, connected: liveConnected } = useLiveTemplateData({ privateKey });
  const demoData: Record<string, any> = useMemo(() => {
    const merged: Record<string, any> = {
      ...getTemplateDemoData(),
      ...getLiveDemoData(),
      ...Object.fromEntries(searchParams.entries()),
    };
    for (const [k, v] of Object.entries(liveData)) {
      if (v !== '' && v !== null && v !== undefined) merged[k] = v;
    }
    merged.date = new Date().toLocaleDateString('id-ID');
    merged.time = new Date().toLocaleTimeString('id-ID');
    merged.clock = new Date().toLocaleTimeString('id-ID');
    return merged;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveData, privateKey, tick]);
  void buildTemplateData;

  const updateLayer = (id: string, patch: Partial<Layer>) => setLayers(v => v.map(l => l.id === id ? { ...l, ...patch } : l));
  const removeLayer = (id: string) => {
    const layer = layers.find(l => l.id === id);
    if (layer?.type === 'widget') {
      const key = layerSettingsKey(layer.widget, layer.settingsId || layer.id);
      if (key) { try { localStorage.removeItem(key); } catch {} }
    }
    setLayers(v => v.filter(l => l.id !== id));
  };

  // Tambah widget layer langsung (tanpa modal): tampilan = widget asli via iframe.
  const addWidgetLayer = (preset: WidgetLayerPreset) => {
    const layer = makeWidgetLayer(preset, layers);
    setLayers(v => [...v, layer]);
    setSelected(layer.id);
  };
  // ---- Modal actions ----
  const openCreate = (type: TemplateLayerType) => {
    setDraft(makeDraft(type, layers.length + 1));
    setModalMode('create');
    setModalTab('template');
    setModalOpen(true);
  };
  const openEdit = (id: string, tab: ModalTab = 'template') => {
    const l = layers.find(x => x.id === id);
    if (!l) return;
    setDraft({ ...l });
    setModalMode('edit');
    setModalTab(tab);
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setDraft(null); };
  const updateDraft = (patch: Partial<Layer>) => setDraft(d => (d ? { ...d, ...patch } : d));
  const saveModal = () => {
    if (!draft) return;
    if (modalMode === 'create') {
      setLayers(v => [...v, draft]);
      setSelected(draft.id);
    } else {
      setLayers(v => v.map(l => (l.id === draft.id ? draft : l)));
      setSelected(draft.id);
    }
    closeModal();
  };

  // ---- Monaco refs + autocomplete ala VSCode ----
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    // Autocomplete {{variable}} untuk HTML
    try {
      monaco.languages.registerCompletionItemProvider('html', {
        triggerCharacters: ['{', '.'],
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
          const suggestions = TEMPLATE_VARS.map(v => ({
            label: `{{${v.key}}}`,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: `{{${v.key}}}`,
            detail: `${v.group} • ${v.desc}`,
            documentation: `Contoh: ${v.example}`,
            range,
          }));
          return { suggestions };
        },
      });
      // Snippet el.animate untuk JS
      monaco.languages.registerCompletionItemProvider('javascript', {
        triggerCharacters: ['e', '.'],
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
          return {
            suggestions: [
              ...JS_PRESETS.map(p => ({
                label: p.label, kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: p.code, detail: 'Preset animasi', range,
              })),
              { label: 'el', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'el', detail: 'Layer element', documentation: "Pakai el.animate([...], {duration:500})", range },
            ],
          };
        },
      });
    } catch {}
  };

  const insertVarModal = (v: string) => {
    if (!draft) return;
    const placeholder = `{{${v}}}`;
    const ed = editorRef.current;
    if (ed && modalTab === 'template') {
      const sel = ed.getSelection();
      ed.executeEdits('insert-var', [{ range: sel ?? ed.getModel()?.getFullModelRange(), text: placeholder, forceMoveMarkers: true }]);
      ed.focus();
    } else {
      updateDraft({ template: draft.template + placeholder });
    }
  };

  const varGroups = useMemo(() => {
    const map = new Map<string, typeof TEMPLATE_VARS>();
    for (const v of TEMPLATE_VARS) {
      if (varSearch && !v.key.toLowerCase().includes(varSearch.toLowerCase()) && !v.desc.toLowerCase().includes(varSearch.toLowerCase()) && !v.group.toLowerCase().includes(varSearch.toLowerCase())) continue;
      if (!map.has(v.group)) map.set(v.group, [] as any);
      (map.get(v.group) as any).push(v);
    }
    return Array.from(map.entries());
  }, [varSearch]);

  const onMouseDown = (e: React.MouseEvent, id: string) => {
    const layer = layers.find(l => l.id === id);
    if (!layer || layer.locked) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const startX = e.clientX; const startY = e.clientY;
    const origX = layer.x; const origY = layer.y;
    const move = (ev: MouseEvent) => {
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;
      updateLayer(id, { x: Math.max(0, Math.min(85, origX + dx)), y: Math.max(0, Math.min(85, origY + dy)) });
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };

  // ESC untuk tutup modal
  useEffect(() => {
    if (!modalOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [modalOpen]);

  // Payload layer (setting widget ikut) bisa > 16 KB → server balas 431.
  // Jadi di-encode gzip+base64url dulu sebelum masuk URL OBS.
  const [layersQuery, setLayersQuery] = useState('');
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      const serializable = layers.map((l) => l.type === 'widget'
        ? { ...l, params: compactWidgetParams(l.widget || '', l.params) }
        : l);
      encodeLayersParam(serializable)
        .then((q) => { if (alive) setLayersQuery(q); })
        .catch(() => { if (alive) setLayersQuery(encodeURIComponent(JSON.stringify(serializable))); });
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [layers]);

  // Live data TIDAK dikirim lewat URL - display mengambilnya via socket (room = key).
  // URL hanya membawa layers + key. Tanpa key → room=global → song/poll/timer tidak masuk.
  const obsUrl = typeof window !== 'undefined' && layersQuery
    ? `${window.location.origin}/widgets/custom/display?layers=${layersQuery}${privateKey ? `&key=${privateKey}` : ''}&obs=1`
    : '';
  const previewUrl = obsUrl ? `${obsUrl.replace('&obs=1', '')}${obsUrl.includes('?') ? '&' : '?'}simulate=1` : '#';

  const handleCopy = async () => { if (!obsUrl) return; await navigator.clipboard.writeText(obsUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const handleSave = async () => {
    localStorage.setItem('custom-overlay-layers', JSON.stringify(layers));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from('profiles').update({ custom_overlay: JSON.stringify(layers) } as any).eq('id', session.user.id);
      }
    } catch {}
    setSaved(true); setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar active="widgets" open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
            <Link href="/widgets" className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white"><ArrowLeft className="w-4 h-4" /></Link>
            <div className="w-8 h-8 rounded-lg bg-white grid place-items-center"><Layers className="w-4 h-4 text-black" /></div>
            <div className="min-w-0">
              <div className="text-white font-black text-[12px] uppercase tracking-widest flex items-center gap-2">Custom Overlay <span className="hidden sm:inline px-2 py-0.5 bg-white text-black rounded-full text-[9px]">StreamElements-like</span></div>
              <div className="hidden sm:block text-gray-500 text-[10px]">Drag-drop canvas 1920×1080 • semua widget bisa jadi layer (iframe) + template HTML/CSS/JS</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setPreviewLive(v => !v)}
              title={previewLive ? 'Widget layer pakai data live (socket)' : 'Widget layer pakai data demo'}
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border ${previewLive ? 'bg-green-500/15 border-green-500/40 text-green-300' : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'}`}
            >
              <RefreshCw className={`w-3 h-3 ${previewLive ? 'animate-spin [animation-duration:3s]' : ''}`} /> {previewLive ? 'Live data' : 'Demo data'}
            </button>
            <Link href={previewUrl} target="_blank" className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300"><Eye className="w-3 h-3" /> Preview</Link>
            <button onClick={handleSave} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border ${saved ? 'bg-green-500 text-white border-green-500' : 'bg-white text-black border-white'}`}>{saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />} {saved ? 'Saved' : 'Save'}</button>
            <button onClick={handleCopy} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-[10px] font-black uppercase text-white">{copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copy OBS</button>
          </div>
        </header>

        <div className="bg-[#161616] border-b border-white/5 px-4 md:px-6 py-2 space-y-1.5">
          <div className="flex gap-2 sm:items-center overflow-x-auto">
            <div className="flex-1 min-w-0 flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2">
              <code className="flex-1 text-[11px] font-mono truncate text-white/70">{obsUrl ? `${obsUrl.slice(0, 80)}…` : 'Menyiapkan URL…'}</code>
              <button onClick={handleCopy} className="shrink-0 w-7 h-7 grid place-items-center rounded-lg bg-white text-black">{copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}</button>
            </div>
            <input value={privateKey} onChange={e => setPrivateKey(e.target.value)} placeholder="key" className="hidden sm:block w-32 h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-[11px] font-mono text-white" />
          </div>
          <div className={`text-[10px] leading-relaxed ${privateKey ? 'text-green-400/80' : 'text-yellow-300/90'}`}>
            {privateKey
              ? `● Live via socket room=${privateKey.slice(0, 6)}… - buka URL OBS ini, {{cover}}/{{timer}}/{{polls}} terisi otomatis saat ada lagu/timer/poll. Preview = demo (simulate=1, tanpa socket).`
              : '○ Key kosong - Copy OBS akan jatuh ke room=global: chat masih masuk, tapi music/timer/poll tidak. Isi key (otomatis dari dashboard) agar live sync jalan.'}
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Left: semua widget + template layer + daftar layer */}
          <div className="w-full lg:w-[280px] shrink-0 bg-[#121212] border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col max-h-[40vh] lg:max-h-none lg:h-[calc(100vh-112px)] overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
              {/* Widget layers - semua widget asli (iframe) */}
              <div>
                <div className="text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                  <Layers className="w-3 h-3 text-violet-300" /> Add Widget Layer
                  <span className="ml-auto px-1.5 py-0.5 bg-violet-600/30 border border-violet-500/30 text-violet-200 rounded-full text-[8px] tracking-normal">semua widget</span>
                </div>
                <div className="space-y-2.5 mt-2">
                  {getWidgetsByCategory().map((group) => (
                    <div key={group.category}>
                      <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">{WIDGET_CATEGORY_LABELS[group.category]}</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {group.items.map((p) => {
                          const Icon = WIDGET_ICON[p.key] || Layers;
                          return (
                            <button
                              key={p.key}
                              onClick={() => addWidgetLayer(p)}
                              title={`Tambah layer ${p.title}`}
                              className="h-11 px-1 bg-white/5 hover:bg-violet-600/25 hover:border-violet-500/50 border border-white/10 rounded-xl flex items-center gap-1.5 text-white transition-colors"
                            >
                              <Icon className="w-4 h-4 shrink-0 text-violet-200" />
                              <span className="text-[9px] font-black uppercase leading-tight text-left truncate">{p.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-gray-500 leading-relaxed">Klik widget → langsung jadi layer. Panel kanan = setting asli widget itu, terpisah per layer.</p>
              </div>

              {/* Template layers lama */}
              <div className="border-t border-white/5 pt-3">
                <div className="text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><FileCode2 className="w-3 h-3" /> Template Layer</div>
                <div className="grid grid-cols-3 gap-1.5 mt-2">
                  {(['chat','timer','clock','poll','social','custom'] as TemplateLayerType[]).map(t => {
                    const Icon = LAYER_ICON[t];
                    return <button key={t} onClick={() => openCreate(t)} className="h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex flex-col items-center justify-center gap-1 text-white"><Icon className="w-4 h-4" /><span className="text-[9px] font-black uppercase">{t}</span></button>;
                  })}
                </div>
                <p className="mt-2 text-[10px] text-gray-500 leading-relaxed">Klik tipe → modal Template/HTML + CSS + JS → <span className="text-white font-bold">Simpan</span>.</p>
              </div>

              {/* Daftar layer */}
              <div className="border-t border-white/5 pt-2 space-y-1">
                <div className="text-gray-500 font-black uppercase text-[9px] tracking-widest px-1">Layers ({layers.length})</div>
                {layers.map(l => {
                  const wp = l.type === 'widget' ? getWidgetLayerPreset(l.widget) : null;
                  const RowIcon = wp ? (WIDGET_ICON[wp.key] || Layers) : LAYER_ICON[l.type as TemplateLayerType];
                  return (
                    <div key={l.id} onClick={() => setSelected(l.id)} className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer ${selected===l.id ? 'bg-white text-black border-white' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}>
                      <RowIcon className="w-3 h-3 opacity-60 shrink-0" />
                      <span className="flex-1 text-[11px] font-bold truncate uppercase">{wp ? wp.title : l.type} • {l.id}</span>
                      {l.type !== 'widget' && (
                        <button title="Edit template/css/js (modal)" onClick={e=>{e.stopPropagation(); openEdit(l.id,'template')}} className="w-6 h-6 grid place-items-center rounded-lg bg-black/10 hover:bg-black/20"><Pencil className="w-3 h-3" /></button>
                      )}
                      <button onClick={e=>{e.stopPropagation(); updateLayer(l.id,{visible:!l.visible})}} className="w-6 h-6 grid place-items-center rounded-lg bg-black/10">{l.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}</button>
                      <button onClick={e=>{e.stopPropagation(); removeLayer(l.id)}} className="w-6 h-6 grid place-items-center rounded-lg bg-red-500/20 text-red-300"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center: Canvas 16:9 - selalu muat di layar (max height = viewport) */}
          <div className="flex-1 bg-[#0a0a0a] p-4 flex flex-col min-h-[320px] lg:min-h-0 lg:h-[calc(100vh-112px)] overflow-hidden">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <span className="text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><Monitor className="w-3 h-3" /> Canvas 1920×1080 • drag untuk geser • tarik sudut untuk resize</span>
              <span className="text-gray-500 text-[10px] font-mono">{layers.length} layers</span>
            </div>
            <div ref={canvasWrapRef} className="flex-1 min-h-0 relative overflow-hidden">
              <div className="absolute left-1/2 top-1/2 rounded-2xl shadow-2xl ring-1 ring-white/10" style={{ width: 1920 * canvasScale, height: 1080 * canvasScale, transform: 'translate(-50%, -50%)' }}>
              <div
                ref={canvasRef}
                className="relative overflow-hidden"
                style={{
                  width: 1920,
                  height: 1080,
                  transform: `scale(${canvasScale})`,
                  transformOrigin: 'top left',
                  background: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px) 0 0 / 20px 20px, #0a0a0a',
                }}
              >
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-[0.04]"><div className="border-r border-white" /><div className="border-r border-white" /><div /><div className="border-t border-white border-r" /><div className="border-t border-r border-white" /><div className="border-t border-white" /><div className="border-t border-r border-white" /><div className="border-t border-r border-white" /><div className="border-t border-white" /></div>
                  {layers.filter(l=>l.visible).map(l => {
                const isWidget = l.type === 'widget';
                const wp = isWidget ? getWidgetLayerPreset(l.widget) : null;
                return (
                <div
                  key={isWidget ? `${l.id}-${l.widget}-${JSON.stringify(l.params)}-${previewLive ? 'live' : 'demo'}` : `${l.id}-${l.template}-${l.js}-${l.anim}-${l.opacity}-${l.rotate}-${l.scale}`}
                  onMouseDown={e=>onMouseDown(e,l.id)}
                  onClick={()=>setSelected(l.id)}
                  onDoubleClick={()=>{ if (!isWidget) openEdit(l.id,'template'); }}
                  className={`group absolute cursor-move select-none overflow-hidden ${selected===l.id ? 'ring-2 ring-inset ring-violet-500' : 'ring-1 ring-inset ring-transparent hover:ring-white/30'} ${l.locked ? 'opacity-60' : ''}`}
                  style={{ left: `${l.x}%`, top: `${l.y}%`, width: `${l.w}%`, height: `${l.h}%`, background: isWidget ? (l.bg && l.bg !== 'transparent' ? l.bg : 'transparent') : (l.bg && l.bg !== 'transparent' ? l.bg : 'rgba(255,255,255,0.02)'), opacity: (l.opacity ?? 100)/100, transform: `rotate(${l.rotate||0}deg) scale(${l.scale||1})`, zIndex: l.zIndex||1, borderRadius: `${l.radius||0}px`, boxShadow: l.shadow ? '0 8px 24px rgba(0,0,0,0.4)' : undefined, animation: !l.js && l.anim ? `${l.anim} 0.52s cubic-bezier(0.16,1,0.3,1) both` : undefined } as any}
                  ref={el => { if (el && !isWidget && l.js) { try { const fn = new Function('el', l.js); const target = el.querySelector('.layer-content') as HTMLElement | null; if (target) fn(target); else fn(el); } catch {} } }}
                >
                  {isWidget ? (
                    wp ? (
                      <iframe
                        title={wp.title}
                        src={buildWidgetLayerSrc(l.widget!, l.params, { privateKey, obs: true, muted: true, simulate: !previewLive })}
                        className="w-full h-full border-0 pointer-events-none bg-transparent"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-[10px] text-red-300 bg-red-500/10">Widget tidak dikenal: {l.widget}</div>
                    )
                  ) : (
                    <>
                      <style dangerouslySetInnerHTML={{ __html: l.css }} />
                      <div className="layer-content w-full h-full text-white text-sm" dangerouslySetInnerHTML={{ __html: renderTemplate(l.template, demoData) }} />
                    </>
                  )}
                  {/* Chrome editor (badge + handle) hanya muncul saat hover/selected,
                      supaya canvas terlihat sama dengan hasil di OBS. */}
                  <div className={`absolute top-0 left-0 px-2 py-1 text-white text-[18px] leading-none font-black uppercase rounded-br-lg pointer-events-none transition-opacity ${selected===l.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} ${isWidget ? 'bg-black/70 border border-white/20' : 'bg-violet-600'}`}>{isWidget ? (wp?.title || l.widget) : `${l.type} ${l.js ? 'JS' : ''}`}</div>
                  <div className={`absolute bottom-0 right-0 w-6 h-6 bg-white/25 cursor-nwse-resize transition-opacity ${selected===l.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} onMouseDown={e=>{ e.stopPropagation(); const startW=l.w; const startH=l.h; const sx=e.clientX; const sy=e.clientY; const rect=canvasRef.current!.getBoundingClientRect(); const mv=(ev:MouseEvent)=>{ const dw=((ev.clientX-sx)/rect.width)*100; const dh=((ev.clientY-sy)/rect.height)*100; updateLayer(l.id,{w:Math.max(10,Math.min(90,startW+dw)), h:Math.max(8,Math.min(80,startH+dh))});}; const up=()=>{window.removeEventListener('mousemove',mv); window.removeEventListener('mouseup',up);}; window.addEventListener('mousemove',mv); window.addEventListener('mouseup',up);}} />
                </div>
                );
              })}
            </div>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-gray-500 text-center">Widget layer = tampilan widget asli • setting tiap layer terpisah (2 Song Request bisa beda tema) • Template layer = HTML/CSS/JS lewat modal</div>
          </div>

          {/* Right: Properties cepat saja (tanpa textarea template/css/js) */}
          <div className="w-full lg:w-[420px] xl:w-[480px] shrink-0 bg-[#121212] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col max-h-[45vh] lg:max-h-none lg:h-[calc(100vh-112px)] overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {!selLayer ? (
                <div className="text-gray-500 text-sm text-center py-10">Pilih layer di kiri/canvas</div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-white font-black uppercase text-[11px] tracking-widest truncate">
                      {selLayer.type === 'widget'
                        ? (getWidgetLayerPreset(selLayer.widget)?.title || selLayer.widget || 'Widget')
                        : selLayer.type} • {selLayer.id}
                    </h2>
                    <label className="flex items-center gap-1 text-[10px] font-bold text-white shrink-0"><input type="checkbox" checked={selLayer.locked} onChange={e=>updateLayer(selLayer.id,{locked:e.target.checked})} className="w-3 h-3 accent-white" /> Lock</label>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <label className="block"><span className="text-[9px] font-bold text-gray-400">X%</span><input type="number" value={Math.round(selLayer.x)} onChange={e=>updateLayer(selLayer.id,{x: parseInt(e.target.value)||0})} className="w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-xs text-white" /></label>
                    <label className="block"><span className="text-[9px] font-bold text-gray-400">Y%</span><input type="number" value={Math.round(selLayer.y)} onChange={e=>updateLayer(selLayer.id,{y: parseInt(e.target.value)||0})} className="w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-xs text-white" /></label>
                    <label className="block"><span className="text-[9px] font-bold text-gray-400">W%</span><input type="number" value={Math.round(selLayer.w)} onChange={e=>updateLayer(selLayer.id,{w: parseInt(e.target.value)||0})} className="w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-xs text-white" /></label>
                    <label className="block"><span className="text-[9px] font-bold text-gray-400">H%</span><input type="number" value={Math.round(selLayer.h)} onChange={e=>updateLayer(selLayer.id,{h: parseInt(e.target.value)||0})} className="w-full h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-xs text-white" /></label>
                  </div>

                  <div className="space-y-2 p-2.5 bg-white/5 border border-white/10 rounded-xl">
                    <div className="text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><Settings2 className="w-3 h-3 text-violet-400" /> Settingan Lain</div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block"><span className="text-[9px] font-bold text-gray-400">Opacity {selLayer.opacity}%</span><input type="range" min={0} max={100} value={selLayer.opacity} onChange={e=>updateLayer(selLayer.id,{opacity: parseInt(e.target.value)||100})} className="w-full accent-white h-1" /></label>
                      <label className="block"><span className="text-[9px] font-bold text-gray-400">Rotate {selLayer.rotate}°</span><input type="range" min={-180} max={180} value={selLayer.rotate} onChange={e=>updateLayer(selLayer.id,{rotate: parseInt(e.target.value)||0})} className="w-full accent-white h-1" /></label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block"><span className="text-[9px] font-bold text-gray-400">Scale {selLayer.scale}x</span><input type="range" min={0.5} max={2} step={0.1} value={selLayer.scale} onChange={e=>updateLayer(selLayer.id,{scale: parseFloat(e.target.value)||1})} className="w-full accent-white h-1" /></label>
                      <label className="block"><span className="text-[9px] font-bold text-gray-400">Radius {selLayer.radius}px</span><input type="range" min={0} max={32} value={selLayer.radius} onChange={e=>updateLayer(selLayer.id,{radius: parseInt(e.target.value)||0})} className="w-full accent-white h-1" /></label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block"><span className="text-[9px] font-bold text-gray-400">Z-Index</span><input type="number" min={1} max={99} value={selLayer.zIndex} onChange={e=>updateLayer(selLayer.id,{zIndex: parseInt(e.target.value)||1})} className="w-full h-7 bg-black/40 border border-white/10 rounded-lg px-2 text-xs text-white" /></label>
                      <label className="flex items-center justify-between p-2 bg-black/30 rounded-lg border border-white/5 cursor-pointer"><span className="text-[10px] font-bold text-white">Shadow</span><input type="checkbox" checked={!!selLayer.shadow} onChange={e=>updateLayer(selLayer.id,{shadow:e.target.checked})} className="w-4 h-4 accent-white" /></label>
                    </div>
                    <label className="block"><span className="text-[9px] font-bold text-gray-400">Background</span><div className="flex gap-1.5 mt-1"><input type="color" value={selLayer.bg === 'transparent' ? '#000000' : selLayer.bg} onChange={e=>updateLayer(selLayer.id,{bg:e.target.value})} className="w-8 h-8 rounded-lg p-1 bg-black/40 border border-white/10" /><button onClick={()=>updateLayer(selLayer.id,{bg:'transparent'})} className={`flex-1 h-8 rounded-lg text-[10px] font-black uppercase border ${selLayer.bg==='transparent' ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>Transparent</button></div></label>
                  </div>

                  {selLayer.type === 'widget' && (() => {
                    const wp = getWidgetLayerPreset(selLayer.widget);
                    if (!wp) return <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-[10px] text-red-300">Widget tidak dikenal: {selLayer.widget}</div>;
                    return <WidgetLayerSettings preset={wp} layerId={selLayer.settingsId || selLayer.id} privateKey={privateKey} />;
                  })()}

                  {/* Konten: ringkasan + edit via modal (template layer saja) */}
                  {selLayer.type !== 'widget' && (
                  <div className="space-y-2 p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                    <div className="text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><Code2 className="w-3 h-3 text-violet-300" /> Konten Layer - edit di modal</div>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                      <div className="bg-black/40 border border-white/10 rounded-lg p-2"><div className="text-gray-500 text-[9px] font-sans font-bold uppercase">HTML</div><div className="text-white truncate">{selLayer.template.length} char</div></div>
                      <div className="bg-black/40 border border-white/10 rounded-lg p-2"><div className="text-gray-500 text-[9px] font-sans font-bold uppercase">CSS</div><div className="text-white truncate">{selLayer.css.length} char</div></div>
                      <div className="bg-black/40 border border-white/10 rounded-lg p-2"><div className="text-gray-500 text-[9px] font-sans font-bold uppercase">JS</div><div className="text-white truncate">{selLayer.js ? `${selLayer.js.length} char` : selLayer.anim || '-'}</div></div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button onClick={()=>openEdit(selLayer.id,'template')} className="h-8 rounded-lg bg-white text-black text-[10px] font-black uppercase flex items-center justify-center gap-1"><FileCode2 className="w-3 h-3" /> HTML</button>
                      <button onClick={()=>openEdit(selLayer.id,'css')} className="h-8 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[10px] font-black uppercase">CSS</button>
                      <button onClick={()=>openEdit(selLayer.id,'js')} className="h-8 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[10px] font-black uppercase">JS</button>
                    </div>
                    <button onClick={()=>openEdit(selLayer.id,'template')} className="w-full h-9 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-black uppercase flex items-center justify-center gap-1.5"><Pencil className="w-3 h-3" /> Edit Template / CSS / JS</button>
                    <div className="bg-black border border-white/10 rounded-xl p-3">
                      <style dangerouslySetInnerHTML={{ __html: selLayer.css }} />
                      <div dangerouslySetInnerHTML={{ __html: renderTemplate(selLayer.template, demoData) }} style={!selLayer.js && selLayer.anim ? { animation: `${selLayer.anim} 0.52s cubic-bezier(0.16,1,0.3,1) both` } as any : undefined} />
                    </div>
                  </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Modal tambah / edit layer - diperbesar, VSCode, preview atas, panel kiri + kode kanan ===== */}
      {modalOpen && draft && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-[1400px] h-[94vh] flex flex-col bg-[#1e1e1e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/10 bg-[#252526] shrink-0">
              <div className="w-8 h-8 rounded-lg bg-white grid place-items-center shrink-0"><Layers className="w-4 h-4 text-black" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-black text-[12px] uppercase tracking-widest">{modalMode === 'create' ? 'Tambah Layer' : `Edit Layer • ${draft.id}`}</div>
                <div className="text-gray-400 text-[10px]">Template / HTML + CSS + JS - Simpan untuk menambahkan ke canvas</div>
              </div>
              <div className="hidden md:flex items-center gap-1.5">
                {(['template','css','js'] as ModalTab[]).map(t => (
                  <button key={t} onClick={()=>setModalTab(t)} className={`h-8 px-4 rounded-lg text-[10px] font-black uppercase border ${modalTab===t ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}>
                    {t === 'template' ? 'HTML' : t.toUpperCase()}
                  </button>
                ))}
              </div>
              {modalMode === 'create' && (
                <select value={draft.type} onChange={e=>{ const t = e.target.value as TemplateLayerType; setDraft({ ...makeDraft(t, layers.length + 1), id: draft.id, x: draft.x, y: draft.y, w: draft.w, h: draft.h }); }} className="h-8 bg-black/40 border border-white/10 rounded-lg px-2 text-xs text-white">
                  {(['chat','timer','clock','poll','social','custom'] as TemplateLayerType[]).map(t => <option key={t} value={t} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t}</option>)}
                </select>
              )}
              <span className="hidden lg:inline text-[10px] font-mono text-gray-500">{draft.type} • {draft.id}</span>
              <button onClick={closeModal} className="w-8 h-8 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300"><X className="w-4 h-4" /></button>
            </div>
            {/* Tabs mobile */}
            <div className="md:hidden flex items-center gap-1.5 px-4 py-2 border-b border-white/5 bg-[#252526]">
              {(['template','css','js'] as ModalTab[]).map(t => (
                <button key={t} onClick={()=>setModalTab(t)} className={`flex-1 h-8 rounded-lg text-[10px] font-black uppercase border ${modalTab===t ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                  {t === 'template' ? 'HTML' : t.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Live preview - di atas (data asli fungsi widget, bukan contoh statis) */}
            <div className="px-4 py-2 border-b border-white/10 bg-[#1e1e1e] shrink-0">
              <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1.5 flex items-center gap-2"><Eye className="w-3 h-3" /> Live preview - {modalTab === 'template' ? 'HTML' : modalTab.toUpperCase()}
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] ${liveConnected ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-white/5 text-gray-400 border border-white/10'}`}>{liveConnected ? '● LIVE SYNC' : '○ DEMO'}</span>
                {liveConnected ? null : <span className="normal-case font-bold text-gray-600">isi key untuk sync real • {'{{cover}}'} = thumb YT asli saat ada lagu</span>}
              </div>
              <div className="bg-black border border-white/10 rounded-xl px-4 py-3 overflow-auto min-h-[84px] max-h-[130px]">
                <style dangerouslySetInnerHTML={{ __html: draft.css }} />
                <div ref={el => { if (el && draft.js) { try { const fn = new Function('el', draft.js); fn(el); } catch {} } }} dangerouslySetInnerHTML={{ __html: renderTemplate(draft.template, demoData) }} style={!draft.js && draft.anim ? { animation: `${draft.anim} 0.52s cubic-bezier(0.16,1,0.3,1) both` } as any : undefined} />
              </div>
            </div>

            {/* Body: kiri panel template, kanan input kode */}
            <div className="flex-1 flex min-h-0">
              {/* Kiri: panel Template / snippets */}
              <div className="w-[280px] lg:w-[320px] shrink-0 border-r border-white/10 bg-[#252526] flex flex-col min-h-0 max-sm:hidden">
                <div className="p-3 border-b border-white/5">
                  <input value={varSearch} onChange={e=>setVarSearch(e.target.value)} placeholder={modalTab === 'template' ? 'Cari variable… (theme, timer, tz)' : 'Cari…'} className="w-full h-8 bg-[#1e1e1e] border border-white/10 rounded-lg px-3 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/60" />
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {modalTab === 'template' && varGroups.map(([g, list]) => (
                    <div key={g}>
                      <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1.5">{g} ({list.length})</div>
                      <div className="flex flex-wrap gap-1.5">
                        {(list as typeof TEMPLATE_VARS).map(v => (
                          <button key={v.key} onClick={()=>insertVarModal(v.key)} title={`${v.desc} - ex: ${v.example}`} className="px-2 py-1 bg-white/10 hover:bg-violet-600 hover:border-violet-500 border border-white/10 rounded-md text-[10px] font-mono text-gray-200 transition-colors">{`{{${v.key}}}`}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {modalTab === 'template' && varGroups.length === 0 && <div className="text-gray-600 text-xs text-center py-6">Tidak ketemu.</div>}
                  {modalTab === 'css' && (
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-black uppercase tracking-widest text-gray-500">Snippet CSS</div>
                      {[
                        { label: 'Center flex', code: '.wrap{display:flex;align-items:center;justify-content:center;}' },
                        { label: 'Pill', code: '.pill{background:rgba(255,255,255,0.08);border-radius:999px;padding:8px 16px;}' },
                        { label: 'Glass', code: '.glass{background:rgba(20,20,25,0.7);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.12);border-radius:16px;}' },
                        { label: 'Outline text', code: '.txt{font-weight:900;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,0.6);}' },
                      ].filter(s => !varSearch || s.label.toLowerCase().includes(varSearch.toLowerCase())).map(s => (
                        <button key={s.label} onClick={()=>updateDraft({ css: (draft.css ? draft.css + '\n' : '') + s.code })} className="w-full text-left px-2.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] font-mono text-gray-200">{s.label}<span className="block text-[10px] text-gray-500 truncate">{s.code}</span></button>
                      ))}
                      <div className="text-[10px] text-gray-500 leading-relaxed pt-1">Scoped per layer via <code className="bg-white/10 px-1 rounded">&lt;style&gt;</code>.</div>
                    </div>
                  )}
                  {modalTab === 'js' && (
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-black uppercase tracking-widest text-gray-500">Preset JS - klik untuk pakai</div>
                      {JS_PRESETS.map(p => (
                        <button key={p.label} onClick={()=>updateDraft({ js: p.code, anim: '' })} className={`w-full text-left px-2.5 py-2 border rounded-lg text-[11px] font-bold ${draft.js===p.code ? 'bg-violet-600 text-white border-violet-500' : 'bg-white/5 text-gray-200 border-white/10 hover:bg-white/10'}`}>{p.label}<span className="block text-[10px] font-mono font-normal opacity-70 truncate">{p.code.slice(0, 60)}…</span></button>
                      ))}
                      <div className="text-[10px] text-gray-500 leading-relaxed pt-1">Pakai <code className="bg-white/10 px-1 rounded">el</code> - <code className="bg-white/10 px-1 rounded">el.animate([...], {"{duration:400}"})</code>. Ketik <code className="bg-white/10 px-1 rounded">el</code> di kanan untuk autocomplete.</div>
                      {draft.js ? <button onClick={()=>updateDraft({ js:'' })} className="text-[10px] text-red-400 underline">Hapus JS, pakai CSS</button> : null}
                    </div>
                  )}
                </div>
                {modalTab === 'template' && <div className="p-3 border-t border-white/5 text-[10px] text-gray-500 leading-relaxed">Klik chip untuk sisipkan di kursor • ketik <code className="bg-white/10 px-1 rounded">{"{{"}</code> di kanan untuk autocomplete semua params.</div>}
              </div>

              {/* Kanan: input kode ala VSCode */}
              <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
                {modalTab === 'js' && (
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 shrink-0 overflow-x-auto">
                    <span className="text-[10px] font-black uppercase text-gray-400 shrink-0">CSS anim:</span>
                    <select value={draft.anim || 'elegantIn'} onChange={e=>updateDraft({ anim: e.target.value, js: '' })} className="h-7 bg-black/40 border border-white/10 rounded-lg px-2 text-xs text-white shrink-0">
                      <option value="elegantIn" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">Elegant In</option>
                      <option value="softPopIn" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">Soft Pop</option>
                      <option value="slideUp" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">Slide Up</option>
                      <option value="fadeIn" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">Fade</option>
                    </select>
                    <span className="text-[10px] text-gray-600 shrink-0">atau tulis JS di bawah ({draft.js ? 'JS aktif' : 'CSS aktif'})</span>
                  </div>
                )}
                <div className="flex-1 min-h-0">
                  {modalTab === 'template' && (
                    <Editor key="html" height="100%" language="html" theme="vs-dark" value={draft.template} onChange={v=>updateDraft({ template: v ?? '' })} onMount={handleEditorMount}
                      options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: 'on', scrollBeyondLastLine: false, padding: { top: 12 }, suggestOnTriggerCharacters: true, quickSuggestions: true, tabSize: 2, automaticLayout: true }} />
                  )}
                  {modalTab === 'css' && (
                    <Editor key="css" height="100%" language="css" theme="vs-dark" value={draft.css} onChange={v=>updateDraft({ css: v ?? '' })} onMount={handleEditorMount}
                      options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: 'on', scrollBeyondLastLine: false, padding: { top: 12 }, suggestOnTriggerCharacters: true, quickSuggestions: true, tabSize: 2, automaticLayout: true }} />
                  )}
                  {modalTab === 'js' && (
                    <Editor key="js" height="100%" language="javascript" theme="vs-dark" value={draft.js || ''} onChange={v=>updateDraft({ js: v ?? '' })} onMount={handleEditorMount}
                      options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: 'on', scrollBeyondLastLine: false, padding: { top: 12 }, suggestOnTriggerCharacters: true, quickSuggestions: true, tabSize: 2, automaticLayout: true }} />
                  )}
                </div>
                <div className="px-3 py-1.5 border-t border-white/5 text-[10px] font-mono text-gray-500 shrink-0 flex items-center gap-3">
                  <span>{modalTab === 'template' ? 'HTML' : modalTab.toUpperCase()} • vs-dark</span>
                  <span>{(modalTab === 'template' ? draft.template : modalTab === 'css' ? draft.css : draft.js || '').length} char</span>
                  {modalTab === 'template' && <span className="hidden sm:inline">autocomplete: ketik {"{{"} + ctrl+space</span>}
                </div>
              </div>
            </div>

            <div className="flex gap-2 px-4 py-3 border-t border-white/10 bg-[#252526] shrink-0">
              <button onClick={closeModal} className="flex-1 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-black uppercase text-gray-300">Batal</button>
              <button onClick={saveModal} className="flex-[2] h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-black uppercase flex items-center justify-center gap-1.5"><Check className="w-4 h-4" /> {modalMode === 'create' ? 'Simpan & Tambahkan Layer' : 'Simpan Perubahan'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomEditorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500">Loading editor…</div>}>
      <EditorContent />
    </Suspense>
  );
}
