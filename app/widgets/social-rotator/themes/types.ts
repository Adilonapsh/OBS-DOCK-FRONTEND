import type { SocialItem } from '../config';

export type SocialRotatorThemeProps = {
  socials: SocialItem[];
  index: number;
  font: string;
  fontSize: number;
  accent: string;
  bg: string;
  bgOpacity: number;
  textColor: string;
  showIcon: boolean;
  showHandle: boolean;
  showLabel: boolean;
  anim: string;
  duration: number;
  onPrev?: () => void;
  onNext?: () => void;
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
