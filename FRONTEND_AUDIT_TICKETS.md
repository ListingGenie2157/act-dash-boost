# Frontend Audit Tickets

---

## BLOCKER

### B-01 · RequireSubscription guard built but never wired — paid routes unprotected

**Severity:** Blocker
**Area:** Route Guards
**Files:** `src/components/RequireSubscription.tsx`, `src/App.tsx`

`RequireSubscription` exists and works (redirects to `/pricing` when `!isSubscribed`), but it is not wrapped around any protected route in `App.tsx`. Every paid feature (lessons, drills, review, analytics, pacing-lab, calculator-lab) is accessible to any authenticated user regardless of subscription status.

**Acceptance Criteria:**
- Wrap subscription-gated routes (`/lesson/*`, `/drill/*`, `/quiz/*`, `/review/*`, `/analytics`, `/calculator-lab`, `/pacing-lab`, `/weak-areas`) with `<RequireSubscription>`.
- Verify free users are redirected to `/pricing`.
- Verify subscribers pass through normally.
- Add a unit test for `RequireSubscription` rendering redirect vs children.

---

### B-02 · Stripe checkout uses `window.open('_blank')` — blocked by iOS Safari popup blocker

**Severity:** Blocker
**Area:** Checkout Flow
**Files:** `src/hooks/useSubscription.ts` (lines 64–66, 76–78)

`createCheckout` and `openCustomerPortal` both call `window.open(url, '_blank')`. iOS Safari blocks popups not triggered synchronously from a user gesture. Because `supabase.functions.invoke` is async, the `window.open` call occurs in a microtask — Safari will block it.

**Acceptance Criteria:**
- Replace `window.open(url, '_blank')` with `window.location.href = url` (same-tab redirect).
- Add a `try/catch` with user-facing toast on failure.
- Manually verify on iOS Safari 17+ that checkout and portal links open.

---

### B-03 · Only app-level ErrorBoundary — single component crash blanks entire app

**Severity:** Blocker
**Area:** Error Boundaries
**Files:** `src/App.tsx`, `src/components/ErrorBoundary.tsx`

The only `<ErrorBoundary>` wraps the entire `<App>`. A crash in any leaf component (e.g., `QuizComponent`, `MasteryDashboard`, `TutorPanel`) takes down the full UI with the generic error card. Users lose all navigation and in-progress state.

**Acceptance Criteria:**
- Add route-level `<ErrorBoundary>` inside `<AppLayout>` wrapping the `<Outlet>`.
- Add feature-level `<ErrorBoundary>` around `TutorPanel`, `QuizComponent`, and `MasteryDashboard`.
- Each boundary shows a scoped error message with "Try again" that does not destroy the sidebar/nav.
- Verify the app-level boundary still catches errors above the router.

---

### B-04 · ReviewMissed "Practice" navigates to `/drill-runner` which redirects — state lost

**Severity:** Blocker
**Area:** Review Flow
**Files:** `src/pages/ReviewMissed.tsx`, `src/App.tsx` (line 149)

ReviewMissed passes `{ mode, stagingIds }` via `navigate('/drill-runner', { state })`. In `App.tsx`, `/drill-runner` is `<Navigate to="/pacing-lab" replace />`. The redirect discards `location.state`, so the drill never receives the missed-question IDs. The "Practice These" button is a no-op that dumps users into the generic pacing lab.

**Acceptance Criteria:**
- Update ReviewMissed to navigate to `/drill/:subject/play` (or whichever route accepts staged question IDs).
- Remove or update the `/drill-runner` redirect if it is still needed elsewhere.
- Verify missed questions load correctly in the drill player after clicking "Practice These".

---

### B-05 · iOS Safari `100vh` bug — `calc(100vh - X)` breaks in passages, tutor, layouts

**Severity:** Blocker
**Area:** iOS Safari / Layout
**Files:** `src/styles/preppit.css`, `src/components/lesson/EnglishPassageLayout.tsx`, `src/components/lesson/PassageLayout.tsx`, `src/components/tutor/TutorPanel.tsx`

