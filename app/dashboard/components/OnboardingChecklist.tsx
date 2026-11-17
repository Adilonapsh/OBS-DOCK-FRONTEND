'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronUp,
  Layers,
  Monitor,
  Music2,
  Plug,
  Rocket,
  X,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type StepId = 'obs' | 'tiktok' | 'widget' | 'streamerbot';

type Step = {
  id: StepId;
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: React.ElementType;
  optional?: boolean;
};

const STEPS: Step[] = [
  {
    id: 'obs',
    title: 'Hubungkan OBS Studio',
    description:
      'Buka halaman Connections → OBS Studio. Aktifkan WebSocket di OBS (Tools → WebSocket Server Settings), lalu isi host, port, dan password di sana dan simpan.',
    href: '/connections',
    cta: 'Buka Connections',
    icon: Monitor,
  },
  {
    id: 'tiktok',
    title: 'Hubungkan akun TikTok',
    description:
      'Buka halaman Connections → TikTok, isi username TikTok, lalu simpan. Chat, gift, like, dan jumlah penonton akan masuk saat live.',
    href: '/connections',
    cta: 'Buka Connections',
    icon: Music2,
  },
  {
    id: 'widget',
    title: 'Tambahkan widget ke OBS',
    description:
      'Pilih widget atau overlay, salin URL OBS-nya, lalu tambahkan sebagai Browser Source di OBS. Ukuran rekomendasi 1920×1080.',
    href: '/widgets',
    cta: 'Pilih Widget',
    icon: Layers,
  },
  {
    id: 'streamerbot',
    title: 'Hubungkan Streamer.bot',
    description:
      'Opsional. Diatur di halaman Connections → Streamer.bot. Diperlukan kalau kamu juga live di Twitch/YouTube/Kick atau memakai event & action Streamer.bot.',
    href: '/connections',
    cta: 'Buka Connections',
    icon: Plug,
    optional: true,
  },
];

const DISMISS_KEY = (userId: string) => `keluno:onboarding:dismissed:${userId}`;
const MANUAL_KEY = (userId: string) => `keluno:onboarding:manual:${userId}`;

