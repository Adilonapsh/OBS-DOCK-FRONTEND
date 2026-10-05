import type { NextConfig } from "next";

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
};

export default nextConfig;
