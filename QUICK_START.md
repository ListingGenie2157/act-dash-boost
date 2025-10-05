# Quick Start - Onboarding Wizard

## 🚀 What Was Built

A complete 7-step onboarding wizard that replaces the Home screen for new users. The wizard:
- ✅ Collects account info, test date, study preferences, and notifications
- ✅ Saves progress after each step to Supabase
- ✅ Resumes from last step if interrupted
- ✅ Shows dashboard once complete
- ✅ Zero breaking changes to existing features

---

## ✅ Verification

Run the verification script:
```bash
./verify-onboarding-wizard.sh
```

**Expected output:** All checks passed (✅)

---

## 🗄️ Database Setup

### Apply Migration

The migration adds two columns to the `profiles` table:
- `onboarding_complete` (boolean, default false)
- `onboarding_step` (text, nullable)

**If using Supabase CLI:**
```bash
supabase db push
```

**If using Supabase Dashboard:**
1. Go to SQL Editor
2. Copy contents of `supabase/migrations/20251005000000_add_onboarding_tracking.sql`
3. Run the SQL

**Manual SQL (if needed):**
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_step TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding 
ON public.profiles(onboarding_complete) 
WHERE onboarding_complete = false;
```

---

## 🧪 Testing Flows

### 1. New User Test
```bash
# 1. Sign up at /login with new email
# 2. Should immediately see wizard at step 1 (Account)
# 3. Complete all 7 steps
# 4. Should redirect to /diagnostic or / based on choice
# 5. Login again → should see dashboard (no wizard)
```

**Expected:** New users start at step 1, see all 7 steps, complete, and never see wizard again.

---

### 2. Resume Mid-Onboarding Test
```bash
# 1. Sign up and complete steps 1-3
# 2. Close browser or logout
# 3. Login again
# 4. Should resume at step 4 (Preferences)
```

**Expected:** `profiles.onboarding_step` tracks progress, wizard resumes correctly.

---

### 3. Completed User Test
```bash
# 1. Use existing account with onboarding_complete = true
# 2. Login at /login
# 3. Should go directly to dashboard
```

**Expected:** No wizard shown, straight to dashboard.

---

### 4. Database Verification
```sql
-- Check profile after step 3
SELECT id, onboarding_step, onboarding_complete 
FROM profiles 
WHERE id = '<user_id>';

-- Expected: onboarding_step = 'diagnostic', onboarding_complete = false

-- Check after completion
-- Expected: onboarding_step = 'done', onboarding_complete = true
```

---

## 🎯 User Flow Map

```
User Signs Up
      ↓
OnboardingGate checks profiles.onboarding_complete
      ↓
┌─────────────────────────┐
│   New User (false)      │ → Show Wizard at step 1 (or saved step)
└─────────────────────────┘
      ↓
7-Step Wizard:
  1. Account (age, TOS, privacy) → save to user_profiles
  2. Test Date → save to profiles.test_date
  3. Diagnostic (now or later) → save to form data
  4. Preferences (study time) → save to user_preferences
  5. Notifications (email, quiet hours) → save to user_preferences
  6. Plan (info screen) → no data saved
  7. Done (success) → set onboarding_complete = true
      ↓
Redirect to /diagnostic or / based on choice
      ↓
OnboardingGate checks profiles.onboarding_complete
      ↓
┌─────────────────────────┐
│ Returning User (true)   │ → Show Dashboard
└─────────────────────────┘
```

---

## 📂 Key Files

### Entry Point
- **`src/routes/OnboardingGate.tsx`** - Decides wizard vs dashboard

### Wizard Logic
- **`src/features/onboarding/OnboardingWizard.tsx`** - Main wizard component

### Steps
- **`src/features/onboarding/steps/Step*.tsx`** - 7 individual step components

### UI
- **`src/components/ui/Stepper.tsx`** - Visual progress indicator

### Routing
- **`src/App.tsx`** - Root route changed to use `OnboardingGate`

---

## 🔧 Troubleshooting

### Issue: New users don't see wizard
**Check:**
1. Is root route using `OnboardingGate`? (App.tsx line 49)
2. Is migration applied? (Check `profiles` table has new columns)
3. Is user authenticated? (OnboardingGate only shows wizard if logged in)

**Fix:**
```typescript
// src/App.tsx line 49 should be:
<Route path="/" element={<OnboardingGate />} />
```

---

### Issue: Wizard doesn't save progress
**Check:**
1. Are new columns in `profiles` table? Run:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'profiles';
   ```
