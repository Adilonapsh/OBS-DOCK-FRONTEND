'use client';
import { useEffect, useMemo, useRef, useState, Suspense, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import { useWidgetPageShell } from '../_shared/hooks/useWidgetPage';
import { WidgetPageModals, toggleShowKey } from '../_shared/components/WidgetPageModals';
import { PositionPicker } from '../_shared/components/PositionPicker';
import { WIDGET_FONTS } from '../_shared/constants/fonts';
import { getSocketUrl } from '../_shared/utils/socket';
import { io, type Socket } from 'socket.io-client';
import {
  ArrowLeft, Bot, Check, Clock, Copy, ExternalLink, Eye, EyeOff, Gamepad2,
  Gift, GripVertical, Heart, Image as ImageIcon, ListOrdered, Menu, MessageSquare,
  Monitor, Palette, Play, RefreshCw, RotateCcw, Settings2, SkipForward, Sparkles,
  Square, Target, Trophy, Users, Volume2, Zap,
} from 'lucide-react';
import {
  DEFAULT_GAME_SETTINGS, GAME_DURATIONS, GAME_LANGS, GAME_MAX_GUESSES,
  GAME_QUESTION_COUNTS, GAME_SETTINGS_KEY, GAME_TOPIC_VOTE_DURATIONS, GAME_TOPICS, TRIVIA_API_DEFAULT,
  TRIVIA_GAME_ID, buildGameUrl, getTopicById, parseGameSettings,
  type GameSettings, type GameStatus,
} from './shared';

const fontsList = [...WIDGET_FONTS];

const PHASE_LABEL: Record<string, string> = {
  topics: 'Pilih Topik',
  rules: 'Aturan',
  intro: 'Intro Pertanyaan',
  question: 'Pertanyaan',
  reveal: 'Jawaban & Fakta',
  leaderboard: 'Leaderboard',
};

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2">
        {icon} {title}
      </h2>
      {children}
    </div>
  );
}

function ToggleRow({ label, hint, checked, onChange }: {
  label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 p-2.5 bg-black/30 rounded-xl border border-white/5 cursor-pointer">
      <span className="min-w-0">
        <span className="block text-[11px] font-bold text-white">{label}</span>
        {hint && <span className="block text-[10px] text-gray-500 leading-tight mt-0.5">{hint}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-white shrink-0"
      />
    </label>
  );
}

function NumberField({ label, hint, value, min, max, step = 1, suffix, onChange }: {
  label: string; hint?: string; value: number; min?: number; max?: number; step?: number;
  suffix?: string; onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold text-gray-300">{label}</span>
      <div className="relative mt-1">
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0)}
          className="w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-gray-500 pointer-events-none">{suffix}</span>}
      </div>
      {hint && <span className="text-[10px] text-gray-500 mt-1 block leading-tight">{hint}</span>}
    </label>
  );
}

function SelectField({ label, hint, value, onChange, children }: {
  label: string; hint?: string; value: string | number; onChange: (v: string) => void; children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold text-gray-300">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white"
      >
        {children}
      </select>
      {hint && <span className="text-[10px] text-gray-500 mt-1 block leading-tight">{hint}</span>}
    </label>
  );
}

