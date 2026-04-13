import os
from whisper_speech import speech_to_text
from audio_record import record_audio

DATASET = "braille/dataset"
letters = [f for f in os.listdir(DATASET) if not f.startswith('.')]
letters.sort()

index = 0

def run_braille():
    global index

    # record + predict
    record_audio()
    spoken = speech_to_text("braille/user_audio.wav")

    correct = letters[index]

    if correct.lower() in spoken.lower():
        index += 1
        return {"status": "correct", "letter": correct}
    else:
        return {"status": "wrong", "letter": correct}