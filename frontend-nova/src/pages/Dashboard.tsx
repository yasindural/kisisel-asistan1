import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Zap, CalendarClock, CheckCircle2, Flame } from 'lucide-react';
import Orb from '@/components/Orb';
import { tasks, events, activity } from '@/data/mock';
import type { PageId } from '@/types';

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const start = performance.now();
    const dur = 1200;
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <span ref={ref}>{v}{suffix}</span>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.08 * i, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } }),
};

export default function Dashboard({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const hour = new Date().getHours();
  const greet = hour < 6 ? 'İyi geceler' : hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';
  const doneCount = tasks.filter((t) => t.status === 'done').length;

  const stats = [
    { icon: Zap, label: 'Aktif görev', value: tasks.filter((t) => t.status !== 'done').length, suffix: '', color: '#22d3ee' },
    { icon: CalendarClock, label: 'Bu hafta etkinlik', value: events.length, suffix: '', color: '#8b5cf6' },
    { icon: CheckCircle2, label: 'Tamamlanan', value: doneCount, suffix: '', color: '#34d399' },
    { icon: Flame, label: 'Odak serisi', value: 12, suffix: ' gün', color: '#f472b6' },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-5 pb-24 md:px-7 md:pb-10">
      {/* HERO */}
      <motion.section
        variants={fadeUp} initial="hidden" animate="show" custom={0}
        className="glass relative overflow-hidden rounded-3xl px-6 py-8 md:px-10 md:py-10"
      >
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-600/20 blur-[90px]" />
        <div className="absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-cyan-500/15 blur-[90px]" />
        <div className="relative flex flex-col items-center gap-8 md:flex-row md:gap-12">
          <div className="animate-float-y shrink-0">
            <Orb size={170} />
          </div>
          <div className="text-center md:text-left">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-[11px] font-medium tracking-wide text-cyan-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
              ARIA SENİ DİNLİYOR
            </div>
            <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-white md:text-[52px]">
              {greet}, <span className="text-aurora">Yasin.</span>
            </h1>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/55">
              Bugün <b className="text-white/85">{tasks.filter((t) => t.status !== 'done').length} görev</b> ve{' '}
              <b className="text-white/85">2 toplantı</b> var. En kritik iş:{' '}
              <span className="text-cyan-300">Q3 bütçe taslağı — 12:00</span>. Gerisini ben hallederim.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2.5 md:justify-start">
              <button
                onClick={() => onNavigate('chat')}
                className="ring-conic rounded-xl p-[1.5px] transition-transform hover:scale-[1.03] active:scale-95"
              >
                <span className="font-display flex items-center gap-2 rounded-[10px] bg-[#0b0b1c]/90 px-5 py-2.5 text-sm font-semibold text-white">
                  ARIA ile konuş <ArrowUpRight className="h-4 w-4 text-cyan-300" />
                </span>
              </button>
              <button
                onClick={() => onNavigate('calendar')}
                className="glass glow-hover rounded-xl px-5 py-2.5 text-sm font-medium text-white/75"
              >
                Günüme bak
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              variants={fadeUp} initial="hidden" animate="show" custom={i + 1}
              className="glass glow-hover rounded-2xl p-4"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: `${s.color}1f`, border: `1px solid ${s.color}45` }}>
                <Icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
              <div className="font-display text-[26px] font-bold leading-none text-white">
                <CountUp to={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-1 text-[12px] text-white/45">{s.label}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-3.5 lg:grid-cols-5">
        {/* TODAY TIMELINE */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={5} className="glass rounded-2xl p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[15px] font-semibold text-white">Bugünün akışı</h2>
            <span className="text-[11px] tracking-wide text-white/35 uppercase">24 Tem, Per</span>
          </div>
          <div className="space-y-1">
            {[
              { time: '10:30', title: 'Burak’ı ara — proje sunumu', color: '#22d3ee', now: true },
              { time: '12:00', title: 'Q3 bütçe taslağı → finans', color: '#f472b6' },
              { time: '14:00', title: 'Landing page onayı', color: '#8b5cf6' },
              { time: '17:30', title: 'Spor salonu üyelik yenileme', color: '#34d399' },
            ].map((it) => (
              <div key={it.time} className="group flex items-center gap-3.5 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/[0.04]">
                <span className="font-mono2 w-12 text-[12px] text-white/45">{it.time}</span>
                <span className="h-8 w-[3px] rounded-full" style={{ background: it.color, boxShadow: `0 0 10px ${it.color}66` }} />
                <span className="flex-1 text-[13.5px] text-white/80">{it.title}</span>
                {it.now && (
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-cyan-300 uppercase">
                    sıradaki
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ACTIVITY */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={6} className="glass rounded-2xl p-5 lg:col-span-2">
          <h2 className="font-display mb-4 text-[15px] font-semibold text-white">ARIA aktivitesi</h2>
          <div className="space-y-3">
            {activity.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.12 }}
                className="flex items-start gap-3"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 shadow-[0_0_6px_rgba(139,92,246,0.8)]" />
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] leading-snug text-white/70">{a.text}</p>
                  <span className="text-[10.5px] text-white/30">{a.time}</span>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="shimmer mt-4 rounded-xl border border-white/[0.06] px-3 py-2 text-center text-[11px] text-white/40">
            ARIA arka planda 3 e-postayı özetliyor…
          </div>
        </motion.div>
      </div>
    </div>
  );
}
