export type TaskStatus = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  title: string;
  tag: string;
  tagColor: string;
  time: string;
  status: TaskStatus;
  priority: 'yüksek' | 'orta' | 'düşük';
}

export const tasks: Task[] = [
  { id: '1', title: 'Burak’ı proje sunumu için ara', tag: 'İletişim', tagColor: '#22d3ee', time: '10:30', status: 'doing', priority: 'yüksek' },
  { id: '2', title: 'Q3 bütçe taslağını finansa gönder', tag: 'Finans', tagColor: '#f472b6', time: '12:00', status: 'todo', priority: 'yüksek' },
  { id: '3', title: 'Yeni landing page tasarımını onayla', tag: 'Tasarım', tagColor: '#8b5cf6', time: '14:00', status: 'todo', priority: 'orta' },
  { id: '4', title: 'Spor salonu üyeliğini yenile', tag: 'Kişisel', tagColor: '#34d399', time: '17:30', status: 'todo', priority: 'düşük' },
  { id: '5', title: 'Haftalık rapor özetini hazırla', tag: 'Rapor', tagColor: '#fbbf24', time: '18:00', status: 'done', priority: 'orta' },
  { id: '6', title: 'Annemin doğum günü hediyesini sipariş et', tag: 'Kişisel', tagColor: '#34d399', time: 'Dün', status: 'done', priority: 'yüksek' },
];

export interface CalEvent {
  id: string;
  title: string;
  day: number; // 0-6 (this week)
  start: number; // hour
  duration: number;
  color: string;
  who?: string;
}

export const events: CalEvent[] = [
  { id: 'e1', title: 'Ürün sync', day: 0, start: 10, duration: 1, color: '#22d3ee', who: 'Ekip' },
  { id: 'e2', title: 'Yatırımcı görüşmesi', day: 1, start: 14, duration: 1.5, color: '#8b5cf6', who: 'Mert K.' },
  { id: 'e3', title: 'Tasarım review', day: 2, start: 11, duration: 1, color: '#f472b6', who: 'Selin' },
  { id: 'e4', title: 'Spor', day: 2, start: 18, duration: 1.5, color: '#34d399' },
  { id: 'e5', title: 'Müşteri demo', day: 3, start: 15, duration: 1, color: '#fbbf24', who: 'Nova Ltd.' },
  { id: 'e6', title: 'Derin çalışma', day: 4, start: 9, duration: 3, color: '#818cf8' },
  { id: 'e7', title: 'Aile yemeği', day: 6, start: 19, duration: 2, color: '#fb7185' },
];

export interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  warmth: number; // 0-100 relationship score
  lastTouch: string;
  initials: string;
  hue: number;
}

export const contacts: Contact[] = [
  { id: 'c1', name: 'Burak Yılmaz', role: 'Kurucu Ortak', company: 'Pixelforge', warmth: 92, lastTouch: '2 saat önce', initials: 'BY', hue: 190 },
  { id: 'c2', name: 'Selin Demir', role: 'Lead Designer', company: 'Studio Nova', warmth: 78, lastTouch: 'Dün', initials: 'SD', hue: 280 },
  { id: 'c3', name: 'Mert Kaya', role: 'Angel Yatırımcı', company: 'Kaya Ventures', warmth: 64, lastTouch: '3 gün önce', initials: 'MK', hue: 330 },
  { id: 'c4', name: 'Elif Arslan', role: 'Ürün Müdürü', company: 'Techflow', warmth: 85, lastTouch: '5 saat önce', initials: 'EA', hue: 150 },
  { id: 'c5', name: 'Deniz Koç', role: 'Avukat', company: 'Koç Hukuk', warmth: 41, lastTouch: '2 hafta önce', initials: 'DK', hue: 40 },
  { id: 'c6', name: 'Zeynep Aksoy', role: 'Pazarlama Direktörü', company: 'GrowthLab', warmth: 70, lastTouch: '4 gün önce', initials: 'ZA', hue: 230 },
];

export interface Memory {
  id: string;
  text: string;
  category: string;
  enabled: boolean;
  confidence: number;
}

export const memories: Memory[] = [
  { id: 'm1', text: 'Toplantıları sabah 10’dan önce planlamayı sevmez', category: 'Tercih', enabled: true, confidence: 96 },
  { id: 'm2', text: 'Burak Yılmaz ile haftalık sync yapıyor', category: 'İlişki', enabled: true, confidence: 99 },
  { id: 'm3', text: 'Kahve tercihi: filtre, şekersiz', category: 'Kişisel', enabled: true, confidence: 88 },
  { id: 'm4', text: 'Raporları TL;DR formatında özet halinde istiyor', category: 'Çalışma', enabled: true, confidence: 93 },
  { id: 'm5', text: 'Cuma öğleden sonra derin çalışma bloğu var', category: 'Rutin', enabled: false, confidence: 81 },
  { id: 'm6', text: 'Bütçe konuşmalarında net rakam ister', category: 'Tercih', enabled: true, confidence: 90 },
];

export interface Integration {
  id: string;
  name: string;
  desc: string;
  icon: string;
  connected: boolean;
  accent: string;
}

export const integrations: Integration[] = [
  { id: 'i1', name: 'Gmail', desc: 'E-postaları oku, özetle, taslak yaz', icon: '✉️', connected: true, accent: '#ea4335' },
  { id: 'i2', name: 'Google Takvim', desc: 'Çift yönlü etkinlik senkronu', icon: '📅', connected: true, accent: '#4285f4' },
  { id: 'i3', name: 'Slack', desc: 'Mesajları dinle, aksiyon çıkar', icon: '💬', connected: false, accent: '#611f69' },
  { id: 'i4', name: 'Notion', desc: 'Notları ve veritabanlarını bağla', icon: '📝', connected: false, accent: '#ffffff' },
  { id: 'i5', name: 'Spotify', desc: 'Odak moduna göre müzik', icon: '🎧', connected: true, accent: '#1db954' },
  { id: 'i6', name: 'GitHub', desc: 'PR ve issue takibi', icon: '🐙', connected: false, accent: '#c9d1d9' },
];

export const activity = [
  { id: 'a1', text: '“Yarın Burak’ı ara” → görev oluşturuldu', time: '09:42', kind: 'task' },
  { id: 'a2', text: 'Yatırımcı görüşmesi takvime eklendi', time: '09:15', kind: 'calendar' },
  { id: 'a3', text: 'Gmail: 3 önemli e-posta özetlendi', time: '08:50', kind: 'mail' },
  { id: 'a4', text: 'Selin Demir için takip hatırlatması kuruldu', time: 'Dün', kind: 'crm' },
  { id: 'a5', text: 'Haftalık rapor özeti hazırlandı', time: 'Dün', kind: 'report' },
];

export const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export const quickPrompts = [
  'Yarın 10:00’da Burak’ı aramamı hatırlat',
  'Bugünkü programımı özetle',
  'Selin’e takip e-postası taslağı yaz',
  'Bu hafta kaç toplantım var?',
];