Multiple components use `h-[calc(100vh-140px)]` or `max-h-[calc(100vh-300px)]`. On iOS Safari, `100vh` includes the area behind the address bar. When the bar collapses/expands, content overflows or is clipped. `preppit.css` also sets `min-height: 100vh` globally.

**Acceptance Criteria:**
- Replace all `100vh` usages with `100dvh` (dynamic viewport height) with a `100vh` fallback.
- In `preppit.css`, set `min-height: 100dvh` on the root layout.
- Verify passage layouts and tutor panel on iOS Safari 17+ with address bar animation.

---

### B-06 · Dashboard catches fetch errors but shows no error UI — silent data loss

**Severity:** Blocker
**Area:** Loading / Empty States
**Files:** `src/pages/Dashboard.tsx`

`Dashboard` wraps data loading in `try/catch` but only calls `logger.error`. There is no `error` state and no error UI. If the profile, study plan, or mastery fetch fails, the dashboard renders with stale or empty data and the user has no indication anything is wrong.

**Acceptance Criteria:**
- Add an `error` state to Dashboard.
- On fetch failure, render `DataStateWrapper` (or equivalent) with retry button.
- Verify error UI appears when Supabase is unreachable (e.g., mock network failure in test).

---

### B-07 · Form error messages lack `role="alert"` / `aria-live` — invisible to screen readers

**Severity:** Blocker
**Area:** Accessibility
**Files:** `src/pages/Login.tsx` (lines 118–121, 232–236), `src/pages/UpdatePassword.tsx`, `src/pages/Onboarding.tsx`

Error `<div>` elements in Login, UpdatePassword, and Onboarding render visually but have no ARIA live-region attributes. Screen reader users submitting invalid forms receive no feedback.

**Acceptance Criteria:**
- Add `role="alert"` to all form error containers across Login, UpdatePassword, and Onboarding.
- Verify with VoiceOver on macOS/iOS that error text is announced on form submit failure.

---

### B-08 · `/subscription-success` is a public route — unauthenticated visitors can access it

**Severity:** Blocker
**Area:** Route Guards
**Files:** `src/App.tsx` (line 99), `src/pages/SubscriptionSuccess.tsx`

`/subscription-success` sits outside the `<RequireAuth>` wrapper. An unauthenticated user (or bot) hitting this URL triggers `useSubscription` which calls `supabase.functions.invoke('check-subscription')` without a session, generating server errors and showing a confusing polling UI.

**Acceptance Criteria:**
- Move `/subscription-success` inside the `<RequireAuth>` block.
- Verify unauthenticated access redirects to `/login` with `state.from = '/subscription-success'`.
- Verify authenticated post-checkout flow still works end-to-end.

---

## HIGH

### H-01 · Plan, WeakAreas, Analytics, LessonsLibrary swallow fetch errors silently

**Severity:** High
**Area:** Error Handling
**Files:** `src/pages/Plan.tsx`, `src/pages/WeakAreas.tsx`, `src/pages/Analytics.tsx`, `src/pages/LessonsLibrary.tsx`

All four pages catch async errors with `console.error` or `reportError` but never set an error state. Users see an empty page with no explanation and no retry option.

**Acceptance Criteria:**
- Add error state + retry UI to each page (use `DataStateWrapper` or consistent pattern).
- Each page shows a user-facing error message with a "Retry" button on fetch failure.
- Add a smoke test per page verifying error state renders.

---

### H-02 · TaskLauncher returns `null` during async resolution — blank screen flash

**Severity:** High
**Area:** Loading States
**Files:** `src/pages/TaskLauncher.tsx`

`TaskLauncher` performs async lookup to resolve which page to route to. During resolution it returns `null`, producing a blank screen. If the lookup fails, it silently redirects to `/plan` with no error indication.

**Acceptance Criteria:**
- Render `<PageLoadingSpinner />` during async resolution.
- On failure, render error UI with a "Back to Plan" link instead of silent redirect.

---

### H-03 · StudyPlanWidget can fire `generatePlan` + `loadTodaysTasks` in a concurrent loop

**Severity:** High
**Area:** Data Integrity
**Files:** `src/components/StudyPlanWidget.tsx`

