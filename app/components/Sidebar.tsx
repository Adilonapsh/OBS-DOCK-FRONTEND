'use client';
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import { LayoutDashboard, Monitor, UserCog, LogOut, X, Wifi, Video, Grid2x2, Plug, Wallet2, Shield, ScrollText, Music, LifeBuoy } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { logoutToLogin } from "@/utils/logout";
import { PERMISSIONS, type Permission } from "@/lib/auth";
import { usePermissions } from "./auth/RoleProvider";
import RoleBadge from "./auth/RoleBadge";

type NavItem = { href: string; label: string; icon: React.ElementType; active?: boolean };

const NAV: Record<string, NavItem[]> = {
  dashboard: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, active: true },
    { href: "/dock", label: "Dock", icon: Monitor },
    { href: "/monitor", label: "Monitor", icon: Video },
    // { href: "/overlay", label: "Overlay", icon: Layers },
    { href: "/widgets", label: "Widgets", icon: Grid2x2 },
    { href: "/songs", label: "Songs", icon: Music },
    { href: "/donations", label: "Donasi", icon: Wallet2 },
    // { href: "/designer", label: "Designer", icon: Layers },
    { href: "/integrations", label: "Streamer.bot", icon: Plug },
    { href: "/account", label: "Account", icon: UserCog },
    { href: "/connection", label: "Connection", icon: Wifi },
  ],
  dock: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dock", label: "Dock", icon: Monitor, active: true },
    { href: "/monitor", label: "Monitor", icon: Video },
    // { href: "/overlay", label: "Overlay", icon: Layers },
    { href: "/widgets", label: "Widgets", icon: Grid2x2 },
    { href: "/songs", label: "Songs", icon: Music },
    { href: "/donations", label: "Donasi", icon: Wallet2 },
    // { href: "/designer", label: "Designer", icon: Layers },
    { href: "/integrations", label: "Streamer.bot", icon: Plug },
    { href: "/account", label: "Account", icon: UserCog },
    { href: "/connection", label: "Connection", icon: Wifi },
  ],
  monitor: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dock", label: "Dock", icon: Monitor },
    { href: "/monitor", label: "Monitor", icon: Video, active: true },
    // { href: "/overlay", label: "Overlay", icon: Layers },
    { href: "/widgets", label: "Widgets", icon: Grid2x2 },
    { href: "/songs", label: "Songs", icon: Music },
    { href: "/donations", label: "Donasi", icon: Wallet2 },
    // { href: "/designer", label: "Designer", icon: Layers },
    { href: "/integrations", label: "Streamer.bot", icon: Plug },
    { href: "/account", label: "Account", icon: UserCog },
    { href: "/connection", label: "Connection", icon: Wifi },
  ],
  account: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dock", label: "Dock", icon: Monitor },
    { href: "/monitor", label: "Monitor", icon: Video },
    // { href: "/overlay", label: "Overlay", icon: Layers },
    { href: "/widgets", label: "Widgets", icon: Grid2x2 },
    { href: "/songs", label: "Songs", icon: Music },
    { href: "/donations", label: "Donasi", icon: Wallet2 },
    // { href: "/designer", label: "Designer", icon: Layers },
    { href: "/integrations", label: "Streamer.bot", icon: Plug },
    { href: "/account", label: "Account", icon: UserCog, active: true },
    { href: "/connection", label: "Connection", icon: Wifi },
  ],
  connection: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dock", label: "Dock", icon: Monitor },
    { href: "/monitor", label: "Monitor", icon: Video },
    // { href: "/overlay", label: "Overlay", icon: Layers },
    { href: "/widgets", label: "Widgets", icon: Grid2x2 },
    { href: "/songs", label: "Songs", icon: Music },
    { href: "/donations", label: "Donasi", icon: Wallet2 },
    // { href: "/designer", label: "Designer", icon: Layers },
    { href: "/integrations", label: "Streamer.bot", icon: Plug },
    { href: "/account", label: "Account", icon: UserCog },
    { href: "/connection", label: "Connection", icon: Wifi, active: true },
  ],
  // alias untuk backward compat /config -> /connection
  config: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dock", label: "Dock", icon: Monitor },
    { href: "/monitor", label: "Monitor", icon: Video },
    // { href: "/overlay", label: "Overlay", icon: Layers },
    { href: "/widgets", label: "Widgets", icon: Grid2x2 },
    { href: "/songs", label: "Songs", icon: Music },
    { href: "/donations", label: "Donasi", icon: Wallet2 },
    // { href: "/designer", label: "Designer", icon: Layers },
    { href: "/integrations", label: "Streamer.bot", icon: Plug },
    { href: "/account", label: "Account", icon: UserCog },
    { href: "/connection", label: "Connection", icon: Wifi, active: true },
  ],
  overlay: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dock", label: "Dock", icon: Monitor },
    { href: "/monitor", label: "Monitor", icon: Video },
    // { href: "/overlay", label: "Overlay", icon: Layers, active: true },
    { href: "/widgets", label: "Widgets", icon: Grid2x2 },
    { href: "/songs", label: "Songs", icon: Music },
    { href: "/donations", label: "Donasi", icon: Wallet2 },
    // { href: "/designer", label: "Designer", icon: Layers },
    { href: "/integrations", label: "Streamer.bot", icon: Plug },
    { href: "/account", label: "Account", icon: UserCog },
    { href: "/connection", label: "Connection", icon: Wifi },
  ],
  widgets: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dock", label: "Dock", icon: Monitor },
    { href: "/monitor", label: "Monitor", icon: Video },
    // { href: "/overlay", label: "Overlay", icon: Layers },
    { href: "/widgets", label: "Widgets", icon: Grid2x2, active: true },
    { href: "/songs", label: "Songs", icon: Music },
    { href: "/donations", label: "Donasi", icon: Wallet2 },
    { href: "/integrations", label: "Streamer.bot", icon: Plug },
    { href: "/account", label: "Account", icon: UserCog },
    { href: "/connection", label: "Connection", icon: Wifi },
  ],
  donations: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dock", label: "Dock", icon: Monitor },
    { href: "/monitor", label: "Monitor", icon: Video },
    { href: "/widgets", label: "Widgets", icon: Grid2x2 },
    { href: "/songs", label: "Songs", icon: Music },
    { href: "/donations", label: "Donasi", icon: Wallet2, active: true },
    { href: "/integrations", label: "Streamer.bot", icon: Plug },
    { href: "/account", label: "Account", icon: UserCog },
    { href: "/connection", label: "Connection", icon: Wifi },
  ],
  songs: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dock", label: "Dock", icon: Monitor },
    { href: "/monitor", label: "Monitor", icon: Video },
    { href: "/widgets", label: "Widgets", icon: Grid2x2 },
    { href: "/songs", label: "Songs", icon: Music, active: true },
    { href: "/donations", label: "Donasi", icon: Wallet2 },
    { href: "/integrations", label: "Streamer.bot", icon: Plug },
    { href: "/account", label: "Account", icon: UserCog },
    { href: "/connection", label: "Connection", icon: Wifi },
  ],
  integrations: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dock", label: "Dock", icon: Monitor },
    { href: "/monitor", label: "Monitor", icon: Video },
    // { href: "/overlay", label: "Overlay", icon: Layers },
    { href: "/widgets", label: "Widgets", icon: Grid2x2 },
    { href: "/songs", label: "Songs", icon: Music },
    { href: "/donations", label: "Donasi", icon: Wallet2 },
    // { href: "/designer", label: "Designer", icon: Layers },
    { href: "/integrations", label: "Streamer.bot", icon: Plug, active: true },
    { href: "/account", label: "Account", icon: UserCog },
    { href: "/connection", label: "Connection", icon: Wifi },
  ],
};

