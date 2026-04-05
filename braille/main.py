import tkinter as tk
from PIL import Image, ImageTk
import os
from whisper_speech import speech_to_text
from audio_record import record_audio

DATASET = "dataset"
letters = [f for f in os.listdir(DATASET) if not f.startswith('.')]
letters.sort()
index = 0

def next_letter():
    global index
    index += 1
    if index >= len(letters):
        result_label.config(text="You completed all letters!")
        return
    load_letter()

def check_speech():
    record_audio()
    spoken = speech_to_text("user_audio.wav")
    correct = letters[index]

    if correct in spoken:
        result_label.config(text="Correct! Moving to next letter.")
        next_letter()
    else:
        result_label.config(text="Wrong! Try again.")

def load_letter():
    letter = letters[index]
    img_path = os.path.join(DATASET, letter, "image.png")

    img = Image.open(img_path)
    img = img.resize((200,200))
    photo = ImageTk.PhotoImage(img)

    panel.config(image=photo)
    panel.image = photo
    letter_label.config(text=f"Alphabet: {letter}")

root = tk.Tk()
root.title("Braille Speech Learning")
root.geometry("400x400")

panel = tk.Label(root)
panel.pack(pady=20)

letter_label = tk.Label(root, text="", font=("Arial", 16))
letter_label.pack()

speak_btn = tk.Button(root, text="Speak Letter", command=check_speech)
speak_btn.pack(pady=20)

result_label = tk.Label(root, text="", font=("Arial", 12))
result_label.pack()

load_letter()

root.mainloop()