When `tasks` is empty, the widget calls `generatePlan`. On completion it calls `loadTodaysTasks`. Both are triggered by effects that depend on `tasks`, creating a potential loop where multiple plans are generated simultaneously.

**Acceptance Criteria:**
- Add a `generating` ref/flag to prevent concurrent plan generation.
- Ensure `loadTodaysTasks` only runs after `generatePlan` resolves.
- Add a unit test verifying single invocation under empty-tasks conditions.

---

### H-04 · `index.html` missing `viewport-fit=cover`; no `env(safe-area-inset-*)` anywhere

**Severity:** High
**Area:** iOS Safari / Layout
**Files:** `index.html` (line 6), `src/styles/preppit.css`, `src/components/AppLayout.tsx`

The viewport meta tag does not include `viewport-fit=cover`. No CSS uses `env(safe-area-inset-*)`. On iPhones with a notch or Dynamic Island, content can render behind system UI or be clipped at the bottom.

**Acceptance Criteria:**
- Update viewport meta to `width=device-width, initial-scale=1.0, viewport-fit=cover`.
- Add `padding-bottom: env(safe-area-inset-bottom)` to the main content area and bottom nav (if any).
- Add `padding-top: env(safe-area-inset-top)` to the top header/sidebar.
- Verify on iPhone 15 Pro (or simulator) that no content is obscured.

---

### H-05 · QuizComponent `setTimeout` in `handleAnswerSelect` not cleared on unmount

**Severity:** High
**Area:** Memory Leak
**Files:** `src/components/lesson/QuizComponent.tsx`

`handleAnswerSelect` sets a `setTimeout` for the post-answer delay. If the user navigates away before the timeout fires, the callback runs on an unmounted component, causing a React state-update warning and potential data corruption.

**Acceptance Criteria:**
- Store the timeout ID in a ref and clear it in a cleanup function (`useEffect` return or component unmount).
- Verify no React warnings appear when navigating away mid-quiz.

---

### H-06 · LessonsLibrary recomputes filtered/grouped data every render; no list virtualization

**Severity:** High
**Area:** Performance / Render Hotspot
**Files:** `src/pages/LessonsLibrary.tsx`

`filteredLessons` and `bySubjectAndCluster` are derived in the render body without `useMemo`. With 100+ lessons, every keystroke in the filter input triggers a full re-derive and re-render of all lesson cards. No virtualization is used.

**Acceptance Criteria:**
- Wrap `filteredLessons` and `bySubjectAndCluster` in `useMemo` with proper deps.
- If the lesson list exceeds 50 items, add `react-window` or equivalent virtualized list.
- Measure and document render time before/after with React DevTools Profiler.

---

### H-07 · Login ignores `location.state.from` — deep-link return after auth is broken

**Severity:** High
**Area:** Route Guards / UX
**Files:** `src/pages/Login.tsx` (lines 72–74), `src/components/RequireAuth.tsx` (line 28)

`RequireAuth` correctly passes `state={{ from: location }}` when redirecting to `/login`. However, `Login.handleAuth` always navigates to `/dashboard` or `/onboarding` and never reads `location.state.from`. Users who hit a deep link while logged out always land on the dashboard instead of their intended page.

**Acceptance Criteria:**
- After successful sign-in, read `location.state?.from?.pathname` and navigate there if present, falling back to `/dashboard` or `/onboarding`.
- Add a test verifying redirect-back after auth with a mocked `from` state.

---

### H-08 · EnhancedLessonViewer `fetchLesson` has no abort/cleanup on unmount

**Severity:** High
**Area:** Memory Leak
**Files:** `src/pages/EnhancedLessonViewer.tsx`

The `useEffect` that calls `fetchLesson` does not use an `AbortController` or a `mounted` flag. If the user navigates away while the Supabase query is in flight, `setLesson` fires on an unmounted component.

**Acceptance Criteria:**
- Add a `mounted` boolean flag (or `AbortController`) to the effect; skip state updates if unmounted.
- Verify no React warnings on rapid lesson navigation.

---

## MEDIUM

### M-01 · `DataStateWrapper` exported but unused — pages re-implement loading/empty/error ad-hoc

