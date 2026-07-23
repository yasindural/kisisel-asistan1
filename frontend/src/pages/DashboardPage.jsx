import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import {
  CheckSquare, CheckCircle2, CalendarDays, Users, Sparkles, ArrowRight, Clock, MapPin, Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

const PRIORITY_LABELS = { low: "Düşük", medium: "Orta", high: "Yüksek", urgent: "Acil" };
const PRIORITY_STYLES = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-[rgba(201,117,50,0.12)] text-foreground",
  high: "bg-[rgba(217,119,6,0.16)] text-foreground",
  urgent: "bg-[rgba(220,38,38,0.14)] text-foreground",
};

const listVariants = { animate: { transition: { staggerChildren: 0.05 } } };
const itemVariants = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 } };

const StatCard = ({ icon: Icon, label, value, testid }) => (
  <motion.div variants={itemVariants}>
    <Card className="transition-shadow hover:shadow-md" data-testid={testid}>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--surface-2))]">
          <Icon className="h-5 w-5 text-[hsl(var(--accent-copper))]" />
        </div>
        <div className="leading-tight">
          <p className="font-heading text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const ProgressRing = ({ value }) => {
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--surface-2))" strokeWidth="9" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke="hsl(var(--accent-copper))" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-heading text-xl font-bold">%{value}</span>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quickAsk, setQuickAsk] = useState("");

  const load = useCallback(async () => {
    try {
      const { data: d } = await api.get("/dashboard");
      setData(d);
    } catch {
      toast.error("Panel yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const completeTask = async (task) => {
    try {
      await api.patch(`/tasks/${task.task_id}`, { status: "done" });
      toast.success("Görev tamamlandı");
      load();
    } catch {
      toast.error("Güncellenemedi");
    }
  };

  const askAria = (e) => {
    e.preventDefault();
    navigate("/chat", { state: { initialMessage: quickAsk.trim() || undefined } });
  };

  const firstName = user?.first_name || user?.name?.split(" ")[0] || "";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";

  if (loading) {
    return (
      <div className="space-y-4" data-testid="dashboard-loading">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[76px] rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <Skeleton className="h-40 rounded-xl md:col-span-7" />
          <Skeleton className="h-40 rounded-xl md:col-span-5" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="dashboard-page">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl" data-testid="dashboard-greeting">
          {greeting}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {format(new Date(), "d MMMM yyyy, EEEE", { locale: tr })}
        </p>
      </div>

      <motion.div variants={listVariants} initial="initial" animate="animate" className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard icon={CheckSquare} label="Açık görev" value={data?.open_tasks ?? 0} testid="stat-open-tasks" />
        <StatCard icon={CheckCircle2} label="Tamamlanan" value={data?.completed_tasks ?? 0} testid="stat-completed-tasks" />
        <StatCard icon={CalendarDays} label="Etkinlik" value={data?.events ?? 0} testid="stat-events" />
        <StatCard icon={Users} label="CRM kişisi" value={data?.contacts ?? 0} testid="stat-contacts" />
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {/* ARIA suggestion + quick ask */}
        <Card className="md:col-span-7" data-testid="aria-suggestion-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <Sparkles className="h-4 w-4 text-[hsl(var(--accent-copper))]" />
              ARIA önerisi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{data?.aria_suggestion}</p>
            <form onSubmit={askAria} className="mt-4 flex gap-2">
              <Input
                data-testid="dashboard-quick-ask-input"
                value={quickAsk}
                onChange={(e) => setQuickAsk(e.target.value)}
                placeholder={`ARIA'ya sorun: "Yarın Burak'ı ara"`}
                className="bg-[hsl(var(--surface-0))]"
              />
              <Button type="submit" size="icon" data-testid="dashboard-quick-ask-submit" className="shrink-0 bg-[hsl(var(--accent-copper))] text-[hsl(var(--accent-copper-foreground))] hover:bg-[hsl(var(--accent-copper))] hover:brightness-95" aria-label="ARIA'ya gönder">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Weekly progress */}
        <Card className="md:col-span-5" data-testid="weekly-progress-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base">Haftalık ilerleme</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-5">
            <ProgressRing value={data?.weekly_progress ?? 0} />
            <div className="text-sm text-muted-foreground">
              <p>Bu hafta oluşturulan görevlerin <span className="font-semibold text-foreground">%{data?.weekly_progress ?? 0}</span>'ini tamamladınız.</p>
              <Button variant="link" className="mt-1 h-auto p-0 text-[hsl(var(--accent-copper))]" onClick={() => navigate("/tasks")} data-testid="weekly-progress-goto-tasks">
                Görevlere git <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Today's tasks */}
        <Card className="md:col-span-7" data-testid="dashboard-today-tasks-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-heading text-base">Bugünün görevleri</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/tasks")} data-testid="dashboard-all-tasks-button">
              Tümü <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {data?.today_tasks?.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Bugün için görev yok — ARIA ile ilk görevinizi oluşturun.</p>
            ) : (
              data?.today_tasks?.map((t) => (
                <div key={t.task_id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[hsl(var(--surface-2))]" data-testid="dashboard-task-row">
                  <Checkbox onCheckedChange={() => completeTask(t)} data-testid={`dashboard-task-check-${t.task_id}`} aria-label="Görevi tamamla" />
                  <span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
                  <Badge variant="secondary" className={`shrink-0 border-0 text-[11px] ${PRIORITY_STYLES[t.priority] || ""}`}>
                    {PRIORITY_LABELS[t.priority] || t.priority}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming events */}
        <Card className="md:col-span-5" data-testid="dashboard-upcoming-events-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-heading text-base">Yaklaşan etkinlikler</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/calendar")} data-testid="dashboard-goto-calendar-button">
              Takvim <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {data?.upcoming_events?.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Yaklaşan etkinlik yok.</p>
            ) : (
              data?.upcoming_events?.map((e) => (
                <div key={e.event_id} className="flex items-start gap-3 rounded-lg border-l-2 border-[hsl(var(--accent-copper))] bg-[hsl(var(--surface-2))] px-3 py-2" data-testid="dashboard-event-row">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {e.start_at ? format(parseISO(e.start_at), "d MMM, HH:mm", { locale: tr }) : "—"}
                      {e.location && (
                        <>
                          <MapPin className="ml-1.5 h-3 w-3" />
                          <span className="truncate">{e.location}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
