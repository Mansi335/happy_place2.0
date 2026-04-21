import numpy as np
import logging
import os

try:
    import mediapipe as mp
    from tensorflow.keras.models import load_model

    print("Loading Sign Language ML Models...")
    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(min_detection_confidence=0.5, min_tracking_confidence=0.5)

    # Assuming backend runs from 'backend' directory, the model is one level up in sign_lang_check/model
    MODEL_PATH = os.path.join("..", "sign_lang_check", "model", "lstm_model.h5")
    model = load_model(MODEL_PATH)
    
    actions = ['Hello', 'ThankYou', 'GoodMorning', 'Sorry', 'HowAreYou']
    print("Sign Language Model loaded successfully.")
    MODELS_LOADED = True

except Exception as e:
    logging.error(f"Failed to load Sign Language models: {e}")
    MODELS_LOADED = False


def extract_landmarks(image_rgb) -> list:
    """Pass an RGB cv2 image, returns the (42) flat landmarks if found, else empty list"""
    if not MODELS_LOADED: return []

    results = hands.process(image_rgb)
    landmarks = []
    
    if results.multi_hand_landmarks:
        # Just grab the first hand for simplicity
        for lm in results.multi_hand_landmarks[0].landmark:
            landmarks.append(lm.x)
            landmarks.append(lm.y)
            
    return landmarks


def predict_sign(sequence: list) -> dict:
    """Pass a sequence of 30 landmark arrays (each 42 length), returns prediction and confidence"""
    if not MODELS_LOADED or len(sequence) != 30:
        return {"word": None, "confidence": 0.0}

    # Model expects input of shape (1, 30, 42)
    input_data = np.expand_dims(sequence, axis=0)
    res = model.predict(input_data, verbose=0)[0]
    
    predicted_idx = np.argmax(res)
    confidence = float(res[predicted_idx])
    word = actions[predicted_idx]

    return {
        "word": word,
        "confidence": confidence
    }
