import { motion } from 'framer-motion';
import {
  LayoutGrid, MessageSquareText, CheckSquare, CalendarDays,
  Users, BrainCircuit, Blocks, Sparkles,
} from 'lucide-react';
import type { PageId } from '@/types';

const items: { id: PageId; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'dashboard', label: 'Panel', icon: LayoutGrid },
  { id: 'chat', label: 'ARIA Chat', icon: MessageSquareText },
  { id: 'tasks', label: 'Görevler', icon: CheckSquare },
  { id: 'calendar', label: 'Takvim', icon: CalendarDays },
  { id: 'crm', label: 'Kişiler', icon: Users },
  { id: 'memory', label: 'Hafıza', icon: BrainCircuit },
  { id: 'integrations', label: 'Bağlantılar', icon: Blocks },
];

export default function Sidebar({ page, onNavigate }: { page: PageId; onNavigate: (p: PageId) => void }) {
  return (
    <aside className="glass-deep z-20 m-3 hidden w-[212px] shrink-0 flex-col rounded-2xl p-3 md:flex">
      {/* logo */}
      <div className="mb-6 flex items-center gap-2.5 px-2 pt-1">
        <div className="ring-conic flex h-9 w-9 items-center justify-center rounded-xl p-[1.5px]">
          <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0b0b1a]">
            <Sparkles className="h-4 w-4 text-cyan-300" />
          </div>
        </div>
        <div>
          <div className="font-display text-[15px] font-bold tracking-wide text-white">ARIA</div>
          <div className="text-[10px] tracking-[0.18em] text-white/40 uppercase">Nova OS</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((it) => {
          const active = page === it.id;
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              onClick={() => onNavigate(it.id)}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] transition-colors ${
                active ? 'text-white' : 'text-white/50 hover:text-white/85'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl border border-violet-400/30 bg-gradient-to-r from-violet-500/25 via-cyan-400/15 to-transparent"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className={`relative z-10 h-[17px] w-[17px] ${active ? 'text-cyan-300' : ''}`} />
              <span className="relative z-10 font-medium">{it.label}</span>
              {active && <span className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_2px_rgba(34,211,238,0.7)]" />}
            </button>
          );
        })}
      </nav>

      {/* bottom status */}
      <div className="glass mt-4 rounded-xl p-3">
        <div className="mb-1.5 flex items-center gap-2 text-[10.5px] text-white/55">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          GPT-5.4 aktif
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
            initial={{ width: 0 }}
            animate={{ width: '73%' }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.4 }}
          />
        </div>
        <div className="mt-1 text-[10px] text-white/35">günlük bağlam %73 dolu</div>
      </div>
    </aside>
  );
}

/** Mobil alt navigasyon */
export function MobileNav({ page, onNavigate }: { page: PageId; onNavigate: (p: PageId) => void }) {
  return (
    <nav className="glass-deep fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl px-1 py-2 md:hidden">
      {items.slice(0, 5).map((it) => {
        const active = page === it.id;
        const Icon = it.icon;
        return (
          <button
            key={it.id}
            onClick={() => onNavigate(it.id)}
            className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 ${active ? 'text-cyan-300' : 'text-white/45'}`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[9.5px] font-medium">{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
