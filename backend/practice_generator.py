import os, json, sys, re
import requests
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("REACT_APP_GEMINI_API_KEY")

def clean_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

def generate_practice(skill, difficulty="medium", category="general", count=1, qtype="coding"):
    prompt = f"""
You are creating practice challenges for skill improvement.

Generate EXACTLY {count} practice problem(s) as JSON array only.

Skill: {skill}
Difficulty: {difficulty}
Category: {category}
Type: {qtype} (coding)

Return ONLY valid JSON array with this structure:
[
  {{
    "id": "uuid-or-any-string",
    "skill": "{skill}",
    "difficulty": "{difficulty}",
    "category": "{category}",
    "title": "Problem title",
    "description": "Clear problem statement",
    "constraints": ["..."],
    "examples": [{{"input":"...","output":"...","explanation":"..."}}],
    "tests": [{{"input":"...","output":"..."}}],
    "expectedAnswerGuidance": "Short guidance for evaluator (not shown to user)"
  }}
]

Rules:
- Make it solvable in 10-20 minutes.
- tests must be realistic and match examples.
- For React/web skills, return task-based challenge + acceptance criteria in constraints.
- NO extra text outside JSON.
"""

    r = requests.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        headers={"Content-Type": "application/json"},
        params={"key": GEMINI_API_KEY},
        json={"contents": [{"parts": [{"text": prompt}]}]},
        timeout=20
    )
    r.raise_for_status()
    data = r.json()
    text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
    text = clean_json(text)

    arr = json.loads(text)
    # ensure IDs exist
    for i, p in enumerate(arr):
        if "id" not in p:
            p["id"] = f"{skill}-{difficulty}-{category}-{i}"
    return arr

if __name__ == "__main__":
    try:
        if not GEMINI_API_KEY:
            print(json.dumps({"error": "Gemini API key missing"}))
            sys.exit(0)

        arg = sys.argv[1].replace('\\"', '"')
        if arg.startswith("'") and arg.endswith("'"):
            arg = arg[1:-1]
        payload = json.loads(arg)

        skill = payload.get("skill")
        difficulty = payload.get("difficulty", "medium")
        category = payload.get("category", "general")
        count = int(payload.get("count", 1))
        qtype = payload.get("type", "coding")

        if not skill:
            print(json.dumps({"error": "skill is required"}))
            sys.exit(0)

        problems = generate_practice(skill, difficulty, category, count, qtype)
        print(json.dumps({"problems": problems}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
