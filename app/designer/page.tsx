'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaPlus, FaCopy, FaTrash, FaPencil, FaDesktop, FaBars, FaArrowLeft, FaFileImport } from 'react-icons/fa6';
import Sidebar from '../components/Sidebar';
import { createClient } from '@/utils/supabase/client';
import type { DesignerDoc } from './lib/types';
import { listDocs, createDoc, duplicateDoc, deleteDoc } from './lib/store';
import { PRESETS } from './lib/presets';
import PsdImportDialog from './components/PsdImportDialog';

function DesignerList() {
  const router = useRouter();
  const [docs, setDocs] = useState<DesignerDoc[]>([]);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('Lower Third Baru');
  const [psdFile, setPsdFile] = useState<File | null>(null);
  const psdInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDocs(listDocs());
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const saved = sessionStorage.getItem('dock_private_verified') || localStorage.getItem('dock_private_key') || '';
    if (saved) setPrivateKey(saved);
  }, []);

  const handleCreate = (presetId: string) => {
    const p = PRESETS.find((x) => x.id === presetId) ?? PRESETS[0];
    const doc = createDoc(newName || p.title, p.make(), privateKey);
    setDocs(listDocs());
    setShowNew(false);
    router.push(`/designer/${doc.id}`);
  };

  const handleDup = (d: DesignerDoc) => {
    duplicateDoc(d);
    setDocs(listDocs());
  };

  const handleDel = (id: string) => {
    if (!confirm('Hapus desain ini?')) return;
    deleteDoc(id);
    setDocs(listDocs());
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Sidebar active="dashboard" open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      <div className="lg:pl-[240px]">
        <header className="h-14 bg-[#121212] border-b border-white/5 flex items-center gap-3 px-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1 text-gray-400"><FaBars className="w-5 h-5" /></button>
          <Link href="/dashboard" className="p-1 text-gray-400 hover:text-white"><FaArrowLeft className="w-5 h-5" /></Link>
          <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-black text-sm">GT</div>
          <div>
            <div className="text-[12px] font-black uppercase tracking-widest">GT Designer</div>
            <div className="text-[10px] text-gray-500">Title designer</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <input
              value={privateKey}
              onChange={(e) => {
                setPrivateKey(e.target.value);
                sessionStorage.setItem('dock_private_verified', e.target.value);
                localStorage.setItem('dock_private_key', e.target.value);
              }}
              placeholder="private key (opsional)"
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs w-44"
            />
            <button onClick={() => psdInputRef.current?.click()} title="Import file Photoshop (.psd/.psb) jadi title baru" className="flex items-center gap-1.5 bg-white/10 text-white text-xs font-black px-3 py-2 rounded-lg hover:bg-white/15">
              <FaFileImport className="w-4 h-4" /> Import PSD
            </button>
            <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 bg-white text-black text-xs font-black px-3 py-2 rounded-lg">
              <FaPlus className="w-4 h-4" /> New Title
            </button>
          </div>
        </header>
        <input
          ref={psdInputRef}
          type="file"
          accept=".psd,.psb"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) setPsdFile(f);
          }}
        />
        <PsdImportDialog
          file={psdFile}
          doneLabel="Buka di Editor"
          onClose={() => setPsdFile(null)}
          onDone={(res, suggestedName) => {
            const doc = createDoc(suggestedName, res.layers, privateKey, res.canvasW, res.canvasH);
            setDocs(listDocs());
            setPsdFile(null);
            router.push(`/designer/${doc.id}`);
          }}
        />

        <main className="p-4 md:p-6 max-w-6xl mx-auto">
          {docs.length === 0 && (
            <div className="bg-[#121212] border border-white/5 rounded-2xl p-8 text-center">
              <div className="text-lg font-black">Belum ada desain</div>
              <p className="text-sm text-gray-400 mt-1">Klik New Title — pilih Lower Third / Title / Scorebug / Ticker, lalu edit di canvas 1920×1080.</p>
            </div>
          )}
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
            {docs.map((d) => (
              <div key={d.id} className="bg-[#121212] border border-white/5 rounded-2xl p-4">
                <div className="font-black text-sm truncate">{d.name}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{d.canvasW}×{d.canvasH} • {d.layers.length} layers • {new Date(d.updatedAt).toLocaleString('id-ID')}</div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link href={`/designer/${d.id}`} className="flex items-center gap-1 bg-white text-black text-[11px] font-black px-3 py-1.5 rounded-lg">
                    <FaPencil className="w-3.5 h-3.5" /> Edit
                  </Link>
                  <Link href={`/designer/display?designId=${d.id}&simulate=1`} className="flex items-center gap-1 bg-white/10 text-[11px] font-black px-3 py-1.5 rounded-lg">
                    <FaDesktop className="w-3.5 h-3.5" /> Preview
                  </Link>
                  <button onClick={() => handleDup(d)} className="flex items-center gap-1 bg-white/10 text-[11px] font-black px-3 py-1.5 rounded-lg">
                    <FaCopy className="w-3.5 h-3.5" /> Duplikat
                  </button>
                  <button onClick={() => handleDel(d.id)} className="flex items-center gap-1 bg-white/5 border border-white/20 text-gray-200 hover:bg-white/10 text-[11px] font-black px-3 py-1.5 rounded-lg">
                    <FaTrash className="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="font-black">New Title</div>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-3 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="Nama desain" />
            <div className="grid grid-cols-2 gap-2 mt-3">
              {PRESETS.map((p) => (
                <button key={p.id} onClick={() => handleCreate(p.id)} className="text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3">
                  <div className="text-sm font-black">{p.title}</div>
                  <div className="text-[11px] text-gray-400">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DesignerPage() {
  return (
    <Suspense>
      <DesignerList />
    </Suspense>
  );
}
