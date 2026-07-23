import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format, parseISO, isPast } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { Plus, Trash2, CheckSquare, Loader2, CalendarClock, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

const PRIORITY_LABELS = { low: "Düşük", medium: "Orta", high: "Yüksek", urgent: "Acil" };
const PRIORITY_STYLES = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-[rgba(201,117,50,0.12)] text-foreground",
  high: "bg-[rgba(217,119,6,0.16)] text-foreground",
  urgent: "bg-[rgba(220,38,38,0.14)] text-foreground",
};
const STATUS_LABELS = { todo: "Yapılacak", in_progress: "Devam ediyor", done: "Bitti" };

const listVariants = { animate: { transition: { staggerChildren: 0.04 } } };
const itemVariants = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 } };

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDue, setNewDue] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/tasks");
      setTasks(data);
    } catch {
      toast.error("Görevler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const payload = { title: newTitle.trim(), priority: newPriority };
      if (newDue) payload.due_at = new Date(newDue).toISOString();
      await api.post("/tasks", payload);
      setNewTitle("");
      setNewDue("");
      setNewPriority("medium");
      toast.success("Görev oluşturuldu");
      load();
    } catch {
      toast.error("Görev eklenemedi");
    } finally {
      setAdding(false);
    }
  };

  const toggleDone = async (task) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    try {
      await api.patch(`/tasks/${task.task_id}`, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.task_id === task.task_id ? { ...t, status: newStatus, progress: newStatus === "done" ? 100 : t.progress } : t)));
      toast.success(newStatus === "done" ? "Görev tamamlandı" : "Görev yeniden açıldı");
    } catch {
      toast.error("Güncellenemedi");
    }
  };

  const changeStatus = async (task, status) => {
    try {
      await api.patch(`/tasks/${task.task_id}`, { status });
      setTasks((prev) => prev.map((t) => (t.task_id === task.task_id ? { ...t, status } : t)));
    } catch {
      toast.error("Güncellenemedi");
    }
  };

  const removeTask = async (task) => {
    try {
      await api.delete(`/tasks/${task.task_id}`);
      setTasks((prev) => prev.filter((t) => t.task_id !== task.task_id));
      toast.success("Görev silindi");
    } catch {
      toast.error("Silinemedi");
    }
  };

  const filtered = tasks.filter((t) => {
    if (filter === "all") return true;
    return t.status === filter;
  });

  const openCount = tasks.filter((t) => t.status !== "done").length;

  return (
    <div className="space-y-5" data-testid="tasks-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">Görevler</h1>
          <p className="mt-1 text-sm text-muted-foreground">{openCount} açık görev</p>
        </div>
      </div>

      {/* Quick add */}
      <form onSubmit={addTask} className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center">
        <Input
          data-testid="task-quick-add-input"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Yeni görev ekle… (Enter ile kaydet)"
          className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center gap-2">
          <Select value={newPriority} onValueChange={setNewPriority}>
            <SelectTrigger className="w-[110px]" data-testid="task-quick-add-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="datetime-local"
            data-testid="task-quick-add-due"
            value={newDue}
            onChange={(e) => setNewDue(e.target.value)}
            className="w-[190px]"
          />
          <Button type="submit" disabled={adding || !newTitle.trim()} data-testid="task-quick-add-submit" className="gap-1.5 bg-[hsl(var(--accent-copper))] text-[hsl(var(--accent-copper-foreground))] hover:bg-[hsl(var(--accent-copper))] hover:brightness-95">
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Ekle
          </Button>
        </div>
      </form>

      {/* Filters */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList data-testid="task-status-filter-tabs">
          <TabsTrigger value="all" data-testid="task-filter-all">Tümü</TabsTrigger>
          <TabsTrigger value="todo" data-testid="task-filter-todo">Yapılacak</TabsTrigger>
          <TabsTrigger value="in_progress" data-testid="task-filter-inprogress">Devam</TabsTrigger>
          <TabsTrigger value="done" data-testid="task-filter-done">Bitti</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-14 text-center" data-testid="tasks-empty-state">
          <CheckSquare className="h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">Henüz görev yok</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">Yukarıdaki alandan görev ekleyin veya ARIA'ya söyleyin: "Yarın Burak'ı ara"</p>
        </div>
      ) : (
        <motion.div variants={listVariants} initial="initial" animate="animate" className="space-y-2">
          {filtered.map((t) => {
            const overdue = t.due_at && t.status !== "done" && isPast(parseISO(t.due_at));
            return (
              <motion.div
                key={t.task_id}
                variants={itemVariants}
                data-testid="task-row"
                className={`flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3 transition-shadow hover:shadow-sm ${t.status === "done" ? "opacity-60" : ""}`}
              >
                <Checkbox
                  checked={t.status === "done"}
                  onCheckedChange={() => toggleDone(t)}
                  data-testid={`task-checkbox-${t.task_id}`}
                  aria-label="Görev durumunu değiştir"
                />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium ${t.status === "done" ? "line-through" : ""}`}>{t.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {t.due_at && (
                      <span className={`flex items-center gap-1 ${overdue ? "font-medium text-destructive" : ""}`}>
                        <CalendarClock className="h-3 w-3" />
                        {format(parseISO(t.due_at), "d MMM, HH:mm", { locale: tr })}
                        {overdue && " · gecikmiş"}
                      </span>
                    )}
                    {t.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className="border-0 px-1.5 py-0 text-[10px]">#{tag}</Badge>
                    ))}
                  </div>
                </div>
                <Badge variant="secondary" className={`hidden shrink-0 border-0 text-[11px] sm:inline-flex ${PRIORITY_STYLES[t.priority] || ""}`}>
                  {PRIORITY_LABELS[t.priority] || t.priority}
                </Badge>
                <Select value={t.status} onValueChange={(v) => changeStatus(t, v)}>
                  <SelectTrigger className="hidden h-8 w-[130px] shrink-0 text-xs md:flex" data-testid={`task-status-select-${t.task_id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {t.status === "done" ? (
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 md:hidden" onClick={() => toggleDone(t)} aria-label="Yeniden aç">
                    <Undo2 className="h-4 w-4" />
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeTask(t)}
                  data-testid={`task-delete-${t.task_id}`}
                  aria-label="Görevi sil"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
