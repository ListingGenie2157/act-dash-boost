
# Address "Missing Link" Production Checks

## Executive Summary

This plan addresses all four categories of production readiness checks you identified. Here's the complete assessment and implementation plan:

---

## 1. Money & Access Check (Critical)

### 1.1 Webhook Resilience

**Current State:**
- `stripe-webhook/index.ts` handles: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.payment_failed`
- `SubscriptionSuccess.tsx` only calls `refetch()` once on mount
- **No fallback polling** if webhook is delayed or fails

**Risk:** If Stripe webhook fails (network issue, edge function timeout), student pays but sees "not subscribed"

**Fix: Add Polling Fallback on Success Page**

| File | Change |
|------|--------|
| `src/pages/SubscriptionSuccess.tsx` | Add polling loop that checks subscription status every 3 seconds for up to 30 seconds |

```text
Flow:
1. Student completes Stripe payment → redirected to /subscription-success
2. Page immediately calls refetch()
3. If not subscribed after 2 seconds, start polling every 3 seconds
4. After 30 seconds (10 attempts), show manual retry button
5. Display "Activating..." state during polling
```

### 1.2 Subscription Expiry During Test

**Current State:** GOOD
- `RequireSubscription.tsx` uses `useSubscription()` which has `staleTime: 60 * 1000` (1 minute)
- Check happens at component mount, not during active session
- Simulations store `started_at` timestamp server-side; even if subscription lapses, in-progress session continues
- **No mid-session kicks** - only checked when navigating to new pages

**Verdict:** This is correctly implemented.

---

## 2. Real World Environment Check

### 2.1 Environment Variables

**Current State:**
- No `.env.example` file exists
- Required secrets identified from codebase:
  - `STRIPE_SECRET_KEY` (Edge functions - exists)
  - `SUPABASE_SERVICE_ROLE_KEY` (Edge functions - auto-provided)
  - `SUPABASE_URL` (Edge functions - auto-provided)
  - `SUPABASE_ANON_KEY` (Edge functions - auto-provided)
  - `CRON_SECRET` (Edge functions - exists)
  - `LOVABLE_API_KEY` (Internal - exists)
  - `SENTRY_DSN` (Not configured - recommended)

**Fix: Create `.env.example`**

| File | Change |
|------|--------|
| `.env.example` | Document all required environment variables |

```env
# Supabase (auto-provided in Lovable Cloud)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Edge Function Secrets (set in Supabase Dashboard)
# STRIPE_SECRET_KEY=sk_live_...
# CRON_SECRET=random-secret-for-cron-auth
# SENTRY_DSN=https://xxx@sentry.io/xxx (optional, for error tracking)
```

### 2.2 Build Optimization

**Current State:** GOOD
- No Redux DevTools in dependencies
- Logger utility gates console output: `if (isDev)` check in `logger.ts`
- No large dev-only libraries shipped
- Previous cleanup removed unused deps

**Verdict:** Production builds are clean.

### 2.3 CORS & Headers

**Current State:** GOOD
- `_shared/cors.ts` has `getAllowedOrigins()` with explicit allowlist:
  - `getpreppit.com`
  - `www.getpreppit.com`
  - Lovable preview/published URLs
  - Localhost for dev
- All edge functions use `getCorsHeaders(req)` which validates origin

**Verdict:** Properly secured against unauthorized domains.

---

## 3. Student Experience Check (UX)

### 3.1 Mobile Responsiveness

**Current State:**
- Uses Tailwind responsive classes throughout
- `use-mobile.tsx` hook exists for mobile detection
- Math rendering uses `font-mono` which may be narrow on mobile
- MathJax/KaTeX not used (simpler text-based math)

**Assessment Needed:** Visual testing on 375px screens recommended

**Recommendation:** Add viewport meta test and review key pages:
- QuestionCard
- Simulation
- DrillPlayer
- DiagnosticTest

### 3.2 Loss of Connection

**Current State:** GOOD
- `offline-queue.ts` uses IndexedDB for local storage
- Queues failed operations and retries on reconnect
- Timer in Simulation uses `started_at` timestamp from server
- Timer continues counting based on elapsed time since start, not client ticks
- Progress saves incrementally via `responses` table

**Verdict:** Properly handles offline scenarios.

### 3.3 404s & Empty States

**Current State:** GOOD
- `NotFound.tsx` exists with friendly message
- Catch-all route `<Route path="*" element={<NotFound />} />` in App.tsx
- `DataStateWrapper.tsx` handles empty states in data components

**Verdict:** Graceful error handling in place.

---

## 4. Compliance & Legal Check

### 4.1 Terms & Privacy Links

**Current State:**
- `Onboarding.tsx` has checkboxes for:
  - "I agree to the Terms of Service"
  - "I agree to the Privacy Policy"
- BUT: No actual links to view these documents!
- No Terms or Privacy pages exist
- No footer with legal links

**Fix: Create Legal Pages and Update Links**

| File | Change |
|------|--------|
| `src/pages/Terms.tsx` | Create Terms of Service page |
| `src/pages/Privacy.tsx` | Create Privacy Policy page |
| `src/App.tsx` | Add routes for `/terms` and `/privacy` |
| `src/pages/Onboarding.tsx` | Make checkbox labels clickable links |
| `src/pages/LandingPage.tsx` | Add footer with legal links |
| `src/components/AppSidebar.tsx` | Add legal links to footer section |

### 4.2 Cookie Consent Banner

**Current State:**
- No cookie consent banner
- No analytics tracking code visible (no GA, no Mixpanel)
- Sentry integration exists but not configured with DSN

**Assessment:**
- If no third-party tracking cookies → banner not strictly required
- If Sentry is enabled → may need consent for EU users
- Supabase auth uses session storage, not tracking cookies

**Recommendation:** Create a lightweight cookie banner component for GDPR compliance if any analytics are added later.

| File | Change |
|------|--------|
| `src/components/CookieConsent.tsx` | Create consent banner |
| `src/App.tsx` | Include banner at app root |
| `localStorage` | Store consent preference |

---

## Implementation Priority

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| **P0** | Webhook polling fallback | 30 min | Prevents "paid but locked out" |
| **P0** | Terms & Privacy pages + links | 1 hour | Legal compliance |
| **P1** | `.env.example` | 10 min | Deployment documentation |
| **P2** | Cookie consent banner | 30 min | GDPR preparation |
| **P3** | Mobile responsiveness audit | 2 hours | UX improvement |

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Terms.tsx` | Terms of Service page |
| `src/pages/Privacy.tsx` | Privacy Policy page |
| `src/components/CookieConsent.tsx` | Cookie consent banner |
| `.env.example` | Environment variable documentation |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/SubscriptionSuccess.tsx` | Add polling fallback for webhook delays |
| `src/pages/Onboarding.tsx` | Add links to Terms/Privacy in checkbox labels |
| `src/pages/LandingPage.tsx` | Add footer section with legal links |
| `src/components/AppSidebar.tsx` | Add legal links in sidebar footer |
| `src/App.tsx` | Add routes for `/terms` and `/privacy` |

---

## Summary Table

| Check | Status | Action |
|-------|--------|--------|
| Webhook Resilience | Needs Fix | Add polling fallback |
| Subscription Expiry | GOOD | No change needed |
| Environment Variables | Needs Fix | Create `.env.example` |
| Build Optimization | GOOD | No change needed |
| CORS & Headers | GOOD | No change needed |
| Mobile Responsiveness | Review | Visual audit recommended |
| Loss of Connection | GOOD | No change needed |
| 404s & Empty States | GOOD | No change needed |
| Terms & Privacy Links | Needs Fix | Create pages + links |
| Cookie Consent | Optional | Add banner for future-proofing |

---

## Technical Details

### Webhook Polling Implementation

```typescript
// In SubscriptionSuccess.tsx
const [attempts, setAttempts] = useState(0);
const maxAttempts = 10;
const pollInterval = 3000;

useEffect(() => {
  if (!isSubscribed && attempts < maxAttempts) {
    const timer = setTimeout(() => {
      refetch();
      setAttempts(prev => prev + 1);
    }, pollInterval);
    return () => clearTimeout(timer);
  }
}, [isSubscribed, attempts, refetch]);
```

### Terms/Privacy Page Structure

```text
/terms → Simple page with:
- Last updated date
- Service description
- User obligations
- Disclaimer
- Contact info

/privacy → Simple page with:
- Data we collect
- How we use it
- Third parties (Stripe, Supabase)
- Student data protection (COPPA note)
- Contact for data requests
```
