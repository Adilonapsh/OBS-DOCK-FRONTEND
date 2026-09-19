export type ViewCounterThemeProps = {
  counts: Record<string, number>;
  total: number;
  font: string;
  fontSize: number;
  accent: string;
  bg: string;
  showLabel: boolean;
  showBreakdown: boolean;
  inline: boolean;
  emptyLabel: string;
};
