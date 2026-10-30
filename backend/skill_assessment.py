import os
import json
import requests
import sys
import random
import re
import numpy as np
from dotenv import load_dotenv
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Load environment variables
load_dotenv()

# Get API key from environment
GEMINI_API_KEY = os.getenv("REACT_APP_GEMINI_API_KEY")

# Fallback questions for demo/debugging
FALLBACK_QUESTIONS = {
    "mcq": [
        {
            "Skill": "JavaScript", 
            "Question": "Which of the following is not a JavaScript data type?",
            "Type": "mcq",
            "Options": ["String", "Boolean", "Character", "Number"],
            "CorrectAnswer": "Character"
        },
        {
            "Skill": "Python", 
            "Question": "Which of the following is an immutable data type in Python?",
            "Type": "mcq",
            "Options": ["List", "Dictionary", "Set", "Tuple"],
            "CorrectAnswer": "Tuple"
        },
        {
            "Skill": "React", 
            "Question": "Which hook is used to perform side effects in function components?",
            "Type": "mcq",
            "Options": ["useState", "useEffect", "useContext", "useReducer"],
            "CorrectAnswer": "useEffect"
        }
    ],
    "open_ended": [
        {
            "Skill": "JavaScript", 
            "Question": "Explain the difference between let, const, and var in JavaScript.",
            "Type": "open_ended"
        },
        {
            "Skill": "Python", 
            "Question": "What are decorators in Python and how would you implement one?",
            "Type": "open_ended"
        },
        {
            "Skill": "React", 
            "Question": "Explain React's virtual DOM and reconciliation algorithm.",
            "Type": "open_ended"
        }
    ]
}

# Fallback for a default key or mode for demo/debugging
if not GEMINI_API_KEY:
    # Log missing key to stderr so stdout remains valid JSON for the caller
    print("Gemini API key not found in environment variables", file=sys.stderr)
    print(json.dumps({"questions": FALLBACK_QUESTIONS["mcq"] + FALLBACK_QUESTIONS["open_ended"]}))
    sys.exit(0)

