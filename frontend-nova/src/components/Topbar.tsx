import { Search, Bell, Command } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="z-10 flex items-center gap-3 px-5 pt-4 pb-2 md:px-7">
      <div className="glass glow-hover flex flex-1 cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-white/40 transition-colors hover:text-white/60">
        <Search className="h-4 w-4" />
        <span className="text-[13px]">Ara: görev, kişi, etkinlik, hafıza…</span>
        <span className="ml-auto hidden items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10.5px] text-white/40 sm:flex">
          <Command className="h-3 w-3" /> K
        </span>
      </div>
      <button className="glass glow-hover relative grid h-10 w-10 place-items-center rounded-xl">
        <Bell className="h-[17px] w-[17px] text-white/70" />
        <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-pink-400 shadow-[0_0_6px_1px_rgba(244,114,182,0.8)]" />
      </button>
      <div className="ring-conic h-10 w-10 rounded-xl p-[1.5px]">
        <div className="font-display grid h-full w-full place-items-center rounded-[10px] bg-[#12122a] text-[13px] font-bold text-cyan-200">
          YD
        </div>
      </div>
    </header>
  );
}
