import os
from functools import lru_cache
from typing import List
from transformers import pipeline

LABELS: List[str] = [
    "venting",
    "stress",
    "anxiety",
    "relationship",
    "goal_setting",
    "burnout",
    "grief",
    "other",
]

@lru_cache(maxsize=1)
def _zsc():
    # using a zero shot classifier
    model_name = os.getenv("INTENT_ZSC_MODEL", "typeform/distilbert-base-uncased-mnli")
    return pipeline("zero-shot-classification", model=model_name)

def classify_intent(text: str) -> str:
    text = (text or "").strip()
    if not text:
        return "other"

    zsc = _zsc()
    result = zsc(text, candidate_labels=LABELS, multi_label=False)
    top = result["labels"][0] if result.get("labels") else "other"
    return top if top in LABELS else "other"
