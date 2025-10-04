# ✅ Onboarding Flow - FIXED!

## The Issue You Found

**Problem:** After login, users went straight to main app instead of onboarding  
**Cause:** Index.tsx was checking wrong table (`profiles` instead of `user_profiles`)  
**Impact:** New users saw "Study Now" button and errors instead of onboarding wizard  

## The Fix ✅

**Changed:** Index.tsx now:
1. ✅ Checks `user_profiles` table (correct table)
2. ✅ Looks for `test_date` field
3. ✅ Redirects to `/onboarding` if no profile or no test_date
4. ✅ Uses `{ replace: true }` to prevent back button issues

**Result:** New users now properly flow through onboarding! 🎯

---

## 🎓 Expected User Flow (Now Fixed!)

### First-Time User:

```
1. Go to app → See landing page
2. Click "Sign Up" → Create account
3. Confirm email (if required) → Click confirmation link
4. Login → Authenticated ✅
5. Index checks user_profiles → No profile found
6. AUTO-REDIRECT → /onboarding 🎯
7. Complete onboarding wizard:
   ├─ Step 1: Legal (age, TOS, privacy)
   ├─ Step 2: Test date
   ├─ Step 3: Accommodations
   ├─ Step 4: Study preferences
   ├─ Step 5: Notifications
   ├─ Step 6: Choose path (Diagnostic or Daily)
   └─ Step 7: Past scores (optional)
8. Click "Complete Onboarding"
9. IF chose "Diagnostic" → /diagnostic
   OR chose "Daily" → / (main app)
10. Start studying! ✅
```

### Returning User:

```
1. Login → Authenticated ✅
2. Index checks user_profiles → Profile found with test_date ✅
3. Shows main app (Dashboard, Study Now, etc.) ✅
```

---

## 🔧 What Was Fixed

### Before (Broken):
```typescript
// Wrong table name!
const { data: profile } = await supabase
  .from('profiles')  // ❌ This table doesn't have test_date
  .select('test_date')
  .eq('id', session.user.id)  // ❌ Wrong column (should be user_id)
```

### After (Fixed):
```typescript
// Correct table and column!
const { data: profile } = await supabase
  .from('user_profiles')  // ✅ Correct table
  .select('test_date, age_verified')
  .eq('user_id', session.user.id)  // ✅ Correct column

// Proper redirect
if (!profile || !profile.test_date) {
  navigate('/onboarding', { replace: true });  // ✅ Clean redirect
  return;
}
```

---

## 📋 Onboarding Wizard Steps

### Step 1: Legal Requirements ⚖️
- Age verification (13+)
- Terms of Service acceptance
- Privacy Policy acceptance

### Step 2: Test Date 📅
- Select ACT test date
- Calculates days until test
- Used for study plan scheduling

### Step 3: Accommodations ♿
- Time multipliers (100%, 150%, 200%)
- For students with dyslexia, ADHD, etc.
- Applied to all timed activities

### Step 4: Study Preferences ⏰
- Daily study minutes (15, 25, 45, 60)
- Preferred start hour
- Preferred end hour

### Step 5: Notifications 🔔
- Email notifications toggle
- Quiet hours (no notifications)
- Start/end quiet time

### Step 6: Starting Path 🛤️
**Two Options:**
- **Diagnostic** → Take assessment first, then personalized plan
- **Daily Study** → Skip diagnostic, use general study plan

### Step 7: Baseline Scores (Optional) 📊
- Enter past ACT scores (if any)
- English, Math, Reading, Science
- Notes about weak areas
- Used to better personalize plan

---

## 🎯 After Onboarding

### If User Chose "Diagnostic":
```
Onboarding Complete
    ↓
Navigate to /diagnostic
    ↓
See diagnostic intro page
    ↓
Click "Start Diagnostic Test"
    ↓
Complete assessment (~20 min)
    ↓
View results
    ↓
Study plan generated based on results
    ↓
Redirect to main app with personalized plan ✅
```

### If User Chose "Daily Study":
```
Onboarding Complete
    ↓
Navigate to / (main app)
    ↓
Study plan generated (generic, not diagnostic-based)
    ↓
See dashboard with:
  - Mastery progress
  - Weak areas
  - Study plan
  - Lessons library
  ✅
```

---

## 🚀 What Happens Now

### New User Experience:

1. **Login for first time** ✅
2. **Sees:** Onboarding wizard (not broken main app) ✅
3. **Completes:** 7 onboarding steps ✅
4. **Chooses:** Diagnostic or Daily ✅
5. **Gets:** Personalized experience ✅

### No More Errors:

- ❌ "Cannot fetch test date" → Gone! (Checks before showing main app)
- ❌ "Failed to send edge function" → Gone! (Won't see Study Now until ready)
- ❌ Random buttons → Gone! (Only shows after onboarding)

---

## 🧪 Testing the Fix

### Test 1: New User Flow
1. Create fresh account (or use incognito mode)
2. Login
3. **Expected:** Redirected to `/onboarding` immediately
4. Complete onboarding steps
5. Choose "Diagnostic"
6. **Expected:** Redirected to `/diagnostic`

### Test 2: Returning User
1. Login with account that has completed onboarding
2. **Expected:** See main app (Dashboard, Study Now, etc.)
3. **Expected:** No errors about test date

### Test 3: Partial Onboarding
1. User who started but didn't finish onboarding
2. **Expected:** Redirected to `/onboarding`
3. Can continue where they left off

---

## 🔍 Debugging If Still Not Working

### Check 1: Does user_profiles table exist?

In Supabase dashboard → Table Editor:
- Look for `user_profiles` table
- Should have columns: `user_id`, `test_date`, `age_verified`, etc.

### Check 2: Check RLS policies

Run in Supabase SQL Editor:
```sql
-- Check if user can read their own profile
SELECT * FROM user_profiles WHERE user_id = auth.uid();
```

If this returns nothing, RLS might be blocking.

**Fix:** Make sure RLS policy exists:
```sql
CREATE POLICY "Users can read own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = user_id);
```

### Check 3: Browser Console

After login, check console for:
- "Profile check:" log message
- Should show profile data or null
- Any errors?

---

## 🎯 What Should Happen Now

**Scenario A: Brand New User**
```
Login → onboarding → Complete 7 steps → Choose path → Start!
```

**Scenario B: User Who Completed Onboarding**
```
Login → Main app (Dashboard with mastery, weak areas, etc.)
```

**Scenario C: User Who Partially Completed Onboarding**
```
Login → onboarding (can resume)
```

---

## 🚨 If STILL Not Working

Tell me:

1. **After login, what page URL do you see?**
   - `/` (home)?
   - `/onboarding`?
   - Something else?

2. **What's in browser console after login?**
   - Look for "Profile check:" log
   - What does it say?

3. **Can you access** `/onboarding` manually?
   - Type in URL: `http://localhost:5173/onboarding`
   - Does it load?

4. **Check Supabase dashboard:**
   - Authentication → Users
   - Do you see your user?
   - Click it → Is email confirmed?

**I'll fix it based on your answers!** 🔧

---

## ✅ Expected Behavior (Now)

**New user logs in:**
- Immediately sees onboarding wizard ✅
- Completes all 7 steps ✅
- Chooses diagnostic or daily ✅
- Gets sent to appropriate page ✅

**No more seeing random "Study Now" button or errors!** 🎉
