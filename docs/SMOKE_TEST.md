Smoke Test

Backend
- `cd backend && source .venv/bin/activate && uvicorn app:app --reload --port 8000`

Frontend
- `cd frontend/voicetherapy && npm run dev`

Manual steps
1) Open `http://localhost:3000`
2) Click Enter to go to `/session`
3) Click the mic and speak for 5–10 seconds
4) Confirm partial transcript updates live
5) Click mic again to stop
6) Confirm pills update (intent/emotion/mode/risk), assistant text streams, and MP3 plays
