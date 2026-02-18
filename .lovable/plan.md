
# Fix Background to True Midnight Navy

## What the Reference Image Shows

The uploaded logo image has a background color that is a very deep midnight navy — essentially:
- Top: approximately `#0b0f1a` (very dark navy-black with a clear blue tint)
- Bottom: approximately `#06080f` (near-black with a subtle blue undertone)

This is significantly darker and more "cool-black" than the current `#0f1f3d → #0a1628 → #071020` gradient, which still reads as "rich navy" on screen. The target feels like looking at a very dark OLED screen at night with just a hint of deep blue.

## Changes Needed

### `src/index.css` — body background

Update the base linear gradient from:
```css
linear-gradient(180deg, #0f1f3d 0%, #0a1628 50%, #071020 100%)
```
To:
```css
linear-gradient(180deg, #0b0f1a 0%, #080c15 50%, #06080f 100%)
```

Also slightly reduce the teal/cyan radial overlays so they don't fight the darker base — keep them as subtle atmospheric hints rather than visible colored blobs:
- Teal top glow: `rgba(34,211,238,0.10)` (down from 0.14)
- Teal side glow: `rgba(45,212,191,0.07)` (down from 0.10)
- Coral bottom glow: `rgba(244,63,94,0.05)` (down from 0.07)

### `src/styles/preppit.css` — sync `.app-bg` and `.pp-page-bg`

Update both classes to match the body background — same `#0b0f1a → #080c15 → #06080f` gradient with the same reduced overlay intensities. These three backgrounds must match exactly or page transitions will show color seams.

## Files Modified

| File | Change |
|------|--------|
| `src/index.css` | Body gradient → midnight navy (`#0b0f1a → #080c15 → #06080f`), reduced radial overlay opacity |
| `src/styles/preppit.css` | `.app-bg` and `.pp-page-bg` → same midnight navy gradient |

No JSX changes needed. The card royal-blue glow and the feature grid are untouched — those already look correct. This is a pure color depth fix.
