# 🚀 See the Wizard RIGHT NOW

## The Issue
You're seeing the old homepage because:
1. The database columns don't exist yet (migration not run)
2. The logic was checking `=== false` instead of `!== true`

## ✅ FIXED!
I just updated the logic in `OnboardingGate.tsx` to show the wizard for **any user who doesn't have `onboarding_complete = true`**.

---

## 🎯 See the Wizard in 3 Steps

### Option 1: Refresh Your Browser (Easiest)
```bash
# Just refresh your browser at http://localhost:8080 or your dev URL
# You should now see the wizard!
```

If you're logged in, you should immediately see the 7-step wizard with the header **"Getting you ACT-ready"**.

---

### Option 2: Clear Profile and Refresh
If Option 1 doesn't work, run this SQL in Supabase:

```sql
-- This temporarily removes your profile so the wizard shows
DELETE FROM profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
```

Then refresh the page → wizard appears!

---

### Option 3: Create New Account
1. Logout
2. Sign up with a new email
3. Should see wizard immediately after signup

---

## ✅ What You Should See

### Before (Old Homepage)
```
╔════════════════════════════════════╗
║  Countdown Header                  ║
║  Navigation: Start SIM, Cheatsheets║
║  TestWeekBanner                    ║
║  StudyNow Component                ║
╚════════════════════════════════════╝
```

### After (NEW Wizard) ✨
```
╔════════════════════════════════════╗
║                                    ║
║     Getting you ACT-ready          ║
║  Complete your profile to start    ║
║                                    ║
║  [1]──[2]──[3]──[4]──[5]──[6]──[7] ║
║  Account│Test│Diag│Pref│Noti│Plan│Done
║                                    ║
║  ┌──────────────────────────────┐ ║
║  │ Welcome to ACT Boost!        │ ║
║  │                               │ ║
║  │ ☑ I am 13 years or older    │ ║
║  │ ☑ I agree to TOS            │ ║
║  │ ☑ I agree to Privacy        │ ║
║  │                               │ ║
║  │        [Continue]             │ ║
║  └──────────────────────────────┘ ║
╚════════════════════════════════════╝
```

---

## 🔧 Debugging

### Still seeing old homepage?

**Check 1: Is the dev server running?**
```bash
npm run dev
# or
npm start
```

**Check 2: Is the root route using OnboardingGate?**
```bash
grep -n "element={<OnboardingGate" src/App.tsx
# Should show: 49:          <Route path="/" element={<OnboardingGate />} />
```

**Check 3: Clear browser cache**
```bash
# In Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
# Or use incognito/private window
```

**Check 4: Check browser console for errors**
```bash
# Open DevTools (F12) → Console tab
# Look for any red errors
```

---

## 🎬 What Changed

### Old Logic (Didn't work)
```typescript
if (!profile || profile.onboarding_complete === false) {
  return <OnboardingWizard />;
}
```
❌ Problem: If `onboarding_complete` is `null` or `undefined`, this doesn't match

### New Logic (Works!) ✅
```typescript
if (!profile || profile.onboarding_complete !== true) {
  return <OnboardingWizard />;
}
```
✅ Solution: Show wizard unless explicitly set to `true`

---

## 📊 Testing Matrix

| User State | `onboarding_complete` | Shows Wizard? |
|------------|-----------------------|---------------|
| New user (no profile) | doesn't exist | ✅ YES |
| Existing user (before migration) | `null` | ✅ YES |
| Mid-onboarding | `false` | ✅ YES |
| Completed | `true` | ❌ NO (shows dashboard) |

---

## 🚀 Next Steps After You See It

Once you see the wizard:

1. **Test all 7 steps** - Click through each one
2. **Check data persistence** - Data won't save yet (need migration)
3. **Run the migration** - Then test end-to-end
4. **Test resume flow** - Interrupt and login again

---

## 💡 Pro Tip: Force Wizard Mode

Want to always see the wizard during testing? Temporarily change this:

```typescript
// src/routes/OnboardingGate.tsx line 48
if (!profile || profile.onboarding_complete !== true) {
  return <OnboardingWizard initialStep={profile?.onboarding_step} />;
}
```

To:

```typescript
// Force wizard mode for testing
return <OnboardingWizard initialStep={profile?.onboarding_step} />;
```

Then refresh → wizard always shows regardless of user state.

---

## ❓ Still Not Working?

Run this diagnostic:

```bash
# Check if files exist
ls -la src/routes/OnboardingGate.tsx
ls -la src/features/onboarding/OnboardingWizard.tsx

# Check routing
grep "OnboardingGate" src/App.tsx

# Restart dev server
# Ctrl+C to stop, then:
npm run dev
```

If still stuck, check:
- Is your dev server actually restarting after code changes?
- Are you looking at the right URL/port?
- Any build errors in the terminal?

---

## ✅ Success Indicators

You'll know it's working when you see:

✅ Header says **"Getting you ACT-ready"** (not countdown timer)  
✅ Horizontal stepper with 7 steps visible  
✅ First card shows "Welcome to ACT Boost!"  
✅ Three checkboxes (Age, TOS, Privacy)  
✅ Continue button (disabled until all checked)  

**If you see this, the wizard is working! 🎉**

---

## 📞 Help

If you're still seeing the old homepage after:
1. Refreshing browser (hard refresh: Ctrl+Shift+R)
2. Checking the dev server is running
3. Verifying OnboardingGate is in App.tsx

Then share:
- What URL you're visiting
- What you see on screen
- Any console errors (F12 → Console)

I'll help debug further!
