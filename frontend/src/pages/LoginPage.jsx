import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, Loader2, ArrowRight, CheckCircle2, CalendarDays, Users, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const FEATURES = [
  { icon: CheckCircle2, text: "Doğal dille görev oluşturun: \"Yarın Burak'ı ara\"" },
  { icon: CalendarDays, text: "Gününüzü planlayan akıllı takvim" },
  { icon: Users, text: "İlişkilerinizi hatırlayan CRM" },
  { icon: Brain, text: "Sizi tanıyan kalıcı AI hafızası" },
];

export default function LoginPage() {
  const { user, loading, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    return <Navigate to={user.onboarding_complete ? "/dashboard" : "/onboarding"} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      let u;
      if (mode === "login") {
        u = await login(form.email, form.password);
        toast.success("Tekrar hoş geldiniz");
      } else {
        u = await register(form.name, form.email, form.password);
        toast.success("Hesabınız oluşturuldu");
      }
      navigate(u.onboarding_complete ? "/dashboard" : "/onboarding", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.detail || "Bir hata oluştu. Lütfen tekrar deneyin.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left brand panel (desktop) */}
      <div className="hero-sheen bg-noise relative hidden w-1/2 flex-col justify-between overflow-hidden p-10 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--accent-copper))] shadow-sm">
            <Sparkles className="h-4.5 w-4.5 h-4 w-4 text-[hsl(var(--accent-copper-foreground))]" />
          </div>
          <span className="font-heading text-xl font-bold tracking-tight">ARIA</span>
        </div>
        <div className="max-w-md">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            className="font-heading text-4xl font-bold leading-[1.1] tracking-tight xl:text-5xl"
          >
            Sohbet değil.{" "}
            <span className="text-[hsl(var(--accent-copper))]">İş yapan</span> dijital çalışanınız.
          </motion.h1>
          <p className="mt-4 text-base text-muted-foreground">
            ARIA gününüzü planlar, görevlerinizi yönetir, ilişkilerinizi hatırlar ve doğal dil komutlarınızı gerçek aksiyonlara dönüştürür.
          </p>
          <div className="mt-8 space-y-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.35 }}
                className="flex items-center gap-3 text-sm"
              >
                <f.icon className="h-4 w-4 shrink-0 text-[hsl(var(--accent-copper))]" />
                <span>{f.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 ARIA — Yapay zekâ destekli dijital çalışanınız.</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--accent-copper))]">
                <Sparkles className="h-4 w-4 text-[hsl(var(--accent-copper-foreground))]" />
              </div>
              <span className="font-heading text-xl font-bold">ARIA</span>
            </div>
          </div>

          <h2 className="font-heading text-2xl font-bold tracking-tight">
            {mode === "login" ? "Tekrar hoş geldiniz" : "Hesap oluşturun"}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "login" ? "Dijital çalışanınız sizi bekliyor." : "Birkaç saniyede başlayın — kurulum gerektirmez."}
          </p>

          <Button
            variant="outline"
            className="mt-6 w-full gap-2"
            onClick={handleGoogle}
            data-testid="google-login-button"
          >
            <GoogleIcon />
            Google ile devam et
          </Button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">veya e-posta ile</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Ad Soyad</Label>
                <Input
                  id="name"
                  data-testid="register-name-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Adınız Soyadınız"
                  required
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                data-testid="login-email-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="ornek@sirket.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                data-testid="login-password-input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
              data-testid="login-form-submit-button"
              className="w-full gap-2 bg-[hsl(var(--accent-copper))] text-[hsl(var(--accent-copper-foreground))] hover:bg-[hsl(var(--accent-copper))] hover:brightness-95"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {mode === "login" ? "Giriş yap" : "Kayıt ol"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? "Hesabınız yok mu?" : "Zaten hesabınız var mı?"}{" "}
            <button
              type="button"
              data-testid="auth-mode-toggle-button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="font-medium text-[hsl(var(--accent-copper))] hover:underline"
            >
              {mode === "login" ? "Kayıt olun" : "Giriş yapın"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
