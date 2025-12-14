# Production Readiness Audit Report

**Application:** Preppit (ACT Study App)  
**Date:** December 14, 2025  
**Auditor:** Production Readiness Review  

---

## A) Executive Summary

### Can We Ship?

**NO** - There are **3 BLOCKER** issues that must be resolved before launch:

1. **CORS Wildcard in Production Edge Functions** - Most edge functions use `Access-Control-Allow-Origin: '*'` instead of the restricted CORS utility
2. **Rate Limiting Not Applied to Critical Endpoints** - Tutor chat and other expensive endpoints lack rate limiting despite having the infrastructure
3. **No Pagination on Large Data Queries** - Questions, mastery, and review queue queries can return unlimited rows

### Top 10 Launch Blockers

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 1 | CORS wildcard allows requests from any origin | BLOCKER | Security |
| 2 | Missing rate limiting on tutor-chat endpoint | BLOCKER | Cost/Abuse |
| 3 | No pagination on review_queue, mastery, questions queries | BLOCKER | Performance/Crash |
| 4 | Admin check in import-questions uses ANON_KEY, not SERVICE_ROLE | HIGH | Data corruption |
| 5 | Cron job creates duplicate users during plan regeneration | HIGH | Data integrity |
| 6 | Error bank miss_count increment not atomic (race condition) | HIGH | Data accuracy |
| 7 | No offline support/sync for in-progress test data | HIGH | Data loss |
| 8 | Mastery batch updates are sequential, not batched | MED | Performance |
| 9 | Missing input length validation on tutor chat messages | MED | Cost/Abuse |
| 10 | No Sentry DSN configured - errors may not be tracked | MED | Observability |

---

## B) Findings Table

### BLOCKER Issues

#### B-001: CORS Wildcard in Production Edge Functions

| Field | Value |
|-------|-------|
| **ID** | B-001 |
| **Severity** | BLOCKER |
| **Area** | Security |
| **Files** | `supabase/functions/tutor-chat/index.ts:4-6`, `supabase/functions/import-questions/index.ts:5-8`, `supabase/functions/generate-study-plan/index.ts:6-9`, `supabase/functions/submit-response/index.ts:6-8`, `supabase/functions/complete-task/index.ts:7-9` |
| **Reproduction** | All edge functions define `corsHeaders` with `'Access-Control-Allow-Origin': '*'` |
| **Impact** | Any website can make authenticated requests to your edge functions, enabling CSRF attacks and data theft |
| **Fix Plan** | Replace wildcard CORS with the existing `getCorsHeaders(req)` utility from `_shared/cors.ts` |
| **Effort** | S |

**Code Reference:**

```4:6:supabase/functions/tutor-chat/index.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app',
};
```

---

#### B-002: Missing Rate Limiting on Expensive Endpoints

| Field | Value |
|-------|-------|
| **ID** | B-002 |
| **Severity** | BLOCKER |
| **Area** | Security / Cost |
| **Files** | `supabase/functions/tutor-chat/index.ts`, `supabase/functions/generate-study-plan/index.ts` |
| **Reproduction** | Send unlimited requests to tutor-chat endpoint - each incurs AI API costs |
| **Impact** | Cost explosion from AI API abuse, service unavailability from rate exhaustion |
| **Fix Plan** | Import and use `checkRateLimit` from `_shared/rateLimit.ts` before processing requests |
| **Effort** | S |

---

#### B-003: No Pagination on Large Data Queries

| Field | Value |
|-------|-------|
| **ID** | B-003 |
| **Severity** | BLOCKER |
| **Area** | Performance |
| **Files** | `src/pages/ReviewSpaced.tsx:38-92`, `src/pages/ReviewMissed.tsx:31-80`, `supabase/functions/generate-study-plan/index.ts:677-683` |
| **Reproduction** | User with 1000+ missed questions tries to load ReviewMissed page |
| **Impact** | Browser crash, timeout, poor UX, excessive bandwidth |
| **Fix Plan** | Add `.limit(50)` or implement cursor-based pagination with "Load More" |
| **Effort** | M |

