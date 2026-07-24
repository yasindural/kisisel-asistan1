import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AuroraBackground from '@/components/AuroraBackground';
import Sidebar, { MobileNav } from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import Dashboard from '@/pages/Dashboard';
import Chat from '@/pages/Chat';
import Tasks from '@/pages/Tasks';
import CalendarPage from '@/pages/CalendarPage';
import Crm from '@/pages/Crm';
import MemoryPage from '@/pages/Memory';
import Integrations from '@/pages/Integrations';
import type { PageId } from '@/types';

export default function App() {
  const [page, setPage] = useState<PageId>('dashboard');

  return (
    <div className="noise relative flex h-screen w-full overflow-hidden">
      <AuroraBackground />
      <Sidebar page={page} onNavigate={setPage} />

      <main className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <div className="relative min-h-0 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 22, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex min-h-full flex-col"
            >
              {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
              {page === 'chat' && <div className="flex flex-1 flex-col"><Chat /></div>}
              {page === 'tasks' && <Tasks />}
              {page === 'calendar' && <CalendarPage />}
              {page === 'crm' && <Crm />}
              {page === 'memory' && <MemoryPage />}
              {page === 'integrations' && <Integrations />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <MobileNav page={page} onNavigate={setPage} />
    </div>
  );
}
