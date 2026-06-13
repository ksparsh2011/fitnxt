# fitNXT Design System — MASTER

> Single source of truth for all visual decisions. Every screen, component, and token derives from this file.
> When in conflict, this file wins over any prototype HTML or component-level hardcoding.

---

## 1. Brand Position

**Identity:** "AI-native performance intelligence" — not a sports brand, not a generic gym tracker.

**The two-layer system:**
- **Violet** = the intelligence layer. AI coaching, insights, active nav, recommendations. Calm, precise, forward-thinking.
- **Coral/Ember** = the intensity layer. Active workouts, effort metrics, logged sets, timers. Heat, urgency, action.
- **Gold** = achievement only. PRs, milestones, streaks. Appears once per screen max. Its rarity is its power.

**What we are not:** Nike Training Club (black + lime), Strava (orange on white), Peloton (red), Freeletics (yellow). No fitness app currently holds the violet + ember territory.

---

## 2. Color System

### 2a. Dark Theme (default)

```typescript
// apps/web/src/lib/design-tokens.ts

export const dark = {
  // ── Surfaces ──────────────────────────────────────────────
  bg:       '#06060D',   // OLED root — page background
  surface:  '#0D0D1A',   // primary surface — phone frames, sheets
  surface2: '#141426',   // elevated cards
  surface3: '#1C1C32',   // modals, drawers
  surface4: '#23233C',   // pressed / active state bg

  border:   'rgba(255,255,255,0.055)',  // subtle card outlines
  border2:  'rgba(255,255,255,0.10)',   // interactive / hover borders

  // ── Violet — Intelligence / AI / Coaching ─────────────────
  violet:        '#A78BFA',                    // primary accent — CTAs, active nav, progress
  violetDeep:    '#7C3AED',                    // fills, pressed states, gradient starts
  violetTint:    'rgba(124,58,237,0.12)',       // card backgrounds, pill fills
  violetBorder:  'rgba(167,139,250,0.22)',      // card borders, pill borders
  violetGlow:    'rgba(124,58,237,0.20)',       // box-shadow glow on coach-mode screens

  // ── Coral / Ember — Intensity / Effort / Heat ─────────────
  coral:         '#F97066',                    // primary energy accent
  coralDeep:     '#C4361A',                    // fills, gradient starts, text on tinted bg
  coralTint:     'rgba(249,112,102,0.12)',      // active-state card backgrounds
  coralBorder:   'rgba(249,112,102,0.22)',      // active-state borders
  coralGlow:     'rgba(249,112,102,0.20)',      // box-shadow glow on workout screens

  // ── Gold — Achievement (use once per screen) ──────────────
  gold:          '#FCD34D',
  goldTint:      'rgba(252,211,77,0.10)',
  goldBorder:    'rgba(252,211,77,0.22)',

  // ── Semantic ──────────────────────────────────────────────
  success:       '#4ADE80',                    // goal completed, set logged OK
  successTint:   'rgba(74,222,128,0.10)',
  danger:        '#EF4444',                    // error, skipped, failed
  dangerTint:    'rgba(239,68,68,0.10)',

  // ── Text ──────────────────────────────────────────────────
  text1:   '#EEEEF8',   // primary — headings, values
  text2:   '#76768E',   // secondary — labels, metadata
  text3:   '#36364E',   // tertiary — disabled, placeholders, section labels
} as const;
```

### 2b. Light Theme