---

### HIGH Severity Issues

#### H-001: Import Questions Uses Wrong Supabase Key

| Field | Value |
|-------|-------|
| **ID** | H-001 |
| **Severity** | HIGH |
| **Area** | Security |
| **Files** | `supabase/functions/import-questions/index.ts:129-130` |
| **Reproduction** | Function uses ANON_KEY for admin operations, meaning RLS policies apply and the `is_admin()` check may fail inconsistently |
| **Impact** | Admin operations may fail; potential RLS bypass if anon key has different permissions |
| **Fix Plan** | Use SERVICE_ROLE_KEY for admin-gated operations after verifying user is admin |
| **Effort** | S |

**Code Reference:**

```129:136:supabase/functions/import-questions/index.ts
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    // ...
    const supabase = createClient(supabaseUrl, supabaseKey);
```

---

#### H-002: Cron Job Creates Duplicate Users

| Field | Value |
|-------|-------|
| **ID** | H-002 |
| **Severity** | HIGH |
| **Area** | Data Integrity |
| **Files** | `supabase/functions/cron-daily/index.ts:140-146` |
| **Reproduction** | Cron job attempts to create users with `createUser` instead of impersonating existing users |
| **Impact** | Creates orphan users in auth, potential duplicate records |
| **Fix Plan** | Remove user creation logic; use service role with userId parameter as already implemented in generate-study-plan |
| **Effort** | S |

**Code Reference:**

```140:146:supabase/functions/cron-daily/index.ts
          // Generate a new session for this user
          const { data: sessionData, error: sessionError } = await supabase.auth.admin.createUser({
            email: userData.user.email || `temp-${user.id}@placeholder.com`,
            email_confirm: true,
            user_metadata: userData.user.user_metadata,
          });
```

---

#### H-003: Non-Atomic Error Bank Increment

| Field | Value |
|-------|-------|
| **ID** | H-003 |
| **Severity** | HIGH |
| **Area** | Data |
| **Files** | `supabase/functions/complete-task/index.ts:218-234` |
| **Reproduction** | Two concurrent requests both read miss_count=1, both write miss_count=2 instead of 3 |
| **Impact** | Inaccurate error tracking, wrong spaced repetition scheduling |
| **Fix Plan** | Use database function with `miss_count = miss_count + 1` or upsert with SQL increment |
| **Effort** | S |

**Code Reference:**

```218:229:supabase/functions/complete-task/index.ts
            await supabase
              .from('error_bank')
              .upsert({
                user_id: user.id,
                question_id: incorrectAnswer.question_id,
                miss_count: 1,  // Should be incrementing, not setting to 1
                last_missed_at: new Date().toISOString()
              }, {
                onConflict: 'user_id,question_id',
                ignoreDuplicates: false
              });
```

---

#### H-004: No Offline Support for Test Progress

| Field | Value |
|-------|-------|
| **ID** | H-004 |
| **Severity** | HIGH |
| **Area** | Reliability |
| **Files** | `src/pages/Simulation.tsx`, `src/lib/offline-queue.ts` |
| **Reproduction** | User loses connection during a timed simulation |
| **Impact** | Lost test progress, poor user experience, data loss |
| **Fix Plan** | Implement local storage persistence for in-progress test state; sync on reconnect |
| **Effort** | L |

---

#### H-005: Tutor Chat Message Content Not Length-Limited

| Field | Value |
|-------|-------|
| **ID** | H-005 |
| **Severity** | HIGH |
| **Area** | Security / Cost |
| **Files** | `supabase/functions/tutor-chat/index.ts:162-168` |
| **Reproduction** | Send a 100KB message to tutor endpoint |
| **Impact** | Excessive token consumption, cost inflation |
| **Fix Plan** | Add zod validation with `z.string().max(5000)` for message content |
| **Effort** | S |

---

### MEDIUM Severity Issues

