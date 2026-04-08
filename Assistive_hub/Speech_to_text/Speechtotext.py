import sounddevice as sd
import numpy as np
from transformers import pipeline
import speech_recognition as sr
import scipy.io.wavfile as wav

emotion_pipeline = pipeline(
    "audio-classification",
    model="superb/wav2vec2-base-superb-er",
    framework="pt"
)

samplerate = 16000
duration = 3

def record_audio():
    print("🎤 Speak now...")
    recording = sd.rec(
        int(duration * samplerate),
        samplerate=samplerate,
        channels=1,
        dtype='float32'
    )
    sd.wait()
    return recording

def audio_to_text(filename):
    recognizer = sr.Recognizer()
    with sr.AudioFile(filename) as source:
        audio = recognizer.record(source)
    try:
        return recognizer.recognize_google(audio)
    except:
        return "Could not understand"

if __name__ == "__main__":
    while True:
        audio = record_audio()

        # ✅ FIX: convert to int16
        audio_int16 = (audio * 32767).astype(np.int16)
        wav.write("temp.wav", samplerate, audio_int16)

        emotion = emotion_pipeline(audio.squeeze())[0]['label']
        text = audio_to_text("temp.wav")

        print("📝 Text:", text)
        print("😃 Emotion:", emotion)
        print("----------------------")