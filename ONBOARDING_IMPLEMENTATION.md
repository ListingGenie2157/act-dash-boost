# Onboarding Wizard Implementation

## Summary
Replaced the current Home screen with an Onboarding Wizard that walks new users through all onboarding steps. The wizard persists progress to Supabase and, if onboarding is complete, shows the existing dashboard.

## Files Modified

### Database Schema
1. **supabase/migrations/20251005000000_add_onboarding_tracking.sql** (NEW)
   - Added `onboarding_complete` (boolean, default false) to `profiles` table
   - Added `onboarding_step` (text) to `profiles` table to track current step
   - Created index for faster onboarding queries

### Routing & Gate Logic
2. **src/routes/OnboardingGate.tsx** (NEW)
   - Main routing component that decides whether to show onboarding or dashboard
   - Checks user authentication and profile status
   - Redirects to wizard if `onboarding_complete` is false
   - Passes `initialStep` to resume from last saved step

3. **src/App.tsx** (MODIFIED)
   - Changed root route `/` from `<Index />` to `<OnboardingGate />`
   - OnboardingGate now handles all onboarding vs dashboard logic

4. **src/pages/Index.tsx** (MODIFIED)
   - Removed onboarding redirect logic (now handled by OnboardingGate)
   - Simplified auth state management
   - Focus is now purely on displaying dashboard for authenticated users

### Onboarding Wizard
5. **src/features/onboarding/OnboardingWizard.tsx** (NEW)
   - Main wizard component managing state and navigation
   - 7-step wizard with progress persistence after each step
   - Integrates with existing tables: `profiles`, `user_profiles`, `user_preferences`
   - Saves data incrementally as user progresses
   - On completion, redirects to diagnostic or dashboard based on user choice

### UI Components
6. **src/components/ui/Stepper.tsx** (NEW)
   - Visual stepper component showing progress
   - Left-to-right horizontal layout
   - Shows completed steps, active step, and upcoming steps
   - Responsive labels and icons

### Step Components (NEW)
7. **src/features/onboarding/steps/StepAccount.tsx**
   - Collects age verification, TOS, and privacy policy acceptance
   - Maps to existing `user_profiles` table

8. **src/features/onboarding/steps/StepTestDate.tsx**
   - Date picker for ACT test date
   - Uses existing Calendar component from UI library
   - Saves to `profiles.test_date`

9. **src/features/onboarding/steps/StepDiagnostic.tsx**
   - Choice: take diagnostic now or skip
   - Determines post-onboarding route

10. **src/features/onboarding/steps/StepPreferences.tsx**
    - Daily study minutes (15/25/40)
    - Preferred study time window
    - Saves to `user_preferences` table

11. **src/features/onboarding/steps/StepNotifications.tsx**
    - Email notification opt-in/out
    - Quiet hours configuration
    - Saves to `user_preferences` table

12. **src/features/onboarding/steps/StepPlan.tsx**
    - Confirmation screen explaining what the study plan includes
    - No data collection, just informational

13. **src/features/onboarding/steps/StepDone.tsx**
    - Success screen with checkmark
    - Sets `onboarding_complete = true`
    - Redirects to diagnostic or dashboard

### Type Definitions
14. **src/integrations/supabase/types.ts** (MODIFIED)
    - Added `onboarding_complete: boolean | null` to `profiles` Row/Insert/Update
    - Added `onboarding_step: string | null` to `profiles` Row/Insert/Update

## Existing Code Reused

The implementation reuses existing infrastructure:
- ✅ **Supabase tables**: `profiles`, `user_profiles`, `user_preferences`, `accommodations`, `user_goals`
- ✅ **UI components**: Card, Button, Calendar, Select, Switch, Checkbox, Label, etc. from `@/components/ui`
- ✅ **Routing**: React Router and existing auth flow
- ✅ **Analytics**: Existing Supabase client and React Query
- ✅ **Date handling**: date-fns library
- ✅ **Toast notifications**: Sonner

## Data Flow

### New User Flow
1. User signs up → `OnboardingGate` checks `profiles.onboarding_complete` → `false` or `null`
2. Shows `OnboardingWizard` starting at step 1 (or `onboarding_step` if resuming)
3. User completes each step → data saved to appropriate tables
4. After each step, `profiles.onboarding_step` updated
5. On final step, `profiles.onboarding_complete` set to `true`
6. Redirect to `/diagnostic` or `/` based on user choice

### Returning User Flow (Mid-Onboarding)
1. User logs in → `OnboardingGate` checks `profiles.onboarding_complete` → `false`
2. Reads `profiles.onboarding_step` → e.g., `"prefs"`
3. Shows `OnboardingWizard` starting at that step
4. User continues from where they left off

### Completed User Flow
1. User logs in → `OnboardingGate` checks `profiles.onboarding_complete` → `true`
2. Shows existing `Index` (dashboard) directly
3. No onboarding wizard shown

## Preserved Existing Features

✅ **Authentication**: Existing auth flow in `Login.tsx` unchanged  
✅ **Dashboard**: All dashboard features (StudyNow, Analytics, Simulations, Cheatsheets) available after onboarding  
✅ **Analytics**: Progress tracking and analytics unchanged  
✅ **Simulations**: Start English SIM, Math SIM, etc. still accessible  
✅ **Legacy `/onboarding` route**: Old onboarding page still exists at `/onboarding` if needed

## Testing Verification Steps

### New User Test
1. Sign up new account
2. Should see wizard at step 1 (Account)
3. Complete all 7 steps
4. Should redirect to diagnostic or dashboard
5. On login, should go directly to dashboard (not wizard)

### Mid-Way User Test
1. Start wizard, complete 3 steps
2. Close browser or log out
3. Log back in
4. Should resume at step 4 (Preferences)

### Completed User Test
1. Log in with account that has `onboarding_complete = true`
2. Should see dashboard immediately
3. No wizard shown

### Type Safety Test
- All components use TypeScript with proper types
- Supabase types updated to include new columns
- No `any` types except where necessary for form data merging

### No Breaking Changes
- Old `/onboarding` route still works (kept for backward compatibility)
- Existing `Index.tsx` exports unchanged
- All existing features (analytics, simulations, cheatsheets) functional

## Notes on Implementation

### Stubs Created
None. All steps map to existing database tables and schemas already present in the repo.

### Database Tables Used
- `profiles` (test_date, onboarding_complete, onboarding_step)
- `user_profiles` (age_verified, tos_accepted, privacy_accepted)
- `user_preferences` (daily_minutes, preferred_start_hour, preferred_end_hour, email_notifications, quiet_start_hour, quiet_end_hour)
- `user_goals` (start_with: 'diagnostic' or 'daily')
- `accommodations` (optional, not included in current wizard but table exists)

### Design Tokens
Used existing Tailwind classes and shadcn/ui design system:
- Primary purple color for CTAs
- Muted backgrounds for cards
- Consistent spacing and typography
- Mobile-responsive layout

### Future Enhancements (Not Implemented)
- Save & Exit button (currently auto-saves after each step)
- Accommodations step (table exists but skipped for simplicity)
- Target score collection (not in current schema)
- Past scores input (exists in old onboarding but moved to optional)
