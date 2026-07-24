# ARIA Nova — Yeni Nesil Arayüz (frontend-nova)

Mevcut `frontend/` (CRA + warm-neutral tasarım) yerine geçecek yeni nesil koyu aurora temalı arayüz.
React + TypeScript + Vite + Tailwind + Framer Motion + Lucide ile yazıldı.

## İçerik
- `src/components/` — AuroraBackground (canlı aurora arka plan), Orb (nefes alan AI küresi), Sidebar (cam navigasyon + mobil alt bar), Topbar
- `src/pages/` — Dashboard, Chat (token-token streaming simülasyonu + aksiyon kartları), Tasks (3 kolonlu kanban), CalendarPage (haftalık grid + şimdi çizgisi), Crm (ilişki sıcaklığı ölçerleri), Memory (onaylı hafıza anahtarları), Integrations
- `src/data/mock.ts` — tüm mock veri (backend bağlanana kadar)

## Çalıştırma
```bash
npm i react react-dom framer-motion lucide-react react-router
npm i -D vite @vitejs/plugin-react typescript tailwindcss@3 postcss autoprefixer
```
`@/` alias'ı `src/` klasörüne işaret etmeli (vite.config + tsconfig paths).

## Backend entegrasyonu
`src/data/mock.ts` yerine mevcut FastAPI endpoint'lerine (`/api/dashboard`, `/api/chat/stream` SSE, `/api/tasks`...) bağlanacak — sayfa bileşenleri aynı kalır, sadece veri kaynağı değişir.

_Tasarım: Kimi ile üretildi — koyu aurora, cam paneller, conic glow, yaşayan AI küresi._