**Severity:** Medium
**Area:** Code Quality / Consistency
**Files:** `src/components/DataStateWrapper.tsx`, all page components

`DataStateWrapper` provides a consistent loading/error/empty pattern with retry, but zero pages use it. Each page has its own inconsistent implementation, some missing error or empty states entirely.

**Acceptance Criteria:**
- Refactor at least Dashboard, Plan, WeakAreas, Analytics, LessonsLibrary to use `DataStateWrapper`.
- Ensure `DataStateWrapper` API covers all needed variants (skeleton, spinner, custom empty).
- Remove ad-hoc loading/error boilerplate from refactored pages.

---

### M-02 · No skip-to-content link; no `<main>` landmark; no focus management on route change

**Severity:** Medium
**Area:** Accessibility
**Files:** `src/components/AppLayout.tsx`, `index.html`

There is no skip link for keyboard users, no `<main>` element wrapping the primary content, and no focus reset on route transitions. Keyboard/screen-reader users must tab through the entire sidebar on every navigation.

**Acceptance Criteria:**
- Add a visually-hidden "Skip to main content" link as the first focusable element.
- Wrap the `<Outlet>` in `<main id="main-content">`.
- On route change, move focus to `#main-content` (via `useEffect` + ref).

---

### M-03 · ReviewSpaced answer choice buttons lack `aria-pressed` / `role="radio"`

**Severity:** Medium
**Area:** Accessibility
**Files:** `src/pages/ReviewSpaced.tsx`

Answer choices are rendered as plain `<Button>` elements with no ARIA selection semantics. Screen readers cannot convey which option is selected.

**Acceptance Criteria:**
- Add `role="radiogroup"` to the choices container and `role="radio"` + `aria-checked` to each choice button.
- Or use a `RadioGroup` from the existing UI library.
- Verify with VoiceOver that selection state is announced.

---

### M-04 · Plan page `subjectCounts` + WeeklyCalendar `weekData` not memoized

**Severity:** Medium
**Area:** Performance / Render Hotspot
**Files:** `src/pages/Plan.tsx`, `src/components/WeeklyCalendar.tsx`

`subjectCounts` is computed in the render body of Plan. `weekData` is similarly derived every render in WeeklyCalendar. Both trigger unnecessary child re-renders.

**Acceptance Criteria:**
- Wrap both in `useMemo` with correct dependency arrays.
- Confirm with React DevTools Profiler that re-render count decreases.

---

### M-05 · QuizComponent `shuffledQuestions` depends on async `userId` — can re-shuffle mid-quiz

**Severity:** Medium
**Area:** Data Integrity
**Files:** `src/components/lesson/QuizComponent.tsx`

`shuffledQuestions` is derived from a memo/effect that includes `userId`. Because `userId` resolves asynchronously (returns `null` then a string), the questions array shuffles a second time after the user has already started answering.

**Acceptance Criteria:**
- Compute `shuffledQuestions` only once using a ref or a `useState` initializer that ignores subsequent `userId` changes.
- Add a test verifying question order stability after initial render.

---

### M-06 · QuestionCard RadioGroup missing `aria-label` describing the question

**Severity:** Medium
**Area:** Accessibility
**Files:** `src/components/QuestionCard.tsx`

The `RadioGroup` wrapping answer choices has no `aria-label` or `aria-labelledby` linking it to the question text. Screen readers announce "radio group" with no context.

**Acceptance Criteria:**
- Add `aria-labelledby` pointing to the question text element's `id`, or `aria-label` with a truncated question string.
- Verify with VoiceOver that the group announces the question context.

---

### M-07 · Onboarding `scienceRequired` value comparison may fail on RadioGroup string coercion

**Severity:** Medium
**Area:** Form Validation
**Files:** `src/pages/Onboarding.tsx`

The `onValueChange` callback for `scienceRequired` compares the RadioGroup value as a string. If the value is inadvertently coerced or the RadioGroup returns an unexpected type, the comparison silently fails and `scienceRequired` is never set to `true`.

