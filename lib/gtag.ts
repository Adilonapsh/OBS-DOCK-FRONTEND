export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID || "";

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (!GA_MEASUREMENT_ID) return;
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag !== "function") return;
  w.gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

type GTagEventParams = {
  action: string;
  category?: string;
  label?: string;
  value?: number;
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }: GTagEventParams) => {
  if (!GA_MEASUREMENT_ID) return;
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag !== "function") return;
  w.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
