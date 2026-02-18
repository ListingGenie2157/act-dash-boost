
# Fix: Two-Column Feature Grid on Mobile + Logo Without Slogan

## Root Cause: Grid Breakpoint Too Wide for Mobile

The `.pp-feature-grid` CSS currently starts at **1 column** and only goes to 2 columns at `min-width: 640px`. An iPhone (375–430px) is below that, so it stays single-column all day.

The reference screenshot shows 2 compact cards side-by-side on a ~390px phone screen. The fix: make **2 columns the default** with no breakpoint, and bump up to 3 columns only on desktop (1024px+).

## Root Cause: Logo Repeats the Slogan

The logo image file (`preppit-logo.png`) contains the "P" icon + "Preppit Pacing" wordmark + "Train Your Brain. Crush the ACT." tagline underneath. Since only one logo file exists, we'll use CSS `object-fit` + `object-position` + fixed height to crop only the icon+name portion, cutting the tagline off the bottom.

---

## Changes

### 1. `src/styles/preppit.css` — Fix the grid

Change `.pp-feature-grid` from:
```css
.pp-feature-grid {
  display: grid;
  grid-template-columns: 1fr;   /* ← mobile: 1 col */
  gap: 14px;
}
@media (min-width: 640px) {
  .pp-feature-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .pp-feature-grid { grid-template-columns: repeat(3, 1fr); }
}
```

To:
```css
.pp-feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);   /* ← 2 cols always, including mobile */
  gap: 12px;
}
@media (min-width: 1024px) {
  .pp-feature-grid { grid-template-columns: repeat(3, 1fr); }
}
```

This is the only CSS change needed for the grid — removes the single-column default entirely.

### 2. `src/pages/LandingPage.tsx` — Crop the logo

Change the logo `<img>` from a simple sized image to a cropped container that hides the slogan portion:

```tsx
{/* Before */}
<img src={preppitLogo} alt="Preppit Pacing" className="h-24 w-auto" />

{/* After — clipped container hides the bottom tagline */}
<div className="overflow-hidden" style={{ height: '72px' }}>
  <img
    src={preppitLogo}
    alt="Preppit Pacing"
    className="w-auto"
    style={{ height: '90px', marginTop: '-4px', objectFit: 'cover', objectPosition: 'top' }}
  />
</div>
```

The `overflow: hidden` container acts as a crop window — showing the P icon and "Preppit Pacing" wordmark while the slogan at the bottom is clipped off. The exact pixel values may need a small tweak depending on how the logo is laid out internally, but this approach is the standard CSS crop technique.

---

## Files Modified

- `src/styles/preppit.css` — 3-line grid fix (remove 1fr default, keep only 2-col default + 3-col desktop breakpoint)
- `src/pages/LandingPage.tsx` — wrap logo in a crop container to hide the slogan

No new files, no new dependencies.
