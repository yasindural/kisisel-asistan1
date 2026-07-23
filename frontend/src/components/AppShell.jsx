import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, MessageSquare, CheckSquare, CalendarDays, Users, Brain, Plug,
  Search, Sun, Moon, Menu, LogOut, Sparkles, CheckCircle2, Clock, FileText, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { api } from "@/lib/api";

const NAV_GROUPS = [
  {
    label: "Çalışma",
    items: [
      { to: "/dashboard", label: "Panel", icon: LayoutDashboard, testid: "nav-dashboard" },
      { to: "/chat", label: "Sohbet", icon: MessageSquare, testid: "nav-chat" },
      { to: "/tasks", label: "Görevler", icon: CheckSquare, testid: "nav-tasks" },
    ],
  },
  {
    label: "Planlama",
    items: [
      { to: "/calendar", label: "Takvim", icon: CalendarDays, testid: "nav-calendar" },
    ],
  },
  {
    label: "İlişkiler",
    items: [
      { to: "/crm", label: "CRM", icon: Users, testid: "nav-crm" },
    ],
  },
  {
    label: "Sistem",
    items: [
      { to: "/memory", label: "Hafıza", icon: Brain, testid: "nav-memory" },
      { to: "/integrations", label: "Entegrasyonlar", icon: Plug, testid: "nav-integrations" },
    ],
  },
];

const Logo = () => (
  <div className="flex items-center gap-2.5 px-1">
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--accent-copper))] shadow-sm">
      <Sparkles className="h-4.5 w-4.5 h-4 w-4 text-[hsl(var(--accent-copper-foreground))]" />
    </div>
    <div className="leading-tight">
      <span className="font-heading text-lg font-700 font-bold tracking-tight">ARIA</span>
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Dijital Çalışan</p>
    </div>
  </div>
);

const SidebarNav = ({ onNavigate }) => (
  <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
    {NAV_GROUPS.map((group) => (
      <div key={group.label}>
        <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{group.label}</p>
        <div className="space-y-0.5">
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={item.testid}
              onClick={onNavigate}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[hsl(var(--surface-2))] text-foreground"
                    : "text-muted-foreground hover:bg-[hsl(var(--surface-2))] hover:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[hsl(var(--accent-copper))]" />}
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    ))}
  </nav>
);

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "A";

const GlobalSearch = ({ open, setOpen }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();
  const timer = useRef(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
      return;
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    setSearching(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const { data } = await api.get("/search", { params: { q: query.trim() } });
        setResults(data);
      } catch {
        setResults(null);
      } finally {
        setSearching(false);
      }
    }, 280);
    return () => clearTimeout(timer.current);
  }, [query]);

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  const total = results ? results.tasks.length + results.contacts.length + results.events.length + results.memories.length : 0;

  const Section = ({ title, icon: Icon, items, render, path }) =>
    items.length > 0 && (
      <div className="mb-3">
        <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
        {items.map((item, idx) => (
          <button
            key={idx}
            data-testid={`search-result-${title.toLowerCase()}-${idx}`}
            onClick={() => go(path(item))}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm hover:bg-[hsl(var(--surface-2))]"
          >
            <Icon className="h-4 w-4 shrink-0 text-[hsl(var(--accent-copper))]" />
            <span className="truncate">{render(item)}</span>
          </button>
        ))}
      </div>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-[20%] max-w-xl translate-y-0 gap-0 p-0" data-testid="global-search-dialog">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="sr-only">Global Arama</DialogTitle>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              data-testid="global-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Görev, kişi, etkinlik veya hafıza ara…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[320px]">
          <div className="p-3">
            {query.trim().length < 2 ? (
              <p className="px-1 py-6 text-center text-sm text-muted-foreground">Aramak için en az 2 karakter yazın.</p>
            ) : searching ? (
              <p className="px-1 py-6 text-center text-sm text-muted-foreground">Aranıyor…</p>
            ) : total === 0 ? (
              <p className="px-1 py-6 text-center text-sm text-muted-foreground" data-testid="search-no-results">Sonuç bulunamadı.</p>
            ) : (
              <>
                <Section title="Görevler" icon={CheckCircle2} items={results.tasks} render={(t) => t.title} path={() => "/tasks"} />
                <Section title="Kişiler" icon={Users} items={results.contacts} render={(c) => `${c.name}${c.company ? ` — ${c.company}` : ""}`} path={(c) => `/crm?contact=${c.contact_id}`} />
                <Section title="Etkinlikler" icon={Clock} items={results.events} render={(e) => e.title} path={() => "/calendar"} />
                <Section title="Hafıza" icon={FileText} items={results.memories} render={(m) => m.content} path={() => "/memory"} />
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default function AppShell() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const userName = useMemo(() => user?.name || user?.email || "", [user]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-[hsl(var(--surface-1))] lg:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Logo />
        </div>
        <SidebarNav />
        <div className="border-t p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
            <Avatar className="h-8 w-8">
              {user?.picture ? <AvatarImage src={user.picture} alt={userName} /> : null}
              <AvatarFallback className="bg-[hsl(var(--accent-copper))] text-xs font-semibold text-[hsl(var(--accent-copper-foreground))]">
                {initials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-[hsl(var(--surface-1))] p-0">
          <div className="flex h-14 items-center border-b px-4">
            <Logo />
          </div>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-[hsl(var(--surface-0))] px-3 lg:px-5">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} data-testid="mobile-menu-button" aria-label="Menüyü aç">
            <Menu className="h-5 w-5" />
          </Button>
          <button
            onClick={() => setSearchOpen(true)}
            data-testid="global-command-open-button"
            className="flex h-9 flex-1 items-center gap-2 rounded-lg border bg-[hsl(var(--surface-1))] px-3 text-sm text-muted-foreground transition-colors hover:border-[hsl(var(--ring))] sm:max-w-md"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 truncate text-left">Ara…</span>
            <kbd className="hidden rounded border bg-[hsl(var(--surface-2))] px-1.5 py-0.5 font-mono-plex text-[10px] text-muted-foreground sm:inline">⌘K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="hidden gap-1.5 md:flex"
              onClick={() => navigate("/chat")}
              data-testid="topbar-ask-aria-button"
            >
              <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--accent-copper))]" />
              ARIA'ya sor
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="theme-toggle-button" aria-label="Tema değiştir">
              {theme === "dark" ? <Sun className="h-4.5 w-4.5 h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="user-menu-button" className="rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[hsl(var(--focus))]" aria-label="Kullanıcı menüsü">
                  <Avatar className="h-8 w-8">
                    {user?.picture ? <AvatarImage src={user.picture} alt={userName} /> : null}
                    <AvatarFallback className="bg-[hsl(var(--brand))] text-xs font-semibold text-[hsl(var(--brand-foreground))]">
                      {initials(userName)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  <p className="truncate text-sm">{userName}</p>
                  <p className="truncate text-xs font-normal text-muted-foreground">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} data-testid="logout-button" className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Çıkış yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="mx-auto w-full max-w-[1400px] px-4 py-5 lg:px-6"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <GlobalSearch open={searchOpen} setOpen={setSearchOpen} />
    </div>
  );
}
