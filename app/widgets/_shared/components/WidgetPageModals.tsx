'use client';
import type { WidgetPageShell } from '../hooks/useWidgetPage';

type ModalsProps = {
  shell: WidgetPageShell;
  onReset: () => void;
};

// Handler show/hide private key (konfirmasi dulu) - dipakai UrlBar.
export function toggleShowKey(shell: WidgetPageShell, obsUrl: string) {
  if (!shell.showKey && obsUrl.includes('key=')) shell.setShowKeyConfirm(true);
  else shell.setShowKey((v) => !v);
}

// Tiga popup konfirmasi yang sebelumnya diduplikasi di tiap halaman widget.
export function WidgetPageModals({ shell, onReset }: ModalsProps) {
  return (
    <>
      {shell.showLoadPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={() => shell.setShowLoadPopup(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-[480px] space-y-4">
            <h2 className="text-white font-black">Load Settings</h2>
            <p className="text-xs text-gray-500">Paste widget URL yang sudah ada</p>
            <input value={shell.loadUrl} onChange={(e) => shell.setLoadUrl(e.target.value)} placeholder="https://.../widgets/chat/display?..." className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white" />
            <div className="flex gap-3">
              <button onClick={() => shell.setShowLoadPopup(false)} className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300">Cancel</button>
              <button onClick={shell.handleLoad} className="flex-1 h-9 bg-white hover:bg-zinc-100 rounded-xl text-sm font-black text-black border border-white">Load</button>
            </div>
          </div>
        </div>
      )}
      {shell.showDefaultsConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={() => shell.setShowDefaultsConfirm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-[380px] space-y-4 text-center">
            <h2 className="text-white font-black">Load Defaults?</h2>
            <p className="text-xs text-gray-500">Reset style ke defaults?</p>
            <div className="flex gap-3">
              <button onClick={() => shell.setShowDefaultsConfirm(false)} className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300">No</button>
              <button onClick={() => { onReset(); shell.setShowDefaultsConfirm(false); }} className="flex-1 h-9 bg-white rounded-xl text-sm font-black text-black border border-white">Yes</button>
            </div>
          </div>
        </div>
      )}
      {shell.showKeyConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={() => shell.setShowKeyConfirm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-[380px] space-y-4 text-center">
            <h2 className="text-white font-black">Tampilkan Private Key?</h2>
            <p className="text-[11px] text-gray-400 leading-relaxed">URL mengandung <span className="text-white font-bold">private key</span> rahasia.</p>
            <div className="flex gap-3">
              <button onClick={() => shell.setShowKeyConfirm(false)} className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300">Batal</button>
              <button onClick={() => { shell.setShowKey(true); shell.setShowKeyConfirm(false); }} className="flex-1 h-9 bg-white text-black border border-white rounded-xl text-sm font-black">Tampilkan</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
