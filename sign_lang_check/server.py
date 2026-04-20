import base64
import os
import time
import uuid
from collections import deque
from typing import Deque, Dict, List

import cv2
import mediapipe as mp
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from tensorflow.keras.models import load_model

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "lstm_model.h5")
ACTIONS_PATH = os.path.join(BASE_DIR, "model", "actions.npy")

SEQUENCE_LENGTH = 30
HISTORY_LENGTH = 6
STREAK_REQUIRED = 4
MIN_CONFIDENCE = 0.6
SESSION_TTL_SECONDS = 60 * 20


def load_actions() -> List[str]:
    if os.path.exists(ACTIONS_PATH):
        return np.load(ACTIONS_PATH, allow_pickle=True).tolist()
    return ["Hello", "ThankYou", "GoodMorning", "Sorry", "HowAreYou"]


if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model not found at: {MODEL_PATH}. Run train_model.py first.")

ACTIONS = load_actions()
MODEL = load_model(MODEL_PATH)

mp_hands = mp.solutions.hands
HANDS = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    model_complexity=1,
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6,
)

app = Flask(__name__)
CORS(app)


def new_session_state() -> Dict:
    return {
        "sequence": deque(maxlen=SEQUENCE_LENGTH),
        "prob_history": deque(maxlen=HISTORY_LENGTH),
        "correct_streak": 0,
        "target_idx": 0,
        "score": 0,
        "updated_at": time.time(),
    }


SESSIONS: Dict[str, Dict] = {}


def cleanup_expired_sessions() -> None:
    now = time.time()
    expired = [sid for sid, state in SESSIONS.items() if now - state["updated_at"] > SESSION_TTL_SECONDS]
    for sid in expired:
        del SESSIONS[sid]


def decode_data_url_to_bgr(data_url: str):
    if not data_url or "," not in data_url:
        return None
    try:
        _, encoded = data_url.split(",", 1)
        img_bytes = base64.b64decode(encoded)
        arr = np.frombuffer(img_bytes, dtype=np.uint8)
        frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return frame
    except Exception:
        return None


def extract_landmarks(frame_bgr):
    rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    results = HANDS.process(rgb)
    if not results.multi_hand_landmarks:
        return None
    hand_landmarks = results.multi_hand_landmarks[0]
    points = []
    for lm in hand_landmarks.landmark:
        points.append(lm.x)
        points.append(lm.y)
    return np.array(points, dtype=np.float32)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True, "actions": ACTIONS})


@app.route("/sign-lang/session", methods=["POST"])
def start_session():
    cleanup_expired_sessions()
    sid = str(uuid.uuid4())
    SESSIONS[sid] = new_session_state()
    return jsonify(
        {
            "session_id": sid,
            "actions": ACTIONS,
            "target_idx": 0,
            "target_word": ACTIONS[0],
            "score": 0,
            "streak_required": STREAK_REQUIRED,
            "min_confidence": MIN_CONFIDENCE,
        }
    )


@app.route("/sign-lang/reset", methods=["POST"])
def reset_session():
    data = request.get_json(silent=True) or {}
    sid = data.get("session_id")
    if not sid or sid not in SESSIONS:
        return jsonify({"error": "Invalid session_id"}), 400
    SESSIONS[sid] = new_session_state()
    return jsonify({"ok": True, "target_idx": 0, "target_word": ACTIONS[0], "score": 0})


@app.route("/sign-lang/predict", methods=["POST"])
def predict():
    cleanup_expired_sessions()
    data = request.get_json(silent=True) or {}
    sid = data.get("session_id")
    image_base64 = data.get("image")

    if not sid or sid not in SESSIONS:
        return jsonify({"error": "Invalid session_id"}), 400
    if not image_base64:
        return jsonify({"error": "Missing image"}), 400

    state = SESSIONS[sid]
    state["updated_at"] = time.time()
    target_idx = state["target_idx"]
    done = target_idx >= len(ACTIONS)
    if done:
        return jsonify(
            {
                "done": True,
                "status": "All signs completed!",
                "target_idx": target_idx,
                "score": state["score"],
            }
        )

    frame = decode_data_url_to_bgr(image_base64)
    if frame is None:
        return jsonify({"status": "Bad frame data", "target_word": ACTIONS[target_idx], "done": False})

    landmarks = extract_landmarks(frame)
    if landmarks is None:
        state["correct_streak"] = 0
        state["prob_history"].clear()
        return jsonify(
            {
                "done": False,
                "status": "Show one clear hand in camera",
                "target_word": ACTIONS[target_idx],
                "target_idx": target_idx,
                "correct_streak": 0,
                "streak_required": STREAK_REQUIRED,
                "score": state["score"],
            }
        )

    state["sequence"].append(landmarks)
    if len(state["sequence"]) < SEQUENCE_LENGTH:
        return jsonify(
            {
                "done": False,
                "status": f"Collecting frames: {len(state['sequence'])}/{SEQUENCE_LENGTH}",
                "target_word": ACTIONS[target_idx],
                "target_idx": target_idx,
                "correct_streak": state["correct_streak"],
                "streak_required": STREAK_REQUIRED,
                "score": state["score"],
            }
        )

    sequence_np = np.expand_dims(np.array(state["sequence"], dtype=np.float32), axis=0)
    probs = MODEL.predict(sequence_np, verbose=0)[0]
    state["prob_history"].append(probs)
    smooth_probs = np.mean(state["prob_history"], axis=0)

    pred_idx = int(np.argmax(smooth_probs))
    confidence = float(smooth_probs[pred_idx])
    predicted_word = ACTIONS[pred_idx]
    target_word = ACTIONS[target_idx]

    is_correct_now = predicted_word == target_word and confidence >= MIN_CONFIDENCE
    if is_correct_now:
        state["correct_streak"] += 1
    else:
        state["correct_streak"] = 0

    round_complete = state["correct_streak"] >= STREAK_REQUIRED
    if round_complete:
        state["target_idx"] += 1
        state["score"] += 1
        state["correct_streak"] = 0
        state["sequence"].clear()
        state["prob_history"].clear()

    next_done = state["target_idx"] >= len(ACTIONS)
    next_target = None if next_done else ACTIONS[state["target_idx"]]

    return jsonify(
        {
            "done": next_done,
            "status": "Correct!" if round_complete else "Keep holding the sign",
            "predicted_word": predicted_word,
            "confidence": confidence,
            "target_word": target_word,
            "target_idx": state["target_idx"],
            "correct_streak": state["correct_streak"],
            "streak_required": STREAK_REQUIRED,
            "score": state["score"],
            "round_complete": round_complete,
            "next_target": next_target,
        }
    )


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
