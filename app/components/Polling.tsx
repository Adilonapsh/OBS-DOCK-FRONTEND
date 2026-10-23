'use client';
import { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react";

export interface PollingRef {
  getData: () => { question: string; options: string[] };
  reset: () => void;
}

const Polling = forwardRef<PollingRef>((_, ref) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusIdx, setFocusIdx] = useState<number | null>(null);

  useEffect(() => {
    if (focusIdx !== null) {
      requestAnimationFrame(() => {
        inputRefs.current[focusIdx]?.focus();
        setFocusIdx(null);
      });
    }
  }, [options, focusIdx]);

  useImperativeHandle(ref, () => ({
    getData: () => ({ question, options }),
    reset: () => {
      setQuestion("");
      setOptions(["", ""]);
    },
  }));

  const updateOption = (idx: number, val: string) => {
    setOptions(prev => prev.map((o, i) => (i === idx ? val : o)));
  };

  const addOption = () => {
    if (options.length < 5) {
      const nextIdx = options.length;
      setOptions([...options, ""]);
      setFocusIdx(nextIdx);
    }
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-gray-400 font-bold uppercase text-[9px] mb-1.5">Pertanyaan Poll</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Masukkan pertanyaan poll..."
          className="w-full rounded-lg px-3 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
        />
      </div>
      <div>
        <label className="block text-gray-400 font-bold uppercase text-[9px] mb-1.5">Opsi (2-5)</label>
        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                value={opt}
                onChange={(e) => updateOption(idx, e.target.value)}
                placeholder={`Opsi ${idx + 1}`}
                className="flex-1 rounded-lg px-3 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (idx === options.length - 1 && options.length < 5) addOption();
                    else inputRefs.current[idx + 1]?.focus();
                  }
                }}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(idx)}
                  className="px-2 py-1 text-red-400 hover:text-red-300 text-[10px] font-bold"
                >
                  Hapus
                </button>
              )}
            </div>
          ))}
        </div>
        {options.length < 5 && (
          <button type="button" onClick={addOption} className="mt-2 text-[10px] font-bold text-purple-400 hover:text-purple-300">
            + Tambah Opsi
          </button>
        )}
      </div>
    </div>
  );
});

Polling.displayName = "Polling";
export default Polling;