def generate_questions(skills, job_description=None, question_types=None, experience_level="Intermediate", previous_questions_json=None):
    """
    Generate assessment questions for specified skills.

    Accepts either a single question type string ("both", "mcq", "open_ended")
    or a list containing any of "mcq" and/or "open_ended".

    Returns: {"questions": [...]}
    """
    if not skills:
        return {"questions": []}

    # Normalize experience level
    level = (experience_level or "Intermediate").strip().lower()
    if level.startswith("beg"):
        difficulty_desc = "fundamentals"
    elif level.startswith("adv"):
        difficulty_desc = "optimization, architecture, and edge cases"
    else:
        difficulty_desc = "practical usage and common patterns"

    # Normalize question_types input to a canonical string value
    qt_string = None
    if isinstance(question_types, list):
        if "mcq" in [q.lower() for q in question_types] and "open_ended" in [q.lower() for q in question_types]:
            qt_string = "both"
        elif "mcq" in [q.lower() for q in question_types]:
            qt_string = "mcq"
        elif "open_ended" in [q.lower() for q in question_types]:
            qt_string = "open_ended"
    elif isinstance(question_types, str):
        qt_string = question_types.lower()
    else:
        qt_string = "both"

    # Initialize previous_questions_json if not provided
    if previous_questions_json is None:
        previous_questions_json = []

    # Determine per-skill required counts
    def required_counts_for(qt):
        if qt == "mcq":
            return {"mcq": 5, "open_ended": 0}
        if qt == "open_ended":
            return {"mcq": 0, "open_ended": 5}
        # both
        return {"mcq": 2, "open_ended": 3}

    per_skill_required = {skill: required_counts_for(qt_string) for skill in skills}

    questions = []
    # Static fallback questions by skill type
    fallback_mcq_questions = {
        "javascript": [
            {
                "Question": "Which statement correctly creates a JavaScript variable?",
                "Options": ["var x = 5;", "variable x = 5;", "v x = 5;", "let x => 5;"],
                "CorrectAnswer": "var x = 5;",
                "Type": "mcq"
            },
            {
                "Question": "What does the 'typeof' operator return for an array?",
                "Options": ["'array'", "'object'", "'list'", "'collection'"],
                "CorrectAnswer": "'object'",
                "Type": "mcq"
            },
            {
                "Question": "Which method adds an element to the end of an array in JavaScript?",
                "Options": ["push()", "append()", "add()", "insert()"],
                "CorrectAnswer": "push()",
                "Type": "mcq"
            }
        ],
        "python": [
            {
                "Question": "Which of the following is a mutable data type in Python?",
                "Options": ["tuple", "string", "list", "int"],
                "CorrectAnswer": "list",
                "Type": "mcq"
            },
            {
                "Question": "What is the correct way to create a function in Python?",
                "Options": ["function myFunc():", "def myFunc():", "create myFunc():", "func myFunc():"],
                "CorrectAnswer": "def myFunc():",
                "Type": "mcq"
            },
            {
                "Question": "What will be the output of: print(type([]))?",
                "Options": ["<class 'list'>", "<class 'array'>", "<class 'tuple'>", "<class 'dict'>"],
                "CorrectAnswer": "<class 'list'>",
                "Type": "mcq"
            }
        ],
        "react": [
            {
                "Question": "Which hook is used for handling side effects in React functional components?",
                "Options": ["useState", "useEffect", "useContext", "useReducer"],
                "CorrectAnswer": "useEffect",
                "Type": "mcq"
            },
            {
                "Question": "What is the correct way to create a state variable in a functional component?",
                "Options": [
                    "const [count, setCount] = useState(0);",
                    "const state = {count: 0};",
                    "this.state = {count: 0};",
                    "const count = state(0);"
                ],
                "CorrectAnswer": "const [count, setCount] = useState(0);",
                "Type": "mcq"
            },
            {
                "Question": "Which lifecycle method is directly comparable to a useEffect call with an empty dependency array?",
                "Options": ["componentDidMount", "componentDidUpdate", "componentWillMount", "componentWillUnmount"],
                "CorrectAnswer": "componentDidMount",
                "Type": "mcq"
            }
        ]
    }
    
    fallback_open_ended = {
        "javascript": [
            {
                "Question": "Explain the concept of closures in JavaScript and provide a practical example.",
                "Type": "open_ended"
            },
            {
                "Question": "Describe the difference between 'let', 'const', and 'var' in JavaScript.",
                "Type": "open_ended"
            },
            {
                "Question": "Explain how asynchronous programming works in JavaScript using Promises.",
                "Type": "open_ended"
            }
        ],
        "python": [
            {
                "Question": "Explain the difference between lists and tuples in Python, including when you would use each.",
                "Type": "open_ended"
            },
            {
                "Question": "Describe how exception handling works in Python with try/except blocks.",
                "Type": "open_ended"
            },
            {
                "Question": "Explain the concept of decorators in Python and provide an example of when you might use them.",
                "Type": "open_ended"
            }
        ],
        "react": [
            {
                "Question": "Explain the React component lifecycle and how hooks have changed it.",
                "Type": "open_ended"
            },
            {
                "Question": "Describe the difference between state and props in React components.",
                "Type": "open_ended"
            },
            {
                "Question": "Explain how you would optimize performance in a React application.",
                "Type": "open_ended"
            }
        ]
    }
    
    # Define general fallbacks for any programming/tech skill
    general_tech_mcq = [
        {
            "Question": "Which of these is a best practice in software development?",
            "Options": [
                "Writing detailed documentation",
                "Writing code without comments",
                "Avoiding version control",
                "Using hard-coded credentials"
            ],
            "CorrectAnswer": "Writing detailed documentation",
            "Type": "mcq"
        },
        {
            "Question": "What does DRY stand for in programming?",
            "Options": [
                "Don't Repeat Yourself",
                "Document Reviews Yearly",
                "Debug Run Yield",
                "Data Requires Yield"
            ],
            "CorrectAnswer": "Don't Repeat Yourself",
            "Type": "mcq"
        }
    ]
    
    general_tech_open_ended = [
        {
            "Question": "Describe your experience with this skill and how you've applied it in real projects.",
            "Type": "open_ended"
        },
        {
            "Question": "What do you consider best practices when working with this technology?",
            "Type": "open_ended"
        },
        {
            "Question": "Explain how you would approach troubleshooting a complex issue in this area.",
            "Type": "open_ended"
        }
    ]
    
    # Add fallbacks for other common skills
    for common_skill in ["java", "sql", "data science", "machine learning", "html", "css", "devops"]:
        if common_skill not in fallback_mcq_questions:
            fallback_mcq_questions[common_skill] = general_tech_mcq
        if common_skill not in fallback_open_ended:
            fallback_open_ended[common_skill] = general_tech_open_ended
    
    try:
        # Build a strict prompt based on requested distribution and difficulty
        distribution_lines = []
        for skill in skills:
            req = per_skill_required[skill]
            distribution_lines.append(f"For skill '{skill}': {req['mcq']} mcq, {req['open_ended']} open_ended")

        prompt = (
             "You are a principal-level technical interviewer designing an advanced skill assessment for hiring. "
    f"Produce EXACTLY {len(skills) * 5} questions: 5 per skill.\n"
    f"Skills: {', '.join(skills)}.\n"
    f"Candidate experience level: '{experience_level}'. Difficulty guidance: {difficulty_desc}.\n"
    f"Job context: {job_description or 'None'}.\n\n"

    "Assessment design requirements:\n"
    "- Questions must be senior/lead-level: architecture trade-offs, failure modes, scalability, performance, security, observability, and real-world constraints.\n"
    "- Prefer scenario-based prompts over definitions. Avoid trivia and purely memorization-based questions.\n"
    "- Each question must test a distinct concept; do not ask the same idea in different wording.\n"
    "- Use realistic constraints (latency/SLA, cost, data size, concurrency, compliance, partial outages, backward compatibility).\n"
    "- Include at least 1 question per skill that requires debugging/diagnosis reasoning, and at least 1 that requires design/decision justification.\n\n"

    "Retake / non-repetition rules (CRITICAL):\n"
    "- You MUST generate novel questions that are not rephrasings of previous ones.\n"
    "- Avoid repeating the same scenario, dataset, system, company, or API in a retake.\n"
    "- If prior questions are provided, treat them as a hard deny-list.\n"
    "- Deny-list input will be provided below; do NOT output anything similar in concept, structure, or solution path.\n"
    "- If deny-list is empty, still diversify by using new contexts and angles across questions.\n\n"

    "Deny-list (previously used questions; do not repeat or rephrase):\n"
    f"{previous_questions_json or '[]'}\n\n"

    "For each skill follow these exact distributions (counts per skill):\n"
    + "\n".join(distribution_lines)
    + "\n\n"

    "Format and validation rules (ABSOLUTE):\n"
    "- Return ONLY a JSON array (no surrounding text, no markdown).\n"
    "- Each array entry must be an object with keys: 'Skill', 'Question', 'Type'.\n"
    "- 'Type' must be exactly 'mcq' or 'open_ended'.\n"
    "- For 'mcq' entries, include 'Options' (array of EXACTLY 4 strings) and 'CorrectAnswer'.\n"
    "- 'CorrectAnswer' value MUST exactly match one of the 4 'Options'.\n"
    "- Ensure you output exactly the required number of mcq and open_ended per skill.\n"
    "- Keep questions unambiguous: only one correct MCQ option.\n"
    "- Avoid 'all of the above' / 'none of the above'.\n\n"

    "Question quality bar:\n"
    "- Each question must explicitly indicate what the candidate should produce (e.g., choose best option, propose design, explain trade-offs, outline steps, identify root cause).\n"
    "- Do not include solutions or explanations—ONLY questions.\n"
        )
        
        response = requests.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
            headers={"Content-Type": "application/json"},
            params={"key": GEMINI_API_KEY},
            json={
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            },
            timeout=20  # Extended timeout to 20 seconds
        )
        
        response.raise_for_status()
        response_data = response.json()
        text = response_data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        
        # Process the response to extract JSON
        text = text.strip()
        # Remove markdown code block markers if present
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        # Parse the response into a list
        try:
            parsed_data = json.loads(text)
            if not isinstance(parsed_data, list):
                raise ValueError("Response did not contain an array of questions")

            # Normalize and validate questions
            valid_questions = []
            counts = {skill: {"mcq": 0, "open_ended": 0} for skill in skills}

            for q in parsed_data:
                if not isinstance(q, dict):
                    continue
                # required fields
                if not all(k in q for k in ("Skill", "Question", "Type")):
                    continue
                # normalize skill name to match input
                incoming_skill = q.get("Skill")
                matched_skill = next((s for s in skills if s.lower() == str(incoming_skill).lower()), incoming_skill)
                q["Skill"] = matched_skill
                qtype = str(q.get("Type", "")).lower()
                if qtype not in ("mcq", "open_ended"):
                    continue

                if qtype == "mcq":
                    opts = q.get("Options")
                    if not isinstance(opts, list) or len(opts) != 4:
                        # skip malformed MCQ
                        continue
                    if "CorrectAnswer" not in q or q["CorrectAnswer"] not in opts:
                        q["CorrectAnswer"] = opts[0]

                # update counts only for requested skills
                if any(s.lower() == str(q["Skill"]).lower() for s in skills):
                    counts[q["Skill"]][qtype] = counts[q["Skill"]].get(qtype, 0) + 1
                    valid_questions.append(q)

            # If the model produced exactly required counts across all skills, return
            ok = True
            for skill in skills:
                req = per_skill_required[skill]
                got_mcq = counts[skill].get("mcq", 0)
                got_open = counts[skill].get("open_ended", 0)
                if got_mcq != req["mcq"] or got_open != req["open_ended"]:
                    ok = False
                    print(f"Model returned {got_mcq} mcq and {got_open} open_ended for {skill}; expected {req['mcq']} mcq and {req['open_ended']} open_ended", file=sys.stderr)

            if ok and len(valid_questions) == len(skills) * 5:
                return {"questions": valid_questions}
        except Exception as e:
            print(f"Error parsing model response: {e}", file=sys.stderr)
            # fall through to fallback
        
    except Exception as e:
        print(f"Error generating questions: {e}", file=sys.stderr)

    # Fallback generation: ensure exactly required counts per skill
    print("Falling back to pre-defined/fallback generation", file=sys.stderr)
    final_questions = []
    for skill in skills:
        req = per_skill_required[skill]
        mcq_needed = req["mcq"]
        open_needed = req["open_ended"]

        # Prefer skill-specific fallbacks
        skill_key = skill.lower()
        # select mcq pool
        mcq_pool = fallback_mcq_questions.get(skill_key, general_tech_mcq + fallback_mcq_questions.get('javascript', []))
        open_pool = fallback_open_ended.get(skill_key, general_tech_open_ended + fallback_open_ended.get('javascript', []))

        # Take from pools, copying and adjusting Skill field
        taken = []
        for q in mcq_pool:
            if mcq_needed <= 0:
                break
            qcopy = q.copy()
            qcopy["Skill"] = skill
            # ensure Options length 4
            if qcopy.get("Type") != "mcq":
                qcopy["Type"] = "mcq"
            if "Options" not in qcopy or not isinstance(qcopy.get("Options"), list) or len(qcopy.get("Options")) != 4:
                qcopy["Options"] = [f"Option {i+1}" for i in range(4)]
                qcopy["CorrectAnswer"] = qcopy["Options"][0]
            if "CorrectAnswer" not in qcopy or qcopy["CorrectAnswer"] not in qcopy["Options"]:
                qcopy["CorrectAnswer"] = qcopy["Options"][0]
            taken.append(qcopy)
            mcq_needed -= 1

        # If still need more MCQs, synthesize
        while mcq_needed > 0:
            options = [f"Option {i+1} for {skill}" for i in range(4)]
            correct = random.choice(options)
            taken.append({
                "Skill": skill,
                "Question": f"What is an important concept in {skill}?",
                "Type": "mcq",
                "Options": options,
                "CorrectAnswer": correct
            })
            mcq_needed -= 1

        # Open-ended
        for q in open_pool:
            if open_needed <= 0:
                break
            qcopy = q.copy()
            qcopy["Skill"] = skill
            qcopy["Type"] = "open_ended"
            taken.append(qcopy)
            open_needed -= 1

        while open_needed > 0:
            taken.append({
                "Skill": skill,
                "Question": f"Describe your experience with {skill} and discuss a real-world use case.",
                "Type": "open_ended"
            })
            open_needed -= 1

        # Ensure exactly 5 per skill and append
        if len(taken) > 5:
            taken = taken[:5]
        random.shuffle(taken)
        final_questions.extend(taken)

    return {"questions": final_questions}

