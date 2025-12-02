"""
ACT Math Test Question Generator

This script generates ACT Math test questions using OpenAI's API.

QUALITY CONTROLS:
- Rejects explanations containing self-doubt language ("I miscalculated", "closest answer", etc.)
- Validates that the calculated answer in the explanation matches the answer_letter
- Tracks previously generated questions to avoid duplicates
- Retries up to 5 times if validation fails
- Uses strict prompts that require solving correctly FIRST, then creating matching choices

The model is instructed to:
1. Solve the problem completely and get a numerical answer
2. Create 5 answer choices where ONE matches the calculated answer
3. Set answer_letter to point to the correct choice
4. Write a definitive explanation ending with "Therefore, the answer is X, which is choice Y"
"""

import csv
import json
import os
import random
import re
from dataclasses import dataclass
from typing import Any, List, Dict, Optional

# --------- OpenAI client ---------
from openai import OpenAI

client = OpenAI()  # uses OPENAI_API_KEY from environment


# --------- Config / blueprint ---------

@dataclass
class QuestionSlot:
    ord: int
    topic_group: str
    difficulty: str
    is_word_problem: bool
    has_visual: bool
    niche_tag: Optional[str] = None


TOPIC_GROUPS = [
    "PreAlgebraElemAlg",
    "IntermediateAlgFunctions",
    "CoordinateGeometry",
    "PlaneGeometry",
    "Trigonometry",
]

MATH_SIM_BLUEPRINT = {
    "num_questions": 60,
    "topic_counts": {
        # target ranges: PreAlg 20–25, InterAlg 15–20, Coord 9–10, Plane 10–12, Trig 4–5
        "PreAlgebraElemAlg": 20,
        "IntermediateAlgFunctions": 16,
        "CoordinateGeometry": 9,
        "PlaneGeometry": 10,
        "Trigonometry": 5,
    },
    # Global targets
    "word_problem_target": 21,  # 30–40% of 60
    "visual_target": 18,        # ~30% of 60
}

NICHE_TOPIC_COUNTS = {
    "logarithms": 2,
    "matrices": 2,
    "vectors": 1,
    "complex numbers": 2,
    "ellipses and hyperbolas": 1,
    "permutations and combinations": 2,
}

HEADERS = [
    "ord",
    "form_id",
    "section",
    "skill_code",
    "difficulty",
    "question",
    "choice_a",
    "choice_b",
    "choice_c",
    "choice_d",
    "choice_e",
    "answer",
    "explanation",
    "underlined_text",
    "reference_number",
    "position_in_passage",
    "calculator_allowed",
    "passage_id",
    "passage_title",
    "passage_text",
    "passage_format",
    "passage_type",
    "has_charts",
    "chart_images",
    "marked_text",
    "line_numbers_enabled",
    "image_url",
    "image_caption",
    "image_position",
]


# --------- Plan generation ---------

def assign_difficulty(qnum: int) -> str:
    if qnum <= 20:
        return "Easy"
    elif qnum <= 40:
        return "Medium"
    else:
        return "Hard"


def build_topic_slots() -> List[str]:
    slots: List[str] = []
    for topic_group, count in MATH_SIM_BLUEPRINT["topic_counts"].items():
        slots.extend([topic_group] * count)

    if len(slots) != MATH_SIM_BLUEPRINT["num_questions"]:
        raise ValueError(f"Topic count mismatch, got {len(slots)} slots")

    random.shuffle(slots)
    return slots


