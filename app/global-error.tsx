"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-xl font-semibold">Terjadi kesalahan</h2>
          <p className="text-sm opacity-70">
            Maaf, ada yang tidak beres. Tim kami sudah menerima laporannya.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 rounded-lg border text-sm font-medium"
          >
            Coba lagi
          </button>
        </div>
      </body>
    </html>
  );
}
