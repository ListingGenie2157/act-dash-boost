import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { validateTestDate } from "./index.ts";

Deno.test("validateTestDate - valid future date", () => {
  // Use a date far in the future to avoid timezone issues
  const result = validateTestDate("2030-12-25");
  assertEquals(result.isValid, true);
  assertEquals(result.error, undefined);
  assertEquals(result.date instanceof Date, true);
});

Deno.test("validateTestDate - invalid format", () => {
  const result = validateTestDate("12/25/2024");
  assertEquals(result.isValid, false);
  assertEquals(result.error, "Date must be in YYYY-MM-DD format");
});

Deno.test("validateTestDate - invalid date", () => {
  const result = validateTestDate("2024-13-45");
  assertEquals(result.isValid, false);
  assertEquals(result.error, "Invalid date provided");
});

Deno.test("validateTestDate - past date", () => {
  const result = validateTestDate("2020-01-01");
  assertEquals(result.isValid, false);
  assertEquals(result.error, "Test date cannot be in the past");
});

Deno.test("validateTestDate - empty string", () => {
  const result = validateTestDate("");
  assertEquals(result.isValid, false);
  assertEquals(result.error, "Date must be in YYYY-MM-DD format");
});

Deno.test("validateTestDate - invalid format with extra characters", () => {
  const result = validateTestDate("2024-12-25T00:00:00");
  assertEquals(result.isValid, false);
  assertEquals(result.error, "Date must be in YYYY-MM-DD format");
});