'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  HelpCircle,
  LifeBuoy,
  Search,
  Sparkles,
} from 'lucide-react';
import { FAQ_ITEMS } from '../lib/faq';

export default function FaqPage() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<number | null>(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ_ITEMS;
    return FAQ_ITEMS.filter((item) =>
      `${item.q} ${item.a}`.toLowerCase().includes(q)
    );
  }, [query]);

  const hasQuery = query.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-[#e2e8f0]">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center shrink-0" aria-label="Keluno">
            <Image
              src="/assets/logo/Keluno_Wordmark.webp"
              alt="Keluno"
              width={200}
              height={81}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[12px] font-bold text-[#334155] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Beranda
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center h-9 px-3.5 rounded-full border border-[#e2e8f0] bg-white text-[12px] font-bold text-[#334155] hover:border-[#cbd5e1] hover:text-[#0f172a] transition-colors"
            >
              Support
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#005ea6] hover:bg-[#004a8c] text-[#ffffff] text-[12px] font-bold transition-colors"
            >
              Mulai Gratis <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[880px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DDF1FF] border border-[#b9e0fb] text-[10px] font-black uppercase tracking-widest text-[#005ea6]">
            <HelpCircle className="w-3.5 h-3.5" /> Pusat Bantuan
          </span>
          <h1 className="mt-4 text-[clamp(1.9rem,5vw,3rem)] font-extrabold tracking-[-0.03em] text-[#0a0e1a] leading-[1.15]">
            Pertanyaan yang sering diajukan
          </h1>
          <p className="mt-3 text-[14px] sm:text-[15px] text-[#64748b] max-w-[560px] mx-auto leading-relaxed">
            Cari jawaban cepat tentang OBS, widget, TikTok LIVE, private key,
            dan fitur Keluno lainnya.
          </p>
        </div>

        <div className="mt-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(0);
            }}
            placeholder="Cari pertanyaan… contoh: private key, OBS, TikTok"
            aria-label="Cari FAQ"
            className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-[#e2e8f0] text-[13px] font-medium text-[#0f172a] placeholder:text-[#94a3b8] shadow-[0_2px_10px_rgba(15,23,42,0.04)] focus:outline-none focus:border-[#005ea6] focus:ring-2 focus:ring-[#005ea6]/15 transition-colors"
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-[11px] font-bold text-[#64748b]">
          <span>
            {hasQuery
              ? `${filtered.length} hasil untuk “${query.trim()}”`
              : `${FAQ_ITEMS.length} pertanyaan`}
          </span>
          {hasQuery && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-[#005ea6] hover:text-[#004a8c] transition-colors"
            >
              Hapus pencarian
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-4 bg-white border border-[#e2e8f0] rounded-2xl p-10 text-center">
            <HelpCircle className="w-9 h-9 text-[#94a3b8] mx-auto" />
            <h2 className="mt-3 text-[15px] font-extrabold text-[#0a0e1a]">
              Belum ada jawaban yang cocok
            </h2>
            <p className="mt-1.5 text-[13px] text-[#64748b] leading-relaxed">
              Coba kata kunci lain, atau kirim pertanyaanmu ke tim support.
            </p>
            <Link
              href="/support"
              className="mt-4 inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#005ea6] hover:bg-[#004a8c] text-[#ffffff] text-[11px] font-black uppercase tracking-wider transition-colors"
            >
              <LifeBuoy className="w-4 h-4" /> Hubungi Support
            </Link>
          </div>
        ) : (
          <div className="mt-4 bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            {filtered.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={item.q} className="border-b border-[#e2e8f0] last:border-0">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left font-bold text-[14px] sm:text-[15px] text-[#0a0e1a] hover:bg-[#f8fafc] transition-colors"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-[#64748b] transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ${
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <p
                      className={`overflow-hidden px-5 sm:px-6 m-0 text-[#475569] text-[13px] sm:text-sm leading-[1.75] transition-all ${
                        isOpen ? 'pb-5' : 'pb-0'
                      }`}
                    >
                      {item.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 rounded-2xl bg-[#0a0e1a] p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 w-40 h-40 rounded-full bg-[#005ea6]/30 blur-2xl"
          />
          <div className="relative">
            <h2 className="text-[16px] font-extrabold text-[#ffffff] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7db9e8]" /> Masih butuh bantuan?
            </h2>
            <p className="mt-1.5 text-[12px] text-[#94a3b8] leading-relaxed max-w-[480px]">
              Kirim bug report atau pertanyaan lewat halaman support. Tim Keluno
              akan membalas via email.
            </p>
          </div>
          <Link
            href="/support"
            className="relative shrink-0 inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-[#005ea6] hover:bg-[#004a8c] text-[#ffffff] text-[11px] font-black uppercase tracking-wider transition-colors"
          >
            <LifeBuoy className="w-4 h-4" /> Buka Support
          </Link>
        </div>
      </main>

      <footer className="border-t border-[#e2e8f0] bg-white">
        <div className="max-w-[880px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#64748b]">
          <p>© 2026 Keluno. All rights reserved.</p>
          <div className="flex items-center gap-4 font-bold">
            <Link href="/" className="hover:text-[#0f172a] transition-colors">
              Beranda
            </Link>
            <Link href="/support" className="hover:text-[#0f172a] transition-colors">
              Support
            </Link>
            <Link href="/terms" className="hover:text-[#0f172a] transition-colors">
              Syarat
            </Link>
            <Link href="/privacy" className="hover:text-[#0f172a] transition-colors">
              Privasi
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
