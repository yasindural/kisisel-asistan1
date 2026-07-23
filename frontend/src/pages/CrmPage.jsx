import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { Plus, Trash2, Users, Phone, Mail, Building2, Sparkles, StickyNote, PhoneCall, CalendarClock, MessageCircle, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

const INTERACTION_TYPES = {
  note: { label: "Not", icon: StickyNote },
  call: { label: "Arama", icon: PhoneCall },
  email: { label: "E-posta", icon: Mail },
  meeting: { label: "Toplantı", icon: CalendarClock },
  message: { label: "Mesaj", icon: MessageCircle },
};

const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";

export default function CrmPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [interactionsLoading, setInteractionsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", notes: "" });
  const [noteType, setNoteType] = useState("note");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/contacts");
      setContacts(data);
      return data;
    } catch {
      toast.error("Kişiler yüklenemedi");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const list = await load();
      const cid = searchParams.get("contact");
      if (cid) {
        const c = list.find((x) => x.contact_id === cid);
        if (c) selectContact(c);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectContact = async (c) => {
    setSelected(c);
    setSearchParams({ contact: c.contact_id }, { replace: true });
    setInteractionsLoading(true);
    try {
      const { data } = await api.get(`/contacts/${c.contact_id}/interactions`);
      setInteractions(data);
    } catch {
      setInteractions([]);
    } finally {
      setInteractionsLoading(false);
    }
  };

  const addContact = async () => {
    if (!form.name.trim()) {
      toast.error("Lütfen isim girin");
      return;
    }
    try {
      const { data } = await api.post("/contacts", form);
      setDialogOpen(false);
      setForm({ name: "", email: "", phone: "", company: "", notes: "" });
      toast.success("Kişi eklendi");
      await load();
      selectContact(data);
    } catch {
      toast.error("Kişi eklenemedi");
    }
  };

  const deleteContact = async (c) => {
    try {
      await api.delete(`/contacts/${c.contact_id}`);
      setSelected(null);
      setSearchParams({}, { replace: true });
      toast.success("Kişi silindi");
      load();
    } catch {
      toast.error("Silinemedi");
    }
  };

  const addInteraction = async () => {
    if (!noteText.trim() || !selected) return;
    setSavingNote(true);
    try {
      await api.post(`/contacts/${selected.contact_id}/interactions`, { type: noteType, content: noteText.trim() });
      setNoteText("");
      toast.success("Etkileşim kaydedildi");
      const { data } = await api.get(`/contacts/${selected.contact_id}/interactions`);
      setInteractions(data);
      load();
    } catch {
      toast.error("Kaydedilemedi");
    } finally {
      setSavingNote(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => [c.name, c.company, c.email].some((v) => v?.toLowerCase().includes(q)));
  }, [contacts, query]);

  return (
    <div className="space-y-4" data-testid="crm-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">CRM</h1>
          <p className="mt-1 text-sm text-muted-foreground">{contacts.length} kişi</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="crm-add-contact-button" className="gap-1.5 bg-[hsl(var(--accent-copper))] text-[hsl(var(--accent-copper-foreground))] hover:bg-[hsl(var(--accent-copper))] hover:brightness-95">
          <Plus className="h-4 w-4" /> Kişi ekle
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        {/* Contact list */}
        <div className="rounded-xl border bg-card">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                data-testid="crm-contact-search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Kişi ara…"
                className="pl-8"
              />
            </div>
          </div>
          <ScrollArea className="h-[420px] lg:h-[560px]">
            {loading ? (
              <div className="space-y-2 p-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center" data-testid="crm-empty-state">
                <Users className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-medium">{query ? "Sonuç bulunamadı" : "Henüz kişi yok"}</p>
                {!query && <p className="mt-1 max-w-[200px] text-xs text-muted-foreground">İlişkilerinizi takip etmek için ilk kişinizi ekleyin.</p>}
              </div>
            ) : (
              <div className="space-y-0.5 p-2">
                {filtered.map((c) => (
                  <button
                    key={c.contact_id}
                    onClick={() => selectContact(c)}
                    data-testid="crm-contact-row"
                    className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors ${
                      selected?.contact_id === c.contact_id ? "bg-[hsl(var(--surface-2))]" : "hover:bg-[hsl(var(--surface-2))]"
                    }`}
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-[hsl(var(--brand))] text-xs font-semibold text-[hsl(var(--brand-foreground))]">
                        {initials(c.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.company || c.email || "—"}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Detail */}
        <div className="rounded-xl border bg-card">
          {!selected ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center p-8 text-center" data-testid="crm-no-selection">
              <Users className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">Bir kişi seçin</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">Detayları, ARIA özetini ve etkileşim geçmişini burada görürsünüz.</p>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-[hsl(var(--accent-copper))] text-sm font-semibold text-[hsl(var(--accent-copper-foreground))]">
                      {initials(selected.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-heading text-lg font-bold" data-testid="crm-detail-name">{selected.name}</h2>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {selected.company && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{selected.company}</span>}
                      {selected.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{selected.email}</span>}
                      {selected.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{selected.phone}</span>}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => deleteContact(selected)} data-testid="crm-delete-contact-button" aria-label="Kişiyi sil">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4 p-4">
                {/* ARIA summary */}
                <div className="rounded-lg border border-[hsl(var(--accent-copper))]/30 bg-[hsl(var(--accent-copper))]/8 bg-[hsl(var(--surface-2))] p-3" data-testid="crm-aria-summary">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--accent-copper))]">
                    <Sparkles className="h-3.5 w-3.5" /> ARIA özeti
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {selected.ai_summary ||
                      (interactions.length > 0
                        ? `${selected.name} ile ${interactions.length} etkileşim kaydedildi. Son temas: ${selected.last_contact ? format(parseISO(selected.last_contact), "d MMMM yyyy", { locale: tr }) : "—"}.`
                        : `${selected.name} ile henüz etkileşim kaydedilmedi. İlk görüşme notunuzu ekleyin — ARIA ilişki geçmişini sizin için takip etsin.`)}
                  </p>
                  {selected.notes && <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">Not: {selected.notes}</p>}
                </div>

                {/* Add interaction */}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select value={noteType} onValueChange={setNoteType}>
                    <SelectTrigger className="w-full sm:w-[130px]" data-testid="crm-interaction-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(INTERACTION_TYPES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    data-testid="crm-interaction-input"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addInteraction()}
                    placeholder="Görüşme notu ekle…"
                    className="flex-1"
                  />
                  <Button onClick={addInteraction} disabled={savingNote || !noteText.trim()} data-testid="crm-add-interaction-button" className="gap-1.5">
                    {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Kaydet
                  </Button>
                </div>

                {/* Timeline */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Etkileşim geçmişi</p>
                  {interactionsLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
                    </div>
                  ) : interactions.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground" data-testid="crm-timeline-empty">Henüz etkileşim yok.</p>
                  ) : (
                    <div className="relative space-y-3 pl-5 before:absolute before:bottom-1 before:left-[7px] before:top-1 before:w-px before:bg-border">
                      {interactions.map((it) => {
                        const meta = INTERACTION_TYPES[it.type] || INTERACTION_TYPES.note;
                        return (
                          <motion.div key={it.interaction_id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="relative" data-testid="crm-interaction-item">
                            <span className="absolute -left-5 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--accent-copper))]">
                              <meta.icon className="h-2.5 w-2.5 text-[hsl(var(--accent-copper-foreground))]" />
                            </span>
                            <div className="rounded-lg border bg-[hsl(var(--surface-1))] px-3 py-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold">{meta.label}</span>
                                <span className="text-[11px] text-muted-foreground">
                                  {it.created_at ? format(parseISO(it.created_at), "d MMM yyyy, HH:mm", { locale: tr }) : ""}
                                </span>
                              </div>
                              <p className="mt-1 text-sm">{it.content}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add contact dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="crm-add-contact-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Yeni kişi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>İsim *</Label>
              <Input data-testid="crm-form-name-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ad Soyad" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>E-posta</Label>
                <Input data-testid="crm-form-email-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Telefon</Label>
                <Input data-testid="crm-form-phone-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Şirket</Label>
              <Input data-testid="crm-form-company-input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Notlar</Label>
              <Textarea data-testid="crm-form-notes-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} data-testid="crm-form-cancel-button">Vazgeç</Button>
            <Button onClick={addContact} data-testid="crm-form-save-button" className="bg-[hsl(var(--accent-copper))] text-[hsl(var(--accent-copper-foreground))] hover:bg-[hsl(var(--accent-copper))] hover:brightness-95">Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
