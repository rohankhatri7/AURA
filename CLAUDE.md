# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EVA (Empathetic Voice Assistant) — a voice-to-voice AI reflective coach. Users speak into the browser mic, speech is transcribed, an LLM generates a therapeutic-style response, and the response is spoken back via TTS.

## Development Commands

### Backend (Python + FastAPI)
```bash
cd backend
source .venv/bin/activate
uvicorn app:app --reload --port 8000
```
Setup: `python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`

Requires `ffmpeg` installed (`brew install ffmpeg` on macOS).

Environment: copy `backend/.env.example` to `backend/.env` and fill in `GROQ_API_KEY` and `ELEVENLABS_API_KEY`.

### Frontend (Next.js)
```bash
cd frontend
pnpm install   # or npm install (package-lock.json exists)
pnpm dev       # runs on port 3000
```

Both servers must run simultaneously. The frontend proxies API calls to the backend at `localhost:8000` via Next.js API routes in `frontend/app/api/`.

## Architecture

### Request Flow
1. Browser records audio (WebM/opus) via MediaRecorder
2. Audio blob → `POST /api/transcribe` (Next.js route) → proxied to FastAPI `POST /transcribe`
3. FastAPI converts to WAV 16kHz mono via ffmpeg (`utils_audio.py`), transcribes with faster-whisper
4. Frontend sends transcript over WebSocket (`/ws/chat`) or uses the streaming WebSocket (`/ws/stream`)
5. Backend pipeline per turn:
   - **Safety check** (`safety.py`) — regex keyword gate, returns crisis resources on high-risk
   - **Intent classification** (`intent.py`) — zero-shot classification via `distilbert-base-uncased-mnli`
   - **Emotion detection** (`emotion.py`) — `distilbert-base-uncased-emotion` classifier
   - **Mode selection** (`mode.py`) — picks a response style (reflection, reframe, options, values, micro_plan, summary, compassion, curious) based on intent+emotion, avoiding recent modes
   - **LLM plan** (`llm.py`) — Groq API (OpenAI-compatible) generates a structured JSON plan with reflection/core/question/tagline
   - **Renderer** (`renderer.py`) — assembles the plan into final text with varied openers, avoiding repetition
   - **TTS** (`tts.py`) — ElevenLabs API generates MP3
6. Response streamed as `token` messages over WS, then `final` with `audio_url`

### Two WebSocket Endpoints
- `/ws/chat` — client sends complete transcript as JSON, server responds with meta+tokens+final
- `/ws/stream` — client streams binary audio chunks during recording, server does incremental transcription (`partial_transcript` messages), then full pipeline on `end_of_speech`

### Frontend Structure
- `app/page.tsx` — landing page
- `app/session/page.tsx` — main session UI (mic button, transcript card, coach card). Currently uses a `simulateCoachResponse()` placeholder instead of the real WS pipeline
- `app/api/transcribe/route.ts` and `app/api/tts/route.ts` — proxy routes to the Python backend
- UI components use shadcn/ui (Radix primitives + Tailwind CSS v4)

### Backend State
Sessions are stored in-memory in `SESSIONS` dict (no persistence). Each session tracks conversation history, recent modes, and recent openers to drive variety.

### Key Config (env vars)
- `GROQ_MODEL` — LLM model (default: `llama-3.3-70b-versatile`)
- `WHISPER_MODEL` — Whisper model size (default: `base`)
- `ELEVENLABS_VOICE_ID` / `ELEVENLABS_MODEL_ID` — voice config
- `BACKEND_URL` — frontend env var to override backend URL (default: `http://localhost:8000`)

### HuggingFace Models
First run downloads intent and emotion model weights automatically. The pipelines are lazily initialized and cached.
