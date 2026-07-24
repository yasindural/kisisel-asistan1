import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Plus, Circle, Loader, CheckCircle2 } from 'lucide-react';
import { tasks as initial, type Task, type TaskStatus } from '@/data/mock';

const cols: { id: TaskStatus; label: string; icon: typeof Circle; color: string }[] = [
  { id: 'todo', label: 'Yapılacak', icon: Circle, color: '#94a3b8' },
  { id: 'doing', label: 'Sürüyor', icon: Loader, color: '#22d3ee' },
  { id: 'done', label: 'Bitti', icon: CheckCircle2, color: '#34d399' },
];

const prioColor = { yüksek: '#fb7185', orta: '#fbbf24', düşük: '#64748b' } as const;

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(initial);
  const [draft, setDraft] = useState('');

  const cycle = (id: string) =>
    setTasks((ts) =>
      ts.map((t) =>
        t.id === id
          ? { ...t, status: t.status === 'todo' ? 'doing' : t.status === 'doing' ? 'done' : 'todo' }
          : t,
      ),
    );

  const add = () => {
    const title = draft.trim();
    if (!title) return;
    setTasks((ts) => [
      { id: String(Date.now()), title, tag: 'Yeni', tagColor: '#22d3ee', time: '—', status: 'todo', priority: 'orta' },
      ...ts,
    ]);
    setDraft('');
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-24 md:px-7 md:pb-10">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-5 mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Görevler</h1>
          <p className="mt-1 text-[13px] text-white/40">ARIA sohbetten otomatik görev çıkarır — sen sadece onayla.</p>
        </div>
        <div className="glass flex w-full max-w-sm items-center gap-2 rounded-xl px-3 py-1.5 sm:w-auto">
          <Plus className="h-4 w-4 shrink-0 text-cyan-300" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Hızlı görev ekle…"
            className="w-full bg-transparent py-1.5 text-[13px] text-white placeholder:text-white/30 focus:outline-none"
          />
        </div>
      </motion.div>

      <div className="grid gap-3.5 md:grid-cols-3">
        {cols.map((col, ci) => {
          const Icon = col.icon;
          const list = tasks.filter((t) => t.status === col.id);
          return (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="glass rounded-2xl p-3.5"
            >
              <div className="mb-3 flex items-center gap-2 px-1.5">
                <Icon className="h-4 w-4" style={{ color: col.color }} />
                <span className="text-[13px] font-semibold text-white/85">{col.label}</span>
                <span className="ml-auto rounded-full bg-white/[0.07] px-2 py-0.5 text-[11px] text-white/50">{list.length}</span>
              </div>
              <div className="space-y-2">
                {list.map((t, i) => (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + i * 0.05 }}
                    className={`glow-hover group rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 ${t.status === 'done' ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        onClick={() => cycle(t.id)}
                        className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-all hover:scale-110"
                        style={{
                          borderColor: t.status === 'done' ? '#34d399' : 'rgba(255,255,255,0.2)',
                          background: t.status === 'done' ? '#34d39922' : 'transparent',
                        }}
                      >
                        {t.status === 'done' && <Check className="h-3 w-3 text-emerald-400" />}
                        {t.status === 'doing' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[13px] leading-snug text-white/85 ${t.status === 'done' ? 'line-through' : ''}`}>{t.title}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{ background: `${t.tagColor}1c`, color: t.tagColor }}
                          >
                            {t.tag}
                          </span>
                          <span className="font-mono2 text-[10.5px] text-white/35">{t.time}</span>
                          <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: prioColor[t.priority] }} title={t.priority} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {list.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/10 py-8 text-center text-[12px] text-white/25">
                    burası tertemiz ✨
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