```typescript
export const light = {
  // ── Surfaces ──────────────────────────────────────────────
  bg:       '#EEEDF8',   // page background — 3% violet tint prevents clinical white
  surface:  '#FFFFFF',
  surface2: '#F2F1FA',
  surface3: '#E9E7F5',
  surface4: '#DDDAF0',

  border:   'rgba(0,0,0,0.07)',
  border2:  'rgba(0,0,0,0.11)',

  // ── Violet — deepened for white bg contrast ───────────────
  violet:        '#6D28D9',                    // passes 4.5:1 on white
  violetMid:     '#8B5CF6',                    // icons, non-text elements
  violetTint:    'rgba(109,40,217,0.07)',
  violetBorder:  'rgba(109,40,217,0.18)',
  violetGlow:    'rgba(109,40,217,0.12)',

  // ── Coral — deepened for white bg contrast ────────────────
  coral:         '#C4361A',                    // passes 4.5:1 on white
  coralBright:   '#F97066',                    // decorative fills only (large areas)
  coralTint:     'rgba(196,54,26,0.07)',
  coralBorder:   'rgba(196,54,26,0.18)',
  coralGlow:     'rgba(196,54,26,0.10)',

  // ── Gold — deepened for white bg ──────────────────────────
  gold:          '#92400E',                    // amber-brown, readable on white
  goldBright:    '#F59E0B',                    // decorative fills only
  goldTint:      'rgba(146,64,14,0.07)',
  goldBorder:    'rgba(146,64,14,0.18)',

  // ── Semantic ──────────────────────────────────────────────
  success:       '#15803D',
  successTint:   'rgba(21,128,61,0.07)',
  danger:        '#DC2626',
  dangerTint:    'rgba(220,38,38,0.07)',

  // ── Text ──────────────────────────────────────────────────
  text1:   '#16162A',   // near-black with violet undertone
  text2:   '#606080',   // mid gray
  text3:   '#ABABC8',   // light — placeholders, section labels
} as const;
```

### 2c. Semantic color usage rules

| Color | Use for | Never use for |
|-------|---------|---------------|
| `violet` | AI pills, active nav items, coaching cards, progress fills, Coach screen | Workout timers, effort rings, calories burned |
| `coral` / `coralDeep` | Workout CTA card, set progress ring, LOG SET button, session timer, active Train nav | AI insights, coaching messages, passive metrics |
| `gold` | PR badge, streak counter — **once per screen max** | Borders, nav items, progress fills |
| `success` | Completed sets ✓, goals hit, sleep score | Progress toward a goal (use violet instead) |
| `danger` | Errors, skipped sets, network failures | General warnings (use gold/amber instead) |

---

## 3. Typography

### Font stack

```typescript
export const fonts = {
  display: "'Syne', sans-serif",           // headings, screen titles, workout names
  body:    "'DM Sans', sans-serif",        // all UI text, labels, descriptions
  mono:    "'JetBrains Mono', monospace",  // numbers, metrics, timers, set counts, weight/reps
} as const;

// Google Fonts import (add to root layout)
// Syne: 400,500,600,700,800
// DM Sans: 300,400,500
// JetBrains Mono: 400,500
```

**Font role rules:**
- **Syne** — Screen titles, exercise names, greeting, large metric values, marketing copy. Never for body paragraphs.
- **DM Sans** — Everything else: descriptions, labels, nav items, helper text, card body.
- **JetBrains Mono** — All numbers displayed as data: weight (135 lbs), reps, timers, percentages, set counts (4/5), section sub-labels, hex values in design docs.

### Type scale

```typescript
export const text = {
  xs:   { size: '11px', lineHeight: '16px' },  // tags, pill labels, section headings
  sm:   { size: '13px', lineHeight: '20px' },  // secondary text, captions, AI tip body
  base: { size: '15px', lineHeight: '22px' },  // list items, card body
  md:   { size: '16px', lineHeight: '24px' },  // default body — never go below this for paragraphs
  lg:   { size: '18px', lineHeight: '26px' },  // sub-headings
  xl:   { size: '22px', lineHeight: '30px' },  // section headings (e.g. "AI Coach")
  '2xl':{ size: '28px', lineHeight: '34px' },  // screen titles (e.g. "Good morning, Sid")
  '3xl':{ size: '36px', lineHeight: '40px' },  // hero metrics (use Syne + JetBrains Mono)
  '4xl':{ size: '48px', lineHeight: '52px' },  // display / motivational (Syne only)
} as const;

export const weight = {
  light:    300,   // DM Sans body — de-emphasis
  regular:  400,   // DM Sans default
  medium:   500,   // labels, nav items
  semibold: 600,   // sub-headings
  bold:     700,   // headings
  extrabold:800,   // Syne display — screen titles, exercise names
} as const;
```

---

## 4. Spacing

