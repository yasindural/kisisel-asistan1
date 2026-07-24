import { useState } from 'react';
import { motion } from 'framer-motion';
import { Unplug, PlugZap } from 'lucide-react';
import { integrations as initial, type Integration } from '@/data/mock';

export default function Integrations() {
  const [items, setItems] = useState<Integration[]>(initial);
  const toggle = (id: string) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, connected: !x.connected } : x)));

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-24 md:px-7 md:pb-10">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-5 mt-2">
        <h1 className="font-display text-3xl font-bold text-white">Bağlantılar</h1>
        <p className="mt-1 text-[13px] text-white/40">
          ARIA'nın süper güçleri burada — bağla, gerisini o halletsin.
        </p>
      </motion.div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => (
          <motion.div
            key={it.id}
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`glass glow-hover relative overflow-hidden rounded-2xl p-5 ${it.connected ? '' : 'opacity-80'}`}
          >
            {it.connected && (
              <div className="absolute right-0 top-0 h-20 w-20 blur-2xl" style={{ background: `${it.accent}30` }} />
            )}
            <div className="mb-3 flex items-start justify-between">
              <span className="text-3xl">{it.icon}</span>
              <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase ${
                it.connected
                  ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                  : 'border border-white/10 bg-white/[0.04] text-white/35'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${it.connected ? 'animate-pulse bg-emerald-400' : 'bg-white/25'}`} />
                {it.connected ? 'bağlı' : 'kapalı'}
              </span>
            </div>
            <div className="text-[15px] font-semibold text-white">{it.name}</div>
            <p className="mb-4 mt-1 text-[12.5px] leading-snug text-white/45">{it.desc}</p>
            <button
              onClick={() => toggle(it.id)}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[12.5px] font-semibold transition-all active:scale-95 ${
                it.connected
                  ? 'border border-white/10 text-white/55 hover:border-rose-400/40 hover:text-rose-300'
                  : 'bg-gradient-to-r from-cyan-500/80 to-violet-600/80 text-white shadow-[0_6px_24px_-6px_rgba(139,92,246,0.55)] hover:brightness-110'
              }`}
            >
              {it.connected ? <><Unplug className="h-3.5 w-3.5" /> Bağlantıyı kes</> : <><PlugZap className="h-3.5 w-3.5" /> Bağlan</>}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
