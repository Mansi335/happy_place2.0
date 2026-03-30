import pygame
import os

pygame.mixer.init()

def play_sound(file_path):
    if os.path.exists(file_path):
        pygame.mixer.music.load(file_path)
        pygame.mixer.music.play()
    else:
        print(f"Error: Sound file not found at {file_path}")