8dp base grid. All spacing values are multiples of 4.

```typescript
export const space = {
  '1':  '4px',
  '2':  '8px',
  '3':  '12px',
  '4':  '16px',
  '5':  '20px',
  '6':  '24px',
  '8':  '32px',
  '10': '40px',
  '12': '48px',
  '16': '64px',
  '20': '80px',
} as const;

// Layout constants
export const layout = {
  screenPaddingX:    '20px',   // horizontal inset for all screen content
  cardGap:           '8px',    // gap between cards in a list
  sectionGap:        '16px',   // gap between sections
  bottomNavHeight:   '72px',   // fixed bottom nav
  statusBarClearance:'44px',   // dynamic island / status bar
  safeAreaBottom:    '20px',   // home indicator clearance
  maxContentWidth:   '390px',  // max phone content width (cap on wider screens)
} as const;
```

---

## 5. Border Radius

```typescript
export const radius = {
  xs:   '6px',    // tiny — badges, small chips
  sm:   '8px',    // small — progress bars, dots
  md:   '12px',   // buttons
  lg:   '14px',   // metric cards, prev-set rows
  xl:   '16px',   // standard cards
  '2xl':'20px',   // hero cards (workout CTA card, meso card)
  '3xl':'28px',   // bottom sheets
  phone:'44px',   // phone frame
  full: '9999px', // pill buttons, tags, nav chips
} as const;
```

---

## 6. Shadows & Glows

```typescript
export const shadow = {
  // Surfaces
  card:  '0 1px 3px rgba(0,0,0,0.06)',          // light mode card lift
  md:    '0 4px 12px rgba(0,0,0,0.08)',
  lg:    '0 12px 32px rgba(0,0,0,0.12)',

  // Dark mode surfaces
  cardDark: '0 2px 8px rgba(0,0,0,0.4)',
  lgDark:   '0 20px 60px rgba(0,0,0,0.6)',

  // Phone frame glows (dark mode only)
  phoneViolet: '0 0 0 8px rgba(255,255,255,0.015), 0 48px 100px rgba(0,0,0,0.7), 0 0 80px rgba(124,58,237,0.20)',
  phoneCoral:  '0 0 0 8px rgba(255,255,255,0.015), 0 48px 100px rgba(0,0,0,0.7), 0 0 80px rgba(249,112,102,0.20)',

  // Phone frame (light mode)
  phoneLightViolet: '0 48px 80px rgba(109,40,217,0.12), 0 8px 32px rgba(0,0,0,0.08)',
  phoneLightCoral:  '0 48px 80px rgba(196,54,26,0.10), 0 8px 32px rgba(0,0,0,0.08)',

  // CTA card shadow (light mode — the ember card needs this)
  ctaCard: '0 8px 32px rgba(196,54,26,0.28), 0 2px 8px rgba(196,54,26,0.15)',

  // Button shadow (light mode)
  btnCoral: '0 4px 16px rgba(196,54,26,0.25)',
} as const;
```

---

## 7. Motion

All animations use `transform` and `opacity` only — never `width`, `height`, `top`, or `left`.

```typescript
export const motion = {
  duration: {
    instant:  '100ms',  // hover/focus ring appearance
    fast:     '150ms',  // press feedback, button states
    base:     '200ms',  // micro-interactions, chip toggles
    slow:     '300ms',  // card entrance, list items
    modal:    '380ms',  // bottom sheets, modals
    long:     '500ms',  // page-level transitions, PR celebration
  },
  easing: {
    out:      'cubic-bezier(0.0, 0.0, 0.2, 1)',      // standard decelerate (entering)
    in:       'cubic-bezier(0.4, 0.0, 1, 1)',         // standard accelerate (exiting)
    spring:   'cubic-bezier(0.34, 1.56, 0.64, 1)',    // bouncy — PR badge, check animation
    smooth:   'cubic-bezier(0.4, 0.0, 0.2, 1)',       // standard symmetric
  },
} as const;

// Framer Motion variants (reusable)
// cardEnter:   { initial: {opacity:0, y:12}, animate: {opacity:1, y:0}, transition: {duration:0.3, ease:[0,0,0.2,1]} }
// fadeIn:      { initial: {opacity:0},       animate: {opacity:1},       transition: {duration:0.2} }
// scalePress:  { whileTap: {scale:0.97},     transition: {duration:0.1} }
// prBadge:     { initial: {scale:0, opacity:0}, animate: {scale:1, opacity:1}, transition: {type:'spring', stiffness:400, damping:20} }
```

