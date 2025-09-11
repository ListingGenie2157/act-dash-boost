import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { calculateDaysLeft, getTodayInChicago } from "./index.ts";

Deno.test("calculateDaysLeft - future date", () => {
  const today = new Date(2024, 0, 15); // Jan 15, 2024
  const testDate = new Date(2024, 0, 20); // Jan 20, 2024
  const result = calculateDaysLeft(today, testDate);
  assertEquals(result, 5);
});

Deno.test("calculateDaysLeft - same day", () => {
  const today = new Date(2024, 0, 15);
  const testDate = new Date(2024, 0, 15);
  const result = calculateDaysLeft(today, testDate);
  assertEquals(result, 0);
});

Deno.test("calculateDaysLeft - past date", () => {
  const today = new Date(2024, 0, 15);
  const testDate = new Date(2024, 0, 10);
  const result = calculateDaysLeft(today, testDate);
  assertEquals(result, -5);
});

Deno.test("calculateDaysLeft - null test date", () => {
  const today = new Date(2024, 0, 15);
  const result = calculateDaysLeft(today, null);
  assertEquals(result, null);
});

Deno.test("getTodayInChicago - returns valid date", () => {
  const today = getTodayInChicago();
  assertEquals(today instanceof Date, true);
  assertEquals(isNaN(today.getTime()), false);
  // Should be a date with time at 00:00:00
  assertEquals(today.getHours(), 0);
  assertEquals(today.getMinutes(), 0);
  assertEquals(today.getSeconds(), 0);
});