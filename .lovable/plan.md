

# Fix index.html to Call the Edge Function

## What's Wrong Now

1. **Form submit handler is a TODO** -- line 263 says `// TODO: send data to your backend/email tool here` and never calls the edge function
2. **No query params passed to thank-you.html** -- so the thank-you page can't prefill anything
3. **Step 2 label says "ACT test date"** -- but the options are time buckets ("under 30 days", "30-60 days"), not actual dates

## Changes

### 1. `public/cheatsheet.html` (copy your uploaded index.html with fixes applied)

Since this is a standalone HTML file outside your React app, we'll place it in `public/` so it's served at `/cheatsheet.html`.

**Fixes applied:**
- **Label change**: "ACT test date (optional)" becomes "How soon is the ACT? (optional)"
- **Script replacement**: The entire `<script>` block gets replaced with the working version that:
  - Validates Step 1 (email + role)
  - Calls `capture-lead` edge function at `https://hhbkmxrzxcswwokmbtbz.supabase.co/functions/v1/capture-lead`
  - Extracts UTM parameters from the URL
  - Redirects to `thank-you.html` with query params (`email`, `role`, `bucket`)
  - Shows error alerts on failure
- **No Authorization headers needed** -- `capture-lead` is deployed with `verify_jwt = false`

### 2. `public/thank-you.html` (new file)

A simple confirmation page that:
- Reads `email`, `role`, `bucket` from URL query params
- Shows a "Download Cheatsheet" button (placeholder PDF link you'll replace later)
- Offers a waitlist/beta section with prefilled fields from the query params
- Does NOT claim "we emailed it" -- just says "Download your cheatsheet"

### 3. No edge function or CORS changes needed

- Edge function is already deployed and tested
- CORS already allows `getpreppit.com` and Lovable domains
- `verify_jwt = false` is already set

## Files

| File | Action | Description |
|------|--------|-------------|
| `public/cheatsheet.html` | Create | Your uploaded index.html with the fixed script and label |
| `public/thank-you.html` | Create | Confirmation page with download button and prefilled waitlist |

## Note About the PDF

The download button will link to `/Preppit_ACT_Pacing_Cheatsheet.pdf`. You'll need to drop that PDF file into `public/` yourself (or provide a Supabase Storage URL to use instead).

