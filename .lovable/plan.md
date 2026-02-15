
# Minimal Dark Performance System — Strip & Flatten

Remove all remaining visual noise: radial glows, colored card backgrounds, glow halos, gradient task cards, amber/orange fills. Replace with flat dark surfaces + accent stripes.

---

## Design Rules (Enforced)

1. Background: `#0B132B` flat — no page-level gradients or haze
2. Cards: `#111C3A` only — no `radial-glow`, no `bg-primary/10`, no colored fills
3. Teal gradient ONLY on: primary buttons, progress rings, active nav
4. Coral ONLY on: critical alerts, urgency labels, zero-accuracy states
5. Shadows: `0 8px 24px rgba(0,0,0,0.35)` only — no glow halos
6. Card accents: left 4px vertical stripe (teal or coral) instead of colored backgrounds
7. Copy: tighter — two lines max for motivational text

---

## Files & Changes

### 1. `src/index.css`
- Remove `--glow-teal` and `--glow-coral` custom properties
- Change `--shadow-card` to `0 8px 24px rgba(0,0,0,0.35)`
- Remove `--radial-card` gradient
- Remove `.radial-glow` utility class
- Remove `.card-hover:hover` box-shadow (keep translateY only)

### 2. `tailwind.config.ts`
- Remove `glow-teal`, `glow-teal-lg`, `glow-coral` from `boxShadow`
- Remove `radial-card` from `backgroundImage`
- Update `card` shadow to `0 8px 24px rgba(0,0,0,0.35)`

### 3. `src/components/ui/card.tsx`
- Change default shadow to `shadow-card` (the new subtle one)
- Remove any radial glow reference

### 4. `src/components/ui/button-variants.ts`
- `default`: flat teal gradient, NO glow shadow — just `shadow-sm`
- `hero`: same as default, remove `hover:scale-105` and glow
- Remove `shadow-glow-teal` and `shadow-glow-teal-lg` references

### 5. `src/components/CountdownHeader.tsx`
- Remove `radial-glow` class
- Remove `shadow-glow-coral` conditional — use `border-l-4 border-coral` when urgent instead
- Tighten copy:
  - `<= 7`: "Final Week." (line 1) — no "Lock In"
  - `<= 30`: "Stay on pace."
  - `> 30`: "Time is on your side."
  - `=== 0`: "Execute."
  - `< 0`: "Complete."

### 6. `src/components/TestWeekBanner.tsx`
- Today items: `border-l-4 border-coral` instead of `bg-coral/10 shadow-glow-coral`
- Non-today items: flat `bg-card` with `border-white/[0.06]`

### 7. `src/pages/Dashboard.tsx`
- Remove ALL `radial-glow` classes from every Card
- Remove `bg-primary/10` icon backgrounds — use flat `bg-secondary` instead
- Welcome card: plain `bg-card border border-white/[0.06]`
- Diagnostic CTA card: flat dark card, no colored icon wrapper
- Feature cards (Lessons Library, Calculator Lab, etc.): flat `bg-card`, no `radial-glow`
- Quick Access card: flat, no glow

### 8. `src/components/StreakCounter.tsx`
- Remove `radial-glow` and `shadow-glow-teal` classes
- Active streak: `border-l-4 border-primary` instead of glow
- Copy: streak >= 30 stays "Unstoppable." / >= 7 stays "Locked in." / < 7: "Building."

### 9. `src/components/MasteryDashboard.tsx`
- Remove `radial-glow`
- Remove emoji icons (trophy, star, book, seedling) — use plain text or small teal/muted dots
- Mastery tiles: flat `bg-card` with `border-white/[0.06]` — no colored borders like `border-primary/20`, `border-accent/20`, `border-warning/20`
- Keep number colors: primary for mastered, muted for rest

### 10. `src/components/WeakAreasCard.tsx`
- Remove all colored backgrounds from priority items
- Update `getPriorityColor` in `src/lib/weakAreas.ts`:
  - `critical`: `bg-card`, `border-l-4 border-coral`, coral badge, coral text for accuracy
  - `high`: `bg-card`, `border-l-4 border-primary`, teal badge
  - `medium`: `bg-card`, `border-l-4 border-white/10`, muted badge
- Remove `bg-amber-100`, `bg-amber-900/30`, all amber fills
- Summary message box: `bg-card` instead of `bg-muted`

### 11. `src/components/AchievementBadges.tsx`
- Unlocked state: `bg-card border-white/[0.06]` with `border-l-4 border-primary` — remove `bg-gradient-to-br from-primary/5 to-primary/10`
- Locked state: `bg-card border-white/[0.06] opacity-50`
- Remove hover gradient overlay

### 12. `src/components/StudyPlanWidget.tsx`
- Task cards: remove colored gradients (`bg-gradient-to-br ${config.gradient}`) — use flat `bg-card` with left accent stripe per type:
  - LEARN: `border-l-4 border-primary`
  - DRILL: `border-l-4 border-primary`
  - REVIEW: `border-l-4 border-primary`
  - FLASH: `border-l-4 border-primary`
  - SIM: `border-l-4 border-coral`
- Text: foreground (not white)
- Badge: `bg-secondary` text-foreground
- Quick Access cards: remove `hover:scale-105`, `hover:shadow-xl`, `border-2 hover:border-primary` — use flat `bg-card card-hover`
- Remove colored icon backgrounds (`bg-primary/10`, `bg-secondary/10`, `bg-destructive/10`)

### 13. `src/pages/PacingLab.tsx`
- Remove `bg-primary/10 border-primary/20` pill at top — use plain `bg-secondary` with muted text
- "Why Pacing Works" card: remove `radial-glow`, remove `bg-primary/10` icon wrapper

### 14. `src/pages/LandingPage.tsx`
- Remove `radial-glow` from social proof cards
- Stats bar cards: already flat — keep
- Feature pill: `bg-secondary` instead of `bg-primary/10 border-primary/20`
- CTA button: keep gradient but remove glow shadow (handled by button variant change)

### 15. `src/pages/Login.tsx`
- Remove `radial-glow` from all Card instances
- Success icon: keep gradient circle but remove `shadow-glow-teal`

### 16. `src/components/landing/FeatureCard.tsx`
- Remove `radial-glow` class
- Remove bottom gradient bar (`bg-gradient-primary scale-x-0 group-hover:scale-x-100`)
- Keep `hover:border-primary/30` as the only hover effect
- Icon wrapper: `bg-secondary` instead of `bg-primary/10`

---

## What Does NOT Change
- All routing, data fetching, Supabase integrations
- Component structure, props, logic
- Drill/simulation/quiz mechanics
- Edge functions
- Typography system (Inter/Manrope, weights, letter spacing)
- Progress ring SVG gradient in CountdownHeader (teal gradient stays — it's a progress ring)
- Active nav state (teal left border — already correct)
