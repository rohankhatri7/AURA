import re
import random
from typing import Dict, List

OPENERS = {
    "reflection": [
        "It sounds like",
        "I'm hearing",
        "From what you're saying,",
        "That feels like",
        "It seems like",
        "I'm picking up that",
        "You're noticing",
    ],
    "compassion": [
        "That's really heavy,",
        "I'm sorry that's hitting you like this,",
        "That sounds painful,",
        "That sounds like a lot to carry,",
        "I'm sorry you're dealing with this,",
    ],
    "reframe": [
        "One way to look at this is",
        "Another angle might be",
        "It could be that",
        "A different lens could be",
        "An alternate take is",
    ],
    "options": [
        "A few things you could try:",
        "If you want ideas, here are a few:",
        "Here are some options:",
        "A couple possibilities:",
        "Some small experiments to consider:",
    ],
    "micro_plan": [
        "Let's make this small and doable.",
        "Want a tiny plan for the next 10 minutes?",
        "How about a very small next step?",
        "Let's keep it light and practical.",
        "We can make a micro-plan.",
    ],
    "values": [
        "What feels most important here is",
        "It might help to anchor on what matters most:",
        "A values check might help:",
        "What you want to protect or move toward is",
        "You might be leaning toward",
    ],
    "curious": [
        "Help me understand:",
        "I'm curious:",
        "When does it feel strongest?",
        "What's the hardest moment in it?",
        "What part feels most stuck?",
    ],
    "summary": [
        "Let me check I've got this right:",
        "So far I'm hearing:",
        "Here's the shape of what you're saying:",
        "Quick recap:",
        "Tell me if I'm getting this:",
    ],
}


def _split_sentences(text: str) -> List[str]:
    if not text:
        return []
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]


def _trim_sentences(text: str, max_sentences: int) -> str:
    sentences = _split_sentences(text)
    if not sentences:
        return ""
    return " ".join(sentences[:max_sentences])


def _combine_opener(opener: str, sentence: str) -> str:
    opener = opener.strip()
    sentence = sentence.strip()
    if not sentence:
        return opener.rstrip(".") + "."

    if sentence[-1] not in ".!?":
        sentence += "."

    if opener:
        if sentence[0].isupper():
            sentence = sentence[0].lower() + sentence[1:]
        return f"{opener} {sentence}"

    return sentence


def _choose_opener(mode: str, last_openers: List[str], seed: str) -> str:
    options = OPENERS.get(mode, OPENERS["reflection"])
    candidates = [o for o in options if o not in last_openers] or options
    rng = random.Random(hash(seed))
    return rng.choice(candidates)


def render_from_plan(
    plan: Dict[str, str],
    mode: str,
    intent: str,
    emotion: str,
    last_openers: List[str],
) -> str:
    reflection = _trim_sentences(plan.get("reflection", ""), 1)
    core = _trim_sentences(plan.get("core", ""), 4)
    question = _trim_sentences(plan.get("question", ""), 1)
    tagline = _trim_sentences(plan.get("tagline", ""), 1)

    seed = f"{mode}|{intent}|{emotion}|{reflection}|{core}|{question}"
    opener = _choose_opener(mode, last_openers, seed)
    if opener:
        last_openers.append(opener)
        if len(last_openers) > 5:
            del last_openers[:-5]

    parts: List[str] = []

    if mode in {"reflection", "compassion", "reframe", "summary"}:
        parts.append(_combine_opener(opener, reflection or core))
        if reflection and core:
            parts.append(core)
    elif mode == "options":
        parts.append(_combine_opener(opener, reflection or ""))
        options = [o.strip() for o in core.split(" | ") if o.strip()]
        if options:
            parts.append("\n".join([f"- {opt}" for opt in options[:4]]))
    elif mode == "micro_plan":
        parts.append(_combine_opener(opener, reflection or ""))
        steps = [s.strip() for s in core.split(" | ") if s.strip()] or _split_sentences(core)
        if steps:
            parts.append("\n".join([f"{idx + 1}) {step}" for idx, step in enumerate(steps[:3])]))
    elif mode == "values":
        parts.append(_combine_opener(opener, reflection or ""))
        if core:
            parts.append(core)
    elif mode == "curious":
        parts.append(_combine_opener(opener, reflection or core))
    else:
        parts.append(_combine_opener(opener, reflection or core))
        if reflection and core:
            parts.append(core)

    if tagline:
        parts.append(tagline)

    if not question:
        question = "What feels like the hardest part of this right now?"

    existing_text = "\n".join(parts)
    if question and question.lower() in existing_text.lower():
        question = ""

    if question:
        parts.append(question)
    return "\n".join([p for p in parts if p])
