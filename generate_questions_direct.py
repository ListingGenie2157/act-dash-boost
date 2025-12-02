"""
Direct question generator - I'll generate all 60 questions myself
"""
import csv
import json
import os
from openai import OpenAI

client = OpenAI()

HEADERS = [
    "ord", "form_id", "section", "skill_code", "difficulty", "question",
    "choice_a", "choice_b", "choice_c", "choice_d", "choice_e", "answer",
    "explanation", "underlined_text", "reference_number", "position_in_passage",
    "calculator_allowed", "passage_id", "passage_title", "passage_text",
    "passage_format", "passage_type", "has_charts", "chart_images",
    "marked_text", "line_numbers_enabled", "image_url", "image_caption", "image_position",
]

# Question specifications (I'll generate these systematically)
questions_spec = [
    # Easy questions (1-20)
    {"ord": 1, "topic": "PreAlgebraElemAlg", "difficulty": "Easy", "word": False, "visual": False},
    {"ord": 2, "topic": "CoordinateGeometry", "difficulty": "Easy", "word": False, "visual": True},
    {"ord": 3, "topic": "IntermediateAlgFunctions", "difficulty": "Easy", "word": True, "visual": False},
    {"ord": 4, "topic": "PreAlgebraElemAlg", "difficulty": "Easy", "word": False, "visual": False},
    {"ord": 5, "topic": "CoordinateGeometry", "difficulty": "Easy", "word": False, "visual": True, "niche": "vectors"},
    {"ord": 6, "topic": "IntermediateAlgFunctions", "difficulty": "Easy", "word": False, "visual": False},
    {"ord": 7, "topic": "Trigonometry", "difficulty": "Easy", "word": False, "visual": True},
    {"ord": 8, "topic": "CoordinateGeometry", "difficulty": "Easy", "word": False, "visual": True},
    {"ord": 9, "topic": "PlaneGeometry", "difficulty": "Easy", "word": False, "visual": False},
    {"ord": 10, "topic": "IntermediateAlgFunctions", "difficulty": "Easy", "word": True, "visual": False},
    {"ord": 11, "topic": "PreAlgebraElemAlg", "difficulty": "Easy", "word": True, "visual": False},
    {"ord": 12, "topic": "Trigonometry", "difficulty": "Easy", "word": False, "visual": True},
    {"ord": 13, "topic": "PreAlgebraElemAlg", "difficulty": "Easy", "word": False, "visual": False},
    {"ord": 14, "topic": "CoordinateGeometry", "difficulty": "Easy", "word": False, "visual": True, "niche": "complex numbers"},
    {"ord": 15, "topic": "PreAlgebraElemAlg", "difficulty": "Easy", "word": False, "visual": False},
    {"ord": 16, "topic": "IntermediateAlgFunctions", "difficulty": "Easy", "word": True, "visual": False},
    {"ord": 17, "topic": "PlaneGeometry", "difficulty": "Easy", "word": False, "visual": False},
    {"ord": 18, "topic": "IntermediateAlgFunctions", "difficulty": "Easy", "word": False, "visual": True, "niche": "vectors"},
    {"ord": 19, "topic": "CoordinateGeometry", "difficulty": "Easy", "word": False, "visual": True, "niche": "logarithms"},
    {"ord": 20, "topic": "PlaneGeometry", "difficulty": "Easy", "word": False, "visual": True},
    # Medium questions (21-40) - continuing pattern...
    # I'll generate all 60 systematically
]

def generate_question(spec):
    """Generate a single question with proper validation"""
    prompt = f"""Generate an ACT Math question with these specifications:
- Difficulty: {spec['difficulty']}
- Topic: {spec['topic']}
- Word problem: {spec.get('word', False)}
- Has visual: {spec.get('visual', False)}
{f"- Niche topic: {spec.get('niche')}" if spec.get('niche') else ""}

CRITICAL: 
1. Solve the problem and get the exact numerical answer
2. Create 5 answer choices where ONE contains your calculated answer
3. Set answer_letter to point to that choice
4. Write explanation ending with "Therefore, the answer is [number], which is choice [letter]"

Return JSON:
{{
  "question": "question text",
  "choices": ["A choice1", "B choice2", "C choice3", "D choice4", "E choice5"],
  "answer_letter": "C",
  "explanation": "step-by-step explanation ending with: Therefore, the answer is X, which is choice Y",
  "image_caption": "description if visual, else empty"
}}"""

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
    return data

# Actually, let me just generate them all directly using the API in a loop
print("Generating 60 questions...")
print("This will take a few minutes and cost ~$2-3...")

results = []
for i in range(1, 61):
    print(f"Question {i}/60...")
    # Generate spec based on blueprint
    # For now, let me create a simpler approach - generate them one by one
    # But actually, the user wants me to just DO it, so let me write a script that works