**Motion rules:**
- Exit animations run at 60–70% of enter duration (feel snappier)
- Stagger list items by 30ms per item — not all at once
- Always add `prefers-reduced-motion` media query wrapper on non-essential animations
- Framer Motion is already in `package.json` — use it for all animated components

---

## 8. Key Gradient Recipes

These recur enough to name them.

```css
/* Workout CTA card — ember radial (dark mode) */
background:
  radial-gradient(ellipse 70% 60% at 90% 10%, #F97066 0%, rgba(196,54,26,0.8) 45%, transparent 75%),
  linear-gradient(160deg, #1E0B08 0%, #3D150E 50%, #6B1E12 100%);

/* Workout CTA card — ember gradient (light mode) */
background: linear-gradient(140deg, #7A1A0A 0%, #B52E1A 35%, #E8573D 70%, #F97066 100%);
box-shadow: 0 8px 32px rgba(196,54,26,0.28), 0 2px 8px rgba(196,54,26,0.15);

/* AI / Meso card — violet (dark mode) */
background:
  radial-gradient(ellipse 80% 60% at 90% 0%, rgba(167,139,250,0.35) 0%, transparent 60%),
  radial-gradient(ellipse 60% 50% at 0% 100%, rgba(124,58,237,0.25) 0%, transparent 60%),
  #1C1C32;
border: 1px solid rgba(167,139,250,0.22);

/* AI / Meso card — violet (light mode) */
background: linear-gradient(140deg, #EDE9FB 0%, #E2DCFA 50%, #D9D0F5 100%);
border: 1px solid rgba(109,40,217,0.18);

/* Set progress ring — coral (both modes) */
stroke: url(#ringGrad);  /* linear-gradient: coralDeep → coral */

/* Avatar ring */
background: linear-gradient(135deg, violetDeep, coral);
```

---

## 9. Icon System

**Library:** `lucide-react` (web). Consistent stroke-based icons throughout.

```typescript
export const iconSize = {
  xs:  16,   // inline with text, badge icons
  sm:  18,   // secondary actions, list row icons
  md:  20,   // bottom nav, standard buttons
  lg:  24,   // feature icons, card leading icons
  xl:  32,   // section headers, empty states
  '2xl': 48, // onboarding, full-screen empty states
} as const;

// Stroke width: 1.8px for all icons (never mix 1.5 and 2)
// Style: outline for inactive/passive, filled only for active bottom nav item
// Never use emoji as structural icons
```

---

## 10. Component Patterns

### Pill / Badge

```
Violet pill  — AI recovery score, coaching labels
             bg: violetTint | border: violetBorder | text: violet
             radius: full | padding: 5px 12px | font: DM Sans 11px/500

Coral pill   — active session indicator, effort badge
             bg: coralTint | border: coralBorder | text: coral (deepened in light)
             same sizing

Gold pill    — PR badge, streak milestone
             bg: goldTint | border: goldBorder | text: gold (deepened in light)
             same sizing
```

### Cards

```
Standard card:
  bg: surface2 | border: border | radius: xl (16px) | padding: 14px 16px

Hero card (workout CTA, meso insight):
  radius: 2xl (20px) | padding: 18px
  dark:  ember gradient or violet gradient (see §8)
  light: same gradients — keep bold, they pop against white

Metric card (2×2 grid):
  bg: surface2 | border: border | radius: xl
  Top color stripe: 2px, color matches metric semantic (violet/coral/gold/success)
  Value: Syne 20px/700 | Label: DM Sans 10px, text3
```

### Bottom Nav

```
Height: 72px + safe-area-inset-bottom
Items: max 5, always icon + label
Active state:
  — Home, Coach, Progress, Me → violet stroke, violet label
  — Train (active session) → coral stroke, coral label
  (The Train tab shifts to coral only while a session is active)
Inactive: opacity 0.28–0.30
```

