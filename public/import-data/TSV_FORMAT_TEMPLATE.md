# ACT Question Import TSV Format Template

## Question Fields (Required and Optional)

### Required Fields
- `ord` - Question order number (integer)
- `question` - Question stem/text
- `choice_a` - Choice A text
- `choice_b` - Choice B text
- `choice_c` - Choice C text
- `choice_d` - Choice D text
- `answer` - Correct answer (A, B, C, D, or E)
- `skill_code` - Skill identifier
- `difficulty` - Difficulty level (1-5 or Easy/Medium/Hard)
- `section` - Section code (ENG, MATH, READ, SCI)
- `form_id` - Form identifier (e.g., FA_MA)

### Optional Fields

#### General
- `explanation` - Answer explanation
- `choice_e` - Choice E text (for 5-option Math questions)

#### Images
- `image_url` - URL or path to question image
- `image_caption` - Caption for the image
- `image_position` - Position: "above_question", "below_question", "inline"

#### Math-Specific
- `calculator_allowed` - TRUE/FALSE (whether calculator is allowed)

#### English-Specific
- `underlined_text` - The underlined portion being tested
- `reference_number` - Reference number in passage (integer)
- `position_in_passage` - Position within passage (integer)

#### Passages
- `passage_id` - Unique passage identifier (links question to passage)
- `passage_title` - Passage title (only needed once per passage)
- `passage_text` - Full passage text (only needed once per passage)
- `passage_format` - "Single", "Paired", "Comparative" (for Reading/Science)
- `passage_type` - "Literary Narrative", "Social Science", "Humanities", "Natural Science", "Conflicting Viewpoints", "Data Representation", "Research Summary"
- `has_charts` - TRUE/FALSE (whether passage includes charts/graphs)
- `chart_images` - JSON array of chart image URLs, e.g., ["url1.png", "url2.png"]
- `marked_text` - JSON object for inline references, e.g., {"5": "marked text here"}
- `line_numbers_enabled` - TRUE/FALSE (whether to show line numbers)

## Example TSV Format

### English Question Example
```tsv
ord	question	underlined_text	reference_number	position_in_passage	choice_a	choice_b	choice_c	choice_d	answer	skill_code	difficulty	explanation	section	form_id	passage_id
1	Choose the best alternative for the underlined portion.	goes to	5	12	goes to	is going to	went to	has gone to	B	ENG.001	2	The present progressive "is going to" indicates ongoing action in context.	ENG	FA_EN	P001
```

### Math Question Example (with calculator, 5 choices)
```tsv
ord	question	choice_a	choice_b	choice_c	choice_d	choice_e	answer	calculator_allowed	skill_code	difficulty	explanation	section	form_id	image_url
1	What is the value of x if 2x + 5 = 15?	3	5	7	10	12	B	TRUE	MATH.001	1	Subtract 5 from both sides: 2x = 10. Divide by 2: x = 5	MATH	FA_MA	
```

### Reading Question Example (with passage metadata)
```tsv
ord	question	choice_a	choice_b	choice_c	choice_d	answer	skill_code	difficulty	section	form_id	passage_id	passage_title	passage_text	passage_format	passage_type	line_numbers_enabled
1	The main purpose of the passage is to:	describe a historical event	analyze a literary technique	argue for a policy change	explain a scientific concept	D	READ.001	3	READ	FA_RE	P001	The Nature of Light	[Full passage text here...]	Single	Natural Science	TRUE
2	According to the passage, which of the following is true?	choice text	choice text	choice text	choice text	A	READ.002	2	READ	FA_RE	P001				
```

### Science Question Example (with charts)
```tsv
ord	question	choice_a	choice_b	choice_c	choice_d	answer	skill_code	difficulty	section	form_id	passage_id	passage_title	passage_text	passage_format	passage_type	has_charts	chart_images
1	Based on Figure 1, what is the relationship between temperature and pressure?	directly proportional	inversely proportional	no relationship	exponential	A	SCI.001	2	SCI	FA_SC	P001	Experiment 1: Gas Properties	[Experiment description...]	Data Representation	Natural Science	TRUE	["https://example.com/chart1.png"]
```

## Notes

1. **TSV Format**: Use TAB characters to separate columns (not spaces or commas)
2. **Boolean Values**: Use TRUE/FALSE (case-insensitive)
3. **JSON Fields**: For `chart_images` and `marked_text`, use valid JSON syntax
4. **Passage Data**: Only include passage fields (passage_title, passage_text, etc.) on the FIRST question of that passage
5. **Empty Fields**: Leave empty for optional fields (just use consecutive tabs)
6. **Line Breaks**: For multi-line text, use `\n` or ensure your TSV editor preserves line breaks properly
7. **Special Characters**: Escape tabs in content as `\t` and quotes as `\"`

## Importing

1. Navigate to `/admin-import`
2. Select your section (English, Math, Reading, Science)
3. Upload the TSV file
4. Review the preview
5. Click "Import" to load into staging_items table
