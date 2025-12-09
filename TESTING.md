# Testing Documentation

This document describes the comprehensive testing strategy for the ACT prep application.

## Table of Contents

1. [Overview](#overview)
2. [Unit Tests](#unit-tests)
3. [Integration Tests](#integration-tests)
4. [End-to-End Tests](#end-to-end-tests)
5. [Cross-Browser Testing](#cross-browser-testing)
6. [Performance Testing](#performance-testing)
7. [Running Tests](#running-tests)
8. [CI/CD Integration](#cicd-integration)

## Overview

The testing suite covers:
- **Unit Tests**: Core business logic (mastery, spaced repetition, scoring)
- **Integration Tests**: Database RLS policies, Edge Functions
- **E2E Tests**: Full user flows, edge cases, error handling
- **Cross-Browser**: Chrome, Firefox, Safari, Mobile browsers
- **Performance**: Core Web Vitals, bundle size, load times

## Unit Tests

### Coverage Areas

#### 1. Mastery Calculation (`src/lib/mastery.test.ts`)
Tests the skill mastery level calculation based on accuracy:
- Edge cases (0 attempts, minimum attempts)
- Mastery levels: Beginner (0-59%), Learning (60-74%), Proficient (75-89%), Mastered (90-100%)
- Boundary testing
- Real-world progress patterns

#### 2. Spaced Repetition (`src/lib/spacedRepetition.test.ts`)
Tests the SM-2 algorithm implementation:
- AGAIN grade (complete failure)
- HARD grade (difficult recall)
- GOOD grade (correct with effort)
- EASY grade (perfect recall)
- Ease factor adjustments
- Interval progressions
- Lapse handling

#### 3. Scoring (`src/utils/scoring.test.ts`)
Tests ACT score calculations:
- Percent to scaled score conversion (1-36)
- Composite score calculation
- Boundary values and edge cases
- Real-world score scenarios

#### 4. Study Plan Logic (`src/lib/chooseWeakSkills.test.ts`)
Tests weak skill identification:
- Baseline diagnostic integration
- Progress data analysis
- Cluster prioritization
- Skill selection limits

### Running Unit Tests

```bash
npm run test              # Run all unit tests
npm run test:watch        # Run in watch mode
npm run test -- mastery   # Run specific test file
```

## Integration Tests

### Row Level Security (RLS) Tests (`src/tests/rls.test.ts`)

Tests database security policies:

#### Anonymous User Tests
- Can read public data (forms, questions)
- Cannot write to user-specific tables
- Cannot read private user data

#### Authenticated User Tests
- Can read/write own data (attempts, progress, mastery)
- Can read/update own profile
- Cannot access other users' data
- Can manage own baselines and study plans

#### Data Isolation Tests
- Cross-user data leakage prevention
- Delete/update restrictions
- Privacy enforcement

### Edge Function Tests

Tests located in `supabase/functions/*/test.ts`:

1. **generate-study-plan**: Study plan generation logic
2. **complete-task**: Task completion and mastery updates
3. **finish-diagnostic**: Diagnostic scoring
4. **set-test-date**: Date validation
5. **days-left**: Days calculation

### Running Integration Tests

```bash
npm run test              # Runs RLS tests with unit tests
deno test                 # Run Edge Function tests (requires Deno)
```

## End-to-End Tests

### Full User Flow (`e2e/full-flow.spec.ts`)

Tests complete user journeys:
- Sign up → Onboarding → Dashboard
- Start diagnostic assessment
- View and interact with study plan
- Access lessons and drills
- Navigation between pages
- No console errors

### Edge Cases (`e2e/edge-cases.spec.ts`)

Tests boundary conditions:

#### No Diagnostic
- Appropriate messaging
- Can still access lessons/drills
- Progress page with no data

#### No Study Plan
- Dashboard shows plan creation option
- Empty state handling
- Self-directed learning access

#### Completed Plan
- Completion state display
- Regeneration options

#### User Changes
- Update test date
- Change target score
- Plan reflects new timeline

#### Error Handling
- Network errors
- Invalid routes (404)
- Unauthorized access
- Offline mode

#### Data Persistence
- Progress saved between sessions
- Settings persist after reload

#### Mobile Responsiveness
- Navigation on mobile
- No horizontal scroll
- Touch interactions

### Running E2E Tests

```bash
npx playwright test                    # Run all E2E tests
npx playwright test full-flow         # Run specific test
npx playwright test --ui              # Run with UI
npx playwright test --debug           # Debug mode
npx playwright show-report            # View last report
```

## Cross-Browser Testing

Configured browsers in `playwright.config.ts`:

1. **Desktop**
   - Chrome (Chromium)
   - Firefox
   - Safari (WebKit)

2. **Mobile**
   - Mobile Chrome (Pixel 5)
   - Mobile Safari (iPhone 12)

### Running Cross-Browser Tests

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
npx playwright test --project=mobile-chrome
npx playwright test --project=mobile-safari
```

Or use the helper script:

```bash
./scripts/run-tests.sh --browsers
```

## Performance Testing

### Core Web Vitals (`e2e/performance.spec.ts`)

Tests performance metrics:

#### Load Performance
- Page load time < 3 seconds
- First Contentful Paint (FCP) < 1.8s
- Largest Contentful Paint (LCP) < 2.5s

#### Interactivity
- First Input Delay < 100ms
- Time to Interactive

#### Visual Stability
- Cumulative Layout Shift (CLS) < 0.1

#### Asset Optimization
- Image sizes (< 500KB each)
- JS bundle size (< 1MB total)
- No single JS file > 500KB
- Font loading efficiency

#### Runtime Performance
- No memory leaks
- API response times < 2 seconds
- Minimal third-party scripts

### Manual Lighthouse Testing

```bash
# Run Lighthouse audit
npx lighthouse http://localhost:5173 --view

# Target scores:
# - Performance: > 90
# - Accessibility: > 90
# - Best Practices: > 90
# - SEO: > 90
```

### Running Performance Tests

```bash
npx playwright test e2e/performance.spec.ts
./scripts/run-tests.sh --perf
```

## Running Tests

### Quick Commands

```bash
# Run all unit tests
npm run test

# Run E2E tests
npx playwright test

# Run everything
./scripts/run-tests.sh --all
```

### Test Script Options

```bash
./scripts/run-tests.sh           # Lint, typecheck, unit tests
./scripts/run-tests.sh --e2e     # + E2E tests
./scripts/run-tests.sh --browsers # + Cross-browser tests
./scripts/run-tests.sh --perf    # + Performance tests
./scripts/run-tests.sh --all     # All of the above
```

### Individual Test Commands

```bash
# Linting
npm run lint

# Type checking
npm run typecheck

# Unit tests
npm run test
npm run test:watch

# E2E tests
npx playwright test
npx playwright test --ui
npx playwright test --project=chromium
npx playwright test full-flow.spec.ts

# Performance tests
npx playwright test performance.spec.ts
```

## CI/CD Integration

The test suite is integrated with GitHub Actions (`.github/workflows/test.yml`):

### Workflow Jobs

1. **lint-and-typecheck**
   - ESLint
   - TypeScript type checking

2. **unit-tests**
   - All unit tests
   - Coverage reporting

3. **e2e-tests**
   - Matrix: chromium, firefox, webkit
   - Parallel execution

4. **mobile-tests**
   - Matrix: mobile-chrome, mobile-safari

5. **performance-tests**
   - Core Web Vitals
   - Bundle size checks

### Triggers

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

### Artifacts

- Test results
- Coverage reports
- Playwright reports
- Performance metrics

## Test Coverage Goals

| Area | Target Coverage | Current |
|------|----------------|---------|
| Core Logic (mastery, scoring, etc.) | 90%+ | ✅ |
| RLS Policies | Critical paths | ✅ |
| Edge Functions | Key functions | ✅ |
| E2E User Flows | Main paths | ✅ |
| Edge Cases | Common scenarios | ✅ |
| Cross-Browser | 3+ browsers | ✅ |
| Performance | Core metrics | ✅ |

## Best Practices

1. **Write tests for new features**: Every new feature should include tests
2. **Test edge cases**: Don't just test the happy path
3. **Keep tests isolated**: Tests should not depend on each other
4. **Use descriptive names**: Test names should clearly describe what they test
5. **Mock external dependencies**: Keep unit tests fast and reliable
6. **Test user flows, not implementation**: E2E tests should focus on user behavior
7. **Performance budget**: Set and enforce performance budgets
8. **Accessibility testing**: Include basic accessibility checks

## Troubleshooting

### Common Issues

#### Tests fail in CI but pass locally
- Check Node version matches
- Ensure dependencies are properly locked
- Review CI environment variables

#### E2E tests are flaky
- Increase timeouts for slower environments
- Use `waitForLoadState` instead of fixed timeouts
- Check for race conditions

#### Performance tests fail
- Check if dev server is running
- Verify network conditions
- Review performance budgets

#### RLS tests fail
- Ensure Supabase credentials are set
- Check database migrations are applied
- Verify test user creation

### Getting Help

- Check test output and error messages
- Review test logs in CI artifacts
- Use `--debug` flag for Playwright tests
- Check browser console for E2E failures

## Future Improvements

- [ ] Visual regression testing
- [ ] API contract testing
- [ ] Load testing for peak usage
- [ ] Security penetration testing
- [ ] Mutation testing for code quality
- [ ] Automated accessibility audits
- [ ] Test data factory/fixtures
- [ ] Snapshot testing for UI components
