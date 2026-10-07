'use client';
import { AlertTriangle, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
};

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Apakah Anda yakin?",
  description = "Tindakan ini tidak dapat dibatalkan.",
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  variant = "danger",
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#161616] border border-white/10 rounded-2xl w-full max-w-[400px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95"
      >
        <div className="p-6 space-y-4">
          <div className="flex gap-3">
            <div className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${variant === "danger" ? "bg-red-500/15 text-red-400" : "bg-white/10 text-white"}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-black text-[13px] uppercase tracking-wide">{title}</h2>
              <p className="text-[11px] text-gray-400 leading-relaxed mt-1">{description}</p>
            </div>
            <button onClick={onClose} className="shrink-0 w-7 h-7 grid place-items-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-bold text-gray-300 hover:text-white transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 h-9 rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors ${
              variant === "danger"
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-white hover:bg-zinc-100 text-black"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
