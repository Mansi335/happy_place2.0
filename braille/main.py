import os
import cv2

try:
    from .audio_record import record_audio
except ImportError:
    from audio_record import record_audio


def _speech_to_text(path: str) -> str:
    """Lazy-import Whisper so `/braille/state` does not load the model."""
    try:
        from .whisper_speech import speech_to_text
    except ImportError:
        from whisper_speech import speech_to_text
    return speech_to_text(path)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET = os.path.join(BASE_DIR, "dataset")
AUDIO_FILE = os.path.join(BASE_DIR, "user_audio.wav")

letters = [f for f in os.listdir(DATASET) if not f.startswith(".") and os.path.isdir(os.path.join(DATASET, f))]
letters.sort()

index = 0


def get_letter_image_path(letter: str):
    folder = os.path.join(DATASET, letter)
    if not os.path.isdir(folder):
        return None
    for name in sorted(os.listdir(folder)):
        lower = name.lower()
        if lower.endswith((".png", ".jpg", ".jpeg", ".webp")):
            return os.path.join(folder, name)
    return None


def reset_session():
    global index
    index = 0


def get_state():
    """JSON-safe state for API / frontend."""
    done = index >= len(letters)
    current = None if done else letters[index]
    rel_image = None
    if current:
        p = get_letter_image_path(current)
        if p:
            rel_image = os.path.basename(p)
    return {
        "letters": letters,
        "index": index,
        "total": len(letters),
        "current": current,
        "done": done,
        "image_filename": rel_image,
    }


def process_spoken_text(spoken: str):
    """Advance index when spoken text contains the expected letter name."""
    global index

    spoken_clean = (spoken or "").strip()
    if index >= len(letters):
        return {"status": "done", "message": "All letters completed!"}

    correct = letters[index]
    if correct.lower() in spoken_clean.lower():
        index += 1
        return {
            "status": "correct",
            "letter": correct,
            "spoken": spoken_clean,
        }
    return {
        "status": "wrong",
        "letter": correct,
        "spoken": spoken_clean,
    }


def verify_audio_file(path: str):
    """Run Whisper on an uploaded/recorded file and compare to current target."""
    spoken = _speech_to_text(path)
    out = process_spoken_text(spoken)
    out["transcript"] = spoken
    return out


def run_braille(show_preview: bool = True):
    """CLI: optional OpenCV preview, then record + Whisper (blocking)."""
    global index

    if index >= len(letters):
        return {"status": "done", "message": "All letters completed!"}

    correct = letters[index]
    if show_preview:
        image_path = get_letter_image_path(correct)
        if image_path:
            img = cv2.imread(image_path)
            if img is not None:
                preview = cv2.resize(img, (400, 400))
                cv2.putText(
                    preview,
                    f"Braille Letter: {correct}",
                    (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 255, 0),
                    2,
                )
                cv2.imshow("Braille Prompt", preview)
                cv2.waitKey(1)

    record_audio(AUDIO_FILE)
    spoken = _speech_to_text(AUDIO_FILE)

    return process_spoken_text(spoken)


if __name__ == "__main__":
    print("Braille speech game started.")
    print("Press Ctrl+C to stop.\n")
    try:
        while True:
            result = run_braille(show_preview=True)
            print(result)
            if result.get("status") == "done":
                break
    except KeyboardInterrupt:
        print("\nStopped by user.")
    finally:
        cv2.destroyAllWindows()
