import Image from "next/image";

type LogoVariant = "normal" | "light" | "dark";

const LOGO_SRC: Record<LogoVariant, string> = {
  normal: "/assets/logo/Keluno_icon_normal.webp",
  light: "/assets/logo/Keluno_icon_light.webp",
  dark: "/assets/logo/Keluno_icon_dark.webp",
};

export default function Logo({
  size = 22,
  variant = "normal",
  className = "object-contain",
}: {
  size?: number;
  variant?: LogoVariant;
  className?: string;
}) {
  return (
    <Image src={LOGO_SRC[variant]} alt="Keluno" width={size} height={size} className={className} />
  );
}
