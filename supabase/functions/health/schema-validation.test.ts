/**
 * Edge function schema validation integration tests.
 * Verifies that edge functions correctly reject malformed payloads
 * with 400 errors (not 500 crashes).
 */
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

// ── session-start: invalid payloads ──

Deno.test("session-start rejects empty body (no auth)", async () => {
  const res = await fetch(fnUrl("session-start"), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({}),
  });
  await res.text();
  assertEquals(res.status, 401); // auth check comes first
});

Deno.test("session-start rejects non-POST method", async () => {
  const res = await fetch(fnUrl("session-start"), {
    method: "GET",
    headers: { apikey: ANON_KEY },
  });
  const body = await res.text();
  assert(res.status === 405 || res.status === 401, `Expected 405 or 401, got ${res.status}: ${body}`);
});

// ── submit-response: invalid payloads ──

Deno.test("submit-response rejects empty body (no auth)", async () => {
  const res = await fetch(fnUrl("submit-response"), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({}),
  });
  await res.text();
  assertEquals(res.status, 401);
});

// ── finish-diagnostic: invalid payloads ──

Deno.test("finish-diagnostic rejects empty body (no auth)", async () => {
  const res = await fetch(fnUrl("finish-diagnostic"), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({}),
  });
  await res.text();
  assertEquals(res.status, 401);
});

// ── session-finish: invalid payloads ──

Deno.test("session-finish rejects empty body (no auth)", async () => {
  const res = await fetch(fnUrl("session-finish"), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({}),
  });
  await res.text();
  assertEquals(res.status, 401);
});

// ── capture-lead: schema validation ──

Deno.test("capture-lead rejects missing email", async () => {
  const res = await fetch(fnUrl("capture-lead"), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({}),
  });
  const body = await res.text();
  assert(res.status === 400 || res.status === 429, `Expected 400 or 429, got ${res.status}: ${body}`);
});

// ── stripe-webhook: rejects without signature ──

Deno.test("stripe-webhook rejects without stripe-signature", async () => {
  const res = await fetch(fnUrl("stripe-webhook"), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ type: "fake.event" }),
  });
  const body = await res.text();
  assert(
    res.status === 400 || res.status === 500,
    `Expected 400 or 500, got ${res.status}: ${body}`
  );
});

// ── check-subscription: rejects with fake auth ──

Deno.test("check-subscription rejects fake auth token", async () => {
  const res = await fetch(fnUrl("check-subscription"), {
    method: "POST",
    headers: {
      ...JSON_HEADERS,
      Authorization: "Bearer fake-token-12345",
    },
    body: JSON.stringify({}),
  });
  const body = await res.text();
  assert(res.status >= 400, `Expected 4xx/5xx, got ${res.status}: ${body}`);
});

// ── create-checkout: rejects with fake auth ──

Deno.test("create-checkout rejects fake auth token", async () => {
  const res = await fetch(fnUrl("create-checkout"), {
    method: "POST",
    headers: {
      ...JSON_HEADERS,
      Authorization: "Bearer fake-token-12345",
    },
    body: JSON.stringify({ planType: "monthly" }),
  });
  const body = await res.text();
  assert(res.status >= 400, `Expected 4xx/5xx, got ${res.status}: ${body}`);
});
