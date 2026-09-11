// Simple AES-GCM encryption untuk password OBS/Streamer.bot
// keySource = private_key user atau fallback env/default. Tidak untuk auth password user Supabase.

async function getKey(keySource: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(keySource));
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encrypt(text: string, keySource: string): Promise<string> {
  if (!text) return "";
  try {
    const key = await getKey(keySource);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text));
    const combined = new Uint8Array(iv.length + cipher.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipher), iv.length);
    return btoa(String.fromCharCode(...combined));
  } catch {
    // fallback plain base64 jika WebCrypto gagal (misal non-secure context)
    return btoa(text);
  }
}

export async function decrypt(cipherText: string, keySource: string): Promise<string> {
  if (!cipherText) return "";
  try {
    const key = await getKey(keySource);
    const combined = Uint8Array.from(atob(cipherText), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return new TextDecoder().decode(plain);
  } catch {
    // fallback: coba atob plain, kalau gagal return as is
    try { return atob(cipherText); } catch { return cipherText; }
  }
}

// helper sync untuk cek apakah sudah terenkripsi (base64 & panjang)
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  // encrypted kita selalu base64 panjang > 20 dan bukan plain pendek
  try {
    const decoded = atob(value);
    return decoded.length > 12 && value.length > 20;
  } catch { return false; }
}