def build_plan_without_niches() -> List[QuestionSlot]:
    slots = build_topic_slots()

    word_target = MATH_SIM_BLUEPRINT["word_problem_target"]
    visual_target = MATH_SIM_BLUEPRINT["visual_target"]
    num_word = 0
    num_visual = 0

    plan: List[QuestionSlot] = []

    for idx, topic_group in enumerate(slots, start=1):
        difficulty = assign_difficulty(idx)

        # Word problem heuristic
        if topic_group in ["PreAlgebraElemAlg", "IntermediateAlgFunctions"]:
            base_word_prob = 0.5
        else:
            base_word_prob = 0.25

        word_prob = random.random() < base_word_prob

        # Enforce global word-problem target roughly
        remaining = MATH_SIM_BLUEPRINT["num_questions"] - idx + 1
        remaining_needed_for_word = max(word_target - num_word, 0)
        if num_word >= word_target:
            word_prob = False
        elif remaining == remaining_needed_for_word:
            word_prob = True

        if word_prob:
            num_word += 1

        # Visual / chart heuristic
        if topic_group in ["CoordinateGeometry", "PlaneGeometry", "Trigonometry"]:
            base_visual_prob = 0.6
        else:
            base_visual_prob = 0.1

        has_visual = random.random() < base_visual_prob

        # Enforce global visual target roughly
        remaining_visual_needed = max(visual_target - num_visual, 0)
        if num_visual >= visual_target:
            has_visual = False
        elif remaining == remaining_visual_needed:
            has_visual = True

        if has_visual:
            num_visual += 1

        plan.append(
            QuestionSlot(
                ord=idx,
                topic_group=topic_group,
                difficulty=difficulty,
                is_word_problem=word_prob,
                has_visual=has_visual,
            )
        )

    print(f"Word problems: {num_word} / {MATH_SIM_BLUEPRINT['num_questions']}")
    print(f"Visual / chart questions: {num_visual} / {MATH_SIM_BLUEPRINT['num_questions']}")
    return plan


def assign_niche_tags(plan: List[QuestionSlot]) -> None:
    eligible_indices = [
        i for i, slot in enumerate(plan)
        if slot.topic_group in ["IntermediateAlgFunctions", "CoordinateGeometry"]
    ]

    random.shuffle(eligible_indices)
    idx_iter = iter(eligible_indices)

    counts_used: Dict[str, int] = {k: 0 for k in NICHE_TOPIC_COUNTS}

    for niche, target in NICHE_TOPIC_COUNTS.items():
        for _ in range(target):
            try:
                slot_index = next(idx_iter)
            except StopIteration:
                break
            plan[slot_index].niche_tag = niche
            counts_used[niche] += 1

    print("Niche topic counts:", counts_used)


def write_plan_csv(plan: List[QuestionSlot], path: str = "math_sim_plan.csv") -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["ord", "topic_group", "difficulty", "is_word_problem", "has_visual", "niche_tag"])
        for slot in plan:
            writer.writerow([
                getattr(slot, "ordinal", slot.ord),
                slot.topic_group,
                slot.difficulty,
                str(slot.is_word_problem),
                str(slot.has_visual),
                slot.niche_tag or "",
            ])


# --------- LLM item generation ---------

SYSTEM_PROMPT = (
    "You are an expert ACT Math item writer. "
    "You ONLY output JSON when asked, and you do not include commentary around it. "
    "CRITICAL RULES:\n"
    "1. Solve the problem correctly FIRST, then create answer choices that include your correct answer.\n"
    "2. NEVER say 'I miscalculated', 'I need to update', 'closest answer', or 'does not match any choice'.\n"
    "3. NEVER use approximation hacks or force answers to fit wrong choices.\n"
    "4. Your explanation must show the EXACT calculation that leads to ONE of the five choices.\n"
    "5. The answer_letter MUST point to the choice that contains your calculated answer.\n"
    "6. If your calculation doesn't match any choice, you MUST regenerate with different numbers/choices.\n"
    "7. Your explanation must be confident and final - no self-doubt or corrections."
)


