import random
from typing import List, Optional

MODES = [
    "reflection",
    "reframe",
    "options",
    "values",
    "micro_plan",
    "summary",
    "compassion",
    "curious",
]


def allowed_modes(intent: str, emotion: str) -> List[str]:
    allowed = set()

    if emotion in {"sadness", "fear"}:
        allowed.update({"compassion", "reflection", "micro_plan", "values"})
    if emotion == "anger":
        allowed.update({"reflection", "reframe", "options"})
    if emotion == "joy":
        allowed.update({"summary", "values", "micro_plan"})

    if intent == "goal_setting":
        allowed.update({"micro_plan", "options", "values"})

    allowed.add("reflection")
    return [mode for mode in MODES if mode in allowed]


def choose_mode(allowed: List[str], last_modes: List[str], seed: Optional[str] = None) -> str:
    if not allowed:
        return "reflection"

    recent = set(last_modes[-2:])
    candidates = [mode for mode in allowed if mode not in recent] or list(allowed)

    rng = random.Random()
    if seed is not None:
        rng.seed(hash(seed))

    return rng.choice(candidates)
