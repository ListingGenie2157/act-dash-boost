# Testing Guide

This document outlines the testing strategy for production readiness.

## Quick Start

```bash
# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run E2E tests
npx playwright test

# Run E2E tests with UI
npx playwright test --ui

# Run specific browser E2E tests
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Structure

### Unit Tests (Vitest)

Located in `src/` alongside source files with `.test.ts` extension.

| File | Coverage |
|------|----------|
| `src/utils/scoring.test.ts` | Scoring logic (percent to scaled, composite scores) |
| `src/lib/mastery.test.ts` | Mastery levels, thresholds, colors, labels |
| `src/lib/spacedRepetition.test.ts` | SM-2 algorithm, review scheduling |
| `src/lib/chooseWeakSkills.test.ts` | Weak skill selection algorithm |
| `src/tests/edge-cases.test.ts` | Boundary conditions and edge cases |

### Integration Tests

| File | Coverage |
|------|----------|
| `src/tests/rls.test.ts` | Supabase Row Level Security policies |
| `supabase/functions/*/test.ts` | Edge Function unit tests |
| `scripts/smoke.ts` | Full stack smoke test with real DB |

### E2E Tests (Playwright)

Located in `e2e/` directory.

| File | Coverage |
|------|----------|
| `e2e/smoke.spec.ts` | Basic page load tests |
| `e2e/user-flows.spec.ts` | Complete user journeys and edge cases |

## Test Categories

### 1. Unit Tests (Targeted, Not 100% Coverage)

Focus on critical business logic:

#### Study Plan Generation Logic
- `selectPlaylist()` - Task selection with time cap
- `calculateDaysLeft()` - Days until test calculation
- `chooseWeakSkills()` - Weak area identification

#### Mastery / Spaced Repetition Logic
- `calculateMasteryLevel()` - Level calculation from accuracy
- `calculateNextReview()` - SM-2 algorithm implementation
- `accuracyToGrade()` - Accuracy to review grade mapping

#### Scoring Logic
- `percentToScaledScore()` - Percent to ACT scale (1-36)
- `calculateCompositeScore()` - Section average calculation

### 2. Integration Tests

#### Supabase RLS Tests
Tests verify Row Level Security policies:

- Anonymous users can read public data (questions, skills, forms)
- Anonymous users cannot write to user tables
- Authenticated users can only read/write their own data
- Cross-user data access is blocked

#### Edge Function Tests
Run Deno tests for edge functions:

```bash
cd supabase/functions/generate-study-plan
deno test test.ts
```

### 3. E2E Sanity Checks

#### Complete User Flow
`signup → onboarding → plan → lesson → drill → dashboard`

Verified with no console errors.

#### Edge Cases Tested
| Scenario | Test Coverage |
|----------|---------------|
| No diagnostic yet | Page loads, appropriate UI shown |
| No study plan yet | Plan page handles gracefully |
| Plan completed | Shows completion state |
| User changes test date | Settings accessible |
| User changes target score | Score updates correctly |

### 4. Cross-Browser Testing

Playwright configured for:

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome/Chromium | ✅ | ✅ (Pixel 5) |
| Firefox | ✅ | - |
| Safari/WebKit | ✅ | ✅ (iPhone 12) |

Run all browsers:
```bash
npx playwright test
```

Run specific browser:
```bash
npx playwright test --project="Mobile Safari"
```

### 5. Performance Sanity

#### Lighthouse / Web Vitals Check

Run manually or in CI:

```bash
# Install lighthouse
npm install -g lighthouse

# Run audit
lighthouse http://localhost:5173 --output html --output-path ./lighthouse-report.html
```

#### Key Metrics to Monitor
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **TTI (Time to Interactive)**: < 3.8s

#### Common Performance Issues to Avoid
- ❌ Blocking scripts in `<head>`
- ❌ Unoptimized images
- ❌ Large JavaScript bundles
- ❌ Synchronous third-party scripts
- ❌ Layout shifts from dynamic content

## Running Tests

### Unit Tests
```bash
# All unit tests
npm test

# With coverage
npm test -- --coverage

# Specific file
npm test -- src/lib/mastery.test.ts
```

### E2E Tests
```bash
# All E2E tests (starts dev server automatically)
npx playwright test

# Headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Specific test file
npx playwright test e2e/user-flows.spec.ts
```

### Smoke Test (Full Stack)
Requires `SUPABASE_SERVICE_ROLE_KEY` environment variable:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-key npx ts-node scripts/smoke.ts
```

## CI Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Test Data

### Mock Skills
```typescript
const mockSkills: Skill[] = [
  { id: 'skill1', subject: 'math', cluster: 'algebra', name: 'Linear Equations' },
  { id: 'skill2', subject: 'math', cluster: 'geometry', name: 'Triangles' },
  { id: 'skill3', subject: 'english', cluster: 'grammar', name: 'Punctuation' },
];
```

### Test User Credentials
E2E tests generate unique emails: `e2e-test-{timestamp}@example.com`

## Troubleshooting

### Tests Failing Locally

1. **Ensure dev server is running** for E2E tests
2. **Check environment variables** for integration tests
3. **Clear Playwright cache**: `npx playwright install --force`

### RLS Tests Failing

1. Verify Supabase is running locally or connection to cloud instance
2. Check that test user can be created
3. Verify RLS policies are enabled

### Performance Tests Slow

1. Run in production mode: `npm run build && npm run preview`
2. Check for development-only code paths
3. Verify no active `console.log` in critical paths