def build_prompt(slot: QuestionSlot, previous_questions: List[str] = None) -> str:
    parts = []

    parts.append(f"Difficulty: {slot.difficulty}.")
    parts.append(f"Topic group: {slot.topic_group}.")

    if slot.is_word_problem:
        parts.append("Make this a realistic word problem, not just a naked equation.")
    else:
        parts.append("This can be a direct calculation or conceptual math question.")

    if slot.has_visual:
        parts.append(
            "Assume the test booklet shows a simple diagram, graph, or coordinate grid. "
            "In the question text, briefly describe the visual (for example, 'In the figure above, ...'). "
            "The visual should be essential to solving the problem."
        )
    else:
        parts.append("Do NOT rely on any diagram; the question must be solvable from text alone.")

    if slot.niche_tag:
        parts.append(f"Focus the math concept on: {slot.niche_tag}.")

    parts.append(
        "The question must be suitable for the ACT Math section. Use only real numbers (no calculus). "
        "Avoid calculator-only grunt work; the main challenge should be choosing the right approach."
    )

    parts.append(
        "Do NOT use LaTeX, backslashes, or TeX-style formatting. Write math in plain text, like "
        '"f(x) = 3x^2 - 4" or "f(g(2))".'
    )

    # Anti-duplication guidance
    parts.append(
        "CRITICAL: Create a UNIQUE question. Avoid common patterns like: "
        "'If 3x + 5 = 20, what is x?', 'If f(x) = 2x + 3, what is f(4)?', "
        "'bakery sells cakes/cookies/cupcakes', 'Maria planning a party', "
        "'right triangle with legs 6 and 8', or 'triangle area with coordinates (1,2), (5,6), (1,6)'. "
        "Be creative and use different contexts, numbers, and problem structures."
    )

    if previous_questions:
        parts.append(
            f"Here are {min(len(previous_questions), 5)} recently generated questions to AVOID duplicating: "
            + "; ".join(previous_questions[-5:])
        )

    parts.append(
        "MANDATORY WORKFLOW - Follow these steps in order:\n"
        "\n"
        "STEP 1: Write the question text.\n"
        "\n"
        "STEP 2: Solve the problem completely. Calculate the EXACT answer.\n"
        "  Example: For 'If 2x + 5 = 17, what is x?', calculate: 2x = 12, so x = 6\n"
        "  Write down this number: 6\n"
        "\n"
        "STEP 3: Create 5 answer choices. ONE choice MUST contain your exact answer from Step 2.\n"
        "  Example: ['A 4', 'B 5', 'C 6', 'D 7', 'E 8']\n"
        "  Notice: Your answer 6 is in choice C\n"
        "\n"
        "STEP 4: Set answer_letter to the letter of the choice with your answer.\n"
        "  Example: answer_letter = 'C' (because 6 is in choice C)\n"
        "\n"
        "STEP 5: Write explanation ending with: 'Therefore, the answer is [your number], which is choice [letter].'\n"
        "  Example: 'Subtract 5: 2x = 12. Divide by 2: x = 6. Therefore, the answer is 6, which is choice C.'\n"
        "\n"
        "VERIFICATION CHECKLIST before submitting:\n"
        "  [ ] My calculated answer appears in exactly one choice\n"
        "  [ ] answer_letter points to that choice\n"
        "  [ ] Explanation ends with 'Therefore, the answer is X, which is choice Y'\n"
        "  [ ] X matches my calculated answer\n"
        "  [ ] Y matches answer_letter\n"
        "\n"
        "FORBIDDEN PHRASES (never use these):\n"
        "  - 'closest answer', 'approximately', 'does not match'\n"
        "  - 'I miscalculated', 'I need to update', 'I made a mistake'\n"
        "  - 'not in the options', 'not listed', 'must be corrected'"
    )
    
    parts.append(
        "Return ONLY a JSON object with this exact structure (no extra text before or after):\n"
        "{\n"
        '  "question": "string, the question text only",\n'
        '  "choices": ["A choice", "B choice", "C choice", "D choice", "E choice"],\n'
        '  "answer_letter": "C",\n'
        '  "explanation": "string, step-by-step explanation ending with: Therefore, the answer is [exact value], which is choice [letter].",\n'
        '  "image_caption": "short description of the visual if any, else empty string"\n'
        "}\n"
        "VERIFICATION: Before submitting, verify that:\n"
        "1. Your calculated answer appears in exactly one of the 5 choices\n"
        "2. The answer_letter points to that choice\n"
        "3. Your explanation ends with 'Therefore, the answer is [number], which is choice [letter]'\n"
        "4. The number and letter in your explanation match your choices and answer_letter"
    )

    return " ".join(parts)


def _extract_and_fix_json(raw: str) -> Dict[str, Any]:
    """
    Grab the JSON object from the model output and sanitize it so json.loads won't cry.
    """
    if not raw:
        raise ValueError("Empty model response, cannot parse JSON.")

    # Extract the first {...} block
    m = re.search(r"\{.*\}", raw, re.DOTALL)
    if not m:
        raise ValueError(f"No JSON object found in response: {raw[:300]} ...")
    text = m.group(0)

    # Strip control chars
    text = re.sub(r"[\x00-\x1F]+", " ", text)

    # Kill obvious TeX escapes if they still sneak in
    text = text.replace("\\(", "(").replace("\\)", ")")

    # Escape any lone backslashes that are illegal in JSON
    # (i.e., a "\" not followed by a valid escape char)
    text = re.sub(r'\\(?!["\\/bfnrt])', r"\\\\", text)

    try:
        return json.loads(text)
    except Exception as e:
        raise ValueError(f"Model JSON still invalid after cleanup: {text[:400]} ...") from e


