'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertTriangle,
  ArrowLeft,
  Bug,
  CheckCircle2,
  ChevronRight,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  Mail,
  Menu,
  MessageSquare,
  Send,
  Tag,
  User,
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';

const CATEGORIES = [
  { value: 'bug', label: 'Bug / Error' },
  { value: 'account', label: 'Akun & Login' },
  { value: 'widget', label: 'Widget / Overlay' },
  { value: 'integration', label: 'Integrasi (OBS, Streamer.bot, TikTok)' },
  { value: 'feature', label: 'Saran Fitur' },
  { value: 'other', label: 'Lainnya' },
] as const;

const INPUT_CLASS =
  'w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-[13px] font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-[#005ea6] transition-colors';

export default function SupportPage() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    category: 'bug',
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  // Honeypot: harus tetap kosong. Bot biasanya mengisi semua field.
  const [honeypot, setHoneypot] = useState('');
  const formOpenedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;
        const sessionUser = session?.user ?? null;
        setUser(sessionUser);
        if (sessionUser) {
          setForm((prev) => ({
            ...prev,
            name: prev.name || String(sessionUser.user_metadata?.username ?? ''),
            email: prev.email || sessionUser.email || '',
          }));
        }
      } finally {
        if (active) setSessionReady(true);
      }
    })();
    return () => { active = false; };
  }, [supabase]);

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = form.name.trim();
    const email = form.email.trim();
    const subject = form.subject.trim();
    const message = form.message.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Masukkan email yang valid supaya kami bisa membalas.');
      return;
    }
    if (subject.length < 3) {
      setError('Judul laporan minimal 3 karakter.');
      return;
    }
    if (message.length < 10) {
      setError('Detail laporan minimal 10 karakter.');
      return;
    }

    // Cegah spam: 1 laporan per menit per browser.
    try {
      const last = Number(localStorage.getItem('support_last_submit_at') || 0);
      const waitMs = 60_000 - (Date.now() - last);
      if (waitMs > 0) {
        setError(`Tunggu ${Math.ceil(waitMs / 1000)} detik sebelum mengirim laporan lagi.`);
        return;
      }
    } catch { }

    setSending(true);
    try {
      // Semua validasi & rate limit dijalankan di server (RPC security definer).
      // Insert langsung ke tabel sudah dicabut supaya tidak bisa di-bypass.
      const { error: submitError } = await (supabase as any).rpc('submit_support_ticket', {
        p_name: name,
        p_email: email,
        p_category: form.category,
        p_subject: subject,
        p_message: message,
        p_page_url: typeof window !== 'undefined' ? window.location.href : null,
        p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null,
        p_honeypot: honeypot,
        p_elapsed_ms: Math.max(0, Date.now() - formOpenedAtRef.current),
      });

      if (submitError) {
        const messageText = submitError.message || '';
        const map: Record<string, string> = {
          TOO_FAST: 'Form terkirim terlalu cepat. Coba lagi setelah beberapa detik.',
          INVALID_EMAIL: 'Email tidak valid.',
          INVALID_NAME: 'Nama terlalu panjang.',
          INVALID_SUBJECT: 'Judul harus 3–200 karakter.',
          INVALID_MESSAGE: 'Detail harus 10–5000 karakter.',
          DUPLICATE_TICKET: 'Laporan yang sama sudah terkirim. Tunggu 10 menit sebelum mengirim ulang.',
          RATE_LIMIT_IP: 'Terlalu banyak laporan dari jaringan ini. Coba lagi nanti.',
          RATE_LIMIT_EMAIL: 'Email ini sudah mengirim terlalu banyak laporan. Coba lagi nanti.',
          RATE_LIMIT_USER: 'Akun ini sudah mengirim terlalu banyak laporan. Coba lagi nanti.',
          RATE_LIMIT_GLOBAL: 'Server sedang menerima banyak laporan. Coba lagi beberapa saat lagi.',
        };
        const key = Object.keys(map).find((k) => messageText.includes(k));
        console.error('support submit error', submitError);
        setError(
          key
            ? map[key]
            : messageText.toLowerCase().includes('does not exist')
              ? 'Fitur support belum aktif. Jalankan migration 029_support_ticket_hardening.sql di Supabase.'
              : 'Gagal mengirim laporan. Coba lagi beberapa saat lagi.'
        );
        return;
      }

      try { localStorage.setItem('support_last_submit_at', String(Date.now())); } catch { }
      setSuccess(true);
      setHoneypot('');
      formOpenedAtRef.current = Date.now();
      setForm((prev) => ({ ...prev, subject: '', message: '', category: 'bug' }));
    } catch (err) {
      console.error('support submit error', err);
      setError('Gagal mengirim laporan. Periksa koneksi lalu coba lagi.');
    } finally {
      setSending(false);
    }
  };

  const content = (
    <main className="flex-1 p-4 md:p-6 w-full max-w-[960px] mx-auto space-y-6">
      {/* Hero */}
      <div className="pt-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#005ea6]/15 border border-[#005ea6]/30 text-[9px] font-black uppercase tracking-widest text-[#7db9e8]">
          <LifeBuoy className="w-3 h-3" /> Support Center
        </span>
        <h1 className="mt-3 text-2xl md:text-3xl font-black tracking-tight">
          Ada kendala? Laporkan ke kami.
        </h1>
        <p className="mt-2 text-[12px] md:text-[13px] text-gray-400 max-w-[620px] leading-relaxed">
          Kirim bug report, masalah akun, atau saran fitur lewat form di bawah. Laporan
          langsung masuk ke dashboard admin Keluno dan dibalas via email yang kamu isi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
        {/* Form */}
        <div className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 bg-blue-600/10 flex items-center justify-between">
            <h2 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center gap-2">
              <Bug className="w-3.5 h-3.5 text-blue-400" /> Bug Report / Kontak
            </h2>
            <span className="text-[9px] font-bold text-gray-500">Keluno Support</span>
          </div>

          <div className="p-5">
            {success ? (
              <div className="py-8 flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 grid place-items-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-white font-black text-sm uppercase tracking-widest">Laporan terkirim</h3>
                <p className="text-[12px] text-gray-400 max-w-[380px] leading-relaxed">
                  Terima kasih! Laporan kamu sudah kami terima. Kami akan membalas ke
                  <span className="text-white font-bold"> {form.email || 'email yang kamu isi'}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => { setSuccess(false); setError(null); }}
                  className="mt-2 h-10 px-5 rounded-xl btn-secondary border font-black text-[10px] uppercase tracking-widest"
                >
                  Kirim laporan lain
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-[11px] font-bold text-red-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1.5">Nama</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                      <input
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        placeholder="Nama kamu"
                        maxLength={120}
                        className={`${INPUT_CLASS} pl-9`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1.5">Email <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        placeholder="email@contoh.com"
                        maxLength={200}
                        required
                        className={`${INPUT_CLASS} pl-9`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1.5">Kategori</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                    <select
                      value={form.category}
                      onChange={(e) => update('category', e.target.value)}
                      className={`${INPUT_CLASS} pl-9 appearance-none cursor-pointer`}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value} className="bg-[#161616]">{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1.5">Judul laporan <span className="text-red-400">*</span></label>
                  <input
                    value={form.subject}
                    onChange={(e) => update('subject', e.target.value)}
                    placeholder="Contoh: Widget chat tidak muncul di OBS"
                    maxLength={200}
                    required
                    className={INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className="block text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1.5">Detail <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-500" />
                    <textarea
                      value={form.message}
                      onChange={(e) => update('message', e.target.value)}
                      placeholder="Jelaskan langkah yang kamu lakukan, apa yang terjadi, dan apa yang kamu harapkan. Sertakan link screenshot/video kalau ada."
                      maxLength={5000}
                      required
                      className={`${INPUT_CLASS} h-auto min-h-[150px] py-2.5 pl-9 leading-relaxed resize-y`}
                    />
                  </div>
                  <div className="mt-1 text-right text-[9px] font-bold text-gray-600">
                    {form.message.length}/5000
                  </div>
                </div>

                {/* Honeypot anti-bot: tidak terlihat oleh manusia */}
                <div className="absolute opacity-0 pointer-events-none -z-10 h-0 w-0 overflow-hidden" aria-hidden="true">
                  <label htmlFor="support-website">Website</label>
                  <input
                    id="support-website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full h-11 rounded-xl btn-primary font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Mengirim...' : 'Kirim Laporan'}
                </button>
                <p className="text-[9px] text-gray-600 text-center leading-relaxed">
                  Data yang dikirim hanya dipakai untuk menangani laporan kamu.
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div className="bg-[#161616] border border-white/10 rounded-2xl p-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white mb-3 flex items-center gap-2">
              <LifeBuoy className="w-3.5 h-3.5 text-blue-400" /> Sebelum mengirim
            </h3>
            <ul className="space-y-2.5 text-[11px] text-gray-400 leading-relaxed">
              <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" /> Cek FAQ di halaman utama dulu.</li>
              <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" /> Tulis nama widget/panel yang bermasalah.</li>
              <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" /> Sertakan langkah reproduce & link screenshot.</li>
              <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" /> Pastikan email aktif untuk balasan.</li>
            </ul>
          </div>

          <div className="bg-[#161616] border border-white/10 rounded-2xl p-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white mb-2">Estimasi balasan</h3>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Maksimal <span className="text-white font-bold">1 × 24 jam</span> pada hari kerja.
              Laporan bug dengan langkah jelas diprioritaskan.
            </p>
          </div>

          <div className="bg-[#161616] border border-white/10 rounded-2xl p-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white mb-2">Link penting</h3>
            <div className="flex flex-col gap-1.5">
              <Link href="/#faq" className="text-[11px] font-bold text-gray-400 hover:text-white transition-colors">FAQ</Link>
              <Link href="/terms" className="text-[11px] font-bold text-gray-400 hover:text-white transition-colors">Syarat & Ketentuan</Link>
              <Link href="/privacy" className="text-[11px] font-bold text-gray-400 hover:text-white transition-colors">Kebijakan Privasi</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {user && <Sidebar active="support" open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />}

      <div className={`flex-1 flex flex-col min-w-0 ${user ? 'lg:pl-[240px]' : ''}`}>
        <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {user ? (
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white">
                <Menu className="w-5 h-5" />
              </button>
            ) : (
              <Link href="/" className="inline-flex items-center" aria-label="Keluno">
                <Image src="/assets/logo/Keluno_Wordmark.webp" alt="Keluno" width={200} height={81} className="h-8 w-auto object-contain" priority />
              </Link>
            )}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 bg-white/10 border border-white/10 rounded text-[8px] font-black tracking-widest text-white">
              SUPPORT
            </span>
            {user?.email && (
              <span className="hidden md:inline text-[10px] text-gray-500 font-bold truncate max-w-[200px]">{user.email}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href={user ? '/dashboard' : '/'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 btn-secondary border rounded-lg text-[10px] font-black uppercase"
            >
              {user ? <LayoutDashboard className="w-3 h-3" /> : <ArrowLeft className="w-3 h-3" />}
              {user ? 'Dashboard' : 'Beranda'}
            </Link>
          </div>
        </header>

        {!sessionReady ? (
          <div className="flex-1 grid place-items-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        ) : content}
      </div>
    </div>
  );
}
