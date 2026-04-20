import cv2
import mediapipe as mp
import numpy as np
import os

# 🔥 suppress logs (optional)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

ACTIONS = ['Hello', 'ThankYou', 'GoodMorning', 'Sorry', 'HowAreYou']
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'dataset')
NO_SEQUENCES = 5
SEQUENCE_LENGTH = 30

# 🔥 MediaPipe setup (STABLE)
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,  # Video mode tracks hands across frames
    max_num_hands=1,
    model_complexity=1,
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6
)

mp_draw = mp.solutions.drawing_utils


def extract_landmarks(hand_landmarks):
    landmarks = []
    for lm in hand_landmarks.landmark:
        landmarks.append(lm.x)
        landmarks.append(lm.y)
    return np.array(landmarks, dtype=np.float32)


# 🔥 Mac camera fix
cap = cv2.VideoCapture(0, cv2.CAP_AVFOUNDATION)

# create folders
for action in ACTIONS:
    os.makedirs(os.path.join(DATA_PATH, action), exist_ok=True)

# start collecting
for action in ACTIONS:
    for sequence in range(NO_SEQUENCES):
        frames = []
        print(f'Collecting {action} sequence {sequence}')

        while len(frames) < SEQUENCE_LENGTH:
            ret, frame = cap.read()

            if not ret:
                print("Camera not working")
                break

            frame = cv2.flip(frame, 1)

            # MediaPipe expects RGB input for reliable landmarks
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            results = hands.process(image)

            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    mp_draw.draw_landmarks(
                        frame, hand_landmarks, mp_hands.HAND_CONNECTIONS
                    )
                    frames.append(extract_landmarks(hand_landmarks))

            # UI text
            cv2.putText(frame, f'Collecting {action}', (10,50),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)

            cv2.putText(frame, f'Frame: {len(frames)}/{SEQUENCE_LENGTH}', (10,90),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 2)

            if not results.multi_hand_landmarks:
                cv2.putText(frame, 'Show one clear hand in camera', (10,130),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,165,255), 2)

            cv2.imshow('Collect Data', frame)

            if cv2.waitKey(10) & 0xFF == ord('q'):
                break

        # save data
        if len(frames) == SEQUENCE_LENGTH:
            output = np.array(frames, dtype=np.float32)
            np.save(os.path.join(DATA_PATH, action, str(sequence)), output)
            print(f"Saved {action}/{sequence} with shape {output.shape}")
        else:
            print(f"Skipped {action}/{sequence}: incomplete sequence ({len(frames)} frames)")

cap.release()
cv2.destroyAllWindows()