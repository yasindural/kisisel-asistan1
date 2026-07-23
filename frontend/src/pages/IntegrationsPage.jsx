import { motion } from "framer-motion";
import { Mail, CalendarDays, HardDrive, MessageSquare, Send, FileText, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const INTEGRATIONS = [
  {
    key: "gmail",
    name: "Gmail",
    icon: Mail,
    description: "E-postalarınızı okusun, özetlesin ve sizin adınıza taslak hazırlasın.",
  },
  {
    key: "google_calendar",
    name: "Google Calendar",
    icon: CalendarDays,
    description: "Takviminizi iki yönlü senkronize etsin, toplantılarınızı planlasın.",
  },
  {
    key: "google_drive",
    name: "Google Drive",
    icon: HardDrive,
    description: "Dosyalarınıza erişsin, arasın ve paylaşsın.",
  },
  {
    key: "slack",
    name: "Slack",
    icon: MessageSquare,
    description: "Ekip mesajlarınızı takip etsin ve önemli konuları iletsin.",
  },
  {
    key: "telegram",
    name: "Telegram",
    icon: Send,
    description: "ARIA ile Telegram üzerinden her yerden konuşun.",
  },
  {
    key: "notion",
    name: "Notion",
    icon: FileText,
    description: "Notlarınızı ve dökümanlarınızı ARIA'nın bilgisine ekleyin.",
  },
];

const listVariants = { animate: { transition: { staggerChildren: 0.05 } } };
const itemVariants = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 } };

export default function IntegrationsPage() {
  return (
    <div className="space-y-5" data-testid="integrations-page">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">Entegrasyonlar</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          ARIA'yı kullandığınız servislere bağlayın. Gerçek bağlantılar yakında aktif olacak — şu an ilgi alanlarınızı belirleyebilirsiniz.
        </p>
      </div>

      <motion.div variants={listVariants} initial="initial" animate="animate" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INTEGRATIONS.map((intg) => (
          <motion.div
            key={intg.key}
            variants={itemVariants}
            data-testid="integration-card"
            className="flex flex-col rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--surface-2))]">
                <intg.icon className="h-5 w-5 text-[hsl(var(--accent-copper))]" />
              </div>
              <Badge variant="secondary" className="gap-1 border-0 text-[11px]">
                <Clock className="h-3 w-3" /> Yakında
              </Badge>
            </div>
            <h3 className="font-heading mt-3 text-base font-bold">{intg.name}</h3>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{intg.description}</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="mt-4">
                    <Button variant="outline" className="w-full" disabled data-testid="integration-connect-button">
                      Bağlan
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Bu entegrasyon yakında kullanıma açılacak.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        ))}
      </motion.div>

      <div className="rounded-xl border border-dashed bg-[hsl(var(--surface-1))] p-4 text-sm text-muted-foreground">
        Entegrasyonlar aktif olduğunda burada gerçek bağlantı durumlarını göreceksiniz. ARIA hiçbir zaman bağlı olmayan bir servisi "bağlı" gibi göstermez.
      </div>
    </div>
  );
}
