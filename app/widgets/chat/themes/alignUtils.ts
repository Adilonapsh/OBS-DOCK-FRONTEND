export type ChatAlign = 'left' | 'center' | 'right';

/** Normalisasi nilai ?align= dari URL / localStorage. Default kiri. */
export function normalizeChatAlign(value?: string | null): ChatAlign {
  const v = (value || '').toLowerCase();
  if (v === 'center' || v === 'middle') return 'center';
  if (v === 'right' || v === 'end') return 'right';
  return 'left';
}

/** Flex alignment untuk baris / justify-content. */
export function alignFlex(align: ChatAlign): 'flex-start' | 'center' | 'flex-end' {
  return align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start';
}

/** Alignment untuk container kolom. Kiri tetap stretch agar tampilan bawaan tema tidak berubah. */
export function alignColumn(align: ChatAlign): 'stretch' | 'center' | 'flex-end' {
  return align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'stretch';
}

/** Arah baris: kanan = avatar/pesan dibalik supaya tetap terlihat natural. */
export function alignRowDirection(align: ChatAlign): 'row' | 'row-reverse' {
  return align === 'right' ? 'row-reverse' : 'row';
}
