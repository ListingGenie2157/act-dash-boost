

# Preppit Dark Performance Mode Rebrand

Full UI overhaul from soft/pastel design to a dark, competitive performance system. Dark mode only. No light mode.

---

## Phase 1: Design System Foundation

### 1.1 Color Tokens (`src/index.css`)

Replace the entire `:root` and `.dark` blocks with a single set of dark-only tokens mapped to the spec:

| Token | Current | New Value | Hex Reference |
|-------|---------|-----------|---------------|
| `--background` | Light off-white | `225 58% 11%` | #0B132B |
| `--foreground` | Dark text | `40 16% 95%` | #F5F3ED |
| `--card` | White | `224 52% 15%` | #111C3A |
| `--card-foreground` | Dark text | `40 16% 95%` | #F5F3ED |
| `--popover` | White | `224 52% 15%` | #111C3A |
| `--primary` | Mint teal | `170 78% 39%` | #14B8A6 (gradient start) |
| `--primary-glow` | Darker teal | `195 81% 31%` | #0E7490 (gradient end) |
| `--secondary` | Muted navy | `225 44% 18%` | #162447 (elevated surface) |
| `--muted` | Light gray | `224 52% 15%` | Match surface |
| `--muted-foreground` | Gray | `224 15% 55%` | #8892B0 |
| `--accent` | Navy | `226 43% 72%` | #B8C1EC (secondary text color) |
| `--destructive/coral` | Coral | `355 87% 60%` | #F04452 |
| `--border` | Light border | `0 0% 100% / 0.06` | White at 6% opacity |
| `--ring` | Teal | Match primary | |
| `--success` | Green | Keep deep sea green | |
| `--warning` | Amber | `35 85% 48%` | Keep amber |

Remove the `.dark` class block entirely. The `:root` IS the dark theme now.

Add new CSS custom properties:
- `--shadow-card`: `0 10px 30px rgba(0,0,0,0.4)`
- `--gradient-primary-btn`: `linear-gradient(135deg, #14B8A6 0%, #0E7490 100%)`
- `--glow-teal`: `0 0 25px rgba(20,184,166,0.35)`
- `--glow-coral`: `0 0 30px rgba(240,68,82,0.25)`
- `--radial-card`: `radial-gradient(circle at top left, rgba(20,184,166,0.08), transparent 60%)`

### 1.2 Remove Light Mode (`index.html`)

Add `class="dark"` to `<html>` tag to force dark mode, though with the single-token approach it won't matter. Remove `next-themes` usage if it toggles modes.

### 1.3 Tailwind Config (`tailwind.config.ts`)

Add utility extensions:
- `boxShadow`: `card`, `glow-teal`, `glow-coral`
- `backgroundImage`: `gradient-primary`, `radial-card`
- `transitionDuration`: `200`
- `scale`: `press: '0.98'`

### 1.4 Global Styles (`src/index.css`)

Update base layer:
- Font family: `'Inter', 'Manrope', sans-serif`
- Headlines: `font-weight: 700`, `letter-spacing: -0.02em`, `line-height: 1.3`
- Body: `font-weight: 400`

Add new utility classes:
```css
.card-hover {
  transition: transform 200ms ease, box-shadow 200ms ease;
}
.card-hover:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
}
.btn-press:active {
  transform: scale(0.98);
}
.radial-glow {
  background-image: radial-gradient(circle at top left, rgba(20,184,166,0.08), transparent 60%);
}
```

Remove all mint gradient references, pastel backgrounds, `from-primary/5`, `to-accent/5` patterns throughout.

---

## Phase 2: Component Updates

### 2.1 Button Variants (`src/components/ui/button-variants.ts`)

| Variant | Change |
|---------|--------|
| `default` (Primary) | `bg-gradient-to-r from-[#14B8A6] to-[#0E7490] text-white shadow-[0_0_25px_rgba(20,184,166,0.35)] hover:shadow-[0_0_35px_rgba(20,184,166,0.5)] active:scale-[0.98]` |
| `secondary` | `bg-[#111C3A] border border-[#14B8A6]/30 text-[#F5F3ED] hover:bg-[#14B8A6]/10` |
| `destructive` | `bg-[#F04452] text-white` |
| `outline` | `border border-white/10 bg-transparent hover:bg-white/5` |
| `ghost` | `hover:bg-white/5` |
| `hero` | Same as primary with larger glow |
| Remove | `drill`, `quiz` -- simplify to primary/secondary/outline |

### 2.2 Card Component (`src/components/ui/card.tsx`)

Update default classes:
```
rounded-lg border border-white/[0.06] bg-[hsl(var(--card))] text-card-foreground shadow-[0_10px_30px_rgba(0,0,0,0.4)]
```

Add radial glow overlay as a pseudo-element or inline class option.

### 2.3 Progress Component (`src/components/ui/progress.tsx`)

Change indicator to use teal gradient: `bg-gradient-to-r from-[#14B8A6] to-[#0E7490]`

### 2.4 Badge Component

Ensure badges use dark surface colors with teal/coral accents only.

---

## Phase 3: Page-Level Updates

### 3.1 Dashboard (`src/pages/Dashboard.tsx`)

- Remove `bg-gradient-to-br from-background via-primary/5 to-accent/5` -- use flat `bg-background`
- Remove animated pulse background blobs (the floating circles)
- Welcome header: dark surface card with subtle radial glow, no mint gradient
- Cards: dark surface + border-white/6 + card shadow
- Remove all `bg-gradient-to-br from-primary/10` patterns
- Update "Choose Your Path" copy to be direct/commanding
- Update diagnostic CTA copy: remove "Haven't taken the diagnostic yet?" -- replace with "Run Diagnostic. Know Your Baseline."

