import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import {
  calculateDaysLeft,
  chooseWeakSkills,
  getTodayInChicago,
  selectLessonsForDay,
  selectPlaylist,
} from "./index.ts";

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

Deno.test("selectPlaylist - optional subject cap prevents monotony", () => {
  const tasks: Task[] = [
    {
      type: "LEARN",
      skillId: "math-1",
      size: 1,
      estimatedMins: 5,
      priority: 100,
    },
    {
      type: "DRILL",
      skillId: "math-2",
      size: 1,
      estimatedMins: 5,
      priority: 90,
    },
    {
      type: "DRILL",
      skillId: "math-3",
      size: 1,
      estimatedMins: 5,
      priority: 80,
    },
    {
      type: "LEARN",
      skillId: "english-1",
      size: 1,
      estimatedMins: 5,
      priority: 70,
    },
  ];

  const result = selectPlaylist(
    tasks,
    60,
    (task) => task.skillId?.startsWith("math") ? "Math" : "English",
  );

  assertEquals(result.map((task) => task.skillId), [
    "math-1",
    "math-2",
    "english-1",
  ]);
});

Deno.test("selectLessonsForDay - weights weak diagnostic subjects with daily cap", () => {
  const skills = [
    {
      id: "math-1",
      subject: "Math",
      name: "Linear Equations",
      cluster: "Algebra",
      order_index: 1,
    },
    {
      id: "math-2",
      subject: "Math",
      name: "Quadratics",
      cluster: "Algebra",
      order_index: 2,
    },
    {
      id: "math-3",
      subject: "Math",
      name: "Triangles",
      cluster: "Geometry",
      order_index: 3,
    },
    {
      id: "english-1",
      subject: "English",
      name: "Punctuation",
      cluster: "Grammar",
      order_index: 4,
    },
    {
      id: "reading-1",
      subject: "Reading",
      name: "Main Ideas",
      cluster: "Comprehension",
      order_index: 5,
    },
  ];

  const result = selectLessonsForDay(
    3,
    0,
    [{ section: "Math", score: 0.42 }],
    skills,
    new Set<string>(),
  );

  assertEquals(result, ["math-1", "math-2", "english-1"]);
});

Deno.test("chooseWeakSkills - returns skill ids from low diagnostic sections", () => {
  const skills = [
    {
      id: "math-1",
      subject: "Math",
      name: "Linear Equations",
      cluster: "Algebra",
      order_index: 1,
    },
    {
      id: "math-2",
      subject: "Math",
      name: "Quadratics",
      cluster: "Algebra",
      order_index: 2,
    },
    {
      id: "math-3",
      subject: "Math",
      name: "Triangles",
      cluster: "Geometry",
      order_index: 3,
    },
    {
      id: "english-1",
      subject: "English",
      name: "Punctuation",
      cluster: "Grammar",
      order_index: 4,
    },
  ];

  const result = chooseWeakSkills(
    [{ section: "Math", score: 0.5 }],
    [],
    skills,
  );

  assertEquals(result, ["math-1", "math-2", "math-3"]);
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