#### M-001: Sequential Mastery Updates

| Field | Value |
|-------|-------|
| **ID** | M-001 |
| **Severity** | MED |
| **Area** | Performance |
| **Files** | `src/lib/mastery.ts:203-210` |
| **Reproduction** | Complete a quiz with 20 questions |
| **Impact** | 20 sequential DB calls instead of batched, slow completion |
| **Fix Plan** | Batch upserts with `Promise.all` or use a single RPC call |
| **Effort** | M |

---

#### M-002: No Sentry DSN Configured

| Field | Value |
|-------|-------|
| **ID** | M-002 |
| **Severity** | MED |
| **Area** | DevOps |
| **Files** | `src/lib/errorReporter.ts:42-55` |
| **Reproduction** | Check if `window.Sentry` is actually initialized in production |
| **Impact** | Errors may not be tracked; blind to production issues |
| **Fix Plan** | Add Sentry initialization in `main.tsx` with DSN from environment |
| **Effort** | S |

---

#### M-003: Questions Accessible Without RLS Filter

| Field | Value |
|-------|-------|
| **ID** | M-003 |
| **Severity** | MED |
| **Area** | Security |
| **Files** | `supabase/migrations/20250911214846_...sql:138-143` |
| **Reproduction** | Any authenticated user can SELECT * FROM questions |
| **Impact** | All test questions accessible, potential cheating |
| **Fix Plan** | Consider if questions should be public or restrict to sessions in progress |
| **Effort** | M |

---

#### M-004: Hardcoded Supabase Credentials

| Field | Value |
|-------|-------|
| **ID** | M-004 |
| **Severity** | MED |
| **Area** | DevOps |
| **Files** | `src/lib/env.ts:11-12` |
| **Reproduction** | Credentials visible in source code |
| **Impact** | While anon key is public, this pattern is problematic for multi-environment setups |
| **Fix Plan** | Use environment variables with fallback for development only |
| **Effort** | S |

---

#### M-005: No DELETE Policy on study_tasks

| Field | Value |
|-------|-------|
| **ID** | M-005 |
| **Severity** | MED |
| **Area** | Security |
| **Files** | `supabase/migrations/20250911214846_...sql:230-240` |
| **Reproduction** | User cannot delete their own cancelled tasks |
| **Impact** | Orphaned data, storage bloat |
| **Fix Plan** | Add RLS policy for DELETE on study_tasks where user_id = auth.uid() |
| **Effort** | S |

---

#### M-006: Missing Loading States in Some Pages

| Field | Value |
|-------|-------|
| **ID** | M-006 |
| **Severity** | MED |
| **Area** | UX |
| **Files** | `src/pages/QuizRunner.tsx`, `src/pages/DrillRunner.tsx` |
| **Reproduction** | Slow network during quiz load shows blank content |
| **Impact** | Confusing UX, user may think app is broken |
| **Fix Plan** | Add skeleton loading states consistent with other pages |
| **Effort** | S |

---

### LOW Severity Issues

#### L-001: Console.warn Used for Non-Warning Logs

| Field | Value |
|-------|-------|
| **ID** | L-001 |
| **Severity** | LOW |
| **Area** | DevOps |
| **Files** | Multiple edge functions |
| **Reproduction** | Check server logs - success messages appear as warnings |
| **Impact** | Log noise, harder to find real issues |
| **Fix Plan** | Use `console.log` for info, `console.warn` for warnings only |
| **Effort** | S |

---

#### L-002: Form Validation Messages Not User-Friendly

| Field | Value |
|-------|-------|
| **ID** | L-002 |
| **Severity** | LOW |
| **Area** | UX |
| **Files** | Various form components |
| **Reproduction** | Submit invalid data, see technical error messages |
| **Impact** | Confusing error messages for users |
| **Fix Plan** | Add user-friendly error messages in zod schemas |
| **Effort** | S |

---

#### L-003: Missing Focus Management in Modals

