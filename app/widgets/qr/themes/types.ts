export type QrThemeProps = {
  value: string;
  label: string;
  showLabel: boolean;
  size: number;
  fg: string;
  qrBg: string;
  bg: string;
  /** `true` = mode OBS/overlay: jangan gambar kartu background. */
  bare?: boolean;
  accent: string;
  font: string;
  fontSize: number;
  level: 'L' | 'M' | 'Q' | 'H';
  logo: string;
  brutalistBg?: string;
  brutalistTextColor?: string;
  brutalistBadgeBg?: string;
  brutalistBorderColor?: string;
  brutalistShadow?: number;
  brutalistHalftone?: boolean;
  brutalistTail?: boolean;
  brutalistItalic?: boolean;
  brutalistUppercase?: boolean;
};