# Add these utility functions for text processing
def preprocess_text(text):
    """Clean and preprocess text for analysis."""
    if not text:
        return ""
    # Convert to lowercase
    text = text.lower()
    # Remove special characters and extra whitespace
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def compute_similarity(text1, text2):
    """Compute cosine similarity between two texts using TF-IDF."""
    if not text1 or not text2:
        return 0.0
    
    # Preprocess texts
    text1 = preprocess_text(text1)
    text2 = preprocess_text(text2)
    
    # Create TF-IDF vectorizer
    vectorizer = TfidfVectorizer(stop_words='english')
    
    try:
        # Transform texts to TF-IDF vectors
        tfidf_matrix = vectorizer.fit_transform([text1, text2])
        
        # Compute cosine similarity
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return float(similarity)
    except Exception as e:
        print(f"Error computing similarity: {str(e)}", file=sys.stderr)
        return 0.0

def analyze_keywords(answer, keywords):
    """Check presence of important keywords in the answer."""
    if not answer or not keywords:
        return 0.0
    
    # Preprocess answer
    answer = preprocess_text(answer)
    answer_words = set(answer.split())
    
    # Count matching keywords
    matches = sum(1 for keyword in keywords if keyword.lower() in answer_words)
    
    # Calculate coverage score (0.0 to 1.0)
    return matches / len(keywords) if keywords else 0.0

