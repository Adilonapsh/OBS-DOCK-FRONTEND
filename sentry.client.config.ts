import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Route OBS Browser Source - jangan dikirim ke Sentry biar tidak membakar kuota.
// Contoh: /overlay/*, /widgets/*/display, /designer/display, */display
function isExcludedPath(pathname: string) {
  if (pathname.includes("/display")) return true;
  if (pathname.startsWith("/overlay")) return true;
  if (pathname.startsWith("/monitor/fullscreen")) return true;
  return false;
}

Sentry.init({
  dsn,
  enabled: !!dsn,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,

  // Performance monitoring: 100% di dev, 10% di production.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Jangan aktifkan Session Replay dulu (hemat bundle + hindari merekam overlay OBS).
  // Aktifkan bila butuh: replaysSessionSampleRate: 0.1, replaysOnErrorSampleRate: 1.0,

  debug: false,

  beforeSend(event) {
    try {
      if (typeof window !== "undefined" && isExcludedPath(window.location.pathname)) {
        return null;
      }
    } catch {
      // abaikan, kirim event seperti biasa
    }
    return event;
  },
});
