

# Pacing Lab Restructure: Absorb Timed Drills + Link to Coached Sims

## Goal
Make Pacing Lab the primary hub for all pacing-related practice. Timed Drills become a section within Pacing Lab (not a separate sidebar item). Section Simulation Pacing links to Full Sims in Coach Mode rather than duplicating the sim engine.

---

## What Changes

### 1. Sidebar Navigation
- **Remove** the separate "Timed Drills" sidebar entry (`/drill-runner`)
- **Keep** "Pacing Lab" as the single entry point (`/pacing-lab`)
- Drill History stays in the Progress section (unchanged)

### 2. Pacing Lab Page Redesign
Replace the current placeholder cards with two clear sections:

**Section A: Timed Drills (embedded)**
- Show the subject cards currently on `/drills` (TimedDrills component) directly inside the Pacing Lab page
- Users pick a subject, go to `/drill/{subject}/setup` as before -- the entire drill flow stays the same
- Run Styles (Sprint, Marathon, Pomodoro, Random Mix) remain as drill setup options
- A "View Drill History" button links to `/drill-history`

**Section B: Section Simulation (Coached Mode)**
- A card per ACT section (English, Math, Reading, Science) that links directly to `/simulation` with the coached mode pre-selected
- These link to the existing simulation flow -- no new sim engine needed
- Card descriptions emphasize pacing coaching: chunk timers, two-pass strategy, real-time pace cues
- Full sim content (FA_/FB_/FC_) is used as intended -- this IS full sim practice, just launched from Pacing Lab with coaching on

### 3. Routing Cleanup
- `/pacing-lab` renders the new combined page
- `/drills` and `/drill-runner` redirect to `/pacing-lab` (backward compat)
- All drill sub-routes (`/drill/:subject/setup`, `/drill/:subject/play`, etc.) remain unchanged
- Remove the broken query-param links (`?mode=quick-pace`, `?coached=true&twopass=true`, etc.)

### 4. DrillSetup Back Button
- Update the "Back to Drills" button in DrillSetup to navigate to `/pacing-lab` instead of `/drill-runner`

---

## Files to Change

| File | Change |
|------|--------|
| `src/pages/PacingLab.tsx` | Rewrite: Section A shows subject drill cards (reuse TimedDrills logic), Section B shows coached sim links per section |
| `src/components/AppSidebar.tsx` | Remove "Timed Drills" entry from `studyItems` |
| `src/App.tsx` | Change `/drills` and `/drill-runner` routes to redirect to `/pacing-lab` |
| `src/pages/DrillSetup.tsx` | Change back button from `/drill-runner` to `/pacing-lab` |
| `src/pages/TimedDrills.tsx` | Keep file but it will no longer be routed to directly (or remove if fully inlined into PacingLab) |

---

## What Stays the Same
- All drill mechanics (DrillSetup, DrillPlayer, run styles, question fetching)
- All simulation mechanics (FormPicker, SimulationStartDialog, coached mode)
- Drill History page and routing
- Content pools: DR_* for drills, FA_/FB_/FC_* for sims -- no mixing

