import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { Plus, Trash2, Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

const CATEGORIES = {
  genel: "Genel",
  hedefler: "Hedefler",
  rutin: "Rutin",
  kisisel: "Kişisel",
  is: "İş",
};

const IMPORTANCE_LABELS = ["", "Düşük", "Az", "Orta", "Yüksek", "Kritik"];

const listVariants = { animate: { transition: { staggerChildren: 0.05 } } };
const itemVariants = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 } };

export default function MemoryPage() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ content: "", category: "genel", importance: 3 });

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/memories");
      setMemories(data);
    } catch {
      toast.error("Hafıza kayıtları yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addMemory = async () => {
    if (!form.content.trim()) {
      toast.error("Lütfen içerik girin");
      return;
    }
    setSaving(true);
    try {
      await api.post("/memories", form);
      setDialogOpen(false);
      setForm({ content: "", category: "genel", importance: 3 });
      toast.success("Hafıza kaydedildi");
      load();
    } catch {
      toast.error("Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const toggleApproved = async (m) => {
    try {
      await api.patch(`/memories/${m.memory_id}`, { approved: !m.approved });
      setMemories((prev) => prev.map((x) => (x.memory_id === m.memory_id ? { ...x, approved: !m.approved } : x)));
      toast.success(m.approved ? "Hafıza pasife alındı" : "Hafıza aktifleştirildi");
    } catch {
      toast.error("Güncellenemedi");
    }
  };

  const removeMemory = async (m) => {
    try {
      await api.delete(`/memories/${m.memory_id}`);
      setMemories((prev) => prev.filter((x) => x.memory_id !== m.memory_id));
      toast.success("Hafıza silindi");
    } catch {
      toast.error("Silinemedi");
    }
  };

  const activeCount = memories.filter((m) => m.approved).length;

  return (
    <div className="space-y-5" data-testid="memory-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">AI Hafızası</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeCount} aktif kayıt — ARIA yalnızca aktif kayıtları dikkate alır.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="memory-add-button" className="gap-1.5 bg-[hsl(var(--accent-copper))] text-[hsl(var(--accent-copper-foreground))] hover:bg-[hsl(var(--accent-copper))] hover:brightness-95">
          <Plus className="h-4 w-4" /> Hafıza ekle
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : memories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-14 text-center" data-testid="memory-empty-state">
          <Brain className="h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">Henüz hafıza kaydı yok</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Hedeflerinizi, rutinlerinizi ve önemli bilgileri ekleyin — ARIA her konuşmada bunları hatırlar.
          </p>
        </div>
      ) : (
        <motion.div variants={listVariants} initial="initial" animate="animate" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {memories.map((m) => (
            <motion.div
              key={m.memory_id}
              variants={itemVariants}
              data-testid="memory-card"
              className={`flex flex-col rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm ${!m.approved ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <Badge variant="secondary" className="border-0 text-[11px]">{CATEGORIES[m.category] || m.category}</Badge>
                <div className="flex items-center gap-0.5" title={`Önem: ${IMPORTANCE_LABELS[m.importance] || m.importance}`}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className={`h-1.5 w-1.5 rounded-full ${i <= (m.importance || 3) ? "bg-[hsl(var(--accent-copper))]" : "bg-[hsl(var(--surface-2))]"}`} />
                  ))}
                </div>
              </div>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed">{m.content}</p>
              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <span className="text-[11px] text-muted-foreground">
                  {m.source === "onboarding" ? "Kurulumdan" : "Manuel"} · {m.created_at ? format(parseISO(m.created_at), "d MMM yyyy", { locale: tr }) : ""}
                </span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={m.approved}
                    onCheckedChange={() => toggleApproved(m)}
                    data-testid="memory-active-toggle"
                    aria-label="Hafızayı aktif/pasif yap"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeMemory(m)}
                    data-testid="memory-delete-button"
                    aria-label="Hafızayı sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="memory-add-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Yeni hafıza kaydı</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>İçerik</Label>
              <Textarea
                data-testid="memory-content-input"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Örn: Salı günleri yatırımcı toplantılarım olur."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger data-testid="memory-category-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Önem: {IMPORTANCE_LABELS[form.importance]}</Label>
                <Slider
                  data-testid="memory-importance-slider"
                  value={[form.importance]}
                  onValueChange={([v]) => setForm({ ...form, importance: v })}
                  min={1}
                  max={5}
                  step={1}
                  className="pt-3"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} data-testid="memory-cancel-button">Vazgeç</Button>
            <Button onClick={addMemory} disabled={saving} data-testid="memory-save-button" className="gap-1.5 bg-[hsl(var(--accent-copper))] text-[hsl(var(--accent-copper-foreground))] hover:bg-[hsl(var(--accent-copper))] hover:brightness-95">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
