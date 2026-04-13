import cv2
import mediapipe as mp
import numpy as np
import os

# 🔥 suppress logs (optional)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

actions = ['Hello', 'ThankYou', 'GoodMorning', 'Sorry', 'HowAreYou']
DATA_PATH = 'dataset'
no_sequences = 5
sequence_length = 30

# 🔥 MediaPipe setup (STABLE)
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=True,   # IMPORTANT FIX
    max_num_hands=1,
    model_complexity=0,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)

mp_draw = mp.solutions.drawing_utils

# 🔥 Mac camera fix
cap = cv2.VideoCapture(0, cv2.CAP_AVFOUNDATION)

# create folders
for action in actions:
    os.makedirs(os.path.join(DATA_PATH, action), exist_ok=True)

# start collecting
for action in actions:
    for sequence in range(no_sequences):
        frames = []
        print(f'Collecting {action} sequence {sequence}')

        while len(frames) < sequence_length:
            ret, frame = cap.read()

            if not ret:
                print("Camera not working")
                break

            frame = cv2.flip(frame, 1)

            # 🔥 IMPORTANT FIX (NO cvtColor)
            image = frame

            results = hands.process(image)

            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    mp_draw.draw_landmarks(
                        frame, hand_landmarks, mp_hands.HAND_CONNECTIONS
                    )

                    landmarks = []
                    for lm in hand_landmarks.landmark:
                        landmarks.append(lm.x)
                        landmarks.append(lm.y)

                    frames.append(landmarks)

            # UI text
            cv2.putText(frame, f'Collecting {action}', (10,50),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)

            cv2.putText(frame, f'Frame: {len(frames)}/{sequence_length}', (10,90),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 2)

            cv2.imshow('Collect Data', frame)

            if cv2.waitKey(10) & 0xFF == ord('q'):
                break

        # save data
        np.save(os.path.join(DATA_PATH, action, str(sequence)), frames)

cap.release()
cv2.destroyAllWindows()