

## QA-011: Full Simulation End-to-End — Issues Found

### Bug 1: session-finish Never Creates sim_results Row (BLOCKER)
session-finish calculates scores but never INSERTs into sim_results.
**Fix:** Add sim_results INSERT after scoring.

### Bug 2: SimulationResults State Shape Mismatch (BLOCKER)
Simulation.tsx passes snake_case keys but SimulationResults expects camelCase.
**Fix:** Map response before navigating.

### Bug 3: Analytics Section Case Mismatch
Filters by lowercase 'math' but DB stores 'Math'.
**Fix:** Use correct case.

### Bug 4: Analytics Accuracy Scale Bug
accuracy stored as 0-1 but divided by 100.
**Fix:** Remove /100.
