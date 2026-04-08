import cv2
import torch
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration
import pyttsx3

print("🚀 Script started")

# 🔊 Initialize Text-to-Speech
engine = pyttsx3.init()

def speak(text):
    print("🔊 Speaking:", text)
    engine.say(text)
    engine.runAndWait()

# 🧠 Load Image Captioning Model
print("📦 Loading model...")
processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")
print("✅ Model loaded")

# 📷 Open Camera (FIXED for Windows)
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

if not cap.isOpened():
    print("❌ Camera not opening")
    exit()

print("✅ Camera started")
print("Press 'c' to capture | Press 'q' to quit")

while True:
    ret, frame = cap.read()

    if not ret:
        print("❌ Failed to read frame")
        break

    # Show camera feed
    cv2.imshow("Camera Feed", frame)

    key = cv2.waitKey(1) & 0xFF

    # 📸 Capture Image
    if key == ord('c'):
        print("📸 Capturing image...")

        # Convert to PIL format
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(image)

        # 🧠 Generate Caption
        inputs = processor(pil_image, return_tensors="pt")
        output = model.generate(**inputs)

        caption = processor.decode(output[0], skip_special_tokens=True)

        print("🧠 Description:", caption)

        # 🔊 Speak the caption
        speak(caption)

    # ❌ Exit
    elif key == ord('q'):
        print("👋 Exiting...")
        break

# 🔚 Cleanup
cap.release()
cv2.destroyAllWindows()
engine.stop()