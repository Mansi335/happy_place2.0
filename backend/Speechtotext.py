import logging
import os
import subprocess
import uuid
from collections import defaultdict

import librosa
import numpy as np
import speech_recognition as sr
from transformers import pipeline


LOGGER = logging.getLogger(__name__)
TEMP_DIR = "temp"
EMOTION_MODEL = "superb/wav2vec2-base-superb-er"

# Load once globally.
LOGGER.info("Loading speech emotion model: %s", EMOTION_MODEL)
EMOTION_PIPELINE = pipeline("audio-classification", model=EMOTION_MODEL, framework="pt")


def _convert_to_wav_16k_mono(input_path: str) -> str:
    os.makedirs(TEMP_DIR, exist_ok=True)
    output_path = os.path.join(TEMP_DIR, f"{uuid.uuid4().hex}.wav")
    # Suppress ffmpeg noise while preserving errors.
    cmd = [
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-nostats",
        "-i",
        input_path,
        "-ac",
        "1",
        "-ar",
        "16000",
        output_path,
    ]
    subprocess.run(cmd, check=True)
    return output_path


def _speech_to_text(wav_path: str) -> str:
    recognizer = sr.Recognizer()
    with sr.AudioFile(wav_path) as source:
        audio_data = recognizer.record(source)
    try:
        return recognizer.recognize_google(audio_data)
    except sr.UnknownValueError:
        return "Could not understand speech"
    except sr.RequestError:
        return "Speech recognition service unavailable"


def _detect_emotion(wav_path: str) -> str:
    audio_array, _ = librosa.load(wav_path, sr=16000, mono=True)
    LOGGER.info("Audio samples for emotion detection: %d", len(audio_array))
    if len(audio_array) < 1000:
        return "Unknown"

    # Normalize and trim silence to reduce false "angry" spikes.
    audio_array = librosa.util.normalize(audio_array)
    trimmed, _ = librosa.effects.trim(audio_array, top_db=25)
    if len(trimmed) >= 1000:
        audio_array = trimmed

    # Run chunked inference and aggregate by score for stability.
    chunk_size = int(1.8 * 16000)  # ~1.8s
    hop = int(0.9 * 16000)         # 50% overlap
    scores = defaultdict(float)

    if len(audio_array) < chunk_size:
        chunks = [audio_array]
    else:
        chunks = []
        for start in range(0, max(1, len(audio_array) - chunk_size + 1), hop):
            chunks.append(audio_array[start:start + chunk_size])
        if not chunks:
            chunks = [audio_array]

    for chunk in chunks:
        result = EMOTION_PIPELINE(chunk, top_k=5)
        if isinstance(result, list) and result and isinstance(result[0], dict):
            for pred in result:
                label = str(pred.get("label", "Unknown"))
                score = float(pred.get("score", 0.0))
                scores[label] += score

    if not scores:
        return "Unknown"

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    best_label, best_score = ranked[0]
    second_score = ranked[1][1] if len(ranked) > 1 else 0.0

    # If prediction is weak/ambiguous, prefer neutral instead of overconfident anger.
    if best_score < 0.85 or (best_score - second_score) < 0.12:
        return "Neutral"

    # Keep labels user-friendly.
    label_map = {
        "ang": "Angry",
        "hap": "Happy",
        "sad": "Sad",
        "neu": "Neutral",
    }
    return label_map.get(best_label.lower(), best_label)


def process_audio_file(input_path: str) -> dict:
    """
    Convert uploaded audio to wav, run speech-to-text + emotion detection.
    Returns dict: {"status","text","emotion"}.
    """
    wav_path = None
    try:
        wav_path = _convert_to_wav_16k_mono(input_path)
        text = _speech_to_text(wav_path)
        emotion = _detect_emotion(wav_path)
        return {"status": "success", "text": text, "emotion": emotion}
    except subprocess.CalledProcessError as exc:
        LOGGER.exception("ffmpeg conversion failed: %s", exc)
        return {"status": "error", "error": "Audio conversion failed. Ensure ffmpeg is installed."}
    except Exception as exc:
        LOGGER.exception("Speech processing failed: %s", exc)
        return {"status": "error", "error": str(exc)}
    finally:
        for path in (wav_path, input_path):
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except OSError:
                    pass
