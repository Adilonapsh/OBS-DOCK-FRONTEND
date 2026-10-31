import type { ReactNode } from "react";
import Logo from "../../components/Logo";

type AuthLayoutProps = {
  logo?: ReactNode;
  brandTitle?: string;
  tagline?: ReactNode;
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
  after?: ReactNode;
};

// Shell yang sebelumnya diduplikasi di login / register / forgot-password / reset-password.
export default function AuthLayout({
  logo = <Logo />,
  brandTitle = "STREAM CONTROLS",
  tagline,
  icon,
  title,
  subtitle,
  children,
  footerLeft = <span className="text-[8px] font-bold text-gray-600 uppercase">© 2026 OBS Overlays</span>,
  footerRight = <span className="text-[8px] font-bold text-gray-500 uppercase">v1.0 • TruOverlay</span>,
  after,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] bg-blue-600/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-32 -right-32 w-[480px] h-[480px] bg-cyan-500/15 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] bg-[#FE2C55]/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* header branding */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-lg">
              {logo}
            </div>
            <span className="font-black tracking-tighter text-white text-[18px]">{brandTitle}</span>
            <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-[8px] font-black tracking-widest text-white">DOCK</span>
          </div>
          {tagline}
        </div>

        <div className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
          <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-r from-blue-900/15 via-transparent to-cyan-900/10">
            <h1 className="text-white font-black text-[14px] uppercase tracking-wide flex items-center gap-2">
              {icon} {title}
            </h1>
            <p className="text-gray-500 text-[10px] mt-1">{subtitle}</p>
          </div>

          <div className="p-6 space-y-4">{children}</div>

          <div className="px-6 py-3 bg-black/20 border-t border-white/5 flex items-center justify-between">
            {footerLeft}
            {footerRight}
          </div>
        </div>

        {after}
      </div>
    </div>
  );
}
