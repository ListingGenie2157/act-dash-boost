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
    "You ONLY output JSON when asked, and you do not include commentary around it."
)


def build_prompt(slot: QuestionSlot) -> str:
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

    parts.append(
        "Return ONLY a JSON object with this exact structure (no extra text before or after):\n"
        "{\n"
        '  "question": "string, the question text only",\n'
        '  "choices": ["A choice", "B choice", "C choice", "D choice", "E choice"],\n'
        '  "answer_letter": "C",\n'
        '  "explanation": "string, step-by-step explanation for a high-school student",\n'
        '  "image_caption": "short description of the visual if any, else empty string"\n'
        "}"
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


def llm_generate_for_slot(slot: QuestionSlot) -> Dict[str, Any]:
    user_prompt = build_prompt(slot)

    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )

    raw = completion.choices[0].message.content or ""
    data = _extract_and_fix_json(raw)
    return data


def llm_generate_math_item(slot: QuestionSlot) -> Dict[str, Any]:
    data = llm_generate_for_slot(slot)

    # Question text
    question = data.get("question", "")
    if isinstance(question, list):
        question = " ".join(str(part).strip() for part in question)
    else:
        question = str(question)
    question = " ".join(question.splitlines()).strip()

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

    image_caption = str(data.get("image_caption", "")).strip()

    return {
        "question": question,
        "choices": choices,
        "answer_letter": answer_letter,
        "explanation": explanation,
        "image_caption": image_caption,
    }


# --------- CSV generation ---------

def generate_sim_csv(
    plan: List[QuestionSlot],
    path: str = "sim_math_01.csv",
    form_id: str = "SIM_MATH_01",
) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=HEADERS)
        writer.writeheader()

        for slot in plan:
            item = llm_generate_math_item(slot)

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
