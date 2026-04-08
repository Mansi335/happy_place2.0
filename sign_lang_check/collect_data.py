import cv2
import mediapipe as mp
import numpy as np
import os

actions = ['Hello', 'ThankYou', 'GoodMorning', 'Sorry', 'HowAreYou']
DATA_PATH = 'dataset'
no_sequences = 5
sequence_length = 30

mp_hands = mp.solutions.hands
hands = mp_hands.Hands()
mp_draw = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0)

for action in actions:
    os.makedirs(os.path.join(DATA_PATH, action), exist_ok=True)

for action in actions:
    for sequence in range(no_sequences):
        frames = []
        print(f'Collecting {action} sequence {sequence}')
        
        while len(frames) < sequence_length:
            ret, frame = cap.read()
            if not ret:
                print("Camera not working")
                break

            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(image)

            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
                    
                    landmarks = []
                    for lm in hand_landmarks.landmark:
                        landmarks.append(lm.x)
                        landmarks.append(lm.y)
                    
                    frames.append(landmarks)

            cv2.putText(frame, f'Collecting {action}', (10,50),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)

            cv2.imshow('Collect Data', frame)

            if cv2.waitKey(10) & 0xFF == ord('q'):
                break
        
        np.save(os.path.join(DATA_PATH, action, str(sequence)), frames)

cap.release()
cv2.destroyAllWindows()