def llm_generate_for_slot(slot: QuestionSlot, previous_questions: List[str] = None, use_better_model: bool = False) -> Dict[str, Any]:
    user_prompt = build_prompt(slot, previous_questions)
    
    # Use better model if validation keeps failing
    model = "gpt-4o" if use_better_model else "gpt-4o-mini"

    completion = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.5,  # Balanced for variety and correctness
    )

    raw = completion.choices[0].message.content or ""
    data = _extract_and_fix_json(raw)
    return data


def _contains_invalid_language(explanation: str) -> bool:
    """
    Check if explanation contains self-doubt, corrections, or approximation hacks.
    Returns True if invalid language is found.
    """
    invalid_phrases = [
        "i miscalculated",
        "i need to update",
        "i made a mistake",
        "i mistakenly",
        "i realize i made",
        "i should have",
        "closest answer",
        "closest option",
        "closest choice",
        "does not match",
        "not in the options",
        "not listed",
        "not an option",
        "not provided",
        "must be corrected",
        "will correct",
        "should be corrected",
        "let me recalculate",
        "let's recalculate",
        "upon reviewing",
        "checking again",
        "re-evaluate",
        "recalculate",
        "adjust",
        "fix the answer",
        "change the answer",
        "update the answer",
        "answer letter must be",
        "answer letter will",
        "answer letter should",
    ]
    explanation_lower = explanation.lower()
    return any(phrase in explanation_lower for phrase in invalid_phrases)


def _extract_numeric_answer(text: str) -> Optional[float]:
    """Extract the final numeric answer from text, looking for patterns like 'answer is 5' or 'equals 10'."""
    # Look for patterns like "answer is X", "equals X", "is X", "= X" in the last few sentences
    sentences = text.split(".")
    last_sentences = " ".join(sentences[-2:]).lower()
    
    # Pattern: "answer is 5", "equals 5", "is 5", "= 5", "therefore 5"
    patterns = [
        r'(?:answer|result|solution|value|equals?|is|are)\s*(?:is|are|equals?|=)?\s*\$?(\d+\.?\d*)',
        r'(?:therefore|thus|so|hence)\s+(?:the\s+)?(?:answer|result|value|solution)?\s*(?:is|equals?|=)?\s*\$?(\d+\.?\d*)',
        r'=\s*\$?(\d+\.?\d*)',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, last_sentences)
        if matches:
            try:
                return float(matches[-1])  # Take the last match (most likely the final answer)
            except ValueError:
                continue
    
    return None


def _normalize_choice_text(text: str) -> str:
    """Normalize choice text for comparison (remove labels, units, etc.)."""
    # Remove common prefixes like "A. ", "A) ", "$", units, etc.
    text = re.sub(r'^[A-E][\.\)]\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\$', '', text)
    text = re.sub(r'\s+(?:square\s+)?(?:meters?|feet|units?|degrees?|hours?|weeks?|miles?)\b', '', text, flags=re.IGNORECASE)
    return text.strip()


