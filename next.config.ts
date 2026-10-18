import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async redirects() {
    return [
      {
        source: "/config",
        destination: "/connection",
        permanent: true,
      },
      {
        source: "/config/:path*",
        destination: "/connection/:path*",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    const backend = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000").replace(/\/$/, "");
    return [
      {
        source: "/api/valo/:path*",
        destination: `${backend}/api/valo/:path*`,
      },
      {
        source: "/api/donation/:path*",
        destination: `${backend}/api/donation/:path*`,
      },
      {
        source: "/api/webhook/:path*",
        destination: `${backend}/api/webhook/:path*`,
      },
      {
        source: "/webhook/:path*",
        destination: `${backend}/webhook/:path*`,
      },
      {
        source: "/sfx/:path*",
        destination: `${backend}/sfx/:path*`,
      },
      {
        source: "/api/sfx/:path*",
        destination: `${backend}/sfx/:path*`,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "noreply",
  project: "obsdock",

  silent: !process.env.CI,

  // Perlebar upload sourcemap client agar stack trace terbaca dengan baik.
  widenClientFileUpload: true,

  // Upload sourcemap butuh SENTRY_AUTH_TOKEN. Bila belum diset (mis. dev lokal),
  // skip upload agar build tetap jalan - error reporting tetap berfungsi.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
