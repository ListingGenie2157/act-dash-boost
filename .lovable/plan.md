

# Premium Dark Performance Polish + Remove Question Counts

Three areas: remove question counts from simulations, refine the design system for authority and depth, and tighten typography/spacing/radius across the app.

---

## 1. Remove Question Counts (Simulations)

### `src/components/FormPicker.tsx`
- Line 176: Remove `{form.questionCount} questions` from the button text — show only time limit (e.g., "45 min")
- Line 138-139: Remove `CardDescription` showing "X of Y sections available" — replace with just "Select a section to begin"
- The `questionCount` data still gets passed through to `onFormSelect` (needed for session logic), just not displayed

### `src/components/SimulationStartDialog.tsx`
- Lines 66-73: Remove the "Questions" stat from the 2-column grid — show only "Time Limit" (single column or centered)
- Line 70: Remove `{questionCount} questions` display

### `src/components/StudyPlanWidget.tsx`
- Line 276: Remove `{task.size} questions` line from task cards

### `src/pages/LandingPage.tsx`
- The "466 questions" badge visible in the reference screenshot is from `FeatureCard` badges — currently the code doesn't show question counts in badges (they show "UNIQUE", "NEW", etc.), so this is already clean. No change needed.

---

## 2. Background Depth (Subtle Vertical Variation)

### `src/index.css`
- Change `--background` from flat `225 58% 11%` to the same value (the token stays flat)
- Add a new body pseudo-element or body background gradient for subtle vertical depth:

```css
body {
  background: linear-gradient(
    180deg,
    hsl(225 58% 9%) 0%,
    hsl(225 58% 12%) 40%,
    hsl(225 58% 9%) 100%
  );
}
```

This creates a subtle darkened top/bottom with a slightly lighter mid-section. Very subtle (9% to 12% to 9% lightness).

---

## 3. Reduce Border Radius (Sharper = More Mature)

### `src/index.css`
- Change `--radius: 0.75rem` to `--radius: 0.5rem` (8px instead of 12px — 33% reduction)

### `src/components/ui/badge.tsx`
- Change `rounded-full` to `rounded-md` — less "friendly", more tactical

---

## 4. Typography Authority

### `src/index.css`
- Headlines: tighten letter-spacing from `-0.02em` to `-0.025em`
- Body line-height: keep 1.4

### `src/pages/LandingPage.tsx`
- Hero headline: increase from `text-5xl md:text-7xl` to `text-6xl md:text-8xl` (~15% larger)
- Subtitle: reduce from `text-xl md:text-2xl` to `text-lg md:text-xl`
- Trim copy: "Full-length simulations. Coached practice tests. AI tutoring. Parent rewards." becomes "Full Simulations. AI Coaching. Parent Accountability."
- Section header "More Than a Question Bank": stays but reduce `text-3xl md:text-4xl` to `text-2xl md:text-3xl`
- Remove the subtitle paragraph under it — just the heading

### `src/pages/Dashboard.tsx`
- Welcome heading: keep `text-2xl sm:text-3xl`
- Tighten vertical spacing: reduce `space-y-8` to `space-y-6` in main container
- "Choose Your Path" copy: trim description paragraph

---

## 5. Card Hierarchy (Not All Siblings)

### Feature Cards (`src/components/landing/FeatureCard.tsx`)
- Thin border only: `border border-white/[0.06]` (already correct)
- Remove `hover:border-primary/30` — keep hover subtle: `hover:border-white/10`
- Remove `group-hover:text-primary` on title
- Remove `group-hover:scale-110` on icon

### Social Proof Cards (`src/pages/LandingPage.tsx`)
- Remove border entirely — use slightly lighter surface: `bg-secondary border-0`
- This differentiates testimonials from feature cards

### Dashboard Cards
- Already using `bg-card border border-white/[0.06]` — keep as-is
- These are denser by nature (smaller padding, more data)

---

## 6. Tighter Spacing

### `src/pages/LandingPage.tsx`
- Hero section: reduce `mb-20` to `mb-16`
- Stats bar: reduce `gap-6` to `gap-4`
- Features section: reduce `space-y-12` to `space-y-8`
- Social proof: reduce `mt-20` to `mt-16`
- Footer: reduce `mt-16` to `mt-12`

### `src/pages/Dashboard.tsx`
- Main container: `space-y-8` to `space-y-6`
- Feature card grid: keep `gap-6`

---

## 7. Numbers Larger

### `src/components/landing/AnimatedCounter.tsx`
- Check current size and increase by ~25% (likely needs `text-4xl font-bold` if currently `text-3xl`)

### General
- Numeric metrics throughout should use `text-3xl font-bold` minimum — this is already done in most places (CountdownHeader, MasteryDashboard, etc.)

---

## Files to Change

| File | Changes |
|------|---------|
| `src/index.css` | Body gradient background, reduce `--radius` to `0.5rem`, tighter headline spacing |
| `src/components/ui/badge.tsx` | `rounded-full` to `rounded-md` |
| `src/components/FormPicker.tsx` | Remove question count display from buttons and card descriptions |
| `src/components/SimulationStartDialog.tsx` | Remove question count stat |
| `src/components/StudyPlanWidget.tsx` | Remove `{task.size} questions` line |
| `src/pages/LandingPage.tsx` | Larger hero, tighter copy, card hierarchy, reduced spacing |
| `src/components/landing/FeatureCard.tsx` | Subtler hover, remove scale/color transitions |
| `src/pages/Dashboard.tsx` | Tighter spacing |
| `src/components/landing/AnimatedCounter.tsx` | Larger numbers |

## What Does NOT Change

- Coral color system (confirmed perfect)
- All routing, data, Supabase integrations
- Card shadow values
- Button gradients
- Progress ring styling
- Component structure and props