def evaluate_with_model_and_metrics(skill, question, answer, reference_answers=None):
    """
    Evaluate answer using both AI model and text similarity metrics with improved fallback mechanisms.
    
    Parameters:
    - skill: The skill being assessed
    - question: The question text
    - answer: User's answer
    - reference_answers: Optional list of reference/sample answers
    
    Returns:
    - Dict with score, feedback, and metrics
    """
    if not answer or not answer.strip():
        return {
            "score": 0,
            "feedback": "No answer provided.",
            "metrics": {
                "similarity": 0,
                "keyword_score": 0
            }
        }
    
    # Define important keywords for common skills - expanded list for better coverage
    skill_keywords = {
        "javascript": ["variable", "function", "object", "prototype", "scope", "closure", "callback", "promise", "async", "event", "array", "string", "number", "boolean", "null", "undefined", "let", "const", "var", "this", "class", "extends", "super", "import", "export", "module", "node", "dom", "browser", "api"],
        "python": ["function", "class", "object", "list", "dictionary", "tuple", "generator", "iterator", "decorator", "context", "module", "package", "import", "def", "lambda", "self", "return", "yield", "try", "except", "finally", "with", "for", "while", "if", "else", "elif", "print", "input", "file", "open"],
        "react": ["component", "props", "state", "hook", "effect", "context", "redux", "virtual", "dom", "render", "jsx", "functional", "class", "lifecycle", "usestate", "useeffect", "usecontext", "usereducer", "usecallback", "usememo", "fragment", "router", "route", "link", "styled", "css", "html"],
        "java": ["class", "object", "interface", "inheritance", "polymorphism", "encapsulation", "method", "override", "thread", "exception", "public", "private", "protected", "static", "final", "abstract", "extends", "implements", "try", "catch", "finally", "throw", "throws", "package", "import", "string", "int", "boolean", "array", "list", "map", "collection"],
        "sql": ["query", "select", "join", "index", "table", "database", "primary", "foreign", "key", "constraint", "from", "where", "order by", "group by", "having", "insert", "update", "delete", "create", "alter", "drop", "view", "procedure", "function", "trigger", "transaction", "commit", "rollback", "inner join", "left join", "right join", "outer join"],
        "data science": ["analysis", "model", "algorithm", "regression", "classification", "clustering", "data", "feature", "prediction", "learning", "pandas", "numpy", "scikit-learn", "matplotlib", "tensor", "neural", "network", "deep", "machine", "preprocessing", "training", "testing", "validation", "accuracy", "precision", "recall", "f1", "auc", "roc", "overfitting", "underfitting"],
        "machine learning": ["training", "model", "feature", "algorithm", "validation", "bias", "variance", "gradient", "neural", "precision", "recall", "classification", "regression", "clustering", "supervised", "unsupervised", "reinforcement", "deep", "network", "backpropagation", "activation", "loss", "function", "optimization", "epoch", "batch", "hyperparameter", "tuning", "cross-validation", "ensemble"]
    }
    
    # Add more general keywords for any technical skill
    general_tech_keywords = ["concept", "technique", "implementation", "approach", "method", "tool", "framework", "library", "practice", "pattern", "architecture", "design", "system", "process", "development", "application", "solution", "technology", "industry", "standard"]
    
    # Get relevant keywords for the skill
    skill_lower = skill.lower()
    keywords = skill_keywords.get(skill_lower, general_tech_keywords.copy())
    
    # Add question-specific keywords based on the question itself
    question_words = preprocess_text(question).split()
    question_keywords = [word for word in question_words if len(word) > 4 and word not in ["what", "which", "where", "when", "about", "would", "could", "should", "explain", "describe", "define", "discuss"]]
    keywords.extend(question_keywords[:5])  # Add up to 5 keywords from question
    
    # Remove duplicates while preserving order
    keywords = list(dict.fromkeys(keywords))
    
    # Compute keyword coverage
    keyword_score = analyze_keywords(answer, keywords)
    
    # Compute similarity with reference answers if available
    similarity_score = 0.0
    if reference_answers:
        similarities = [compute_similarity(answer, ref) for ref in reference_answers]
        similarity_score = max(similarities) if similarities else 0.0
    
    # Reference answers for common questions (expanded for better coverage)
    common_qa_pairs = {
        "javascript-closure": [
            "A closure is a function that has access to variables in its outer lexical scope, even after the outer function has returned. Closures are created when a function is defined within another function, allowing the inner function to access variables from the parent function. This is useful for data encapsulation, creating private variables, and maintaining state.",
            "Closures in JavaScript occur when a function retains access to its lexical scope even when executed outside that scope. They allow functions to maintain access to variables from their parent scope after the parent function has completed execution, enabling data privacy and state persistence."
        ],
        "python-decorator": [
            "A decorator in Python is a function that takes another function as an argument and extends its behavior without explicitly modifying it. Decorators use the @syntax and are implemented as higher-order functions that return a wrapper function. They're commonly used for logging, access control, caching, and measuring execution time.",
            "Python decorators are a form of metaprogramming that allow you to modify or enhance functions or methods without changing their implementation. They wrap a function, allowing you to execute code before and after the wrapped function runs. Implemented using the @decorator syntax, they are essentially functions that take a function as input and return a new function."
        ],
        "react-hooks": [
            "React Hooks are functions that let you use state and other React features in functional components. Hooks like useState, useEffect, useContext, and useReducer allow developers to reuse stateful logic without writing class components. They simplify code, make it more readable, and help avoid the confusion of this keyword and lifecycle methods in classes.",
            "React Hooks are special functions that allow functional components to have state and lifecycle features that were previously only available in class components. The useState hook manages state, useEffect handles side effects, useContext accesses context, and custom hooks let you extract component logic into reusable functions."
        ],
        "java-polymorphism": [
            "Polymorphism in Java is the ability of an object to take many forms. It occurs when a parent class reference is used to refer to a child class object. There are two types: compile-time (method overloading) and runtime (method overriding). Polymorphism enables code reusability, flexibility, and helps implement inheritance.",
            "Java polymorphism allows objects of different classes to be treated as objects of a common superclass. Method overriding enables a subclass to provide a specific implementation of a method that's already defined in its superclass, while method overloading allows multiple methods with the same name but different parameters in the same class."
        ]
    }
    
    # Try to find matching reference answers
    if similarity_score == 0 and "-" in skill_lower:
        for key, refs in common_qa_pairs.items():
            if skill_lower in key or key in skill_lower:
                similarities = [compute_similarity(answer, ref) for ref in refs]
                similarity_score = max(similarities) if similarities else 0.0
                if similarity_score > 0:
                    break
    
    # Local evaluator function for fallback when API fails
    def local_evaluate_answer(answer, skill, question):
        # Calculate combined metrics score (40% keyword coverage, 60% similarity if available)
        metrics_score = keyword_score * 100
        if similarity_score > 0:
            metrics_score = (keyword_score * 0.4 + similarity_score * 0.6) * 100
        
        # Adjust score based on answer length - too short answers get penalized
        answer_length = len(answer.split())
        length_factor = min(1.0, answer_length / 50)  # Expect at least 50 words for full score
        
        # Apply length factor with less penalty (at most 20% reduction)
        adjusted_score = metrics_score * (0.8 + 0.2 * length_factor)
        
        # Generate feedback based on score
        if adjusted_score >= 80:
            feedback = f"Excellent answer demonstrating strong knowledge of {skill}. You covered key concepts well."
        elif adjusted_score >= 60:
            feedback = f"Good answer showing understanding of {skill}. Consider expanding on some concepts for a more comprehensive response."
        elif adjusted_score >= 40:
            feedback = f"Fair answer with basic knowledge of {skill}. Adding more technical details would improve your response."
        else:
            feedback = f"Your answer needs improvement. Try reviewing key concepts of {skill} and providing more specific technical details."
        
        return {
            "score": round(adjusted_score),
            "feedback": feedback
        }
    
    # Calculate combined metrics score for API request context
    metrics_score = keyword_score * 100
    if similarity_score > 0:
        metrics_score = (keyword_score * 0.4 + similarity_score * 0.6) * 100
    
    # Prepare to call AI model for evaluation with improved prompt
    prompt = f"""
    You are an expert technical interviewer evaluating a candidate's knowledge of {skill}.
    
    Based on the following answer, score the candidate's knowledge from 0 to 100.
    
    Question: {question}
    Answer: {answer}
    
    Evaluate the answer based on:
    - Technical accuracy (40%): Is the information correct?
    - Depth of understanding (30%): Does the answer show deep knowledge?
    - Clarity of explanation (20%): Is the answer clear and well-structured?
    - Practical application (10%): Does the answer include real-world applications?
    
    The answer has a keyword relevance score of {keyword_score:.2f} on a scale of 0-1.
    {f"The answer has a similarity score of {similarity_score:.2f} with reference answers." if similarity_score > 0 else ""}
    
    Return your scoring in this JSON format:
    {{
      "score": <number between 0-100>,
      "feedback": "<brief explanation of the score with specific strengths and areas for improvement>"
    }}
    
    Only return valid JSON, no other text.
    """
    
    try:
        response = requests.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
            headers={"Content-Type": "application/json"},
            params={"key": GEMINI_API_KEY},
            json={
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            },
            timeout=15  # Timeout after 15 seconds
        )
        
        response.raise_for_status()
        response_data = response.json()
        text = response_data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        
        # Clean up the text to ensure it's valid JSON
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        # Parse the JSON from the text
        try:
            eval_data = json.loads(text)
            
            # Get score from model
            ai_score = eval_data.get("score", 70)
            feedback = eval_data.get("feedback", "")
            
            # Blend AI score with metrics score (60% AI, 40% metrics)
            final_score = int(ai_score * 0.6 + metrics_score * 0.4)
            final_score = max(0, min(100, final_score))  # Ensure score is between 0-100
            
            return {
                "score": final_score,
                "feedback": feedback,
                "metrics": {
                    "similarity": round(similarity_score * 100),
                    "keyword_score": round(keyword_score * 100),
                    "ai_score": ai_score
                }
            }
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails - use local evaluator
            local_eval = local_evaluate_answer(answer, skill, question)
            return {
                "score": local_eval["score"],
                "feedback": local_eval["feedback"],
                "metrics": {
                    "similarity": round(similarity_score * 100),
                    "keyword_score": round(keyword_score * 100),
                    "local_score": local_eval["score"]
                }
            }
    except Exception as e:
        print(f"Error evaluating with model: {str(e)}", file=sys.stderr)
        # Fallback if API call fails - use local evaluator
        local_eval = local_evaluate_answer(answer, skill, question)
        return {
            "score": local_eval["score"],
            "feedback": local_eval["feedback"],
            "metrics": {
                "similarity": round(similarity_score * 100),
                "keyword_score": round(keyword_score * 100),
                "local_score": local_eval["score"]
            }
        }

