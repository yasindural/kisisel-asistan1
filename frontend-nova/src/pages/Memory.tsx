import { useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, ShieldCheck } from 'lucide-react';
import { memories as initial, type Memory } from '@/data/mock';

export default function MemoryPage() {
  const [mems, setMems] = useState<Memory[]>(initial);
  const toggle = (id: string) => setMems((m) => m.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x)));
  const active = mems.filter((m) => m.enabled).length;

  return (
    <div className="mx-auto w-full max-w-4xl px-5 pb-24 md:px-7 md:pb-10">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-5 mt-2">
        <h1 className="font-display flex items-center gap-3 text-3xl font-bold text-white">
          Hafıza <BrainCircuit className="h-7 w-7 text-violet-400" />
        </h1>
        <p className="mt-1 text-[13px] text-white/40">
          ARIA seni buradan tanır. Her şey senin onayınla — istediğini tek dokunuşla kapat.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass mb-4 flex items-center gap-3 rounded-2xl px-5 py-4"
      >
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
        <p className="text-[13px] text-white/60">
          <b className="text-emerald-300">{active} aktif hafıza</b> bağlam olarak kullanılıyor. Veriler sadece senin hesabında, hiçbir yerde paylaşılmıyor.
        </p>
      </motion.div>

      <div className="space-y-2.5">
        {mems.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 + i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className={`glass flex items-center gap-4 rounded-2xl px-5 py-4 transition-opacity ${m.enabled ? '' : 'opacity-45'}`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] leading-snug text-white/85">“{m.text}”</p>
              <div className="mt-1.5 flex items-center gap-2.5">
                <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                  {m.category}
                </span>
                <span className="text-[10.5px] text-white/30">güven %{m.confidence}</span>
              </div>
            </div>
            {/* switch */}
            <button
              onClick={() => toggle(m.id)}
              className={`relative h-6.5 w-11 shrink-0 rounded-full p-[3px] transition-colors duration-300 ${
                m.enabled ? 'bg-gradient-to-r from-cyan-400 to-violet-500 shadow-[0_0_14px_rgba(34,211,238,0.4)]' : 'bg-white/10'
              }`}
            >
              <motion.span
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                className={`block h-5 w-5 rounded-full bg-white shadow ${m.enabled ? 'ml-auto' : ''}`}
              />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
