import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { passCancelAt } from "./stripeConfig.ts";

const TRIAL_END = 1_800_000_000; // unix seconds
const DAY = 86_400;

Deno.test("passCancelAt - 90-day pass ends one paid period after the trial", () => {
  assertEquals(passCancelAt("90_day", TRIAL_END), TRIAL_END + 90 * DAY);
});

Deno.test("passCancelAt - 12-month pass ends 365 days after the trial", () => {
  assertEquals(passCancelAt("12_month", TRIAL_END), TRIAL_END + 365 * DAY);
});

Deno.test("passCancelAt - monthly renews, so no end date", () => {
  assertEquals(passCancelAt("monthly", TRIAL_END), null);
});

Deno.test("passCancelAt - no trial end means no end date", () => {
  assertEquals(passCancelAt("90_day", null), null);
});