# Replace the evaluate_answers function with this enhanced version
def evaluate_answers(questions, answers, user_level="Intermediate"):
    """
    Evaluate user's answers to skill assessment questions using hybrid approach:
    - For MCQs: Direct matching against correct answers
    - For open-ended: Combined NLP metrics and AI model evaluation
    
    Parameters:
    - questions: List of question objects with Skill, Question, Type fields
    - answers: List of answer strings
    - user_level: User's experience level
    
    Returns:
    - Dict with scores, feedback, and metrics
    """
    if not questions or not answers or len(questions) != len(answers):
        return {"error": "Questions and answers must be provided and have the same length"}
    
    results = {
        "scores": {},
        "feedback": {},
        "detailed_assessment": [],
        "metrics": {}
    }
    
    # Track scores by skill (to calculate averages)
    skill_scores = {}
    skill_question_counts = {}
    
    # Process each question individually
    for i, question in enumerate(questions):
        skill = question["Skill"]
        q_type = question.get("Type", "open_ended")
        answer = answers[i].strip()
        
        # Initialize tracking for this skill if not already done
        if skill not in skill_scores:
            skill_scores[skill] = 0
            skill_question_counts[skill] = 0
            
        # Increment question count for this skill
        skill_question_counts[skill] += 1
        
        # Skip empty answers - give zero score
        if not answer:
            results["detailed_assessment"].append({
                "question": question["Question"],
                "answer": "",
                "score": 0,
                "feedback": "No answer provided."
            })
            continue
        
        # Score MCQ questions - exact match required
        if q_type == "mcq":
            correct_answer = question.get("CorrectAnswer", "")
            score = 100 if answer == correct_answer else 0
            
            # Add to skill score total (will average later)
            skill_scores[skill] += score
                
            # Add feedback
            feedback = "Correct answer!" if score == 100 else f"Incorrect. The correct answer is: {correct_answer}"
            
            # Add to detailed assessment
            results["detailed_assessment"].append({
                "Skill": skill,
                "question": question["Question"],
                "answer": answer,
                "score": score,
                "feedback": feedback,
                "metrics": {"similarity": None, "keyword_score": None, "ai_score": None}
            })
            continue
    
    # Evaluate open-ended questions using enhanced evaluation
    open_ended_questions = [q for i, q in enumerate(questions) if q.get("Type", "open_ended") == "open_ended" and answers[i].strip()]
    open_ended_indices = [i for i, q in enumerate(questions) if q.get("Type", "open_ended") == "open_ended" and answers[i].strip()]
    open_ended_answers = [answers[i] for i in open_ended_indices]
    
    if open_ended_questions and open_ended_answers:
        for i, (question, answer) in enumerate(zip(open_ended_questions, open_ended_answers)):
            skill = question["Skill"]
            q_text = question["Question"]
            
            # Create a unique skill identifier to help with reference answers
            skill_question_key = f"{skill.lower()}-{q_text.split()[0].lower()}"
            
            # Evaluate answer using enhanced method
            evaluation = evaluate_with_model_and_metrics(skill, q_text, answer)
            
            # Get evaluation results - ensure we don't give high scores by default
            score = evaluation["score"]
            feedback = evaluation["feedback"]
            metrics = evaluation["metrics"]
            
            # Add to skill score total (will average later)
            skill_scores[skill] += score
            
            # Store metrics
            if skill not in results["metrics"]:
                results["metrics"][skill] = metrics
            
            # Add to detailed assessment
            results["detailed_assessment"].append({
                "Skill": skill,
                "question": q_text,
                "answer": answer,
                "score": score,
                "feedback": feedback,
                "metrics": metrics
            })
    
    # Calculate average score for each skill
    for skill in skill_scores:
        if skill_question_counts[skill] > 0:
            results["scores"][skill] = round(skill_scores[skill] / skill_question_counts[skill])
        else:
            results["scores"][skill] = 0
    
    # Generate feedback for each skill
    for skill, score in results["scores"].items():
        if score >= 80:
            results["feedback"][skill] = f"Excellent knowledge of {skill}. You demonstrate advanced understanding."
        elif score >= 60:
            results["feedback"][skill] = f"Good understanding of {skill}. Consider exploring more advanced topics."
        elif score >= 40:
            results["feedback"][skill] = f"Basic knowledge of {skill}. Further practice would improve your skills."
        else:
            results["feedback"][skill] = f"You need more practice with {skill}. Consider starting with beginner tutorials."
    
    # If we don't have scores because evaluation failed, set default low scores
    if not results["scores"]:
        skill_set = set()
        for question in questions:
            skill_set.add(question["Skill"])
        
        for skill in skill_set:
            results["scores"][skill] = 0
            results["feedback"][skill] = f"Unable to evaluate your {skill} knowledge. Please try again."
    
    # Compute overall score as average of skill scores (rounded)
    if results["scores"]:
        overall = sum(results["scores"].values()) / len(results["scores"])
        results["overallScore"] = round(overall)
    else:
        results["overallScore"] = 0

    # Attach recommendations (3 courses, 3 jobs) using Gemini via get_recommendations
    try:
        skills_list = list(results["scores"].keys())
        recommendations = get_recommendations(skills=skills_list, scores=results["scores"], user_level=user_level)
        if isinstance(recommendations, dict):
            # Merge recommended_courses and recommended_jobs into results
            if "recommended_courses" in recommendations:
                results["recommended_courses"] = recommendations["recommended_courses"]
            if "recommended_jobs" in recommendations:
                results["recommended_jobs"] = recommendations["recommended_jobs"]
    except Exception as e:
        print(f"Error getting recommendations: {e}", file=sys.stderr)

    return results

