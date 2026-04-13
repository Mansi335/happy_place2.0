import cv2
import mediapipe as mp
import pyttsx3

engine = pyttsx3.init()

mp_hands = mp.solutions.hands
hands = mp_hands.Hands()
mp_draw = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

if not cap.isOpened():
    print("❌ Cannot open camera")
    exit()

while True:
    ret, frame = cap.read()

    if not ret:
        print("❌ Failed to grab frame")
        break

    frame = cv2.flip(frame, 1)

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = hands.process(rgb)

    text_output = ""

    if result.multi_hand_landmarks:
        for hand_landmarks in result.multi_hand_landmarks:
            mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
            text_output = "Hello"

    cv2.putText(frame, text_output, (10, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)

    if text_output:
        engine.say(text_output)
        engine.runAndWait()

    cv2.imshow("Sign Language Translator", frame)

    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
engine.stop()