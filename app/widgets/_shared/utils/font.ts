// Unified Google Font loader — replaces 6 variants (chat/display, poll/display, clock/display, etc.)

export function loadGoogleFont(font: string, weights: string = '400;700;900', dataAttr: string = 'widget-font'): void {
  if (typeof document === 'undefined' || !font) return;
  const attr = `data-${dataAttr}`;
  const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g, '+')}:wght@${weights}&display=swap`;
  const selector = `link[${attr}="${font}"]`;
  let link = document.querySelector(selector) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.setAttribute(attr, font);
    link.href = href;
    document.head.appendChild(link);
  } else if (link.href !== href) {
    link.href = href;
  }
}

export function googleFontUrl(font: string, weights: string = '400;600;800'): string {
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g, '+')}:wght@${weights}&display=swap`;
}