### Progress Ring (SVG)

```
Outer radius: 54px (on 130×130 viewBox)
Track stroke: border color, 8px width
Progress stroke: coralDeep → coral gradient, 8px, stroke-linecap: round
Set tick dots: 4px radius circles at evenly-spaced positions
Circumference: 339.3px (2π × 54)
stroke-dashoffset for N% = 339.3 × (1 - N/100)
```

### AI Pulse Dot

```css
/* The pulsing dot inside AI pills */
width: 6px; height: 6px; border-radius: 50%;
background: violet; /* dark */ or violetDeep; /* light */
animation: pulse 2s ease infinite;

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.8); }
}
```

### SetLogger touch targets

Per existing spec in `FRONTEND-COMPONENTS.md`:
- Weight +/– buttons: min 48×48px
- Reps input: number-pad style, not keyboard
- All interactive elements: min 44×44px touch target
- Haptic on set log: `navigator.vibrate(50)`
- PR trigger: haptic `[100, 50, 100]` + confetti + gold PR badge animation

---

## 11. Screen → Accent Mode Mapping

| Screen | Dominant accent | Notes |
|--------|----------------|-------|
| Today (home) | Violet | Workout CTA card uses coral, but violet owns nav + AI pill + metrics |
| Session (active workout) | Coral | Ring, timer, LOG SET button, active Train nav all coral |
| Coach | Violet | Full violet ownership — meso card, recs, nav |
| Progress | Violet | Charts, trend lines use violet. Coral for intensity zones |
| Plan | Violet | Schedule, AI recommendations |
| Profile | Neutral | Violet for edit CTAs only |
| Auth (login/register) | Violet | Onboarding → violet intelligence framing |
| PR Celebration overlay | Gold | The one moment gold dominates — confetti, badge, haptic |

---

## 12. Tailwind CSS Config

