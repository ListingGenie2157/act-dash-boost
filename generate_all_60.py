"""
Simple script to generate all 60 questions directly
Uses the plan from generate_math_plan.py but generates questions one by one with better error handling
"""
import csv
import json
import sys
import os
from openai import OpenAI

# Import the plan generation
sys.path.insert(0, os.path.dirname(__file__))
from generate_math_plan import (
    build_plan_without_niches, assign_niche_tags, HEADERS,
    QuestionSlot
)

client = OpenAI()

def generate_one_question(slot: QuestionSlot, question_num: int, total: int) -> dict:
    """Generate a single question with retries"""
    
    prompt_parts = [
        f"Create an ACT Math question.",
        f"Difficulty: {slot.difficulty}",
        f"Topic: {slot.topic_group}",
    ]
    
    if slot.is_word_problem:
        prompt_parts.append("Make this a realistic word problem.")
    else:
        prompt_parts.append("This can be a direct calculation question.")
    
    if slot.has_visual:
        prompt_parts.append("Include a visual/diagram (mention 'In the figure above' in the question).")
    
    if slot.niche_tag:
        prompt_parts.append(f"Focus on: {slot.niche_tag}")
    
    prompt_parts.append("""
IMPORTANT:
1. Calculate the answer correctly
2. Create 5 choices where ONE contains your calculated answer
3. Set answer_letter to that choice
4. Explanation must end: "Therefore, the answer is [number], which is choice [letter]"

Return JSON:
{
  "question": "question text",
  "choices": ["A value1", "B value2", "C value3", "D value4", "E value5"],
  "answer_letter": "C",
  "explanation": "explanation ending with: Therefore, the answer is X, which is choice Y",
  "image_caption": "description if visual else empty string"
}""")
    
    prompt = "\n".join(prompt_parts)
    
    for attempt in range(3):
        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert ACT Math writer. Output only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7
            )
            
            data = json.loads(response.choices[0].message.content)
            
            # Extract values
            question = data.get("question", "").strip()
            choices = data.get("choices", [])
            answer_letter = str(data.get("answer_letter", "C")).strip().upper()
            explanation = data.get("explanation", "").strip()
            image_caption = data.get("image_caption", "").strip()
            
            # Validate choices
            if len(choices) < 5:
                choices.extend([f"Choice {i}" for i in range(len(choices) + 1, 6)])
            choices = [str(c).strip() for c in choices[:5]]
            
            # Validate answer_letter
            if answer_letter not in "ABCDE":
                answer_letter = "C"
            
            # Simple validation: check if explanation mentions the answer letter
            explanation_lower = explanation.lower()
            if f"choice {answer_letter.lower()}" in explanation_lower or f"answer {answer_letter.lower()}" in explanation_lower:
                return {
                    "question": question,
                    "choices": choices,
                    "answer_letter": answer_letter,
                    "explanation": explanation,
                    "image_caption": image_caption,
                }
            else:
                if attempt < 2:
                    print(f"  Retry {attempt + 1}/3: Answer letter not mentioned in explanation")
                    continue
                # Accept it anyway on last attempt
                return {
                    "question": question,
                    "choices": choices,
                    "answer_letter": answer_letter,
                    "explanation": explanation,
                    "image_caption": image_caption,
                }
                
        except Exception as e:
            if attempt < 2:
                print(f"  Retry {attempt + 1}/3: Error - {e}")
                continue
            raise
    
    raise ValueError(f"Failed to generate question {question_num} after 3 attempts")

def main():
    print("Building question plan...")
    plan = build_plan_without_niches()
    assign_niche_tags(plan)
    
    print(f"\nGenerating {len(plan)} questions...")
    print("This will take ~5-10 minutes and cost approximately $2-4\n")
    
    form_id = "SIM_MATH_01"
    output_file = "sim_math_01_direct.csv"
    
    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=HEADERS)
        writer.writeheader()
        
        for slot in plan:
            print(f"Question {slot.ord}/60: {slot.topic_group} ({slot.difficulty})...", end=" ", flush=True)
            
            try:
                item = generate_one_question(slot, slot.ord, len(plan))
                print("✓")
                
                row = {
                    "ord": slot.ord,
                    "form_id": form_id,
                    "section": "Math",
                    "skill_code": slot.topic_group,
                    "difficulty": slot.difficulty,
                    "question": item["question"],
                    "choice_a": item["choices"][0],
                    "choice_b": item["choices"][1],
                    "choice_c": item["choices"][2],
                    "choice_d": item["choices"][3],
                    "choice_e": item["choices"][4],
                    "answer": item["answer_letter"],
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
                    "has_charts": "Yes" if slot.has_visual else "No",
                    "chart_images": f"{form_id}_Q{slot.ord:02d}.png" if slot.has_visual else "",
                    "marked_text": "",
                    "line_numbers_enabled": "",
                    "image_url": f"{form_id}_Q{slot.ord:02d}.png" if slot.has_visual else "",
                    "image_caption": item["image_caption"],
                    "image_position": "above_question" if slot.has_visual else "",
                }
                
                writer.writerow(row)
                
            except Exception as e:
                print(f"✗ ERROR: {e}")
                print(f"  Skipping question {slot.ord} - you may need to generate it manually")
                continue
    
    print(f"\n✓ Done! Generated {output_file}")
    print("Review the file and manually fix any issues if needed.")

if __name__ == "__main__":
    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY is not set in the environment.")
    main()