def _validate_answer_match(explanation: str, answer_letter: str, choices: List[str]) -> bool:
    """
    Check if the explanation's final answer matches the specified answer letter.
    Returns True only if there's a clear match.
    """
    if not explanation or not choices or answer_letter not in "ABCDE":
        return False
    
    # Get the answer choice text
    idx = ord(answer_letter) - ord("A")
    if idx >= len(choices):
        return False
    answer_choice = choices[idx]
    answer_choice_normalized = _normalize_choice_text(answer_choice)
    
    # Try to extract numeric answer from explanation
    numeric_answer = _extract_numeric_answer(explanation)
    
    if numeric_answer is not None:
        # Extract numbers from the answer choice
        choice_numbers = re.findall(r'\d+\.?\d*', answer_choice_normalized)
        if choice_numbers:
            for num_str in choice_numbers:
                try:
                    choice_num = float(num_str)
                    # Allow small floating point differences
                    if abs(numeric_answer - choice_num) < 0.01:
                        return True
                except ValueError:
                    continue
    
    # Check if explanation explicitly states the answer letter
    explanation_lower = explanation.lower()
    sentences = explanation_lower.split(".")
    last_sentences = " ".join(sentences[-3:])  # Check last 3 sentences
    
    # Check for explicit mention of answer letter: "choice A", "answer B", "option C", etc.
    explicit_patterns = [
        f"choice {answer_letter.lower()}",
        f"answer {answer_letter.lower()}",
        f"option {answer_letter.lower()}",
        f"is choice {answer_letter.lower()}",
        f"corresponds to {answer_letter.lower()}",
        f"which is {answer_letter.lower()}",
    ]
    
    if any(pattern in last_sentences for pattern in explicit_patterns):
        # If explicitly stated, also verify the numeric answer matches if we extracted one
        if numeric_answer is not None:
            choice_numbers = re.findall(r'\d+\.?\d*', answer_choice_normalized)
            for num_str in choice_numbers:
                try:
                    choice_num = float(num_str)
                    if abs(numeric_answer - choice_num) < 0.01:
                        return True
                except ValueError:
                    continue
        else:
            # If no numeric extracted but explicitly states the letter, trust it
            return True
    
    # Check if answer choice text appears in explanation
    answer_words = set(re.findall(r'\b\w+\b', answer_choice_normalized.lower()))
    explanation_words = set(re.findall(r'\b\w+\b', last_sentences))
    
    # Remove stop words
    stop_words = {'the', 'is', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'answer', 'choice', 'option', 'which', 'that', 'this'}
    answer_words = answer_words - stop_words
    
    # If significant words match AND explanation mentions the letter
    if answer_words and answer_words.intersection(explanation_words):
        if any(pattern in last_sentences for pattern in explicit_patterns):
            return True
    
    # If answer is very short and appears verbatim in explanation
    if len(answer_choice_normalized) <= 15:
        # Check if the core content appears
        answer_core = re.sub(r'[^\w\s]', '', answer_choice_normalized).strip().lower()
        explanation_core = re.sub(r'[^\w\s]', '', last_sentences)
        if answer_core and answer_core in explanation_core:
            return True
    
    # If we can't validate, be strict - return False
    return False


def llm_generate_math_item(slot: QuestionSlot, previous_questions: List[str] = None, max_retries: int = 3, use_better_model: bool = False) -> Dict[str, Any]:
    """
    Generate a math item with validation and retry logic.
    """
    for attempt in range(max_retries):
        # Use better model on last 2 attempts if still failing
        use_better = use_better_model or (attempt >= max_retries - 2)
        data = llm_generate_for_slot(slot, previous_questions, use_better_model=use_better)

        # Question text
        question = data.get("question", "")
        if isinstance(question, list):
            question = " ".join(str(part).strip() for part in question)
        else:
            question = str(question)
        question = " ".join(question.splitlines()).strip()

        if not question:
            if attempt < max_retries - 1:
                continue
            raise ValueError("Generated empty question after retries")

        # Explanation
        explanation = data.get("explanation", "")
        if isinstance(explanation, list):
            explanation = " ".join(str(part).strip() for part in explanation)
        else:
            explanation = str(explanation)
        explanation = " ".join(explanation.splitlines()).strip()

        # Choices
        choices = data.get("choices", [])
        if not isinstance(choices, list):
            choices = [choices]

        choices = [str(c).strip() for c in choices]
        if len(choices) < 5:
            choices += [f"Choice {i}" for i in range(len(choices) + 1, 6)]
        choices = choices[:5]

        # Answer mapping
        raw_answer = str(data.get("answer_letter", "C")).strip()
        if raw_answer in ["1", "2", "3", "4", "5"]:
            idx = int(raw_answer) - 1
            answer_letter = "ABCDE"[idx]
        elif raw_answer.upper() in list("ABCDE"):
            answer_letter = raw_answer.upper()
        else:
            answer_letter = "C"

        # Validate explanation doesn't contain invalid language
        if _contains_invalid_language(explanation):
            if attempt < max_retries - 1:
                print(f"  Retry {attempt + 1}/{max_retries}: Invalid language detected, regenerating...")
                continue
            else:
                error_msg = (
                    f"Question {slot.ord} REJECTED after {max_retries} attempts. "
                    f"Explanation contains self-doubt language (e.g., 'I miscalculated', 'closest answer'). "
                    f"This indicates the model is forcing answers to fit choices rather than solving correctly."
                )
                print(f"ERROR: {error_msg}")
                raise ValueError(error_msg)

        # Validate answer matches explanation
        validation_result = _validate_answer_match(explanation, answer_letter, choices)
        if not validation_result:
            if attempt < max_retries - 1:
                # Show debug info on retry
                idx = ord(answer_letter) - ord('A')
                selected_choice = choices[idx] if idx < len(choices) else 'N/A'
                numeric_answer = _extract_numeric_answer(explanation)
                print(f"  Retry {attempt + 1}/{max_retries}: Answer mismatch detected")
                print(f"    Answer letter: {answer_letter}, Selected choice: {selected_choice}")
                print(f"    Extracted numeric from explanation: {numeric_answer}")
                print(f"    Regenerating...")
                continue
            else:
                idx = ord(answer_letter) - ord('A')
                selected_choice = choices[idx] if idx < len(choices) else 'N/A'
                numeric_answer = _extract_numeric_answer(explanation)
                error_msg = (
                    f"Question {slot.ord} REJECTED after {max_retries} attempts.\n"
                    f"  Answer letter: {answer_letter}\n"
                    f"  Selected choice: {selected_choice}\n"
                    f"  Extracted numeric from explanation: {numeric_answer}\n"
                    f"  All choices: {choices}\n"
                    f"The calculated answer in the explanation does not match the specified answer_letter."
                )
                print(f"ERROR: {error_msg}")
                raise ValueError(error_msg)

        image_caption = str(data.get("image_caption", "")).strip()

        return {
            "question": question,
            "choices": choices,
            "answer_letter": answer_letter,
            "explanation": explanation,
            "image_caption": image_caption,
        }
    
    raise ValueError(f"Failed to generate valid item after {max_retries} attempts")


