import whisper

# Load Whisper model once
model = whisper.load_model("base")

def speech_to_text(audio_file):
    result = model.transcribe(audio_file)
    text = result["text"].strip().upper()
    print("You said:", text)
    return text