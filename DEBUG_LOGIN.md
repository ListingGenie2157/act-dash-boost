# Login Debugging Guide

## Quick Test

### 1. Check Browser Console
Open dev tools (F12) and look for errors when trying to login.

### 2. Test Supabase Connection

Open browser console on login page and run:
```javascript
// Test if Supabase is accessible
await window.supabase.auth.getSession()

// Expected: { data: { session: null }, error: null }
```

### 3. Try Creating Account

Go to `/login` and:
1. Click "Create one"
2. Enter email: `test@example.com`
3. Enter password: `TestPassword123!`
4. Click "Create Account"

**Expected:** "Check Your Email" message

### 4. Check Network Tab

In browser dev tools:
1. Go to Network tab
2. Try to login
3. Look for requests to `supabase.co`
4. Check if any are failing (red)

## Common Issues

### Issue 1: Email Confirmation Required
**Symptom:** Can't login after signup  
**Solution:** Supabase requires email confirmation by default

**Quick Fix:** Disable email confirmation in Supabase dashboard:
1. Go to Supabase dashboard
2. Authentication → Providers → Email
3. Uncheck "Confirm email"
4. Save

### Issue 2: RLS Policies Too Strict
**Symptom:** Login works but can't access data  
**Solution:** Check RLS policies allow authenticated users

### Issue 3: CORS Issues
**Symptom:** Network errors in console  
**Solution:** Check Supabase project URL is correct

### Issue 4: Auth Redirect Loop
**Symptom:** Page keeps redirecting  
**Solution:** Check Index.tsx auth logic

## Test Credentials

Try these test accounts (if they exist in your DB):

**Account 1:**
- Email: test@test.com
- Password: password123

**Account 2:**
- Email: demo@demo.com
- Password: demo123

## Manual Test

Run this in browser console:
```javascript
const { data, error } = await window.supabase.auth.signInWithPassword({
  email: 'test@test.com',
  password: 'password123'
});

console.log('Result:', data, error);
```

## Environment Check

Make sure `.env` or env vars are set:
```
VITE_SUPABASE_URL=https://hhbkmxrzxcswwokmbtbz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

Currently hardcoded in client.ts so should work.

## Next Steps

Tell me:
1. What error message do you see (if any)?
2. Does signup work but login doesn't?
3. Do you see any errors in browser console?
4. Does the login button just not respond?

I'll fix it immediately! 🔧
