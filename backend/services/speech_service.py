import speech_recognition as sr
from transformers import pipeline
import librosa
import numpy as np
import logging

# Initialize the pipeline globally so it's only loaded once when the server starts.
# We'll use lazy loading if required to speed up startup, but for now we initialize it at import.
try:
    print("Loading emotion classification model (this may take a moment)...")
    emotion_pipeline = pipeline(
        "audio-classification",
        model="superb/wav2vec2-base-superb-er",
        framework="pt"
    )
    print("Emotion classification model loaded.")
except Exception as e:
    logging.error(f"Failed to load emotion model: {e}")
    emotion_pipeline = None

def process_audio(file_path: str):
    """
    Takes an audio file path, extracts text using speech_recognition, 
    and predicts emotion using transformers.
    """
    text = "Could not understand"
    emotion = "Unknown"
    
    # 1. Speech to Text
    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(file_path) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)
    except Exception as e:
        print(f"Speech recognition error: {e}")
        text = str(e)
        
    # 2. Emotion Detection
    if emotion_pipeline:
        try:
            # We need to process the audio to get exactly 16000 Hz, mono channel 
            # array for the wav2vec model 
            speech, rate = librosa.load(file_path, sr=16000)
            result = emotion_pipeline(speech)
            if result and len(result) > 0:
                emotion = result[0]['label']
        except Exception as e:
            print(f"Emotion extraction error: {e}")

    return {
        "text": text,
        "emotion": emotion
    }