function GamesSettingsInner() {
  const searchParams = useSearchParams();
  const [privateKey, setPrivateKey] = useState(searchParams.get('key') || '');
  const [state, setState] = useState<GameSettings>({ ...DEFAULT_GAME_SETTINGS });
  const [loaded, setLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<GameStatus | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadFromUrl = (urlStr: string) => {
    const url = new URL(urlStr, window.location.origin);
    const p = url.searchParams;
    setState(parseGameSettings(p));
    const key = p.get('key');
    if (key) setPrivateKey(key);
  };

  const shell = useWidgetPageShell(loadFromUrl);
  const reset = () => setState({ ...DEFAULT_GAME_SETTINGS });

  useEffect(() => {
    const pk = searchParams.get('key')
      || (typeof window !== 'undefined' ? sessionStorage.getItem('dock_private_verified') || '' : '');
    if (pk) setPrivateKey(pk);

    const hasSettings = (Object.keys(DEFAULT_GAME_SETTINGS) as (keyof GameSettings)[])
      .some((k) => searchParams.get(k) !== null);
    if (hasSettings) {
      setState(parseGameSettings(searchParams));
    } else {
      try {
        const saved = typeof window !== 'undefined' ? localStorage.getItem(GAME_SETTINGS_KEY) : null;
        if (saved) setState({ ...DEFAULT_GAME_SETTINGS, ...JSON.parse(saved) });
      } catch { /* ignore corrupt storage */ }
    }
    setLoaded(true);
    // Only hydrate once from URL / localStorage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaded || typeof window === 'undefined') return;
    try { localStorage.setItem(GAME_SETTINGS_KEY, JSON.stringify(state)); } catch { /* ignore quota */ }
  }, [state, loaded]);

  /* ============ SOCKET: CONTROL + LIVE STATUS ============ */
  useEffect(() => {
    const s = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    socketRef.current = s;
    const room = privateKey || 'global';

    s.on('connect', () => {
      setConnected(true);
      s.emit('join-room', room);
      s.emit('game-get', { privateKey: room, gameId: TRIVIA_GAME_ID });
    });
    s.on('disconnect', () => setConnected(false));
    s.on('game-status', (data: GameStatus) => {
      if ((data?.gameId || TRIVIA_GAME_ID) === TRIVIA_GAME_ID) setStatus(data || null);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [privateKey]);

  const room = privateKey || 'global';

  const sendCommand = (action: string, extra: Record<string, unknown> = {}) => {
    socketRef.current?.emit('game-command', {
      privateKey: room,
      gameId: TRIVIA_GAME_ID,
      action,
      topic: state.topic,
      questionSec: state.questionSec,
      totalQuestions: state.totalQuestions,
      maxGuesses: state.maxGuesses,
      lang: state.lang,
      ...extra,
    });
  };

  const startTopic = (topicId: string) => {
    update('topic', topicId);
    sendCommand('start', { topic: topicId });
  };

  const widgetUrl = useMemo(() => {
    if (!mounted || typeof window === 'undefined') return '';
    return buildGameUrl(`${window.location.origin}/widgets/games/display`, state, { key: privateKey || undefined, fit: true });
  }, [state, privateKey, mounted]);
  const obsUrl = useMemo(() => (widgetUrl ? `${widgetUrl}&obs=1` : ''), [widgetUrl]);
  const previewUrl = useMemo(() => buildGameUrl('/widgets/games/display', state, { fit: true }), [state]);
  const simulateUrl = useMemo(() => `${previewUrl}&simulate=1`, [previewUrl]);

  const handleCopy = () => shell.copy(obsUrl);
  const update = <K extends keyof GameSettings>(k: K, v: GameSettings[K]) =>
    setState((prev) => ({ ...prev, [k]: v }));

  const statusTopic = status?.topic ? getTopicById(status.topic) : null;
  const statusPhase = status?.phase ? PHASE_LABEL[status.phase] || status.phase : 'Menunggu';
  const hasStatus = !!status && !!status.phase;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar active="widgets" open={shell.sidebarOpen} onClose={() => shell.setSidebarOpen(false)} user={shell.user} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => shell.setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
            <Link href="/widgets" className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white"><ArrowLeft className="w-4 h-4" /></Link>
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center"><Gamepad2 className="w-4 h-4 text-black" /></div>
            <div className="min-w-0">
              <div className="text-white font-black text-[12px] uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-3 h-3 text-white" /> Games / Trivia</div>
              <div className="hidden sm:block text-gray-500 text-[10px]">Kuis live - jawab lewat chat, bonus dari like/follow/gift</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => shell.setShowDefaultsConfirm(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300"><RefreshCw className="w-3 h-3" /> Defaults</button>
            <button onClick={() => shell.setShowLoadPopup(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">Load URL</button>
            <a href={previewUrl} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-zinc-100"><ExternalLink className="w-3 h-3" /> Preview</a>
          </div>
        </header>

        <div className="bg-[#161616] border-b border-white/5 px-4 md:px-6 py-3 flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-black tracking-widest uppercase text-gray-500 mb-1 flex items-center gap-1.5"><Settings2 className="w-3 h-3" /> Widget URL - paste ke OBS Browser Source (transparent)</div>
            <div onClick={handleCopy} className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 cursor-pointer hover:border-white/20 group">
              <code className={`flex-1 text-[11px] font-mono truncate ${shell.showKey ? 'text-white' : 'text-white blur-[3px] select-none'}`}>{shell.showKey ? obsUrl : obsUrl.replace(/key=[^&]+/, 'key=••••••••••••••••')}</code>
              <button type="button" onClick={(e) => { e.stopPropagation(); toggleShowKey(shell, obsUrl); }} className="shrink-0 w-7 h-7 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white">{shell.showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
              <span className={`shrink-0 w-7 h-7 grid place-items-center rounded-lg ${shell.copied ? 'bg-emerald-500 text-white' : 'bg-white text-black group-hover:bg-zinc-100'}`}>{shell.copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}</span>
            </div>
          </div>
          <div className="flex self-end gap-2 shrink-0">
            <a href={obsUrl} target="_blank" className="h-9 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-black text-[11px] uppercase flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5" /> OBS</a>
            <a href={obsUrl} draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', obsUrl); e.dataTransfer.setData('text/uri-list', obsUrl); e.dataTransfer.effectAllowed = 'copy'; }} className="h-9 px-3 bg-white text-black border border-dashed border-zinc-300 hover:border-white rounded-xl font-black text-[11px] uppercase flex items-center gap-1.5 cursor-grab active:cursor-grabbing"><GripVertical className="w-3.5 h-3.5" /> Drag ke OBS</a>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          <div className="w-full lg:w-[440px] shrink-0 bg-[#121212] border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col max-h-[56vh] lg:max-h-none lg:h-[calc(100vh-112px)] overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
              {/* Kontrol Game */}
              <Section icon={<Gamepad2 className="w-4 h-4 text-emerald-400" />} title="Kontrol Game">
                <div className={`space-y-3 bg-white/5 border rounded-2xl p-3 ${connected ? 'border-emerald-500/25' : 'border-white/10'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status Server</span>
                    <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                      {connected ? 'Terhubung' : 'Terputus'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => sendCommand('start', { topic: state.topicVote ? undefined : state.topic })} className="h-10 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-[11px] font-black uppercase flex items-center justify-center gap-1.5"><Play className="w-4 h-4" /> Start</button>
                    <button onClick={() => sendCommand('skip')} className="h-10 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl text-[11px] font-black uppercase flex items-center justify-center gap-1.5"><SkipForward className="w-4 h-4" /> Skip</button>
                    <button onClick={() => sendCommand('stop')} className="h-9 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5"><Square className="w-3.5 h-3.5" /> Stop</button>
                    <button onClick={() => { sendCommand('reset'); setStatus(null); }} className="h-9 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
                  </div>

                  <div className="rounded-xl bg-black/40 border border-white/10 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Live Status</span>
                      <button onClick={() => socketRef.current?.emit('game-get', { privateKey: room, gameId: TRIVIA_GAME_ID })} className="text-gray-500 hover:text-white" title="Refresh status"><RefreshCw className="w-3 h-3" /></button>
                    </div>
                    {hasStatus ? (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-white font-black text-[12px] uppercase truncate">{statusPhase}</span>
                          <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-white/10 text-[9px] font-black text-gray-300">{statusTopic?.label || '—'}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          <div className="bg-white/5 rounded-lg py-1.5">
                            <div className="text-white font-black text-[13px] leading-none">{status?.qIndex || 0}<span className="text-gray-500 text-[9px]">/{status?.total || state.totalQuestions}</span></div>
                            <div className="text-gray-500 text-[8px] font-bold uppercase mt-1">Soal</div>
                          </div>
                          <div className="bg-white/5 rounded-lg py-1.5">
                            <div className="text-white font-black text-[13px] leading-none">{status?.players || 0}</div>
                            <div className="text-gray-500 text-[8px] font-bold uppercase mt-1">Pemain</div>
                          </div>
                          <div className="bg-white/5 rounded-lg py-1.5">
                            <div className="text-white font-black text-[13px] leading-none">{status?.round || 1}</div>
                            <div className="text-gray-500 text-[8px] font-bold uppercase mt-1">Ronde</div>
                          </div>
                        </div>
                        {status?.question && <div className="text-gray-400 text-[10px] leading-snug line-clamp-2">{status.question}</div>}
                        {status?.fallback && <div className="text-amber-400 text-[9px] font-bold">Mode data demo (webhook tidak merespons)</div>}
                      </>
                    ) : (
                      <div className="text-gray-500 text-[10px] leading-relaxed">Belum ada aktivitas. Tekan <b className="text-white">Start</b> atau jalankan overlay di OBS.</div>
                    )}
                  </div>

                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Mulai Cepat per Topik</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {GAME_TOPICS.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => startTopic(t.id)}
                          className={`h-8 rounded-lg border text-[10px] font-black uppercase flex items-center gap-1.5 px-2 transition ${state.topic === t.id ? 'bg-white text-black border-white' : 'bg-black/30 text-gray-300 border-white/10 hover:border-white/30'}`}
                        >
                          <span>{t.icon}</span>
                          <span className="truncate">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>

              {/* Gameplay */}
              <Section icon={<Target className="w-4 h-4 text-orange-400" />} title="Gameplay">
                <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                  <SelectField label="Topik Utama" value={state.topic} onChange={(v) => update('topic', v)} hint="Topik default saat Start / Auto Start.">
                    {GAME_TOPICS.map((t) => <option key={t.id} value={t.id} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.icon} {t.label} - {t.sub}</option>)}
                  </SelectField>

                  <ToggleRow
                    label="Topik dipilih chat"
                    hint="Voting topik dimulai saat command chat atau tombol Start ditekan. Penonton bisa memilih dengan huruf A-D atau nama topik yang tampil; topik terbanyak otomatis dimulai setelah timer."
                    checked={state.topicVote}
                    onChange={(v) => update('topicVote', v)}
                  />
                  {state.topicVote && (
                    <SelectField
                      label="Durasi Voting Topik"
                      value={state.topicVoteSec}
                      onChange={(v) => update('topicVoteSec', Number(v))}
                      hint="Durasi voting setelah game dimulai lewat command chat atau tombol Start."
                    >
                      {GAME_TOPIC_VOTE_DURATIONS.map((n) => <option key={n} value={n} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{n} detik</option>)}
                    </SelectField>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <SelectField label="Bahasa Soal" value={state.lang} onChange={(v) => update('lang', v)}>
                      {GAME_LANGS.map((l) => <option key={l.value} value={l.value} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{l.label}</option>)}
                    </SelectField>
                    <SelectField label="Jumlah Soal" value={state.totalQuestions} onChange={(v) => update('totalQuestions', Number(v))}>
                      {GAME_QUESTION_COUNTS.map((n) => <option key={n} value={n} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{n} soal</option>)}
                    </SelectField>
                    <SelectField label="Durasi / Soal" value={state.questionSec} onChange={(v) => update('questionSec', Number(v))}>
                      {GAME_DURATIONS.map((n) => <option key={n} value={n} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{n} detik</option>)}
                    </SelectField>
                    <SelectField label="Max Tebakan" value={state.maxGuesses} onChange={(v) => update('maxGuesses', Number(v))}>
                      {GAME_MAX_GUESSES.map((n) => <option key={n} value={n} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{n}× per soal</option>)}
                    </SelectField>
                  </div>

                  <div className="space-y-2">
                    <ToggleRow label="Tampilkan fakta" hint="Fakta unik muncul setelah jawaban dibuka." checked={state.showFacts} onChange={(v) => update('showFacts', v)} />
                    <ToggleRow label="Demo players" hint="Simulasikan penonton menjawab saat game berjalan." checked={state.demoPlayers} onChange={(v) => update('demoPlayers', v)} />
                  </div>
                </div>
              </Section>

              {/* Chat */}
              <Section icon={<MessageSquare className="w-4 h-4 text-sky-400" />} title="Chat & Command">
                <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                  <label className="block">
                    <span className="text-[11px] font-bold text-gray-300">Command Mulai</span>
                    <input
                      value={state.command}
                      onChange={(e) => update('command', e.target.value)}
                      placeholder="!trivia"
                      className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono placeholder:text-gray-600"
                    />
                    <span className="text-[10px] text-gray-500 mt-1 block">Ketik command ini di chat untuk membuka voting topik selama {state.topicVoteSec} detik.</span>
                  </label>

                  <SelectField
                    label="Kontrol Chat"
                    value={state.chatControl}
                    onChange={(v) => update('chatControl', v as GameSettings['chatControl'])}
                    hint="Batasi siapa yang boleh memulai / mengontrol lewat chat."
                  >
                    <option value="all" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">Semua penonton</option>
                    <option value="mods" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">Hanya mod / host</option>
                    <option value="off" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">Nonaktif</option>
                  </SelectField>

                  <div className="text-[10px] text-gray-500 bg-black/30 rounded-xl p-2 border border-white/5 leading-relaxed">
                    Jawaban chat: <b className="text-white">A / B / C / D</b> untuk pilihan ganda, <b className="text-white">Benar / Salah</b> untuk fakta-mitos, atau tulis jawaban langsung (toleransi typo otomatis).
                  </div>
                </div>
              </Section>

              {/* Event rewards */}
              <Section icon={<Gift className="w-4 h-4 text-pink-400" />} title="Bonus Event">
                <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <NumberField label="Like" value={state.likePoints} min={0} suffix="poin" onChange={(v) => update('likePoints', Math.max(0, v))} />
                    <NumberField label="Follow / Join" value={state.followPoints} min={0} suffix="poin" onChange={(v) => update('followPoints', Math.max(0, v))} />
                    <NumberField label="Gift" value={state.giftPoints} min={0} suffix="poin" onChange={(v) => update('giftPoints', Math.max(0, v))} />
                    <NumberField label="Donasi" value={state.donationPoints} min={0} suffix="poin" onChange={(v) => update('donationPoints', Math.max(0, v))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <NumberField label="Like → Extra Tebakan" value={state.likeExtraGuessEvery} min={0} hint="0 = nonaktif. Contoh 100 = tiap 100 like dapat 1 tebakan." onChange={(v) => update('likeExtraGuessEvery', Math.max(0, v))} />
                    <NumberField label="Follow → Extra Tebakan" value={state.followExtraGuess} min={0} hint="Tambahan tebakan saat follow / join." onChange={(v) => update('followExtraGuess', Math.max(0, v))} />
                  </div>
                  <NumberField label="Batas Bonus / Soal" value={state.maxBonusPerQuestion} min={0} suffix="poin" hint="Batas poin bonus event per soal per pemain." onChange={(v) => update('maxBonusPerQuestion', Math.max(0, v))} />
                  <div className="flex items-start gap-2 text-[10px] text-gray-500 bg-black/30 rounded-xl p-2 border border-white/5 leading-relaxed">
                    <Heart className="w-3 h-3 text-pink-400 mt-0.5 shrink-0" />
                    <span>Sumber event: <b className="text-gray-300">tiktok-like</b>, <b className="text-gray-300">tiktok-follow</b>, <b className="text-gray-300">tiktok-member</b>, <b className="text-gray-300">tiktok-gift</b>, dan <b className="text-gray-300">donation</b>.</span>
                  </div>
                </div>
              </Section>

              {/* Style */}
              <Section icon={<Palette className="w-4 h-4 text-violet-400" />} title="Style">
                <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-[11px] font-bold text-gray-300">Accent</span>
                      <input type="color" value={state.accent} onChange={(e) => update('accent', e.target.value)} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl p-1" />
                    </label>
                    <label className="block">
                      <span className="text-[11px] font-bold text-gray-300">Background</span>
                      <div className="mt-1 flex gap-1">
                        <input type="color" value={state.bg === 'transparent' ? '#000000' : state.bg} onChange={(e) => update('bg', e.target.value)} className="w-9 h-9 rounded-xl p-1 bg-black/40 border border-white/10" />
                        <button onClick={() => update('bg', state.bg === 'transparent' ? '#050508' : 'transparent')} className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase border ${state.bg === 'transparent' ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>Transparent</button>
                      </div>
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-[11px] font-bold text-gray-300">Font Body</span>
                    <input list="game-fonts" value={state.font} onChange={(e) => update('font', e.target.value)} placeholder="Inter" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-bold text-gray-300">Font Judul</span>
                    <input list="game-fonts" value={state.headingFont} onChange={(e) => update('headingFont', e.target.value)} placeholder="Oswald" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-bold text-gray-300">Font Angka / Timer</span>
                    <input list="game-fonts" value={state.monoFont} onChange={(e) => update('monoFont', e.target.value)} placeholder="Space Mono" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
                  </label>
                  <datalist id="game-fonts">{fontsList.map((f) => <option key={f} value={f} />)}</datalist>

                  <div className="text-[10px] text-gray-500 bg-black/30 rounded-xl p-2 border border-white/5">Font Google dimuat otomatis oleh overlay. Accent dipakai untuk highlight jawaban benar, timer, dan tombol.</div>
                </div>
              </Section>

              {/* Position */}
              <Section icon={<Monitor className="w-4 h-4 text-emerald-400" />} title="Posisi - Global">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                  <PositionPicker value={state.pos || 'center'} onChange={(v) => update('pos', v)} />
                </div>
              </Section>

              {/* Tampilan */}
              <Section icon={<ImageIcon className="w-4 h-4 text-cyan-400" />} title="Tampilan">
                <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-3">
                  <ToggleRow label="Persentase jawaban" hint="Tampilkan % vote tiap opsi setelah reveal." checked={state.showPercent} onChange={(v) => update('showPercent', v)} />
                  <ToggleRow label="Live leaderboard" hint="Papan skor kecil saat pertanyaan berjalan." checked={state.showLiveBoard} onChange={(v) => update('showLiveBoard', v)} />
                  <ToggleRow label="Avatar pemain" hint="Tampilkan foto profil TikTok di papan skor." checked={state.showAvatar} onChange={(v) => update('showAvatar', v)} />
                </div>
              </Section>

              {/* Audio */}
              <Section icon={<Volume2 className="w-4 h-4 text-amber-400" />} title="Audio">
                <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                  <ToggleRow label="SFX game" hint="Suara intro, benar, poin, dan fakta dari public/games/trivia." checked={state.sfx} onChange={(v) => update('sfx', v)} />
                  <NumberField label="Volume SFX" value={state.sfxVolume} min={0} max={100} suffix="%" onChange={(v) => update('sfxVolume', Math.max(0, Math.min(100, v)))} />
                  <label className="block">
                    <span className="text-[11px] font-bold text-gray-300">URL BGM</span>
                    <input value={state.bgmUrl} onChange={(e) => update('bgmUrl', e.target.value)} placeholder="https://.../bgm.mp3 (opsional)" className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white font-mono placeholder:text-gray-600" />
                  </label>
                  <NumberField label="Volume BGM" value={state.bgmVolume} min={0} max={100} suffix="%" onChange={(v) => update('bgmVolume', Math.max(0, Math.min(100, v)))} />
                </div>
              </Section>

              {/* API */}
              <Section icon={<Bot className="w-4 h-4 text-lime-400" />} title="Sumber Soal">
                <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                  <label className="block">
                    <span className="text-[11px] font-bold text-gray-300">Webhook Trivia</span>
                    <input value={state.apiUrl} onChange={(e) => update('apiUrl', e.target.value)} placeholder={TRIVIA_API_DEFAULT} className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-[11px] text-white font-mono placeholder:text-gray-600" />
                    <span className="text-[10px] text-gray-500 mt-1 block">Respons JSON berisi <code className="bg-white/10 px-1 rounded text-gray-300">results[]</code>. Jika gagal, overlay otomatis memakai bank soal demo.</span>
                  </label>
                  <button onClick={() => update('apiUrl', TRIVIA_API_DEFAULT)} className="w-full h-8 bg-black/30 hover:bg-black/50 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-400">Kembalikan URL Default</button>
                </div>
              </Section>

              {/* Info */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-3">
                <div className="text-orange-300 font-black uppercase text-[10px] flex items-center gap-1.5"><Trophy className="w-3 h-3" /> Alur Game</div>
                <div className="text-gray-400 text-[11px] leading-relaxed mt-1">
                  Topik (voting chat) → Aturan → Intro → Pertanyaan → Jawaban + Fakta → Leaderboard. Skor: <b className="text-white">100 / 150 / 200</b> poin + bonus kecepatan; streak menambah poin.
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[<Zap key="z" className="w-3 h-3" />, <Clock key="c" className="w-3 h-3" />, <Users key="u" className="w-3 h-3" />, <ListOrdered key="l" className="w-3 h-3" />].map((icon, i) => (
                    <span key={i} className="w-6 h-6 grid place-items-center rounded-md bg-black/30 border border-white/10 text-gray-300">{icon}</span>
                  ))}
                  <span className="text-gray-500 text-[10px] self-center ml-1">Kecepatan • Timer • Pemain • Leaderboard</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setState({ ...DEFAULT_GAME_SETTINGS })} className="flex-1 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-black uppercase text-gray-300">Reset</button>
                <button onClick={handleCopy} className="flex-1 h-9 bg-white hover:bg-zinc-100 rounded-xl text-black font-black text-[11px] uppercase flex items-center justify-center gap-1.5 border border-white"><Copy className="w-3.5 h-3.5" /> Copy URL</button>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-[#0a0a0a] p-4 md:p-6 flex flex-col min-h-[420px]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2"><Monitor className="w-4 h-4 text-white" /> Preview Simulasi - {getTopicById(state.topic).label} • pos:{state.pos || 'center'}</div>
              <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">{state.font} / {state.headingFont} • {state.questionSec}s • {state.totalQuestions} soal</span>
            </div>
            <div className="flex-1 bg-black border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl min-h-[360px]">
              <iframe key={simulateUrl} src={simulateUrl} className="absolute inset-0 w-full h-full border-0 bg-transparent" title="games-preview" />
            </div>
            <div className="mt-2 text-[10px] text-gray-500 text-center">Preview berjalan dengan data demo. Data real hanya di OBS (<code className="bg-white/10 px-1 rounded text-white">.../games/display?obs=1</code>) yang terhubung ke chat &amp; event.</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
              <a href={obsUrl} target="_blank" className="h-9 bg-white text-black rounded-xl font-black uppercase flex items-center justify-center gap-1.5"><Monitor className="w-3 h-3" /> Buka OBS (real)</a>
              <Link href="/widgets" className="h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black uppercase flex items-center justify-center gap-1.5 text-white">Widgets</Link>
              <button onClick={() => window.open(previewUrl, '_blank')} className="h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black uppercase flex items-center justify-center gap-1.5 text-white"><ExternalLink className="w-3 h-3" /> Popout Style</button>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Soal', value: state.totalQuestions, icon: <ListOrdered className="w-3 h-3" /> },
                { label: 'Timer', value: `${state.questionSec}s`, icon: <Clock className="w-3 h-3" /> },
                { label: 'Tebakan', value: `${state.maxGuesses}×`, icon: <Target className="w-3 h-3" /> },
                { label: 'Bonus/Soal', value: state.maxBonusPerQuestion, icon: <Zap className="w-3 h-3" /> },
              ].map((item) => (
                <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                  <div className="text-gray-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">{item.icon} {item.label}</div>
                  <div className="text-white font-black text-[13px] mt-0.5">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <WidgetPageModals shell={shell} onReset={reset} />
      </div>
    </div>
  );
}

export default function GamesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] grid place-items-center text-gray-500">Loading...</div>}>
      <GamesSettingsInner />
    </Suspense>
  );
}