# --------- CSV generation ---------

def generate_sim_csv(
    plan: List[QuestionSlot],
    path: str = "sim_math_01.csv",
    form_id: str = "SIM_MATH_01",
) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=HEADERS)
        writer.writeheader()

        # Track previously generated questions to avoid duplicates
        previous_questions: List[str] = []
        generated_questions: set[str] = set()

        for slot in plan:
            print(f"Generating question {slot.ord}/{len(plan)}...")
            
            # Generate with context of previous questions (will raise error if invalid after retries)
            # Try with better model if we're having issues
            item = llm_generate_math_item(slot, previous_questions, max_retries=5, use_better_model=False)
            
            # Check for duplicates
            question_normalized = item["question"].lower().strip()
            question_key = question_normalized[:100]  # Use first 100 chars as key
            
            if question_key in generated_questions:
                print(f"Warning: Question {slot.ord} appears to be a duplicate, but proceeding...")
            else:
                generated_questions.add(question_key)
            
            # Add to previous questions context (keep last 10)
            previous_questions.append(item["question"][:150])  # First 150 chars
            if len(previous_questions) > 10:
                previous_questions.pop(0)

            choices = item["choices"]
            answer_letter = item["answer_letter"]

            skill_code = slot.topic_group
            has_charts = "Yes" if slot.has_visual else "No"
            img_filename = f"{form_id}_Q{slot.ord:02d}.png" if slot.has_visual else ""
            image_position = "above_question" if slot.has_visual else ""

            row = {
                "ord": slot.ord,
                "form_id": form_id,
                "section": "Math",
                "skill_code": skill_code,
                "difficulty": slot.difficulty,
                "question": item["question"],
                "choice_a": choices[0],
                "choice_b": choices[1],
                "choice_c": choices[2],
                "choice_d": choices[3],
                "choice_e": choices[4],
                "answer": answer_letter,
                "explanation": item["explanation"],
                "underlined_text": "",
                "reference_number": "",
                "position_in_passage": "",
                "calculator_allowed": "Yes",
                "passage_id": "",
                "passage_title": "",
                "passage_text": "",
                "passage_format": "",
                "passage_type": "",
                "has_charts": has_charts,
                "chart_images": img_filename,
                "marked_text": "",
                "line_numbers_enabled": "",
                "image_url": img_filename,
                "image_caption": item["image_caption"],
                "image_position": image_position,
            }

            writer.writerow(row)


# --------- Main ---------

def main() -> None:
    random.seed()  # different every run

    plan = build_plan_without_niches()
    assign_niche_tags(plan)
    write_plan_csv(plan, "math_sim_plan.csv")
    generate_sim_csv(plan, "sim_math_01.csv", form_id="SIM_MATH_01")
    print("Done. Generated math_sim_plan.csv and sim_math_01.csv")


if __name__ == "__main__":
    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY is not set in the environment.")
    main()
