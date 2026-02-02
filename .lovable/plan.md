

# Lead Capture Backend Implementation Plan

## Overview

This plan implements a complete lead capture system for collecting emails from landing pages. The system includes:
- A `leads` table with proper indexing and RLS
- A `capture-lead` edge function with rate limiting and spam protection
- Frontend integration helper

---

## 1. Database: `leads` Table

### Schema Design

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| email | TEXT | Yes | Lead's email address |
| role | TEXT | No | "student" or "parent" |
| bucket | TEXT | No | Score bucket (e.g., "20-25") |
| test_date | TEXT | No | Target ACT test date |
| beta_interest | BOOLEAN | No | Interested in beta access |
| source | TEXT | No | Where the lead came from (e.g., "landing", "cheatsheet") |
| utm_source | TEXT | No | UTM source parameter |
| utm_medium | TEXT | No | UTM medium parameter |
| utm_campaign | TEXT | No | UTM campaign parameter |
| page_path | TEXT | No | Page URL path where form was submitted |
| ip_hash | TEXT | No | SHA-256 hash of IP (privacy-safe rate limiting) |
| user_agent | TEXT | No | Browser user agent |
| created_at | TIMESTAMPTZ | Yes | When the lead was captured |

### Indexes
- **Unique de-dupe index**: Prevents duplicate entries per email + source combination
- **Query indexes**: For filtering by role, bucket, and date ranges

### Row-Level Security (RLS)
- **No client access**: Only the edge function (using service role) can insert
- Anonymous and authenticated users cannot read, insert, update, or delete

---

## 2. Edge Function: `capture-lead`

### Security Features

| Feature | Implementation |
|---------|----------------|
| **Email validation** | Regex check before insert |
| **IP rate limiting** | Max 10 submissions per IP per 10 minutes |
| **IP hashing** | SHA-256 with salt for privacy |
| **No client inserts** | Uses service role key |
| **CORS headers** | Allows cross-origin requests |

### Request Flow

```text
POST /functions/v1/capture-lead
    ↓
Validate email format
    ↓
Hash IP address with salt
    ↓
Check rate limit (10 per 10 min per IP)
    ↓
Upsert lead (update if exists, insert if new)
    ↓
Return { ok: true, id: "...", created_at: "..." }
```

### Expected Request Body

```json
{
  "email": "student@example.com",
  "role": "student",
  "bucket": "25-28",
  "test_date": "2025-04",
  "beta_interest": true,
  "source": "cheatsheet",
  "page_path": "/cheatsheets/math",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "act_prep_2025"
}
```

### Response Examples

**Success:**
```json
{ "ok": true, "id": "uuid...", "created_at": "2025-02-02T..." }
```

**Error (invalid email):**
```json
{ "error": "Invalid email" }
```

**Error (rate limited):**
```json
{ "error": "Rate limit exceeded" }
```

---

## 3. Secret Required

The edge function needs one new secret for IP hashing:

| Secret Name | Purpose |
|-------------|---------|
| `LEAD_IP_SALT` | Random string to salt IP hashes (prevents rainbow table attacks) |

The following secrets are already configured:
- `SUPABASE_URL` - Already exists
- `SUPABASE_SERVICE_ROLE_KEY` - Already exists

---

## 4. Frontend Integration

A helper function will be added to call the edge function from any landing page:

```typescript
// Usage example
await captureLead({
  email: "user@example.com",
  role: "student",
  bucket: "25-28",
  test_date: "2025-04",
  beta_interest: true,
  source: "landing",
  page_path: window.location.pathname,
  utm_source: new URLSearchParams(location.search).get("utm_source"),
  utm_medium: new URLSearchParams(location.search).get("utm_medium"),
  utm_campaign: new URLSearchParams(location.search).get("utm_campaign"),
});
```

---

## 5. Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| Migration SQL | Create | `leads` table, indexes, RLS policies |
| `supabase/config.toml` | Modify | Add `[functions.capture-lead]` with `verify_jwt = false` |
| `supabase/functions/capture-lead/index.ts` | Create | Edge function with validation, rate limiting, upsert logic |
| `src/lib/captureLead.ts` | Create | Frontend helper function for calling the edge function |

---

## Technical Details

### Migration SQL

```sql
-- 1) Lead capture table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT,
  bucket TEXT,
  test_date TEXT,
  beta_interest BOOLEAN NOT NULL DEFAULT false,
  source TEXT DEFAULT 'landing',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  page_path TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) De-dupe index: one row per email per source
CREATE UNIQUE INDEX IF NOT EXISTS leads_email_source_unique 
  ON public.leads (lower(email), COALESCE(source, ''));

-- 3) Query indexes
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads (created_at);
CREATE INDEX IF NOT EXISTS leads_role_idx ON public.leads (role);
CREATE INDEX IF NOT EXISTS leads_bucket_idx ON public.leads (bucket);
CREATE INDEX IF NOT EXISTS leads_ip_hash_idx ON public.leads (ip_hash, created_at);

-- 4) RLS: lock down table
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- No client access at all - only service role can insert
REVOKE ALL ON TABLE public.leads FROM anon, authenticated;
```

### Edge Function Structure

```text
capture-lead/
└── index.ts
    ├── CORS headers
    ├── Email validation function
    ├── SHA-256 IP hashing function
    ├── Rate limiting check (10 per 10 min)
    ├── Upsert to leads table
    └── JSON response
```

---

## Summary

| Component | Purpose |
|-----------|---------|
| `leads` table | Store email signups with metadata |
| Unique index | Prevent duplicate submissions |
| RLS policies | Block all client access |
| Edge function | Secure server-side insertion with rate limiting |
| IP hashing | Privacy-safe rate limiting |
| Frontend helper | Easy integration into any landing page |

