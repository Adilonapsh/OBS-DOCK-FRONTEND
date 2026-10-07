import type { Metadata } from "next";
import LandingPage from "./landing-page";

export const metadata: Metadata = {
  title: "OBSDOCK - Unified Stream Control & Overlays",
  description: "Chat, gift, alert, poll, timer, goal, sampai kontrol OBS - semua dalam satu tempat. Widget OBS + Streamer.bot untuk TikTok, YouTube, Twitch, dan Kick.",
};

export default function Home() {
  return <LandingPage />;
}
