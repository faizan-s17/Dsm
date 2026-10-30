import os, json, sys
import requests
from dotenv import load_dotenv

load_dotenv()

# Use the SAME env key you're already using for assessment
GEMINI_API_KEY = os.getenv("REACT_APP_GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("Gemini API key not found", file=sys.stderr)
    print(json.dumps({
        "score": 0,
        "passed": False,
        "feedback": "Gemini API key missing.",
        "metrics": {
            "codeQuality": "Poor",
            "timeEfficiency": "Poor",
            "solutionLength": "0 characters",
            "focusScore": 100,
            "antiCheatScore": 100
        }
    }))
    sys.exit(0)

def evaluate_practice(payload):
    skill = payload.get("skill", "")
    difficulty = payload.get("difficulty", "medium")
    problem = payload.get("problem", {}) or {}
    solution = payload.get("solution", "") or ""
    time_spent = payload.get("timeSpent", 0)
    
    # Get anti-cheat metrics from payload
    anti_cheat_metrics = payload.get("antiCheatMetrics", {})
    tab_switches = anti_cheat_metrics.get("tabSwitches", 0)
    copy_attempts = anti_cheat_metrics.get("copyAttempts", 0)
    paste_attempts = anti_cheat_metrics.get("pasteAttempts", 0)
    focus_lost = anti_cheat_metrics.get("focusLost", 0)
    
    # Calculate focus score based on anti-cheat violations
    violation_count = tab_switches + focus_lost + copy_attempts + paste_attempts
    max_score_reduction = 50  # Maximum reduction from perfect score
    score_reduction = min(violation_count * 5, max_score_reduction)  # 5 points per violation
    focus_score = max(0, 100 - score_reduction)
    
    # Calculate anti-cheat score (inverse of violations)
    total_violations = violation_count
    anti_cheat_score = max(0, 100 - (total_violations * 10))  # 10 points deducted per violation
    
    # Create anti-cheat summary for the prompt
    anti_cheat_summary = ""
    if tab_switches > 0:
        anti_cheat_summary += f"Tab switches detected: {tab_switches}. "
    if copy_attempts > 0:
        anti_cheat_summary += f"Copy attempts detected: {copy_attempts}. "
    if paste_attempts > 0:
        anti_cheat_summary += f"Paste attempts detected: {paste_attempts}. "
    if focus_lost > 0:
        anti_cheat_summary += f"Focus lost events: {focus_lost}. "
    
    if anti_cheat_summary:
        anti_cheat_summary = f"\n\nANTI-CHEAT ALERTS: {anti_cheat_summary}\nFocus Score: {focus_score}%, Anti-cheat Score: {anti_cheat_score}%\nConsider reducing score if violations indicate potential cheating."
    else:
        anti_cheat_summary = "\n\nNO ANTI-CHEAT VIOLATIONS DETECTED. User maintained good focus and integrity."

    prompt = f"""
You are an expert coding interviewer evaluating a practice session.

Evaluate the candidate's solution for correctness, algorithm quality, and code quality.

Return ONLY valid JSON (no markdown, no extra text) with this schema:
{{
  "score": <0-100>,
  "passed": <true/false>,
  "feedback": "<clear feedback>",
  "metrics": {{
    "codeQuality": "Poor|Fair|Good|Excellent",
    "timeEfficiency": "Poor|Fair|Good|Excellent",
    "solutionLength": "{len(solution)} characters",
    "focusScore": {focus_score},
    "antiCheatScore": {anti_cheat_score}
  }}
}}

Skill: {skill}
Difficulty: {difficulty}
TimeSpentSeconds: {time_spent}

Problem Title: {problem.get("title")}
Problem Description:
{problem.get("description")}

Examples:
{json.dumps(problem.get("examples", []), indent=2)}

Tests (if any):
{json.dumps(problem.get("tests", []), indent=2)}

User Solution:
{solution}{anti_cheat_summary}

Rules:
- Correctness is most important.
- If the solution is incomplete/wrong, score must be < 50.
- passed = true only if score >= 60.
- If anti-cheat violations are significant, reduce score accordingly.
- Consider the time spent relative to problem difficulty when evaluating.
"""

    try:
        r = requests.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
            headers={"Content-Type": "application/json"},
            params={"key": GEMINI_API_KEY},
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=15
        )
        r.raise_for_status()
        data = r.json()
        text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()

        # Remove markdown wrappers if Gemini adds them
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        result = json.loads(text)

        score = int(max(0, min(100, result.get("score", 0))))
        passed = bool(result.get("passed", score >= 60))
        feedback = result.get("feedback", "")

        metrics = result.get("metrics", {}) or {}
        metrics["solutionLength"] = f"{len(solution)} characters"
        metrics["focusScore"] = focus_score
        metrics["antiCheatScore"] = anti_cheat_score

        # Apply anti-cheat penalties to the final score
        if anti_cheat_score < 70:  # Significant violations
            score = int(score * (anti_cheat_score / 100))
            feedback += f" (Reduced due to anti-cheating concerns. Integrity score: {anti_cheat_score}%.)"

        return {"score": score, "passed": passed, "feedback": feedback, "metrics": metrics}

    except Exception as e:
        print(f"Practice evaluation error: {str(e)}", file=sys.stderr)
        # Fallback: never give a high score if Gemini fails, apply anti-cheat penalties
        base_score = min(40, max(0, int(len(solution) / 5)))
        final_score = int(base_score * (anti_cheat_score / 100)) if anti_cheat_score < 100 else base_score
        return {
            "score": final_score,
            "passed": False,
            "feedback": f"Unable to evaluate with Gemini. Anti-cheat score: {anti_cheat_score}%.",
            "metrics": {
                "codeQuality": "Fair",
                "timeEfficiency": "Fair",
                "solutionLength": f"{len(solution)} characters",
                "focusScore": focus_score,
                "antiCheatScore": anti_cheat_score
            }
        }

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No input provided"}))
            sys.exit(0)

        arg_data = sys.argv[1].replace('\"', '"')
        if arg_data.startswith("'") and arg_data.endswith("'"):
            arg_data = arg_data[1:-1]

        payload = json.loads(arg_data)
        result = evaluate_practice(payload)
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
