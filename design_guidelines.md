{
  "brand": {
    "name": "ARIA",
    "tagline_tr": "Yapay zekâ destekli dijital çalışanınız.",
    "attributes": [
      "premium",
      "hızlı",
      "güven veren",
      "sakin ama güçlü",
      "klavye-odaklı",
      "operasyonel (aksiyon üreten)"
    ],
    "design_north_star": "Chat değil; iş yapan asistan. Her ekranda ‘sonraki en iyi aksiyon’ görünür olmalı."
  },

  "visual_personality": {
    "style_fusion": [
      "Raycast: komut paleti + HUD geri bildirimleri + kısayol görünürlüğü",
      "Superhuman: yüksek sinyal/düşük gürültü, hızlı triage",
      "Arc: yumuşak köşeler, premium ‘chrome’ hissi, akışkan motion",
      "Swiss/Bento: net grid, modüler kartlar, güçlü tipografik hiyerarşi"
    ],
    "do_not_repeat_previous": {
      "avoid": ["mint/green ana palet", "Notion/Linear kopyası minimal", "aşırı düz beyaz sayfalar"],
      "note": "Kullanıcı önceki yeşil/mint minimal tasarımı beğenmedi. Yeni kimlik: warm-neutral + ink navy + copper accent."
    }
  },

  "typography": {
    "google_fonts": {
      "heading": {
        "family": "Space Grotesk",
        "weights": [500, 600, 700]
      },
      "body": {
        "family": "IBM Plex Sans",
        "weights": [400, 500, 600]
      },
      "mono": {
        "family": "IBM Plex Mono",
        "weights": [400, 500]
      }
    },
    "tailwind_usage": {
      "headings": "font-[Space_Grotesk] tracking-[-0.02em]",
      "body": "font-[IBM_Plex_Sans]",
      "mono": "font-[IBM_Plex_Mono]"
    },
    "size_hierarchy": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl",
      "h2": "text-base md:text-lg",
      "body": "text-sm md:text-base",
      "small": "text-xs"
    },
    "turkish_copy_tone": {
      "principles": [
        "Kısa, net, eylem odaklı",
        "Gereksiz İngilizce terimlerden kaçın",
        "Butonlar fiil ile başlasın"
      ],
      "examples": {
        "primary_cta": "Devam et",
        "secondary_cta": "Daha sonra",
        "empty_state": "Henüz veri yok — ARIA ile ilk adımı atın.",
        "success_toast": "Tamamlandı"
      }
    }
  },

  "color_system": {
    "notes": [
      "Ana yüzeyler ASLA transparan olmayacak (kritik).",
      "Gradient sadece dekoratif arka planlarda ve max %20 viewport kuralına uyar.",
      "AI chat/voice için mor yok — bu sistemde mor kullanılmıyor."
    ],
    "palette": {
      "ink": "#1B263B",
      "ink_2": "#0F172A",
      "sand": "#FAFAF8",
      "oat": "#F5F0EB",
      "clay": "#EEE7DF",
      "copper": "#C97532",
      "copper_soft": "#E7D8C6",
      "success": "#1F8A70",
      "warning": "#D97706",
      "danger": "#DC2626",
      "info": "#2563EB"
    },
    "tokens_css_variables": {
      "implementation": "Update /app/frontend/src/index.css :root and .dark tokens to match below. Keep HSL format for shadcn compatibility.",
      "light": {
        "--background": "36 20% 98%",
        "--foreground": "222 47% 11%",
        "--card": "30 33% 96%",
        "--card-foreground": "222 47% 11%",
        "--popover": "36 20% 98%",
        "--popover-foreground": "222 47% 11%",
        "--primary": "222 47% 16%",
        "--primary-foreground": "36 20% 98%",
        "--secondary": "28 28% 92%",
        "--secondary-foreground": "222 47% 16%",
        "--muted": "28 22% 93%",
        "--muted-foreground": "25 10% 35%",
        "--accent": "28 28% 92%",
        "--accent-foreground": "222 47% 16%",
        "--destructive": "0 72% 51%",
        "--destructive-foreground": "36 20% 98%",
        "--border": "28 18% 84%",
        "--input": "28 18% 84%",
        "--ring": "24 65% 49%",
        "--radius": "0.75rem"
      },
      "dark": {
        "--background": "240 6% 6%",
        "--foreground": "36 20% 96%",
        "--card": "30 10% 10%",
        "--card-foreground": "36 20% 96%",
        "--popover": "240 6% 6%",
        "--popover-foreground": "36 20% 96%",
        "--primary": "36 20% 96%",
        "--primary-foreground": "222 47% 16%",
        "--secondary": "30 10% 14%",
        "--secondary-foreground": "36 20% 96%",
        "--muted": "30 10% 14%",
        "--muted-foreground": "25 8% 65%",
        "--accent": "30 10% 14%",
        "--accent-foreground": "36 20% 96%",
        "--destructive": "0 62% 30%",
        "--destructive-foreground": "36 20% 96%",
        "--border": "30 8% 18%",
        "--input": "30 8% 18%",
        "--ring": "24 65% 55%",
        "--radius": "0.75rem"
      }
    },
    "semantic_extensions": {
      "add_to_index_css": {
        "light": {
          "--surface-0": "36 20% 98%",
          "--surface-1": "30 33% 96%",
          "--surface-2": "28 28% 92%",
          "--shadow-color": "24 20% 20%",
          "--brand": "222 47% 16%",
          "--brand-foreground": "36 20% 98%",
          "--accent-copper": "24 65% 49%",
          "--accent-copper-foreground": "36 20% 98%",
          "--focus": "24 65% 49%"
        },
        "dark": {
          "--surface-0": "240 6% 6%",
          "--surface-1": "30 10% 10%",
          "--surface-2": "30 10% 14%",
          "--shadow-color": "24 20% 2%",
          "--brand": "36 20% 96%",
          "--brand-foreground": "222 47% 16%",
          "--accent-copper": "24 65% 55%",
          "--accent-copper-foreground": "222 47% 16%",
          "--focus": "24 65% 55%"
        }
      }
    },
    "gradients": {
      "allowed_background_only": [
        {
          "name": "hero-warm-sheen",
          "css": "radial-gradient(1200px 600px at 20% 0%, rgba(201,117,50,0.18), transparent 55%), radial-gradient(900px 500px at 90% 10%, rgba(27,38,59,0.10), transparent 60%), linear-gradient(180deg, rgba(250,250,248,1) 0%, rgba(245,240,235,1) 100%)",
          "usage": "Login/Onboarding hero header background only (max 20% viewport)."
        },
        {
          "name": "dark-ink-glow",
          "css": "radial-gradient(900px 500px at 15% 0%, rgba(201,117,50,0.14), transparent 55%), radial-gradient(900px 500px at 85% 10%, rgba(37,99,235,0.10), transparent 60%), linear-gradient(180deg, rgba(11,11,12,1) 0%, rgba(21,20,18,1) 100%)",
          "usage": "Dark theme top header strip / auth background only (max 20% viewport)."
        }
      ],
      "texture": {
        "css_noise_overlay": "background-image: url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"160\" height=\"160\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"160\" height=\"160\" filter=\"url(%23n)\" opacity=\"0.08\"/></svg>');",
        "usage": "Only as subtle overlay on page background wrappers (not on cards)."
      }
    }
  },

  "layout_and_grid": {
    "app_shell": {
      "desktop": {
        "grid": "Sidebar (w-64) + Main (flex-1) + Optional right panel (w-[360px])",
        "topbar": "h-14 sticky top-0 with search + quick actions + theme toggle",
        "content_max_width": "max-w-[1400px] mx-auto px-4 lg:px-6"
      },
      "mobile": {
        "pattern": "Topbar + hamburger opens Sheet/Drawer navigation; bottom safe-area padding",
        "no_overflow_rule": "Use overflow-x-hidden on page wrappers; ensure long chips wrap (flex-wrap)."
      }
    },
    "dashboard": {
      "pattern": "Bento grid with F-pattern priority: top-left = North Star (Bugün odak), right = ARIA önerisi, below = görevler + etkinlikler + ilerleme.",
      "grid_classes": "grid grid-cols-1 gap-4 md:grid-cols-12",
      "recommended_spans": {
        "north_star": "md:col-span-7",
        "aria_suggestion": "md:col-span-5",
        "today_tasks": "md:col-span-7",
        "upcoming_events": "md:col-span-5",
        "weekly_progress": "md:col-span-4",
        "crm_snapshot": "md:col-span-8"
      }
    }
  },

  "components": {
    "component_path": {
      "shadcn_primary": "/app/frontend/src/components/ui/",
      "use_these": [
        {"name": "button", "path": "components/ui/button.jsx"},
        {"name": "card", "path": "components/ui/card.jsx"},
        {"name": "input", "path": "components/ui/input.jsx"},
        {"name": "textarea", "path": "components/ui/textarea.jsx"},
        {"name": "badge", "path": "components/ui/badge.jsx"},
        {"name": "tabs", "path": "components/ui/tabs.jsx"},
        {"name": "dialog", "path": "components/ui/dialog.jsx"},
        {"name": "drawer/sheet", "path": "components/ui/sheet.jsx"},
        {"name": "dropdown-menu", "path": "components/ui/dropdown-menu.jsx"},
        {"name": "command", "path": "components/ui/command.jsx"},
        {"name": "calendar", "path": "components/ui/calendar.jsx"},
        {"name": "table", "path": "components/ui/table.jsx"},
        {"name": "scroll-area", "path": "components/ui/scroll-area.jsx"},
        {"name": "separator", "path": "components/ui/separator.jsx"},
        {"name": "tooltip", "path": "components/ui/tooltip.jsx"},
        {"name": "sonner", "path": "components/ui/sonner.jsx"},
        {"name": "skeleton", "path": "components/ui/skeleton.jsx"},
        {"name": "progress", "path": "components/ui/progress.jsx"},
        {"name": "resizable", "path": "components/ui/resizable.jsx"}
      ],
      "advanced_optional": [
        {
          "name": "Framer Motion",
          "usage": "Page transitions, list item entrance, micro-interactions",
          "note": "Already required by problem statement"
        },
        {
          "name": "Recharts",
          "usage": "Weekly progress ring + small trend charts",
          "install": "npm i recharts",
          "components": ["RadialBarChart", "LineChart"]
        },
        {
          "name": "Fuse.js",
          "usage": "Global search fuzzy matching",
          "install": "npm i fuse.js"
        }
      ]
    },

    "buttons": {
      "style": "Professional / Premium (rounded 10–12px, subtle elevation)",
      "variants": {
        "primary": {
          "classes": "bg-[hsl(var(--accent-copper))] text-[hsl(var(--accent-copper-foreground))] hover:brightness-[0.98] active:brightness-[0.96]",
          "focus": "focus-visible:ring-2 focus-visible:ring-[hsl(var(--focus))] focus-visible:ring-offset-2"
        },
        "secondary": {
          "classes": "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--surface-2))]",
          "focus": "focus-visible:ring-2 focus-visible:ring-[hsl(var(--focus))] focus-visible:ring-offset-2"
        },
        "ghost": {
          "classes": "hover:bg-[hsl(var(--accent))]",
          "focus": "focus-visible:ring-2 focus-visible:ring-[hsl(var(--focus))] focus-visible:ring-offset-2"
        }
      },
      "sizes": {
        "sm": "h-8 px-3 text-sm",
        "md": "h-10 px-4 text-sm",
        "lg": "h-11 px-5 text-base"
      },
      "interaction": {
        "hover": "translate-y-[-1px] only on buttons via motion (not CSS transition all)",
        "press": "scale-[0.98]",
        "loading": "inline spinner + disabled"
      }
    },

    "cards_and_surfaces": {
      "rule": "Main surfaces are solid (no transparency).",
      "card_base": "bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] border border-[hsl(var(--border))] rounded-xl shadow-[0_1px_0_rgba(0,0,0,0.04)]",
      "card_hover": "hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:border-[hsl(var(--ring))]",
      "section_headers": "flex items-center justify-between gap-3"
    },

    "navigation": {
      "sidebar": {
        "pattern": "Collapsible left sidebar with grouped sections: Çalışma, Planlama, İlişkiler, Sistem",
        "items_tr": [
          "Panel",
          "Sohbet",
          "Görevler",
          "Takvim",
          "CRM",
          "Hafıza",
          "Entegrasyonlar"
        ],
        "micro": "Active item uses left accent bar (2px) in copper + subtle background tint."
      },
      "topbar": {
        "global_search": "Command component as omnibox; opens with ⌘K / Ctrl+K; shows grouped results with inline shortcuts.",
        "quick_actions": ["Yeni görev", "Yeni etkinlik", "ARIA’ya sor"],
        "testids": {
          "command_open": "global-command-open-button",
          "theme_toggle": "theme-toggle-button",
          "user_menu": "user-menu-button"
        }
      }
    },

    "chat": {
      "layout": "Left thread list (md:w-72) + main chat + optional right action panel (md:w-[360px])",
      "streaming": {
        "pattern": "SSE streaming: show typing indicator + token-by-token reveal; keep scroll anchored unless user scrolls up.",
        "skeleton": "Use Skeleton for assistant bubble while first tokens arrive."
      },
      "message_bubbles": {
        "user": "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] rounded-2xl rounded-br-md",
        "assistant": "bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl rounded-bl-md",
        "meta": "timestamp text-xs text-muted-foreground"
      },
      "action_cards": {
        "pattern": "Inline ‘Aksiyon Kartı’: Görev oluşturuldu / Etkinlik eklendi / Kişi güncellendi",
        "cta": "Buttons: Onayla / Geri al / Düzenle",
        "testid_examples": [
          "chat-action-card-confirm-button",
          "chat-action-card-undo-button"
        ]
      }
    },

    "tasks": {
      "quick_add": "Top input with inline priority + due date popover; Enter adds.",
      "filters": "Tabs for Durum (Yapılacak / Devam / Bitti) + Select for Öncelik + tag chips.",
      "row_pattern": "Checkbox + title + tags + due + priority badge + kebab menu.",
      "priority_badges": {
        "low": "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]",
        "medium": "bg-[rgba(201,117,50,0.12)] text-[hsl(var(--foreground))]",
        "high": "bg-[rgba(217,119,6,0.14)] text-[hsl(var(--foreground))]",
        "urgent": "bg-[rgba(220,38,38,0.14)] text-[hsl(var(--foreground))]"
      }
    },

    "calendar": {
      "must_use": "Use shadcn Calendar component for date picking.",
      "views": "Day/Week/Month via Tabs; month grid uses solid surfaces; drag-drop uses subtle outline + shadow.",
      "event_chip": "Rounded-lg, solid fill (no gradients), left color bar for category.",
      "testids": {
        "view_tabs": "calendar-view-tabs",
        "create_event": "calendar-create-event-button"
      }
    },

    "crm": {
      "layout": "Split view: left list + right detail panel with timeline.",
      "timeline": "Use Card sections with icons (call/email/meeting/note) + timestamp; ARIA summary pinned at top.",
      "testids": {
        "contact_search": "crm-contact-search-input",
        "contact_row": "crm-contact-row",
        "add_interaction": "crm-add-interaction-button"
      }
    },

    "memory": {
      "cards": "Grid of memory cards with category badge + importance meter + active toggle.",
      "importance": "Slider (shadcn) 1–5 with labels: Düşük → Kritik.",
      "testids": {
        "memory-add": "memory-add-button",
        "memory-toggle": "memory-active-toggle"
      }
    },

    "integrations": {
      "pattern": "Service cards with status: Bağlı / Bağlan / Yakında.",
      "coming_soon": "Honest state: disabled button + tooltip ‘Yakında’ + request access link.",
      "testids": {
        "integration-card": "integration-card",
        "integration-connect": "integration-connect-button"
      }
    }
  },

  "motion_and_microinteractions": {
    "principles": [
      "Hız hissi: 150–220ms micro transitions",
      "Sayfa geçişleri: 220–320ms",
      "Easing: cubic-bezier(0.2, 0.8, 0.2, 1)",
      "Reduced motion: prefers-reduced-motion ile animasyonları azalt"
    ],
    "framer_motion_scaffolds_js": {
      "page_transition": "const pageVariants = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 8 } };",
      "list_stagger": "const list = { animate: { transition: { staggerChildren: 0.04 } } }; const item = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 } };",
      "button_press": "whileTap={{ scale: 0.98 }} whileHover={{ y: -1 }}"
    },
    "hud_feedback": {
      "pattern": "Raycast-style HUD confirmations via Sonner: short, non-blocking, auto-dismiss 1.5–2.5s.",
      "copy_tr": ["Kopyalandı", "Görev oluşturuldu", "Etkinlik eklendi", "Hafıza güncellendi"]
    }
  },

  "accessibility": {
    "requirements": [
      "WCAG AA contrast (özellikle dark mode)",
      "Visible focus ring (ring token)",
      "Keyboard navigation: ⌘K komut paleti, Esc geri",
      "ARIA labels for icon-only buttons",
      "Touch targets min 44px"
    ],
    "testing": {
      "data_testid_rule": "All interactive and key informational elements MUST include data-testid (kebab-case).",
      "examples": [
        "login-form-submit-button",
        "onboarding-next-button",
        "dashboard-today-tasks-card",
        "task-quick-add-input",
        "global-search-input"
      ]
    }
  },

  "image_urls": {
    "auth_hero": [
      {
        "url": "https://images.pexels.com/photos/7677863/pexels-photo-7677863.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "usage": "Login/Onboarding left hero panel image (desktop only), apply subtle dark overlay in dark theme.",
        "alt_tr": "Modern ofiste çalışan profesyonel"
      }
    ],
    "workspace_alt": [
      {
        "url": "https://images.pexels.com/photos/18495294/pexels-photo-18495294.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "usage": "Integrations empty state / premium background image in marketing-like panels.",
        "alt_tr": "Minimalist çalışma alanı"
      }
    ],
    "soft_texture": [
      {
        "url": "https://images.pexels.com/photos/7629261/pexels-photo-7629261.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "usage": "Optional blurred texture for auth background (behind solid surfaces).",
        "alt_tr": "Yumuşak dokulu arka plan"
      },
      {
        "url": "https://images.pexels.com/photos/12008049/pexels-photo-12008049.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "usage": "Optional blurred texture for onboarding step header background (max 20% viewport).",
        "alt_tr": "Pastel soyut arka plan"
      }
    ],
    "avatars_testimonials": [
      {
        "url": "https://images.pexels.com/photos/26728094/pexels-photo-26728094.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "usage": "Demo avatar for CRM contact detail header.",
        "alt_tr": "Profesyonel portre"
      },
      {
        "url": "https://images.pexels.com/photos/31880922/pexels-photo-31880922.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "usage": "Demo avatar for CRM contact list.",
        "alt_tr": "Kurumsal portre"
      }
    ]
  },

  "instructions_to_main_agent": {
    "critical": [
      "Create/overwrite ONLY /app/design_guidelines.md with this JSON + append the General UI UX Design Guidelines block at the end (as-is).",
      "Project uses .js/.jsx (NOT .tsx). Provide examples accordingly.",
      "Do not keep App.css default CRA styles; remove centered header patterns.",
      "Update index.css tokens to the new warm-neutral + ink + copper system; ensure both light and dark are tuned.",
      "No transparent main surfaces; cards/panels must be solid.",
      "All interactive + key info elements must include data-testid (kebab-case)."
    ],
    "implementation_notes": [
      "Use Command component for global search + quick actions (⌘K).",
      "Use Sonner for HUD confirmations; keep copy Turkish and short.",
      "Use Resizable panels for Chat/CRM split views on desktop.",
      "Use ScrollArea for long lists (threads, tasks, contacts).",
      "Use Skeleton for streaming chat and dashboard loading."
    ]
  }
}

