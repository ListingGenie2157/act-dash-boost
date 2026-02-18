
# Fix: Remove the Dark Box Around the Logo

## The Root Cause

The `preppit-logo.png` file is a **flat PNG with a dark navy background** — it is not a transparent/PNG-24 file. The background color of the image (`~#0c1829`) is close to but not identical to the page background (`#0b0f1a → #080c15`), which is why the box is visible as a slightly different shade of dark blue.

No amount of cropping or sizing will fix this — the background is part of the image pixels themselves.

## The Fix: CSS `mix-blend-mode: screen`

The `mix-blend-mode: screen` CSS property mathematically blends the image pixels with the pixels underneath. On a dark page:
- The dark background pixels in the logo image (~`#0c1829`) blend to near-invisible (dark + screen = still dark)
- The light pixels (the P icon, "Preppit Pacing" text, teal/coral colors) remain fully visible

This is the standard technique used for logos with dark backgrounds that need to appear on dark pages. It requires zero image editing.

**Alternative: `mix-blend-mode: lighten`** — a slightly more conservative blend that also works for dark-on-dark scenarios and preserves the logo colors more faithfully.

## Change

**File:** `src/pages/LandingPage.tsx` — lines 26-31

Change:
```tsx
<img
  src={preppitLogo}
  alt="Preppit Pacing"
  className="w-auto"
  style={{ height: '120px' }}
/>
```

To:
```tsx
<img
  src={preppitLogo}
  alt="Preppit Pacing"
  className="w-auto"
  style={{ height: '120px', mixBlendMode: 'screen' }}
/>
```

That single CSS property eliminates the visible box by making the dark background of the PNG transparent relative to the page.

## Why This Works

`mix-blend-mode: screen` formula: `result = 1 - (1 - source) * (1 - backdrop)`

For near-black pixels (`~#0c0c0c`):
- `result = 1 - (1 - 0.047) * (1 - 0.043)` ≈ `0.088` → still very dark, effectively invisible

For the white "Preppit Pacing" text pixels (`#ffffff`):
- `result = 1 - (1 - 1.0) * (1 - anything)` = `1.0` → pure white, unchanged

For the teal P icon pixels:
- Teal is light enough that it passes through with full vibrancy

## Files Modified

| File | Change |
|------|--------|
| `src/pages/LandingPage.tsx` | Add `mixBlendMode: 'screen'` to the logo `<img>` style |

One line change. No image editing, no new files.
