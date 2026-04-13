import tkinter as tk
from audio_player import play_sound
from questions import get_questions

questions = get_questions()
q_index = 0
score = 0

def play():
    play_sound(questions[q_index]["sound"])

def check(ans):
    global score
    correct = questions[q_index]["correct"]
    if ans == correct:
        score += 1
        result.config(text="Correct", fg="green")
    else:
        result.config(text=f"Wrong! Correct: {correct}", fg="red")

def next_q():
    global q_index
    q_index += 1
    if q_index >= len(questions):
        result.config(text=f"Game Over! Score: {score}")
        return
    load_q()

def load_q():
    q = questions[q_index]
    btn1.config(text=q["options"][0])
    btn2.config(text=q["options"][1])
    result.config(text="")

root = tk.Tk()
root.title("Sound Game")
root.geometry("400x300")

play_btn = tk.Button(root, text="Play Sound", command=play)
play_btn.pack(pady=20)

btn1 = tk.Button(root, text="", command=lambda: check(btn1["text"]))
btn1.pack(pady=10)

btn2 = tk.Button(root, text="", command=lambda: check(btn2["text"]))
btn2.pack(pady=10)

result = tk.Label(root, text="")
result.pack(pady=20)

next_btn = tk.Button(root, text="Next", command=next_q)
next_btn.pack()

load_q()

root.mainloop()