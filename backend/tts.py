import os
import json
from pathlib import Path
import requests

ELEVEN_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

def elevenlabs_tts_to_mp3(text: str, out_mp3_path: Path) -> None:
    # Generate speech audio via ElevenLabs and write an MP3 file.
    api_key = os.getenv("ELEVENLABS_API_KEY")
    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL")
    model_id = os.getenv("ELEVENLABS_MODEL_ID", "eleven_turbo_v2")

    if not api_key:
        raise RuntimeError("Missing ELEVENLABS_API_KEY (set it in backend/.env).")

    url = ELEVEN_TTS_URL.format(voice_id=voice_id)
    headers = {
        "xi-api-key": api_key,
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
    }

    payload = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {"stability": 0.4, "similarity_boost": 0.75},
    }

    r = requests.post(url, headers=headers, data=json.dumps(payload), timeout=60)
    r.raise_for_status()

    out_mp3_path.parent.mkdir(parents=True, exist_ok=True)
    out_mp3_path.write_bytes(r.content)