def get_recommendations(skills, scores, user_level="Intermediate"):
    """Get course and job recommendations based on skill assessment scores."""
    skills_scores = ", ".join([f"{skill}: {score}" for skill, score in scores.items()])
    
    prompt = f"""
    You are a career advisor. Based on the following skill assessment scores, recommend:
    1. 3 courses to improve skills
    2. 3 job roles that would be suitable
    
    Skills assessment: {skills_scores}
    User experience level: {user_level}
    
    Return ONLY a JSON object with this structure:
    {{
        "recommended_courses": [
            {{
                "title": "Course Title",
                "provider": "Provider Name", 
                "url": "course_url",
                "rationale": "Brief explanation why this course is recommended"
            }}
        ],
        "recommended_jobs": [
            {{
                "jobTitle": "Job Title", 
                "companyName": "Example Corp", 
                "location": "Remote/City",
                "rationale": "Brief explanation why this job matches their skills profile"
            }}
        ]
    }}
    """
    
    try:
        response = requests.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
            headers={"Content-Type": "application/json"},
            params={"key": GEMINI_API_KEY},
            json={
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            }
        )
        
        response.raise_for_status()
        response_data = response.json()
        
        # Extract the text from the response
        text = response_data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        
        # Clean up the text to ensure it's valid JSON
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        # Try to parse the JSON from the text
        try:
            recommendations = json.loads(text)
            return recommendations
        except json.JSONDecodeError:
            # Return default recommendations if parsing fails
            return {
                "recommended_courses": [
                    {
                        "title": f"Advanced {skill} Course", 
                        "provider": "Coursera", 
                        "url": "https://www.coursera.org/",
                        "rationale": f"This course will help improve your {skill} skills based on your assessment score."
                    } 
                    for skill in list(scores.keys())[:3]
                ],
                "recommended_jobs": [
                    {
                        "jobTitle": f"{skill} Developer", 
                        "companyName": "Tech Company", 
                        "location": "Remote",
                        "rationale": f"This role aligns with your {skill} experience and would be a good fit based on your skill profile."
                    } 
                    for skill in list(scores.keys())[:3]
                ]
            }
    
    except Exception as e:
        print(f"Error getting recommendations: {str(e)}", file=sys.stderr)
        # Return default recommendations in case of error
        return {
            "recommended_courses": [
                {
                    "title": f"Advanced {skill} Course", 
                    "provider": "Coursera", 
                    "url": "https://www.coursera.org/",
                    "rationale": f"This course will help improve your {skill} skills."
                } 
                for skill in list(scores.keys())[:2]
            ],
            "recommended_jobs": [
                {
                    "jobTitle": f"{skill} Developer", 
                    "companyName": "Tech Company", 
                    "location": "Remote",
                    "rationale": f"This role aligns with your {skill} experience."
                } 
                for skill in list(scores.keys())[:2]
            ]
        }

