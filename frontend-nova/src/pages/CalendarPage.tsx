import { motion } from 'framer-motion';
import { events, weekDays } from '@/data/mock';

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const todayIdx = 3; // Perşembe

export default function CalendarPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-24 md:px-7 md:pb-10">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-5 mt-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Takvim</h1>
          <p className="mt-1 text-[13px] text-white/40">20–26 Temmuz 2026 • Google Takvim ile senkron</p>
        </div>
        <div className="glass flex gap-1 rounded-xl p-1">
          {['Gün', 'Hafta', 'Ay'].map((v, i) => (
            <button
              key={v}
              className={`rounded-lg px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
                i === 1 ? 'bg-gradient-to-r from-cyan-500/30 to-violet-500/30 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass overflow-hidden rounded-2xl"
      >
        {/* header */}
        <div className="grid grid-cols-[52px_repeat(7,1fr)] border-b border-white/[0.07]">
          <div />
          {weekDays.map((d, i) => (
            <div key={d} className={`px-1 py-3 text-center ${i === todayIdx ? 'relative' : ''}`}>
              <div className="text-[10.5px] tracking-wider text-white/35 uppercase">{d}</div>
              <div className={`font-display mx-auto mt-1 grid h-7 w-7 place-items-center rounded-full text-[13px] font-semibold ${
                i === todayIdx
                  ? 'bg-gradient-to-br from-cyan-400 to-violet-600 text-white shadow-[0_0_16px_rgba(34,211,238,0.55)]'
                  : 'text-white/60'
              }`}>
                {20 + i}
              </div>
            </div>
          ))}
        </div>

        {/* grid */}
        <div className="relative grid grid-cols-[52px_repeat(7,1fr)]">
          {/* hour lines */}
          {HOURS.map((h) => (
            <div key={h} className="contents">
              <div className="font-mono2 h-14 pr-2 pt-0.5 text-right text-[10px] text-white/25">{`${h}:00`}</div>
              {weekDays.map((_, i) => (
                <div key={i} className={`h-14 border-l border-t border-white/[0.045] ${i === todayIdx ? 'bg-cyan-400/[0.03]' : ''}`} />
              ))}
            </div>
          ))}

          {/* now line */}
          <div
            className="pointer-events-none absolute left-[52px] right-0 z-10 flex items-center"
            style={{ top: `${(11 - 9) * 56 + 22}px` }}
          >
            <span className="h-2 w-2 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.9)]" />
            <span className="h-px flex-1 bg-gradient-to-r from-pink-400/80 to-transparent" />
          </div>

          {/* events */}
          {events.map((ev, i) => {
            const top = (ev.start - 9) * 56 + 2;
            const height = ev.duration * 56 - 6;
            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.06, type: 'spring', stiffness: 300, damping: 24 }}
                whileHover={{ scale: 1.03, zIndex: 20 }}
                className="absolute cursor-pointer rounded-lg px-2 py-1.5 backdrop-blur-md"
                style={{
                  top,
                  height,
                  left: `calc(52px + (100% - 52px) / 7 * ${ev.day} + 3px)`,
                  width: `calc((100% - 52px) / 7 - 6px)`,
                  background: `${ev.color}26`,
                  border: `1px solid ${ev.color}55`,
                  boxShadow: `0 4px 18px -6px ${ev.color}55`,
                }}
              >
                <div className="truncate text-[11px] font-semibold" style={{ color: ev.color }}>{ev.title}</div>
                {height > 42 && (
                  <div className="mt-0.5 truncate text-[10px] text-white/45">
                    {ev.start}:00 {ev.who ? `• ${ev.who}` : ''}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
