"use client";

import * as Sentry from "@sentry/nextjs";
import { notFound } from "next/navigation";

export default function SentryExamplePage() {
  // Halaman ini hanya untuk testing di dev — jangan ekspos di production.
  // (NODE_ENV di-inline saat build, jadi di prod selalu 404.)
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-xl font-semibold">Sentry Test Page</h1>
        <p className="text-sm opacity-70">
          Klik tombol di bawah untuk memicu test error. Cek hasilnya di Sentry &gt;
          Issues (project obsdock).
        </p>
        <button
          type="button"
          onClick={() => {
            throw new Error("Sentry Test Error — abaikan, ini tes integrasi.");
          }}
          className="px-4 py-2 rounded-lg border text-sm font-medium"
        >
          Throw test error
        </button>
        <p className="text-xs opacity-50">
          Catatan: error hanya terkirim bila DSN sudah diisi
          (NEXT_PUBLIC_SENTRY_DSN di .env).
        </p>
        <button
          type="button"
          onClick={() => {
            Sentry.captureMessage("Sentry test message - integrasi OK", "info");
            alert("Test message terkirim ke Sentry.");
          }}
          className="px-4 py-2 rounded-lg border text-sm font-medium opacity-70"
        >
          Send test message (tanpa crash)
        </button>
      </div>
    </div>
  );
}