// Permission minimum untuk tiap menu. Menu tanpa entri = selalu tampil.
const NAV_PERMISSIONS: Record<string, Permission> = {
  "/dashboard": PERMISSIONS.WORKSPACE_VIEW,
  "/dock": PERMISSIONS.DOCK_CONTROL,
  "/monitor": PERMISSIONS.WORKSPACE_VIEW,
  "/widgets": PERMISSIONS.WIDGET_READ,
  "/songs": PERMISSIONS.DOCK_CONTROL,
  "/donations": PERMISSIONS.DONATION_READ,
  "/integrations": PERMISSIONS.INTEGRATION_MANAGE,
  "/account": PERMISSIONS.ACCOUNT_MANAGE,
  "/connection": PERMISSIONS.CONNECTION_MANAGE,
  "/admin": PERMISSIONS.ADMIN_ACCESS,
};

export default function Sidebar({
  active = "dashboard",
  open,
  onClose,
  user,
}: {
  active?: "dashboard" | "dock" | "account" | "config" | "connection" | "monitor" | "overlay" | "widgets" | "songs" | "integrations" | "designer" | "donations" | "admin" | "admin-audit" | "admin-support" | "support";
  open: boolean;
  onClose: () => void;
  user?: Pick<User, "id" | "email" | "user_metadata"> | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const userMeta = user?.user_metadata as
    | { avatar_url?: string; username?: string }
    | undefined;
  const { can, isAdmin, role, loading } = usePermissions();
  const isAdminSection = active === "admin" || active === "admin-audit" || active === "admin-support";
  const items = (NAV[active] || NAV.dashboard)
    .map((item) => ({ ...item, active: isAdminSection || active === "support" ? false : item.active }))
    .filter((item) => {
      const required = NAV_PERMISSIONS[item.href];
      return !required || loading || can(required);
    });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [openTickets, setOpenTickets] = useState(0);

  // Grouping: Tools (Dock/Monitor/Widgets/Songs), Setup (Connection), Integrasi (Streamer.bot)
  const toolsHrefs = new Set(["/dock", "/monitor", "/widgets", "/songs"]);
  const setupHrefs = new Set(["/connection"]);
  const integrationHrefs = new Set(["/integrations"]);
  const mainItems = items.filter((i) => !toolsHrefs.has(i.href) && !setupHrefs.has(i.href) && !integrationHrefs.has(i.href) && i.href !== "/account");
  const toolsItems = items
    .filter((i) => toolsHrefs.has(i.href))
    .sort((a, b) => {
      const order = ["/dock", "/monitor", "/widgets", "/songs"];
      return order.indexOf(a.href) - order.indexOf(b.href);
    });
  const setupItems = items
    .filter((i) => setupHrefs.has(i.href))
    .sort((a, b) => {
      const order = ["/connection"];
      return order.indexOf(a.href) - order.indexOf(b.href);
    });
  const integrationItems = items.filter((i) => integrationHrefs.has(i.href));
  const accountItems = items.filter((i) => i.href === "/account");

  useEffect(() => {
    const loadAvatar = async () => {
      if (!user?.id) {
        if (userMeta?.avatar_url) setAvatarUrl(userMeta.avatar_url);
        return;
      }
      try {
        const { data } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single();
        const url = data?.avatar_url || userMeta?.avatar_url || null;
        if (url) setAvatarUrl(url);
      } catch {}
    };
    loadAvatar();
  }, [supabase, user?.id, userMeta?.avatar_url]);

  // Badge jumlah tiket support yang masih OPEN (khusus admin).
  useEffect(() => {
    if (!isAdmin || loading) {
      setOpenTickets(0);
      return;
    }

    let active = true;
    let interval: number | null = null;

    const loadOpenTickets = async () => {
      try {
        const { count, error } = await supabase
          .from("support_tickets")
          .select("id", { count: "exact", head: true })
          .eq("status", "open");
        if (!active || error) return;
        setOpenTickets(count ?? 0);
      } catch {
        // tabel belum ada / offline - badge disembunyikan.
      }
    };

    loadOpenTickets();
    interval = window.setInterval(loadOpenTickets, 60_000);

    const handleRefresh = () => loadOpenTickets();
    window.addEventListener("focus", handleRefresh);
    window.addEventListener("keluno:support-tickets-changed", handleRefresh);

    return () => {
      active = false;
      if (interval !== null) window.clearInterval(interval);
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("keluno:support-tickets-changed", handleRefresh);
    };
  }, [isAdmin, loading, supabase]);

  const handleLogout = async () => {
    await logoutToLogin(supabase);
  };

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[240px] bg-[#121212] border-r border-white/5 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-14 flex items-center gap-3 px-5 border-b border-white/5">
          <Image src="/assets/logo/Keluno_Wordmark.webp" alt="Keluno" width={200} height={81} className="h-10 w-auto object-contain shrink-0" />
          <button onClick={onClose} className="ml-auto lg:hidden p-1 text-gray-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="space-y-1">
            {mainItems.map((item) => (
              <Link
 key={item.href}
 href={item.href}
 onClick={onClose}
 className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-colors ${
 item.active ? "btn-primary text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
 }`}
 >
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            ))}
          </div>

          {toolsItems.length > 0 && (
            <div className="pt-3 mt-3 border-t border-white/5 space-y-1">
              <p className="px-3 mb-1.5 text-[9px] font-black tracking-[0.18em] text-gray-500 uppercase">Tools</p>
              {toolsItems.map((item) => (
                <Link
 key={item.href}
 href={item.href}
 onClick={onClose}
 className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-colors ${
 item.active ? "btn-primary text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
 }`}
 >
                  <item.icon className="w-4 h-4" /> {item.label}
                </Link>
              ))}
            </div>
          )}

          {setupItems.length > 0 && (
            <div className="pt-3 mt-3 border-t border-white/5 space-y-1">
              <p className="px-3 mb-1.5 text-[9px] font-black tracking-[0.18em] text-gray-500 uppercase">Setup</p>
              {setupItems.map((item) => (
                <Link
 key={item.href}
 href={item.href}
 onClick={onClose}
 className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-colors ${
 item.active ? "btn-primary text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
 }`}
 >
                  <item.icon className="w-4 h-4" /> {item.label}
                </Link>
              ))}
            </div>
          )}

          {integrationItems.length > 0 && (
            <div className="pt-3 mt-3 border-t border-white/5 space-y-1">
              <p className="px-3 mb-1.5 text-[9px] font-black tracking-[0.18em] text-gray-500 uppercase">Integrasi</p>
              {integrationItems.map((item) => (
                <Link
 key={item.href}
 href={item.href}
 onClick={onClose}
 className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-colors ${
 item.active ? "btn-primary text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
 }`}
 >
                  <item.icon className="w-4 h-4" /> {item.label}
                </Link>
              ))}
            </div>
          )}

          {isAdmin && !loading && (
            <div className="pt-3 mt-3 border-t border-white/5 space-y-1">
              <p className="px-3 mb-1.5 text-[9px] font-black tracking-[0.18em] text-gray-500 uppercase">Administrasi</p>
              <Link
                href="/admin"
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-colors ${
                  active === "admin" ? "bg-amber-400 text-black" : "text-amber-300 hover:text-amber-200 hover:bg-amber-500/10"
                }`}
              >
                <Shield className="w-4 h-4" /> Role & Permission
              </Link>
              <Link
                href="/admin/audit"
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-colors ${
                  active === "admin-audit" ? "bg-amber-400 text-black" : "text-amber-300 hover:text-amber-200 hover:bg-amber-500/10"
                }`}
              >
                <ScrollText className="w-4 h-4" /> Audit Log
              </Link>
              <Link
                href="/admin/support"
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-colors ${
                  active === "admin-support" ? "bg-amber-400 text-black" : "text-amber-300 hover:text-amber-200 hover:bg-amber-500/10"
                }`}
              >
                <LifeBuoy className="w-4 h-4" /> Support Tickets
                {openTickets > 0 && (
                  <span
                    className={`ml-auto min-w-[18px] h-[18px] px-1 rounded-full grid place-items-center text-[9px] font-black leading-none ${
                      active === "admin-support" ? "bg-black/25 text-black" : "bg-amber-400 text-black"
                    }`}
                    title={`${openTickets} tiket open`}
                  >
                    {openTickets > 99 ? "99+" : openTickets}
                  </span>
                )}
              </Link>
            </div>
          )}

          {accountItems.length > 0 && (
            <div className="pt-3 mt-3 border-t border-white/5 space-y-1">
              {accountItems.map((item) => (
                <Link
 key={item.href}
 href={item.href}
 onClick={onClose}
 className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-colors ${
 item.active ? "btn-primary text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
 }`}
 >
                  <item.icon className="w-4 h-4" /> {item.label}
                </Link>
              ))}
            </div>
          )}

          <div className="pt-3 mt-3 border-t border-white/5 space-y-1">
            <Link
              href="/support"
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-colors ${
                active === "support" ? "btn-primary text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <LifeBuoy className="w-4 h-4" /> Support
            </Link>
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
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black font-black text-[10px] shrink-0">
                {(user?.email?.[0] || "U").toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="text-white font-bold text-[11px] truncate">
                  {userMeta?.username || user?.email?.split("@")[0] || "User"}
                </div>
                {!loading && <RoleBadge role={role} />}
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
