import os
import base64
from typing import Optional

# Attempt to reuse the project's existing whisper wrapper if available
try:
    from braille.whisper_speech import speech_to_text
except Exception:
    # Fallback: try to import from top-level if running from other working dir
    from .. import braille  # type: ignore
    from braille.whisper_speech import speech_to_text  # type: ignore


DATASET_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "dataset"))


def _get_letters():
    if not os.path.exists(DATASET_DIR):
        return []
    letters = [f for f in os.listdir(DATASET_DIR) if not f.startswith(".")]
    letters.sort()
    return letters


def _find_letter_in_text(text: str) -> Optional[str]:
    text_upper = text.upper()
    letters = _get_letters()
    # Try exact match against any letter folder name
    for letter in letters:
        if letter.upper() in text_upper:
            return letter

    # If text is a single character, return that if it's a valid letter
    if len(text_upper) == 1 and text_upper in [l.upper() for l in letters]:
        return text_upper

    return None


def process_audio(file_path: str) -> dict:
    """
    Transcribe audio using the project's whisper wrapper and try to match a dataset letter.

    Returns a dict with keys: transcription, letter (or null), image_base64 (or null)
    """
    transcription = ""
    letter = None
    image_b64 = None

    try:
        transcription = speech_to_text(file_path)
    except Exception as e:
        transcription = f"ERROR: {e}"

    try:
        letter = _find_letter_in_text(transcription)
    except Exception:
        letter = None

    if letter:
        # Look for an image in dataset/<LETTER>/image.png
        img_path = os.path.join(DATASET_DIR, letter, "image.png")
        if os.path.exists(img_path):
            with open(img_path, "rb") as f:
                image_b64 = base64.b64encode(f.read()).decode("utf-8")

    return {
        "text": transcription,
        "letter": letter,
        "image_base64": image_b64,
    }
