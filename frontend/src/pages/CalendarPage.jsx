import { useCallback, useEffect, useMemo, useState } from "react";
import {
  format, parseISO, startOfMonth, startOfWeek, addDays, addMonths, addWeeks,
  isSameMonth, isSameDay, isToday, differenceInCalendarDays,
} from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, MapPin, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

const dayKey = (d) => format(d, "yyyy-MM-dd");

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("month");
  const [cursor, setCursor] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [form, setForm] = useState({ title: "", date: dayKey(new Date()), start: "10:00", end: "11:00", location: "", description: "" });

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/events");
      setEvents(data);
    } catch {
      toast.error("Etkinlikler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const eventsByDay = useMemo(() => {
    const map = {};
    for (const e of events) {
      if (!e.start_at) continue;
      try {
        const key = dayKey(parseISO(e.start_at));
        (map[key] = map[key] || []).push(e);
      } catch {
        /* skip invalid */
      }
    }
    Object.values(map).forEach((list) => list.sort((a, b) => (a.start_at || "").localeCompare(b.start_at || "")));
    return map;
  }, [events]);

  const openCreate = (date) => {
    setForm({ title: "", date: dayKey(date || cursor), start: "10:00", end: "11:00", location: "", description: "" });
    setDialogOpen(true);
  };

  const createEvent = async () => {
    if (!form.title.trim()) {
      toast.error("Lütfen başlık girin");
      return;
    }
    try {
      const start_at = new Date(`${form.date}T${form.start}`).toISOString();
      const end_at = form.end ? new Date(`${form.date}T${form.end}`).toISOString() : null;
      await api.post("/events", { title: form.title.trim(), start_at, end_at, location: form.location, description: form.description });
      setDialogOpen(false);
      toast.success("Etkinlik eklendi");
      load();
    } catch {
      toast.error("Etkinlik eklenemedi");
    }
  };

  const deleteEvent = async (e) => {
    try {
      await api.delete(`/events/${e.event_id}`);
      setSelectedEvent(null);
      toast.success("Etkinlik silindi");
      load();
    } catch {
      toast.error("Silinemedi");
    }
  };

  const moveEvent = async (eventId, targetDay) => {
    const ev = events.find((e) => e.event_id === eventId);
    if (!ev || !ev.start_at) return;
    try {
      const oldStart = parseISO(ev.start_at);
      const dayDiff = differenceInCalendarDays(targetDay, oldStart);
      if (dayDiff === 0) return;
      const newStart = addDays(oldStart, dayDiff);
      const payload = { start_at: newStart.toISOString() };
      if (ev.end_at) {
        payload.end_at = addDays(parseISO(ev.end_at), dayDiff).toISOString();
      }
      await api.patch(`/events/${eventId}`, payload);
      toast.success("Etkinlik taşındı");
      load();
    } catch {
      toast.error("Taşınamadı");
    }
  };

  const navigate = (dir) => {
    if (view === "month") setCursor((c) => addMonths(c, dir));
    else if (view === "week") setCursor((c) => addWeeks(c, dir));
    else setCursor((c) => addDays(c, dir));
  };

  const title = useMemo(() => {
    if (view === "month") return format(cursor, "MMMM yyyy", { locale: tr });
    if (view === "week") {
      const ws = startOfWeek(cursor, { weekStartsOn: 1 });
      return `${format(ws, "d MMM", { locale: tr })} – ${format(addDays(ws, 6), "d MMM yyyy", { locale: tr })}`;
    }
    return format(cursor, "d MMMM yyyy, EEEE", { locale: tr });
  }, [cursor, view]);

  const EventChip = ({ e, compact = true }) => (
    <button
      draggable
      onDragStart={(ev) => ev.dataTransfer.setData("text/plain", e.event_id)}
      onClick={(ev) => {
        ev.stopPropagation();
        setSelectedEvent(e);
      }}
      data-testid="calendar-event-chip"
      className="event-chip flex w-full items-center gap-1 truncate rounded-md border-l-2 border-[hsl(var(--accent-copper))] bg-[hsl(var(--surface-2))] px-1.5 py-0.5 text-left text-[11px] font-medium hover:brightness-95"
      title={e.title}
    >
      {!compact && <Clock className="h-3 w-3 shrink-0" />}
      <span className="shrink-0 font-mono-plex text-[10px] text-muted-foreground">
        {e.start_at ? format(parseISO(e.start_at), "HH:mm") : ""}
      </span>
      <span className="truncate">{e.title}</span>
    </button>
  );

  const DayCell = ({ day, minHeight = "min-h-[92px]" }) => {
    const key = dayKey(day);
    const dayEvents = eventsByDay[key] || [];
    const inMonth = isSameMonth(day, cursor);
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDropTarget(key);
        }}
        onDragLeave={() => setDropTarget((t) => (t === key ? null : t))}
        onDrop={(e) => {
          e.preventDefault();
          setDropTarget(null);
          const id = e.dataTransfer.getData("text/plain");
          if (id) moveEvent(id, day);
        }}
        onClick={() => openCreate(day)}
        data-testid={`calendar-day-${key}`}
        className={`${minHeight} cursor-pointer border-b border-r bg-card p-1.5 transition-colors hover:bg-[hsl(var(--surface-2))]/60 ${
          !inMonth && view === "month" ? "opacity-40" : ""
        } ${dropTarget === key ? "cal-day-droptarget" : ""}`}
      >
        <div className="mb-1 flex items-center justify-between">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
              isToday(day) ? "bg-[hsl(var(--accent-copper))] font-semibold text-[hsl(var(--accent-copper-foreground))]" : "text-muted-foreground"
            }`}
          >
            {format(day, "d")}
          </span>
        </div>
        <div className="space-y-0.5">
          {dayEvents.slice(0, 3).map((e) => <EventChip key={e.event_id} e={e} />)}
          {dayEvents.length > 3 && <p className="px-1 text-[10px] text-muted-foreground">+{dayEvents.length - 3} daha</p>}
        </div>
      </div>
    );
  };

  const monthDays = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [cursor]);

  const weekDays = useMemo(() => {
    const ws = startOfWeek(cursor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  }, [cursor]);

  const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  return (
    <div className="space-y-4" data-testid="calendar-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">Takvim</h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground" data-testid="calendar-title">{title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={setView}>
            <TabsList data-testid="calendar-view-tabs">
              <TabsTrigger value="day" data-testid="calendar-view-day">Gün</TabsTrigger>
              <TabsTrigger value="week" data-testid="calendar-view-week">Hafta</TabsTrigger>
              <TabsTrigger value="month" data-testid="calendar-view-month">Ay</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center rounded-lg border">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)} data-testid="calendar-prev-button" aria-label="Önceki">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9" onClick={() => setCursor(new Date())} data-testid="calendar-today-button">
              Bugün
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(1)} data-testid="calendar-next-button" aria-label="Sonraki">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => openCreate()} data-testid="calendar-create-event-button" className="gap-1.5 bg-[hsl(var(--accent-copper))] text-[hsl(var(--accent-copper-foreground))] hover:bg-[hsl(var(--accent-copper))] hover:brightness-95">
            <Plus className="h-4 w-4" /> Etkinlik
          </Button>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-[480px] rounded-xl" />
      ) : view === "month" ? (
        <div className="overflow-hidden rounded-xl border" data-testid="calendar-month-grid">
          <div className="grid grid-cols-7 border-b bg-[hsl(var(--surface-1))]">
            {DAY_NAMES.map((d) => (
              <div key={d} className="px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((day) => <DayCell key={dayKey(day)} day={day} />)}
          </div>
        </div>
      ) : view === "week" ? (
        <div className="overflow-hidden rounded-xl border" data-testid="calendar-week-grid">
          <div className="grid grid-cols-7 border-b bg-[hsl(var(--surface-1))]">
            {weekDays.map((day) => (
              <div key={dayKey(day)} className="px-2 py-1.5 text-center">
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">{format(day, "EEE", { locale: tr })}</p>
                <p className={`mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs ${isToday(day) ? "bg-[hsl(var(--accent-copper))] font-semibold text-[hsl(var(--accent-copper-foreground))]" : ""}`}>
                  {format(day, "d")}
                </p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {weekDays.map((day) => <DayCell key={dayKey(day)} day={day} minHeight="min-h-[300px]" />)}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card" data-testid="calendar-day-view">
          {(eventsByDay[dayKey(cursor)] || []).length === 0 ? (
            <div className="flex flex-col items-center py-14 text-center">
              <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium">Bu gün için etkinlik yok</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => openCreate(cursor)} data-testid="calendar-day-add-button">
                <Plus className="mr-1 h-3.5 w-3.5" /> Etkinlik ekle
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {(eventsByDay[dayKey(cursor)] || []).map((e) => (
                <button key={e.event_id} onClick={() => setSelectedEvent(e)} className="flex w-full items-start gap-4 px-4 py-3 text-left hover:bg-[hsl(var(--surface-2))]" data-testid="calendar-day-event-row">
                  <span className="font-mono-plex mt-0.5 shrink-0 text-sm font-medium text-[hsl(var(--accent-copper))]">
                    {e.start_at ? format(parseISO(e.start_at), "HH:mm") : "—"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{e.title}</p>
                    {e.location && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {e.location}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">İpucu: Etkinlikleri sürükleyip başka bir güne bırakarak taşıyabilirsiniz. Boş bir güne tıklayarak hızlı etkinlik ekleyin.</p>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="calendar-create-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Yeni etkinlik</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Başlık</Label>
              <Input data-testid="event-title-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Örn: Yatırımcı toplantısı" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Tarih</Label>
                <Input type="date" data-testid="event-date-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Başlangıç</Label>
                <Input type="time" data-testid="event-start-input" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Bitiş</Label>
                <Input type="time" data-testid="event-end-input" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Konum</Label>
              <Input data-testid="event-location-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Örn: Ofis / Zoom" />
            </div>
            <div className="space-y-1.5">
              <Label>Açıklama</Label>
              <Textarea data-testid="event-description-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} data-testid="event-cancel-button">Vazgeç</Button>
            <Button onClick={createEvent} data-testid="event-save-button" className="bg-[hsl(var(--accent-copper))] text-[hsl(var(--accent-copper-foreground))] hover:bg-[hsl(var(--accent-copper))] hover:brightness-95">Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event detail dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(o) => !o && setSelectedEvent(null)}>
        <DialogContent data-testid="calendar-event-detail-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {selectedEvent.start_at ? format(parseISO(selectedEvent.start_at), "d MMMM yyyy, HH:mm", { locale: tr }) : "—"}
                {selectedEvent.end_at ? ` – ${format(parseISO(selectedEvent.end_at), "HH:mm")}` : ""}
              </p>
              {selectedEvent.location && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {selectedEvent.location}
                </p>
              )}
              {selectedEvent.description && <p className="pt-1">{selectedEvent.description}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="destructive" onClick={() => deleteEvent(selectedEvent)} data-testid="event-delete-button" className="gap-1.5">
              <Trash2 className="h-4 w-4" /> Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
