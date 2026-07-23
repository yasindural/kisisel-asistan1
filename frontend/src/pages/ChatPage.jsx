import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { Sparkles, Send, Plus, MessageSquare, CheckCircle2, Loader2, Trash2, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { api, API, getToken } from "@/lib/api";

const SUGGESTIONS = [
  "Yarın Burak'ı ara",
  "Saat 18:00'de beni uyar",
  "Bugünkü işlerimi özetle",
  "Bu hafta neye odaklanmalıyım?",
];

const ActionCard = ({ action }) => (
  <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-[hsl(var(--success))]/40 bg-[hsl(var(--success))]/10 px-3 py-2" data-testid="chat-action-card">
    <CheckCircle2 className="h-4 w-4 shrink-0 text-[hsl(var(--success))]" />
    <div className="min-w-0 text-sm">
      <span className="font-medium">Görev oluşturuldu:</span> <span className="truncate">{action.title}</span>
      {action.due_at && (
        <span className="ml-1 text-xs text-muted-foreground">
          ({format(parseISO(action.due_at), "d MMM HH:mm", { locale: tr })})
        </span>
      )}
    </div>
  </div>
);

export default function ChatPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [threads, setThreads] = useState([]);
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [showThreads, setShowThreads] = useState(false);
  const bottomRef = useRef(null);
  const initialSent = useRef(false);

  const loadThreads = useCallback(async () => {
    try {
      const { data } = await api.get("/chat/threads");
      setThreads(data);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openThread = async (tid) => {
    setThreadId(tid);
    setShowThreads(false);
    try {
      const { data } = await api.get(`/chat/threads/${tid}/messages`);
      setMessages(data);
    } catch {
      toast.error("Mesajlar yüklenemedi");
    }
  };

  const newChat = () => {
    setThreadId(null);
    setMessages([]);
    setShowThreads(false);
  };

  const deleteThread = async (tid, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/chat/threads/${tid}`);
      if (tid === threadId) newChat();
      loadThreads();
      toast.success("Konuşma silindi");
    } catch {
      toast.error("Silinemedi");
    }
  };

  const sendMessage = useCallback(
    async (text) => {
      const message = (text ?? input).trim();
      if (!message || streaming) return;
      setInput("");
      setStreaming(true);

      const userMsg = { message_id: `tmp-${Date.now()}`, role: "user", content: message };
      const assistantMsg = { message_id: `tmp-a-${Date.now()}`, role: "assistant", content: "", streaming: true };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      try {
        const token = getToken();
        const res = await fetch(`${API}/chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify({ message, thread_id: threadId }),
        });
        if (!res.ok || !res.body) throw new Error("stream failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const handleEvent = (evt) => {
          if (evt.type === "meta") {
            if (evt.thread_id && !threadId) setThreadId(evt.thread_id);
          } else if (evt.type === "delta") {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") next[next.length - 1] = { ...last, content: last.content + evt.content };
              return next;
            });
          } else if (evt.type === "action") {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") next[next.length - 1] = { ...last, action: evt.action };
              return next;
            });
            toast.success("Görev oluşturuldu");
          } else if (evt.type === "done") {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") next[next.length - 1] = { ...last, streaming: false };
              return next;
            });
          } else if (evt.type === "error") {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") {
                next[next.length - 1] = { ...last, streaming: false, content: last.content || evt.message, error: true };
              }
              return next;
            });
            toast.error(evt.message || "Bir hata oluştu");
          }
        };

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split("\n\n");
          buffer = blocks.pop();
          for (const block of blocks) {
            const line = block.trim();
            if (!line.startsWith("data: ")) continue;
            try {
              handleEvent(JSON.parse(line.slice(6)));
            } catch {
              /* skip malformed */
            }
          }
        }
        loadThreads();
      } catch {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant" && !last.content) {
            next[next.length - 1] = { ...last, streaming: false, content: "Bağlantı hatası oluştu. Lütfen tekrar deneyin.", error: true };
          }
          return next;
        });
        toast.error("Mesaj gönderilemedi");
      } finally {
        setStreaming(false);
      }
    },
    [input, streaming, threadId, loadThreads]
  );

  // Initial message coming from dashboard quick-ask
  useEffect(() => {
    const initial = location.state?.initialMessage;
    if (initial && !initialSent.current) {
      initialSent.current = true;
      window.history.replaceState({}, "");
      sendMessage(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const firstName = user?.first_name || user?.name?.split(" ")[0] || "";

  return (
    <div className="flex h-[calc(100vh-7.5rem)] gap-4" data-testid="chat-page">
      {/* Thread list */}
      <aside className={`${showThreads ? "flex" : "hidden"} absolute inset-x-4 top-2 z-20 max-h-[70vh] flex-col rounded-xl border bg-card shadow-lg md:static md:z-auto md:flex md:max-h-none md:w-64 md:shrink-0 md:shadow-none`}>
        <div className="flex items-center justify-between border-b p-3">
          <span className="text-sm font-semibold">Konuşmalar</span>
          <Button size="sm" variant="outline" onClick={newChat} data-testid="chat-new-thread-button" className="h-8 gap-1">
            <Plus className="h-3.5 w-3.5" /> Yeni
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-0.5 p-2">
            {threads.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">Henüz konuşma yok.</p>
            ) : (
              threads.map((t) => (
                <button
                  key={t.thread_id}
                  onClick={() => openThread(t.thread_id)}
                  data-testid="chat-thread-item"
                  className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                    t.thread_id === threadId ? "bg-[hsl(var(--surface-2))] font-medium" : "text-muted-foreground hover:bg-[hsl(var(--surface-2))]"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{t.title}</span>
                  <Trash2
                    className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    onClick={(e) => deleteThread(t.thread_id, e)}
                    data-testid="chat-thread-delete"
                    role="button"
                    aria-label="Konuşmayı sil"
                  />
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Chat main */}
      <div className="relative flex min-w-0 flex-1 flex-col rounded-xl border bg-card">
        <div className="flex items-center gap-2 border-b px-4 py-2.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setShowThreads((s) => !s)} data-testid="chat-toggle-threads-button" aria-label="Konuşmaları göster">
            <PanelLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--accent-copper))]">
            <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--accent-copper-foreground))]" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">ARIA</p>
            <p className="text-[11px] text-muted-foreground">{streaming ? "yazıyor…" : "çevrimiçi — GPT-5.4"}</p>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-5">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--accent-copper))]/15">
                  <Sparkles className="h-7 w-7 text-[hsl(var(--accent-copper))]" />
                </motion.div>
                <h2 className="font-heading mt-4 text-xl font-bold">Merhaba {firstName} 👋</h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Ben ARIA. Görev oluşturabilir, gününüzü planlayabilir ve sorularınızı yanıtlayabilirim.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      data-testid="chat-suggestion-chip"
                      className="rounded-full border bg-[hsl(var(--surface-1))] px-3.5 py-1.5 text-xs font-medium transition-colors hover:border-[hsl(var(--accent-copper))] hover:text-[hsl(var(--accent-copper))]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={m.message_id || i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    data-testid={m.role === "user" ? "chat-user-message" : "chat-assistant-message"}
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-md bg-[hsl(var(--brand))] text-[hsl(var(--brand-foreground))]"
                        : "rounded-bl-md border bg-[hsl(var(--surface-1))]"
                    } ${m.error ? "border-destructive/50" : ""}`}
                  >
                    <span className="whitespace-pre-wrap">{m.content}</span>
                    {m.streaming && <span className="stream-cursor" />}
                    {m.action && <ActionCard action={m.action} />}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-3">
          <div className="mx-auto flex w-full max-w-2xl items-end gap-2">
            <Textarea
              data-testid="chat-message-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Mesaj yazın… Örn: "Yarın Burak'ı ara"`}
              rows={1}
              className="max-h-32 min-h-[44px] flex-1 resize-none bg-[hsl(var(--surface-0))]"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={streaming || !input.trim()}
              data-testid="chat-send-button"
              size="icon"
              className="h-11 w-11 shrink-0 bg-[hsl(var(--accent-copper))] text-[hsl(var(--accent-copper-foreground))] hover:bg-[hsl(var(--accent-copper))] hover:brightness-95"
              aria-label="Gönder"
            >
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="mx-auto mt-1.5 max-w-2xl text-[11px] text-muted-foreground">
            ARIA doğal dil komutlarını gerçek görevlere dönüştürür. <Badge variant="secondary" className="ml-1 border-0 text-[10px]">Enter ile gönder</Badge>
          </p>
        </div>
      </div>
    </div>
  );
}
