import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { selectPlaylist, calculateDaysLeft, getTodayInChicago } from "./index.ts";

interface Task {
  type: 'REVIEW' | 'DRILL' | 'LEARN';
  skillId?: string;
  questionId?: string;
  size: number;
  estimatedMins: number;
  priority: number;
}

Deno.test("selectPlaylist - fits within time cap", () => {
  const tasks: Task[] = [
    { type: 'REVIEW', size: 1, estimatedMins: 5, priority: 100 },
    { type: 'DRILL', size: 5, estimatedMins: 10, priority: 90 },
    { type: 'LEARN', size: 3, estimatedMins: 8, priority: 80 }
  ];
  
  const result = selectPlaylist(tasks, 25);
  assertEquals(result.length, 3);
  assertEquals(result.reduce((sum, t) => sum + t.estimatedMins, 0), 23);
});

Deno.test("selectPlaylist - respects time cap", () => {
  const tasks: Task[] = [
    { type: 'REVIEW', size: 1, estimatedMins: 15, priority: 100 },
    { type: 'DRILL', size: 5, estimatedMins: 12, priority: 90 },
    { type: 'LEARN', size: 3, estimatedMins: 10, priority: 80 }
  ];
  
  const result = selectPlaylist(tasks, 20);
  assertEquals(result.length, 1);
  assertEquals(result[0].estimatedMins, 15);
});

Deno.test("selectPlaylist - max 3 tasks", () => {
  const tasks: Task[] = [
    { type: 'REVIEW', size: 1, estimatedMins: 2, priority: 100 },
    { type: 'DRILL', size: 1, estimatedMins: 2, priority: 90 },
    { type: 'LEARN', size: 1, estimatedMins: 2, priority: 80 },
    { type: 'REVIEW', size: 1, estimatedMins: 2, priority: 70 },
    { type: 'DRILL', size: 1, estimatedMins: 2, priority: 60 }
  ];
  
  const result = selectPlaylist(tasks, 60);
  assertEquals(result.length, 3);
});

Deno.test("selectPlaylist - empty list", () => {
  const result = selectPlaylist([], 30);
  assertEquals(result.length, 0);
});

Deno.test("selectPlaylist - no tasks fit", () => {
  const tasks: Task[] = [
    { type: 'REVIEW', size: 1, estimatedMins: 25, priority: 100 },
    { type: 'DRILL', size: 5, estimatedMins: 30, priority: 90 }
  ];
  
  const result = selectPlaylist(tasks, 20);
  assertEquals(result.length, 0);
});

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