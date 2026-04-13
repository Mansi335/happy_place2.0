import cv2
import mediapipe as mp
import os

# 🔥 suppress logs (optional)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

# Initialize camera (Mac fix)
cap = cv2.VideoCapture(0, cv2.CAP_AVFOUNDATION)

# 🔥 MediaPipe setup (STABLE VERSION)
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=True,   # IMPORTANT FIX
    max_num_hands=1,
    model_complexity=0,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)

mp_draw = mp.solutions.drawing_utils

# Object initial position
obj_x, obj_y = 200, 200
dragging = False

# Basket area
basket_x1, basket_y1 = 400, 250
basket_x2, basket_y2 = 600, 450

while True:
    ret, frame = cap.read()
    if not ret:
        print("Camera not working")
        break

    frame = cv2.flip(frame, 1)

    # 🔥 IMPORTANT FIX (no cvtColor)
    rgb = frame

    results = hands.process(rgb)

    # Hand detection
    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            mp_draw.draw_landmarks(
                frame, hand_landmarks, mp_hands.HAND_CONNECTIONS
            )

            h, w, _ = frame.shape

            # Index finger tip (landmark 8)
            x = int(hand_landmarks.landmark[8].x * w)
            y = int(hand_landmarks.landmark[8].y * h)

            # Draw finger
            cv2.circle(frame, (x, y), 10, (0, 255, 0), -1)

            # Touch detection
            if abs(x - obj_x) < 40 and abs(y - obj_y) < 40:
                dragging = True

            # Drag object
            if dragging:
                obj_x, obj_y = x, y

            # Drop condition
            if basket_x1 < obj_x < basket_x2 and basket_y1 < obj_y < basket_y2:
                cv2.putText(frame, "Dropped!", (200,100),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 3)
                dragging = False

    # Draw object
    cv2.circle(frame, (obj_x, obj_y), 30, (255, 0, 0), -1)

    # Draw basket
    cv2.rectangle(frame, (basket_x1, basket_y1),
                  (basket_x2, basket_y2), (0, 255, 0), 3)

    # Instruction
    cv2.putText(frame, "Drag object into box", (10,30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,255,255), 2)

    cv2.imshow("Drag Drop Game", frame)

    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()