function readManual(userId: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(MANUAL_KEY(userId));
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function readLocalDetection(): Record<StepId, boolean> {
  const result: Record<StepId, boolean> = {
    obs: false,
    tiktok: false,
    widget: false,
    streamerbot: false,
  };

  if (typeof window === 'undefined') return result;

  try {
    result.obs = localStorage.getItem('keluno:obs-connected') === '1';
    result.tiktok = localStorage.getItem('keluno:tiktok-connected') === '1';
    result.widget = localStorage.getItem('keluno:overlay-copied') === '1';
    result.streamerbot = localStorage.getItem('keluno:streamerbot-connected') === '1';

    // fallback: config TikTok yang pernah disimpan (mis. sebelum checklist ada)
    if (!result.tiktok) {
      const raw = localStorage.getItem('tiktok-config');
      if (raw) {
        const cfg = JSON.parse(raw) as { username?: string };
        result.tiktok = Boolean(String(cfg?.username ?? '').trim());
      }
    }
  } catch {
    // localStorage bisa diblokir di mode privat; abaikan.
  }

  return result;
}

export default function OnboardingChecklist({ userId }: { userId?: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [detected, setDetected] = useState<Record<StepId, boolean>>({
    obs: false,
    tiktok: false,
    widget: false,
    streamerbot: false,
  });
  const [manual, setManual] = useState<Record<string, boolean>>({});

  const openChecklist = useCallback(() => {
    if (!userId) return;
    setDismissed(false);
    try {
      localStorage.removeItem(DISMISS_KEY(userId));
    } catch {
      // ignore
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    setManual(readManual(userId));
    setDetected(readLocalDetection());
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY(userId)) === '1');
    } catch {
      setDismissed(false);
    }
    setReady(true);

    (async () => {
      const [obsRes, tiktokRes, streamerbotRes] = await Promise.all([
        supabase.from('obs_configs').select('user_id').eq('user_id', userId).maybeSingle(),
        supabase.from('tiktok_configs').select('username').eq('user_id', userId).maybeSingle(),
        supabase.from('streamerbot_configs').select('user_id').eq('user_id', userId).maybeSingle(),
      ]);

      if (!active) return;

      const tiktokUsername = String((tiktokRes.data as { username?: string } | null)?.username ?? '').trim();

      setDetected((prev) => ({
        ...prev,
        obs: prev.obs || Boolean(obsRes.data),
        tiktok: prev.tiktok || tiktokUsername.length > 0,
        streamerbot: prev.streamerbot || Boolean(streamerbotRes.data),
      }));
    })().catch(() => {
      // Tabel config mungkin belum ada / offline. Deteksi lokal tetap dipakai.
    });

    return () => {
      active = false;
    };
  }, [supabase, userId]);

  useEffect(() => {
    const handler = () => openChecklist();
    window.addEventListener('keluno:onboarding-open', handler);
    return () => window.removeEventListener('keluno:onboarding-open', handler);
  }, [openChecklist]);

  const isDone = useCallback(
    (id: StepId) => Boolean(manual[id] || detected[id]),
    [detected, manual]
  );

  const requiredSteps = STEPS.filter((step) => !step.optional);
  const completedRequired = requiredSteps.filter((step) => isDone(step.id)).length;
  const totalRequired = requiredSteps.length;
  const allDone = completedRequired >= totalRequired;
  const percent = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;

  const markDone = (id: StepId) => {
    if (!userId) return;
    setManual((prev) => {
      const next = { ...prev, [id]: true };
      try {
        localStorage.setItem(MANUAL_KEY(userId), JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const dismiss = () => {
    if (!userId) return;
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY(userId), '1');
    } catch {
      // ignore
    }
  };

  if (!userId || !ready) return null;

  // Semua selesai + sudah disembunyikan → tidak perlu tampil lagi.
  if (dismissed && allDone) return null;

  if (dismissed) {
    return (
      <section
        id="onboarding"
        className="bg-[#161616] border border-white/10 rounded-2xl p-4 flex items-center gap-3"
      >
        <div className="w-9 h-9 rounded-xl bg-[#005ea6]/15 border border-[#005ea6]/30 grid place-items-center shrink-0">
          <Rocket className="w-4 h-4 text-[#7db9e8]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-white">
              Panduan setup
            </span>
            <span className="text-[9px] font-black text-gray-400">
              {completedRequired}/{totalRequired}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#005ea6] transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={openChecklist}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 btn-secondary border rounded-lg text-[9px] font-black uppercase tracking-wider"
        >
          Lanjutkan <ArrowRight className="w-3 h-3" />
        </button>
      </section>
    );
  }

  return (
    <section
      id="onboarding"
      className="relative overflow-hidden bg-[#161616] border border-[#005ea6]/25 rounded-2xl"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-20 w-64 h-64 rounded-full bg-[#005ea6]/15 blur-3xl"
      />

      <div className="relative p-5 border-b border-white/5">
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-2xl border grid place-items-center shrink-0 ${
              allDone
                ? 'bg-emerald-500/15 border-emerald-500/30'
                : 'bg-[#005ea6]/15 border-[#005ea6]/30'
            }`}
          >
            {allDone ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Rocket className="w-5 h-5 text-[#7db9e8]" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-white font-black text-[14px] tracking-tight">
                {allDone ? 'Setup selesai!' : 'Selesaikan setup Keluno'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#005ea6]/15 border border-[#005ea6]/30 text-[8px] font-black uppercase tracking-widest text-[#7db9e8]">
                Panduan awal
              </span>
            </div>
            <p className="mt-1 text-[11px] text-gray-400 leading-relaxed max-w-[640px]">
              {allDone
                ? 'Semua langkah wajib sudah beres. Kamu siap untuk live pertama di Keluno.'
                : 'Ikuti langkah di bawah supaya OBS, TikTok, dan widget sudah tersambung sebelum kamu mulai live.'}
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-black text-white">{completedRequired}</span>
            <span className="text-[10px] font-bold text-gray-500">/ {totalRequired}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                allDone ? 'bg-emerald-500' : 'bg-[#005ea6]'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-[9px] font-black text-gray-400 shrink-0">{percent}%</span>
          <span className="sm:hidden text-[9px] font-black text-gray-400 shrink-0">
            {completedRequired}/{totalRequired}
          </span>
        </div>
      </div>

      <div className="relative divide-y divide-white/5">
        {STEPS.map((step, index) => {
          const done = isDone(step.id);
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 transition-colors ${
                done ? 'bg-emerald-500/[0.03]' : 'hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl border grid place-items-center shrink-0 mt-0.5 ${
                    done
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-gray-400'
                  }`}
                >
                  {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[12px] font-black ${
                        done ? 'text-white/60' : 'text-white'
                      }`}
                    >
                      {index + 1}. {step.title}
                    </span>
                    {step.optional && (
                      <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-wider text-gray-500">
                        Opsional
                      </span>
                    )}
                    {done && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-[8px] font-black uppercase tracking-wider text-emerald-400">
                        Selesai
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-1 text-[10.5px] leading-relaxed ${
                      done ? 'text-gray-600' : 'text-gray-400'
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:shrink-0 pl-11 sm:pl-0">
                {!done && (
                  <button
                    type="button"
                    onClick={() => markDone(step.id)}
                    className="h-8 px-2.5 rounded-lg border border-white/10 text-[9px] font-black uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    title="Tandai langkah ini selesai"
                  >
                    Tandai
                  </button>
                )}
                <Link
                  href={step.href}
                  className={`h-8 px-3 rounded-lg inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider border transition-colors ${
                    done ? 'btn-secondary' : 'btn-primary'
                  }`}
                >
                  {step.cta} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative px-5 py-3 border-t border-white/5 flex items-center justify-between gap-3">
        <p className="text-[9px] font-bold text-gray-600">
          Panduan ini bisa dibuka lagi dari tombol <span className="text-gray-400">Panduan</span> di bawah dashboard.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-gray-500 hover:text-white transition-colors"
        >
          {allDone ? <X className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          {allDone ? 'Sembunyikan' : 'Ringkas'}
        </button>
      </div>
    </section>
  );
}
