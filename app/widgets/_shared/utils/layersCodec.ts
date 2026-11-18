// Codec untuk payload `?layers=` di URL Custom Overlay.
//
// Kenapa dikompres: setting tiap widget layer ikut disimpan di URL (biar OBS
// dapat setting yang sama), sehingga JSON-nya bisa > 16 KB. Node/Next menolak
// request line sebesar itu dengan HTTP 431 (Request Header Fields Too Large).
// Solusi: gzip + base64url → URL jauh lebih pendek dan tetap tanpa server.

const PREFIX = 'gz:';

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array {
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Serialize layers → nilai query `layers`. `gz:` = gzip+base64url. */
export async function encodeLayersParam(layers: unknown): Promise<string> {
  const json = JSON.stringify(layers ?? []);
  if (typeof CompressionStream === 'undefined') return encodeURIComponent(json);
  try {
    const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'));
    const buf = await new Response(stream).arrayBuffer();
    return PREFIX + toBase64Url(new Uint8Array(buf));
  } catch {
    return encodeURIComponent(json);
  }
}

/** Parse nilai query `layers` (mendukung format lama JSON/URI-encoded). */
export async function decodeLayersParam(raw: string): Promise<unknown> {
  if (raw.startsWith(PREFIX)) {
    if (typeof DecompressionStream === 'undefined') throw new Error('Decompression unsupported');
    const bytes = fromBase64Url(raw.slice(PREFIX.length));
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
    const json = await new Response(stream).text();
    return JSON.parse(json);
  }
  try {
    return JSON.parse(raw);
  } catch {
    return JSON.parse(decodeURIComponent(raw));
  }
}