### 3.2 CountdownHeader (`src/components/CountdownHeader.tsx`)

- "Days Until Test" card: dark surface, large numeric emphasis (text-5xl font-bold)
- Progress ring gradient: `#14B8A6` to `#0E7490`
- When daysLeft <= 7: add coral glow `shadow-[0_0_30px_rgba(240,68,82,0.25)]`
- Replace motivational messages:
  - `<= 7`: "Final Week. Lock In." (not "Final stretch! Give it everything!")
  - `<= 30`: "Stay on pace." (not "Building momentum! Stay focused!")
  - `> 30`: "Time is on your side."
  - `=== 0`: "Test Day. Execute."

### 3.3 TestWeekBanner (`src/components/TestWeekBanner.tsx`)

- Remove mint gradients
- Dark surface cards with coral accent for "Today" items
- Replace any soft language

### 3.4 Landing Page (`src/pages/LandingPage.tsx`)

- Background: solid `#0B132B`, no gradient blobs
- Hero gradient text: teal gradient on headline
- Remove pastel backdrop blurs
- Stats bar: dark surface cards with teal accents
- Feature cards: dark surface, teal icon accents, no pastel gradients
- CTA buttons: teal gradient with glow
- Social proof cards: dark surface
- Copy updates: "The Smart Way to Prep for ACT" stays fine but tone down fluff elsewhere

### 3.5 Login Page (`src/pages/Login.tsx`)

- Background: solid `#0B132B` (remove the animated gradient `from-accent via-primary/80 to-secondary/60`)
- Card: dark surface with border and shadow
- Remove floating blur shapes
- CTA button: teal gradient

### 3.6 Pacing Lab (`src/pages/PacingLab.tsx`)

- Remove mint gradient header text -- use plain foreground with teal accent
- Cards: dark surface, hover lift
- "Why Pacing Matters" section: dark surface card

### 3.7 AppSidebar (`src/components/AppSidebar.tsx`)

- Logo text: remove gradient clip -- use plain foreground or teal
- Active state: teal left border indicator instead of `bg-muted`
- Hover: `bg-white/5`

### 3.8 AppLayout (`src/components/AppLayout.tsx`)

- Header: `bg-[#0B132B]/95 backdrop-blur border-b border-white/[0.06]`

### 3.9 StreakCounter (`src/components/StreakCounter.tsx`)

- Dark surface card
- Streak number: large, teal, font-bold
- Replace emoji-style messages with short tactical ones
- Coral glow when streak is active

### 3.10 MasteryDashboard (`src/components/MasteryDashboard.tsx`)

- Remove colored background tiles (emerald-50, blue-50, yellow-50)
- Use dark surface with subtle teal/coral borders
- Large numeric emphasis for counts

### 3.11 WeakAreasCard (`src/components/WeakAreasCard.tsx`)

- Dark surface items instead of colored backgrounds
- Priority colors: teal for high, coral for critical

### 3.12 StudyPlanWidget (`src/components/StudyPlanWidget.tsx`)

- Task cards: keep gradient approach but shift to darker tones
- Remove `hover:scale-105` -- use `hover:translateY(-3px)` for subtlety

### 3.13 FeatureCard (`src/components/landing/FeatureCard.tsx`)

- Dark surface, teal border on hover, remove pastel gradient overlays

---

## Phase 4: Micro-Interactions (Global)

Add to `src/index.css` utilities:
- `transition-all duration-200 ease-out` as default for interactive elements
- `active:scale-[0.98]` on all buttons
- `hover:-translate-y-1` on all cards
- Progress ring mount animation (CSS keyframe for stroke-dashoffset)

---

## Files to Change

| File | Scope |
|------|-------|
| `index.html` | Add `class="dark"` to html tag |
| `src/index.css` | Complete token overhaul, remove light mode, add utilities |
| `tailwind.config.ts` | Add shadows, gradients, scales |
| `src/components/ui/button-variants.ts` | Restyle all variants |
| `src/components/ui/card.tsx` | Dark surface defaults |
| `src/components/ui/progress.tsx` | Teal gradient indicator |
| `src/components/ui/badge.tsx` | Dark surface variants |
| `src/pages/Dashboard.tsx` | Remove pastels, update copy |
| `src/pages/LandingPage.tsx` | Dark background, remove blobs |
| `src/pages/Login.tsx` | Dark solid background |
| `src/pages/PacingLab.tsx` | Dark cards |
| `src/components/AppSidebar.tsx` | Dark sidebar styling |
| `src/components/AppLayout.tsx` | Dark header |
| `src/components/CountdownHeader.tsx` | Dark card, coral urgency glow, tactical copy |
| `src/components/TestWeekBanner.tsx` | Dark surface, coral accents |
| `src/components/StreakCounter.tsx` | Dark surface, tactical copy |
| `src/components/MasteryDashboard.tsx` | Dark tiles |
| `src/components/WeakAreasCard.tsx` | Dark items |
| `src/components/StudyPlanWidget.tsx` | Darker task cards |
| `src/components/landing/FeatureCard.tsx` | Dark surface |

---

## What Stays the Same

- All routing, data fetching, Supabase integrations
- Component structure and props
- All drill/simulation/quiz mechanics
- Edge functions
- TypeScript types

This is a visual-only change. No logic, no data, no routing modifications.