| Field | Value |
|-------|-------|
| **ID** | L-003 |
| **Severity** | LOW |
| **Area** | Accessibility |
| **Files** | Custom dialog implementations |
| **Reproduction** | Open modal with keyboard, focus not trapped |
| **Impact** | Accessibility issues for keyboard/screen reader users |
| **Fix Plan** | Use Radix Dialog's built-in focus management consistently |
| **Effort** | S |

---

## C) Patch Set

### Patch C-001: Fix CORS in tutor-chat (BLOCKER)

```typescript
// supabase/functions/tutor-chat/index.ts
// REPLACE lines 1-6 with:

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { getCorsHeaders } from '../_shared/cors.ts';

// REPLACE all instances of:
// { headers: corsHeaders }
// WITH:
// { headers: getCorsHeaders(req) }

// And update the OPTIONS handler:
Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  // ... rest of function uses corsHeaders variable
});
```

---

### Patch C-002: Add Rate Limiting to tutor-chat (BLOCKER)

```typescript
// supabase/functions/tutor-chat/index.ts
// ADD after auth verification (around line 143):

import { checkRateLimit, getClientIp, createRateLimitResponse } from '../_shared/rateLimit.ts';

// Inside the handler, after user verification:
const clientIp = getClientIp(req);
const isAllowed = await checkRateLimit(userId, clientIp, 'tutor-chat', 20, 60000); // 20 req/min

if (!isAllowed) {
  return createRateLimitResponse(corsHeaders);
}
```

---

### Patch C-003: Add Pagination to Review Queue (BLOCKER)

```typescript
// src/pages/ReviewSpaced.tsx
// REPLACE the query in loadDueCards (around line 45):

const { data: dueCards, error } = await supabase
  .from('review_queue')
  .select(`
    id,
    question_id,
    due_at,
    interval_days,
    ease,
    lapses,
    questions (
      id,
      stem,
      choice_a,
      choice_b,
      choice_c,
      choice_d,
      answer,
      explanation,
      skill_id
    )
  `)
  .eq('user_id', user.id)
  .lte('due_at', new Date().toISOString())
  .order('due_at', { ascending: true })
  .limit(50);  // ADD THIS LINE
```

---

### Patch C-004: Fix Import Questions Key (HIGH)

```typescript
// supabase/functions/import-questions/index.ts
// REPLACE lines 129-136:

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    // Use anon key for auth verification
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Use service role for admin operations after auth
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
```

---

### Patch C-005: Fix Cron Job User Creation (HIGH)

```typescript
// supabase/functions/cron-daily/index.ts
// REPLACE lines 126-173 with:

    for (let i = 0; i < usersNeedingPlans.length; i += batchSize) {
      const batch = usersNeedingPlans.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (user) => {
        try {
          console.log(`Generating plan for user ${user.id}...`);
          
          // Call generate-study-plan with service role key and userId parameter
          const response = await fetch(`${supabaseUrl}/functions/v1/generate-study-plan`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
            },
            body: JSON.stringify({ force: true, userId: user.id })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error generating plan for user ${user.id}:`, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const result = await response.json();
          console.log(`Successfully generated plan for user ${user.id}:`, result.days?.length || 0, 'days');
          return { userId: user.id, success: true };

        } catch (error) {
          console.error(`Failed to generate plan for user ${user.id}:`, error);
          return { userId: user.id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });
      // ... rest unchanged
```

---

### Patch C-006: Fix Atomic Error Bank Increment (HIGH)

```sql
-- Create a migration file: supabase/migrations/YYYYMMDD_fix_error_bank_increment.sql

