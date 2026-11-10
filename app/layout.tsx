import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Toaster from "./components/Toaster";
import ThemeProvider from "./components/ThemeProvider";
import GoogleAnalytics from "./components/GoogleAnalytics";
import RoleProvider from "./components/auth/RoleProvider";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://app.obsdock.com"
  ),
  title: {
    default: "OBS Dock- Kontrol OBS & Widget Stream dari Browser",
    template: "%s | OBS Dock",
  },
  description:
    "OBS Dock: kontrol OBS Studio Mode & scene switcher dari browser/HP, plus 14+ widget dan overlay real-time (chat, poll, goals, gift, media player + lirik) via WebSocket privat.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('obs-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'dark'}document.documentElement.classList.add(t);document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <GoogleAnalytics />
        <ThemeProvider>
          <RoleProvider>
            <Toaster />
            {children}
          </RoleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
