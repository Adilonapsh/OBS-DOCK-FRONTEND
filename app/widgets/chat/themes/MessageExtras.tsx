'use client';
import type { ChatItem } from './types';
import { canEmbedImages, extractImageUrls, extractYouTubeVideoId, youtubeThumb } from './chatFilters';

// Lampiran pesan ala nutty: embed gambar (sesuai permission) + preview link YouTube.
export function MessageExtras({
  chat,
  permissionLevel,
  showYouTubePreview,
  dark = true,
}: {
  chat: ChatItem;
  permissionLevel?: string | number;
  showYouTubePreview?: boolean;
  dark?: boolean;
}) {
  const images = canEmbedImages(chat, permissionLevel ?? '69420')
    ? extractImageUrls(chat.comment)
    : [];
  const ytId = showYouTubePreview ? extractYouTubeVideoId(chat.comment) : null;

  if (images.length === 0 && !ytId) return null;

  return (
    <span className="block mt-1 space-y-1">
      {images.map((src) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt="embed"
          loading="lazy"
          className="rounded-lg max-h-36 w-auto max-w-full object-contain border"
          style={{ borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)' }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ))}
      {ytId && (
        <a
          href={`https://youtu.be/${ytId}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-lg overflow-hidden border max-w-[260px]"
          style={{
            borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
            background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={youtubeThumb(ytId)} alt="YouTube preview" className="w-20 h-12 object-cover shrink-0" loading="lazy" />
          <span
            className="text-[10px] font-bold truncate pr-2"
            style={{ color: dark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)' }}
          >
            ▶ YouTube — tonton
          </span>
        </a>
      )}
    </span>
  );
}