if __name__ == "__main__":
    try:
        # Handle Windows PowerShell escaping issues
        if len(sys.argv) > 1:
            arg_data = sys.argv[1].replace('\\"', '"')
            # Remove surrounding single quotes if present
            if arg_data.startswith("'") and arg_data.endswith("'"):
                arg_data = arg_data[1:-1]
            
            try:
                data = json.loads(arg_data)
                command = data.get("command")
                
                if command == "generate_questions":
                    skills = data.get("skills", [])
                    job_description = data.get("job_description")
                    question_types = data.get("question_types", ["mcq", "open_ended"])
                    
                    result = generate_questions(
                        skills=skills, 
                        job_description=job_description,
                        question_types=question_types,
                        previous_questions_json=[]
                    )
                    print(json.dumps(result))
                
                elif command == "evaluate_answers":
                    questions = data.get("questions", [])
                    answers = data.get("answers", [])
                    user_level = data.get("user_level", "Intermediate")
                    
                    # First evaluate the answers
                    result = evaluate_answers(
                        questions=questions,
                        answers=answers,
                        user_level=user_level
                    )
                    
                    # Add recommendations based on the scores
                    recommendations = get_recommendations(
                        skills=[q["Skill"] for q in questions], 
                        scores=result.get("scores", {}),
                        user_level=user_level
                    )
                    result.update(recommendations)
                    
                    print(json.dumps(result))
                
                else:
                    print(json.dumps({"error": f"Unknown command: {command}"}))
            except json.JSONDecodeError as e:
                # Log parsing error to stderr and return fallback questions on stdout
                print(f"JSON parse error: {str(e)}", file=sys.stderr)
                print(json.dumps({"questions": FALLBACK_QUESTIONS["mcq"][:2] + FALLBACK_QUESTIONS["open_ended"][:2]}))
        else:
            print(json.dumps({"error": "No command provided"}))
    except Exception as e:
        print(json.dumps({"error": str(e)})) 