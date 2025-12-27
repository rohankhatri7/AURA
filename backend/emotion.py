import os
from typing import Tuple

from transformers import pipeline

DEFAULT_MODEL = "bhadresh-savani/distilbert-base-uncased-emotion"
EMOTION_MODEL = os.getenv("EMOTION_MODEL", DEFAULT_MODEL)

_emotion_pipe = None

_LABEL_MAP = {
    "joy": "joy",
    "sadness": "sadness",
    "anger": "anger",
    "fear": "fear",
    "love": "love",
    "surprise": "surprise",
    "neutral": "neutral",
}


def _get_pipe():
    global _emotion_pipe
    if _emotion_pipe is None:
        _emotion_pipe = pipeline("text-classification", model=EMOTION_MODEL, top_k=1)
    return _emotion_pipe


def _normalize(label: str) -> str:
    if not label:
        return "neutral"
    return _LABEL_MAP.get(label.lower(), "neutral")


def detect_emotion_with_score(text: str) -> Tuple[str, float]:
    if not text.strip():
        return "neutral", 0.0

    pipe = _get_pipe()
    result = pipe(text, truncation=True)

    best = None
    if isinstance(result, dict):
        best = result
    elif isinstance(result, list) and result:
        first = result[0]
        if isinstance(first, list) and first:
            best = max(first, key=lambda d: d.get("score", 0.0) if isinstance(d, dict) else 0.0)
        elif isinstance(first, dict):
            best = first

    if not isinstance(best, dict):
        return "neutral", 0.0

    label = _normalize(best.get("label", "neutral"))
    score = float(best.get("score", 0.0) or 0.0)
    return label, score


def detect_emotion(text: str) -> str:
    label, _score = detect_emotion_with_score(text)
    return label