2. Check browser console for errors
3. Verify Supabase RLS policies allow updates

**Fix:** Re-run migration or add columns manually.

---

### Issue: TypeScript errors
**Check:**
1. Are types updated in `src/integrations/supabase/types.ts`?
2. Does `profiles` type have `onboarding_complete` and `onboarding_step`?

**Fix:**
```typescript
// src/integrations/supabase/types.ts
profiles: {
  Row: {
    // ... existing fields
    onboarding_complete: boolean | null
    onboarding_step: string | null
  }
}
```

---

### Issue: Wizard loops or doesn't redirect
**Check:**
1. Is `onboarding_complete` being set to `true` on step 7?
2. Check `StepDone` component calls `onDone` handler
3. Verify `OnboardingWizard.handleDone` sets complete flag

**Fix:** Check mutation in `handleDone`:
```typescript
await persistStep.mutateAsync({ complete: true, stepId: 'done' });
```

---

## 🎨 Customization

### Change Step Order
Edit `src/features/onboarding/OnboardingWizard.tsx`:
```typescript
const steps = [
  { id: 'account', label: 'Account', component: StepAccount },
  // Add/remove/reorder steps here
];
```

### Add New Step
1. Create `src/features/onboarding/steps/StepNewStep.tsx`
2. Add to `steps` array in `OnboardingWizard.tsx`
3. Update `saveOnboardingData` to handle new step data

### Change Redirect Logic
Edit `handleDone` in `OnboardingWizard.tsx`:
```typescript
const handleDone = async () => {
  await persistStep.mutateAsync({ complete: true, stepId: 'done' });
  
  // Custom redirect logic here
  navigate('/custom-route');
};
```

---

## 📊 Monitoring

### Check Onboarding Completion Rate
```sql
-- Total users
SELECT COUNT(*) FROM profiles;

-- Completed onboarding
SELECT COUNT(*) FROM profiles WHERE onboarding_complete = true;

-- Incomplete onboarding
SELECT COUNT(*) FROM profiles WHERE onboarding_complete = false OR onboarding_complete IS NULL;

-- Most common drop-off step
SELECT onboarding_step, COUNT(*) as count
FROM profiles
WHERE onboarding_complete = false
GROUP BY onboarding_step
ORDER BY count DESC;
```

---

## 🆘 Support

### Documentation
- **Technical Details:** `ONBOARDING_IMPLEMENTATION.md`
- **File Changes:** `FILES_CHANGED.md`
- **Summary:** `IMPLEMENTATION_SUMMARY.md`

### Verification
```bash
./verify-onboarding-wizard.sh
```

### Rollback
See `FILES_CHANGED.md` section "🎯 Rollback Instructions"

---

## ✅ Production Checklist

Before deploying to production:

- [ ] Migration applied to production database
- [ ] All verification checks pass
- [ ] New user flow tested end-to-end
- [ ] Resume flow tested
- [ ] Completed user flow tested
- [ ] No TypeScript errors (`npm run build`)
- [ ] No console errors in browser
- [ ] Mobile responsive (test on small screen)
- [ ] Analytics tracking set up (optional)
- [ ] Error monitoring configured (optional)

---

## 🎉 Success!

Your onboarding wizard is ready to use. New users will now see a beautiful 7-step wizard that guides them through account setup, collects their preferences, and seamlessly transitions them to the main application.

**Questions?** Check the documentation files or review the code comments.
