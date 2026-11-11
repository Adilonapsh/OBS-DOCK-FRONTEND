import type { Metadata } from "next";
import LandingPage from "./landing-page";

// Ganti dengan domain produksi bila sudah live (dipakai canonical + Open Graph).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://app.obsdock.com";

const TITLE = "Keluno - Kontrol OBS & 14+ Widget Stream dari Browser";
const DESCRIPTION =
  "Kontrol OBS Studio Mode, ganti scene, atur audio, dan pasang 14+ widget interaktif (chat, poll, goals, overlay gift, media player + lirik, timer, ticker, QR) langsung dari browser. Terhubung via Browser Source & WebSocket privat. Gratis, setup 60 detik.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | Keluno",
  },
  description: DESCRIPTION,
  keywords: [
    "Keluno",
    "OBS Studio control",
    "OBS WebSocket",
    "Browser Source OBS",
    "stream overlay",
    "widget stream",
    "chat overlay",
    "TikTok LIVE widget",
    "YouTube Live chat",
    "Twitch overlay",
    "Streamlabs overlay",
    "mobile dock OBS",
  ],
  authors: [{ name: "Keluno" }],
  creator: "Keluno",
  category: "Streaming Tools",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Keluno",
    locale: "id_ID",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/assets/dock-preview.png",
        width: 1200,
        height: 630,
        alt: "Keluno Controller Interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/assets/dock-preview.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Keluno",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" },
  description: DESCRIPTION,
  url: SITE_URL,
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <LandingPage />
    </>
  );
}
