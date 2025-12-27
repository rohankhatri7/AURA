# AURA: Adaptive Understanding + Response Audio

A voice-to-voice AI therapist

## Tech stack
- **Speech-to-Text:** Whisper via faster-whisper
- **Intent Detection:** HuggingFace Transformers (zero-shot classification)
- **Emotion Detection:** HuggingFace Transformers (emotion classifier)
- **Response Generation:** Groq (OpenAI-compatible API)
- **Text-to-Speech:** ElevenLabs
- **Backend:** Python + FastAPI
- **Realtime:** WebSockets streaming assistant tokens to the browser
- **Frontend:** Next.js UI in `frontend/`

## 1) Prereqs
- Python 3.10+
- FFmpeg installed
  - macOS: `brew install ffmpeg`

## 2) Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Fill in GROQ_API_KEY + ELEVENLABS_API_KEY
```

Note: the **first run** will download the HF intent and emotion model weights.

## 3) Run
```bash
cd backend
source .venv/bin/activate
uvicorn app:app --reload --port 8000
```

Open:
- http://localhost:8000

## 4) Flow
1) Browser records audio (WebM)
2) `POST /transcribe` -> server converts to WAV (16kHz mono) and transcribes via Whisper
3) Browser opens WebSocket `ws://localhost:8000/ws/chat` and sends transcript
4) Server:
   - intent classification via HF transformers
   - emotion detection + mode rotation + JSON plan + renderer for variety
   - safety check (basic keyword gate for MVP)
   - streams Groq LLM tokens over WS
   - final TTS via ElevenLabs -> returns an `audio_url` (mp3)
5) Browser plays the mp3
