import base64
import json
import logging
import os
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from faster_whisper import WhisperModel

from emotion import detect_emotion
from intent import classify_intent
from llm import plan_response_json, stream_reflective_response
from mode import allowed_modes, choose_mode
from renderer import render_from_plan
from safety import risk_level_from_text, safety_message
from tts import elevenlabs_tts_to_mp3
from utils_audio import to_wav_16k_mono

load_dotenv()

BASE_DIR = Path(__file__).parent
TMP_DIR = BASE_DIR / "tmp"
TMP_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Voice-to-Voice Reflective Coach (MVP)")
logger = logging.getLogger("uvicorn.error")

cors_origins = os.getenv("CORS_ALLOW_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in cors_origins if o.strip()] or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL", "base")
whisper = WhisperModel(WHISPER_MODEL_SIZE, device="auto", compute_type="int8")

SESSIONS: Dict[str, Dict[str, Any]] = {}


def get_session(session_id: str) -> Dict[str, Any]:
    session = SESSIONS.get(session_id)
    if isinstance(session, list):
        session = {"history": session, "last_modes": [], "last_openers": []}
    elif not session:
        session = {"history": [], "last_modes": [], "last_openers": []}
    SESSIONS[session_id] = session
    return session


def disallowed_openers_from_history(history: List[Dict[str, str]], last_openers: List[str]) -> List[str]:
    phrases: List[str] = []
    assistant_msgs = [m for m in history if m.get("role") == "assistant"]
    for msg in assistant_msgs[-2:]:
        words = (msg.get("content") or "").split()
        if len(words) >= 2:
            phrases.append(" ".join(words[:4]))
    phrases.extend(last_openers[-5:])
    return [p for p in phrases if p]


def chunk_text(text: str, max_len: int = 18) -> List[str]:
    if not text:
        return []
    return [text[i : i + max_len] for i in range(0, len(text), max_len)]


def ext_from_mime(mime_type: str) -> str:
    if "mp4" in mime_type:
        return "mp4"
    if "ogg" in mime_type:
        return "ogg"
    if "webm" in mime_type:
        return "webm"
    return "webm"


class TtsRequest(BaseModel):
    text: str
    session_id: str | None = None


async def transcribe_buffer(
    ws: WebSocket,
    session_id: str,
    audio_bytes: bytearray,
    audio_ext: str,
    last_partial: str,
    last_transcribe_at: float,
    force: bool = False,
    min_interval_s: float = 0.5,
):
    now = time.monotonic()
    if not force and now - last_transcribe_at < min_interval_s:
        return last_partial, last_transcribe_at

    if not audio_bytes:
        return last_partial, last_transcribe_at

    raw_path = TMP_DIR / f"{session_id}_stream_in.{audio_ext}"
    wav_path = TMP_DIR / f"{session_id}_stream_in.wav"
    raw_path.write_bytes(audio_bytes)

    try:
        to_wav_16k_mono(raw_path, wav_path)
    except Exception:
        return last_partial, now

    segments, _info = whisper.transcribe(str(wav_path), vad_filter=True)
    transcript = " ".join([seg.text.strip() for seg in segments]).strip()

    if transcript and transcript != last_partial:
        await ws.send_json({"type": "partial_transcript", "text": transcript})
        return transcript, now

    return last_partial, now


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...), session_id: str = Form(default="")):
    if not session_id:
        session_id = str(uuid.uuid4())

    ext = (audio.filename.split(".")[-1] if audio.filename else "webm").lower()
    raw_path = TMP_DIR / f"{session_id}_in.{ext}"
    wav_path = TMP_DIR / f"{session_id}_in.wav"

    with raw_path.open("wb") as f:
        f.write(await audio.read())

    try:
        to_wav_16k_mono(raw_path, wav_path)
    except Exception as e:
        return JSONResponse({"error": f"Audio convert failed (ffmpeg). {e}", "session_id": session_id}, status_code=400)

    segments, _info = whisper.transcribe(str(wav_path), vad_filter=True)
    transcript = " ".join([seg.text.strip() for seg in segments]).strip()

    session = get_session(session_id)
    session["history"].append({"role": "user", "content": transcript or "[unintelligible]"})
    return {"session_id": session_id, "transcript": transcript}


