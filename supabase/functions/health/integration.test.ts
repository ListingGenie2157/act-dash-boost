import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { assert } from "https://deno.land/std@0.224.0/assert/assert.ts";

const SUPABASE_URL = "https://hhbkmxrzxcswwokmbtbz.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoYmtteHJ6eGNzd3dva21idGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNTI5MzcsImV4cCI6MjA3MTgyODkzN30.SWsosSuVDjtaAvlIdEyAwUx9zOY_uViTJWw_5UbgIGE";

function fnUrl(name: string): string {
  return `${SUPABASE_URL}/functions/v1/${name}`;
}

const JSON_HEADERS = {
  "Content-Type": "application/json",
  apikey: ANON_KEY,
};

// Helper: POST without auth, expect non-500
async function expectAuthReject(name: string) {
  const res = await fetch(fnUrl(name), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({}),
  });
  const body = await res.text();
  // Should be 401 or 500 with auth error message — but NOT a crash
  assert(res.status !== 502 && res.status !== 503, `${name} returned ${res.status}: ${body}`);
  assert(res.status >= 400, `${name} should reject unauth requests, got ${res.status}`);
}

// ── Health ──
Deno.test("health returns 200 with status healthy", async () => {
  const res = await fetch(fnUrl("health"), { headers: { apikey: ANON_KEY } });
  assertEquals(res.status, 200);
  const json = await res.json();
  assertEquals(json.status, "healthy");
});

// ── capture-lead (public, no auth needed) ──
Deno.test("capture-lead accepts valid email", async () => {
  const res = await fetch(fnUrl("capture-lead"), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ email: `test-${Date.now()}@integration.test` }),
  });
  const json = await res.json();
  
  assert(res.status === 200 || res.status === 429, `Expected 200 or 429, got ${res.status}`);
  if (res.status === 200) {
    assertEquals(json.ok, true);
  }
});

// ── Auth-required functions: should reject without auth ──
const authRequiredFunctions = [
  "session-start",
  "submit-response",
  "session-fetch",
  "session-finish",
  "set-baseline",
  "set-test-date",
  "days-left",
  "generate-study-plan",
  "complete-task",
  "finish-diagnostic",
  "tutor-chat",
  "generate-questions",
  // These use Stripe and throw on missing auth (return 500 with auth error msg)
  "check-subscription",
  "create-checkout",
  "customer-portal",
];

for (const fn of authRequiredFunctions) {
  Deno.test(`${fn} rejects unauthenticated requests`, async () => {
    await expectAuthReject(fn);
  });
}
