import tkinter as tk
from PIL import Image, ImageTk
from audio_player import play_sound
from braille_data import braille_map

root = tk.Tk()
root.title("Braille Learning App")
root.geometry("600x500")

title = tk.Label(root, text="Click Braille to Hear Sound", font=("Arial", 16))
title.pack(pady=20)

frame = tk.Frame(root)
frame.pack()

images = {}

def on_click(letter):
    sound_path = braille_map[letter]["sound"]
    play_sound(sound_path)

row = 0
col = 0

for letter in braille_map:
    img_path = braille_map[letter]["image"]
    img = Image.open(img_path)
    img = img.resize((100, 100))
    photo = ImageTk.PhotoImage(img)

    images[letter] = photo

    btn = tk.Button(frame, image=photo, command=lambda l=letter: on_click(l))
    btn.grid(row=row, column=col, padx=10, pady=10)

    label = tk.Label(frame, text=letter)
    label.grid(row=row+1, column=col)

    col += 1
    if col == 5:
        col = 0
        row += 2

root.mainloop()