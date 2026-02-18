
# Three Visual Fixes: Background Color, Card Glow Style, Logo Size

## What You're Describing (from the reference screenshot)

1. **Background**: Deeper navy blue — not near-black. The colors `#070b13` and `#030508` are going too dark/black. The target is a rich deep navy like `#0a1628` staying more blue throughout.

2. **Feature card inner glow**: The reference cards have a **royal/indigo blue** base with a **bright lighter-blue radial glow at the top-center** of each card. This is not the current teal/cyan — it's more of a cobalt/royal blue (`#1e3a8a` range) with a white-blue inner bloom. The `pp-card` and `pp-icon` need to adopt this style.

3. **Logo**: The `overflow-hidden` crop container is showing as a visible box because the background inside it doesn't match the page background. Since the logo PNG has the slogan embedded, the cleanest fix is to remove the crop box entirely and make the logo larger — the "Train Your Brain" headline below it provides the same message context so the repetition is less of an issue at a larger size, OR we accept that the logo will include the tagline and just size it properly without a visible container.

---

## Changes

### 1. `src/index.css` — Shift body background to true deep navy

Current gradient goes `#0b1220 → #070b13 → #030508` (near-black at the bottom). Replace with a richer navy that stays blue:

```css
body {
  background:
    radial-gradient(900px 600px at 50% -10%, rgba(34,211,238,0.14), transparent 60%),
    radial-gradient(700px 500px at 10% 30%, rgba(45,212,191,0.10), transparent 55%),
    radial-gradient(800px 600px at 85% 70%, rgba(244,63,94,0.07), transparent 60%),
    linear-gradient(180deg, #0f1f3d 0%, #0a1628 50%, #071020 100%);
}
```

The key change: `#0f1f3d` (deep navy) → `#0a1628` (dark navy) → `#071020` (very dark navy-blue). This keeps the blue character visible instead of going to near-black.

### 2. `src/styles/preppit.css` — Sync `pp-page-bg` and `app-bg` to the same navy

Both `.pp-page-bg` and `.app-bg` need the same gradient update to match the body:

```css
/* same gradient as body */
linear-gradient(180deg, #0f1f3d 0%, #0a1628 50%, #071020 100%)
```

### 3. `src/styles/preppit.css` — Restyle `pp-card` with royal blue inner glow

The reference screenshot shows feature cards with:
- A deep royal/navy blue base (darker than the background)
- A **bright blue-white radial glow at the top-center** of each card
- A subtle blue border

Update `.pp-card` (and the FeatureCard's card style):

```css
.pp-card {
  background: linear-gradient(180deg, rgba(30, 58, 138, 0.45), rgba(15, 31, 61, 0.65));
  border: 1px solid rgba(96, 165, 250, 0.20);
  border-radius: 1.25rem;
  box-shadow: 0 18px 60px rgba(0,0,0,0.50);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  position: relative;
  overflow: hidden;
}

/* The radial glow at top-center of each card */
.pp-card::before {
  content: "";
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  height: 100px;
  background: radial-gradient(ellipse at 50% 0%, rgba(147, 197, 253, 0.35), transparent 65%);
  pointer-events: none;
}
```

The `::before` pseudo-element creates the bright center-top blue bloom visible in the reference image.

### 4. `src/styles/preppit.css` — Update `pp-stat-card` to match

Stat cards at the top (129+ Skills, etc.) should use the same royal blue treatment:

```css
.pp-stat-card {
  background: linear-gradient(180deg, rgba(30, 58, 138, 0.40), rgba(15, 31, 61, 0.60));
  border: 1px solid rgba(96, 165, 250, 0.18);
  border-radius: 1rem;
  backdrop-filter: blur(16px);
  position: relative;
  overflow: hidden;
}
```

### 5. `src/pages/LandingPage.tsx` — Remove the crop box, make logo bigger and natural

Remove the `overflow-hidden` div wrapper entirely. Show the full logo at a natural size. The crop box creates a visible rectangle because its background doesn't blend with the page:

```tsx
{/* Remove this wrapper entirely */}
<div className="overflow-hidden" style={{ height: '72px' }}>  ← DELETE

{/* Replace with simple larger img */}
<img
  src={preppitLogo}
  alt="Preppit Pacing"
  className="h-20 w-auto"   {/* or h-24 — larger and natural */}
/>
```

If the logo tagline shows ("Train Your Brain"), we can either remove the h1 headline below it to avoid repetition, or keep it since the logo branding reinforces the headline. The box artifact is worse than the tagline repetition.

---

## Files Modified

| File | Change |
|------|--------|
| `src/index.css` | Body background gradient → true deep navy blues |
| `src/styles/preppit.css` | `pp-page-bg`, `app-bg` → same navy gradient; `pp-card` → royal blue + top center glow; `pp-stat-card` → royal blue |
| `src/pages/LandingPage.tsx` | Remove overflow-hidden crop box, restore natural logo img |