@app.post("/tts")
async def tts(payload: TtsRequest):
    text = (payload.text or "").strip()
    if not text:
        return JSONResponse({"error": "Missing text"}, status_code=400)

    session_id = payload.session_id or str(uuid.uuid4())
    out_name = f"{session_id}-{int(time.time())}.mp3"
    out_path = TMP_DIR / out_name

    try:
        elevenlabs_tts_to_mp3(text, out_path)
    except Exception as exc:
        logger.exception("TTS generation failed")
        return JSONResponse({"error": "TTS generation failed", "details": str(exc)}, status_code=502)

    return {"filename": out_name}


@app.get("/audio/{filename}")
def get_audio(filename: str):
    path = TMP_DIR / filename
    if not path.exists():
        return JSONResponse({"error": "Audio not found"}, status_code=404)
    return FileResponse(path, media_type="audio/mpeg")


@app.websocket("/ws/chat")
async def ws_chat(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            payload = await ws.receive_json()
            session_id = payload.get("session_id") or str(uuid.uuid4())
            user_text = (payload.get("user_text") or "").strip()

            session = get_session(session_id)
            history = session["history"]
            last_modes = session["last_modes"]
            last_openers = session["last_openers"]
            prompt_history = history[-10:]

            risk = risk_level_from_text(user_text)
            intent = classify_intent(user_text) if user_text else "other"
            emotion = detect_emotion(user_text)
            allowed = allowed_modes(intent, emotion)
            turn_index = sum(1 for m in history if m.get("role") == "user")
            mode = choose_mode(allowed, last_modes, seed=f"{session_id}:{turn_index}")

            await ws.send_json(
                {
                    "type": "meta",
                    "session_id": session_id,
                    "intent": intent,
                    "emotion": emotion,
                    "mode": mode,
                    "risk_level": risk,
                }
            )

            if user_text:
                history.append({"role": "user", "content": user_text})

            if risk == "high":
                msg = safety_message()
                history.append({"role": "assistant", "content": msg})

                out_name = f"{session_id}_out.mp3"
                out_path = TMP_DIR / out_name
                audio_url = ""
                try:
                    elevenlabs_tts_to_mp3(msg, out_path)
                    audio_url = f"/audio/{out_name}"
                except Exception:
                    audio_url = ""

                await ws.send_json({"type": "final", "session_id": session_id, "text": msg, "audio_url": audio_url})
                continue

            disallowed_openers = disallowed_openers_from_history(prompt_history, last_openers)
            plan = plan_response_json(prompt_history, user_text, intent, emotion, mode, disallowed_openers)
            final_text = render_from_plan(plan, mode, intent, emotion, last_openers).strip()
            if not final_text:
                final_text = "I hear you. What feels like the hardest part of this right now?"

            for chunk in chunk_text(final_text):
                await ws.send_json({"type": "token", "delta": chunk})

            history.append({"role": "assistant", "content": final_text})
            last_modes.append(mode)
            if len(last_modes) > 5:
                del last_modes[:-5]

            out_name = f"{session_id}_out.mp3"
            out_path = TMP_DIR / out_name
            audio_url = ""
            try:
                elevenlabs_tts_to_mp3(final_text, out_path)
                audio_url = f"/audio/{out_name}"
            except Exception:
                audio_url = ""

            await ws.send_json({"type": "final", "session_id": session_id, "text": final_text, "audio_url": audio_url})

    except WebSocketDisconnect:
        return


@app.websocket("/ws/stream")
async def ws_stream(ws: WebSocket):
    # Client -> start/end control messages + binary audio chunks
    # Server -> partial_transcript, meta, token, final
    await ws.accept()

    session_id = ""
    audio_ext = "webm"
    audio_bytes = bytearray()
    last_partial = ""
    last_transcribe_at = 0.0

    try:
        while True:
            message = await ws.receive()
            if message.get("type") == "websocket.disconnect":
                break
            text = message.get("text")
            data_bytes = message.get("bytes")

            if data_bytes:
                if not session_id:
                    session_id = str(uuid.uuid4())
                audio_bytes.extend(data_bytes)
                last_partial, last_transcribe_at = await transcribe_buffer(
                    ws,
                    session_id,
                    audio_bytes,
                    audio_ext,
                    last_partial,
                    last_transcribe_at,
                )
                continue

            if not text:
                continue

            try:
                payload = json.loads(text)
            except json.JSONDecodeError:
                continue

            msg_type = payload.get("type")

            if msg_type == "start":
                session_id = payload.get("session_id") or str(uuid.uuid4())
                mime_type = payload.get("mime_type", "")
                audio_ext = payload.get("ext") or ext_from_mime(mime_type)
                audio_bytes = bytearray()
                last_partial = ""
                last_transcribe_at = 0.0
                get_session(session_id)
                continue

            if msg_type == "audio_chunk":
                chunk_b64 = payload.get("chunk")
                if chunk_b64:
                    try:
                        audio_bytes.extend(base64.b64decode(chunk_b64))
                    except Exception:
                        continue
                    last_partial, last_transcribe_at = await transcribe_buffer(
                        ws,
                        session_id or str(uuid.uuid4()),
                        audio_bytes,
                        audio_ext,
                        last_partial,
                        last_transcribe_at,
                    )
                continue

            if msg_type == "end_of_speech":
                if not session_id:
                    session_id = str(uuid.uuid4())
                session = get_session(session_id)
                history = session["history"]
                last_modes = session["last_modes"]
                last_openers = session["last_openers"]
                prompt_history = history[-10:]

                last_partial, last_transcribe_at = await transcribe_buffer(
                    ws,
                    session_id,
                    audio_bytes,
                    audio_ext,
                    last_partial,
                    last_transcribe_at,
                    force=True,
                )

                final_transcript = last_partial.strip()
                if final_transcript:
                    history.append({"role": "user", "content": final_transcript})

                risk = risk_level_from_text(final_transcript)
                intent = classify_intent(final_transcript) if final_transcript else "other"
                emotion = detect_emotion(final_transcript)
                allowed = allowed_modes(intent, emotion)
                turn_index = sum(1 for m in history if m.get("role") == "user")
                mode = choose_mode(allowed, last_modes, seed=f"{session_id}:{turn_index}")

                await ws.send_json(
                    {
                        "type": "meta",
                        "session_id": session_id,
                        "intent": intent,
                        "emotion": emotion,
                        "mode": mode,
                        "risk_level": risk,
                        "transcript": final_transcript,
                    }
                )

                if not final_transcript:
                    await ws.send_json(
                        {
                            "type": "final",
                            "session_id": session_id,
                            "text": "I didn't catch that. Try again closer to the mic.",
                            "audio_url": "",
                        }
                    )
                    continue

                if risk == "high":
                    msg = safety_message()
                    history.append({"role": "assistant", "content": msg})

                    out_name = f"{session_id}_out.mp3"
                    out_path = TMP_DIR / out_name
                    audio_url = ""
                    try:
                        elevenlabs_tts_to_mp3(msg, out_path)
                        audio_url = f"/audio/{out_name}"
                    except Exception:
                        audio_url = ""

                    await ws.send_json(
                        {"type": "final", "session_id": session_id, "text": msg, "audio_url": audio_url}
                    )
                    continue

                disallowed_openers = disallowed_openers_from_history(prompt_history, last_openers)
                plan = plan_response_json(prompt_history, final_transcript, intent, emotion, mode, disallowed_openers)
                final_text = render_from_plan(plan, mode, intent, emotion, last_openers).strip()
                if not final_text:
                    final_text = "I hear you. What feels like the hardest part of this right now?"

                for chunk in chunk_text(final_text):
                    await ws.send_json({"type": "token", "delta": chunk})

                history.append({"role": "assistant", "content": final_text})
                last_modes.append(mode)
                if len(last_modes) > 5:
                    del last_modes[:-5]

                out_name = f"{session_id}_out.mp3"
                out_path = TMP_DIR / out_name
                audio_url = ""
                try:
                    elevenlabs_tts_to_mp3(final_text, out_path)
                    audio_url = f"/audio/{out_name}"
                except Exception:
                    audio_url = ""

                await ws.send_json(
                    {"type": "final", "session_id": session_id, "text": final_text, "audio_url": audio_url}
                )

    except WebSocketDisconnect:
        return
