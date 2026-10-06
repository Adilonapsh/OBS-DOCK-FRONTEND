"use client";

import { Suspense, useEffect } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { GA_MEASUREMENT_ID, pageview } from "@/lib/gtag";

// Route OBS Browser Source — jangan dihitung di GA biar tidak mengotori pageview.
// Contoh: /overlay/*, /widgets/*/display, /designer/display, */display
function isExcludedPath(pathname: string | null) {
  if (!pathname) return false;
  if (pathname.includes("/display")) return true;
  if (pathname.startsWith("/overlay")) return true;
  if (pathname.startsWith("/monitor/fullscreen")) return true;
  return false;
}

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;
    if (isExcludedPath(pathname)) return;
    const query = searchParams?.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    pageview(url);
  }, [pathname, searchParams]);

  return null;
}

export default function GoogleAnalytics() {
  const pathname = usePathname();

  // Jangan load script GA sama sekali di route overlay/display.
  if (!GA_MEASUREMENT_ID) return null;
  if (isExcludedPath(pathname)) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
    </>
  );
}
