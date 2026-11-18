import type { ReactNode } from "react";
import Image from "next/image";
import Logo from "../../components/Logo";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  brandTitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

// Shell split-screen untuk login / register / forgot-password / reset-password.
export default function AuthLayout({
  title,
  subtitle,
  brandTitle = "Keluno",
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 antialiased flex">
      {/* Left Side: Branding / Visual (Hidden on smaller screens) */}
      <aside className="hidden lg:flex lg:w-1/2 lg:h-screen lg:sticky lg:top-0 bg-brand-950 overflow-hidden items-center justify-center flex-col">
        {/* Abstract glowing background elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-600 rounded-full mix-blend-screen blur-[100px] opacity-40 animate-blob" />
          <div className="absolute top-1/2 -right-32 w-96 h-96 bg-sky-500 rounded-full mix-blend-screen blur-[100px] opacity-40 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-40 left-1/4 w-80 h-80 bg-cyan-600 rounded-full mix-blend-screen blur-[100px] opacity-40 animate-blob animation-delay-4000" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center px-12 text-center">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-black/40 ring-1 ring-white/20">
            <Logo size={44} />
          </div>
          <h2 className="text-4xl xl:text-5xl font-bold text-white tracking-tight mb-6">
            Kendalikan Stream Anda.
          </h2>
          <p className="text-slate-400 text-lg max-w-md leading-relaxed">
            Platform profesional untuk mengelola overlay, scene, dan interaksi audiens dalam satu dashboard terpusat.
          </p>
        </div>

        {/* Footer inside visual area */}
        <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center text-slate-500 text-sm z-10">
          <span>&copy; 2026 Keluno</span>
          <span>V1.0 &bull; Keluno</span>
        </div>
      </aside>

      {/* Right Side: Auth Form */}
      <main className="w-full lg:w-1/2 flex flex-col bg-white relative shadow-[0_0_40px_rgba(0,0,0,0.05)] lg:shadow-none z-10">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-2 p-6 sm:p-8">
          <Image src="/assets/logo/Keluno_Wordmark.webp" alt={brandTitle} width={200} height={81} className="h-10 w-auto object-contain" />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-8 lg:py-12">
          <div className="w-full max-w-md">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
              </div>
              <p className="text-sm text-slate-500">{subtitle}</p>
            </div>

            {children}
          </div>
        </div>

        {/* Footer Links (Bottom of form) */}
        {footer && (
          <div className="px-6 sm:px-12 lg:px-16 pb-8 lg:pb-10">
            <div className="w-full max-w-md mx-auto text-center text-sm text-slate-500">
              {footer}

              {/* Mobile Version Info */}
              <div className="mt-8 flex justify-center items-center gap-2 text-xs text-slate-400 lg:hidden">
                <span>&copy; 2026 Keluno</span>
                <span>&bull;</span>
                <span>V1.0</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
