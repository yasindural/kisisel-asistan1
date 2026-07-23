import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, ArrowRight, ArrowLeft, Loader2, User, SlidersHorizontal, Plug, Brain, Check, Mail, CalendarDays, HardDrive, MessageSquare, Send, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

const STEPS = [
  { id: 1, title: "Profil", icon: User },
  { id: 2, title: "AI Tercihleri", icon: SlidersHorizontal },
  { id: 3, title: "Entegrasyonlar", icon: Plug },
  { id: 4, title: "Başlangıç Hafızası", icon: Brain },
];

const INTEGRATIONS = [
  { key: "gmail", label: "Gmail", icon: Mail },
  { key: "google_calendar", label: "Google Calendar", icon: CalendarDays },
  { key: "google_drive", label: "Google Drive", icon: HardDrive },
  { key: "slack", label: "Slack", icon: MessageSquare },
  { key: "telegram", label: "Telegram", icon: Send },
  { key: "notion", label: "Notion", icon: FileText },
];

export default function OnboardingPage() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState({
    first_name: "", last_name: "", profession: "", company: "",
    timezone: "Europe/Istanbul", language: "Türkçe", country: "Türkiye",
  });
  const [prefs, setPrefs] = useState({
    address_style: "Sen", language: "Türkçe", tone: "Samimi ve net",
    reminder_frequency: "Günlük", work_start: "09:00", work_end: "18:00",
    sleep_start: "23:30", sleep_end: "07:00",
  });
  const [interests, setInterests] = useState([]);
  const [memoryText, setMemoryText] = useState("");

  useEffect(() => {
    if (user?.onboarding_complete) {
      navigate("/dashboard", { replace: true });
      return;
    }
    const parts = (user?.name || "").split(" ");
    setProfile((p) => ({
      ...p,
      first_name: p.first_name || user?.first_name || parts[0] || "",
      last_name: p.last_name || user?.last_name || parts.slice(1).join(" ") || "",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id]);

  const saveStep = async (payload) => {
    await api.put("/onboarding", payload);
  };

  const handleNext = async () => {
    setBusy(true);
    try {
      if (step === 1) {
        if (!profile.first_name.trim()) {
          toast.error("Lütfen adınızı girin");
          setBusy(false);
          return;
        }
        await saveStep({ profile, step: 2 });
        setStep(2);
      } else if (step === 2) {
        await saveStep({ ai_preferences: prefs, step: 3 });
        setStep(3);
      } else if (step === 3) {
        await saveStep({ integration_interests: interests, step: 4 });
        setStep(4);
      } else {
        await saveStep({
          profile,
          ai_preferences: prefs,
          integration_interests: interests,
          initial_memory: memoryText,
          complete: true,
        });
        await refresh();
        toast.success("Kurulum tamamlandı — ARIA hazır!");
        navigate("/dashboard", { replace: true });
      }
    } catch {
      toast.error("Kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  };

  const toggleInterest = (key) => {
    setInterests((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const TIMEZONES = ["Europe/Istanbul", "Europe/London", "Europe/Berlin", "America/New_York", "Asia/Dubai"];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="hero-sheen bg-noise border-b px-5 py-6">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--accent-copper))]">
              <Sparkles className="h-4 w-4 text-[hsl(var(--accent-copper-foreground))]" />
            </div>
            <span className="font-heading text-lg font-bold">ARIA</span>
          </div>
          <span className="text-xs text-muted-foreground">Adım {step} / 4</span>
        </div>
        <div className="mx-auto mt-5 flex w-full max-w-2xl items-center gap-1">
          {STEPS.map((s) => (
            <div key={s.id} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                  step > s.id
                    ? "border-[hsl(var(--accent-copper))] bg-[hsl(var(--accent-copper))] text-[hsl(var(--accent-copper-foreground))]"
                    : step === s.id
                      ? "border-[hsl(var(--accent-copper))] text-[hsl(var(--accent-copper))]"
                      : "border-border text-muted-foreground"
                }`}
              >
                {step > s.id ? <Check className="h-4 w-4" /> : <s.icon className="h-3.5 w-3.5" />}
              </div>
              <span className={`hidden text-[11px] sm:block ${step === s.id ? "font-medium text-foreground" : "text-muted-foreground"}`}>{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center px-5 py-8">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {step === 1 && (
                <div>
                  <h2 className="font-heading text-2xl font-bold">Sizi tanıyalım</h2>
                  <p className="mt-1 text-sm text-muted-foreground">ARIA size en iyi şekilde hizmet edebilmek için birkaç bilgiye ihtiyaç duyuyor.</p>
                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Ad</Label>
                      <Input data-testid="onboarding-first-name-input" value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} placeholder="Adınız" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Soyad</Label>
                      <Input data-testid="onboarding-last-name-input" value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} placeholder="Soyadınız" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Meslek</Label>
                      <Input data-testid="onboarding-profession-input" value={profile.profession} onChange={(e) => setProfile({ ...profile, profession: e.target.value })} placeholder="Örn: Girişimci" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Şirket</Label>
                      <Input data-testid="onboarding-company-input" value={profile.company} onChange={(e) => setProfile({ ...profile, company: e.target.value })} placeholder="Şirket adı" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Saat dilimi</Label>
                      <Select value={profile.timezone} onValueChange={(v) => setProfile({ ...profile, timezone: v })}>
                        <SelectTrigger data-testid="onboarding-timezone-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Ülke</Label>
                      <Input data-testid="onboarding-country-input" value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })} placeholder="Türkiye" />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="font-heading text-2xl font-bold">ARIA nasıl davransin?</h2>
                  <p className="mt-1 text-sm text-muted-foreground">İletişim tarzını ve çalışma ritminizi belirleyin.</p>
                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Hitap şekli</Label>
                      <Select value={prefs.address_style} onValueChange={(v) => setPrefs({ ...prefs, address_style: v })}>
                        <SelectTrigger data-testid="onboarding-address-style-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sen">Sen (samimi)</SelectItem>
                          <SelectItem value="Siz">Siz (resmi)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Ton</Label>
                      <Select value={prefs.tone} onValueChange={(v) => setPrefs({ ...prefs, tone: v })}>
                        <SelectTrigger data-testid="onboarding-tone-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Samimi ve net">Samimi ve net</SelectItem>
                          <SelectItem value="Profesyonel">Profesyonel</SelectItem>
                          <SelectItem value="Kısa ve öz">Kısa ve öz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Hatırlatma sıklığı</Label>
                      <Select value={prefs.reminder_frequency} onValueChange={(v) => setPrefs({ ...prefs, reminder_frequency: v })}>
                        <SelectTrigger data-testid="onboarding-reminder-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sık">Sık (günde birkaç kez)</SelectItem>
                          <SelectItem value="Günlük">Günlük</SelectItem>
                          <SelectItem value="Haftalık">Haftalık</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Dil</Label>
                      <Select value={prefs.language} onValueChange={(v) => setPrefs({ ...prefs, language: v })}>
                        <SelectTrigger data-testid="onboarding-language-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Türkçe">Türkçe</SelectItem>
                          <SelectItem value="English">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Çalışma saatleri</Label>
                      <div className="flex items-center gap-2">
                        <Input type="time" data-testid="onboarding-work-start-input" value={prefs.work_start} onChange={(e) => setPrefs({ ...prefs, work_start: e.target.value })} />
                        <span className="text-muted-foreground">–</span>
                        <Input type="time" data-testid="onboarding-work-end-input" value={prefs.work_end} onChange={(e) => setPrefs({ ...prefs, work_end: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Uyku saatleri</Label>
                      <div className="flex items-center gap-2">
                        <Input type="time" data-testid="onboarding-sleep-start-input" value={prefs.sleep_start} onChange={(e) => setPrefs({ ...prefs, sleep_start: e.target.value })} />
                        <span className="text-muted-foreground">–</span>
                        <Input type="time" data-testid="onboarding-sleep-end-input" value={prefs.sleep_end} onChange={(e) => setPrefs({ ...prefs, sleep_end: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="font-heading text-2xl font-bold">Hangi servisleri kullanıyorsunuz?</h2>
                  <p className="mt-1 text-sm text-muted-foreground">İlgilendiğiniz entegrasyonları seçin — hazır olduklarında size haber vereceğiz.</p>
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {INTEGRATIONS.map((intg) => {
                      const active = interests.includes(intg.key);
                      return (
                        <button
                          key={intg.key}
                          type="button"
                          data-testid={`onboarding-integration-${intg.key}`}
                          onClick={() => toggleInterest(intg.key)}
                          className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors ${
                            active
                              ? "border-[hsl(var(--accent-copper))] bg-[hsl(var(--accent-copper))]/10 text-foreground"
                              : "bg-card text-muted-foreground hover:border-[hsl(var(--ring))]"
                          }`}
                        >
                          <intg.icon className={`h-5 w-5 ${active ? "text-[hsl(var(--accent-copper))]" : ""}`} />
                          {intg.label}
                          {active && <Check className="h-3.5 w-3.5 text-[hsl(var(--accent-copper))]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h2 className="font-heading text-2xl font-bold">ARIA'ya kendinizden bahsedin</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Hedefleriniz, rutinleriniz ve önemli bilgiler — ARIA bunları kalıcı hafızasına kaydeder ve her konuşmada dikkate alır.</p>
                  <Textarea
                    data-testid="onboarding-memory-textarea"
                    value={memoryText}
                    onChange={(e) => setMemoryText(e.target.value)}
                    placeholder={"Örn: Bu yıl şirketimi büyütmek istiyorum. Sabahları spor yaparım. Salı günleri yatırımcı toplantılarım olur. En önemli müşterim Acme A.Ş."}
                    className="mt-6 min-h-[160px]"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">Bu adımı boş bırakabilirsiniz — hafızayı daha sonra da yönetebilirsiniz.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1 || busy}
              data-testid="onboarding-back-button"
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" /> Geri
            </Button>
            <Button
              onClick={handleNext}
              disabled={busy}
              data-testid="onboarding-next-button"
              className="gap-1.5 bg-[hsl(var(--accent-copper))] text-[hsl(var(--accent-copper-foreground))] hover:bg-[hsl(var(--accent-copper))] hover:brightness-95"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {step === 4 ? "Kurulumu tamamla" : "Devam et"}
              {step < 4 && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
