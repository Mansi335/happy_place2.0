import logging
import os
import subprocess
import uuid

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

    result = EMOTION_PIPELINE(audio_array)
    if not result:
        return "Unknown"
    return result[0].get("label", "Unknown")


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
