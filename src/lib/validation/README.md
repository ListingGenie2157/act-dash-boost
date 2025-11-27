# Input Validation

This directory contains Zod validation schemas for ensuring data integrity throughout the application.

## Edge Function Schemas (`edgeFunctionSchemas.ts`)

Validation schemas for all edge function inputs to prevent invalid data from being sent to the backend.

### Available Schemas

#### `diagnosticFormIdSchema`
Validates diagnostic test form IDs
```typescript
import { validateInput, diagnosticFormIdSchema } from '@/lib/validation/edgeFunctionSchemas';

const { formId } = validateInput(diagnosticFormIdSchema, { formId: 'D2EN' });
```

#### `drillRunnerSchema`
Validates drill runner parameters (subject and number of questions)
```typescript
import { safeValidateInput, drillRunnerSchema } from '@/lib/validation/edgeFunctionSchemas';

const result = safeValidateInput(drillRunnerSchema, { 
  subject: 'Math', 
  n: 20 
});

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

#### `sessionStartSchema`
Validates session-start edge function parameters
```typescript
const validatedInput = validateInput(sessionStartSchema, {
  form_id: 'EN_A',
  section: 'english',
  coached: true
});
```

#### `submitResponseSchema`
Validates submit-response edge function parameters
```typescript
const validatedInput = validateInput(submitResponseSchema, {
  session_id: 'uuid-here',
  question_id: 'q-123',
  selected: 'A',
  time_ms: 15000
});
```

#### `sessionFinishSchema`
Validates session-finish edge function parameters
```typescript
const validatedInput = validateInput(sessionFinishSchema, {
  session_id: 'uuid-here'
});
```

### Helper Functions

#### `validateInput(schema, data, context?)`
Validates input and throws a user-friendly error if validation fails
```typescript
try {
  const validated = validateInput(mySchema, data, 'User registration');
  // Use validated.data
} catch (error) {
  // error.message contains user-friendly validation errors
  toast({ title: 'Validation Error', description: error.message });
}
```

#### `safeValidateInput(schema, data)`
Validates input and returns a result object (doesn't throw)
```typescript
const result = safeValidateInput(mySchema, data);

if (result.success) {
  // Use result.data
} else {
  // Handle result.error
}
```

## Benefits

1. **Type Safety**: Full TypeScript support with inferred types
2. **User-Friendly Errors**: Clear error messages for end users
3. **Security**: Prevents invalid data from reaching the backend
4. **Consistency**: Centralized validation logic
5. **Documentation**: Schema serves as documentation for expected inputs

## Adding New Schemas

1. Define the schema using Zod:
```typescript
export const myNewSchema = z.object({
  field: z.string().min(1, 'Field is required')
});

export type MyNewInput = z.infer<typeof myNewSchema>;
```

2. Use it in your component:
```typescript
import { validateInput, myNewSchema } from '@/lib/validation/edgeFunctionSchemas';

const validated = validateInput(myNewSchema, userData);
```

## Testing

All validation schemas should be tested with:
- Valid inputs
- Invalid inputs (to verify error messages)
- Edge cases (empty strings, nulls, extreme values)
