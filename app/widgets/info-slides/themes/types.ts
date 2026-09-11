import type { InfoSlide } from '../config';

export type InfoSlidesThemeProps = {
  slides: InfoSlide[];
  index: number;
  font: string;
  fontSize: number;
  accent: string;
  bg: string;
  bgOpacity: number;
  textColor: string;
  showBadge: boolean;
  showProgress: boolean;
  showArrows: boolean;
  anim: string;
  duration: number;
  onPrev?: () => void;
  onNext?: () => void;
};
