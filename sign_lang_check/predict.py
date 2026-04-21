#predict using that model
# Use the same venv as training, e.g.: ml_env/bin/python sign_lang_check/predict.py

import cv2
import mediapipe as mp
import numpy as np
import os
import tensorflow as tf
from collections import deque

from landmarks import normalize_hand_xy

ACTIONS = ['Hello', 'ThankYou', 'GoodMorning', 'Sorry', 'HowAreYou']
SEQUENCE_LENGTH = 30
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, 'model')
MODEL_PATH = os.path.join(MODEL_DIR, 'lstm_model.h5')
ACTIONS_PATH = os.path.join(MODEL_DIR, 'actions.npy')


class CompatLSTM(tf.keras.layers.LSTM):
    def __init__(self, *args, time_major=None, **kwargs):
        super().__init__(*args, **kwargs)


class CompatDense(tf.keras.layers.Dense):
    """Ignore extra keys (e.g. quantization_config) saved by newer Keras in .h5."""

    def __init__(self, *args, quantization_config=None, **kwargs):
        super().__init__(*args, **kwargs)


if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Run train_model.py first.")

if os.path.exists(ACTIONS_PATH):
    ACTIONS = np.load(ACTIONS_PATH, allow_pickle=True).tolist()

model = tf.keras.models.load_model(
    MODEL_PATH,
    compile=False,
    custom_objects={"LSTM": CompatLSTM, "Dense": CompatDense},
)

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    model_complexity=1,
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6,
)
mp_draw = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0, cv2.CAP_AVFOUNDATION)
sequence = []
prob_history = deque(maxlen=6)

import time

# Interactive game variables
target_idx = 0
correct_message_time = 0
correct_streak = 0
STREAK_REQUIRED = 4
MIN_CONFIDENCE = 0.6

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(image)
    
    current_time = time.time()
    
    if target_idx < len(ACTIONS):
        target_word = ACTIONS[target_idx]
        
        cv2.putText(frame, f"Please sign: {target_word}", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
        
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
                
                landmarks = []
                for lm in hand_landmarks.landmark:
                    landmarks.append(lm.x)
                    landmarks.append(lm.y)
                sequence.append(normalize_hand_xy(np.array(landmarks, dtype=np.float32)))
                if len(sequence) > SEQUENCE_LENGTH:
                    sequence.pop(0)

            if len(sequence) == SEQUENCE_LENGTH:
                res = model.predict(np.expand_dims(sequence, axis=0), verbose=0)[0]
                prob_history.append(res)
                smooth_res = np.mean(prob_history, axis=0)
                predicted_idx = int(np.argmax(smooth_res))
                confidence = float(smooth_res[predicted_idx])
                predicted_word = ACTIONS[predicted_idx]
                
                # Show what the AI currently thinks
                cv2.putText(frame, f"Seeing: {predicted_word} ({confidence:.2f})", (10, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                
                # Require stable correct predictions across consecutive frames.
                if predicted_word == target_word and confidence > MIN_CONFIDENCE:
                    correct_streak += 1
                else:
                    correct_streak = 0

                cv2.putText(
                    frame,
                    f"Hold steady: {correct_streak}/{STREAK_REQUIRED}",
                    (10, 135),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 200, 0),
                    2,
                )

                if correct_streak >= STREAK_REQUIRED:
                    correct_message_time = time.time()
                    target_idx += 1
                    sequence = []  # Clear memory for next sign
                    correct_streak = 0
        else:
            correct_streak = 0
            sequence = []
            prob_history.clear()
                    
        # Display success message as an overlay for 1.5 seconds WITHOUT pausing completion logic
        if current_time - correct_message_time < 1.5:
            cv2.putText(frame, "Correct!", (150, 400), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 0), 5)

    else:
        cv2.putText(frame, "All signs completed!", (50, 250), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 4)

    # Display keyboard shortcut helper
    cv2.putText(frame, "Press 'n' to skip | 'q' to quit", (10, 450), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

    cv2.imshow('Predict Learning Mode', frame)
    
    key = cv2.waitKey(10) & 0xFF
    if key == ord('q'):
        break
    elif key == ord('n'):
        # Force skip to next word
        if target_idx < len(ACTIONS):
            target_idx += 1
            sequence = []
            correct_streak = 0
            prob_history.clear()

cap.release()
cv2.destroyAllWindows()