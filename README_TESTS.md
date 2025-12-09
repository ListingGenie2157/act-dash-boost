# Test Suite Quick Start

## Running Tests Locally

### Unit Tests (Quick)
```bash
npm run test              # Run all unit tests
npm run test:watch        # Watch mode for development
```

### E2E Tests
```bash
npm run test:e2e          # Run E2E tests
npm run test:e2e:ui       # Run with Playwright UI
```

### All Tests
```bash
npm run test:all          # Run lint, typecheck, unit, and E2E tests
./scripts/run-tests.sh --all  # Full suite with performance tests
```

## Test Categories

### ✅ Unit Tests (Always Run)
- **Mastery calculation**: `src/lib/mastery.test.ts`
- **Spaced repetition**: `src/lib/spacedRepetition.test.ts`
- **Scoring logic**: `src/utils/scoring.test.ts`
- **Weak skills selection**: `src/lib/chooseWeakSkills.test.ts`
- **Smoke tests**: `src/tests/smoke.test.tsx`

### 🔐 RLS Tests (Requires Supabase)
- **Row Level Security**: `src/tests/rls.test.ts`
- These tests are automatically skipped if Supabase is not configured
- To run: Set up `.env` with valid Supabase credentials

### 🌐 E2E Tests (Requires Server)
- **Full user flow**: `e2e/full-flow.spec.ts`
- **Edge cases**: `e2e/edge-cases.spec.ts`
- **Performance**: `e2e/performance.spec.ts`
- **Smoke tests**: `e2e/smoke.spec.ts`

## Environment Setup

### For Unit Tests
No setup required! Unit tests run immediately.

### For RLS Tests
Create `.env` with:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### For E2E Tests
1. Start dev server: `npm run dev`
2. Run tests: `npm run test:e2e`

Or use Playwright's built-in server (automatic).

## Test Results

### Current Status
- ✅ Unit tests: 89 passing
- ✅ Mastery logic: 22 tests
- ✅ Spaced repetition: 28 tests
- ✅ Scoring: 30 tests
- ✅ Weak skills: 7 tests
- ⏭️ RLS tests: Skipped (requires Supabase)
- 📝 E2E tests: Ready (run with Playwright)

## Quick Commands

```bash
# Development workflow
npm run test:watch        # Watch mode for TDD

# Pre-commit checks
npm run lint
npm run typecheck
npm run test

# Full validation
./scripts/run-tests.sh --all

# CI/CD simulation
npm run test:all

# Individual E2E suites
npx playwright test full-flow
npx playwright test edge-cases
npx playwright test performance

# Cross-browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Troubleshooting

### "vitest: not found"
```bash
npm install
```

### "Playwright browsers not installed"
```bash
npx playwright install
```

### RLS tests failing
RLS tests require a valid Supabase instance. They're automatically skipped if not configured.

### E2E tests timeout
Increase timeout in `playwright.config.ts` or ensure dev server is running.

## Coverage Goals

| Category | Tests | Status |
|----------|-------|--------|
| Mastery Logic | 22 | ✅ |
| Spaced Rep | 28 | ✅ |
| Scoring | 30 | ✅ |
| Weak Skills | 7 | ✅ |
| Smoke Tests | 2 | ✅ |
| RLS | 20 | ⏭️ |
| E2E Full Flow | 7 | 📝 |
| E2E Edge Cases | 40+ | 📝 |
| Performance | 12 | 📝 |

**Legend**: ✅ Passing | ⏭️ Skipped | 📝 Ready

For detailed documentation, see [TESTING.md](./TESTING.md)
