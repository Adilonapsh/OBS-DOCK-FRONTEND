'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Monitor, UserCog, Settings, LogOut, X, SlidersHorizontal, Video } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

type NavItem = { href: string; label: string; icon: React.ElementType; active?: boolean };

const NAV: Record<string, NavItem[]> = {
  dashboard: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, active: true },
    { href: "/dock", label: "Dock", icon: Monitor },
    { href: "/monitor", label: "Monitor", icon: Video },
    { href: "/account", label: "Account", icon: UserCog },
    { href: "/config", label: "Config", icon: SlidersHorizontal },
  ],
  dock: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dock", label: "Dock", icon: Monitor, active: true },
    { href: "/monitor", label: "Monitor", icon: Video },
    { href: "/account", label: "Account", icon: UserCog },
    { href: "/config", label: "Config", icon: SlidersHorizontal },
  ],
  monitor: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dock", label: "Dock", icon: Monitor },
    { href: "/monitor", label: "Monitor", icon: Video, active: true },
    { href: "/account", label: "Account", icon: UserCog },
    { href: "/config", label: "Config", icon: SlidersHorizontal },
  ],
  account: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dock", label: "Dock", icon: Monitor },
    { href: "/monitor", label: "Monitor", icon: Video },
    { href: "/account", label: "Account", icon: UserCog, active: true },
    { href: "/config", label: "Config", icon: SlidersHorizontal },
  ],
  config: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dock", label: "Dock", icon: Monitor },
    { href: "/monitor", label: "Monitor", icon: Video },
    { href: "/account", label: "Account", icon: UserCog },
    { href: "/config", label: "Config", icon: SlidersHorizontal, active: true },
  ],
};

export default function Sidebar({
  active = "dashboard",
  open,
  onClose,
  user,
}: {
  active?: "dashboard" | "dock" | "account" | "config" | "monitor";
  open: boolean;
  onClose: () => void;
  user?: any;
}) {
  const router = useRouter();
  const supabase = createClient();
  const items = NAV[active] || NAV.dashboard;
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadAvatar = async () => {
      if (!user?.id) {
        const metaAv = (user as any)?.user_metadata?.avatar_url;
        if (metaAv) setAvatarUrl(metaAv);
        return;
      }
      try {
        const { data } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single();
        const url = (data as any)?.avatar_url || (user as any)?.user_metadata?.avatar_url || null;
        if (url) setAvatarUrl(url);
      } catch {}
    };
    loadAvatar();
  }, [user?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      localStorage.removeItem("isLoggedIn");
      sessionStorage.clear();
    }
    router.push("/login");
  };

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[240px] bg-[#121212] border-r border-white/5 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-14 flex items-center gap-3 px-5 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
            <Image src="/assets/logo/obs.png" alt="OBS" width={18} height={18} />
          </div>
          <span className="font-black tracking-tighter text-white text-[13px]">OBS OVERLAYS</span>
          <button onClick={onClose} className="ml-auto lg:hidden p-1 text-gray-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-colors ${
                item.active ? "bg-white text-black" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon className="w-4 h-4" /> {item.label}
            </Link>
          ))}
          <div className="pt-3 mt-3 border-t border-white/5 space-y-1">
            <a
              href="https://supabase.com/dashboard/project/tdsbidgbhltmjjdrdkla"
              target="_blank"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-bold text-gray-500 hover:text-white hover:bg-white/5"
            >
              <Settings className="w-4 h-4" /> Supabase
            </a>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-black uppercase text-red-400 hover:bg-red-500/10 text-left"
            >
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </div>
        </nav>

        <div className="p-3 border-t border-white/5">
          <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-[10px] shrink-0">
                {(user?.email?.[0] || "U").toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-[11px] truncate">
                {(user?.user_metadata as any)?.username || user?.email?.split("@")[0] || "User"}
              </div>
              <div className="text-gray-500 text-[9px] truncate">{user?.email || "guest"}</div>
            </div>
          </div>
        </div>
      </aside>

      {open && <div onClick={onClose} className="fixed inset-0 bg-black/50 z-30 lg:hidden" />}
    </>
  );
}