<General UI UX Design Guidelines>  
    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms
    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text
   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json

 **GRADIENT RESTRICTION RULE**
NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc
NEVER use dark gradients for logo, testimonial, footer etc
NEVER let gradients cover more than 20% of the viewport.
NEVER apply gradients to text-heavy content or reading areas.
NEVER use gradients on small UI elements (<100px width).
NEVER stack multiple gradient layers in the same viewport.

**ENFORCEMENT RULE:**
    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors

**How and where to use:**
   • Section backgrounds (not content backgrounds)
   • Hero section header content. Eg: dark to light to dark color
   • Decorative overlays and accent elements only
   • Hero section with 2-3 mild color
   • Gradients creation can be done for any angle say horizontal, vertical or diagonal

- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**

</Font Guidelines>

- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. 
   
- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.

- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.
   
- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly
    Eg: - if it implies playful/energetic, choose a colorful scheme
           - if it implies monochrome/minimal, choose a black–white/neutral scheme

**Component Reuse:**
	- Prioritize using pre-existing components from src/components/ui when applicable
	- Create new components that match the style and conventions of existing components when needed
	- Examine existing components to understand the project's component patterns before creating new ones

**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component

**Best Practices:**
	- Use Shadcn/UI as the primary component library for consistency and accessibility
	- Import path: ./components/[component-name]

**Export Conventions:**
	- Components MUST use named exports (export const ComponentName = ...)
	- Pages MUST use default exports (export default function PageName() {...})

**Toasts:**
  - Use `sonner` for toasts"
  - Sonner component are located in `/app/src/components/ui/sonner.tsx`

Use 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.
</General UI UX Design Guidelines>