If using Tailwind (recommended for this stack), extend `tailwind.config.ts`:

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark theme base
        void:     '#06060D',
        surface:  { DEFAULT: '#0D0D1A', 2: '#141426', 3: '#1C1C32', 4: '#23233C' },

        violet:   { DEFAULT: '#A78BFA', deep: '#7C3AED', light: '#C4B5FD' },
        coral:    { DEFAULT: '#F97066', deep: '#C4361A', ember: '#9A2B1F' },
        gold:     { DEFAULT: '#FCD34D', deep: '#92400E', bright: '#F59E0B' },

        // Light theme overrides (apply via .light class on html)
        'violet-on-light': '#6D28D9',
        'coral-on-light':  '#C4361A',

        success:  { DEFAULT: '#4ADE80', dark: '#15803D' },
        danger:   { DEFAULT: '#EF4444', dark: '#DC2626' },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '28px',
        phone: '44px',
      },
      animation: {
        pulse: 'pulse 2s ease infinite',
      },
    },
  },
} satisfies Config
```

---

## 13. Full Token Export

Drop-in replacement for `apps/web/src/lib/design-tokens.ts`:

```typescript
export const tokens = {
  color: {
    // --- Accent brand colors (theme-aware, use CSS variables in practice) ---
    violet:      { DEFAULT: '#A78BFA', deep: '#7C3AED', onLight: '#6D28D9' },
    coral:       { DEFAULT: '#F97066', deep: '#C4361A', onLight: '#C4361A' },
    gold:        { DEFAULT: '#FCD34D', deep: '#92400E', bright: '#F59E0B' },
    success:     { DEFAULT: '#4ADE80', onLight: '#15803D' },
    danger:      { DEFAULT: '#EF4444', onLight: '#DC2626' },

    // --- Dark theme ---
    dark: {
      bg:       '#06060D',
      surface:  '#0D0D1A',
      surface2: '#141426',
      surface3: '#1C1C32',
      surface4: '#23233C',
      border:   'rgba(255,255,255,0.055)',
      border2:  'rgba(255,255,255,0.10)',
      text1:    '#EEEEF8',
      text2:    '#76768E',
      text3:    '#36364E',
    },

    // --- Light theme ---
    light: {
      bg:       '#EEEDF8',
      surface:  '#FFFFFF',
      surface2: '#F2F1FA',
      surface3: '#E9E7F5',
      surface4: '#DDDAF0',
      border:   'rgba(0,0,0,0.07)',
      border2:  'rgba(0,0,0,0.11)',
      text1:    '#16162A',
      text2:    '#606080',
      text3:    '#ABABC8',
    },
  },

  font: {
    display: "'Syne', sans-serif",
    body:    "'DM Sans', sans-serif",
    mono:    "'JetBrains Mono', monospace",
  },

  text: {
    xs:   { fontSize: '11px', lineHeight: '16px' },
    sm:   { fontSize: '13px', lineHeight: '20px' },
    base: { fontSize: '15px', lineHeight: '22px' },
    md:   { fontSize: '16px', lineHeight: '24px' },
    lg:   { fontSize: '18px', lineHeight: '26px' },
    xl:   { fontSize: '22px', lineHeight: '30px' },
    '2xl':{ fontSize: '28px', lineHeight: '34px' },
    '3xl':{ fontSize: '36px', lineHeight: '40px' },
    '4xl':{ fontSize: '48px', lineHeight: '52px' },
  },

  space: {
    1: '4px', 2: '8px',  3: '12px', 4: '16px',
    5: '20px', 6: '24px', 8: '32px', 10: '40px',
    12: '48px', 16: '64px', 20: '80px',
  },

  radius: {
    xs: '6px',  sm: '8px',   md: '12px',  lg: '14px',
    xl: '16px', '2xl': '20px', '3xl': '28px',
    phone: '44px', full: '9999px',
  },

  motion: {
    duration: { instant:'100ms', fast:'150ms', base:'200ms', slow:'300ms', modal:'380ms', long:'500ms' },
    easing: {
      out:    'cubic-bezier(0.0, 0.0, 0.2, 1)',
      in:     'cubic-bezier(0.4, 0.0, 1, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    },
  },

  icon: { xs: 16, sm: 18, md: 20, lg: 24, xl: 32, '2xl': 48 },

  layout: {
    screenPaddingX:    '20px',
    cardGap:           '8px',
    sectionGap:        '16px',
    bottomNavHeight:   '72px',
    statusBarClearance:'44px',
    safeAreaBottom:    '20px',
    maxContentWidth:   '390px',
  },
} as const;

export type Tokens = typeof tokens;
```

---

## 14. Anti-Patterns

Never do these. If you're about to, re-read §2 first.

- **No hardcoded hex values in components.** Always use design tokens.
- **No emoji as icons.** Use `lucide-react` exclusively.
- **No lime `#C8F34A`** anywhere — this was the old accent and maps visually to Nike Training Club.
- **No pure white `#FFFFFF` backgrounds** in dark mode.
- **No animating `width`, `height`, `top`, `left`** — only `transform` and `opacity`.
- **No coral on the Coach or AI insight screens.** Coral = intensity only. Keep the semantic separation or the two-layer system collapses.
- **No gold used for progress fills or nav items.** Gold is milestone-only.
- **No more than one filled/primary CTA per screen.**
- **Never mix Syne and DM Sans at the same hierarchy level.** Syne = headings. DM Sans = body. No crossover.
- **No body text below 15px** (use `text-base` minimum for readable copy).
- **No touch targets below 44×44px** — gym use case, sweaty fingers, poor lighting.

---

## 15. Mockup Reference Files

These HTML files are the visual source of truth for the "Ignite" direction:

| File | Shows |
|------|-------|
| `fitnxt-ignite-mockup.html` | Dark theme — Home, Active Workout, AI Coach |
| `fitnxt-ignite-light.html` | Light theme — same 3 screens |

When implementing a new screen, open the relevant mockup to cross-reference accent placement, gradient recipes, and component sizing before writing code.

---

## 16. Design System Versioning

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-06-12 | Initial "Ignite" system — replaces generic indigo/white tokens from FRONTEND-COMPONENTS.md |

> Updates to this file require updating the mockup HTML files to match. They should always be in sync.
