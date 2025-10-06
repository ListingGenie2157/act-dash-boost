# 🚀 Run the Migration - 3 Easy Steps

## Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar

---

## Step 2: Run the Migration
1. Click **"New query"** button
2. Copy ALL the contents from `RUN_THIS_MIGRATION.sql`
3. Paste into the SQL editor
4. Click **"Run"** or press `Ctrl+Enter`

You should see output like:
```
✅ Success. No rows returned
```

And then a results table showing:
```
total_users | completed | needs_onboarding
------------|-----------|------------------
     1      |     0     |        1
```

---

## Step 3: Refresh Your Browser
1. Go back to your app (http://localhost:8080 or your URL)
2. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. **You should now see the onboarding wizard! 🎉**

---

## ✅ What You'll See

```
╔═══════════════════════════════════════════════════╗
║                                                   ║
║           Getting you ACT-ready                   ║
║     Complete your profile to get started          ║
║                                                   ║
║  ①━━②━━③━━④━━⑤━━⑥━━⑦                          ║
║  Account  Test  Diag  Pref  Notify  Plan  Done   ║
║           Date                                    ║
║                                                   ║
║  ┌─────────────────────────────────────────────┐ ║
║  │ Welcome to ACT Boost!                       │ ║
║  │                                              │ ║
║  │ ☐ I am 13 years of age or older            │ ║
║  │ ☐ I agree to the Terms of Service          │ ║
║  │ ☐ I agree to the Privacy Policy            │ ║
║  │                                              │ ║
║  │              [Continue]                      │ ║
║  └─────────────────────────────────────────────┘ ║
╚═══════════════════════════════════════════════════╝
```

---

## 🎯 What Happens Next

1. **Check all 3 boxes** → Continue button activates
2. **Click Continue** → Goes to Step 2 (Test Date)
3. **Select your test date** → Goes to Step 3 (Diagnostic)
4. Continue through all 7 steps
5. At the end, you'll be redirected to the dashboard
6. **Your progress saves after each step!**

---

## 🔍 Troubleshooting

### Still seeing old homepage after migration?

**Try this:**
```bash
# 1. Hard refresh browser (Ctrl+Shift+R)
# 2. Clear local storage:
#    - Open DevTools (F12)
#    - Go to Application tab
#    - Storage → Local Storage → Clear All
# 3. Refresh again
```

### Want to verify migration worked?

Run this in Supabase SQL Editor:
```sql
SELECT id, onboarding_complete, onboarding_step, test_date 
FROM profiles 
LIMIT 5;
```

You should see `onboarding_complete = false` for your account.

---

## 📞 Let Me Know

After you run the migration and refresh:
- ✅ Do you see the wizard?
- ✅ Are all 7 steps visible in the stepper?
- ✅ Can you click through the steps?

Let me know if you see it or if you need any help! 🎉