**Acceptance Criteria:**
- Explicitly type the RadioGroup value and compare with strict equality.
- Add a fallback/default for `scienceRequired`.
- Add a unit test for the onboarding form with science toggled on/off.

---

## iOS SAFARI SMOKE SCRIPTS

### S-01 · iOS Safari smoke script — Auth flow

**Severity:** High
**Area:** iOS Safari / QA
**Device:** iPhone 12+ running iOS 17+ Safari

**Steps:**
1. Open `/login` in Safari. Verify no layout overflow; keyboard does not obscure inputs.
2. Tap "Create Account". Fill form with valid data. Submit. Verify success screen renders fully.
3. Tap "Back to Sign In". Enter credentials. Submit. Verify redirect to `/onboarding` or `/dashboard`.
4. Tap "Forgot your password?" Enter email. Submit. Verify toast appears and form resets.
5. Rotate device landscape → portrait. Verify layout does not break.
6. Lock/unlock phone. Verify session persists (no redirect to login).

**Pass criteria:** All steps complete without blank screens, layout shifts, or clipped content.

---

### S-02 · iOS Safari smoke script — Lesson flow

**Severity:** High
**Area:** iOS Safari / QA
**Device:** iPhone 12+ running iOS 17+ Safari

**Steps:**
1. Navigate to `/lessons`. Verify list renders without horizontal scroll.
2. Tap a lesson card. Verify lesson content loads (YouTube embed plays, rules render).
3. Scroll through the lesson. Verify passage layout (`calc(100vh - X)`) does not clip.
4. Complete the lesson quiz. Verify answer selection works (no double-tap needed).
5. Verify quiz completion card renders. Tap "Back to Lessons".
6. Verify navigation returns to `/lessons` with scroll position intact.

**Pass criteria:** Full lesson → quiz → return flow with no layout breaks or unresponsive taps.

---

### S-03 · iOS Safari smoke script — Review flow

**Severity:** High
**Area:** iOS Safari / QA
**Device:** iPhone 12+ running iOS 17+ Safari

**Steps:**
1. Navigate to `/review/missed`. Verify missed questions load or empty state shows.
2. If questions exist, tap "Practice These". Verify drill loads (not blank pacing lab).
3. Navigate to `/review/spaced`. Verify spaced repetition cards load or "All Done" shows.
4. Tap an answer choice. Verify selection highlights; tap submit.
5. Swipe back (iOS gesture). Verify app does not crash or show white screen.
6. Verify bottom content is not hidden behind the Safari toolbar.

**Pass criteria:** Both review modes functional; no state loss on swipe-back.

---

### S-04 · iOS Safari smoke script — Checkout return

**Severity:** High
**Area:** iOS Safari / QA
**Device:** iPhone 12+ running iOS 17+ Safari

**Steps:**
1. Navigate to `/pricing`. Verify plan cards render without overflow.
2. Tap a plan's checkout button. Verify Stripe Checkout page opens (not blocked by popup blocker).
3. Complete test checkout (use Stripe test card `4242...`).
4. Verify redirect to `/subscription-success`.
5. Verify polling spinner shows, then confetti fires on subscription confirmation.
6. Tap "Go to Dashboard". Verify navigation works.
7. Return to `/pricing`. Verify "Manage Subscription" button appears instead of checkout.

**Pass criteria:** Full checkout → return → confirmation without popup-block or polling failure.

---

### S-05 · iOS Safari smoke script — Dashboard

**Severity:** High
**Area:** iOS Safari / QA
**Device:** iPhone 12+ running iOS 17+ Safari

**Steps:**
1. Navigate to `/dashboard`. Verify skeleton loads, then data populates.
2. Verify sidebar toggle works (hamburger menu on mobile).
3. Scroll the dashboard. Verify all cards (mastery, streak, study plan, weak areas) render.
4. Tap the study plan widget. Verify task navigation works.
5. Rotate device. Verify responsive layout adjusts without overflow.
6. Pull down to trigger iOS overscroll. Verify no unintended page refresh.
7. Verify bottom cards are not obscured by the Safari bottom toolbar.

**Pass criteria:** Dashboard fully functional on iOS Safari with no layout or interaction issues.

---
