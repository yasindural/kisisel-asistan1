import { motion } from 'framer-motion';
import { MessageCircle, Phone } from 'lucide-react';
import { contacts } from '@/data/mock';

function warmthLabel(w: number) {
  if (w >= 80) return 'çok sıcak';
  if (w >= 60) return 'sıcak';
  if (w >= 40) return 'soğuyor';
  return 'risk! unutuluyor';
}

export default function Crm() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-24 md:px-7 md:pb-10">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-5 mt-2">
        <h1 className="font-display text-3xl font-bold text-white">Kişiler</h1>
        <p className="mt-1 text-[13px] text-white/40">
          ARIA ilişkilerin sıcaklığını takip eder — kiminle ne zaman konuşman gerektiğini söyler.
        </p>
      </motion.div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {contacts.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="glass glow-hover rounded-2xl p-5"
          >
            <div className="mb-4 flex items-center gap-3.5">
              <div
                className="font-display grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-[15px] font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, hsl(${c.hue} 85% 55% / .9), hsl(${c.hue + 40} 80% 45% / .7))`,
                  boxShadow: `0 6px 20px -6px hsl(${c.hue} 85% 55% / .55)`,
                }}
              >
                {c.initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[15px] font-semibold text-white">{c.name}</div>
                <div className="truncate text-[12px] text-white/40">{c.role} • {c.company}</div>
              </div>
            </div>

            {/* warmth meter */}
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="text-white/40">ilişki sıcaklığı</span>
              <span style={{ color: `hsl(${c.hue} 85% 70%)` }} className="font-medium">{warmthLabel(c.warmth)}</span>
            </div>
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${c.warmth}%` }}
                transition={{ delay: 0.3 + i * 0.06, duration: 0.9, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, hsl(${c.hue} 85% 55%), hsl(${c.hue + 50} 90% 60%))` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/30">son temas: {c.lastTouch}</span>
              <div className="flex gap-1.5">
                <button className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/50 transition-all hover:border-cyan-400/40 hover:text-cyan-300">
                  <MessageCircle className="h-3.5 w-3.5" />
                </button>
                <button className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/50 transition-all hover:border-emerald-400/40 hover:text-emerald-300">
                  <Phone className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="glass mt-4 flex items-center gap-3 rounded-2xl px-5 py-4"
      >
        <span className="text-xl">💡</span>
        <p className="text-[13px] text-white/60">
          <b className="text-white/85">ARIA önerisi:</b> Deniz Koç ile 2 haftadır konuşmadın — sözleşme yenileme dönemi yaklaşıyor. Bu hafta kısa bir arama kurayım mı?
        </p>
      </motion.div>
    </div>
  );
}
