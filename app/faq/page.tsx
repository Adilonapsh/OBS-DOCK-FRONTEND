import type { Metadata } from 'next';
import FaqPage from './FaqPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.obsdock.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'FAQ - Pertanyaan Seputar Keluno',
  description:
    'Jawaban untuk pertanyaan yang sering diajukan tentang Keluno: OBS Studio, Browser Source, widget, private key, TikTok LIVE, Streamer.bot, dan mobile dock.',
  alternates: {
    canonical: `${SITE_URL}/faq`,
  },
};

export default function FaqRoute() {
  return <FaqPage />;
}
