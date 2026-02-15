

# Add /landing Redirect

A one-line fix: add a route in `App.tsx` that redirects `/landing` to `/` so the landing page loads correctly.

## Change

| File | What |
|------|------|
| `src/App.tsx` | Add `<Route path="/landing" element={<Navigate to="/" replace />} />` in the public routes section |

This uses the existing `Navigate` component already imported in the file.

