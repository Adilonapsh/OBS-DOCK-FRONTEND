'use client';
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
 onClick={toggle}
 aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
 className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-colors ${
 theme === "dark"
 ? "btn-secondary "
 : "bg-black/5 border-black/10 text-slate-600 hover:bg-black/10 hover:text-slate-900"
 } ${className}`}
 >
      {theme === "dark" ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
