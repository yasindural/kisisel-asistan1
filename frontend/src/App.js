import { useEffect, useRef, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { applyTheme, getStoredTheme } from "@/hooks/useTheme";
import AppShell from "@/components/AppShell";
import LoginPage from "@/pages/LoginPage";
import OnboardingPage from "@/pages/OnboardingPage";
import DashboardPage from "@/pages/DashboardPage";
import ChatPage from "@/pages/ChatPage";
import TasksPage from "@/pages/TasksPage";
import CalendarPage from "@/pages/CalendarPage";
import CrmPage from "@/pages/CrmPage";
import MemoryPage from "@/pages/MemoryPage";
import IntegrationsPage from "@/pages/IntegrationsPage";
import { Loader2 } from "lucide-react";

const FullScreenLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background" data-testid="fullscreen-loader">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--accent-copper))]" />
      <span className="text-sm text-muted-foreground">ARIA yükleniyor…</span>
    </div>
  </div>
);

// Handles Emergent Google OAuth return: #session_id=... in URL fragment
const AuthCallback = () => {
  const { googleExchange } = useAuth();
  const navigate = useNavigate();
  const hasProcessed = useRef(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    const hash = window.location.hash || "";
    const match = hash.match(/session_id=([^&]+)/);
    const sessionId = match ? decodeURIComponent(match[1]) : null;
    if (!sessionId) {
      navigate("/login", { replace: true });
      return;
    }
    (async () => {
      try {
        const user = await googleExchange(sessionId);
        window.history.replaceState(null, "", window.location.pathname);
        if (user?.onboarding_complete) navigate("/dashboard", { replace: true, state: { user } });
        else navigate("/onboarding", { replace: true, state: { user } });
      } catch {
        setError("Google girişi doğrulanamadı. Lütfen tekrar deneyin.");
        setTimeout(() => navigate("/login", { replace: true }), 2500);
      }
    })();
  }, [googleExchange, navigate]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-destructive" data-testid="auth-callback-error">{error}</p>
      </div>
    );
  }
  return <FullScreenLoader />;
};

const ProtectedRoute = ({ children, requireOnboarding = true }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (requireOnboarding && !user.onboarding_complete && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
};

function AppRouter() {
  const location = useLocation();
  // Check URL fragment synchronously during render (prevents race conditions)
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute requireOnboarding={false}>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/crm" element={<CrmPage />} />
        <Route path="/memory" element={<MemoryPage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AuthProvider>
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}

export default App;
