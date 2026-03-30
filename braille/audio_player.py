import pygame
import os

pygame.mixer.init()

def play_sound(file_path):
    if os.path.exists(file_path):
        pygame.mixer.music.stop()
        pygame.mixer.music.load(file_path)
        pygame.mixer.music.play()
    else:
        print("Sound file not found:", file_path)