

# Fix: Drill Launch from Study Plan Shows "Unavailable"

## Root Cause

When you click a DRILL task in the daily study plan, `TaskLauncher` navigates to:
```
/drill/M1.A?n=10&date=...&i=...
```

But the route `/drill/:subject` loads `DrillRunner`, which maps the `:subject` param to a drill form ID using a lookup table that only recognizes values like `Math`, `MA`, `Reading`, `RD`, etc. A skill code like `M1.A` doesn't match anything, so it falls through to "Invalid drill subject" / "Content Coming Soon".

## Fix

Update `TaskLauncher.tsx` to derive the **subject** from the skill code's first character before building the drill URL. The existing `SKILL_PREFIX` mapping in `sectionMapping.ts` already defines: E=English, M=Math, R=Reading, S=Science.

For the DRILL case, the navigation will change from:
```
/drill/M1.A?n=10&...
```
to:
```
/drill/Math?n=10&skill=M1.A&...
```

This way `DrillRunner` gets a valid subject (`Math`), and the skill code is passed as an optional query param for filtering.

## Changes

| File | Change |
|------|--------|
| `src/pages/TaskLauncher.tsx` | Import `SKILL_PREFIX` from `sectionMapping.ts`. In the DRILL case, reverse-lookup the subject from the first character of `code`, then navigate to `/drill/{subject}` with `skill={code}` as a query param. |

## Technical Detail

The skill prefix mapping is:
- `E` -> `English`
- `M` -> `Math`
- `R` -> `Reading`
- `S` -> `Science`

The reverse lookup will find the subject from `code[0]`, then navigate to `/drill/{subject}?n={n}&skill={code}&date=...&i=...`. DrillRunner already supports a `skill` query param for skill-specific filtering.

