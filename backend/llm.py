import json
import os
import re
from typing import Dict, List, AsyncGenerator
from openai import OpenAI

SYSTEM_PROMPT = (
    "You are a supportive reflective-listening coach for practice and education. "
    "You are NOT a therapist or medical professional.\n\n"
    "Style:\n"
    "- Motivational Interviewing tone: reflect feelings/meaning, validate, support autonomy.\n"
    "- Use OARS: mainly reflections + one open question at the end.\n"
    "- Avoid diagnosis, treatment plans, medication advice, or claiming clinical authority.\n"
    "- Keep the response 2 to 6 sentences plus 1 gentle follow-up question."
)

PLAN_PROMPT = (
    "You are a supportive reflective-listening coach for practice and education. "
    "You are NOT a therapist or medical professional.\n\n"
    "You must return STRICT JSON only. No markdown, no extra text.\n"
    "JSON schema:\n"
    "{\n"
    '  "mode": "<one of: reflection, reframe, options, values, micro_plan, summary, compassion, curious>",\n'
    '  "reflection": "<1 sentence reflective statement about what user said>",\n'
    '  "core": "<main guidance in 1 to 4 sentences depending on mode>",\n'
    '  "question": "<one open-ended question>",\n'
    '  "tagline": "<optional short supportive closing, can be empty>"\n'
    "}\n\n"
    "Rules:\n"
    "- Keep everything concise and warm, casual, not clinical.\n"
    "- Do not claim to be a therapist.\n"
    "- Avoid repeating phrasing; do not start with disallowed openers.\n"
    "- Do not include markdown bullets unless mode=options, then use 2-4 options "
    'inside "core" separated by " | " (pipe).\n'
)

def _client() -> OpenAI:
    api_key = os.getenv("GROQ_API_KEY")
    base_url = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
    if not api_key:
        raise RuntimeError("Missing GROQ_API_KEY (set it in backend/.env).")
    return OpenAI(api_key=api_key, base_url=base_url)

def _model() -> str:
    return os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

def _extract_json(text: str) -> Dict[str, str]:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return {}
    return {}

def _fallback_plan(mode: str, user_text: str) -> Dict[str, str]:
    reflection = f"I'm hearing that {user_text.strip()}" if user_text.strip() else "I'm hearing this feels tough."
    return {
        "mode": mode,
        "reflection": reflection,
        "core": "",
        "question": "What part feels most important to focus on right now?",
        "tagline": "",
    }

def plan_response_json(
    history: List[Dict[str, str]],
    user_text: str,
    intent: str,
    emotion: str,
    mode: str,
    disallowed_openers: List[str],
) -> Dict[str, str]:
    client = _client()
    model = _model()

    messages: List[Dict[str, str]] = [{"role": "system", "content": PLAN_PROMPT}]
    if history:
        messages.extend(history[-10:])

    opener_list = ", ".join([o for o in disallowed_openers if o])
    user_payload = (
        f"[intent={intent}][emotion={emotion}][mode={mode}]\n"
        f"Disallowed openers: {opener_list or 'none'}\n"
        f"User: {user_text}"
    )
    messages.append({"role": "user", "content": user_payload})

    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.7,
        stream=False,
    )

    content = ""
    try:
        content = response.choices[0].message.content or ""
    except Exception:
        content = ""

    plan = _extract_json(content)
    if not plan:
        return _fallback_plan(mode, user_text)

    if plan.get("mode") not in {
        "reflection",
        "reframe",
        "options",
        "values",
        "micro_plan",
        "summary",
        "compassion",
        "curious",
    }:
        plan["mode"] = mode

    for key in ("reflection", "core", "question", "tagline"):
        plan.setdefault(key, "")

    return plan

async def stream_reflective_response(
    history: List[Dict[str, str]],
    user_text: str,
    intent: str = "other",
) -> AsyncGenerator[str, None]:
    # Streams tokens from Groq over OpenAI-compatible API.
    client = _client()
    model = _model()

    messages: List[Dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]
    if history:
        messages.extend(history[-10:])

    messages.append({"role": "user", "content": f"[intent={intent}] {user_text}"})

    stream = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.6,
        stream=True,
    )

    for event in stream:
        delta = ""
        try:
            delta = event.choices[0].delta.content or ""
        except Exception:
            delta = ""
        if delta:
            yield delta
