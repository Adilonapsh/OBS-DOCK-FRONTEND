import { defaultTheme } from "./default";

export const googleFonts: { value: string; label: string; category: string }[] = [
  { value: "Outfit", label: "Outfit", category: "Sans" },
  { value: "Inter", label: "Inter", category: "Sans" },
  { value: "Poppins", label: "Poppins", category: "Sans" },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans", category: "Sans" },
  { value: "Space Grotesk", label: "Space Grotesk", category: "Sans" },
  { value: "Manrope", label: "Manrope", category: "Sans" },
  { value: "Urbanist", label: "Urbanist", category: "Sans" },
  { value: "Barlow", label: "Barlow", category: "Sans" },
  { value: "Be Vietnam Pro", label: "Be Vietnam Pro", category: "Sans" },
  { value: "JetBrains Mono", label: "JetBrains Mono", category: "Mono" },
  { value: "Space Mono", label: "Space Mono", category: "Mono" },
  { value: "Bebas Neue", label: "Bebas Neue", category: "Display" },
  { value: "Anton", label: "Anton", category: "Display" },
  { value: "Righteous", label: "Righteous", category: "Display" },
  { value: "Fredoka", label: "Fredoka", category: "Display" },
  { value: "Comfortaa", label: "Comfortaa", category: "Display" },
];

export function googleFontUrl(fontFamily: string): string {
  const f = (fontFamily || defaultTheme.fontFamily).trim().replace(/\s+/g, "+");
  return `https://fonts.googleapis.com/css2?family=${f}:wght@400;600;700;800;900&display=swap`;
}
