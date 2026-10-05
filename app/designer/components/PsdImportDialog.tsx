'use client';
// Dialog import Photoshop: pilih file → parse (ag-psd) → ringkasan → aksi.
// Dipakai halaman list (/designer, bikin doc baru) dan editor (append ke canvas).

import { useEffect, useState } from 'react';
import { FaCheck, FaFileImport, FaTriangleExclamation, FaXmark } from 'react-icons/fa6';
import { parsePsdFile, type PsdImportResult } from '../lib/psd-import';

type Status = { kind: 'working' } | { kind: 'done'; res: PsdImportResult } | { kind: 'error'; message: string };

export default function PsdImportDialog({
  file,
  doneLabel,
  onClose,
  onDone,
}: {
  file: File | null;
  doneLabel: string;
  onClose: () => void;
  onDone: (res: PsdImportResult, suggestedName: string) => void;
}) {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    setStatus({ kind: 'working' });
    parsePsdFile(file)
      .then((res) => {
        if (!cancelled) setStatus({ kind: 'done', res });
      })
      .catch((e) => {
        if (!cancelled) setStatus({ kind: 'error', message: e instanceof Error ? e.message : 'Gagal membaca file.' });
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  if (!file) return null;
  const suggested = file.name.replace(/\.(psd|psb)$/i, '') || 'Import PSD';

  const res = status?.kind === 'done' ? status.res : null;
  const counts = res
    ? (['text', 'image', 'shape'] as const).map((t) => ({
        t,
        n: res.layers.filter((l) => l.type === t).length,
      }))
    : [];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#141414] border border-white/10 rounded-2xl p-5 w-full max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <FaFileImport className="w-4 h-4 text-gray-300" />
          <div className="font-black flex-1 truncate">Import Photoshop</div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white" title="Tutup">
            <FaXmark className="w-4 h-4" />
          </button>
        </div>
        <div className="text-[11px] text-gray-500 truncate mt-0.5">{file.name} • {(file.size / 1048576).toFixed(1)}MB</div>

        {(!status || status.kind === 'working') && (
          <div className="mt-4 text-sm text-gray-300 flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin inline-block" />
            Membaca layers…
          </div>
        )}

        {status?.kind === 'error' && (
          <div className="mt-4 text-sm text-gray-200 bg-white/5 border border-white/10 rounded-xl p-3">{status.message}</div>
        )}

        {res && (
          <div className="mt-4 space-y-3 text-sm">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="font-black">
                {res.layers.length} layer • {res.canvasW}×{res.canvasH}px
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                {counts.map((c) => `${c.n} ${c.t}`).join(' • ') || '—'}
              </div>
            </div>

            {res.warnings.length > 0 && (
              <div className="text-[12px] text-gray-200 bg-white/5 border border-white/10 rounded-xl p-3 space-y-1">
                {res.warnings.map((w, i) => (
                  <div key={i} className="flex gap-1.5">
                    <FaTriangleExclamation className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {res.skipped.length > 0 && (
              <details className="text-[12px] text-gray-400">
                <summary className="cursor-pointer hover:text-gray-200">
                  {res.skipped.length} dilewati (klik rincian)
                </summary>
                <ul className="mt-1 space-y-0.5 max-h-32 overflow-y-auto custom-scrollbar">
                  {res.skipped.map((s, i) => (
                    <li key={i} className="truncate">
                      <span className="text-gray-200">{s.name}</span> — {s.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <div className="text-[11px] text-gray-500">
              Text jadi editable • grup di-flatten • blend mode eksotis → normal
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onDone(res, suggested)}
                className="flex items-center gap-1.5 flex-1 justify-center bg-white text-black text-xs font-black px-3 py-2.5 rounded-lg"
              >
                <FaCheck className="w-3.5 h-3.5" /> {doneLabel}
              </button>
              <button onClick={onClose} className="bg-white/10 text-xs font-black px-4 py-2.5 rounded-lg">
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
