import re

#safety stuff
HIGH_RISK_PATTERNS = [
    r"\bkill myself\b",
    r"\bsuicide\b",
    r"\bend my life\b",
    r"\bwant to die\b",
    r"\bself[- ]?harm\b",
    r"\bcut myself\b",
    r"\boverdose\b",
    r"\bi'm going to (hurt|harm) myself\b",
    r"\bno reason to live\b",
]

MEDIUM_RISK_PATTERNS = [
    r"\bhopeless\b",
    r"\bworthless\b",
    r"\bcan't go on\b",
    r"\bpanic attack\b",
]

def risk_level_from_text(text: str) -> str:
    t = (text or "").lower()
    for p in HIGH_RISK_PATTERNS:
        if re.search(p, t):
            return "high"
    for p in MEDIUM_RISK_PATTERNS:
        if re.search(p, t):
            return "medium"
    return "none"

def safety_message() -> str:
    return (
        "I’m really sorry you’re going through this. I can’t help with self-harm. "
        "If you’re in the US, you can call or text 988 (Suicide and Crisis Lifeline). "
        "If you are in immediate danger, call 911 or your local emergency number. "
        "If you can, reach out to someone you trust and stay with them."
    )
