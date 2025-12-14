import { assertEquals, assertThrows } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { nextInterval, getTodayInChicago } from "./review.ts";

// Test nextInterval function
Deno.test("nextInterval - MASTERY mode progression", () => {
  // Test normal progression: 1 -> 4 -> 10 -> 21
  assertEquals(nextInterval('MASTERY', 0, false), 1);
  assertEquals(nextInterval('MASTERY', 1, false), 4);
  assertEquals(nextInterval('MASTERY', 4, false), 10);
  assertEquals(nextInterval('MASTERY', 10, false), 21);
  assertEquals(nextInterval('MASTERY', 21, false), 21); // Stay at max
});

Deno.test("nextInterval - MASTERY mode with lapses", () => {
  // Test that lapses reset to beginning
  assertEquals(nextInterval('MASTERY', 4, true), 1);
  assertEquals(nextInterval('MASTERY', 10, true), 1);
  assertEquals(nextInterval('MASTERY', 21, true), 1);
});

Deno.test("nextInterval - MASTERY mode unknown interval", () => {
  // Test unknown interval defaults to beginning
  assertEquals(nextInterval('MASTERY', 7, false), 1);
  assertEquals(nextInterval('MASTERY', 15, false), 1);
});

Deno.test("nextInterval - CRASH mode progression", () => {
  // Test normal progression: 0 -> 1 -> 3
  assertEquals(nextInterval('CRASH', -1, false), 0);
  assertEquals(nextInterval('CRASH', 0, false), 1);
  assertEquals(nextInterval('CRASH', 1, false), 3);
  assertEquals(nextInterval('CRASH', 3, false), 3); // Stay at max
});

Deno.test("nextInterval - CRASH mode with lapses", () => {
  // Test that lapses reset to beginning
  assertEquals(nextInterval('CRASH', 1, true), 0);
  assertEquals(nextInterval('CRASH', 3, true), 0);
});

Deno.test("nextInterval - CRASH mode unknown interval", () => {
  // Test unknown interval defaults to beginning
  assertEquals(nextInterval('CRASH', 2, false), 0);
  assertEquals(nextInterval('CRASH', 5, false), 0);
});

// Test getTodayInChicago function
Deno.test("getTodayInChicago - returns valid date string", () => {
  const today = getTodayInChicago();
  
  // Should be in YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  assertEquals(dateRegex.test(today), true);
  
  // Should be a valid date
  const parsedDate = new Date(today);
  assertEquals(isNaN(parsedDate.getTime()), false);
});

Deno.test("getTodayInChicago - format consistency", () => {
  const today = getTodayInChicago();
  
  // Should have exactly 10 characters (YYYY-MM-DD)
  assertEquals(today.length, 10);
  
  // Should have dashes in correct positions
  assertEquals(today[4], '-');
  assertEquals(today[7], '-');
  
  // Year should be 4 digits
  const year = parseInt(today.substring(0, 4));
  assertEquals(year >= 2024, true);
  
  // Month should be 01-12
  const month = parseInt(today.substring(5, 7));
  assertEquals(month >= 1 && month <= 12, true);
  
  // Day should be 01-31
  const day = parseInt(today.substring(8, 10));
  assertEquals(day >= 1 && day <= 31, true);
});