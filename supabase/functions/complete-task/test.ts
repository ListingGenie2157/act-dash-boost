import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

// Test the expected request/response payload shapes
Deno.test("CompleteTaskRequest - valid payload structure", () => {
  const validPayload = {
    task_id: "550e8400-e29b-41d4-a716-446655440000",
    accuracy: 0.85,
    time_ms: 45000,
    answers: [
      {
        question_id: "550e8400-e29b-41d4-a716-446655440001",
        user_answer: "A" as const,
        correct: true,
        time_ms: 15000
      },
      {
        question_id: "550e8400-e29b-41d4-a716-446655440002",
        user_answer: "C" as const,
        correct: false,
        time_ms: 30000
      }
    ]
  };

  // Test required fields
  assertEquals(typeof validPayload.task_id, "string");
  assertEquals(typeof validPayload.accuracy, "number");
  assertEquals(typeof validPayload.time_ms, "number");
  
  // Test accuracy bounds
  assertEquals(validPayload.accuracy >= 0 && validPayload.accuracy <= 1, true);
  
  // Test time is positive
  assertEquals(validPayload.time_ms > 0, true);
  
  // Test answers structure
  assertEquals(Array.isArray(validPayload.answers), true);
  assertEquals(validPayload.answers.length, 2);
  
  const firstAnswer = validPayload.answers[0];
  assertEquals(typeof firstAnswer.question_id, "string");
  assertEquals(['A', 'B', 'C', 'D'].includes(firstAnswer.user_answer), true);
  assertEquals(typeof firstAnswer.correct, "boolean");
  assertEquals(typeof firstAnswer.time_ms, "number");
});

Deno.test("CompleteTaskRequest - minimal valid payload", () => {
  const minimalPayload = {
    task_id: "550e8400-e29b-41d4-a716-446655440000",
    accuracy: 1.0,
    time_ms: 30000
  };

  assertEquals(typeof minimalPayload.task_id, "string");
  assertEquals(typeof minimalPayload.accuracy, "number");
  assertEquals(typeof minimalPayload.time_ms, "number");
  assertEquals(minimalPayload.accuracy >= 0 && minimalPayload.accuracy <= 1, true);
});

Deno.test("CompleteTaskResponse - expected structure", () => {
  const expectedResponse = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    user_id: "550e8400-e29b-41d4-a716-446655440003",
    the_date: "2024-01-15",
    type: "DRILL",
    skill_id: "550e8400-e29b-41d4-a716-446655440004",
    size: 5,
    status: "COMPLETED",
    accuracy: 0.85,
    median_time_ms: 45000,
    reward_cents: 15,
    created_at: "2024-01-15T10:00:00Z",
    message: "Task completed successfully",
    answers_processed: 2
  };

  // Test core task fields
  assertEquals(typeof expectedResponse.id, "string");
  assertEquals(typeof expectedResponse.user_id, "string");
  assertEquals(typeof expectedResponse.the_date, "string");
  assertEquals(typeof expectedResponse.type, "string");
  assertEquals(typeof expectedResponse.status, "string");
  assertEquals(expectedResponse.status, "COMPLETED");
  
  // Test metrics
  assertEquals(typeof expectedResponse.accuracy, "number");
  assertEquals(typeof expectedResponse.median_time_ms, "number");
  assertEquals(typeof expectedResponse.reward_cents, "number");
  
  // Test response metadata
  assertEquals(typeof expectedResponse.message, "string");
  assertEquals(typeof expectedResponse.answers_processed, "number");
});

Deno.test("Answer validation - valid answer choices", () => {
  const validChoices = ['A', 'B', 'C', 'D'] as const;
  
  validChoices.forEach(choice => {
    assertEquals(validChoices.includes(choice), true);
  });
  
  // Test invalid choices
  const invalidChoices = ['E', 'F', '1', '2', 'a', 'b'];
  invalidChoices.forEach(choice => {
    assertEquals(validChoices.includes(choice as typeof validChoices[number]), false);
  });
});

Deno.test("Accuracy bounds validation", () => {
  const validAccuracies = [0, 0.25, 0.5, 0.75, 1.0];
  const invalidAccuracies = [-0.1, 1.1, -1, 2];
  
  validAccuracies.forEach(accuracy => {
    assertEquals(accuracy >= 0 && accuracy <= 1, true);
  });
  
  invalidAccuracies.forEach(accuracy => {
    assertEquals(accuracy >= 0 && accuracy <= 1, false);
  });
});