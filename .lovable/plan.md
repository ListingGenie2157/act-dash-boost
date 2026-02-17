
# Fix Landing Page: Background "Blocks" and Missing Two-Column Grid

## Problem Summary

The landing page references many `pp-*` CSS classes that were either emptied out or never defined when the design system was migrated to the new `.app-bg` / `.glass-card` naming convention. This causes:

1. **"Blocky" background** -- The page uses `pp-page-bg` which is now an empty stub. Without a proper background class, sections render with mismatched or missing backgrounds.
2. **Single-column features** -- The `pp-feature-grid` class (used on the 9 feature cards) was never defined, so cards stack vertically instead of in a responsive grid.
3. **Invisible/unstyled cards and buttons** -- `pp-card`, `pp-icon`, `pp-badge`, `pp-stat-card`, `pp-btn-primary`, and `pp-btn-ghost` are all empty or missing.

## Plan

### Step 1: Define all missing `pp-*` classes in `src/styles/preppit.css`

Under the "LEGACY COMPAT" section, replace the empty stubs with real definitions that map to the new design tokens:

- **`pp-page-bg`** -- alias to `.app-bg` styles (gradient background, noise, vignette)
- **`pp-card`** -- alias to `.glass-card` styles (translucent glass panel)
- **`pp-feature-grid`** -- a CSS grid: 1 column on mobile, 2 columns on tablet, 3 columns on desktop, with `14-16px` gap
- **`pp-stat-card`** -- glass panel with lighter weight (smaller shadow, thinner border)
- **`pp-icon`** -- alias to `.glass-icon`
- **`pp-badge`** -- small teal pill label (uppercase, tiny text, teal border/background tint)
- **`pp-btn-primary`** -- alias to `.btn-pill.primary` (teal glow CTA)
- **`pp-btn-ghost`** -- alias to `.btn-pill` (glass secondary button)

### Step 2: Update `LandingPage.tsx` wrapper class

Change line 21 from `pp-page-bg` to `app-bg` so the page gets the navy-to-black gradient with teal/coral highlights directly, OR define `pp-page-bg` to match `.app-bg`. The plan uses the CSS alias approach so no JSX changes are needed.

### Step 3: Verify card hover and badge styling

The `FeatureCard` component uses `pp-card`, `pp-icon`, and `pp-badge` -- all three need real styles. The `card-hover` class on stat cards also needs a hover lift definition if not already present.

---

## Technical Details

### New CSS to add in `src/styles/preppit.css` (replacing the empty legacy stubs):

```css
/* pp-page-bg -- same as .app-bg */
.pp-page-bg {
  min-height: 100vh;
  color: hsl(var(--foreground));
  background:
    radial-gradient(900px 600px at 50% -10%, rgba(34,211,238,0.14), transparent 60%),
    radial-gradient(700px 500px at 10% 20%, rgba(45,212,191,0.10), transparent 55%),
    radial-gradient(800px 600px at 85% 65%, rgba(244,63,94,0.07), transparent 60%),
    linear-gradient(180deg, #0b1220 0%, #070b13 40%, #030508 100%);
  background-attachment: fixed;
  position: relative;
}

/* pp-card -- same as .glass-card */
.pp-card {
  background: linear-gradient(180deg, var(--glass), var(--glass2));
  border: 1px solid var(--stroke);
  border-radius: 1.25rem;
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(var(--blur));
  -webkit-backdrop-filter: blur(var(--blur));
  position: relative;
  overflow: hidden;
}

/* pp-feature-grid -- responsive grid for feature cards */
.pp-feature-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}
@media (min-width: 640px) {
  .pp-feature-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .pp-feature-grid { grid-template-columns: repeat(3, 1fr); }
}

/* pp-stat-card */
.pp-stat-card {
  background: linear-gradient(180deg, var(--glass), var(--glass2));
  border: 1px solid var(--stroke);
  border-radius: 1rem;
  backdrop-filter: blur(16px);
}

/* pp-icon -- same as .glass-icon */
.pp-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px; height: 44px;
  border-radius: 14px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
}

/* pp-badge -- teal pill label */
.pp-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent, #22d3ee);
  border: 1px solid rgba(34,211,238,0.25);
  background: rgba(34,211,238,0.08);
}

/* pp-btn-primary */
.pp-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 22px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  color: hsl(var(--foreground));
  border-color: rgba(34,211,238,0.35);
  background: radial-gradient(120% 120% at 50% 0%, rgba(34,211,238,0.22), rgba(255,255,255,0.06));
  box-shadow: 0 16px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,211,238,0.20), 0 0 28px rgba(34,211,238,0.18);
}

/* pp-btn-ghost */
.pp-btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 22px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  color: hsl(var(--foreground));
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.06);
  backdrop-filter: blur(14px);
}

/* card-hover utility */
.card-hover {
  transition: transform 0.2s ease, box-shadow 0.3s ease;
}
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 70px rgba(0,0,0,0.55), 0 0 30px rgba(34,211,238,0.10);
}
```

### Files modified

- `src/styles/preppit.css` -- replace empty legacy stubs with full definitions (single file change)

No JSX changes needed since the landing page already uses the correct class names.