CREATE OR REPLACE FUNCTION public.increment_error_bank(
  p_user_id UUID,
  p_question_id TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO error_bank (user_id, question_id, miss_count, last_missed_at)
  VALUES (p_user_id, p_question_id, 1, now())
  ON CONFLICT (user_id, question_id) 
  DO UPDATE SET 
    miss_count = error_bank.miss_count + 1,
    last_missed_at = now();
END;
$$;
```

Then update complete-task:

```typescript
// supabase/functions/complete-task/index.ts
// REPLACE lines 218-234:

          try {
            await supabase.rpc('increment_error_bank', {
              p_user_id: user.id,
              p_question_id: incorrectAnswer.question_id
            });
          } catch (error) {
            console.error(`Error adding to error bank for question ${incorrectAnswer.question_id}:`, error);
          }
```

---

### Patch C-007: Add Message Length Validation (HIGH)

```typescript
// supabase/functions/tutor-chat/index.ts
// ADD after line 24:

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const TutorChatSchema = z.object({
  subject: z.string().min(1).max(50),
  topic: z.string().min(1).max(200),
  mode: z.enum(['practice', 'quiz', 'test']),
  problem: z.object({
    id: z.string().nullable(),
    text: z.string().max(10000),
    choices: z.array(z.string().max(1000)).optional(),
    user_answer: z.string().max(100).optional(),
    user_work: z.string().max(5000).optional(),
  }),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(5000),
    timestamp: z.string().optional(),
  })).max(20),
  session_id: z.string().uuid().optional(),
});

// Then use it around line 151:
const validationResult = TutorChatSchema.safeParse(body);
if (!validationResult.success) {
  return new Response(
    JSON.stringify({ error: 'Invalid request data', details: validationResult.error.errors }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
const validatedBody = validationResult.data;
```

---

## D) Missing for Launch Checklist

### Critical Infrastructure

- [ ] **Rate Limiting**: Apply to all edge functions, especially tutor-chat and generate-study-plan
- [ ] **CORS**: Switch all edge functions to use `getCorsHeaders(req)` 
- [ ] **Error Monitoring**: Configure Sentry DSN and initialize in production builds
- [ ] **Database Backups**: Verify Supabase automatic backups are enabled and tested
- [ ] **Secrets Rotation**: Document process for rotating API keys

### Security

- [ ] **RLS Audit**: Run RLS test suite on production schema before launch
- [ ] **Input Validation**: Add zod schemas to all edge functions
- [ ] **Admin Gating**: Verify all admin endpoints use SERVICE_ROLE_KEY after auth
- [ ] **Webhook Security**: N/A (no payment webhooks found)

### Performance

- [ ] **Pagination**: Add limits to all list queries (review_queue, mastery, study_tasks)
- [ ] **Batch Operations**: Convert sequential mastery updates to batch upserts
- [ ] **Bundle Analysis**: Run `vite build --analyze` and verify code splitting

### Data Integrity

- [ ] **Atomic Updates**: Fix error_bank increment race condition
- [ ] **Offline Support**: Implement local storage for in-progress test state
- [ ] **Data Validation**: Add CHECK constraints on numeric ranges (scores 0-100, etc.)

### User Experience

- [ ] **Loading States**: Add skeletons to QuizRunner, DrillRunner
- [ ] **Error Messages**: Make validation errors user-friendly
- [ ] **404 Handling**: ✅ Already implemented with error reporting

### Compliance

- [ ] **Terms of Service**: Add page if not present
- [ ] **Privacy Policy**: Add page if not present  
- [ ] **Cookie Consent**: Add banner if using analytics

### Documentation

- [ ] **Deploy Steps**: Document edge function deployment process
- [ ] **Environment Variables**: Document all required env vars
- [ ] **Runbook**: Create incident response procedures

---

## Summary

This application has solid foundations but requires fixes to **3 BLOCKER** and **5 HIGH** severity issues before launch. The most critical gaps are:

1. **Security**: CORS wildcards and missing rate limiting expose the app to abuse
2. **Performance**: Unbounded queries will cause crashes at scale
3. **Data Integrity**: Race conditions and non-atomic updates will cause data corruption

Estimated total fix effort: **2-3 developer days** for BLOCKER/HIGH issues.

After implementing the patches above, schedule a follow-up security review focused on:
- Penetration testing of admin endpoints
- Load testing with realistic user volumes
- RLS policy verification with production data
