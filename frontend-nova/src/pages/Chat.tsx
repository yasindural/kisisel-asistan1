import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mic, Plus, SendHorizonal } from 'lucide-react';
import Orb from '@/components/Orb';
import { quickPrompts } from '@/data/mock';

interface Msg {
  id: number;
  role: 'user' | 'aria';
  text: string;
  actionCard?: { title: string; detail: string };
}

const canned: Record<string, { text: string; actionCard?: { title: string; detail: string } }> = {
  default: {
    text: 'Anladım. Bunu hafızana not aldım ve gerekirse hatırlatma kuracağım. Başka bir şey var mı?',
  },
  ara: {
    text: 'Tamam, yarın 10:00 için Burak Yılmaz’ı arama görevi oluşturdum. Önceliği “yüksek” olarak işaretledim ve 15 dakika önce hatırlatma kurdum.',
    actionCard: { title: 'Görev oluşturuldu', detail: 'Burak Yılmaz’ı ara — Yarın 10:00 • Yüksek öncelik' },
  },
  program: {
    text: 'Bugün 4 işin var: 10:30’da Burak’ı arama, 12:00’de bütçe taslağı (kritik), 14:00’te tasarım onayı ve 17:30’da spor salonu. 12:00’deki işe odaklanmanı öneririm, gerisini ben takip ederim.',
  },
  selin: {
    text: 'Selin Demir’e takip e-postası taslağı hazırladım. Tasarım review toplantısının ardından gönderilmesi için taslak klasörüne koydum — onayına hazır.',
    actionCard: { title: 'Taslak hazır', detail: 'Kime: Selin Demir • Konu: Tasarım review takibi' },
  },
  toplantı: {
    text: 'Bu hafta 7 etkinliğin var, 4’ü toplantı: Ürün sync, yatırımcı görüşmesi (Salı 14:00), tasarım review ve müşteri demosu. Yatırımcı görüşmesi öncesi Cuma bloğunu boş bırakmanı öneririm.',
  },
};

function pickReply(q: string) {
  const s = q.toLocaleLowerCase('tr');
  if (s.includes('ara') || s.includes('burak')) return canned.ara;
  if (s.includes('özetle') || s.includes('program')) return canned.program;
  if (s.includes('selin') || s.includes('e-posta')) return canned.selin;
  if (s.includes('toplantı') || s.includes('hafta')) return canned.toplantı;
  return canned.default;
}

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(1);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, thinking]);

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || thinking) return;
    setInput('');
    const userMsg: Msg = { id: idRef.current++, role: 'user', text };
    setMsgs((m) => [...m, userMsg]);
    setThinking(true);

    const reply = pickReply(text);
    // SSE streaming simülasyonu — token token yaz
    setTimeout(() => {
      const ariaId = idRef.current++;
      setMsgs((m) => [...m, { id: ariaId, role: 'aria', text: '' }]);
      setThinking(false);
      let i = 0;
      const chunk = 3;
      const timer = setInterval(() => {
        i += chunk;
        const slice = reply.text.slice(0, i);
        setMsgs((m) => m.map((x) => (x.id === ariaId ? { ...x, text: slice, actionCard: i >= reply.text.length ? reply.actionCard : undefined } : x)));
        if (i >= reply.text.length) clearInterval(timer);
      }, 24);
    }, 1400);
  };

  const empty = msgs.length === 0;

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col px-5 pb-24 md:px-7 md:pb-6">
      {/* messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto py-4 pr-1">
        {empty && (
          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="flex h-full flex-col items-center justify-center gap-8 text-center">
            <Orb size={150} />
            <div>
              <h2 className="font-display text-3xl font-bold text-white">
                Sana nasıl <span className="text-aurora">yardımcı olayım?</span>
              </h2>
              <p className="mt-2 text-sm text-white/45">Türkçe yaz yeter — görev kurarım, takvim yönetirim, e-posta özetlerim.</p>
            </div>
            <div className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
              {quickPrompts.map((q, i) => (
                <motion.button
                  key={q}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }}
                  onClick={() => send(q)}
                  className="glass glow-hover rounded-xl px-4 py-3 text-left text-[12.5px] text-white/65"
                >
                  {q}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {msgs.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'aria' && (
                <div className="mr-3 mt-1 shrink-0">
                  <Orb size={34} />
                </div>
              )}
              <div className={`max-w-[78%] ${m.role === 'user' ? '' : 'space-y-2'}`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-gradient-to-br from-violet-600/80 to-fuchsia-600/60 text-white shadow-[0_8px_30px_-8px_rgba(139,92,246,0.5)]'
                      : 'glass text-white/85'
                  }`}
                >
                  {m.text}
                  {m.role === 'aria' && m.text.length > 0 && !m.actionCard && thinking === false && m.id === msgs[msgs.length - 1]?.id && (
                    <span className="animate-caret ml-0.5 inline-block h-4 w-[2px] translate-y-[3px] bg-cyan-300" />
                  )}
                </div>
                {m.actionCard && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="ring-conic inline-block rounded-xl p-[1px]"
                  >
                    <div className="flex items-center gap-3 rounded-[11px] bg-[#0c0c1e]/95 px-4 py-2.5">
                      <span className="text-lg">⚡</span>
                      <div>
                        <div className="text-[12px] font-semibold text-cyan-300">{m.actionCard.title}</div>
                        <div className="text-[11.5px] text-white/55">{m.actionCard.detail}</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {thinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
            <Orb size={34} active />
            <div className="glass flex items-center gap-1.5 rounded-2xl px-4 py-3.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-cyan-300"
                  animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* input dock */}
      <div className="sticky bottom-0 pt-2">
        <div className="ring-conic rounded-2xl p-[1.2px] shadow-[0_0_40px_-8px_rgba(139,92,246,0.45)]">
          <div className="glass-deep flex items-center gap-2 rounded-[14px] px-3 py-2">
            <button className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white/40 transition-colors hover:bg-white/5 hover:text-white/70">
              <Plus className="h-4.5 w-4.5" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="ARIA'ya yaz… örn: “Yarın 10:00'da Burak'ı ara”"
              className="min-w-0 flex-1 bg-transparent py-2 text-[14px] text-white placeholder:text-white/30 focus:outline-none"
            />
            <button className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white/40 transition-colors hover:bg-white/5 hover:text-cyan-300">
              <Mic className="h-4 w-4" />
            </button>
            <button
              onClick={() => send()}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 text-white shadow-[0_0_18px_rgba(34,211,238,0.5)] transition-transform hover:scale-105 active:scale-95"
            >
              <SendHorizonal className="h-4 w-4" />
            </button>
          </div>
        </div>
        <p className="mt-2 text-center text-[10.5px] text-white/25">ARIA hata yapabilir — kritik aksiyonlarda onayını ister.</p>
      </div>
    </div>
  );
}
