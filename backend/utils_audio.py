import subprocess
from pathlib import Path

def to_wav_16k_mono(src_path: Path, dst_path: Path) -> None:
    # converts browser audio to WAV 16kHz mono for Whisper. Requires ffmpeg.
    cmd = [
        "ffmpeg", "-y",
        "-i", str(src_path),
        "-ac", "1",
        "-ar", "16000",
        "-vn",
        str(dst_path),
    ]
    subprocess.run(cmd, check=True, capture_output=True)
