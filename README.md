# EVA: Empathetic Voice Assistant

A voice-to-voice AI reflective coach for practice and education.

## Tech Stack
- **Speech-to-Text:** Whisper via faster-whisper
- **Intent Detection:** HuggingFace Transformers (zero-shot classification, `distilbert-base-uncased-mnli`)
- **Emotion Detection:** HuggingFace Transformers (`distilbert-base-uncased-emotion`)
- **Response Generation:** Groq (OpenAI-compatible API, default model: `llama-3.3-70b-versatile`)
- **Text-to-Speech:** ElevenLabs
- **Backend:** Python + FastAPI
- **Frontend:** Next.js + shadcn/ui (Radix + Tailwind CSS)
- **Realtime:** WebSockets streaming response tokens to the browser

## Prerequisites
- Python 3.10+
- Node.js 18+
- FFmpeg (`brew install ffmpeg` on macOS)

## Setup

### Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Fill in GROQ_API_KEY and ELEVENLABS_API_KEY
```

### Frontend
```bash
cd frontend
pnpm install   # or npm install
```

The first run will automatically download the HuggingFace intent and emotion model weights.

## Run

Both servers must run simultaneously:

```bash
# Terminal 1 — backend
cd backend
source .venv/bin/activate
uvicorn app:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
pnpm dev
```

Open http://localhost:3000

## How It Works

1. Browser records audio (WebM/opus) via MediaRecorder
2. Audio is sent to the Next.js proxy route, which forwards to the FastAPI backend
3. Backend converts audio to WAV (16kHz mono) via ffmpeg and transcribes with Whisper
4. Transcript is sent over WebSocket for the response pipeline:
   - **Safety check** — regex keyword gate; returns crisis resources on high-risk input
   - **Intent classification** — zero-shot classification (venting, stress, anxiety, relationship, goal_setting, burnout, grief)
   - **Emotion detection** — classifies emotion (joy, sadness, anger, fear, love, surprise)
   - **Mode selection** — picks a response style (reflection, reframe, options, values, micro_plan, summary, compassion, curious) based on intent + emotion, rotating to avoid repetition
   - **LLM response plan** — Groq generates a structured JSON plan (reflection, core guidance, question, tagline)
   - **Renderer** — assembles the plan into natural text with varied openers
   - **TTS** — ElevenLabs generates MP3 audio
5. Response streams back as tokens over WebSocket, then final text + audio URL
6. Browser plays the MP3 response

## Environment Variables

See `backend/.env.example` for all options:

| Variable | Description | Default |
|---|---|---|
| `GROQ_API_KEY` | Groq API key (required) | — |
| `ELEVENLABS_API_KEY` | ElevenLabs API key (required) | — |
| `GROQ_MODEL` | LLM model | `llama-3.3-70b-versatile` |
| `WHISPER_MODEL` | Whisper model size | `base` |
| `ELEVENLABS_VOICE_ID` | ElevenLabs voice | `EXAVITQu4vr4xnSDxMaL` |
| `ELEVENLABS_MODEL_ID` | ElevenLabs model | `eleven_turbo_v2` |
| `CORS_ALLOW_ORIGINS` | Allowed CORS origins | `*` |
